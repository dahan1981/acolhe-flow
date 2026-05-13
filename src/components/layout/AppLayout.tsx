import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3,
  Bell,
  MessageCircleHeart,
  BookOpen,
  Eye,
  EyeOff,
  FileText,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  PlusCircle,
  Search,
  Settings,
  Shield,
  User,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { PanicButton } from "@/components/PanicButton";
import { AthenaMark } from "@/components/brand/AthenaMark";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { ACCOUNT_PREFERENCES_EVENT, getAccountPreferences, getDefaultAccountPreferences, type AccountPreferences } from "@/lib/account-preferences";
import { mapAuditToNotification, mapUserNotificationToNotification } from "@/lib/audit-notifications";
import { roleAccent } from "@/lib/demo-content";
import { profileLabel } from "@/lib/domain";
import type { UserProfile } from "@/types/domain";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
}

const PRIVACY_MODE_STORAGE_PREFIX = "athena-privacy-mode";
const DAILY_SUMMARY_PREFIX = "athena-daily-summary";
const PRIORITY_ALERT_PREFIX = "athena-priority-alert";

type NavItem = {
  label: string;
  icon: React.ElementType;
  path: string;
  match?: string[];
  description?: string;
};

const navItems: Record<UserProfile, NavItem[]> = {
  mulher: [
    { label: "Início", icon: Home, path: "/mulher", description: "SOS e painel" },
    { label: "Chat", icon: MessageCircleHeart, path: "/mulher/chat", description: "Atendimento" },
    { label: "Alertas", icon: Bell, path: "/mulher/notificacoes", description: "Notificações" },
    { label: "Perfil", icon: User, path: "/mulher/perfil", match: ["/mulher/perfil", "/mulher/perfil/editar", "/mulher/configuracoes"], description: "Dados da conta" },
    // secondary (appear in pills / hamburger)
    { label: "Cursos", icon: BookOpen, path: "/mulher/cursos", description: "Módulo educacional" },
    { label: "Meu caso", icon: FileText, path: "/mulher/caso", match: ["/mulher/caso", "/mulher/historico"], description: "Status do caso" },
    { label: "Ajuda", icon: Heart, path: "/mulher/ajuda", match: ["/mulher/ajuda"], description: "Registrar pedido" },
    { label: "Central", icon: Shield, path: "/mulher/central-ajuda", description: "Orientações" },
  ],
  profissional: [
    { label: "Painel", icon: LayoutDashboard, path: "/profissional", description: "Prioridades e fila" },
    { label: "Casos", icon: Search, path: "/profissional/casos", match: ["/profissional/casos", "/profissional/caso", "/profissional/historico"], description: "Protocolos e histórico" },
    { label: "Novo", icon: PlusCircle, path: "/profissional/novo-atendimento", match: ["/profissional/novo-atendimento", "/profissional/novo-encaminhamento", "/profissional/novo-protocolo"], description: "Gerar atendimento" },
    { label: "Chats", icon: MessageCircleHeart, path: "/profissional/chats", description: "Fila de chats" },
    { label: "Mapa", icon: Map, path: "/profissional/mapa", description: "Mapa da violência" },
    { label: "Alertas", icon: Bell, path: "/profissional/notificacoes", description: "Atualizações" },
    { label: "Permissões", icon: Shield, path: "/profissional/permissoes", description: "Acessos" },
    { label: "Perfil", icon: User, path: "/profissional/perfil", match: ["/profissional/perfil", "/profissional/perfil/editar", "/profissional/configuracoes", "/profissional/ajuda"], description: "Conta e config" },
  ],
  gestora: [
    { label: "Painel", icon: LayoutDashboard, path: "/gestora", description: "Visão executiva" },
    { label: "Casos", icon: Search, path: "/gestora/casos", match: ["/gestora/casos", "/gestora/caso", "/gestora/novo-atendimento", "/gestora/novo-encaminhamento", "/gestora/novo-protocolo"], description: "Rede e fluxos" },
    { label: "Chats", icon: MessageCircleHeart, path: "/gestora/chats", description: "Fila de apoio" },
    { label: "Mapa", icon: Map, path: "/gestora/mapa", description: "Mapa da violência" },
    { label: "Equipe", icon: Users, path: "/gestora/profissionais", match: ["/gestora/profissionais", "/gestora/administracao"], description: "Gestão interna" },
    { label: "Relatórios", icon: BarChart3, path: "/gestora/relatorios", description: "Indicadores" },
    { label: "Alertas", icon: Bell, path: "/gestora/notificacoes", description: "Eventos" },
    { label: "Governança", icon: Shield, path: "/gestora/permissoes", match: ["/gestora/permissoes", "/gestora/seguranca", "/gestora/ajuda", "/gestora/sobre"], description: "Políticas" },
    { label: "Config", icon: Settings, path: "/gestora/config", match: ["/gestora/config", "/gestora/configuracoes", "/gestora/perfil", "/gestora/perfil/editar"], description: "Sistema" },
  ],
};

