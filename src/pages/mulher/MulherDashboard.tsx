import { AppLayout } from '@/components/layout/AppLayout';
import { mulheres, getAtendimentosByMulher, getEncaminhamentosByMulher, getOrgaoNome, formatDate } from '@/data/mock-data';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Shield, Clock, ArrowRight, Bell } from 'lucide-react';

// For demo: the mulher sees her own case (m1)
const meuCaso = mulheres[0];
const meusAtendimentos = getAtendimentosByMulher('m1');
const meusEncaminhamentos = getEncaminhamentosByMulher('m1');

export default function MulherDashboard() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Status Card */}
        <div className="bg-card p-5 rounded-2xl shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status do seu caso</p>
              <p className="font-semibold text-foreground">Protocolo #{meuCaso.protocolo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <StatusBadge type="status" value={meuCaso.status} />
            <StatusBadge type="risk" value={meuCaso.situacaoRisco} />
          </div>
          <p className="text-sm text-muted-foreground">
            Seu caso está sendo acompanhado pelo {getOrgaoNome(meusAtendimentos[0]?.orgao || meuCaso.orgaoEntrada)}.
            O último registro foi em {formatDate(meusAtendimentos[0]?.data || meuCaso.dataPrimeiroAtendimento)}.
          </p>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">O que você precisa?</h2>
          <div className="grid grid-cols-2 gap-3">
            {['Apoio Jurídico', 'Saúde', 'Abrigo', 'Assistência Social'].map((item) => (
              <button
                key={item}
                className="bg-card p-4 rounded-2xl shadow-card hover:shadow-card-hover transition-all text-left active:scale-[0.98]"
              >
                <p className="text-sm font-medium text-foreground">{item}</p>
                <p className="text-xs text-muted-foreground mt-1">Solicitar apoio</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Atividade recente</h2>
          <div className="space-y-3">
            {meusAtendimentos.slice(0, 3).map(a => (
              <div key={a.id} className="bg-card p-4 rounded-2xl shadow-card">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{formatDate(a.data)}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{a.tipoAtendimento}</p>
                <p className="text-xs text-muted-foreground mt-1">{getOrgaoNome(a.orgao)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Transparency: who accessed */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Quem acessou seu caso</h2>
          <div className="bg-card p-4 rounded-2xl shadow-card space-y-3">
            {meusEncaminhamentos.map(e => (
              <div key={e.id} className="flex items-center gap-3">
                <ArrowRight className="w-4 h-4 text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{getOrgaoNome(e.orgaoDestino)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(e.data)}</p>
                </div>
                <StatusBadge type="encaminhamento" value={e.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
