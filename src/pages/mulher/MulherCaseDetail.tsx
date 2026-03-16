import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Timeline } from "@/components/shared/Timeline";
import { api } from "@/lib/api";

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
        <div className="bg-card p-4 rounded-2xl shadow-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Protocolo #{caso.protocolo}</p>
          <h2 className="text-lg font-semibold text-foreground mt-1">{caso.nomeCompleto}</h2>
          <p className="text-sm text-muted-foreground mt-2">{caso.observacoesIniciais}</p>
        </div>

        <h3 className="text-sm font-semibold text-foreground">Historico completo</h3>
        <Timeline atendimentos={caso.atendimentos} encaminhamentos={caso.encaminhamentos} />
      </div>
    </AppLayout>
  );
}
