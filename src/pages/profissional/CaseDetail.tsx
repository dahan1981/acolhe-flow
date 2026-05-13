import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Calendar, ClipboardList, FileText, MapPin, Phone, PlusCircle, User, Activity, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Timeline } from "@/components/shared/Timeline";
import { api } from "@/lib/api";
import { ethnicityLabel, formatDate, getOrganizationName, violenceTypeLabel } from "@/lib/domain";
import { useAuthStore } from "@/stores/auth-store";

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["case-detail", id],
    queryFn: () => api.getCase(id || ""),
    enabled: Boolean(id),
  });

  const statusMutation = useMutation({
    mutationFn: (status: "em_andamento" | "resolvido" | "arquivado") => api.updateCaseStatus(id || "", status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["case-detail", id] }),
        queryClient.invalidateQueries({ queryKey: ["cases"] }),
        queryClient.invalidateQueries({ queryKey: ["manager-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["professional-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["woman-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["woman-case"] }),
      ]);
      toast.success("Timeline do caso atualizada.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Falha de rede."),
  });

  if (isLoading) {
    return (
      <AppLayout title="Abrindo Prontuário" showBack>
        <div className="flex h-[40vh] items-center justify-center">
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
      <AppLayout title="Extraviado" showBack>
        <div className="flex flex-col items-center justify-center py-20 opacity-60">
           <User className="h-12 w-12 mb-4" />
           <p className="text-center font-display font-medium text-muted-foreground">Prontuário inexistente ou sigiloso demais para seu perfil atual.</p>
        </div>
      </AppLayout>
    );
  }

  const canEdit = currentUser?.perfil === "profissional" || currentUser?.perfil === "gestora";
  const basePath = currentUser?.perfil === "gestora" ? "/gestora" : "/profissional";

  // Animation layout
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.4 } }
  };

  return (
    <AppLayout title={`Prontuário ${caso.protocolo}`} subtitle="Ficha técnica, ocorrências e timeline." showBack>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-20">
        
        {/* Header Hero Card */}
        <motion.section variants={itemVariants} className="glass-panel overflow-hidden p-6 relative z-10 border-t-4 border-t-primary shadow-lg shadow-primary/5">
          <div className="absolute right-0 top-0 h-40 w-40 -translate-y-1/3 translate-x-1/3 rounded-full bg-primary/10 blur-3xl"></div>
          
          <div className="relative z-10 flex items-start gap-4 mb-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-inner">
              <User className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-primary font-bold mb-1">
                <ClipboardList className="h-3 w-3" /> Fixado: {caso.protocolo}
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground leading-tight">
                {caso.nomeSocial || caso.nomeCompleto}
              </h2>
              {caso.nomeSocial && (
                <p className="text-xs mt-1 text-muted-foreground font-medium">Doc: {caso.nomeCompleto}</p>
              )}
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap gap-2 mb-6">
            <StatusBadge type="status" value={caso.status} />
            <StatusBadge type="risk" value={caso.situacaoRisco} />
            <span className="rounded-full bg-muted/60 border border-border/40 px-3 py-1 text-[11px] font-bold text-muted-foreground shadow-sm">
              Cor: {ethnicityLabel(caso.etniaCor ?? "nao_informada")}
            </span>
            {(caso.tiposViolencia ?? []).map((tipo) => (
              <span key={tipo} className="rounded-full bg-warning/10 border border-warning/20 px-3 py-1 text-[11px] font-bold text-warning shadow-sm">
                {violenceTypeLabel(tipo)}
              </span>
            ))}
          </div>

          <div className="relative z-10 grid gap-3 text-sm font-medium sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl bg-card/60 border border-border/40 px-4 py-3 shadow-sm text-muted-foreground">
              <FileText className="h-4 w-4 shrink-0 text-primary/70" />
              <span className="line-clamp-1">{caso.perfilMulher.cpf}</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-card/60 border border-border/40 px-4 py-3 shadow-sm text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0 text-primary/70" />
              <span className="line-clamp-1">{caso.perfilMulher.telefone}</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-card/60 border border-border/40 px-4 py-3 shadow-sm text-muted-foreground sm:col-span-2">
              <MapPin className="h-4 w-4 shrink-0 text-primary/70" />
              <span className="line-clamp-1 text-xs leading-relaxed">{caso.perfilMulher.endereco}, {caso.perfilMulher.municipio} - {caso.perfilMulher.uf}</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-card/60 border border-border/40 px-4 py-3 shadow-sm text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0 text-primary/70" />
              <span className="line-clamp-1 text-xs">Desde: {formatDate(caso.dataPrimeiroAtendimento)}</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-card/60 border border-border/40 px-4 py-3 shadow-sm text-muted-foreground">
              <ArrowRight className="h-4 w-4 shrink-0 text-primary/70" />
              <span className="line-clamp-1 text-xs font-bold">{getOrganizationName(caso.orgaoAtual)}</span>
            </div>
          </div>
        </motion.section>

        {/* Causa Primária */}
        <motion.section variants={itemVariants} className="glass-panel p-5 relative overflow-hidden bg-accent/5 border-accent/20">
          <div className="mb-3 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-accent" />
                <h3 className="font-display text-sm font-bold tracking-wider uppercase text-foreground">Relato Matriz</h3>
             </div>
             <span className="rounded-full bg-background/80 border border-border/50 px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
              Sala: {caso.atribuidaPara || "Triagem Inicial"}
            </span>
          </div>
          <p className="text-sm font-medium leading-relaxed text-muted-foreground/90 pl-6 border-l-2 border-accent/40">
            {caso.observacoesIniciais}
          </p>
        </motion.section>

        {/* Operational Flow */}
        <motion.section variants={itemVariants} className="glass-panel p-5">
          <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">Manobras</h3>
          
          <div className="grid gap-3 sm:grid-cols-2">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`${basePath}/novo-atendimento?caseId=${caso.id}`)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-display text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              Relatar Atendimento
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`${basePath}/novo-encaminhamento?caseId=${caso.id}`)}
              className="flex items-center justify-center gap-2 rounded-2xl border border-primary bg-primary/10 py-4 font-display text-sm font-bold text-primary shadow-sm transition-all hover:bg-primary/20"
            >
              <ArrowRight className="h-4.5 w-4.5" />
              Transferir Responsabilidade
            </motion.button>
          </div>

          <div className="mt-6">
            <p className="mb-3 font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-t border-border/40 pt-4">Controle de Status da Pasta</p>
            <div className="flex flex-wrap gap-2">
               {([
                { value: "em_andamento", label: "Forçar Abertura" },
                { value: "resolvido", label: "Baixar p/ Concluído" },
                { value: "arquivado", label: "Arquivar Case" },
              ] as const).map((status) => (
                <motion.button
                  whileTap={!statusMutation.isPending && canEdit ? { scale: 0.95 } : {}}
                  key={status.value}
                  onClick={() => statusMutation.mutate(status.value)}
                  disabled={statusMutation.isPending || !canEdit}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    caso.status === status.value
                       ? "border-foreground bg-foreground text-background"
                       : "border-border/50 bg-background text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  {status.label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Timeline View */}
        <motion.section variants={itemVariants} className="px-1 pt-2">
           <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">Evolução do Caso ({caso.atendimentos.length} AT, {caso.encaminhamentos.length} EC)</h3>
           <Timeline caso={caso} atendimentos={caso.atendimentos} encaminhamentos={caso.encaminhamentos} solicitacoesApoio={caso.solicitacoesApoio} />
        </motion.section>

      </motion.div>
    </AppLayout>
  );
}
