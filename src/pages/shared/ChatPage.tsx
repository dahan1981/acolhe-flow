import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, MessageCircleHeart, RefreshCw, Search, Send, ShieldCheck, UserRoundCheck, ShieldAlert, BadgeInfo } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { getOrganizationName } from "@/lib/domain";
import { useAuthStore } from "@/stores/auth-store";
import type { ChatStatus, ChatTicket } from "@/types/domain";

function getChatPageTitle(isWoman: boolean, canMonitor: boolean) {
  if (isWoman) return "Centro de Apoio Seguro";
  return canMonitor ? "Monitoramento de Chats" : "Inbox de Atendimento";
}

function getChatPageSubtitle(isWoman: boolean, canMonitor: boolean) {
  if (isWoman) {
    return "Sua linha direta com a rede protetiva. Tudo aqui tem sigilo garantido.";
  }
  return canMonitor
    ? "Visualize o tempo de resposta e o escoamento de conversas ativas."
    : "Assuma e responda conversas de suporte em andamento.";
}

function getTicketStatusLabel(status: ChatStatus) {
  if (status === "aguardando_assuncao") return "Aguardando agente";
  if (status === "em_atendimento") return "Em atendimento";
  return "Protocolo Fechado";
}

function getConnectionLabel(status: "connecting" | "connected" | "reconnecting" | "disabled") {
  if (status === "disabled") return "Atualização periódica ativa";
  if (status === "connected") return "Canal seguro ativo";
  if (status === "reconnecting") return "Restabelecendo conexão...";
  return "Conectando canal seguro...";
}

// Framer motion variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", bounce: 0, duration: 0.4 } }
};

