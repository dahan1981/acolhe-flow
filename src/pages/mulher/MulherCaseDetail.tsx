import { AppLayout } from '@/components/layout/AppLayout';
import { mulheres, getAtendimentosByMulher, getEncaminhamentosByMulher } from '@/data/mock-data';
import { Timeline } from '@/components/shared/Timeline';

const meuCaso = mulheres[0];
const atendimentos = getAtendimentosByMulher('m1');
const encaminhamentos = getEncaminhamentosByMulher('m1');

export default function MulherCaseDetail() {
  return (
    <AppLayout title="Meu Caso" showBack>
      <div className="space-y-4">
        <div className="bg-card p-4 rounded-2xl shadow-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Protocolo #{meuCaso.protocolo}</p>
          <h2 className="text-lg font-semibold text-foreground mt-1">{meuCaso.nomeCompleto}</h2>
          <p className="text-sm text-muted-foreground mt-2">{meuCaso.observacoesIniciais}</p>
        </div>

        <h3 className="text-sm font-semibold text-foreground">Histórico completo</h3>
        <Timeline atendimentos={atendimentos} encaminhamentos={encaminhamentos} />
      </div>
    </AppLayout>
  );
}
