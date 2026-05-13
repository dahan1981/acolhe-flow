import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ClipboardList, Filter, Shield, TimerReset } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { api } from "@/lib/api";
import { formatDate, getOrganizationName } from "@/lib/domain";

const queueFilters = [
  { value: "todos", label: "Todos" },
  { value: "alto", label: "Risco alto" },
  { value: "em_andamento", label: "Em andamento" },
] as const;

export default function ProfissionalWorkspace() {
  const [activeFilter, setActiveFilter] = useState<(typeof queueFilters)[number]["value"]>("todos");
  const { data, isLoading } = useQuery({
    queryKey: ["cases", "", "todos"],
    queryFn: () => api.getCases("", "todos"),
  });

  const filteredCases = useMemo(() => {
    const items = data?.casos ?? [];
    if (activeFilter === "alto") return items.filter((item) => item.situacaoRisco === "alto" || item.situacaoRisco === "critico");
    if (activeFilter === "em_andamento") return items.filter((item) => item.status === "em_andamento");
    return items;
  }, [activeFilter, data?.casos]);

  return (
    <AppLayout title="Fila operacional" subtitle="Distribuição de casos, prioridades e leitura rápida do contexto assistencial.">
      <div className="space-y-5">
        <section className="rounded-[28px] border border-white/60 bg-card/90 p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <ClipboardList className="h-3.5 w-3.5" />
                Operação do dia
              </div>
              <h2 className="text-xl font-semibold text-foreground">Casos em acompanhamento</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Use os filtros para acompanhar triagem, prioridade e contexto do atendimento em curso.
              </p>
            </div>
            <div className="rounded-2xl bg-background px-3 py-2 shadow-card">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Fila</p>
              <p className="text-lg font-semibold text-foreground">{filteredCases.length}</p>
            </div>
          </div>
        </section>

        <section className="flex gap-2 overflow-x-auto pb-1">
          {queueFilters.map((option) => (
            <button
              key={option.value}
              onClick={() => setActiveFilter(option.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeFilter === option.value
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "border border-border/70 bg-card/80 text-muted-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </section>

        <section className="grid gap-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando fila...</p>
          ) : (
            filteredCases.slice(0, 5).map((item) => (
              <article key={item.id} className="rounded-[24px] border border-border/70 bg-card/90 p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.nomeSocial || item.nomeCompleto}</p>
                    <p className="text-xs text-muted-foreground">Protocolo #{item.protocolo}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge type="status" value={item.status} />
                  <StatusBadge type="risk" value={item.situacaoRisco} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div className="rounded-2xl bg-background px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.16em]">Entrada</p>
                    <p>{getOrganizationName(item.orgaoEntrada)}</p>
                  </div>
                  <div className="rounded-2xl bg-background px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.16em]">Primeiro registro</p>
                    <p>{formatDate(item.dataPrimeiroAtendimento)}</p>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[24px] border border-border/70 bg-card/90 p-4 shadow-card">
            <div className="mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Histórico assistido</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              A timeline do detalhe do caso resume solicitações, atendimentos e encaminhamentos para facilitar continuidade de atendimento.
            </p>
          </div>
          <div className="rounded-[24px] border border-border/70 bg-card/90 p-4 shadow-card">
            <div className="mb-2 flex items-center gap-2">
              <TimerReset className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Ritmo operacional</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              O ambiente foi organizado para consultas rápidas, transição entre telas e registro de ação com o menor atrito visual.
            </p>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
