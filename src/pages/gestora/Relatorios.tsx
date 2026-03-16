import { useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { formatDate, getOrganizationName } from "@/lib/domain";

export default function Relatorios() {
  const { data, isLoading } = useQuery({
    queryKey: ["manager-report-summary"],
    queryFn: api.getManagerReportSummary,
  });

  const reports = [
    { title: "Resumo Geral de Casos", desc: "Exporta a base consolidada de casos", type: "geral" },
    { title: "Casos por Nivel de Risco", desc: "Distribuicao dos casos por classificacao de risco", type: "risco" },
    { title: "Atendimentos Realizados", desc: "Exporta historico para analise operacional", type: "atendimentos" },
    { title: "Encaminhamentos", desc: "Exporta fluxo entre orgaos da rede", type: "encaminhamentos" },
  ];

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
    <AppLayout title="Relatorios">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Relatorios e indicadores para acompanhamento da rede de protecao.</p>

        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.type} className="bg-card p-4 rounded-2xl shadow-card">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{report.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{report.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleExport(report.type)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all shrink-0"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card p-5 rounded-2xl shadow-card mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Ultimos casos registrados</h3>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <div className="space-y-3">
              {data?.casosRecentes.slice(0, 5).map((caso) => (
                <div key={caso.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{caso.nomeSocial || caso.nomeCompleto}</p>
                    <p className="text-xs text-muted-foreground">
                      {getOrganizationName(caso.orgaoEntrada)} - {formatDate(caso.dataPrimeiroAtendimento)}
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {caso.situacaoRisco}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
