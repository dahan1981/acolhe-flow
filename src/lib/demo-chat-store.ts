import type { ChatMessage, ChatTicket, SessionUser, UserProfile } from "@/types/domain";
import { findDemoCase, getOwnLatestDemoCase } from "@/lib/demo-case-store";

const CHAT_STORAGE_KEY = "acolhe-flow-demo-chat-tickets";
const SESSION_STORAGE_KEY = "acolhe-flow-demo-session";
const CHAT_EVENT = "acolhe-flow-chat-updated";

function isBrowser() {
  return typeof window !== "undefined";
}

function nowIso() {
  return new Date().toISOString();
}

function readSessionUser() {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

function loadTickets() {
  if (!isBrowser()) return [] as ChatTicket[];
  const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as ChatTicket[];
  } catch {
    return [];
  }
}

function saveTickets(tickets: ChatTicket[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(tickets));
  window.dispatchEvent(new CustomEvent(CHAT_EVENT));
}

function systemMessage(body: string): ChatMessage {
  return {
    id: `chat-msg-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    senderProfile: "sistema",
    senderName: "Sistema",
    body,
    createdAt: nowIso(),
  };
}

function touchTicket(ticket: ChatTicket) {
  return { ...ticket, updatedAt: nowIso() };
}

export function subscribeDemoChatStore(listener: () => void) {
  if (!isBrowser()) return () => undefined;
  const handler = () => listener();
  window.addEventListener(CHAT_EVENT, handler);
  return () => window.removeEventListener(CHAT_EVENT, handler);
}

export function getChatTicketsForCurrentUser() {
  const user = readSessionUser();
  if (!user) return [];

  const tickets = loadTickets().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  if (user.perfil === "mulher") {
    return tickets.filter((ticket) => ticket.ownerEmail === user.email);
  }

  return tickets;
}

export function getChatTicketById(ticketId: string) {
  return loadTickets().find((ticket) => ticket.id === ticketId) ?? null;
}

export function createOrGetSupportChat(context?: string) {
  const user = readSessionUser();
  if (!user || user.perfil !== "mulher") {
    throw new Error("Sessao indisponivel para abrir o chat.");
  }

  const tickets = loadTickets();
  const existing = tickets.find(
    (ticket) => ticket.ownerEmail === user.email && ticket.queue === "assistencia_social" && ticket.status !== "encerrado",
  );

  if (existing) {
    return existing;
  }

  const latestCase = getOwnLatestDemoCase();
  const createdAt = nowIso();
  const welcome = systemMessage(
    "Seu chamado foi registrado. Uma assistente social de plantao podera assumir a conversa assim que houver disponibilidade.",
  );

  const nextTicket: ChatTicket = {
    id: `chat-ticket-${Date.now()}`,
    caseId: latestCase?.id ?? null,
    ownerUserId: user.id,
    ownerEmail: user.email,
    ownerName: user.nome,
    protocolo: latestCase?.protocolo ?? null,
    channel: "chat_protegido",
    status: "aguardando_assuncao",
    queue: "assistencia_social",
    assunto: "Atendimento especializado",
    context: context?.trim() || "Solicitacao de acolhimento com atendimento especializado.",
    assignedProfessionalName: null,
    assignedProfessionalUserId: null,
    createdAt,
    updatedAt: createdAt,
    unreadForWoman: 1,
    unreadForTeam: 1,
    messages: [welcome],
  };

  saveTickets([nextTicket, ...tickets]);
  return nextTicket;
}

export function sendChatMessage(ticketId: string, body: string) {
  const user = readSessionUser();
  if (!user) {
    throw new Error("Sessao indisponivel para enviar mensagem.");
  }

  const tickets = loadTickets();
  const index = tickets.findIndex((ticket) => ticket.id === ticketId);
  if (index < 0) {
    throw new Error("Chamado de chat nao encontrado.");
  }

  const message: ChatMessage = {
    id: `chat-msg-${Date.now()}`,
    senderProfile: user.perfil,
    senderName: user.nome,
    body: body.trim(),
    createdAt: nowIso(),
  };

  const target = tickets[index];
  const next = touchTicket({
    ...target,
    status: target.assignedProfessionalUserId ? "em_atendimento" : target.status,
    unreadForWoman: user.perfil === "mulher" ? 0 : target.unreadForWoman + 1,
    unreadForTeam: user.perfil === "mulher" ? target.unreadForTeam + 1 : 0,
    messages: [...target.messages, message],
  });

  tickets[index] = next;
  saveTickets(tickets);
  return next;
}

export function assumeChatTicket(ticketId: string) {
  const user = readSessionUser();
  if (!user || user.perfil !== "profissional") {
    throw new Error("Somente profissionais podem assumir este chat.");
  }

  const tickets = loadTickets();
  const index = tickets.findIndex((ticket) => ticket.id === ticketId);
  if (index < 0) {
    throw new Error("Chamado de chat nao encontrado.");
  }

  const ticket = tickets[index];
  if (ticket.assignedProfessionalUserId && ticket.assignedProfessionalUserId !== user.id) {
    throw new Error("Este chat ja foi assumido por outra profissional.");
  }

  const system = systemMessage(`${user.nome} assumiu o atendimento e esta acompanhando esta conversa.`);
  const next = touchTicket({
    ...ticket,
    status: "em_atendimento",
    assignedProfessionalName: user.nome,
    assignedProfessionalUserId: user.id,
    unreadForWoman: ticket.unreadForWoman + 1,
    unreadForTeam: 0,
    messages: [...ticket.messages, system],
  });

  tickets[index] = next;
  saveTickets(tickets);
  return next;
}

export function markChatAsRead(ticketId: string, profile: UserProfile) {
  const tickets = loadTickets();
  const index = tickets.findIndex((ticket) => ticket.id === ticketId);
  if (index < 0) return null;

  const ticket = tickets[index];
  const next = touchTicket({
    ...ticket,
    unreadForWoman: profile === "mulher" ? 0 : ticket.unreadForWoman,
    unreadForTeam: profile === "mulher" ? ticket.unreadForTeam : 0,
  });

  tickets[index] = next;
  saveTickets(tickets);
  return next;
}

export function closeChatTicket(ticketId: string) {
  const tickets = loadTickets();
  const index = tickets.findIndex((ticket) => ticket.id === ticketId);
  if (index < 0) {
    throw new Error("Chamado de chat nao encontrado.");
  }

  const ticket = tickets[index];
  const closingMessage = systemMessage("Atendimento encerrado. Caso precise, um novo chamado podera ser aberto a qualquer momento.");
  const next = touchTicket({
    ...ticket,
    status: "encerrado",
    unreadForWoman: ticket.unreadForWoman + 1,
    unreadForTeam: 0,
    messages: [...ticket.messages, closingMessage],
  });

  tickets[index] = next;
  saveTickets(tickets);
  return next;
}

export function getLinkedCaseName(ticket: ChatTicket) {
  if (ticket.caseId) {
    const linked = findDemoCase(ticket.caseId);
    if (linked) return linked.nomeSocial || linked.nomeCompleto;
  }

  return ticket.ownerName;
}
