import { AppLayout } from '@/components/layout/AppLayout';
import { mulheres, atendimentos, getOrgaoNome } from '@/data/mock-data';
import { CaseCard } from '@/components/shared/CaseCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FileText, Users, ArrowRight, Clock } from 'lucide-react';

const casosAtivos = mulheres.filter(m => m.status === 'ativo' || m.status === 'em_andamento');
const ultimosAtendimentos = [...atendimentos].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 3);

export default function ProfissionalDashboard() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card p-4 rounded-2xl shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Casos ativos</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{casosAtivos.length}</p>
          </div>
          <div className="bg-card p-4 rounded-2xl shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Atendimentos hoje</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">3</p>
          </div>
        </div>

        {/* Priority Cases */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Casos prioritários</h2>
          </div>
          <div className="space-y-3">
            {mulheres
              .filter(m => m.situacaoRisco === 'critico' || m.situacaoRisco === 'alto')
              .slice(0, 3)
              .map(m => (
                <CaseCard key={m.id} mulher={m} />
              ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Últimos atendimentos</h2>
          <div className="space-y-3">
            {ultimosAtendimentos.map(a => {
              const mulher = mulheres.find(m => m.id === a.mulherId);
              return (
                <div key={a.id} className="bg-card p-4 rounded-2xl shadow-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{a.data}</span>
                    <StatusBadge type="risk" value={a.riscoIdentificado} />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {mulher?.nomeSocial || mulher?.nomeCompleto}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {a.tipoAtendimento} — {getOrgaoNome(a.orgao)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
