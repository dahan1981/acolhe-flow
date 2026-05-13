import { useMemo } from "react";
import type { ElementType } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Activity, AlertTriangle, BarChart3, Clock, FilePlus2, MessageCircleHeart, ShieldCheck, Stethoscope, Users, Building, AlertOctagon } from "lucide-react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { ethnicityLabel, violenceTypeLabel } from "@/lib/domain";
import { roleDescriptions } from "@/lib/demo-content";

// Stagger variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.2, duration: 0.6 } }
};

export default function GestoraDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["manager-dashboard"],
    queryFn: api.getManagerDashboard,
  });

  const stats = data?.stats;

  const topViolence = useMemo(
    () => [...(stats?.porViolencia ?? [])].sort((a, b) => b.total - a.total).slice(0, 3),
    [stats?.porViolencia],
  );

  const topEthnicity = useMemo(
    () => [...(stats?.porEtnia ?? [])].sort((a, b) => b.total - a.total).slice(0, 3),
    [stats?.porEtnia],
  );

  if (isLoading || !stats) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
             <ShieldCheck className="h-8 w-8 text-primary/40" />
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  const hasOperationalData = stats.total > 0 || stats.totalAtendimentos > 0 || stats.encaminhamentosPendentes > 0;

  return (
    <AppLayout
      title="Painel Executivo"
      subtitle="Indicadores estratégicos."
    >
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-6">
        
        {/* Main Hero Card for Managers */}
        <motion.section variants={itemVariants} className="glass-panel relative overflow-hidden p-6 text-foreground">
          <div className="absolute right-0 top-0 h-40 w-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-accent/10 blur-3xl"></div>
          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Controle Geral
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Leitura de Rede e Governança</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{roleDescriptions.gestora}</p>
            
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/gestora/novo-protocolo")}
                className="flex flex-col items-start gap-2 rounded-2xl bg-foreground p-4 text-background shadow-lg transition-transform"
              >
                <FilePlus2 className="h-5 w-5" />
                <span className="font-display text-xs font-semibold">Novo<br/>Protocolo</span>
              </motion.button>
              
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/gestora/novo-atendimento")}
                className="flex flex-col items-start gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-foreground transition-colors hover:bg-primary/10"
              >
                <Stethoscope className="h-5 w-5 text-primary" />
                <span className="font-display text-xs font-semibold">Registrar<br/>Atendimento</span>
              </motion.button>

              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/gestora/administracao")}
                className="flex flex-col items-start gap-2 rounded-2xl border border-border/70 bg-card/60 p-4 text-foreground transition-colors hover:bg-card"
              >
                <Users className="h-5 w-5 text-accent" />
                <span className="font-display text-xs font-semibold">Gestão<br/>de Equipe</span>
              </motion.button>

              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/gestora/chats")}
                className="flex flex-col items-start gap-2 rounded-2xl border border-border/70 bg-card/60 p-4 text-foreground transition-colors hover:bg-card"
              >
                <MessageCircleHeart className="h-5 w-5 text-warning" />
                <span className="font-display text-xs font-semibold">Fila<br/>Protegida</span>
              </motion.button>
            </div>
          </div>
        </motion.section>

        {!hasOperationalData ? (
          <motion.section variants={itemVariants} className="glass-panel border-dashed p-6 text-center">
            <h3 className="font-display text-lg font-semibold text-foreground">Ambiente Pronto para Operação</h3>
            <p className="mt-2 text-sm text-muted-foreground mx-auto max-w-sm">A base está limpa. Comece gerando protocolos, atendimentos ou estruturando sua equipe.</p>
          </motion.section>
        ) : null}

        {/* Analytics Key Metrics */}
        <motion.section variants={itemVariants} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard icon={Users} label="Monitorados" value={stats.total} />
          <MetricCard icon={Activity} label="Atendimentos" value={stats.totalAtendimentos} accent="accent" />
          <MetricCard icon={AlertTriangle} label="Triagem" value={stats.ativos} accent="warning" />
          <MetricCard icon={Clock} label="Pendências" value={stats.encaminhamentosPendentes} accent="urgent" />
        </motion.section>

        {/* Charts and Progress UI */}
        <motion.section variants={itemVariants} className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="glass-panel p-5">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Saúde dos Casos</h3>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { label: "Em Triagem", count: stats.ativos, total: stats.total, color: "bg-urgent" },
                { label: "Andamento", count: stats.emAndamento, total: stats.total, color: "bg-primary" },
                { label: "Encaminhados", count: stats.encaminhados, total: stats.total, color: "bg-warning" },
                { label: "Concluídos", count: stats.resolvidos, total: stats.total, color: "bg-accent" },
              ].map((item) => (
                <div key={item.label} className="group">
                  <div className="mb-1.5 flex justify-between text-xs font-medium">
                    <span className="text-foreground">{item.label}</span>
                    <span className="tabular-nums text-muted-foreground">{item.count} / {item.total}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.total ? (item.count / item.total) * 100 : 0}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${item.color} shadow-sm`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-5">
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Matriz de Risco</h3>
            <div className="grid grid-cols-2 gap-3">
              {stats.porRisco.map((item) => (
                <div key={item.nivel} className="rounded-2xl border border-white/40 bg-white/50 px-3 py-3 shadow-sm dark:bg-card/40">
                  <div className="mb-1 flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${riskColorClass(item.cor)} shadow-sm`} />
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">{item.nivel}</p>
                  </div>
                  <p className="font-display text-2xl font-bold tabular-nums tracking-tight text-foreground">{item.total}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Insights Blocks */}
        <motion.section variants={itemVariants} className="grid gap-4 lg:grid-cols-2">
          <InsightList
            icon={AlertOctagon}
            title="Violências Recorrentes"
            items={topViolence.map((item) => ({ label: violenceTypeLabel(item.tipo), value: item.total }))}
            emptyText="Base insuficiente."
          />
          <InsightList
            icon={Users}
            title="Socioeconômico (Cor)"
            items={topEthnicity.map((item) => ({ label: ethnicityLabel(item.etnia), value: item.total }))}
            emptyText="Base insuficiente."
          />
        </motion.section>

        {/* Orgaos Distribution */}
        <motion.section variants={itemVariants} className="glass-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
               <Building className="h-4 w-4" />
            </div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Distribuição na Rede</h3>
          </div>
          
          {stats.porOrgao.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {stats.porOrgao.map((item) => (
                <div key={item.sigla} className="flex items-center justify-between rounded-xl border border-border/40 bg-card/30 p-3">
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-accent/10 px-2 py-1 text-[10px] font-bold text-accent">{item.sigla}</span>
                    <span className="text-xs font-medium text-foreground">{item.orgao}</span>
                  </div>
                  <span className="font-display text-lg font-bold tabular-nums text-foreground">{item.total}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma integração documentada ainda.</p>
          )}
        </motion.section>
      </motion.div>
    </AppLayout>
  );
}