export default function ChatPage() {
  const { currentUser } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"todos" | ChatStatus>("todos");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const realtimeEnabled =
    typeof window !== "undefined" &&
    import.meta.env.VITE_DISABLE_REALTIME !== "true" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const [socketStatus, setSocketStatus] = useState<"connecting" | "connected" | "reconnecting" | "disabled">(
    realtimeEnabled ? "connecting" : "disabled",
  );
  const [lastSyncAt, setLastSyncAt] = useState(() => new Date());
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);

  const isWoman = currentUser?.perfil === "mulher";
  const canActInternally = currentUser?.perfil === "profissional" || currentUser?.perfil === "gestora";
  const canMonitor = currentUser?.perfil === "gestora";

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["chat-tickets", currentUser?.id],
    queryFn: api.getChats,
    enabled: !!currentUser,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const tickets = useMemo(() => data?.chats ?? [], [data?.chats]);
  const filteredTickets = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === "todos" || ticket.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        ticket.ownerName.toLowerCase().includes(normalizedSearch) ||
        ticket.ownerEmail.toLowerCase().includes(normalizedSearch) ||
        (ticket.protocolo ?? "").toLowerCase().includes(normalizedSearch) ||
        ticket.assunto.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [search, statusFilter, tickets]);

  const selectedTicket = useMemo(
    () => (selectedId ? filteredTickets.find((ticket) => ticket.id === selectedId) ?? null : filteredTickets[0] ?? null),
    [filteredTickets, selectedId],
  );

  useEffect(() => {
    setSelectedId((current) =>
      current && filteredTickets.some((ticket) => ticket.id === current) ? current : filteredTickets[0]?.id ?? null,
    );
    setLastSyncAt(new Date());
  }, [filteredTickets]);

  useEffect(() => {
    if (!selectedTicket || !messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [selectedTicket]);

  useEffect(() => {
    if (!currentUser || !realtimeEnabled) {
      setSocketStatus("disabled");
      return;
    }

    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let closedByEffect = false;

    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      socket = new WebSocket(`${protocol}//${window.location.host}/ws`);
      setSocketStatus("connecting");

      socket.addEventListener("open", () => {
        setSocketStatus("connected");
      });

      socket.addEventListener("message", (event) => {
        const payload = JSON.parse(event.data) as { type?: string };
        if (payload.type === "chat.updated") {
          setLastSyncAt(new Date());
          queryClient.invalidateQueries({ queryKey: ["chat-tickets", currentUser.id] });
        }
      });

      socket.addEventListener("close", () => {
        if (closedByEffect) return;
        setSocketStatus("reconnecting");
        reconnectTimer = window.setTimeout(connect, 2000);
      });
    };

    connect();

    return () => {
      closedByEffect = true;
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      socket?.close();
    };
  }, [currentUser, queryClient, realtimeEnabled]);

  const refreshChats = async () => {
    setLastSyncAt(new Date());
    await queryClient.invalidateQueries({ queryKey: ["chat-tickets", currentUser?.id] });
  };

  const createChatMutation = useMutation({
    mutationFn: (context?: string) => api.createChat(context),
    onSuccess: async ({ chat }) => {
      await refreshChats();
      setSelectedId(chat.id);
      toast.success("Canal seguro aberto. A equipe foi acionada.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Não foi possível abrir o chat agora.");
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => api.sendChatMessage(id, body),
    onSuccess: async ({ chat }) => {
      setMessage("");
      setPendingMessageId(null);
      await refreshChats();
      setSelectedId(chat.id);
    },
    onError: (error) => {
      setPendingMessageId(null);
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a mensagem.");
    },
  });

  const assumeMutation = useMutation({
    mutationFn: (id: string) => api.assumeChat(id),
    onSuccess: async ({ chat }) => {
      await refreshChats();
      setSelectedId(chat.id);
      toast.success("Atendimento atribuído à sua conta.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Não foi possível assumir este chat.");
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => api.closeChat(id),
    onSuccess: async ({ chat }) => {
      await refreshChats();
      setSelectedId(chat.id);
      toast.success("Chat encerrado e registrado no histórico.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Não foi possível encerrar o chat.");
    },
  });

  useEffect(() => {
    if (!currentUser || currentUser.perfil !== "mulher") return;
    if (searchParams.get("start") !== "1") return;

    createChatMutation.mutate("Solicitação aberta a partir da Central de Apoio.");
    setSearchParams({}, { replace: true });
  }, [createChatMutation, currentUser, searchParams, setSearchParams]);

  if (!currentUser) return null;

  function openSupportChat() {
    createChatMutation.mutate("Solicitação iniciada pela própria usuária no chat.");
  }

  function handleSendMessage() {
    if (!selectedTicket || !message.trim()) return;
    setPendingMessageId(selectedTicket.id);
    sendMessageMutation.mutate({ id: selectedTicket.id, body: message.trim() });
  }

  function handleAssume() {
    if (!selectedTicket) return;
    assumeMutation.mutate(selectedTicket.id);
  }

  function handleClose() {
    if (!selectedTicket) return;
    closeMutation.mutate(selectedTicket.id);
  }

  function handleMessageKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    handleSendMessage();
  }

  function getUnreadLabel(ticket: ChatTicket) {
    return isWoman ? `${ticket.unreadForWoman} nova(s)` : `${ticket.unreadForTeam} pendência(s)`;
  }

  const queueSummary = {
    total: tickets.length,
    aguardando: tickets.filter((ticket) => ticket.status === "aguardando_assuncao").length,
    ativos: tickets.filter((ticket) => ticket.status === "em_atendimento").length,
    encerrados: tickets.filter((ticket) => ticket.status === "encerrado").length,
  };

  const queueCards = [
    { label: "Pipeline Total", value: queueSummary.total },
    { label: "Sinal Verde (Livres)", value: queueSummary.aguardando },
    { label: "Alocados", value: queueSummary.ativos },
  ];

  return (
    <AppLayout title={getChatPageTitle(!!isWoman, !!canMonitor)} subtitle={getChatPageSubtitle(!!isWoman, !!canMonitor)}>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-20">
        
        {/* Connection Status Hero */}
        <motion.section variants={itemVariants} className="glass-panel overflow-hidden p-6 relative">
          <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/20 blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col gap-2">
            <div className="inline-flex max-w-fit items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Canal protegido
            </div>
            
            <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 rounded-2xl bg-card border border-border/50 px-3 py-2 text-xs font-semibold text-foreground w-fit shadow-sm">
                <span className={`relative flex h-3 w-3`}>
                  {socketStatus === "connected" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${
                    socketStatus === "connected" ? "bg-emerald-500" : socketStatus === "disabled" ? "bg-sky-500" : "bg-amber-500"
                  }`}></span>
                </span>
                {getConnectionLabel(socketStatus)}
              </div>
              
              <button
                type="button"
                onClick={refreshChats}
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-[11px] font-bold text-muted-foreground shadow-sm hover:bg-card/90 hover:text-foreground transition-all w-fit"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
                Atualizar
              </button>
            </div>
            <p className="mt-2 text-xs opacity-60 text-muted-foreground">Log de varredura: {lastSyncAt.toLocaleTimeString("pt-BR")}</p>

            {isWoman ? (
              <motion.button
                whileTap={!createChatMutation.isPending ? { scale: 0.98 } : {}}
                onClick={openSupportChat}
                disabled={createChatMutation.isPending}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-4 py-4 text-sm font-bold text-background shadow-xl shadow-foreground/10 transition-all hover:bg-foreground/90 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <ShieldAlert className="h-4.5 w-4.5 text-background" />
                {tickets.length ? "Abrir Outra Linha" : "Abrir Linha Segura com Agente"}
              </motion.button>
            ) : null}
          </div>
        </motion.section>

        {!isWoman && (
          <motion.section variants={itemVariants} className="grid grid-cols-3 gap-3">
            {queueCards.map((card) => (
              <div key={card.label} className="glass-panel items-center justify-center text-center p-4">
                <p className="font-display text-[9px] font-bold uppercase tracking-widest text-muted-foreground/80">{card.label}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-foreground tabular-nums">{card.value}</p>
              </div>
            ))}
          </motion.section>
        )}

        <motion.section variants={itemVariants} className="space-y-4">
           {/* Filters */}
          <div className="glass-panel p-4 flex flex-col gap-4 sticky top-4 z-40">
             <div className="relative">
               <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
               <input
                 value={search}
                 onChange={(event) => setSearch(event.target.value)}
                 placeholder={isWoman ? "Buscar nas minhas conversas..." : "Buscar chamados em aberto..."}
                 className="glass-input w-full rounded-full pl-11 pr-4 py-3 text-sm"
               />
             </div>
             
             <div className="flex flex-wrap gap-2 px-1">
               {([
                  { value: "todos", label: "Geral" },
                  { value: "aguardando_assuncao", label: "Livres" },
                  { value: "em_atendimento", label: "Operantes" },
                  { value: "encerrado", label: "Fechados" },
                ] as const).map((option) => {
                  const isActive = statusFilter === option.value;
                  return (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      key={option.value}
                      type="button"
                      onClick={() => setStatusFilter(option.value)}
                      className={`relative rounded-full px-4 py-2 text-xs font-bold transition-all ${
                        isActive
                          ? "bg-foreground text-background shadow-md shadow-foreground/20"
                          : "border-border/60 bg-transparent text-muted-foreground hover:bg-card/80"
                      }`}
                    >
                      {option.label}
                    </motion.button>
                  );
                })}
             </div>
          </div>

          {/* List or Active Chat */}
          {isLoading ? (
             <div className="flex h-32 items-center justify-center rounded-3xl border border-dashed border-border/70 bg-card/60">
               <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground/40" />
             </div>
          ) : (
            <div className="flex flex-col gap-4 h-[60vh]">
               {/* List of Tickets / Sidebar */}
               <div className={`flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar pb-10 ${selectedTicket ? 'hidden' : 'flex'}`}>
                 {filteredTickets.map((ticket) => {
                   const isActive = selectedTicket?.id === ticket.id;
                   return (
                     <motion.button
                       whileTap={{ scale: 0.98 }}
                       key={ticket.id}
                       onClick={() => setSelectedId(ticket.id)}
                       className={`flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all ${
                         isActive ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "border-border/60 bg-card/90 text-foreground hover:bg-card"
                       }`}
                     >
                       <div className="flex items-center justify-between gap-2">
                         <p className="font-display text-sm font-bold truncate">{ticket.ownerName}</p>
                         <div className="flex items-center gap-2">
                            {ticket.status === "aguardando_assuncao" && <span className={`h-2 w-2 rounded-full bg-warning animate-pulse`} />}
                            {ticket.status === "em_atendimento" && <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-primary-foreground/80' : 'bg-primary'}`} />}
                         </div>
                       </div>
                       <p className={`text-xs ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                         {ticket.protocolo ? `#${ticket.protocolo}` : "Avulso"}
                       </p>
                       <p className={`line-clamp-2 text-xs leading-relaxed ${isActive ? "text-white" : "text-muted-foreground"}`}>
                         {ticket.context || ticket.assunto}
                       </p>
                     </motion.button>
                   );
                 })}
                 {filteredTickets.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-6 text-center text-sm font-bold text-muted-foreground">
                      Nenhum ticket encontrado.
                    </div>
                 )}
               </div>

               {/* Chat Panel */}
               {selectedTicket && (
                 <div className="flex-1 glass-panel flex flex-col overflow-hidden relative">
                    {/* Return button for mobile view */}
                    <div className="absolute top-4 right-4 z-50">
                       <button onClick={() => setSelectedId(null)} className="rounded-full bg-background/80 blur-backdrop p-2 text-xs font-bold text-foreground border shadow-sm">
                         Ver Lista
                       </button>
                    </div>

                    <div className="flex flex-col gap-1 border-b border-border/40 p-5 bg-card/40">
                      <p className="font-display text-lg font-bold text-foreground tracking-tight">{selectedTicket.ownerName}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-medium">
                         <span className="text-primary font-bold">{getTicketStatusLabel(selectedTicket.status)}</span>
                         <span>•</span>
                         <span>Relato: {selectedTicket.context}</span>
                      </div>
                    </div>

                    <div ref={messageListRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-muted/5">
                      {selectedTicket.messages.length === 0 && (
                        <div className="flex h-full items-center justify-center opacity-60">
                           <div className="text-center space-y-3">
                              <BadgeInfo className="h-8 w-8 mx-auto text-muted-foreground" />
                              <p className="text-sm font-bold text-muted-foreground tracking-wide">CAIXA VAZIA</p>
                           </div>
                        </div>
                      )}
                      <AnimatePresence initial={false}>
                        {selectedTicket.messages.map((item) => {
                          const isOwn =
                            (currentUser.perfil === "mulher" && item.senderProfile === "mulher") ||
                            (canActInternally && (item.senderProfile === "profissional" || item.senderProfile === "gestora"));
                          const isSystem = item.senderProfile === "sistema";

                          return (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              key={item.id} 
                              className={`flex ${isOwn ? "justify-end" : isSystem ? "justify-center" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-[20px] px-4 py-3 text-sm shadow-sm ${
                                  isSystem
                                    ? "bg-transparent border border-muted-foreground/30 text-muted-foreground/80 text-[10px] uppercase font-bold tracking-wider"
                                    : isOwn
                                      ? "bg-primary text-white rounded-br-sm"
                                      : "bg-card border border-border/70 text-foreground rounded-bl-sm"
                                }`}
                              >
                                {!isSystem && <p className="mb-1 text-[10px] font-bold opacity-60 uppercase tracking-widest">{item.senderName}</p>}
                                <p className="leading-relaxed">{item.body}</p>
                                {!isSystem && <p className="mt-2 text-[9px] opacity-60 text-right">{new Date(item.createdAt).toLocaleTimeString("pt-BR", {hour: '2-digit', minute: '2-digit'})}</p>}
                              </div>
                            </motion.div>
                          );
                        })}
                        {pendingMessageId === selectedTicket.id && (
                          <motion.div initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}} className="flex justify-end">
                            <div className="max-w-[85%] rounded-[20px] bg-primary/40 px-4 py-3 text-sm text-foreground rounded-br-sm">
                              <p className="leading-relaxed text-transparent bg-clip-text bg-gradient-to-r from-muted-foreground to-black animate-pulse">{message}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="p-4 border-t border-border/40 bg-card/60">
                       {canActInternally && selectedTicket.status === "aguardando_assuncao" ? (
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={handleAssume}
                          disabled={assumeMutation.isPending}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-4 py-4 text-sm font-bold text-background shadow-md disabled:opacity-70"
                        >
                          <UserRoundCheck className="h-5 w-5" />
                          Me tornar agente encarregado
                        </motion.button>
                       ) : selectedTicket.status !== "encerrado" && (isWoman || canActInternally) ? (
                         <div className="flex gap-2">
                           <textarea
                             value={message}
                             onChange={(event) => setMessage(event.target.value)}
                             onKeyDown={handleMessageKeyDown}
                             rows={1}
                             placeholder="Escreva na rede Segura..."
                             className="glass-input flex-1 resize-none rounded-2xl px-4 py-3.5 text-sm"
                           />
                           <motion.button
                             whileTap={message.trim() && !sendMessageMutation.isPending ? { scale: 0.95 } : {}}
                             type="button"
                             onClick={handleSendMessage}
                             disabled={!message.trim() || sendMessageMutation.isPending}
                             className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-md disabled:opacity-50"
                           >
                              {sendMessageMutation.isPending ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                           </motion.button>
                         </div>
                       ) : selectedTicket.status === "encerrado" ? (
                          <div className="text-center rounded-[20px] bg-muted/40 p-4 border border-dashed border-border/60">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Protocolo Locked</p>
                            <p className="mt-1 text-sm text-muted-foreground">O agente fechou essa conversa. Abra um novo chat se precisar de mais suporte.</p>
                          </div>
                       ) : null}

                       {canActInternally && selectedTicket.status !== "encerrado" && selectedTicket.status !== "aguardando_assuncao" && (
                          <button
                            onClick={handleClose}
                            disabled={closeMutation.isPending}
                            className="mt-3 w-full rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs font-bold text-destructive transition-colors hover:bg-destructive hover:text-white disabled:opacity-70"
                          >
                            Encerrar Sessão de Contato
                          </button>
                       )}
                    </div>
                 </div>
               )}
            </div>
          )}
        </motion.section>
      </motion.div>
    </AppLayout>
  );
}
