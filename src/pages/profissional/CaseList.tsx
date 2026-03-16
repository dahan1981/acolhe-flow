import { useState } from "react";
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

  const { data, isLoading } = useQuery({
    queryKey: ["cases", search, filter, currentUser?.perfil],
    queryFn: () => api.getCases(search, filter),
  });

  const basePath = currentUser?.perfil === "gestora" ? "/gestora" : "/profissional";
  const title = currentUser?.perfil === "gestora" ? "Visao geral de casos" : "Casos em atendimento";
  const actionsBasePath = currentUser?.perfil === "gestora" ? "/gestora" : "/profissional";
  const actionsLabel =
    currentUser?.perfil === "gestora"
      ? "Acoes rapidas da gestao"
      : "Acoes rapidas da responsavel";

  const filters = [
    { value: "todos", label: "Todos" },
    { value: "ativo", label: "Ativos" },
    { value: "em_andamento", label: "Em andamento" },
    { value: "encaminhado", label: "Encaminhados" },
    { value: "resolvido", label: "Resolvidos" },
  ];

  return (
    <AppLayout title={title} subtitle="Casos novos e atualizados aparecem aqui conforme a demonstracao e os filtros ativos.">
      <div className="space-y-4 pb-36">
        <div className="rounded-[26px] border border-primary/15 bg-card/95 p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{actionsLabel}</p>
              <h3 className="text-sm font-semibold text-foreground">Criar ou continuar atendimento</h3>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
              Fluxo principal
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate(`${actionsBasePath}/novo-protocolo`)}
              className="flex items-center gap-3 rounded-[22px] bg-primary px-4 py-4 text-left text-primary-foreground shadow-card transition-all hover:shadow-card-hover"
            >
              <FilePlus2 className="h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Novo protocolo</p>
                <p className="text-xs text-primary-foreground/80">Cadastrar nova vitima e gerar caso</p>
              </div>
            </button>
            <button
              onClick={() => navigate(`${actionsBasePath}/novo-atendimento`)}
              className="flex items-center gap-3 rounded-[22px] border border-border/70 bg-background px-4 py-4 text-left shadow-card transition-all hover:shadow-card-hover"
            >
              <Stethoscope className="h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-semibold text-foreground">Novo atendimento</p>
                <p className="text-xs text-muted-foreground">Selecionar caso existente e registrar acao</p>
              </div>
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou protocolo..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card rounded-xl border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {filters.map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filter === item.value ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          {isLoading ? "Carregando casos..." : `${data?.casos.length ?? 0} caso(s) encontrado(s)`}
        </p>
        <div className="space-y-3">
          {data?.casos.map((caso) => (
            <CaseCard key={caso.id} caso={caso} basePath={basePath} />
          ))}
        </div>

        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 mx-auto max-w-lg px-4">
          <div className="pointer-events-auto rounded-[26px] border border-primary/15 bg-card/95 p-3 shadow-elevated backdrop-blur-xl">
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{actionsLabel}</p>
                <p className="text-sm font-semibold text-foreground">Acesso rapido</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
                Fluxo principal
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate(`${actionsBasePath}/novo-protocolo`)}
                className="flex items-center gap-3 rounded-[22px] bg-primary px-4 py-4 text-left text-primary-foreground shadow-card transition-all hover:shadow-card-hover"
              >
                <FilePlus2 className="h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Novo protocolo</p>
                  <p className="text-xs text-primary-foreground/80">Cadastrar nova vitima</p>
                </div>
              </button>
              <button
                onClick={() => navigate(`${actionsBasePath}/novo-atendimento`)}
                className="flex items-center gap-3 rounded-[22px] border border-border/70 bg-background px-4 py-4 text-left shadow-card transition-all hover:shadow-card-hover"
              >
                <Stethoscope className="h-5 w-5 shrink-0 text-accent" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Novo atendimento</p>
                  <p className="text-xs text-muted-foreground">Escolher caso e registrar acao</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