function MetricCard({ icon: Icon, label, value, accent = "primary" }: { icon: ElementType; label: string; value: number; accent?: "primary" | "accent" | "warning" | "urgent" }) {
  const accentLookup = {
    primary: "text-primary bg-primary/10 border-primary/20",
    accent: "text-accent bg-accent/10 border-accent/20",
    warning: "text-warning bg-warning/10 border-warning/20",
    urgent: "text-urgent bg-urgent/10 border-urgent/20",
  }[accent];

  return (
    <div className="glass-panel p-4 flex flex-col justify-between h-[110px]">
      <div className="flex items-center gap-2">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${accentLookup}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground line-clamp-1">{label}</span>
      </div>
      <p className="font-display text-3xl font-bold tabular-nums tracking-tight text-foreground">{value}</p>
    </div>
  );
}

function InsightList({ icon: Icon, title, items, emptyText }: { icon: ElementType, title: string; items: Array<{ label: string; value: number }>; emptyText: string; }) {
  return (
    <div className="glass-panel p-5 h-full">
      <div className="mb-4 flex items-center gap-2">
         <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5 text-foreground/70">
            <Icon className="h-4 w-4" />
         </div>
         <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      {items.length ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.label} className="group flex items-center justify-between rounded-xl border border-transparent bg-muted/30 px-4 py-2 transition-colors hover:border-border/50 hover:bg-card/60">
              <span className="text-xs font-medium text-foreground">{item.label}</span>
              <span className="font-display text-sm font-bold tabular-nums text-muted-foreground group-hover:text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}

function riskColorClass(color: string) {
  if (color === "urgent") return "bg-urgent";
  if (color === "warning") return "bg-warning";
  if (color === "accent") return "bg-accent";
  return "bg-primary";
}
