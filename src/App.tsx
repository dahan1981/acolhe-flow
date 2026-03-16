import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/auth-store";

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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          {/* Mulher */}
          <Route path="/mulher" element={<ProtectedRoute><MulherDashboard /></ProtectedRoute>} />
          <Route path="/mulher/caso" element={<ProtectedRoute><MulherCaseDetail /></ProtectedRoute>} />
          <Route path="/mulher/ajuda" element={<ProtectedRoute><MulherAjuda /></ProtectedRoute>} />
          <Route path="/mulher/perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Profissional */}
          <Route path="/profissional" element={<ProtectedRoute><ProfissionalDashboard /></ProtectedRoute>} />
          <Route path="/profissional/casos" element={<ProtectedRoute><CaseList /></ProtectedRoute>} />
          <Route path="/profissional/caso/:id" element={<ProtectedRoute><CaseDetail /></ProtectedRoute>} />
          <Route path="/profissional/novo-atendimento" element={<ProtectedRoute><NovoAtendimento /></ProtectedRoute>} />
          <Route path="/profissional/novo-encaminhamento" element={<ProtectedRoute><NovoEncaminhamento /></ProtectedRoute>} />
          <Route path="/profissional/perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Gestora */}
          <Route path="/gestora" element={<ProtectedRoute><GestoraDashboard /></ProtectedRoute>} />
          <Route path="/gestora/casos" element={<ProtectedRoute><CaseList /></ProtectedRoute>} />
          <Route path="/gestora/caso/:id" element={<ProtectedRoute><CaseDetail /></ProtectedRoute>} />
          <Route path="/gestora/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
          <Route path="/gestora/config" element={<ProtectedRoute><ConfigPage /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
