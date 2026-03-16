import { useMemo, useState } from "react";
import { Bell, CheckCircle2, Clock3, Filter, Sparkles, TriangleAlert } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { notificationToneClass, notificationsByRole } from "@/lib/demo-content";
import { useAuthStore } from "@/stores/auth-store";

const filterOptions = [
  { key: "all", label: "Todas" },
  { key: "unread", label: "Nao lidas" },
  { key: "alerts", label: "Alertas" },
] as const;

export default function NotificationsPage() {
  const { currentUser } = useAuthStore();
  const [activeFilter, setActiveFilter] = useState<(typeof filterOptions)[number]["key"]>("all");
  const notifications = useMemo(() => (currentUser ? notificationsByRole[currentUser.perfil] : []), [currentUser]);
  const filtered = useMemo(() => {
    if (activeFilter === "unread") return notifications.filter((item) => !item.read);
    if (activeFilter === "alerts") return notifications.filter((item) => item.kind === "alert");
    return notifications;
  }, [activeFilter, notifications]);

  if (!currentUser) return null;

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <AppLayout title="Notificacoes" subtitle="Atualizacoes organizadas por prioridade e horario.">
      <div className="space-y-5">
        <section className="rounded-[28px] border border-white/60 bg-card/90 p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Bell className="h-3.5 w-3.5" />
                Central de comunicacoes
              </div>
              <h2 className="text-xl font-semibold text-foreground">Mensagens recentes do ambiente</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {unreadCount} {unreadCount === 1 ? "item requer" : "itens requerem"} atencao nesta demonstracao.
              </p>
            </div>
            <div className="rounded-2xl bg-background px-3 py-2 text-right shadow-card">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Prioridade</p>
              <p className="text-lg font-semibold text-foreground">{unreadCount || "00"}</p>
            </div>
          </div>
        </section>

        <section className="flex gap-2 overflow-x-auto pb-1">
          {filterOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setActiveFilter(option.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeFilter === option.key
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "border border-border/70 bg-card/80 text-muted-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </section>

        <section className="grid gap-3">
          {filtered.map((notification) => (
            <article
              key={notification.id}
              className={`rounded-[24px] border p-4 shadow-card ${notificationToneClass(notification.kind)}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-2xl bg-card/80 p-2 shadow-card">
                  {notification.kind === "alert" ? (
                    <TriangleAlert className="h-4 w-4 text-warning" />
                  ) : notification.kind === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{notification.title}</h3>
                    {!notification.read ? (
                      <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-background">
                        Nova
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{notification.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    {notification.time}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-[24px] border border-border/70 bg-card/90 p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Como esta area se comporta na demo</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Os alertas simulam mensagens operacionais, atualizacoes de acompanhamento e comunicados institucionais. A leitura e
            os filtros foram pensados para transmitir clareza e maturidade de produto em apresentacoes.
          </p>
        </section>
      </div>
    </AppLayout>
  );
}
