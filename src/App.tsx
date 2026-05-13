import React, { useEffect, Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/auth-store";
import type { UserProfile } from "@/types/domain";

const Login = lazy(() => import("./pages/Login"));
const MulherDashboard = lazy(() => import("./pages/mulher/MulherDashboard"));
const MulherCaseDetail = lazy(() => import("./pages/mulher/MulherCaseDetail"));
const MulherAjuda = lazy(() => import("./pages/mulher/MulherAjuda"));
const MulherHistorico = lazy(() => import("./pages/mulher/MulherHistorico"));
const ProfissionalDashboard = lazy(() => import("./pages/profissional/ProfissionalDashboard"));
const CaseList = lazy(() => import("./pages/profissional/CaseList"));
const CaseDetail = lazy(() => import("./pages/profissional/CaseDetail"));
const NovoAtendimento = lazy(() => import("./pages/profissional/NovoAtendimento"));
const NovoEncaminhamento = lazy(() => import("./pages/profissional/NovoEncaminhamento"));
const ProfissionalWorkspace = lazy(() => import("./pages/profissional/ProfissionalWorkspace"));
const GestoraDashboard = lazy(() => import("./pages/gestora/GestoraDashboard"));
const Relatorios = lazy(() => import("./pages/gestora/Relatorios"));
const GestoraAdmin = lazy(() => import("./pages/gestora/GestoraAdmin"));
const ProfessionalsPage = lazy(() => import("./pages/gestora/ProfessionalsPage"));
const ProfilePage = lazy(() => import("./pages/shared/ProfilePage"));
const ConfigPage = lazy(() => import("./pages/shared/ConfigPage"));
const NotificationsPage = lazy(() => import("./pages/shared/NotificationsPage"));
const InstitutionalPage = lazy(() => import("./pages/shared/InstitutionalPage"));
const AccessOverviewPage = lazy(() => import("./pages/shared/AccessOverviewPage"));
const NovoProtocolo = lazy(() => import("./pages/shared/NovoProtocolo"));
const ChatPage = lazy(() => import("./pages/shared/ChatPage"));
const ArticlePage = lazy(() => import("./pages/shared/ArticlePage"));
const ProfileEditPage = lazy(() => import("./pages/shared/ProfileEditPage"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MulherCursos = lazy(() => import("./pages/mulher/MulherCursos"));
const MapaViolencia = lazy(() => import("./pages/shared/MapaViolencia"));
const MulherMedidaProtetiva = lazy(() => import("./pages/mulher/MulherMedidaProtetiva"));

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
          <Suspense fallback={<div className="flex h-screen items-center justify-center text-muted-foreground">Carregando...</div>}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/redefinir-senha" element={<ResetPassword />} />

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
              path="/mulher/chat"
              element={
                <ProtectedRoute allowedRoles={["mulher"]}>
                  <ChatPage />
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
              path="/mulher/artigo/:id"
              element={
                <ProtectedRoute allowedRoles={["mulher"]}>
                  <ArticlePage />
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
              path="/mulher/perfil/editar"
              element={
                <ProtectedRoute allowedRoles={["mulher"]}>
                  <ProfileEditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mulher/medida-protetiva"
              element={
                <ProtectedRoute allowedRoles={["mulher"]}>
                  <MulherMedidaProtetiva />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mulher/cursos"
              element={
                <ProtectedRoute allowedRoles={["mulher"]}>
                  <MulherCursos />
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
              path="/profissional/chats"
              element={
                <ProtectedRoute allowedRoles={["profissional"]}>
                  <ChatPage />
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
              path="/profissional/artigo/:id"
              element={
                <ProtectedRoute allowedRoles={["profissional"]}>
                  <ArticlePage />
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
            <Route path="/profissional/perfil/editar" element={<ProtectedRoute allowedRoles={["profissional"]}><ProfileEditPage /></ProtectedRoute>} />
            <Route
              path="/profissional/configuracoes"
              element={
                <ProtectedRoute allowedRoles={["profissional"]}>
                  <ConfigPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profissional/mapa"
              element={
                <ProtectedRoute allowedRoles={["profissional"]}>
                  <MapaViolencia />
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
              path="/gestora/mapa"
              element={
                <ProtectedRoute allowedRoles={["gestora"]}>
                  <MapaViolencia />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gestora/chats"
              element={
                <ProtectedRoute allowedRoles={["gestora"]}>
                  <ChatPage />
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
              path="/gestora/artigo/:id"
              element={
                <ProtectedRoute allowedRoles={["gestora"]}>
                  <ArticlePage />
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
            <Route path="/gestora/perfil/editar" element={<ProtectedRoute allowedRoles={["gestora"]}><ProfileEditPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </AppBootstrap>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;



