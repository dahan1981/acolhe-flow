import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CaseCard } from "@/components/shared/CaseCard";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export default function CaseList() {
  const { currentUser } = useAuthStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("todos");

  const { data, isLoading } = useQuery({
    queryKey: ["cases", search, filter, currentUser?.perfil],
    queryFn: () => api.getCases(search, filter),
  });

  const basePath = currentUser?.perfil === "gestora" ? "/gestora" : "/profissional";

  const filters = [
    { value: "todos", label: "Todos" },
    { value: "ativo", label: "Ativos" },
    { value: "em_andamento", label: "Em andamento" },
    { value: "encaminhado", label: "Encaminhados" },
    { value: "resolvido", label: "Resolvidos" },
  ];

  return (
    <AppLayout title="Casos">
      <div className="space-y-4">
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
      </div>
    </AppLayout>
  );
}
