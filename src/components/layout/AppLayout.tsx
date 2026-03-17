import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3,
  Bell,
  MessageCircleHeart,
  Eye,
  EyeOff,
  FileText,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Search,
  Settings,
  Shield,
  User,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/auth-store";
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

const PRIVACY_MODE_STORAGE_KEY = "acolhe-flow-privacy-mode";

type NavItem = {
  label: string;
  icon: React.ElementType;
  path: string;
  match?: string[];
  description?: string;
};

const navItems: Record<UserProfile, NavItem[]> = {
  mulher: [
    { label: "Inicio", icon: Home, path: "/mulher", description: "Visao geral do acompanhamento e atalhos principais" },
    { label: "Solicitacao", icon: Heart, path: "/mulher/ajuda", match: ["/mulher/ajuda", "/mulher/solicitacao"], description: "Registrar pedido de ajuda ou nova ocorrencia" },
    { label: "Meu caso", icon: FileText, path: "/mulher/caso", match: ["/mulher/caso", "/mulher/historico"], description: "Status do caso, protocolo e historico de movimentacoes" },
    { label: "Chat", icon: MessageCircleHeart, path: "/mulher/chat", description: "Atendimento especializado com chat protegido" },
    { label: "Alertas", icon: Bell, path: "/mulher/notificacoes", description: "Comunicacoes e atualizacoes recentes" },
    { label: "Central de ajuda", icon: Shield, path: "/mulher/central-ajuda", description: "Orientacoes de uso e suporte em fase piloto" },
    { label: "Perfil", icon: User, path: "/mulher/perfil", match: ["/mulher/perfil", "/mulher/configuracoes"], description: "Dados e preferencias da conta" },
  ],
  profissional: [
    { label: "Painel", icon: LayoutDashboard, path: "/profissional", description: "Prioridades do turno, fila operacional e acessos rapidos" },
    { label: "Casos", icon: Search, path: "/profissional/casos", match: ["/profissional/casos", "/profissional/caso", "/profissional/historico"], description: "Busca, status do caso, protocolo e historico operacional" },
    { label: "Atendimento", icon: PlusCircle, path: "/profissional/novo-atendimento", match: ["/profissional/novo-atendimento", "/profissional/novo-encaminhamento", "/profissional/novo-protocolo"], description: "Gerar protocolo, registrar atendimento e criar encaminhamento" },
    { label: "Chats", icon: MessageCircleHeart, path: "/profissional/chats", description: "Fila de chats aguardando assuncao da equipe" },
    { label: "Alertas", icon: Bell, path: "/profissional/notificacoes", description: "Atualizacoes da operacao" },
    { label: "Permissoes", icon: Shield, path: "/profissional/permissoes", description: "Escopo de acesso do perfil" },
    { label: "Perfil", icon: User, path: "/profissional/perfil", match: ["/profissional/perfil", "/profissional/configuracoes", "/profissional/ajuda"], description: "Conta, ajuda e configuracoes" },
  ],
  gestora: [
    { label: "Painel", icon: LayoutDashboard, path: "/gestora", description: "Indicadores, distribuicao operacional e acompanhamento executivo" },
    { label: "Casos", icon: Search, path: "/gestora/casos", match: ["/gestora/casos", "/gestora/caso", "/gestora/novo-atendimento", "/gestora/novo-encaminhamento", "/gestora/novo-protocolo"], description: "Monitorar casos, protocolos e movimentacoes da rede" },
    { label: "Chats", icon: MessageCircleHeart, path: "/gestora/chats", description: "Monitorar fila de chats e tempos de resposta" },
    { label: "Equipe", icon: Users, path: "/gestora/profissionais", match: ["/gestora/profissionais", "/gestora/administracao"], description: "Contas internas e organizacao da equipe" },
    { label: "Relatorios", icon: BarChart3, path: "/gestora/relatorios", description: "Indicadores de volume, risco, violencia e distribuicao" },
    { label: "Alertas", icon: Bell, path: "/gestora/notificacoes", description: "Eventos administrativos e operacionais" },
    { label: "Governanca", icon: Shield, path: "/gestora/permissoes", match: ["/gestora/permissoes", "/gestora/seguranca", "/gestora/ajuda", "/gestora/sobre"], description: "Permissoes, seguranca e orientacoes" },
    { label: "Perfil", icon: Settings, path: "/gestora/config", match: ["/gestora/config", "/gestora/configuracoes", "/gestora/perfil"], description: "Configuracoes e preferencias" },
  ],
};

