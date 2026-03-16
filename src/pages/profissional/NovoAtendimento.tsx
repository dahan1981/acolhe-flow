import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { mulheres, orgaos, getMulherById } from '@/data/mock-data';
import { toast } from 'sonner';

export default function NovoAtendimento() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mulherId = searchParams.get('mulherId') || '';
  const mulher = getMulherById(mulherId);

  const [form, setForm] = useState({
    mulherId: mulherId,
    tipoAtendimento: '',
    resumo: '',
    riscoIdentificado: 'medio',
    necessidadeEncaminhamento: false,
    proximosPassos: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Atendimento registrado com sucesso!', {
      description: `Protocolo #${mulher?.protocolo || '—'}`,
    });
    navigate(-1);
  };

  const tipos = [
    'Acolhimento Inicial',
    'Acompanhamento Social',
    'Atendimento Psicológico',
    'Orientação Jurídica',
    'Registro de Ocorrência',
    'Acolhimento em Abrigo',
    'Visita Domiciliar',
    'Reavaliação de Risco',
  ];

  return (
    <AppLayout title="Novo Atendimento" showBack>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mulher Selector */}
        <div>
          <label className="text-sm font-medium text-foreground">Mulher atendida</label>
          {mulher ? (
            <div className="mt-1 bg-card p-3 rounded-xl shadow-card">
              <p className="text-sm font-medium text-foreground">{mulher.nomeSocial || mulher.nomeCompleto}</p>
              <p className="text-xs text-muted-foreground">Protocolo #{mulher.protocolo}</p>
            </div>
          ) : (
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
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Tipo de atendimento</label>
          <select
            value={form.tipoAtendimento}
            onChange={e => setForm({ ...form, tipoAtendimento: e.target.value })}
            className="mt-1 w-full p-3 bg-card rounded-xl border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          >
            <option value="">Selecione...</option>
            {tipos.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Resumo do atendimento</label>
          <textarea
            value={form.resumo}
            onChange={e => setForm({ ...form, resumo: e.target.value })}
            placeholder="Descreva o que foi tratado neste atendimento..."
            rows={4}
            className="mt-1 w-full p-3 bg-card rounded-xl border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Risco identificado</label>
          <div className="mt-2 flex gap-2 flex-wrap">
            {['baixo', 'medio', 'alto', 'critico'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setForm({ ...form, riscoIdentificado: r })}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  form.riscoIdentificado === r
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground border border-border'
                }`}
              >
                {r === 'baixo' ? 'Baixo' : r === 'medio' ? 'Médio' : r === 'alto' ? 'Alto' : 'Crítico'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Próximos passos</label>
          <textarea
            value={form.proximosPassos}
            onChange={e => setForm({ ...form, proximosPassos: e.target.value })}
            placeholder="O que deve acontecer a seguir..."
            rows={3}
            className="mt-1 w-full p-3 bg-card rounded-xl border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        <div className="flex items-center gap-3 bg-card p-4 rounded-xl shadow-card">
          <input
            type="checkbox"
            id="encaminhamento"
            checked={form.necessidadeEncaminhamento}
            onChange={e => setForm({ ...form, necessidadeEncaminhamento: e.target.checked })}
            className="w-5 h-5 rounded border-border text-primary focus:ring-primary/20"
          />
          <label htmlFor="encaminhamento" className="text-sm text-foreground">
            Necessita encaminhamento para outro órgão
          </label>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-semibold text-base shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all"
        >
          Registrar Atendimento
        </button>
      </form>
    </AppLayout>
  );
}
