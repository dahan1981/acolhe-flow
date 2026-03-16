import { AppLayout } from '@/components/layout/AppLayout';
import { getStats } from '@/data/mock-data';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Users, AlertTriangle, ArrowRight, Activity, TrendingUp, Clock } from 'lucide-react';

const stats = getStats();

export default function GestoraDashboard() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Main KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card p-4 rounded-2xl shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total de casos</span>
            </div>
            <p className="text-3xl font-bold text-foreground tabular-nums">{stats.total}</p>
          </div>
          <div className="bg-card p-4 rounded-2xl shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Atendimentos</span>
            </div>
            <p className="text-3xl font-bold text-foreground tabular-nums">{stats.totalAtendimentos}</p>
          </div>
          <div className="bg-card p-4 rounded-2xl shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="text-xs text-muted-foreground">Casos ativos</span>
            </div>
            <p className="text-3xl font-bold text-foreground tabular-nums">{stats.ativos}</p>
          </div>
          <div className="bg-card p-4 rounded-2xl shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-urgent" />
              <span className="text-xs text-muted-foreground">Enc. pendentes</span>
            </div>
            <p className="text-3xl font-bold text-foreground tabular-nums">{stats.encaminhamentosPendentes}</p>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-card p-5 rounded-2xl shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Casos por status</h3>
          <div className="space-y-3">
            {[
              { label: 'Ativos', count: stats.ativos, total: stats.total, className: 'bg-urgent' },
              { label: 'Em andamento', count: stats.emAndamento, total: stats.total, className: 'bg-primary' },
              { label: 'Encaminhados', count: stats.encaminhados, total: stats.total, className: 'bg-warning' },
              { label: 'Resolvidos', count: stats.resolvidos, total: stats.total, className: 'bg-accent' },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-medium text-foreground tabular-nums">{s.count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${s.className}`}
                    style={{ width: `${(s.count / stats.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-card p-5 rounded-2xl shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Distribuição de risco</h3>
          <div className="grid grid-cols-2 gap-3">
            {stats.porRisco.map(r => (
              <div key={r.nivel} className="flex items-center gap-3 p-3 bg-background rounded-xl">
                <div className={`w-3 h-3 rounded-full bg-${r.cor}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{r.nivel}</p>
                  <p className="text-lg font-bold text-foreground tabular-nums">{r.total}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Órgão */}
        <div className="bg-card p-5 rounded-2xl shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Entrada por órgão</h3>
          <div className="space-y-3">
            {stats.porOrgao.map(o => (
              <div key={o.sigla} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{o.sigla}</span>
                  </div>
                  <span className="text-sm text-foreground">{o.orgao}</span>
                </div>
                <span className="text-sm font-semibold text-foreground tabular-nums">{o.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
