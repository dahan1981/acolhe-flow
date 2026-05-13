import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Info,
  FileText,
  User,
  MapPin,
  Phone,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";
import { api } from "@/lib/api";

const schema = z.object({
  tipoAmeaca: z.string().min(1, "Selecione o tipo de ameaça"),
  descricao: z.string().min(20, "Descreva com pelo menos 20 caracteres"),
  nomeAgressor: z.string().optional(),
  enderecoAgressor: z.string().optional(),
  telefoneContato: z.string().optional(),
  situacaoRisco: z.enum(["baixo", "medio", "alto", "critico"]),
});

type FormData = z.infer<typeof schema>;

const TIPOS_AMEACA = [
  { value: "violencia_fisica", label: "Violência física", emoji: "🤕" },
  { value: "violencia_psicologica", label: "Violência psicológica", emoji: "😰" },
  { value: "ameaca_de_morte", label: "Ameaça de morte", emoji: "⚠️" },
  { value: "perseguicao", label: "Perseguição / stalking", emoji: "👁️" },
  { value: "violencia_sexual", label: "Violência sexual", emoji: "🚨" },
  { value: "carcere_privado", label: "Cárcere privado", emoji: "🔒" },
];

const NIVEIS_RISCO = [
  { value: "baixo", label: "Baixo", desc: "Sem perigo imediato", color: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  { value: "medio", label: "Médio", desc: "Risco presente", color: "border-amber-300 bg-amber-50 text-amber-700" },
  { value: "alto", label: "Alto", desc: "Perigo frequente", color: "border-orange-300 bg-orange-50 text-orange-700" },
  { value: "critico", label: "Crítico", desc: "Perigo imediato", color: "border-red-400 bg-red-50 text-red-700" },
];

export default function MulherMedidaProtetiva() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "success">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { situacaoRisco: "medio" },
  });

  const selectedTipo = watch("tipoAmeaca");
  const selectedRisco = watch("situacaoRisco");

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      await api.createSupportRequest({
        tipo: `medida_protetiva:${data.tipoAmeaca}`,
        mensagem: [
          data.descricao,
          data.nomeAgressor ? `Agressor: ${data.nomeAgressor}` : "",
          data.enderecoAgressor ? `Endereço: ${data.enderecoAgressor}` : "",
          data.telefoneContato ? `Contato: ${data.telefoneContato}` : "",
        ].filter(Boolean).join("\n"),
        situacaoRisco: data.situacaoRisco,
      });
      setStep("success");
    } catch (err: any) {
      toast.error(err?.message ?? "Não foi possível enviar agora. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (step === "success") {
    return (
      <AppLayout title="Medida Protetiva" showBack>
        <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100"
          >
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Solicitação enviada!
            </h2>
            <p className="mt-3 max-w-[280px] text-sm leading-relaxed text-muted-foreground">
              Sua solicitação de medida protetiva foi registrada com segurança. A equipe entrará em contato em breve.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-left"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-800">Em caso de perigo imediato</p>
                <p className="mt-1 text-xs text-amber-700">Ligue para <strong>190</strong> (Polícia Militar) ou <strong>180</strong> (Central da Mulher)</p>
              </div>
            </div>
          </motion.div>
          <div className="flex w-full flex-col gap-3">
            <button
              onClick={() => navigate("/mulher")}
              className="w-full rounded-2xl bg-primary py-4 text-sm font-bold text-white shadow-lg"
            >
              Voltar ao início
            </button>
            <button
              onClick={() => navigate("/mulher/chat")}
              className="w-full rounded-2xl border border-border bg-white py-3.5 text-sm font-semibold text-foreground"
            >
              Falar com um especialista
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Medida Protetiva" subtitle="Solicitação segura e sigilosa" showBack>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4 pb-10">

        {/* Info Banner */}
        <div className="flex items-start gap-3 rounded-[18px] border border-blue-200 bg-blue-50 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <p className="text-[13px] leading-relaxed text-blue-800">
            Uma medida protetiva é um instrumento legal que afasta o agressor e garante sua segurança. Preencha com o máximo de detalhes possível.
          </p>
        </div>

        {/* Tipo de ameaça */}
        <div>
          <label className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <Shield className="h-3.5 w-3.5" /> Tipo de ameaça ou violência *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TIPOS_AMEACA.map((tipo) => (
              <button
                key={tipo.value}
                type="button"
                onClick={() => setValue("tipoAmeaca", tipo.value, { shouldValidate: true })}
                className={`flex items-center gap-2.5 rounded-[16px] border p-3.5 text-left text-[13px] font-semibold transition-all ${
                  selectedTipo === tipo.value
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border bg-white text-foreground hover:bg-muted/40"
                }`}
              >
                <span className="text-xl">{tipo.emoji}</span>
                <span className="leading-snug">{tipo.label}</span>
              </button>
            ))}
          </div>
          {errors.tipoAmeaca && (
            <p className="mt-2 text-[12px] text-destructive">{errors.tipoAmeaca.message}</p>
          )}
        </div>

        {/* Nível de risco */}
        <div>
          <label className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" /> Nível de risco atual *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {NIVEIS_RISCO.map((risco) => (
              <button
                key={risco.value}
                type="button"
                onClick={() => setValue("situacaoRisco", risco.value as any)}
                className={`rounded-[16px] border-2 p-3.5 text-left transition-all ${
                  selectedRisco === risco.value
                    ? risco.color + " ring-2 ring-offset-1 ring-current/30"
                    : "border-border bg-white"
                }`}
              >
                <p className="text-[13px] font-bold">{risco.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{risco.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <FileText className="h-3.5 w-3.5" /> Descreva a situação *
          </label>
          <textarea
            {...register("descricao")}
            rows={4}
            placeholder="Relate o que aconteceu, quando, onde e com que frequência. Quanto mais detalhes, melhor para sua proteção."
            className="w-full rounded-[16px] border border-border bg-white px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
          {errors.descricao && (
            <p className="mt-1.5 text-[12px] text-destructive">{errors.descricao.message}</p>
          )}
        </div>

        {/* Dados do agressor (optional) */}
        <div className="space-y-3 rounded-[20px] border border-border bg-muted/30 p-4">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <User className="h-3.5 w-3.5" /> Dados do agressor (opcional)
          </p>
          <input
            {...register("nomeAgressor")}
            placeholder="Nome do agressor"
            className="w-full rounded-[14px] border border-border bg-white px-4 py-3 text-[14px] placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              <input
                {...register("enderecoAgressor")}
                placeholder="Endereço do agressor"
                className="w-full rounded-[14px] border border-border bg-white py-3 pl-9 pr-4 text-[14px] placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Contato */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <Phone className="h-3.5 w-3.5" /> Seu telefone de contato (opcional)
          </label>
          <input
            {...register("telefoneContato")}
            type="tel"
            placeholder="(00) 00000-0000"
            className="w-full rounded-[16px] border border-border bg-white px-4 py-3 text-[14px] placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Emergency strip */}
        <div className="flex items-center justify-between rounded-[16px] border border-red-200 bg-red-50 px-4 py-3">
          <div>
            <p className="text-[11px] font-bold text-red-700">Perigo imediato?</p>
            <p className="text-[11px] text-red-600">Ligue agora para o 190</p>
          </div>
          <a
            href="tel:190"
            className="rounded-full bg-red-600 px-4 py-2 text-[12px] font-bold text-white"
          >
            Ligar 190
          </a>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileTap={{ scale: 0.97 }}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-violet-600 py-4 text-sm font-bold text-white shadow-xl shadow-primary/30 disabled:opacity-60"
        >
          {isSubmitting ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }}>
              <Shield className="h-5 w-5" />
            </motion.div>
          ) : (
            <>
              <Shield className="h-5 w-5" />
              Solicitar Medida Protetiva
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </motion.button>

        <p className="text-center text-[11px] text-muted-foreground">
          Seus dados são protegidos e sigilosos. Apenas profissionais autorizados têm acesso.
        </p>
      </form>
    </AppLayout>
  );
}
