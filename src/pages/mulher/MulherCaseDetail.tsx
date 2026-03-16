import { useQuery } from "@tanstack/react-query";
import { Clock3, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Timeline } from "@/components/shared/Timeline";
import { api } from "@/lib/api";
import { getCaseActivitySummary } from "@/lib/demo-case-store";
import { formatDate } from "@/lib/domain";

export default function MulherCaseDetail() {
  const { data, isLoading } = useQuery({
    queryKey: ["woman-case"],
    queryFn: api.getWomanCase,
  });

  if (isLoading) {
    return (
      <AppLayout title="Meu Caso" showBack>
        <p className="text-sm text-muted-foreground">Carregando historico...</p>
      </AppLayout>
    );
  }

  const caso = data?.caso;

  if (!caso) {
    return (
      <AppLayout title="Meu Caso" showBack>
        <p className="text-sm text-muted-foreground">Nenhum caso cadastrado ainda.</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Meu Caso" showBack>
      <div className="space-y-4">
        <div className="bg-card/90 p-4 rounded-[24px] shadow-card border border-white/60">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Protocolo #{caso.protocolo}</p>
          <h2 className="text-lg font-semibold text-foreground mt-1">{caso.nomeCompleto}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge type="status" value={caso.status} />
            <StatusBadge type="risk" value={caso.situacaoRisco} />
          </div>
          <p className="text-sm text-muted-foreground mt-3">{caso.observacoesIniciais}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[24px] border border-border/70 bg-card/90 p-4 shadow-card">
            <div className="mb-2 flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Ultima atualizacao</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{formatDate(getCaseActivitySummary(caso).date.slice(0, 10))}</p>
            <p className="mt-1 text-xs text-muted-foreground">{getCaseActivitySummary(caso).summary}</p>
          </div>
          <div className="rounded-[24px] border border-border/70 bg-card/90 p-4 shadow-card">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Andamento visivel</span>
            </div>
            <p className="text-sm font-semibold text-foreground">Status compartilhado</p>
            <p className="mt-1 text-xs text-muted-foreground">
              O mesmo status aparece para Profissional e Gestora nesta demonstracao.
            </p>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-foreground">Historico completo</h3>
        <Timeline atendimentos={caso.atendimentos} encaminhamentos={caso.encaminhamentos} />
      </div>
    </AppLayout>
  );
}
