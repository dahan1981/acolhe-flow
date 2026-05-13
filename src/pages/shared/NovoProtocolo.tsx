import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ClipboardCheck, FilePlus2, Info, User, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { ethnicityOptions, riskOptions, violenceTypeOptions } from "@/lib/form-options";
import type { Ethnicity, RiskLevel, ViolenceType } from "@/types/domain";

export default function NovoProtocolo() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    nomeCompleto: "",
    nomeSocial: "",
    cpf: "",
    dataNascimento: "",
    telefone: "",
    endereco: "",
    municipio: "Mangaratiba",
    uf: "RJ",
    situacaoRisco: "medio" as RiskLevel,
    observacoesIniciais: "",
    etniaCor: "nao_informada" as Ethnicity,
    tiposViolencia: ["violencia_psicologica"] as ViolenceType[],
  });

  function updateField<Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleViolenceType(type: ViolenceType) {
    setForm((current) => {
      const exists = current.tiposViolencia.includes(type);
      const next = exists
        ? current.tiposViolencia.filter((item) => item !== type)
        : [...current.tiposViolencia, type];
      return { ...current, tiposViolencia: next.length ? next : current.tiposViolencia };
    });
  }

  const mutation = useMutation({
    mutationFn: () =>
      api.createCase({
        nomeCompleto: form.nomeCompleto,
        nomeSocial: form.nomeSocial,
        cpf: form.cpf,
        dataNascimento: form.dataNascimento,
        telefone: form.telefone,
        endereco: form.endereco,
        municipio: form.municipio,
        uf: form.uf,
        observacoesIniciais: form.observacoesIniciais,
        situacaoRisco: form.situacaoRisco,
      }),
    onSuccess: async ({ caso }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cases"] }),
        queryClient.invalidateQueries({ queryKey: ["professional-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["manager-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["manager-report-summary"] }),
      ]);
      toast.success(`Protocolo ${caso.protocolo} registrado com sucesso na rede.`);
      navigate(-1);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel registrar o protocolo.");
    },
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.5 } }
  };

  return (
    <AppLayout
      title="Gerar Protocolo"
      subtitle="Abertura oficializada de caso na rede."
      showBack
    >
      <motion.form
        variants={containerVariants}
        initial="hidden"
        animate="show"
        onSubmit={async (event) => {
          event.preventDefault();
          mutation.mutate();
        }}
        className="space-y-6 pb-8"
      >
        <motion.section variants={itemVariants} className="glass-panel relative overflow-hidden p-6 z-10">
          <div className="absolute right-0 top-0 h-40 w-40 translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/10 blur-3xl"></div>
          <div className="relative z-10">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Etapa Inicial
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Identificação Cidadã</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              O protocolo gera a entrada formal da mulher na rede e a mapeia no radar da operação integral.
            </p>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="glass-panel grid gap-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <label className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Nome civil completo *</label>
              <input
                required
                value={form.nomeCompleto}
                onChange={(event) => updateField("nomeCompleto", event.target.value)}
                placeholder="Registro base"
                className="glass-input w-full rounded-2xl px-4 py-3.5 text-sm"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
               <div className="flex justify-between items-center pr-1 pl-1">
                 <label className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome social</label>
                 <span className="text-[10px] uppercase font-bold text-primary/60 bg-primary/10 px-2 py-0.5 rounded-full">Opcional</span>
               </div>
              <input
                value={form.nomeSocial}
                onChange={(event) => updateField("nomeSocial", event.target.value)}
                placeholder="Como prefere ser chamada (Se aplicável)"
                className="glass-input w-full rounded-2xl px-4 py-3.5 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">CPF *</label>
              <input
                required
                value={form.cpf}
                onChange={(event) => updateField("cpf", event.target.value)}
                placeholder="000.000.000-00"
                className="glass-input w-full rounded-2xl px-4 py-3.5 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Documento de Nascimento *</label>
              <input
                required
                type="date"
                value={form.dataNascimento}
                onChange={(event) => updateField("dataNascimento", event.target.value)}
                className="glass-input w-full rounded-2xl px-4 py-3.5 text-sm"
              />
            </div>
            
            <div className="sm:col-span-2 space-y-2 pt-2 border-t border-border/40">
              <label className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Contato Prioritário *</label>
              <input
                required
                value={form.telefone}
                onChange={(event) => updateField("telefone", event.target.value)}
                placeholder="(00) 00000-0000"
                className="glass-input w-full rounded-2xl px-4 py-3.5 text-sm"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Endereço de Referência *</label>
              <input
                required
                value={form.endereco}
                onChange={(event) => updateField("endereco", event.target.value)}
                placeholder="Rua, número, complemento..."
                className="glass-input w-full rounded-2xl px-4 py-3.5 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Município Base</label>
              <input
                value={form.municipio}
                onChange={(event) => updateField("municipio", event.target.value)}
                className="glass-input w-full rounded-2xl px-4 py-3.5 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Estado</label>
              <input
                value={form.uf}
                maxLength={2}
                onChange={(event) => updateField("uf", event.target.value.toUpperCase())}
                className="glass-input w-full rounded-2xl px-4 py-3.5 text-sm uppercase"
              />
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="glass-panel p-5 space-y-6">
          <div className="flex items-start gap-3 rounded-2xl bg-accent/5 px-4 py-3 border border-accent/10 text-sm text-foreground/80">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span className="leading-relaxed text-xs">Os marcadores abaixos definem a criticidade do caso logo na porta de entrada da plataforma.</span>
          </div>

          <div className="space-y-3">
            <label className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Nível Inicial Calculado</label>
            <div className="flex flex-wrap gap-2">
              {riskOptions.map((item) => {
                const isActive = form.situacaoRisco === item.value;
                return (
                  <motion.button
                     whileTap={{ scale: 0.95 }}
                    key={item.value}
                    type="button"
                    onClick={() => updateField("situacaoRisco", item.value)}
                    className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                      isActive
                        ? "border-primary bg-foreground text-background shadow-md"
                        : "border-border/50 bg-background text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </motion.button>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            <label className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Fenomenologia Inicial</label>
            <div className="flex flex-wrap gap-2">
              {violenceTypeOptions.map((item) => {
                const isActive = form.tiposViolencia.includes(item.value);
                return (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={item.value}
                    type="button"
                    onClick={() => toggleViolenceType(item.value)}
                    className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                      isActive
                        ? "border-warning/50 bg-warning text-warning-foreground shadow-sm"
                        : "border-border/50 bg-background text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Autodeclaração Sociológica</label>
            <select
              value={form.etniaCor}
              onChange={(event) => updateField("etniaCor", event.target.value as Ethnicity)}
               className="glass-input w-full rounded-2xl px-4 py-3.5 text-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_16px_center] bg-no-repeat"
            >
              {ethnicityOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="glass-panel p-5">
           <div className="space-y-2">
            <label className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Relatório Base da Central *</label>
            <textarea
              required
              rows={5}
              value={form.observacoesIniciais}
              onChange={(event) => updateField("observacoesIniciais", event.target.value)}
              placeholder="Descreva a forma de entrada, o contexto relatado, evidências corporais etc."
              className="glass-input w-full resize-none rounded-2xl p-4 text-sm"
            />
            <p className="mt-2 text-xs text-muted-foreground pl-2 leading-relaxed">
              *Texto auditável que acompanhará a mulher pelo longo do tratamento psicossocial na rede.
            </p>
          </div>
        </motion.section>

        <motion.div variants={itemVariants} className="pt-2">
          <motion.button
             whileTap={!mutation.isPending ? { scale: 0.98 } : {}}
            type="submit"
            disabled={mutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-primary px-4 py-4.5 font-display text-base font-bold text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {mutation.isPending ? (
              <>
                 <Loader2 className="h-5 w-5 animate-spin" />
                 Gerando Base...
              </>
            ) : (
               <>
                 <Sparkles className="h-5 w-5" />
                 Firmar Protocolo Institucional
               </>
            )}
          </motion.button>
        </motion.div>
      </motion.form>
    </AppLayout>
  );
}
