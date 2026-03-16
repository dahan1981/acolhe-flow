import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { mulheres, orgaos, getMulherById } from '@/data/mock-data';
import { toast } from 'sonner';

export default function NovoEncaminhamento() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mulherId = searchParams.get('mulherId') || '';
  const mulher = getMulherById(mulherId);

  const [form, setForm] = useState({
    mulherId: mulherId,
    orgaoDestino: '',
    motivo: '',
    prioridade: 'media',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Encaminhamento registrado com sucesso!', {
      description: `Caso encaminhado para ${orgaos.find(o => o.id === form.orgaoDestino)?.nome || form.orgaoDestino}`,
    });
    navigate(-1);
  };

  return (
    <AppLayout title="Novo Encaminhamento" showBack>
      <form onSubmit={handleSubmit} className="space-y-4">
        {mulher ? (
          <div>
            <label className="text-sm font-medium text-foreground">Caso</label>
            <div className="mt-1 bg-card p-3 rounded-xl shadow-card">
              <p className="text-sm font-medium text-foreground">{mulher.nomeSocial || mulher.nomeCompleto}</p>
              <p className="text-xs text-muted-foreground">Protocolo #{mulher.protocolo}</p>
            </div>
          </div>
        ) : (
          <div>
            <label className="text-sm font-medium text-foreground">Mulher atendida</label>
            <select
              value={form.mulherId}
              onChange={e => setForm({ ...form, mulherId: e.target.value })}
              className="mt-1 w-full p-3 bg-card rounded-xl border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            >
              <option value="">Selecione...</option>
              {mulheres.map(m => (
                <option key={m.id} value={m.id}>{m.nomeSocial || m.nomeCompleto} — #{m.protocolo}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-foreground">Órgão de destino</label>
          <select
            value={form.orgaoDestino}
            onChange={e => setForm({ ...form, orgaoDestino: e.target.value })}
            className="mt-1 w-full p-3 bg-card rounded-xl border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          >
            <option value="">Selecione...</option>
            {orgaos.map(o => (
              <option key={o.id} value={o.id}>{o.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Motivo do encaminhamento</label>
          <textarea
            value={form.motivo}
            onChange={e => setForm({ ...form, motivo: e.target.value })}
            placeholder="Descreva o motivo do encaminhamento..."
            rows={4}
            className="mt-1 w-full p-3 bg-card rounded-xl border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Prioridade</label>
          <div className="mt-2 flex gap-2 flex-wrap">
            {[
              { v: 'baixa', l: 'Baixa' },
              { v: 'media', l: 'Média' },
              { v: 'alta', l: 'Alta' },
              { v: 'urgente', l: 'Urgente' },
            ].map(p => (
              <button
                key={p.v}
                type="button"
                onClick={() => setForm({ ...form, prioridade: p.v })}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  form.prioridade === p.v
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground border border-border'
                }`}
              >
                {p.l}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-accent text-accent-foreground rounded-2xl font-semibold text-base shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all"
        >
          Registrar Encaminhamento
        </button>
      </form>
    </AppLayout>
  );
}
