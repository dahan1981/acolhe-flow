import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Bell, BookHeart, Clock, Shield, Phone, MessageCircleHeart, FileText, ChevronRight, Heart, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { api } from "@/lib/api";
import { roleDescriptions } from "@/lib/demo-content";
import { formatDate, getOrganizationName } from "@/lib/domain";

export default function MulherDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["woman-dashboard"],
    queryFn: api.getWomanDashboard,
  });

  // Stagger variants for smooth dashboard render
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.2, duration: 0.6 } }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
             <Shield className="h-8 w-8 text-primary/40" />
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  const caso = data?.caso;

  if (!caso) {
    return (
      <AppLayout>
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={itemVariants} className="glass-panel overflow-hidden relative">
            <div className="absolute right-0 top-0 h-40 w-40 translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/10 blur-3xl"></div>
            
            <div className="p-6 relative z-10">
              <div className="inline-flex items-center rounded-full border border-primary/15 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80 shadow-sm">
                Primeiro acesso
              </div>
              <h2 className="font-display mt-4 text-2xl font-bold tracking-tight text-foreground">
                Seu acompanhamento seguro começa aqui.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{roleDescriptions.mulher}</p>
              
              <div className="mt-6 flex flex-col gap-3">
                <motion.button
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => navigate("/mulher/ajuda")}
                  className="group relative overflow-hidden rounded-[20px] shadow-md hover:shadow-xl transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent"></div>
                  <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10 blur-2xl"></div>
                  <div className="relative flex items-center justify-between px-5 py-4">
                     <div>
                       <span className="font-display text-base font-bold text-white">Solicitar apoio inicial</span>
                       <p className="mt-1 text-[13px] font-medium text-white/90">Informe o risco e receba assistência imediata.</p>
                     </div>
                     <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                       <ArrowRight className="h-5 w-5 text-white transition-transform group-hover:translate-x-1" />
                     </div>
                  </div>
                </motion.button>
                <motion.button
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => navigate("/mulher/chat")}
                  className="glass-panel-interactive flex items-center justify-between rounded-[20px] px-5 py-4 text-left border border-primary/10"
                >
                   <div>
                     <span className="font-display text-base font-bold text-foreground">Falar com especialista</span>
                     <p className="max-w-[220px] mt-1 text-[13px] font-medium text-muted-foreground">Orientação rápida e protegida.</p>
                   </div>
                   <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                     <MessageCircleHeart className="h-5 w-5 text-primary" />
                   </div>
                </motion.button>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="px-1">
            <h2 className="mb-4 pl-1 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Próximos passos</h2>
            <div className="flex flex-col gap-3">
              {[
                { title: "1. Relatar necessidade", desc: "Abra a solicitação informando urgência e prioridade.", icon: Shield },
                { title: "2. Acompanhamento", desc: "A rede pública acompanha seu relato e direciona ao órgão ideal.", icon: FileText },
                { title: "3. Confidencial", desc: "Todas as etapas são monitoradas em rigoroso sigilo.", icon: Lock },
              ].map((step, idx) => (
                <div key={idx} className="glass-panel flex items-start gap-4 p-4">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <step.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{step.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-6">
        
        {/* Active Case Card (Hero) */}
        <motion.div variants={itemVariants} className="glass-panel relative overflow-hidden border-none bg-gradient-to-br from-primary via-accent to-primary/80 p-6 text-white shadow-lg">
          <div className="absolute -right-4 -top-8 h-32 w-32 rounded-full border-[20px] border-white/10 blur-sm"></div>
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/5 blur-xl"></div>
          
          <div className="relative z-10">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white/20 text-white shadow-inner backdrop-blur-md">
                  <Shield className="h-6 w-6 stroke-[1.5]" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/80">Caso ativo</p>
                  <p className="font-display text-lg font-bold">#{caso.protocolo}</p>
                </div>
              </div>
              <div className="flex items-end gap-1.5">
                <StatusBadge type="status" value={caso.status} />
                <StatusBadge type="risk" value={caso.situacaoRisco} />
              </div>
            </div>
            
            <div className="mb-6 border-l-2 border-white/30 pl-3">
              <p className="text-sm font-medium leading-relaxed text-white/95">
                Rede: <span className="font-bold">{getOrganizationName(caso.orgaoAtual)}</span>
              </p>
              <p className="mt-1 text-xs text-white/70">
                Atualizado em {formatDate(caso.atendimentos[0]?.data || caso.dataPrimeiroAtendimento)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/mulher/historico")}
                className="flex items-center justify-center gap-2 rounded-xl bg-white/15 py-3 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-white/25"
              >
                Detalhes
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/mulher/chat")}
                className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-bold text-primary shadow-xl transition-all hover:shadow-white/20"
              >
                <MessageCircleHeart className="h-4 w-4" /> Chat
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions Grid */}
        <motion.div variants={itemVariants}>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Assistência urgente</h2>
            <button onClick={() => navigate("/mulher/central-ajuda")} className="text-xs font-semibold text-primary hover:underline">
              Ver todos
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[ 
              { label: "Jurídica", icon: BookHeart }, 
              { label: "Saúde", icon: Heart }, 
              { label: "Abrigo", icon: Shield }, 
              { label: "Emergência", icon: Phone, urgent: true } 
            ].map((item) => (
              <motion.button
                key={item.label}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => navigate("/mulher/ajuda")}
                className={`glass-panel-interactive flex flex-col items-center justify-center gap-2 p-4 text-center transition-all ${
                  item.urgent ? "border-destructive/30 bg-destructive/5 text-destructive" : "text-foreground"
                }`}
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-full ${item.urgent ? "bg-destructive/15" : "bg-primary/10"}`}>
                  <item.icon className={`h-5 w-5 ${item.urgent ? "" : "text-primary/80"}`} />
                </div>
                <span className="font-display text-[11px] font-bold">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity Timeline */}
        <motion.div variants={itemVariants} className="glass-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">Histórico recente</h2>
          </div>
          
          <div className="relative pl-3">
            <div className="absolute bottom-2 left-[3px] top-2 w-px bg-border/60"></div>
            {data?.atendimentosRecentes.length ? (
              <div className="space-y-4">
                {data.atendimentosRecentes.slice(0, 3).map((item) => (
                  <div key={item.id} className="relative z-10 pl-6">
                    <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full border-2 border-primary bg-background"></div>
                    <p className="text-sm font-semibold text-foreground">{item.tipoAtendimento}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs font-medium text-primary">{getOrganizationName(item.orgao)}</span>
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/30"></span>
                      <span className="text-xs text-muted-foreground">{formatDate(item.data)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="pl-4 text-sm leading-relaxed text-muted-foreground">As movimentações da rede protetora aparecerão aqui gradualmente.</p>
            )}
          </div>
        </motion.div>

        {/* Tracking Actions */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/mulher/caso")}
            className="glass-panel-interactive group relative cursor-pointer overflow-hidden p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
              <FileText className="h-5 w-5" />
            </div>
            <p className="mt-3 font-display text-sm font-bold text-foreground">Relatório do caso</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">Acervo do seu caso.</p>
            <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-primary" />
          </motion.div>
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/mulher/notificacoes")}
            className="glass-panel-interactive group relative cursor-pointer overflow-hidden p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent transition-transform group-hover:scale-110">
              <Bell className="h-5 w-5" />
            </div>
            <p className="mt-3 font-display text-sm font-bold text-foreground">Verificar avisos</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">Notificações gerais.</p>
            <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-accent" />
          </motion.div>
        </motion.div>

        {/* Support Section */}
        {data?.solicitacoesApoio.length ? (
          <motion.div variants={itemVariants}>
            <h2 className="mb-3 pl-1 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Solicitações abertas</h2>
            <div className="glass-panel divide-y divide-border/40 space-y-0">
              {data.solicitacoesApoio.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/10">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                    <Bell className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold text-foreground">{item.tipo}</p>
                    <p className="text-xs font-medium text-muted-foreground">{new Date(item.data).toLocaleString("pt-BR")}</p>
                  </div>
                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/50" />
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}

      </motion.div>
    </AppLayout>
  );
}
