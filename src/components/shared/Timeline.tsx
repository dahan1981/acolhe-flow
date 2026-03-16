import { type Atendimento, type Encaminhamento, getOrgaoNome, formatDate } from '@/data/mock-data';
import { StatusBadge } from './StatusBadge';
import { FileText, ArrowRight } from 'lucide-react';

interface TimelineProps {
  atendimentos: Atendimento[];
  encaminhamentos: Encaminhamento[];
}

type TimelineItem = {
  id: string;
  type: 'atendimento' | 'encaminhamento';
  data: string;
  item: Atendimento | Encaminhamento;
};

export function Timeline({ atendimentos, encaminhamentos }: TimelineProps) {
  const items: TimelineItem[] = [
    ...atendimentos.map(a => ({ id: a.id, type: 'atendimento' as const, data: a.data, item: a })),
    ...encaminhamentos.map(e => ({ id: e.id, type: 'encaminhamento' as const, data: e.data, item: e })),
  ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum registro encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((entry, i) => (
        <div key={entry.id} className="relative pl-6">
          <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-primary/20 border-2 border-primary" />
          {i < items.length - 1 && (
            <div className="absolute left-[5px] top-5 w-0.5 h-full bg-border" />
          )}
          {entry.type === 'atendimento' ? (
            <AtendimentoCard atendimento={entry.item as Atendimento} />
          ) : (
            <EncaminhamentoCard encaminhamento={entry.item as Encaminhamento} />
          )}
        </div>
      ))}
    </div>
  );
}

function AtendimentoCard({ atendimento }: { atendimento: Atendimento }) {
  return (
    <div className="bg-card p-4 rounded-xl shadow-card">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium text-primary uppercase tracking-wider">Atendimento</span>
        <span className="text-xs text-muted-foreground ml-auto">{formatDate(atendimento.data)}</span>
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{atendimento.tipoAtendimento}</p>
      <p className="text-sm text-muted-foreground mb-2">{atendimento.resumo}</p>
      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
        <span>{atendimento.profissionalResponsavel}</span>
        <span>•</span>
        <span>{getOrgaoNome(atendimento.orgao)}</span>
        <span>•</span>
        <StatusBadge type="risk" value={atendimento.riscoIdentificado} />
      </div>
    </div>
  );
}

function EncaminhamentoCard({ encaminhamento }: { encaminhamento: Encaminhamento }) {
  return (
    <div className="bg-card p-4 rounded-xl shadow-card border-l-4 border-l-accent">
      <div className="flex items-center gap-2 mb-2">
        <ArrowRight className="w-4 h-4 text-accent" />
        <span className="text-xs font-medium text-accent uppercase tracking-wider">Encaminhamento</span>
        <span className="text-xs text-muted-foreground ml-auto">{formatDate(encaminhamento.data)}</span>
      </div>
      <p className="text-sm font-medium text-foreground mb-1">
        → {getOrgaoNome(encaminhamento.orgaoDestino)}
      </p>
      <p className="text-sm text-muted-foreground mb-2">{encaminhamento.motivo}</p>
      <div className="flex items-center gap-2">
        <StatusBadge type="priority" value={encaminhamento.prioridade} />
        <StatusBadge type="encaminhamento" value={encaminhamento.status} />
      </div>
    </div>
  );
}
