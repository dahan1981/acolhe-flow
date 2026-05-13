import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Heart, MapPin, MessageCircle, Phone, ShieldCheck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { ethnicityOptions, riskOptions, violenceTypeOptions } from "@/lib/form-options";
import type { Ethnicity, ViolenceType } from "@/types/domain";

const services = [
  { icon: Phone, label: "Apoio Imediato", desc: "Contato urgente ou socorro", value: "apoio_imediato" },
  { icon: MapPin, label: "Proteção / Abrigo", desc: "Local seguro ou translado", value: "protecao_abrigo" },
  { icon: MessageCircle, label: "Canal Protegido", desc: "Chat com equipe técnica", value: "atendimento_especializado" },
  { icon: Heart, label: "Novo Relato", desc: "Abertura de acompanhamento", value: "nova_ocorrencia" },
];

export default function MulherAjuda() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState(services[0].value);
  const [message, setMessage] = useState("");
  const [riskLevel, setRiskLevel] = useState<"baixo" | "medio" | "alto" | "critico">("medio");
  const [etniaCor, setEtniaCor] = useState<Ethnicity>("nao_informada");
  const [tiposViolencia, setTiposViolencia] = useState<ViolenceType[]>(["violencia_psicologica"]);

  const mutation = useMutation({
    mutationFn: api.createSupportRequest,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["woman-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["woman-case"] }),
        queryClient.invalidateQueries({ queryKey: ["cases"] }),
        queryClient.invalidateQueries({ queryKey: ["professional-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["manager-dashboard"] }),
      ]);
      toast.success("Solicitação recebida em sigilo. A rede foi acionada.");
      navigate("/mulher/caso");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Falha na conexão segura.");
    },
  });

  function toggleViolenceType(type: ViolenceType) {
    setTiposViolencia((current) => {
      const exists = current.includes(type);
      const next = exists ? current.filter((item) => item !== type) : [...current, type];
      return next.length ? next : current;
    });
  }

  // Animation layout
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.5 } }
  };

  return (
    <AppLayout title="Solicitar Apoio" subtitle="A rede pública será notificada." showBack>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-8">
        
        <motion.section variants={itemVariants} className="glass-panel p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-2xl"></div>
          <div className="relative z-10">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Sessão Criptografada
            </div>
            <p className="text-sm font-medium leading-relaxed text-muted-foreground">
              Seu pedido entra diretamente no fluxo priorizado da prefeitura. Os órgãos avaliarão o relato com rigor e sigilo.
            </p>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-3">
          <label className="pl-1 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selecione o Apoio</label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {services.map((service) => {
              const isSelected = selectedService === service.value;
              return (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  key={service.value}
                  onClick={() => setSelectedService(service.value)}
                  className={`group relative flex w-full items-center gap-4 rounded-3xl border p-4 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary text-white shadow-lg"
                      : "border-border/50 bg-card/60 text-foreground hover:bg-card"
                  }`}
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                    isSelected ? "bg-white/20 text-white" : "bg-primary/5 text-primary group-hover:bg-primary/10"
                  }`}>
                    <service.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-sm font-bold">{service.label}</p>
                    <p className={`text-xs mt-0.5 leading-tight ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                      {service.desc}
                    </p>
                  </div>
                  {isSelected && (
                    <motion.div layoutId="selection-ring" className="absolute inset-0 rounded-3xl border-2 border-primary ring-4 ring-primary/20" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="glass-panel p-5 space-y-6">
          <AnimatePresence mode="popLayout">
            {selectedService === "atendimento_especializado" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
                  <p className="font-bold">Acesso ao Chat Preservado</p>
                  <p className="mt-1 text-xs opacity-90 leading-relaxed">
                    Você será conectada a uma agente técnica. Você pode pular a descrição abaixo e ir direto conversar.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <label className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Detalhes Opcionais</label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              placeholder="Descreva o que houve ou o que precisa (Não é obrigatório)."
              className="glass-input w-full resize-none rounded-2xl p-4 text-sm focus:border-primary/50"
            />
          </div>

          <div className="space-y-3">
            <label className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Escala de Risco</label>
            <div className="flex flex-wrap gap-2">
              {riskOptions.map((item) => {
                const isActive = riskLevel === item.value;
                return (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={item.value}
                    type="button"
                    onClick={() => setRiskLevel(item.value)}
                    className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-colors ${
                      isActive
                        ? "bg-foreground text-background shadow-md"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {item.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <label className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Fatores Relacionados</label>
            <div className="flex flex-wrap gap-2">
              {violenceTypeOptions.map((item) => {
                const isActive = tiposViolencia.includes(item.value);
                return (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={item.value}
                    type="button"
                    onClick={() => toggleViolenceType(item.value)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                      isActive
                        ? "bg-warning text-warning-foreground shadow-sm"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {item.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Identificação (Opcional)</label>
            <select
              value={etniaCor}
              onChange={(event) => setEtniaCor(event.target.value as Ethnicity)}
              className="glass-input w-full rounded-2xl px-4 py-3.5 text-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_16px_center] bg-no-repeat"
            >
              {ethnicityOptions.map((item) => (
                <option key={item.value} value={item.value} className="text-foreground bg-background">
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </motion.section>

        <motion.div variants={itemVariants} className="pt-2">
          {selectedService === "atendimento_especializado" ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => navigate("/mulher/chat?start=1")}
              className="w-full rounded-[20px] bg-primary py-4.5 font-display text-base font-bold text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary/90"
            >
              Conectar ao Canal Agora
            </motion.button>
          ) : (
            <motion.button
              whileTap={!mutation.isPending ? { scale: 0.98 } : {}}
              onClick={() => mutation.mutate({ tipo: selectedService, mensagem: message, situacaoRisco: riskLevel, tiposViolencia, etniaCor })}
              disabled={mutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-foreground py-4.5 font-display text-base font-bold text-background shadow-xl transition-all hover:bg-foreground/90 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processando...
                </>
              ) : (
                "Enviar Relato Sigiloso"
              )}
            </motion.button>
          )}
        </motion.div>

        <motion.section variants={itemVariants} className="flex items-start gap-3 rounded-[24px] bg-urgent/10 p-5 mt-4 border border-urgent/20">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-urgent/20 text-urgent">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-urgent-foreground">Ameaça Imediata?</p>
            <p className="mt-1 text-xs leading-relaxed text-urgent-foreground/80">
              Se você está correndo risco de vida neste momento, evite usar este formulário e busque apoio da polícia local.
            </p>
          </div>
        </motion.section>
      </motion.div>
    </AppLayout>
  );
}
