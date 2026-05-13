import { useEffect, useMemo, useState } from "react";
import { Bell, ChevronRight, HelpCircle, Info, Lock, Settings2, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getAccountPreferences, type AccountPreferences, saveAccountPreferences } from "@/lib/account-preferences";
import { useAuthStore } from "@/stores/auth-store";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 15 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.4 } },
};

type ToggleKey = keyof AccountPreferences;

const toggleItems: Array<{ key: ToggleKey; title: string; description: string }> = [
  {
    key: "resumoDiario",
    title: "Resumo diário push",
    description: "Exibe um resumo diário local das atividades mais recentes da sua conta.",
  },
  {
    key: "alertaPrioridade",
    title: "Alertas Bypass",
    description: "Destaca alertas críticos da conta com prioridade reforçada neste dispositivo.",
  },
  {
    key: "modoDiscreto",
    title: "Filtro Discreto UI",
    description: "Inicia o aplicativo com os dados sensíveis ocultos neste dispositivo.",
  },
];

export default function ConfigPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [preferences, setPreferences] = useState<AccountPreferences>({
    resumoDiario: true,
    alertaPrioridade: true,
    modoDiscreto: false,
  });
  const [pendingToggle, setPendingToggle] = useState<{ key: ToggleKey; nextValue: boolean } | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    setPreferences(getAccountPreferences(currentUser.id));
  }, [currentUser]);

  const basePath = useMemo(() => {
    if (!currentUser) return "";
    if (currentUser.perfil === "mulher") return "/mulher";
    if (currentUser.perfil === "profissional") return "/profissional";
    return "/gestora";
  }, [currentUser]);

  const items = [
    { icon: Bell, label: "Notificações", desc: "Regras de alerta sonoro e visual", path: `${basePath}/notificacoes`, color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: Lock, label: "Segurança", desc: "Senha e acessos", path: `${basePath}/seguranca`, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { icon: Shield, label: "Permissões", desc: "Ver escopo desta conta", path: `${basePath}/permissoes`, color: "text-primary", bg: "bg-primary/10" },
    { icon: HelpCircle, label: "Central de Ajuda", desc: "FAQ, manuais e contato", path: `${currentUser?.perfil === "mulher" ? `${basePath}/central-ajuda` : `${basePath}/ajuda`}`, color: "text-accent", bg: "bg-accent/10" },
    { icon: Info, label: "Sobre o Athena", desc: "Versão e termos legais", path: `${basePath}/sobre`, color: "text-muted-foreground", bg: "bg-muted/30" },
  ];

  if (!currentUser) return null;

  function handleToggleIntent(key: ToggleKey) {
    setPendingToggle({
      key,
      nextValue: !preferences[key],
    });
  }

  function handleConfirmToggle() {
    if (!pendingToggle) return;

    const nextPreferences = {
      ...preferences,
      [pendingToggle.key]: pendingToggle.nextValue,
    };

    setPreferences(nextPreferences);
    saveAccountPreferences(currentUser.id, nextPreferences);
    setPendingToggle(null);
    toast.success("Alteração salva neste dispositivo.");
  }

  const pendingItem = pendingToggle ? toggleItems.find((item) => item.key === pendingToggle.key) : null;

  return (
    <AppLayout title="Configurações" subtitle="Ajustes pessoais e comportamento local do sistema.">
      <AlertDialog open={Boolean(pendingToggle)} onOpenChange={(open) => !open && setPendingToggle(null)}>
        <AlertDialogContent className="rounded-3xl border-border/60 bg-background/95">
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja salvar a alteração?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingItem
                ? `${pendingToggle?.nextValue ? "Ativar" : "Desativar"} "${pendingItem.title}" neste dispositivo.`
                : "Confirme para salvar a alteração."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmToggle}>Salvar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-24">
        <motion.section variants={itemVariants} className="glass-panel relative overflow-hidden p-6">
          <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              <Settings2 className="h-3.5 w-3.5" />
              Preferências locais
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Comportamento</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Essas chaves valem para esta conta neste dispositivo e influenciam o comportamento visual e os avisos locais.
            </p>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-3">
          <h3 className="px-1 font-display text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Chaves mestras</h3>
          <div className="glass-panel overflow-hidden divide-y divide-border/40">
            {toggleItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-card/40">
                <div className="flex-1 pr-4">
                  <p className="font-display text-sm font-bold text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{item.description}</p>
                </div>
                <button
                  type="button"
                  aria-label={item.title}
                  onClick={() => handleToggleIntent(item.key)}
                  className={`relative flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    preferences[item.key] ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      preferences[item.key] ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-3">
          <h3 className="mt-4 px-1 font-display text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Navegação da conta</h3>
          <div className="grid gap-3">
            {items.map((item) => (
              <motion.button
                whileTap={{ scale: 0.98 }}
                key={item.label}
                onClick={() => navigate(item.path)}
                className="glass-panel group flex items-center justify-between p-4 transition-all hover:bg-card/80 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.bg}`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-display text-sm font-bold text-foreground transition-colors group-hover:text-primary">{item.label}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/30 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>
      </motion.div>
    </AppLayout>
  );
}
