import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, BellRing, CheckCircle2, Clock3, Sparkles, TriangleAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { mapAuditToNotification, mapUserNotificationToNotification } from "@/lib/audit-notifications";
import { useAuthStore } from "@/stores/auth-store";

const filterOptions = [
  { key: "all", label: "Histórico completo" },
  { key: "unread", label: "Pendências" },
  { key: "alerts", label: "Avisos críticos" },
] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.4 } },
};

export default function NotificationsPage() {
  const { currentUser } = useAuthStore();
  const [activeFilter, setActiveFilter] = useState<(typeof filterOptions)[number]["key"]>("all");
  const isWoman = currentUser?.perfil === "mulher";
  const { data, isLoading } = useQuery({
    queryKey: [isWoman ? "user-notifications" : "audit-logs", currentUser?.id],
    queryFn: () => (isWoman ? api.getMyNotifications() : api.getMyAuditLogs()),
    enabled: !!currentUser,
    refetchInterval: isWoman ? 5000 : false,
    refetchIntervalInBackground: isWoman,
  });

  const notifications = useMemo(() => {
    if (isWoman) {
      const response = data as Awaited<ReturnType<typeof api.getMyNotifications>> | undefined;
      return (response?.notifications ?? []).map(mapUserNotificationToNotification);
    }

    const response = data as Awaited<ReturnType<typeof api.getMyAuditLogs>> | undefined;
    return (response?.logs ?? []).map(mapAuditToNotification);
  }, [data, isWoman]);
  const filtered = useMemo(() => {
    if (activeFilter === "unread") return notifications.filter((item) => !item.read);
    if (activeFilter === "alerts") return notifications.filter((item) => item.kind === "alert");
    return notifications;
  }, [activeFilter, notifications]);

  if (!currentUser) return null;

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <AppLayout title="Central de Sinais" subtitle={isWoman ? "Atualizações do seu caso e do atendimento protegido." : "Registro recente das principais ações da sua conta."}>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-20">
        <motion.section variants={itemVariants} className="glass-panel relative overflow-hidden bg-gradient-to-br from-card/80 to-card/40 p-6">
          <div className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/5 opacity-50 animate-[ping_4s_ease-out_infinite]" />
          <div className="absolute right-0 top-0 h-40 w-40 -translate-y-1/3 translate-x-1/3 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                <BellRing className="h-3.5 w-3.5" />
                {isWoman ? "Atualizações da rede" : "Auditoria recente"}
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">{isWoman ? "Notificações do caso" : "Atividade da conta"}</h2>
            </div>
            <div className="flex h-16 w-16 flex-col items-center justify-center rounded-3xl bg-foreground text-background shadow-xl">
              <span className="text-2xl font-bold leading-none tracking-tighter">{unreadCount}</span>
              <span className="text-[8px] font-bold uppercase tracking-widest opacity-80">Novos</span>
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="sticky top-4 z-40">
          <div className="glass-panel flex gap-2 overflow-x-auto p-2 no-scrollbar">
            {filterOptions.map((option) => {
              const isActive = activeFilter === option.key;
              return (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  key={option.key}
                  onClick={() => setActiveFilter(option.key)}
                  className={`relative flex-1 whitespace-nowrap rounded-2xl px-4 py-3 text-xs font-bold transition-all ${
                    isActive ? "bg-foreground text-white shadow-md" : "bg-transparent text-muted-foreground hover:bg-black/5"
                  }`}
                >
                  {option.label}
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-3">
          {isLoading ? (
            <div className="glass-panel flex h-32 items-center justify-center border-dashed">
              <span className="animate-pulse text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Carregando eventos...
              </span>
            </div>
          ) : filtered.length ? (
            <AnimatePresence mode="popLayout">
              {filtered.map((notification, idx) => (
                <motion.article
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  key={notification.id}
                  className={`glass-panel relative overflow-hidden p-5 transition-all hover:bg-card ${
                    !notification.read ? "border-primary/40" : ""
                  }`}
                >
                  {notification.kind === "alert" && <div className="absolute left-0 top-0 h-full w-1 bg-warning/80" />}
                  {notification.kind === "success" && <div className="absolute left-0 top-0 h-full w-1 bg-primary/80" />}

                  <div className="flex items-start gap-4">
                    <div
                      className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-sm ${
                        notification.kind === "alert"
                          ? "border-warning/20 bg-warning/10 text-warning"
                          : notification.kind === "success"
                            ? "border-primary/20 bg-primary/10 text-primary"
                            : "border-border/50 bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      {notification.kind === "alert" ? (
                        <TriangleAlert className="h-5 w-5" />
                      ) : notification.kind === "success" ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Sparkles className="h-5 w-5" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-sm font-bold text-foreground">{notification.title}</h3>
                        {!notification.read ? (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary-foreground shadow-sm">
                            Novo
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{notification.description}</p>
                      <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">
                        <Clock3 className="h-3 w-3" />
                        {notification.time}
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          ) : (
            <motion.article variants={itemVariants} className="glass-panel border-dashed bg-card/30 p-8 text-center">
              <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="font-display text-base font-bold text-foreground">Sem novidades</p>
              <p className="mx-auto mt-2 max-w-[280px] text-sm leading-relaxed text-muted-foreground">
                As principais ações da sua conta aparecerão aqui quando houver movimentação.
              </p>
            </motion.article>
          )}
        </motion.section>
      </motion.div>
    </AppLayout>
  );
}
