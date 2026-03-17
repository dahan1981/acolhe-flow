import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { ethnicityLabel, formatDate, getOrganizationName, violenceTypeLabel } from "@/lib/domain";

export default function Relatorios() {
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["manager-report-summary"],
    queryFn: api.getManagerReportSummary,
  });

  const { data: managerData, isLoading: isManagerLoading } = useQuery({
    queryKey: ["manager-dashboard"],
    queryFn: api.getManagerDashboard,
  });

  const reports = [
    { title: "Base consolidada de casos", desc: "Exporta identificadores, status e orgao atual de cada caso.", type: "geral" },
    { title: "Classificacao de risco", desc: "Resumo dos casos distribuidos por nivel de risco.", type: "risco" },
    { title: "Atendimentos realizados", desc: "Historico de atendimentos para leitura operacional.", type: "atendimentos" },
    { title: "Encaminhamentos da rede", desc: "Fluxo de distribuicao entre orgaos participantes.", type: "encaminhamentos" },
  ];

  const stats = managerData?.stats;

  const evolution = useMemo(
    () => [...(stats?.porPeriodo ?? [])].sort((a, b) => a.periodo.localeCompare(b.periodo)).slice(-6),
    [stats?.porPeriodo],
  );

  const violence = useMemo(
    () => [...(stats?.porViolencia ?? [])].sort((a, b) => b.total - a.total),
    [stats?.porViolencia],
  );

  const ethnicity = useMemo(
    () => [...(stats?.porEtnia ?? [])].sort((a, b) => b.total - a.total),
    [stats?.porEtnia],
  );

  const referralDistribution = useMemo(
    () => [...(stats?.distribuicaoEncaminhamentos ?? [])].sort((a, b) => b.total - a.total).slice(0, 5),
    [stats?.distribuicaoEncaminhamentos],
  );

  async function handleExport(type: string) {
    try {
      const blob = await api.downloadManagerReport(type);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `relatorio-${type}.csv`;
      anchor.click();
      window.URL.revokeObjectURL(url);
      toast.success("Relatorio exportado com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel exportar o relatorio.");
    }
  }

  return (
    <AppLayout title="Relatorios e indicadores" subtitle="Acompanhe volume, tendencias e distribuicoes consolidadas da fase piloto.">
      <div className="space-y-5">
        <section className="rounded-[28px] border border-white/60 bg-card/90 p-5 shadow-card">
          <h2 className="text-xl font-semibold text-foreground">Monitoramento consolidado</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Os paineis abaixo organizam volume de casos, tipos de violencia, recorte por etnia/cor, distribuicao entre orgaos e ritmo de evolucao recente.
          </p>
        </section>

        <section className="space-y-3">
          {reports.map((report) => (
            <div key={report.type} className="rounded-[24px] border border-border/70 bg-card/90 p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-1 items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{report.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{report.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleExport(report.type)}
                  className="rounded-xl p-2 text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary"
                >
                  <Download className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-card">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Evolucao por periodo</h3>
            {isManagerLoading ? (
              <p className="text-sm text-muted-foreground">Atualizando indicadores...</p>
            ) : evolution.length ? (
              <div className="space-y-3">
                {evolution.map((item) => (
                  <div key={item.periodo}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.periodo}</span>
                      <span className="font-medium text-foreground">{item.total}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(item.total * 12, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Ainda nao ha volume suficiente para consolidar a serie recente.</p>
            )}
          </div>

          <div className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-card">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Distribuicao de encaminhamentos</h3>
            {referralDistribution.length ? (
              <div className="space-y-3">
                {referralDistribution.map((item) => (
                  <div key={item.orgao} className="flex items-center justify-between rounded-2xl bg-background px-4 py-3">
                    <span className="text-sm text-foreground">{getOrganizationName(item.orgao)}</span>
                    <span className="text-sm font-semibold text-foreground">{item.total}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum encaminhamento consolidado no momento.</p>
            )}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-card">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Tipos de violencia</h3>
            {violence.length ? (
              <div className="space-y-3">
                {violence.map((item) => (
                  <div key={item.tipo} className="flex items-center justify-between rounded-2xl bg-background px-4 py-3">
                    <span className="text-sm text-foreground">{violenceTypeLabel(item.tipo)}</span>
                    <span className="text-sm font-semibold text-foreground">{item.total}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nao ha dados suficientes para compor o recorte por tipo de violencia.</p>
            )}
          </div>

          <div className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-card">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Etnia/cor</h3>
            {ethnicity.length ? (
              <div className="space-y-3">
                {ethnicity.map((item) => (
                  <div key={item.etnia} className="flex items-center justify-between rounded-2xl bg-background px-4 py-3">
                    <span className="text-sm text-foreground">{ethnicityLabel(item.etnia)}</span>
                    <span className="text-sm font-semibold text-foreground">{item.total}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nao ha dados suficientes para compor o recorte por etnia/cor.</p>
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-card">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Casos com movimentacao recente</h3>
          {isSummaryLoading ? (
            <p className="text-sm text-muted-foreground">Carregando lista recente...</p>
          ) : summary?.casosRecentes.length ? (
            <div className="space-y-3">
              {summary.casosRecentes.slice(0, 6).map((caso) => (
                <div key={caso.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{caso.nomeSocial || caso.nomeCompleto}</p>
                    <p className="text-xs text-muted-foreground">
                      {getOrganizationName(caso.orgaoEntrada)} • {formatDate(caso.dataPrimeiroAtendimento)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{caso.protocolo}</p>
                    <p className="text-xs text-muted-foreground">{caso.situacaoRisco}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum caso recente disponivel para exibicao.</p>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
