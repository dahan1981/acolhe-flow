import { useNavigate } from "react-router-dom";
import { Building2, Mail, Shield, User, HelpCircle, Settings, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getOrganizationName, profileLabel } from "@/lib/domain";
import { useAuthStore } from "@/stores/auth-store";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.4 } }
};

export default function ProfilePage() {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  if (!currentUser) return null;

  const basePath =
    currentUser.perfil === "mulher" ? "/mulher" : currentUser.perfil === "profissional" ? "/profissional" : "/gestora";
  const settingsPath = `${basePath}/configuracoes`;
  const supportPath = currentUser.perfil === "mulher" ? `${basePath}/central-ajuda` : `${basePath}/ajuda`;

  return (
    <AppLayout title="Minha identidade" subtitle="Sua credencial de acesso e seu perfil na rede Athena.">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5 pb-20">
        <motion.section variants={itemVariants} className="glass-panel relative overflow-hidden border-t-4 border-t-primary shadow-xl">
          <div className="absolute right-0 top-0 h-40 w-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/20 blur-3xl"></div>

          <div className="relative z-10 flex flex-col items-center p-6 text-center">
            <Avatar className="mb-4 h-24 w-24 border-4 border-background shadow-xl shadow-primary/20">
              <AvatarImage src={currentUser.avatarUrl ?? undefined} alt={currentUser.nome} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary">
                <User className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>

            <div className="mb-2 inline-flex max-w-fit items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              <Shield className="h-3.5 w-3.5" />
              Conta validada
            </div>

            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">{currentUser.nome}</h2>
            <p className="mt-1 text-sm font-medium text-muted-foreground">{profileLabel(currentUser.perfil)}</p>

            <button
              onClick={() => navigate(`${basePath}/perfil/editar`)}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-5 py-2 text-xs font-bold text-foreground shadow-sm transition-colors hover:bg-muted/50 hover:text-primary active:scale-95"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar perfil
            </button>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="glass-panel space-y-4 p-5">
          <h3 className="mb-4 font-display text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Dados do cadastro</h3>

          <div className="flex items-center gap-4 border-b border-border/40 pb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/40 bg-card shadow-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">E-mail</p>
              <p className="font-display truncate text-sm font-bold text-foreground">{currentUser.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-b border-border/40 pb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/40 bg-card shadow-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Unidade</p>
              <p className="font-display truncate text-sm font-bold text-foreground">{getOrganizationName(currentUser.orgao)}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/40 bg-card shadow-sm">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Perfil de acesso</p>
              <p className="font-display truncate text-sm font-bold text-foreground">{profileLabel(currentUser.perfil)}</p>
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(settingsPath)}
            className="flex flex-col gap-2 rounded-3xl border border-border/60 bg-card/60 p-4 shadow-sm transition-all hover:shadow-md active:bg-muted/40"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Settings className="h-4.5 w-4.5" />
            </div>
            <div className="mt-2 text-left">
              <p className="font-display text-sm font-bold text-foreground">Ajustes</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Preferências</p>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(supportPath)}
            className="flex flex-col gap-2 rounded-3xl border border-border/60 bg-card/60 p-4 shadow-sm transition-all hover:shadow-md active:bg-muted/40"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
              <HelpCircle className="h-4.5 w-4.5" />
            </div>
            <div className="mt-2 text-left">
              <p className="font-display text-sm font-bold text-foreground">Suporte</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Guias e orientação</p>
            </div>
          </motion.button>
        </motion.section>
      </motion.div>
    </AppLayout>
  );
}
