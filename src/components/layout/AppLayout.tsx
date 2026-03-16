import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, FileText, BarChart3, Settings, User, Heart, PlusCircle, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/auth-store";
import type { UserProfile } from "@/types/domain";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

const navItems: Record<UserProfile, Array<{ label: string; icon: React.ElementType; path: string }>> = {
  mulher: [
    { label: "Inicio", icon: Home, path: "/mulher" },
    { label: "Meu Caso", icon: FileText, path: "/mulher/caso" },
    { label: "Ajuda", icon: Heart, path: "/mulher/ajuda" },
    { label: "Perfil", icon: User, path: "/mulher/perfil" },
  ],
  profissional: [
    { label: "Inicio", icon: Home, path: "/profissional" },
    { label: "Casos", icon: Search, path: "/profissional/casos" },
    { label: "Novo", icon: PlusCircle, path: "/profissional/novo-atendimento" },
    { label: "Perfil", icon: User, path: "/profissional/perfil" },
  ],
  gestora: [
    { label: "Painel", icon: Home, path: "/gestora" },
    { label: "Casos", icon: Search, path: "/gestora/casos" },
    { label: "Relatorios", icon: BarChart3, path: "/gestora/relatorios" },
    { label: "Config", icon: Settings, path: "/gestora/config" },
  ],
};

export function AppLayout({ children, title, showBack }: AppLayoutProps) {
  const { currentUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (!currentUser) return null;

  const items = navItems[currentUser.perfil];

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto relative">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack && (
              <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
            )}
            <div>
              {title ? (
                <h1 className="text-lg font-semibold text-foreground">{title}</h1>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">AcolheSistemas</p>
                  <h1 className="text-base font-semibold text-foreground">Ola, {currentUser.nome.split(" ")[0]}</h1>
                </>
              )}
            </div>
          </div>
          <button
            onClick={async () => {
              await logout();
              navigate("/");
            }}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-24 overflow-y-auto">
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

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/50 safe-bottom max-w-lg mx-auto">
        <div className="flex items-center justify-around px-2 py-2">
          {items.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/" &&
                location.pathname.startsWith(item.path) &&
                item.path.split("/").length <= location.pathname.split("/").length);
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
