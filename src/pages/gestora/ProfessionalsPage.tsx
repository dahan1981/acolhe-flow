import { Building2, CircleDot, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { teamMembers } from "@/lib/demo-content";

export default function ProfessionalsPage() {
  return (
    <AppLayout title="Equipe e perfis internos" subtitle="Visao demonstrativa de profissionais e gestoras vinculadas ao sistema.">
      <div className="space-y-5">
        <section className="rounded-[28px] border border-white/60 bg-card/90 p-5 shadow-card">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Users className="h-3.5 w-3.5" />
            Estrutura interna
          </div>
          <h2 className="text-xl font-semibold text-foreground">Distribuicao da equipe</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Esta tela ajuda a demonstrar organizacao institucional, status de perfis e foco de atuacao por area.
          </p>
        </section>

        <section className="space-y-3">
          {teamMembers.map((member) => (
            <article key={member.id} className="rounded-[24px] border border-border/70 bg-card/90 p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{member.name}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{member.role}</p>
                </div>
                <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-foreground shadow-card">
                  {member.status}
                </span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-background px-4 py-3">
                  <div className="mb-1 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Orgao</p>
                  </div>
                  <p className="text-sm text-foreground">{member.org}</p>
                </div>
                <div className="rounded-2xl bg-background px-4 py-3">
                  <div className="mb-1 flex items-center gap-2">
                    <CircleDot className="h-4 w-4 text-accent" />
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Foco</p>
                  </div>
                  <p className="text-sm text-foreground">{member.focus}</p>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </AppLayout>
  );
}
