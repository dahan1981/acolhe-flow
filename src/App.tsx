import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/auth-store";
import type { UserProfile } from "@/types/domain";

import Login from "./pages/Login";
import MulherDashboard from "./pages/mulher/MulherDashboard";
import MulherCaseDetail from "./pages/mulher/MulherCaseDetail";
import MulherAjuda from "./pages/mulher/MulherAjuda";
import MulherHistorico from "./pages/mulher/MulherHistorico";
import ProfissionalDashboard from "./pages/profissional/ProfissionalDashboard";
import CaseList from "./pages/profissional/CaseList";
import CaseDetail from "./pages/profissional/CaseDetail";
import NovoAtendimento from "./pages/profissional/NovoAtendimento";
import NovoEncaminhamento from "./pages/profissional/NovoEncaminhamento";
import ProfissionalWorkspace from "./pages/profissional/ProfissionalWorkspace";
import GestoraDashboard from "./pages/gestora/GestoraDashboard";
import Relatorios from "./pages/gestora/Relatorios";
import GestoraAdmin from "./pages/gestora/GestoraAdmin";
import ProfessionalsPage from "./pages/gestora/ProfessionalsPage";
import ProfilePage from "./pages/shared/ProfilePage";
import ConfigPage from "./pages/shared/ConfigPage";
import NotificationsPage from "./pages/shared/NotificationsPage";
import InstitutionalPage from "./pages/shared/InstitutionalPage";
import AccessOverviewPage from "./pages/shared/AccessOverviewPage";
import NovoProtocolo from "./pages/shared/NovoProtocolo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppBootstrap({ children }: { children: React.ReactNode }) {
  const { hydrate, isBootstrapping } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
        Carregando sessao...
      </div>
    );
  }

  return <>{children}</>;
}

function homePath(profile: UserProfile) {
  if (profile === "mulher") return "/mulher";
  if (profile === "profissional") return "/profissional";
  return "/gestora";
}

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: UserProfile[];
}) {
  const { isAuthenticated, currentUser } = useAuthStore();

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.perfil)) {
    return <Navigate to={homePath(currentUser.perfil)} replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-center" />
      <BrowserRouter>
        <AppBootstrap>
          <Routes>
            <Route path="/" element={<Login />} />

            <Route
              path="/mulher"
              element={
                <ProtectedRoute allowedRoles={["mulher"]}>
                  <MulherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mulher/caso"
              element={
                <ProtectedRoute allowedRoles={["mulher"]}>
                  <MulherCaseDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mulher/ajuda"
              element={
                <ProtectedRoute allowedRoles={["mulher"]}>
                  <MulherAjuda />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mulher/historico"
              element={
                <ProtectedRoute allowedRoles={["mulher"]}>
                  <MulherHistorico />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mulher/notificacoes"
              element={
                <ProtectedRoute allowedRoles={["mulher"]}>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mulher/central-ajuda"
              element={
                <ProtectedRoute allowedRoles={["mulher"]}>
                  <InstitutionalPage topic="ajuda" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mulher/permissoes"
              element={
                <ProtectedRoute allowedRoles={["mulher"]}>
                  <AccessOverviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mulher/seguranca"
              element={
                <ProtectedRoute allowedRoles={["mulher"]}>
                  <InstitutionalPage topic="seguranca" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mulher/sobre"
              element={
                <ProtectedRoute allowedRoles={["mulher"]}>
                  <InstitutionalPage topic="sobre" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mulher/perfil"
              element={
                <ProtectedRoute allowedRoles={["mulher"]}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mulher/configuracoes"
              element={
                <ProtectedRoute allowedRoles={["mulher"]}>
                  <ConfigPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profissional"
              element={
                <ProtectedRoute allowedRoles={["profissional"]}>
                  <ProfissionalDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profissional/casos"
              element={
                <ProtectedRoute allowedRoles={["profissional"]}>
                  <CaseList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profissional/caso/:id"
              element={
                <ProtectedRoute allowedRoles={["profissional", "gestora"]}>
                  <CaseDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profissional/historico"
              element={
                <ProtectedRoute allowedRoles={["profissional"]}>
                  <ProfissionalWorkspace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profissional/novo-protocolo"
              element={
                <ProtectedRoute allowedRoles={["profissional"]}>
                  <NovoProtocolo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profissional/novo-atendimento"
              element={
                <ProtectedRoute allowedRoles={["profissional", "gestora"]}>
                  <NovoAtendimento />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profissional/novo-encaminhamento"
              element={
                <ProtectedRoute allowedRoles={["profissional", "gestora"]}>
                  <NovoEncaminhamento />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profissional/notificacoes"
              element={
                <ProtectedRoute allowedRoles={["profissional"]}>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profissional/ajuda"
              element={
                <ProtectedRoute allowedRoles={["profissional"]}>
                  <InstitutionalPage topic="ajuda" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profissional/permissoes"
              element={
                <ProtectedRoute allowedRoles={["profissional"]}>
                  <AccessOverviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profissional/seguranca"
              element={
                <ProtectedRoute allowedRoles={["profissional"]}>
                  <InstitutionalPage topic="seguranca" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profissional/sobre"
              element={
                <ProtectedRoute allowedRoles={["profissional"]}>
                  <InstitutionalPage topic="sobre" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profissional/perfil"
              element={
                <ProtectedRoute allowedRoles={["profissional"]}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profissional/configuracoes"
              element={
                <ProtectedRoute allowedRoles={["profissional"]}>
                  <ConfigPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/gestora"
              element={
                <ProtectedRoute allowedRoles={["gestora"]}>
                  <GestoraDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gestora/casos"
              element={
                <ProtectedRoute allowedRoles={["gestora"]}>
                  <CaseList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gestora/caso/:id"
              element={
                <ProtectedRoute allowedRoles={["gestora"]}>
                  <CaseDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gestora/novo-protocolo"
              element={
                <ProtectedRoute allowedRoles={["gestora"]}>
                  <NovoProtocolo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gestora/novo-atendimento"
              element={
                <ProtectedRoute allowedRoles={["gestora"]}>
                  <NovoAtendimento />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gestora/novo-encaminhamento"
              element={
                <ProtectedRoute allowedRoles={["gestora"]}>
                  <NovoEncaminhamento />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gestora/administracao"
              element={
                <ProtectedRoute allowedRoles={["gestora"]}>
                  <GestoraAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gestora/profissionais"
              element={
                <ProtectedRoute allowedRoles={["gestora"]}>
                  <ProfessionalsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gestora/relatorios"
              element={
                <ProtectedRoute allowedRoles={["gestora"]}>
                  <Relatorios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gestora/notificacoes"
              element={
                <ProtectedRoute allowedRoles={["gestora"]}>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gestora/ajuda"
              element={
                <ProtectedRoute allowedRoles={["gestora"]}>
                  <InstitutionalPage topic="ajuda" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gestora/permissoes"
              element={
                <ProtectedRoute allowedRoles={["gestora"]}>
                  <AccessOverviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gestora/seguranca"
              element={
                <ProtectedRoute allowedRoles={["gestora"]}>
                  <InstitutionalPage topic="seguranca" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gestora/sobre"
              element={
                <ProtectedRoute allowedRoles={["gestora"]}>
                  <InstitutionalPage topic="sobre" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gestora/config"
              element={
                <ProtectedRoute allowedRoles={["gestora"]}>
                  <ConfigPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gestora/configuracoes"
              element={
                <ProtectedRoute allowedRoles={["gestora"]}>
                  <ConfigPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gestora/perfil"
              element={
                <ProtectedRoute allowedRoles={["gestora"]}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppBootstrap>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
