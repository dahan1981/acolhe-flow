import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore } from '@/stores/auth-store';
import { User, Mail, Building2, Shield } from 'lucide-react';
import { getOrgaoNome } from '@/data/mock-data';

export default function ProfilePage() {
  const { currentUser } = useAuthStore();
  if (!currentUser) return null;

  const profileLabel = currentUser.perfil === 'mulher' ? 'Acolhida' : currentUser.perfil === 'profissional' ? 'Profissional' : 'Gestora';

  return (
    <AppLayout title="Perfil">
      <div className="space-y-4">
        <div className="bg-card p-6 rounded-2xl shadow-card text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{currentUser.nome}</h2>
          <p className="text-sm text-muted-foreground">{profileLabel}</p>
        </div>

        <div className="bg-card p-4 rounded-2xl shadow-card space-y-4">
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
              <p className="text-xs text-muted-foreground">Órgão</p>
              <p className="text-sm text-foreground">{getOrgaoNome(currentUser.orgao)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Perfil de Acesso</p>
              <p className="text-sm text-foreground">{profileLabel}</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-8">
          AcolheSistemas v1.0 — Demonstração Funcional
        </p>
      </div>
    </AppLayout>
  );
}