function isItemActive(pathname: string, item: NavItem) {
  const paths = item.match ?? [item.path];
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`) || pathname.startsWith(`${path}?`));
}

function privacyStorageKey(userId: string) {
  return `${PRIVACY_MODE_STORAGE_PREFIX}:${userId}`;
}

function persistPrivacyMode(userId: string, value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(privacyStorageKey(userId), String(value));
}

export function AppLayout({ children, title, subtitle, showBack }: AppLayoutProps) {
  const { currentUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [privacyMode, setPrivacyMode] = useState(false);
  const [preferences, setPreferences] = useState<AccountPreferences>(getDefaultAccountPreferences());
  const isWoman = currentUser?.perfil === "mulher";

  const { data: auditData } = useQuery({
    queryKey: [isWoman ? "layout-user-notifications" : "layout-audit-logs", currentUser?.id],
    queryFn: () => (isWoman ? api.getMyNotifications() : api.getMyAuditLogs()),
    enabled: !!currentUser && (preferences.resumoDiario || preferences.alertaPrioridade),
    staleTime: 60_000,
    refetchInterval: preferences.alertaPrioridade ? 60_000 : false,
  });

  const items = useMemo(() => (currentUser ? navItems[currentUser.perfil] : []), [currentUser]);
  const primaryItems = items.slice(0, 4); // Always 4 items on the bottom bar like native apps
  const secondaryItems = items.slice(4);
  const notifications = useMemo(() => {
    if (isWoman) {
      const response = auditData as Awaited<ReturnType<typeof api.getMyNotifications>> | undefined;
      return (response?.notifications ?? []).map(mapUserNotificationToNotification);
    }

    const response = auditData as Awaited<ReturnType<typeof api.getMyAuditLogs>> | undefined;
    return (response?.logs ?? []).map(mapAuditToNotification);
  }, [auditData, isWoman]);

  const activeItem = useMemo(
    () => items.find((item) => isItemActive(location.pathname, item)),
    [items, location.pathname],
  );

  const accentClass = currentUser ? roleAccent(currentUser.perfil) : "";
  const secondaryLabel =
    currentUser?.perfil === "mulher"
      ? "Acessos complementares"
      : currentUser?.perfil === "profissional"
        ? "Apoio operacional"
        : "Governança e apoio";

  useEffect(() => {
    if (!currentUser) return;
    setPreferences(getAccountPreferences(currentUser.id));

    const handlePreferencesChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ userId?: string; preferences?: AccountPreferences }>;
      if (customEvent.detail?.userId !== currentUser.id || !customEvent.detail.preferences) {
        return;
      }

      setPreferences(customEvent.detail.preferences);
      setPrivacyMode((current) => {
        const next = customEvent.detail.preferences?.modoDiscreto ?? false;
        persistPrivacyMode(currentUser.id, next);
        return next;
      });
    };

    window.addEventListener(ACCOUNT_PREFERENCES_EVENT, handlePreferencesChanged as EventListener);
    return () => {
      window.removeEventListener(ACCOUNT_PREFERENCES_EVENT, handlePreferencesChanged as EventListener);
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || typeof window === "undefined") return;

    const storedValue = window.localStorage.getItem(privacyStorageKey(currentUser.id));
    if (storedValue === "true" || storedValue === "false") {
      setPrivacyMode(storedValue === "true");
      return;
    }

    setPrivacyMode(preferences.modoDiscreto);
  }, [currentUser, preferences.modoDiscreto]);

  useEffect(() => {
    if (!currentUser || !preferences.resumoDiario || !notifications.length || typeof window === "undefined") return;

    const dayKey = `${DAILY_SUMMARY_PREFIX}:${currentUser.id}:${new Date().toISOString().slice(0, 10)}`;
    if (window.localStorage.getItem(dayKey) === "shown") {
      return;
    }

    const alertCount = notifications.filter((item) => item.kind === "alert").length;
    const unreadCount = notifications.filter((item) => !item.read).length;

    toast.message("Resumo diario", {
      description:
        alertCount > 0
          ? `${unreadCount} atualizacoes recentes e ${alertCount} alerta(s) critico(s) nesta conta.`
          : `${unreadCount} atualizacoes recentes registradas nesta conta hoje.`,
    });

    window.localStorage.setItem(dayKey, "shown");
  }, [currentUser, notifications, preferences.resumoDiario]);

  useEffect(() => {
    if (!currentUser || !preferences.alertaPrioridade || !notifications.length || typeof window === "undefined") return;

    const latestAlert = notifications.find((item) => item.kind === "alert");
    if (!latestAlert) return;

    const alertKey = `${PRIORITY_ALERT_PREFIX}:${currentUser.id}`;
    if (window.localStorage.getItem(alertKey) === latestAlert.id) {
      return;
    }

    toast.warning(latestAlert.title, {
      description: latestAlert.description,
    });
    window.localStorage.setItem(alertKey, latestAlert.id);
  }, [currentUser, notifications, preferences.alertaPrioridade]);

  if (!currentUser) return null;

  function togglePrivacyMode() {
    setPrivacyMode((current) => {
      const next = !current;
      persistPrivacyMode(currentUser.id, next);
      return next;
    });
  }

  // Animation variants mapped for Framer Motion
  const pageVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.15 } }
  };

  return (
    <div className="relative mx-auto flex min-h-screen max-w-lg flex-col overflow-x-hidden bg-[#faf9fc] text-foreground">
      {/* Light Premium Ambience / Glow */}
      <div className={`pointer-events-none fixed inset-0 z-0 h-full w-full bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_0%,rgba(255,255,255,0.7)_100%)] opacity-60 mix-blend-overlay`} />
      <div className="pointer-events-none fixed left-[-10%] top-[0%] z-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
      <div className="pointer-events-none fixed right-[-10%] top-[20%] z-0 h-[400px] w-[400px] rounded-full bg-accent/5 blur-[80px]" />

      {/* Floating Glass Header */}
      <header className="sticky top-0 z-50 px-4 pt-4 pb-2">
        <div className="glass-panel flex items-start justify-between gap-3 rounded-[28px] p-2.5 pl-4 pr-3">
          <div className="flex min-w-0 flex-1 items-start gap-3 overflow-hidden">
            {showBack && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </motion.button>
            )}
            <div className={`min-w-0 flex-1 ${title ? "pt-0.5" : ""}`}>
              {title ? (
                <>
                  <h1 className="text-[1.72rem] leading-none font-display font-bold tracking-[-0.04em] text-foreground sm:text-[1.8rem]">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="mt-1.5 pr-2 text-[11px] font-semibold uppercase leading-[1.35] tracking-[0.18em] text-muted-foreground">
                      {subtitle}
                    </p>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-primary/10 to-accent/10 shadow-sm">
                    <AthenaMark className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-bold uppercase tracking-wider text-primary/70">Athena • {profileLabel(currentUser.perfil)}</p>
                    <h1 className="truncate font-display text-base font-semibold text-foreground">Olá, {currentUser.nome.split(" ")[0]}</h1>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex shrink-0 items-center gap-2 pt-0.5">
            <motion.button
              onClick={togglePrivacyMode}
              whileTap={{ scale: 0.92 }}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border border-border shadow-sm transition-all ${
                privacyMode ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {privacyMode ? <Eye className="h-4.5 w-4.5" /> : <EyeOff className="h-4.5 w-4.5" />}
            </motion.button>
            <Sheet>
              <SheetTrigger asChild>
                <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground shadow-sm transition-all hover:bg-muted/50">
                  <Menu className="h-4.5 w-4.5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85%] max-w-[340px] border-l border-border bg-background/95 backdrop-blur-xl">
                <SheetHeader className="text-left">
                  <SheetTitle className="flex items-center gap-3 font-display">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
                      <AthenaMark className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-lg">Athena</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{profileLabel(currentUser.perfil)}</div>
                    </div>
                  </SheetTitle>
                  <SheetDescription className="pt-2 text-sm">Acesso estendido a todas as áreas operacionais do sistema.</SheetDescription>
                </SheetHeader>
                <div className="mt-8 flex flex-col gap-2">
                  <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-primary/60">Menu Completo</div>
                  {items.map((item) => {
                    const isActive = isItemActive(location.pathname, item);
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`group flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all ${
                          isActive
                            ? "bg-primary text-white shadow-md font-medium"
                            : "bg-transparent text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                        }`}
                      >
                        <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-muted-foreground group-hover:text-primary"}`} />
                        <span className="text-sm">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="absolute bottom-10 left-6 right-6">
                  <button
                    onClick={async () => {
                      await logout();
                      navigate("/");
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 py-3.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive hover:text-white"
                  >
                    <LogOut className="h-4.5 w-4.5" /> Sair do Sistema
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Secondary Navigation Pills embedded into header space for seamless access */}
        {secondaryItems.length > 0 && (
          <div className="mt-3 no-scrollbar overflow-x-auto">
            <div className="flex w-max gap-2 px-1 pb-2">
              {secondaryItems.map((item) => {
                const isActive = isItemActive(location.pathname, item);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-medium transition-all ${
                      isActive
                        ? "bg-foreground text-background shadow-md"
                        : "bg-white border border-border text-foreground hover:bg-muted/60"
                    }`}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Privacy Mode Overlay Indicator */}
      <AnimatePresence>
        {privacyMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="z-40 px-4"
          >
            <div className="mb-4 flex items-center justify-center gap-2 rounded-2xl border border-warning/40 bg-warning/10 py-2.5 px-4 text-xs font-semibold text-warning-foreground shadow-sm backdrop-blur-md">
              <EyeOff className="h-4 w-4" />
              Conteúdo sensível protegido.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-1 flex-col">
        <main
          className={`flex-1 px-4 pb-[110px] overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            privacyMode ? "blur-[16px] saturate-50 brightness-90 grayscale-[0.2]" : "blur-0"
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        
        {/* Privacy Lock Screen Intercept */}
        <AnimatePresence>
          {privacyMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="glass-panel flex flex-col items-center rounded-[32px] p-8 shadow-2xl">
                 <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                    <EyeOff className="h-8 w-8" />
                 </div>
                 <h2 className="font-display text-lg font-bold text-foreground">Modo Privativo</h2>
                 <p className="mt-2 max-w-[250px] text-sm leading-relaxed text-muted-foreground">
                   Toque no olho no topo da tela para revelar seus dados novamente com segurança.
                 </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Floating Navigation (Native App Style) */}
      <nav className={`fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[calc(32rem-2rem)] -translate-x-1/2 transition-all duration-300 ${
        privacyMode ? "blur-md opacity-60 pointer-events-none" : "blur-0 opacity-100"
      }`}>
        <div className="glass-panel flex items-center justify-between overflow-hidden rounded-full p-2 shadow-2xl">
          {primaryItems.map((item) => {
            const isActive = isItemActive(location.pathname, item);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="group relative flex flex-1 flex-col items-center justify-center py-3 px-1 transition-colors"
              >
                <div className={`relative z-10 flex h-8 w-8 items-center justify-center transition-all ${
                  isActive ? "text-primary scale-110" : "text-muted-foreground"
                }`}>
                  <item.icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`z-10 mt-1 text-[10px] font-medium transition-all ${
                  isActive ? "text-primary" : "text-muted-foreground text-opacity-80"
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="active-nav-bg"
                    className="absolute inset-[4px] rounded-[24px] bg-primary/10 mix-blend-multiply"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Panic Button — floating, only for Mulher, hidden because SOS is now in dashboard */}
    </div>
  );
}
