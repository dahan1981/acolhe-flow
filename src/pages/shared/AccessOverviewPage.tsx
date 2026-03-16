import { Check, LockKeyhole, ShieldCheck } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { adminAccessChecklist, roleDescriptions } from "@/lib/demo-content";
import { profileLabel } from "@/lib/domain";
import { useAuthStore } from "@/stores/auth-store";

const accessCapabilities = {
  mulher: [
    "Registrar solicitacoes e acompanhar o proprio caso",
    "Visualizar historico simplificado e comunicacoes relevantes",
    "Ajustar preferencias basicas da conta",
  ],
  profissional: [
    "Consultar casos autorizados para atendimento",
    "Registrar atendimento, observacoes e encaminhamentos",
    "Acessar orientacoes operacionais e resumo de permissoes",
  ],
  gestora: [
    "Visualizar indicadores, relatorios e volume por orgao",
    "Organizar acessos internos e revisar governanca",
    "Administrar equipe e acompanhar comunicacoes gerenciais",
  ],
} as const;

export default function AccessOverviewPage() {
  const { currentUser } = useAuthStore();

  if (!currentUser) return null;

  return (
    <AppLayout title="Permissoes e acesso" subtitle="Leitura clara do escopo disponivel em cada ambiente.">
      <div className="space-y-5">
        <section className="rounded-[28px] border border-white/60 bg-card/90 p-5 shadow-card">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            {profileLabel(currentUser.perfil)}
          </div>
          <h2 className="text-xl font-semibold text-foreground">Escopo do perfil</h2>
          <p className="mt-2 text-sm text-muted-foreground">{roleDescriptions[currentUser.perfil]}</p>
        </section>

        <section className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-card">
          <h3 className="text-base font-semibold text-foreground">Capacidades desta conta</h3>
          <div className="mt-4 space-y-3">
            {accessCapabilities[currentUser.perfil].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl bg-background px-4 py-3">
                <Check className="mt-0.5 h-4 w-4 text-accent" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <LockKeyhole className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Boas praticas de governanca</h3>
          </div>
          <div className="space-y-3">
            {adminAccessChecklist.map((item) => (
              <div key={item} className="rounded-2xl border border-border/70 px-4 py-3">
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
