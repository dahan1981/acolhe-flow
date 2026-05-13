import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FilePlus2, Search, Stethoscope, SearchX, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  const title = currentUser?.perfil === "gestora" ? "Monitoramento" : "Operacional";
  const actionsBasePath = currentUser?.perfil === "gestora" ? "/gestora" : "/profissional";

  const filters = [
    { value: "todos", label: "Toda a Rede" },
    { value: "ativo", label: "Na Triagem" },
    { value: "em_andamento", label: "Ocorrências Ativas" },
    { value: "encaminhado", label: "Em Trânsito/Encaminhados" },
    { value: "resolvido", label: "Concluídos" },
  ];

  const violenceFilters = [
    { value: "todos", label: "Qualquer Categoria" },
    { value: "violencia_fisica", label: "Física" },
    { value: "violencia_psicologica", label: "Psicológica" },
    { value: "violencia_moral", label: "Moral" },
    { value: "violencia_sexual", label: "Sexual" },
    { value: "violencia_patrimonial", label: "Patrimonial" },
  ];

  const filteredCases = useMemo(() => {
    const items = data?.casos ?? [];
    if (violenceFilter === "todos") return items;
    return items.filter((item) => (item.tiposViolencia ?? []).includes(violenceFilter as never));
  }, [data?.casos, violenceFilter]);

  // Framer motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.4 } }
  };

  return (
    <AppLayout
      title={title}
      subtitle="Busca ativa no diretório integral."
    >
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4 pb-28">
        
        <motion.section variants={itemVariants} className="glass-panel overflow-hidden p-5 relative">
          <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/10 blur-3xl"></div>
          
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-display text-[10px] font-bold uppercase tracking-widest text-primary">Operações Diretas</p>
              <h3 className="text-xl font-bold tracking-tight text-foreground">Ações Primárias</h3>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 relative z-10">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`${actionsBasePath}/novo-protocolo`)}
              className="flex flex-col items-start gap-2 rounded-2xl bg-foreground p-4 text-left text-background shadow-lg transition-transform hover:bg-foreground/90"
            >
              <FilePlus2 className="h-5 w-5 opacity-90" />
              <div>
                <p className="font-display text-sm font-bold">Novo Protocolo</p>
                <p className="mt-0.5 text-[10px] uppercase font-bold text-background/60">Inserir no grid</p>
              </div>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`${actionsBasePath}/novo-atendimento`)}
              className="flex flex-col items-start gap-2 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-left shadow-sm transition-colors hover:bg-primary/20"
            >
              <Stethoscope className="h-5 w-5 text-primary" />
              <div>
                <p className="font-display text-sm font-bold text-foreground">Relatar Diário</p>
                <p className="mt-0.5 text-[10px] uppercase font-bold text-muted-foreground">Vincular a caso</p>
              </div>
            </motion.button>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-4 pt-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Pesquisar por CPF, Protocolo ou Nome Cidadã..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="glass-input w-full rounded-[20px] pl-11 pr-4 py-3.5 text-sm"
            />
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="mb-2 pl-1 font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Estágio de Tratamento</p>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
                {filters.map((item) => {
                  const isActive = filter === item.value;
                  return (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      key={item.value}
                      onClick={() => setFilter(item.value)}
                      className={`relative whitespace-nowrap rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                        isActive
                          ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
                          : "border-border/60 bg-card/60 text-muted-foreground hover:bg-card/80 hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
            
            <div>
              <p className="mb-2 pl-1 font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Filtro de Fenomenologia</p>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
                {violenceFilters.map((item) => {
                  const isActive = violenceFilter === item.value;
                  return (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      key={item.value}
                      onClick={() => setViolenceFilter(item.value)}
                      className={`relative whitespace-nowrap rounded-xl border px-3 py-2 text-xs transition-all ${
                        isActive
                          ? "border-warning/50 bg-warning text-warning-foreground font-bold shadow-md shadow-warning/20"
                          : "border-border/60 bg-transparent text-muted-foreground hover:bg-card/80 font-medium"
                      }`}
                    >
                      {item.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.div variants={itemVariants} className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-b border-border/40 pb-2">
          <span>{isLoading ? "Buscando diretório..." : `${filteredCases.length} resultado(s) vivo(s)`}</span>
          <span className="font-semibold">{currentUser?.perfil === "gestora" ? "Rede Geral" : "Designações Próprias"}</span>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredCases.map((caso, i) => (
              <motion.div
                layout
                key={caso.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <CaseCard caso={caso} basePath={basePath} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {!isLoading && filteredCases.length === 0 ? (
          <motion.section variants={itemVariants} className="glass-panel border-dashed p-8 text-center bg-card/30">
            <SearchX className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-display text-base font-bold text-foreground">
              {search || filter !== "todos" || violenceFilter !== "todos"
                ? "Nenhuma agulha no palheiro."
                : "Seu diretório está totalmente limpo!"}
            </p>
            <p className="mt-2 mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
              {search || filter !== "todos" || violenceFilter !== "todos"
                ? "Dicas: Reduza o tamanho da busca do input, ou selecione categorias mais flexíveis acima."
                : "Seu painel está limpo. Novos acompanhamentos inseridos na rede brotarão logo aqui."}
            </p>
            
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {(search || filter !== "todos" || violenceFilter !== "todos") ? (
                <button
                  type="button"
                  onClick={() => { setFilter("todos"); setViolenceFilter("todos"); setSearch(""); }}
                  className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-muted"
                >
                  Limpar Todos os Filtros
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate(`${actionsBasePath}/novo-protocolo`)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-primary/90"
                >
                  <FilePlus2 className="h-4 w-4" /> Cadastrar Ocorrência Número 1
                </button>
              )}
            </div>
          </motion.section>
        ) : null}
      </motion.div>
    </AppLayout>
  );
}