function isItemActive(pathname: string, item: NavItem) {
  const paths = item.match ?? [item.path];
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`) || pathname.startsWith(`${path}?`));
}

export function AppLayout({ children, title, subtitle, showBack }: AppLayoutProps) {
  const { currentUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [privacyMode, setPrivacyMode] = useState(false);
  const items = useMemo(() => (currentUser ? navItems[currentUser.perfil] : []), [currentUser]);
  const primaryItems = items.slice(0, 4);
  const secondaryItems = items.slice(4);
  const activeItem = useMemo(
    () => items.find((item) => isItemActive(location.pathname, item)),
    [items, location.pathname],
  );
  const accentClass = currentUser ? roleAccent(currentUser.perfil) : "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPrivacyMode(window.localStorage.getItem(PRIVACY_MODE_STORAGE_KEY) === "true");
  }, []);

  if (!currentUser) return null;

  function togglePrivacyMode() {
    setPrivacyMode((current) => {
      const next = !current;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(PRIVACY_MODE_STORAGE_KEY, String(next));
      }
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto relative overflow-hidden">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-br ${accentClass}`} />
      <header className="sticky top-0 z-50 border-b border-white/50 bg-background/80 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {showBack && (
              <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
            )}
            <div className="min-w-0">
              <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-card">
                <span className="h-2 w-2 rounded-full bg-primary" />
                {profileLabel(currentUser.perfil)}
              </div>
              {title ? (
                <>
                  <h1 className="text-lg font-semibold text-foreground">{title}</h1>
                  <p className="text-xs text-muted-foreground">{subtitle ?? activeItem?.description ?? "Ambiente em fase piloto com navegacao orientada."}</p>
                </>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground/90">Acolhe Flow</p>
                  <h1 className="text-base font-semibold text-foreground">Ola, {currentUser.nome.split(" ")[0]}</h1>
                  <p className="text-xs text-muted-foreground">{activeItem?.description ?? "Ambiente piloto organizado para uso acompanhado."}</p>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              onClick={togglePrivacyMode}
              whileTap={{ scale: 0.96 }}
              animate={privacyMode ? { scale: [1, 1.04, 1], rotate: [0, -3, 0] } : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
              className={`relative rounded-2xl border p-2.5 shadow-card transition-all ${
                privacyMode
                  ? "border-primary/20 bg-primary text-primary-foreground"
                  : "border-border/60 bg-card/80 text-muted-foreground hover:text-foreground"
              }`}
              title={privacyMode ? "Desativar modo de privacidade" : "Ativar modo de privacidade"}
            >
              {privacyMode ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              <span className="sr-only">
                {privacyMode ? "Desativar modo de privacidade" : "Ativar modo de privacidade"}
              </span>
            </motion.button>
            <Sheet>
              <SheetTrigger asChild>
                <button className="rounded-2xl border border-border/60 bg-card/80 p-2.5 text-muted-foreground shadow-card transition-all hover:text-foreground">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="border-r border-border/60 bg-background/95">
                <SheetHeader className="text-left">
                  <SheetTitle>Acolhe Flow</SheetTitle>
                  <SheetDescription>{profileLabel(currentUser.perfil)} com navegacao completa para o periodo de testes assistidos.</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  {items.map((item) => {
                    const isActive = isItemActive(location.pathname, item);
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-all ${
                          isActive
                            ? "border-primary/20 bg-primary/10 text-foreground"
                            : "border-border/60 bg-card/80 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <item.icon className={`mt-0.5 h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs leading-5">{item.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
            <button
              onClick={async () => {
                await logout();
                navigate("/");
              }}
              className="rounded-2xl border border-border/60 bg-card/80 p-2.5 text-muted-foreground shadow-card transition-all hover:text-foreground"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {secondaryItems.length ? secondaryItems.map((item) => {
            const isActive = isItemActive(location.pathname, item);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive ? "bg-primary text-primary-foreground shadow-card" : "bg-card/80 text-muted-foreground shadow-card"
                }`}
              >
                {item.label}
              </button>
            );
          }) : null}
        </div>
      </header>

      {privacyMode ? (
        <div className="px-4 pt-3">
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="rounded-[22px] border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary shadow-card"
          >
            Modo de privacidade ativo. O conteudo foi desfocado para proteger a leitura ao redor.
          </motion.div>
        </div>
      ) : null}

      <div className="relative flex-1">
      <main
        className={`flex-1 px-4 py-4 pb-24 overflow-y-auto transition-all duration-300 ${
          privacyMode ? "blur-[14px] saturate-50 brightness-[0.88]" : "blur-0"
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
        <AnimatePresence>
          {privacyMode ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="pointer-events-none absolute inset-x-4 top-4 bottom-24 z-20 rounded-[32px] border border-white/40 bg-background/18 shadow-elevated backdrop-blur-sm"
            >
              <div className="flex h-full items-center justify-center px-8 text-center">
                <div className="max-w-xs rounded-[28px] border border-white/50 bg-card/80 px-5 py-5 shadow-card">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                    <EyeOff className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Privacidade rapida ativada</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Toque novamente no icone ao lado do menu para revelar a interface com seguranca.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto border-t border-border/50 bg-card/95 safe-bottom backdrop-blur-xl transition-all duration-300 ${
          privacyMode ? "blur-[14px] saturate-50 brightness-[0.9]" : "blur-0"
        }`}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {primaryItems.map((item) => {
            const isActive = isItemActive(location.pathname, item);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
