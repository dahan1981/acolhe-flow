import { useQuery } from "@tanstack/react-query";
import { Clock3, FileClock, ShieldAlert } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Timeline } from "@/components/shared/Timeline";
import { api } from "@/lib/api";
import { formatDateLong, getOrganizationName } from "@/lib/domain";

export default function MulherHistorico() {
  const { data, isLoading } = useQuery({
    queryKey: ["woman-case"],
    queryFn: api.getWomanCase,
  });

  if (isLoading) {
    return (
      <AppLayout title="Historico" subtitle="Resumo dos principais registros do acompanhamento.">
        <p className="text-sm text-muted-foreground">Carregando historico...</p>
      </AppLayout>
    );
  }

  const caso = data?.caso;

  if (!caso) {
    return (
      <AppLayout title="Historico" subtitle="Resumo dos principais registros do acompanhamento.">
        <div className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Assim que uma solicitacao for registrada, o historico aparecera aqui.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Historico do caso" subtitle="Linha do tempo simplificada com foco em entendimento rapido.">
      <div className="space-y-5">
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-[24px] border border-border/70 bg-card/90 p-4 shadow-card">
            <div className="mb-2 flex items-center gap-2">
              <FileClock className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Abertura</span>
            </div>
            <p className="text-base font-semibold text-foreground">{formatDateLong(caso.dataPrimeiroAtendimento)}</p>
          </div>
          <div className="rounded-[24px] border border-border/70 bg-card/90 p-4 shadow-card">
            <div className="mb-2 flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Orgao atual</span>
            </div>
            <p className="text-base font-semibold text-foreground">{getOrganizationName(caso.orgaoAtual)}</p>
          </div>
        </section>

        <section className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-warning" />
            <h3 className="text-base font-semibold text-foreground">O que este historico mostra</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Esta visao organiza registros de atendimento e encaminhamentos da rede em uma sequencia simples, ajudando a acompanhar
            o andamento sem expor detalhes tecnicos desnecessarios.
          </p>
        </section>

        <section>
          <Timeline atendimentos={caso.atendimentos} encaminhamentos={caso.encaminhamentos} />
        </section>
      </div>
    </AppLayout>
  );
}
