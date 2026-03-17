import { useEffect, useMemo, useState } from "react";
import { MessageCircleHeart, Send, ShieldCheck, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  assumeChatTicket,
  closeChatTicket,
  createOrGetSupportChat,
  getChatTicketById,
  getChatTicketsForCurrentUser,
  getLinkedCaseName,
  markChatAsRead,
  sendChatMessage,
  subscribeDemoChatStore,
} from "@/lib/demo-chat-store";
import { getOrganizationName } from "@/lib/domain";
import { useAuthStore } from "@/stores/auth-store";

export default function ChatPage() {
  const { currentUser } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState(() => getChatTicketsForCurrentUser(currentUser ?? null));
  const [selectedId, setSelectedId] = useState<string | null>(tickets[0]?.id ?? null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    function sync() {
      const next = getChatTicketsForCurrentUser(currentUser ?? null);
      setTickets(next);
      setSelectedId((current) => current ?? next[0]?.id ?? null);
    }

    sync();
    return subscribeDemoChatStore(sync);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !selectedId) return;
    markChatAsRead(selectedId, currentUser.perfil);
  }, [currentUser, selectedId]);

  useEffect(() => {
    if (currentUser?.perfil !== "mulher") return;
    if (searchParams.get("start") !== "1") return;

    try {
      const ticket = createOrGetSupportChat(currentUser, "Solicitacao aberta a partir de atendimento especializado.");
      setSelectedId(ticket.id);
      setTickets(getChatTicketsForCurrentUser(currentUser));
    } catch {
      // noop
    } finally {
      setSearchParams({}, { replace: true });
    }
  }, [currentUser, searchParams, setSearchParams]);

  const selectedTicket = useMemo(() => (selectedId ? getChatTicketById(selectedId) : null), [selectedId]);

  if (!currentUser) return null;

  const isWoman = currentUser.perfil === "mulher";
  const canActInternally = currentUser.perfil === "profissional" || currentUser.perfil === "gestora";
  const canMonitor = currentUser.perfil === "gestora";

  function refreshTickets() {
    setTickets(getChatTicketsForCurrentUser(currentUser ?? null));
  }

  function openSupportChat() {
    try {
      const ticket = createOrGetSupportChat(currentUser, "Solicitacao aberta a partir de atendimento especializado.");
      setSelectedId(ticket.id);
      refreshTickets();
      toast.success("Canal de chat protegido aberto com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel abrir o chat.");
    }
  }

  function handleSendMessage() {
    if (!selectedId || !message.trim()) return;

    try {
      sendChatMessage(currentUser, selectedId, message);
      setMessage("");
      refreshTickets();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel enviar a mensagem.");
    }
  }

  function handleAssume() {
    if (!selectedId) return;

    try {
      assumeChatTicket(currentUser, selectedId);
      refreshTickets();
      toast.success("Chat assumido pela conta interna responsavel.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel assumir o chat.");
    }
  }

  function handleClose() {
    if (!selectedId) return;

    try {
      closeChatTicket(selectedId);
      refreshTickets();
      toast.success("Chat encerrado com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel encerrar o chat.");
    }
  }

  return (
    <AppLayout
      title={isWoman ? "Chat protegido" : canMonitor ? "Monitoramento de chat" : "Fila de chat protegido"}
      subtitle={
        isWoman
          ? "Abra um chamado de atendimento especializado e acompanhe a conversa com a equipe responsavel."
          : canMonitor
            ? "Acompanhe chamados ativos, status de assuncao e volume da fila de chat."
            : "Assuma chamados pendentes e conduza o atendimento especializado em tempo real."
      }
    >
      <div className="space-y-4">
        <section className="rounded-[26px] border border-primary/15 bg-card/95 p-5 shadow-card">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Atendimento especializado
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {isWoman ? "Canal seguro com assistencia social" : "Fila de chamados com triagem humana"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isWoman
              ? "Use este canal quando precisar de orientacao psicossocial, juridica ou intersetorial com acolhimento rapido."
              : "Os chamados abaixo podem ser assumidos por contas internas ativas para resposta rapida e encaminhamento seguro."}
          </p>
          {isWoman ? (
            <button
              onClick={openSupportChat}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground shadow-card transition-all hover:shadow-card-hover"
            >
              <MessageCircleHeart className="h-4 w-4" />
              {tickets.length ? "Abrir conversa em andamento" : "Iniciar atendimento especializado"}
            </button>
          ) : null}
        </section>

        <section className="space-y-3">
          {tickets.length ? (
            tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => setSelectedId(ticket.id)}
                className={`w-full rounded-[24px] border p-4 text-left shadow-card transition-all ${
                  selectedId === ticket.id ? "border-primary/30 bg-primary/5" : "border-border/70 bg-card/90"
                }`}
              >
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 text-sm font-semibold text-foreground">{getLinkedCaseName(ticket)}</p>
                  <span className="shrink-0 rounded-full bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {ticket.status === "aguardando_assuncao"
                      ? "Aguardando assuncao"
                      : ticket.status === "em_atendimento"
                        ? "Em atendimento"
                        : "Encerrado"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {ticket.protocolo ? `Protocolo ${ticket.protocolo}` : "Sem protocolo vinculado"} • {ticket.assunto}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{ticket.context}</p>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>{new Date(ticket.updatedAt).toLocaleString("pt-BR")}</span>
                  <span>{isWoman ? `${ticket.unreadForWoman} nova(s)` : `${ticket.unreadForTeam} pendencia(s)`}</span>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-border/70 bg-card/80 p-5 text-sm text-muted-foreground">
              {isWoman
                ? "Nenhum chat aberto no momento. Inicie um atendimento especializado para falar com a assistencia social."
                : "Nenhum chamado de chat esta aguardando atendimento neste momento."}
            </div>
          )}
        </section>

        <section className="rounded-[26px] border border-border/70 bg-card/95 p-4 shadow-card">
          {selectedTicket ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{getLinkedCaseName(selectedTicket)}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedTicket.protocolo ? `Protocolo ${selectedTicket.protocolo}` : "Caso em abertura"} • fila de assistencia social
                  </p>
                </div>
                <div className="max-w-full text-left text-xs text-muted-foreground">
                  <p>{selectedTicket.assignedProfessionalName ? "Assumido por" : "Sem responsavel"}</p>
                  <p className="font-medium text-foreground">
                    {selectedTicket.assignedProfessionalName || (canMonitor ? "Aguardando equipe" : "Aguardando assuncao")}
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] bg-background px-4 py-3 text-sm text-muted-foreground">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Contexto do chamado</p>
                {selectedTicket.context}
              </div>

              {(canActInternally || canMonitor) && selectedTicket.caseId ? (
                <div className="rounded-[24px] bg-background px-4 py-3 text-sm text-muted-foreground">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Vinculo operacional</p>
                  Caso conectado ao fluxo principal da rede. O historico continua acessivel no detalhe do caso e no orgao atual: {getOrganizationName("sec-mulher")}.
                </div>
              ) : null}

              <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-[24px] bg-background p-3">
                {selectedTicket.messages.map((item) => {
                  const isOwn =
                    (currentUser.perfil === "mulher" && item.senderProfile === "mulher") ||
                    (canActInternally && (item.senderProfile === "profissional" || item.senderProfile === "gestora"));
                  const isSystem = item.senderProfile === "sistema";

                  return (
                    <div key={item.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[88%] break-words rounded-[22px] px-4 py-3 text-sm shadow-card ${
                          isSystem
                            ? "bg-muted text-muted-foreground"
                            : isOwn
                              ? "bg-primary text-primary-foreground"
                              : "border border-border/70 bg-card text-foreground"
                        }`}
                      >
                        <p className="mb-1 text-[11px] font-medium opacity-80">{item.senderName}</p>
                        <p>{item.body}</p>
                        <p className="mt-2 text-[11px] opacity-70">{new Date(item.createdAt).toLocaleString("pt-BR")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                {canActInternally && selectedTicket.status === "aguardando_assuncao" ? (
                  <button
                    onClick={handleAssume}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-card"
                  >
                    <UserRoundCheck className="h-4 w-4" />
                    Assumir como conta interna
                  </button>
                ) : null}

                {selectedTicket.status !== "encerrado" && (isWoman || canActInternally) ? (
                  <div className="flex gap-2">
                    <textarea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      rows={2}
                      placeholder={isWoman ? "Escreva sua mensagem para a equipe..." : "Responder atendimento..."}
                      className="min-h-[72px] min-w-0 flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary resize-none"
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={!message.trim()}
                      className="flex h-[72px] w-[64px] shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-card disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}

                {canActInternally && selectedTicket.status !== "encerrado" ? (
                  <button
                    onClick={handleClose}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground"
                  >
                    Encerrar atendimento
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-border/70 bg-background p-8 text-center text-sm text-muted-foreground">
              Selecione um chamado para visualizar a conversa e o historico de atendimento.
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
