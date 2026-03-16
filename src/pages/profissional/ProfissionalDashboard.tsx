import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { CaseCard } from "@/components/shared/CaseCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FileText, Users, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate, getOrganizationName } from "@/lib/domain";

export default function ProfissionalDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["professional-dashboard"],
    queryFn: api.getProfessionalDashboard,
  });

  if (isLoading) {
    return (
      <AppLayout>
        <p className="text-sm text-muted-foreground">Carregando painel profissional...</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card p-4 rounded-2xl shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Casos ativos</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{data?.casosAtivos ?? 0}</p>
          </div>
          <div className="bg-card p-4 rounded-2xl shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Atendimentos hoje</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{data?.atendimentosHoje ?? 0}</p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Casos prioritarios</h2>
          <div className="space-y-3">
            {data?.casosPrioritarios.map((caso) => (
              <CaseCard key={caso.id} caso={caso} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Ultimos atendimentos</h2>
          <div className="space-y-3">
            {data?.ultimosAtendimentos.map((item) => (
              <div key={item.id} className="bg-card p-4 rounded-2xl shadow-card">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{formatDate(item.data)}</span>
                  <StatusBadge type="risk" value={item.riscoIdentificado} />
                </div>
                <p className="text-sm font-medium text-foreground">{item.caso.nomeSocial || item.caso.nomeCompleto}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.tipoAtendimento} - {getOrganizationName(item.orgao)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
