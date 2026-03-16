import { useNavigate } from "react-router-dom";
import { Building2, Mail, Shield, User } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { getOrganizationName, profileLabel } from "@/lib/domain";
import { useAuthStore } from "@/stores/auth-store";

export default function ProfilePage() {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  if (!currentUser) return null;

  const basePath =
    currentUser.perfil === "mulher" ? "/mulher" : currentUser.perfil === "profissional" ? "/profissional" : "/gestora";

  return (
    <AppLayout title="Perfil" subtitle="Identidade do usuario, papel no sistema e atalhos da conta.">
      <div className="space-y-5">
        <div className="bg-card/90 p-6 rounded-[28px] shadow-card text-center border border-white/60">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 shadow-card">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{currentUser.nome}</h2>
          <p className="text-sm text-muted-foreground">{profileLabel(currentUser.perfil)}</p>
        </div>

        <div className="bg-card/90 p-4 rounded-[24px] shadow-card space-y-4 border border-border/70">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">E-mail</p>
              <p className="text-sm text-foreground">{currentUser.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Orgao</p>
              <p className="text-sm text-foreground">{getOrganizationName(currentUser.orgao)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Perfil de Acesso</p>
              <p className="text-sm text-foreground">{profileLabel(currentUser.perfil)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate(`${basePath}/configuracoes`)}
            className="rounded-[24px] border border-border/70 bg-card/90 p-4 text-left shadow-card"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Conta</p>
            <p className="mt-2 text-sm font-semibold text-foreground">Ajustar preferencias</p>
          </button>
          <button
            onClick={() => navigate(`${basePath}/ajuda`)}
            className="rounded-[24px] border border-border/70 bg-card/90 p-4 text-left shadow-card"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Suporte</p>
            <p className="mt-2 text-sm font-semibold text-foreground">Abrir ajuda e orientacoes</p>
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
