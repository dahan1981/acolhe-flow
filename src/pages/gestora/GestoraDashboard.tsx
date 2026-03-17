import { useMemo } from "react";
import type { ElementType } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Activity, AlertTriangle, BarChart3, Clock, FilePlus2, ShieldCheck, Stethoscope, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { ethnicityLabel, violenceTypeLabel } from "@/lib/domain";
import { roleDescriptions } from "@/lib/demo-content";

export default function GestoraDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["manager-dashboard"],
    queryFn: api.getManagerDashboard,
  });

  const stats = data?.stats;

  const topViolence = useMemo(
    () => [...(stats?.porViolencia ?? [])].sort((a, b) => b.total - a.total).slice(0, 3),
    [stats?.porViolencia],
  );

  const topEthnicity = useMemo(
    () => [...(stats?.porEtnia ?? [])].sort((a, b) => b.total - a.total).slice(0, 3),
    [stats?.porEtnia],
  );

  if (isLoading || !stats) {
    return (
      <AppLayout>
        <p className="text-sm text-muted-foreground">Carregando painel gerencial...</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Painel gerencial" subtitle="Indicadores consolidados para monitorar a implantacao inicial da plataforma.">
      <div className="space-y-6">
        <section className="rounded-[28px] border border-white/60 bg-card/90 p-5 shadow-card">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Monitoramento executivo
          </div>
          <h2 className="text-xl font-semibold text-foreground">Visao da fase piloto</h2>
          <p className="mt-1 text-sm text-muted-foreground">{roleDescriptions.gestora}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button onClick={() => navigate("/gestora/novo-protocolo")} className="rounded-2xl bg-primary px-4 py-3 text-left text-sm font-medium text-primary-foreground shadow-card">
              <div className="mb-1 flex items-center gap-2">
                <FilePlus2 className="h-4 w-4" />
                Gerar protocolo
              </div>
              <p className="text-xs text-primary-foreground/80">Abrir novo caso pela gestao</p>
            </button>
            <button onClick={() => navigate("/gestora/novo-atendimento")} className="rounded-2xl bg-background px-4 py-3 text-left text-sm font-medium text-foreground shadow-card">
              <div className="mb-1 flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-accent" />
                Registrar atendimento
              </div>
              <p className="text-xs text-muted-foreground">Atualizar caso ou apoiar a operacao</p>
            </button>
            <button onClick={() => navigate("/gestora/administracao")} className="rounded-2xl bg-background px-4 py-3 text-left text-sm font-medium text-foreground shadow-card">
              Criar contas internas
            </button>
            <button onClick={() => navigate("/gestora/relatorios")} className="rounded-2xl bg-background px-4 py-3 text-left text-sm font-medium text-foreground shadow-card">
              Abrir relatorios
            </button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <MetricCard icon={Users} label="Casos monitorados" value={stats.total} />
          <MetricCard icon={Activity} label="Atendimentos" value={stats.totalAtendimentos} accent="accent" />
          <MetricCard icon={AlertTriangle} label="Casos em triagem" value={stats.ativos} accent="warning" />
          <MetricCard icon={Clock} label="Encaminhamentos pendentes" value={stats.encaminhamentosPendentes} accent="urgent" />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Status dos casos</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: "Triagem", count: stats.ativos, total: stats.total, className: "bg-urgent" },
                { label: "Em andamento", count: stats.emAndamento, total: stats.total, className: "bg-primary" },
                { label: "Encaminhados", count: stats.encaminhados, total: stats.total, className: "bg-warning" },
                { label: "Concluidos", count: stats.resolvidos, total: stats.total, className: "bg-accent" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-foreground tabular-nums">{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.className}`}
                      style={{ width: `${item.total ? (item.count / item.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-card">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Distribuicao de risco</h3>
            <div className="grid grid-cols-2 gap-3">
              {stats.porRisco.map((item) => (
                <div key={item.nivel} className="rounded-2xl bg-background px-3 py-3">
                  <div className="mb-2 flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${riskColorClass(item.cor)}`} />
                    <p className="text-xs text-muted-foreground">{item.nivel}</p>
                  </div>
                  <p className="text-xl font-bold text-foreground tabular-nums">{item.total}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <InsightList
            title="Tipos de violencia mais recorrentes"
            items={topViolence.map((item) => ({ label: violenceTypeLabel(item.tipo), value: item.total }))}
            emptyText="Sem registros suficientes para destacar recortes nesta etapa."
          />
          <InsightList
            title="Recorte por etnia/cor"
            items={topEthnicity.map((item) => ({ label: ethnicityLabel(item.etnia), value: item.total }))}
            emptyText="Sem registros suficientes para consolidar o recorte atual."
          />
        </section>

        <section className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-card">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Distribuicao por orgao</h3>
          <div className="space-y-3">
            {stats.porOrgao.map((item) => (
              <div key={item.sigla} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <span className="text-xs font-bold text-primary">{item.sigla}</span>
                  </div>
                  <span className="text-sm text-foreground">{item.orgao}</span>
                </div>
                <span className="text-sm font-semibold text-foreground tabular-nums">{item.total}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  accent = "primary",
}: {
  icon: ElementType;
  label: string;
  value: number;
  accent?: "primary" | "accent" | "warning" | "urgent";
}) {
  const accentClass =
    accent === "accent" ? "text-accent" : accent === "warning" ? "text-warning" : accent === "urgent" ? "text-urgent" : "text-primary";

  return (
    <div className="rounded-2xl border border-border/70 bg-card/90 p-4 shadow-card">
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${accentClass}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-3xl font-bold text-foreground tabular-nums">{value}</p>
    </div>
  );
}

function InsightList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: Array<{ label: string; value: number }>;
  emptyText: string;
}) {
  return (
    <div className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-card">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-2xl bg-background px-4 py-3">
              <span className="text-sm text-foreground">{item.label}</span>
              <span className="text-sm font-semibold text-foreground tabular-nums">{item.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}

function riskColorClass(color: string) {
  if (color === "urgent") return "bg-urgent";
  if (color === "warning") return "bg-warning";
  if (color === "accent") return "bg-accent";
  return "bg-primary";
}
