import { useQuery } from "@tanstack/react-query";
import { Clock3, FileClock, ShieldAlert, FileText, Loader2, Info } from "lucide-react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Timeline } from "@/components/shared/Timeline";
import { api } from "@/lib/api";
import { getCaseActivitySummary } from "@/lib/case-activity";
import { formatDateLong, getOrganizationName } from "@/lib/domain";

// Variants for sequential animation
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.4 } }
};

export default function MulherHistorico() {
  const { data, isLoading } = useQuery({
    queryKey: ["woman-case"],
    queryFn: api.getWomanCase,
  });

  if (isLoading) {
    return (
      <AppLayout title="Acompanhamento" subtitle="Carregando acervo cronológico seguro...">
        <div className="flex h-[50vh] items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
             <Loader2 className="h-8 w-8 text-primary/40" />
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  const caso = data?.caso;

  if (!caso) {
    return (
      <AppLayout title="Relatório de Situação" subtitle="Seu acervo de ocorrências.">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
          <motion.section variants={itemVariants} className="glass-panel border-dashed p-6 text-center shadow-sm">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="font-display text-base font-bold text-foreground">Aguardando Solicitação</h3>
            <p className="mt-2 text-sm max-w-[260px] mx-auto text-muted-foreground leading-relaxed">
              O diário do seu acompanhamento será impresso aqui assim que os órgãos receberem sua primeira solicitação via Central.
            </p>
          </motion.section>
        </motion.div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Relatório do Caso" subtitle="Cronologia do acompanhamento integral.">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5 pb-8">
        
        {/* Main Status Block */}
        <motion.section variants={itemVariants} className="glass-panel relative overflow-hidden p-6 text-foreground border-t-4 border-t-primary">
          <div className="absolute right-0 top-0 h-40 w-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/10 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-[10px] font-bold uppercase tracking-widest text-primary">Status Oficial</p>
                <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Diário Cidadão</h2>
              </div>
              <StatusBadge type="status" value={caso.status} />
            </div>
            
            <p className="text-sm rounded-xl bg-card/60 border border-border/40 p-4 font-medium leading-relaxed text-muted-foreground shadow-sm">
              {getCaseActivitySummary(caso).summary}
            </p>
          </div>
        </motion.section>

        {/* Info Grid */}
        <motion.section variants={itemVariants} className="grid grid-cols-2 gap-3">
          <div className="glass-panel p-4 flex flex-col justify-center">
            <div className="mb-2 flex items-center gap-2">
              <FileClock className="h-4 w-4 text-primary" />
              <span className="font-display text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Entrada</span>
            </div>
            <p className="font-display text-sm font-bold text-foreground line-clamp-1">{formatDateLong(caso.dataPrimeiroAtendimento)}</p>
          </div>
          <div className="glass-panel p-4 flex flex-col justify-center">
            <div className="mb-2 flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-accent" />
              <span className="font-display text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Posse da Rede</span>
            </div>
            <p className="font-display text-sm font-bold text-foreground line-clamp-1">{getOrganizationName(caso.orgaoAtual)}</p>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="glass-panel flex gap-3 p-4 bg-muted/20 border-transparent shadow-none">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            O rastreador em tempo real compila o rastro da rede em linguagem civil. Documentos sigilosos técnicos são ocultados por segurança.
          </p>
        </motion.section>

        {/* Timeline Embed */}
        <motion.section variants={itemVariants} className="px-1 pt-2">
          <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">Histórico Progressivo</h3>
          <Timeline caso={caso} atendimentos={caso.atendimentos} encaminhamentos={caso.encaminhamentos} solicitacoesApoio={caso.solicitacoesApoio} />
        </motion.section>
      </motion.div>
    </AppLayout>
  );
}
