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
import ProfissionalDashboard from "./pages/profissional/ProfissionalDashboard";
import CaseList from "./pages/profissional/CaseList";
import CaseDetail from "./pages/profissional/CaseDetail";
import NovoAtendimento from "./pages/profissional/NovoAtendimento";
import NovoEncaminhamento from "./pages/profissional/NovoEncaminhamento";
import GestoraDashboard from "./pages/gestora/GestoraDashboard";
import Relatorios from "./pages/gestora/Relatorios";
import ProfilePage from "./pages/shared/ProfilePage";
import ConfigPage from "./pages/shared/ConfigPage";
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
              path="/mulher/perfil"
              element={
                <ProtectedRoute allowedRoles={["mulher"]}>
                  <ProfilePage />
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
              path="/profissional/novo-atendimento"
              element={
                <ProtectedRoute allowedRoles={["profissional"]}>
                  <NovoAtendimento />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profissional/novo-encaminhamento"
              element={
                <ProtectedRoute allowedRoles={["profissional"]}>
                  <NovoEncaminhamento />
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
              path="/gestora/relatorios"
              element={
                <ProtectedRoute allowedRoles={["gestora"]}>
                  <Relatorios />
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

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppBootstrap>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
