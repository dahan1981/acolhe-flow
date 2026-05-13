import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRightLeft, Clock, FilePlus2, FileText, ShieldCheck, Stethoscope, Users, Search, MessageCircleHeart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { CaseCard } from "@/components/shared/CaseCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { api } from "@/lib/api";
import { roleDescriptions } from "@/lib/demo-content";
import { formatDate, getOrganizationName } from "@/lib/domain";

// Stagger variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.2, duration: 0.6 } }
};

export default function ProfissionalDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["professional-dashboard"],
    queryFn: api.getProfessionalDashboard,
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
             <Stethoscope className="h-8 w-8 text-primary/40" />
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  const hasCases = (data?.casosPrioritarios.length ?? 0) > 0;
  const hasAttendances = (data?.ultimosAtendimentos.length ?? 0) > 0;

  return (
    <AppLayout
      title="Painel Operacional"
      subtitle="Priorização e histórico."
    >
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-6">
        
        {/* Main Hero Card for Professional */}
        <motion.section variants={itemVariants} className="glass-panel relative overflow-hidden p-6 text-foreground">
          <div className="absolute left-0 top-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"></div>
          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Operação Institucional
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Condução Integrada</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{roleDescriptions.profissional}</p>
            
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <motion.button
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                onClick={() => navigate("/profissional/novo-protocolo")}
                className="group flex flex-col items-start gap-2 rounded-2xl bg-primary p-4 text-white shadow-lg transition-all hover:shadow-xl hover:shadow-primary/30 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <FilePlus2 className="h-5 w-5 relative z-10" />
                <span className="font-display text-xs font-bold relative z-10">Novo<br/>Protocolo</span>
              </motion.button>
              
              <motion.button
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                onClick={() => navigate("/profissional/novo-atendimento")}
                className="group flex flex-col items-start gap-2 rounded-2xl bg-foreground p-4 text-background shadow-lg transition-all hover:shadow-xl hover:shadow-black/20 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Stethoscope className="h-5 w-5 text-background/80 relative z-10" />
                <span className="font-display text-xs font-bold relative z-10">Registrar<br/>Atendimento</span>
              </motion.button>

              <motion.button
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                onClick={() => navigate("/profissional/historico")}
                className="glass-panel-interactive flex flex-col items-start gap-2 rounded-2xl p-4 text-foreground transition-all"
              >
                <Search className="h-5 w-5 text-primary" />
                <span className="font-display text-xs font-bold">Base de<br/>Casos</span>
              </motion.button>

              <motion.button
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                onClick={() => navigate("/profissional/chats")}
                className="glass-panel-interactive flex flex-col items-start gap-2 rounded-2xl p-4 text-foreground transition-all"
              >
                <MessageCircleHeart className="h-5 w-5 text-accent" />
                <span className="font-display text-xs font-bold">Fila<br/>Protegida</span>
              </motion.button>
            </div>
          </div>
        </motion.section>

        {/* Operational Flow Stats */}
        <motion.section variants={itemVariants} className="grid grid-cols-2 gap-3">
          <div className="glass-panel-interactive flex items-center justify-between p-5">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-[10px] uppercase font-extrabold text-primary/80 tracking-widest">Casos Ativos</span>
              </div>
              <p className="font-display text-3xl font-extrabold tabular-nums text-foreground">{data?.casosAtivos ?? 0}</p>
            </div>
            <div className="h-10 w-10 opacity-10">
              <Users className="h-full w-full" />
            </div>
          </div>
          <div className="glass-panel-interactive flex items-center justify-between p-5">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" />
                <span className="text-[10px] uppercase font-extrabold text-accent/80 tracking-widest">Atendimentos</span>
              </div>
              <p className="font-display text-3xl font-extrabold tabular-nums text-foreground">{data?.atendimentosHoje ?? 0}</p>
            </div>
            <div className="h-10 w-10 opacity-10">
              <FileText className="h-full w-full" />
            </div>
          </div>
        </motion.section>

        {/* Priority Queue Module */}
        <motion.section variants={itemVariants}>
          <div className="mb-4 flex items-center justify-between pl-1">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Fila de Prioridades (Triagem)</h2>
            <button onClick={() => navigate("/profissional/casos")} className="text-xs font-semibold text-primary/80 hover:text-primary transition-colors">
              Explorar Fila Completa
            </button>
          </div>
          {hasCases ? (
            <div className="space-y-4">
              <AnimatePresence>
                {data?.casosPrioritarios.map((caso, i) => (
                  <motion.div
                    key={caso.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group"
                  >
                     <CaseCard caso={caso} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="glass-panel border-dashed p-6 text-center">
              <CheckCircle className="mx-auto h-8 w-8 text-primary/40 mb-3" />
              <p className="text-sm font-medium text-foreground">Fila Zerada.</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[280px] mx-auto">Nenhum caso prioritário parado na triagem no momento.</p>
            </div>
          )}
        </motion.section>

        {/* Recent Operations log */}
        <motion.section variants={itemVariants}>
          <h2 className="mb-4 pl-1 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Últimas Movimentações Realizadas</h2>
          {hasAttendances ? (
            <div className="glass-panel overflow-hidden">
              {data?.ultimosAtendimentos.map((item, i) => (
                <div key={item.id} className={`p-4 transition-colors hover:bg-muted/30 ${i !== 0 ? "border-t border-border/50" : ""}`}>
                  <div className="mb-2 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{formatDate(item.data)}</span>
                    <div className="ml-auto">
                      <StatusBadge type="risk" value={item.riscoIdentificado} />
                    </div>
                  </div>
                  <p className="font-display text-sm font-bold text-foreground">{item.caso.nomeSocial || item.caso.nomeCompleto}</p>
                  <p className="mt-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <span className="rounded bg-background px-1.5 py-0.5 border border-border/60">{item.tipoAtendimento}</span>
                    <span className="text-foreground/70">por {getOrganizationName(item.orgao)}</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel border-dashed p-6 text-center">
              <p className="text-sm text-foreground">Sem registros hoje.</p>
            </div>
          )}
        </motion.section>

        {/* Floating Context Panel */}
        <motion.section variants={itemVariants} className="glass-panel p-5">
          <div className="mb-3 flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-accent" />
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Acompanhamento Contínuo</h3>
          </div>
          <p className="text-sm font-medium leading-relaxed text-muted-foreground">
             Navegue diretamente da fila para o detalhe do caso para registrar acompanhamentos rapidamente s/ perder contexto.
          </p>
        </motion.section>

      </motion.div>
    </AppLayout>
  );
}

// Ensure CheckCircle is imported for empty states (Lucide)
import { CheckCircle } from "lucide-react";
