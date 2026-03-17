import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FilePlus2, Search, Stethoscope } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { CaseCard } from "@/components/shared/CaseCard";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export default function CaseList() {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("todos");
  const [violenceFilter, setViolenceFilter] = useState<string>("todos");

  const { data, isLoading } = useQuery({
    queryKey: ["cases", search, filter, currentUser?.perfil],
    queryFn: () => api.getCases(search, filter),
  });

  const basePath = currentUser?.perfil === "gestora" ? "/gestora" : "/profissional";
  const title = currentUser?.perfil === "gestora" ? "Casos monitorados" : "Casos em atendimento";
  const actionsBasePath = currentUser?.perfil === "gestora" ? "/gestora" : "/profissional";
  const actionsLabel = currentUser?.perfil === "gestora" ? "Fluxo de gestao" : "Fluxo operacional";

  const filters = [
    { value: "todos", label: "Todos" },
    { value: "ativo", label: "Triagem" },
    { value: "em_andamento", label: "Em andamento" },
    { value: "encaminhado", label: "Encaminhados" },
    { value: "resolvido", label: "Concluidos" },
  ];

  const violenceFilters = [
    { value: "todos", label: "Todos os tipos" },
    { value: "violencia_fisica", label: "Fisica" },
    { value: "violencia_psicologica", label: "Psicologica" },
    { value: "violencia_moral", label: "Moral" },
    { value: "violencia_sexual", label: "Sexual" },
    { value: "violencia_patrimonial", label: "Patrimonial" },
  ];

  const filteredCases = useMemo(() => {
    const items = data?.casos ?? [];
    if (violenceFilter === "todos") return items;
    return items.filter((item) => (item.tiposViolencia ?? []).includes(violenceFilter as never));
  }, [data?.casos, violenceFilter]);

  return (
    <AppLayout
      title={title}
      subtitle="Acompanhe casos, protocolos e movimentacoes com filtros claros e acoes principais em destaque."
    >
      <div className="space-y-4 pb-28">
        <section className="rounded-[26px] border border-primary/15 bg-card/95 p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{actionsLabel}</p>
              <h3 className="text-sm font-semibold text-foreground">Proximo passo da equipe</h3>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">Acoes principais</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate(`${actionsBasePath}/novo-protocolo`)}
              className="flex items-center gap-3 rounded-[22px] bg-primary px-4 py-4 text-left text-primary-foreground shadow-card transition-all hover:shadow-card-hover"
            >
              <FilePlus2 className="h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Gerar protocolo</p>
                <p className="text-xs text-primary-foreground/80">Abrir um novo caso com dados iniciais</p>
              </div>
            </button>
            <button
              onClick={() => navigate(`${actionsBasePath}/novo-atendimento`)}
              className="flex items-center gap-3 rounded-[22px] border border-border/70 bg-background px-4 py-4 text-left shadow-card transition-all hover:shadow-card-hover"
            >
              <Stethoscope className="h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-semibold text-foreground">Registrar atendimento</p>
                <p className="text-xs text-muted-foreground">Selecionar caso existente e salvar atendimento</p>
              </div>
            </button>
          </div>
        </section>

        <section className="rounded-[24px] border border-border/70 bg-card/90 p-4 shadow-card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF, protocolo ou tipo de violencia"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-2xl border border-border bg-background pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {filters.map((item) => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                  filter === item.value ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {violenceFilters.map((item) => (
              <button
                key={item.value}
                onClick={() => setViolenceFilter(item.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                  violenceFilter === item.value ? "bg-warning text-warning-foreground" : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{isLoading ? "Atualizando lista..." : `${filteredCases.length} caso(s) localizado(s)`}</span>
          <span>{currentUser?.perfil === "gestora" ? "Visao consolidada da rede" : "Fila da equipe responsavel"}</span>
        </div>

        <div className="space-y-3">
          {filteredCases.map((caso) => (
            <CaseCard key={caso.id} caso={caso} basePath={basePath} />
          ))}
        </div>

        {!isLoading && filteredCases.length === 0 ? (
          <section className="rounded-[24px] border border-dashed border-border/70 bg-card/80 p-6 text-center shadow-card">
            <p className="text-sm font-semibold text-foreground">Nenhum caso encontrado com os filtros aplicados</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Revise a busca, troque o status selecionado ou registre um novo protocolo para iniciar outro acompanhamento.
            </p>
          </section>
        ) : null}
      </div>
    </AppLayout>
  );
}
