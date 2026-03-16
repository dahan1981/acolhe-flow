import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { mulheres } from '@/data/mock-data';
import { CaseCard } from '@/components/shared/CaseCard';
import { Search } from 'lucide-react';

export default function CaseList() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('todos');

  const filtered = mulheres.filter(m => {
    const matchSearch = search === '' ||
      m.nomeCompleto.toLowerCase().includes(search.toLowerCase()) ||
      m.nomeSocial?.toLowerCase().includes(search.toLowerCase()) ||
      m.cpf.includes(search) ||
      m.protocolo.includes(search);
    const matchFilter = filter === 'todos' || m.status === filter;
    return matchSearch && matchFilter;
  });

  const filters = [
    { value: 'todos', label: 'Todos' },
    { value: 'ativo', label: 'Ativos' },
    { value: 'em_andamento', label: 'Em andamento' },
    { value: 'encaminhado', label: 'Encaminhados' },
    { value: 'resolvido', label: 'Resolvidos' },
  ];

  return (
    <AppLayout title="Casos">
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou protocolo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card rounded-xl border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <p className="text-xs text-muted-foreground">{filtered.length} caso(s) encontrado(s)</p>
        <div className="space-y-3">
          {filtered.map(m => (
            <CaseCard key={m.id} mulher={m} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
