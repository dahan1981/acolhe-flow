import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, BarChart3, TrendingUp, Presentation } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { ethnicityLabel, formatDate, getOrganizationName, violenceTypeLabel } from "@/lib/domain";

// Framer motion variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.4 } }
};

export default function Relatorios() {
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["manager-report-summary"],
    queryFn: api.getManagerReportSummary,
  });

  const { data: managerData, isLoading: isManagerLoading } = useQuery({
    queryKey: ["manager-dashboard"],
    queryFn: api.getManagerDashboard,
  });

  const reports = [
    { title: "Base Consolidada de Casos", desc: "Exporta identificadores, status e órgão atual de cada caso.", type: "geral" },
    { title: "Classificação de Risco", desc: "Resumo dos casos distribuídos por nível de risco.", type: "risco" },
    { title: "Atendimentos Entregues", desc: "Histórico de atendimentos para leitura operacional.", type: "atendimentos" },
    { title: "Saltos Intersetoriais", desc: "Fluxo de migração entre instituições participantes.", type: "encaminhamentos" },
  ];

  const stats = managerData?.stats;

  const evolution = useMemo(
    () => [...(stats?.porPeriodo ?? [])].sort((a, b) => a.periodo.localeCompare(b.periodo)).slice(-6),
    [stats?.porPeriodo],
  );

  const violence = useMemo(
    () => [...(stats?.porViolencia ?? [])].sort((a, b) => b.total - a.total),
    [stats?.porViolencia],
  );

  const ethnicity = useMemo(
    () => [...(stats?.porEtnia ?? [])].sort((a, b) => b.total - a.total),
    [stats?.porEtnia],
  );

  const referralDistribution = useMemo(
    () => [...(stats?.distribuicaoEncaminhamentos ?? [])].sort((a, b) => b.total - a.total).slice(0, 5),
    [stats?.distribuicaoEncaminhamentos],
  );

  async function handleExport(type: string) {
    try {
      const blob = await api.downloadManagerReport(type);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `athena-dump-${type}.csv`;
      anchor.click();
      window.URL.revokeObjectURL(url);
      toast.success("Documento gerado com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sinal intermitente, tente exportar novamente.");
    }
  }

  return (
    <AppLayout title="BI Corporativo" subtitle="Inteligência, exportação e análise global macro.">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-24">
        
        {/* Main Hero Header */}
        <motion.section variants={itemVariants} className="glass-panel overflow-hidden relative border-t-4 border-t-primary">
          <div className="absolute left-0 top-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl"></div>
          
          <div className="p-6 relative z-10">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              <Presentation className="h-3.5 w-3.5" />
              Power BI Embedded
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Cockpit de Monitoramento</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-sm">
              Animações estatísticas consolidando volume demográfico da operação atual. Use isso para relatórios externos.
            </p>
          </div>
        </motion.section>

        {/* Export Buttons */}
        <motion.section variants={itemVariants} className="space-y-3">
          <h3 className="px-1 font-display text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
             <Download className="h-3 w-3" /> Gerar Arquivos CSV
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {reports.map((report) => (
              <motion.button
                whileTap={{ scale: 0.98 }}
                key={report.type} 
                onClick={() => handleExport(report.type)}
                className="glass-panel flex flex-col items-start gap-4 p-4 hover:border-primary/50 hover:bg-card/80 transition-all text-left shadow-sm hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card border border-border/50 text-primary shadow-inner">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-foreground leading-tight">{report.title}</p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{report.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Dashboard Panels */}
        <motion.section variants={itemVariants} className="grid gap-4 lg:grid-cols-2 pt-2">
          
          {/* Evolution Chart */}
          <div className="glass-panel p-5 relative overflow-hidden bg-card/60">
             <div className="mb-6 flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-primary" />
                <h3 className="font-display text-sm font-bold text-foreground">Série Histórica (Velocidade)</h3>
             </div>
             
             {isManagerLoading ? (
               <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-border/40">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Sincronizando BI...</p>
               </div>
             ) : evolution.length ? (
               <div className="space-y-4">
                 {evolution.map((item) => (
                   <div key={item.periodo}>
                     <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                       <span className="text-muted-foreground/80">{item.periodo}</span>
                       <span className="text-foreground">{item.total}</span>
                     </div>
                     <div className="h-2.5 overflow-hidden rounded-full bg-muted/50 border border-border/30">
                       <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${Math.min(item.total * 12, 100)}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.2 }}
                          className="h-full rounded-full bg-gradient-to-r from-primary to-accent shadow-sm" 
                       />
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-border/40">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 text-center max-w-[200px]">Sem tração suficiente para gerar série</p>
               </div>
             )}
          </div>

          {/* Referral Map */}
          <div className="glass-panel p-5">
             <div className="mb-6 flex items-center gap-2">
                <BarChart3 className="h-4.5 w-4.5 text-accent" />
                <h3 className="font-display text-sm font-bold text-foreground">Top 5 Destinos (Encaminhamentos)</h3>
             </div>
             
             {referralDistribution.length ? (
               <div className="space-y-2">
                 {referralDistribution.map((item, idx) => (
                   <div key={item.orgao} className={`flex items-center justify-between rounded-2xl px-4 py-3 border border-border/40 bg-card/60 shadow-sm ${idx === 0 ? 'bg-primary/5 border-primary/20' : ''}`}>
                     <span className={`text-xs font-bold ${idx === 0 ? 'text-primary' : 'text-muted-foreground'}`}>{getOrganizationName(item.orgao)}</span>
                     <span className={`text-sm font-bold ${idx === 0 ? 'text-primary' : 'text-foreground'}`}>{item.total}</span>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-border/40 bg-card/30">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 text-center">Nenhum evento registrado</p>
               </div>
             )}
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="grid gap-4 lg:grid-cols-2">
          {/* Violence Type */}
          <div className="glass-panel p-5">
             <h3 className="mb-4 font-display text-sm font-bold text-foreground">Matriz de Conflito (Violência)</h3>
             {violence.length ? (
               <div className="space-y-2">
                 {violence.map((item) => (
                   <div key={item.tipo} className="flex items-center justify-between rounded-2xl bg-card border border-border/40 px-4 py-3 shadow-sm">
                     <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{violenceTypeLabel(item.tipo)}</span>
                     <span className="text-sm font-bold text-foreground">{item.total}</span>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-border/40 bg-card/30">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 text-center">Dados insuficientes</p>
               </div>
             )}
          </div>

          {/* Ethnicity distribution */}
          <div className="glass-panel p-5">
             <h3 className="mb-4 font-display text-sm font-bold text-foreground">Aspecto Demográfico (Etnia/Cor)</h3>
             {ethnicity.length ? (
               <div className="space-y-2">
                 {ethnicity.map((item) => (
                   <div key={item.etnia} className="flex items-center justify-between rounded-2xl bg-card border border-border/40 px-4 py-3 shadow-sm">
                     <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{ethnicityLabel(item.etnia)}</span>
                     <span className="text-sm font-bold text-foreground">{item.total}</span>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-border/40 bg-card/30">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 text-center">Dados insuficientes</p>
               </div>
             )}
          </div>
        </motion.section>

        {/* Recent Cases Digest */}
        <motion.section variants={itemVariants} className="glass-panel p-5 overflow-hidden">
           <h3 className="mb-4 font-display text-sm font-bold text-foreground">Radar de Movimentações Atuais</h3>
           
           {isSummaryLoading ? (
               <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-border/40">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Lendo radar...</p>
               </div>
           ) : summary?.casosRecentes.length ? (
             <div className="space-y-3">
               {summary.casosRecentes.slice(0, 6).map((caso) => (
                 <div key={caso.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-card/60 border border-border/40 p-4 shadow-sm hover:shadow-md transition-shadow">
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-foreground text-background flex items-center justify-center font-display font-bold">
                         {caso.nomeSocial ? caso.nomeSocial.charAt(0) : caso.nomeCompleto.charAt(0)}
                      </div>
                      <div className="min-w-0">
                         <p className="font-display text-sm font-bold text-foreground truncate leading-tight">
                            {caso.nomeSocial || caso.nomeCompleto}
                         </p>
                         <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/80 mt-1 truncate">
                           Via {getOrganizationName(caso.orgaoEntrada)}
                         </p>
                      </div>
                   </div>
                   <div className="flex items-center sm:flex-col sm:items-end justify-between border-t border-border/40 sm:border-0 pt-3 sm:pt-0 shrink-0">
                     <p className="text-[11px] font-bold text-foreground"><span className="text-muted-foreground/60">ID:</span> #{caso.protocolo}</p>
                     <span className="mt-1 inline-flex rounded-full border border-border bg-background px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                        {caso.situacaoRisco}
                     </span>
                   </div>
                 </div>
               ))}
             </div>
           ) : (
               <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-border/40 bg-card/30">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 text-center">Radar totalmente cristalino</p>
               </div>
           )}
        </motion.section>

      </motion.div>
    </AppLayout>
  );
}
