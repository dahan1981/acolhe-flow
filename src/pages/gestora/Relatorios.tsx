import { AppLayout } from '@/components/layout/AppLayout';
import { getStats, mulheres, atendimentos, encaminhamentos, getOrgaoNome, formatDate } from '@/data/mock-data';
import { FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

const stats = getStats();

export default function Relatorios() {
  const handleExport = (type: string) => {
    toast.success(`Relatório "${type}" gerado com sucesso!`, {
      description: 'O download será iniciado em instantes.',
    });
  };

  const reports = [
    { title: 'Resumo Geral de Casos', desc: `${stats.total} casos registrados no sistema`, type: 'geral' },
    { title: 'Casos por Nível de Risco', desc: 'Distribuição dos casos por classificação de risco', type: 'risco' },
    { title: 'Atendimentos Realizados', desc: `${stats.totalAtendimentos} atendimentos no período`, type: 'atendimentos' },
    { title: 'Encaminhamentos', desc: `${encaminhamentos.length} encaminhamentos registrados`, type: 'encaminhamentos' },
    { title: 'Tempo Médio de Resposta', desc: 'Análise do tempo entre registro e primeiro atendimento', type: 'tempo' },
    { title: 'Casos por Órgão', desc: 'Volume de entrada por órgão da rede', type: 'orgaos' },
  ];

  return (
    <AppLayout title="Relatórios">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Relatórios e indicadores para acompanhamento da rede de proteção.
        </p>

        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.type} className="bg-card p-4 rounded-2xl shadow-card">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleExport(r.title)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all shrink-0"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Table */}
        <div className="bg-card p-5 rounded-2xl shadow-card mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Últimos casos registrados</h3>
          <div className="space-y-3">
            {mulheres.slice(0, 5).map(m => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{m.nomeSocial || m.nomeCompleto}</p>
                  <p className="text-xs text-muted-foreground">{getOrgaoNome(m.orgaoEntrada)} · {formatDate(m.dataPrimeiroAtendimento)}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  m.situacaoRisco === 'critico' ? 'bg-urgent/15 text-urgent' :
                  m.situacaoRisco === 'alto' ? 'bg-warning/15 text-warning' :
                  m.situacaoRisco === 'medio' ? 'bg-primary/15 text-primary' :
                  'bg-accent/15 text-accent'
                }`}>
                  {m.situacaoRisco}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
