import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Activity, AlertTriangle, Clock, ShieldCheck, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { roleDescriptions } from "@/lib/demo-content";

export default function GestoraDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["manager-dashboard"],
    queryFn: api.getManagerDashboard,
  });

  const stats = data?.stats;

  if (isLoading || !stats) {
    return (
      <AppLayout>
        <p className="text-sm text-muted-foreground">Carregando indicadores...</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="rounded-[28px] border border-white/60 bg-card/90 p-5 shadow-card">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Camada estrategica
          </div>
          <h2 className="text-xl font-semibold text-foreground">Painel gerencial</h2>
          <p className="mt-1 text-sm text-muted-foreground">{roleDescriptions.gestora}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button onClick={() => navigate("/gestora/novo-protocolo")} className="rounded-2xl bg-background px-4 py-3 text-left text-sm font-medium text-foreground shadow-card">
              Novo protocolo
            </button>
            <button onClick={() => navigate("/gestora/novo-atendimento")} className="rounded-2xl bg-background px-4 py-3 text-left text-sm font-medium text-foreground shadow-card">
              Novo atendimento
            </button>
            <button onClick={() => navigate("/gestora/administracao")} className="rounded-2xl bg-background px-4 py-3 text-left text-sm font-medium text-foreground shadow-card">
              Criar contas internas
            </button>
            <button onClick={() => navigate("/gestora/profissionais")} className="rounded-2xl bg-background px-4 py-3 text-left text-sm font-medium text-foreground shadow-card">
              Ver equipe
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card/90 p-4 rounded-2xl shadow-card border border-border/70">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total de casos</span>
            </div>
            <p className="text-3xl font-bold text-foreground tabular-nums">{stats.total}</p>
          </div>
          <div className="bg-card/90 p-4 rounded-2xl shadow-card border border-border/70">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Atendimentos</span>
            </div>
            <p className="text-3xl font-bold text-foreground tabular-nums">{stats.totalAtendimentos}</p>
          </div>
          <div className="bg-card/90 p-4 rounded-2xl shadow-card border border-border/70">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="text-xs text-muted-foreground">Casos ativos</span>
            </div>
            <p className="text-3xl font-bold text-foreground tabular-nums">{stats.ativos}</p>
          </div>
          <div className="bg-card/90 p-4 rounded-2xl shadow-card border border-border/70">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-urgent" />
              <span className="text-xs text-muted-foreground">Enc. pendentes</span>
            </div>
            <p className="text-3xl font-bold text-foreground tabular-nums">{stats.encaminhamentosPendentes}</p>
          </div>
        </div>

        <div className="bg-card/90 p-5 rounded-2xl shadow-card border border-border/70">
          <h3 className="text-sm font-semibold text-foreground mb-4">Casos por status</h3>
          <div className="space-y-3">
            {[
              { label: "Ativos", count: stats.ativos, total: stats.total, className: "bg-urgent" },
              { label: "Em andamento", count: stats.emAndamento, total: stats.total, className: "bg-primary" },
              { label: "Encaminhados", count: stats.encaminhados, total: stats.total, className: "bg-warning" },
              { label: "Resolvidos", count: stats.resolvidos, total: stats.total, className: "bg-accent" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground tabular-nums">{item.count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.className}`}
                    style={{ width: `${item.total ? (item.count / item.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card/90 p-5 rounded-2xl shadow-card border border-border/70">
          <h3 className="text-sm font-semibold text-foreground mb-4">Distribuicao de risco</h3>
          <div className="grid grid-cols-2 gap-3">
            {stats.porRisco.map((item) => (
              <div key={item.nivel} className="flex items-center gap-3 p-3 bg-background rounded-xl">
                <div className={`w-3 h-3 rounded-full ${riskColorClass(item.cor)}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{item.nivel}</p>
                  <p className="text-lg font-bold text-foreground tabular-nums">{item.total}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card/90 p-5 rounded-2xl shadow-card border border-border/70">
          <h3 className="text-sm font-semibold text-foreground mb-4">Entrada por orgao</h3>
          <div className="space-y-3">
            {stats.porOrgao.map((item) => (
              <div key={item.sigla} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{item.sigla}</span>
                  </div>
                  <span className="text-sm text-foreground">{item.orgao}</span>
                </div>
                <span className="text-sm font-semibold text-foreground tabular-nums">{item.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function riskColorClass(color: string) {
  if (color === "urgent") return "bg-urgent";
  if (color === "warning") return "bg-warning";
  if (color === "accent") return "bg-accent";
  return "bg-primary";
}
