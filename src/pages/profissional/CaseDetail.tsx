import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { getMulherById, getAtendimentosByMulher, getEncaminhamentosByMulher, getOrgaoNome, formatDate } from '@/data/mock-data';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Timeline } from '@/components/shared/Timeline';
import { User, Phone, MapPin, Calendar, FileText, PlusCircle, ArrowRight } from 'lucide-react';

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const mulher = getMulherById(id || '');

  if (!mulher) {
    return (
      <AppLayout title="Caso não encontrado" showBack>
        <p className="text-muted-foreground text-center py-12">Caso não encontrado.</p>
      </AppLayout>
    );
  }

  const atendimentos = getAtendimentosByMulher(mulher.id);
  const encaminhamentos = getEncaminhamentosByMulher(mulher.id);

  return (
    <AppLayout title={`#${mulher.protocolo}`} showBack>
      <div className="space-y-4">
        {/* Header Card */}
        <div className="bg-card p-5 rounded-2xl shadow-card">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-foreground">{mulher.nomeCompleto}</h2>
              {mulher.nomeSocial && (
                <p className="text-sm text-muted-foreground">Nome social: {mulher.nomeSocial}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            <StatusBadge type="status" value={mulher.status} />
            <StatusBadge type="risk" value={mulher.situacaoRisco} />
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 shrink-0" />
              <span>CPF: {mulher.cpf}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 shrink-0" />
              <span>{mulher.telefone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{mulher.endereco}, {mulher.municipio}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Primeiro atendimento: {formatDate(mulher.dataPrimeiroAtendimento)}</span>
            </div>
          </div>
        </div>

        {/* Observations */}
        <div className="bg-card p-4 rounded-2xl shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-2">Observações iniciais</h3>
          <p className="text-sm text-muted-foreground">{mulher.observacoesIniciais}</p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate(`/profissional/novo-atendimento?mulherId=${mulher.id}`)}
            className="flex items-center gap-2 bg-primary text-primary-foreground p-3 rounded-2xl font-medium text-sm shadow-card active:scale-[0.98] transition-all justify-center"
          >
            <PlusCircle className="w-4 h-4" />
            Atendimento
          </button>
          <button
            onClick={() => navigate(`/profissional/novo-encaminhamento?mulherId=${mulher.id}`)}
            className="flex items-center gap-2 bg-accent text-accent-foreground p-3 rounded-2xl font-medium text-sm shadow-card active:scale-[0.98] transition-all justify-center"
          >
            <ArrowRight className="w-4 h-4" />
            Encaminhar
          </button>
        </div>

        {/* Timeline */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Histórico ({atendimentos.length + encaminhamentos.length} registros)
          </h3>
          <Timeline atendimentos={atendimentos} encaminhamentos={encaminhamentos} />
        </div>
      </div>
    </AppLayout>
  );
}
