import { Building2, CircleDot, Users, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { teamMembers } from "@/lib/demo-content";

// Framer motion variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", bounce: 0, duration: 0.4 } }
};

export default function ProfessionalsPage() {
  return (
    <AppLayout title="Recursos Humanos" subtitle="Corpo técnico e gestores alocados na plataforma.">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-24">
        
        <motion.section variants={itemVariants} className="glass-panel overflow-hidden relative">
          <div className="absolute right-0 top-0 h-40 w-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/20 blur-3xl"></div>
          
          <div className="p-6 relative z-10">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              <Users className="h-3.5 w-3.5" />
              Mapeamento de Equipe
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Rede Humana</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Esta matriz organiza o capital humano por órgão de origem e expertise tática, servindo como catálogo interno criptografado.
            </p>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-4">
          <h3 className="px-1 font-display text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pessoas Cadastradas ({teamMembers.length})</h3>
          
          <AnimatePresence>
            {teamMembers.map((member) => (
              <motion.article 
                layout
                key={member.id} 
                className="glass-panel p-5 overflow-hidden relative"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center text-primary shadow-sm font-display font-bold text-lg">
                        {member.name.charAt(0)}
                     </div>
                     <div>
                       <p className="font-display text-base font-bold text-foreground leading-tight">{member.name}</p>
                       <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-0.5">{member.role}</p>
                     </div>
                  </div>
                  <span className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest shadow-sm ${
                    member.status === "Ativo" || member.status === "Ativa" 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" 
                      : "bg-muted text-muted-foreground border-border/50"
                  }`}>
                    {member.status}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 bg-muted/20 p-4 rounded-2xl border border-border/30">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-card border border-border/50 shadow-sm">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/80">Designação (Órgão)</p>
                      <p className="font-display text-xs font-bold text-foreground mt-0.5 truncate">{member.org}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-card border border-border/50 shadow-sm">
                      <CircleDot className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/80">Especialidade Tática</p>
                      <p className="font-display text-xs font-bold text-foreground mt-0.5 line-clamp-2 leading-relaxed">{member.focus}</p>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.section>
      </motion.div>
    </AppLayout>
  );
}
