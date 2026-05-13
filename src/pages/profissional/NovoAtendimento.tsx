import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Search, Stethoscope, Loader2, User, Building } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { ethnicityLabel, getOrganizationName, violenceTypeLabel } from "@/lib/domain";
import { riskOptions, violenceTypeOptions } from "@/lib/form-options";
import type { RiskLevel, ViolenceType } from "@/types/domain";

export default function NovoAtendimento() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialCaseId = searchParams.get("caseId") || "";
  const [selectedCaseId, setSelectedCaseId] = useState(initialCaseId);
  const [caseSearch, setCaseSearch] = useState("");

  const { data: casesData } = useQuery({
    queryKey: ["cases", "", "todos", "attendance-form"],
    queryFn: () => api.getCases("", "todos"),
  });

  const { data } = useQuery({
    queryKey: ["case-detail", selectedCaseId],
    queryFn: () => api.getCase(selectedCaseId),
    enabled: Boolean(selectedCaseId),
  });

  const [form, setForm] = useState({
    tipoAtendimento: "",
    resumo: "",
    riscoIdentificado: "medio" as RiskLevel,
    necessidadeEncaminhamento: false,
    proximosPassos: "",
    observacoesInternas: "",
    tiposViolencia: ["violencia_psicologica"] as ViolenceType[],
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.createAttendance({
        caseId: selectedCaseId,
        tipoAtendimento: form.tipoAtendimento,
        resumo: form.resumo,
        riscoIdentificado: form.riscoIdentificado,
        necessidadeEncaminhamento: form.necessidadeEncaminhamento,
        proximosPassos: form.proximosPassos,
        observacoesInternas: form.observacoesInternas,
        tiposViolencia: form.tiposViolencia,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["case-detail", selectedCaseId] }),
        queryClient.invalidateQueries({ queryKey: ["cases"] }),
        queryClient.invalidateQueries({ queryKey: ["professional-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["manager-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["woman-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["woman-case"] }),
      ]);
      toast.success("Atendimento arquivado. Linha do tempo atualizada com sucesso.");
      navigate(-1);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel registrar o atendimento.");
    },
  });

  const tipos = [
    "Acolhimento inicial",
    "Reavaliação de risco",
    "Atendimento psicossocial",
    "Orientação jurídica",
    "Registro complementar",
    "Contato de seguimento",
    "Acompanhamento intersetorial",
  ];

  const availableCases = (casesData?.casos ?? []).filter((item) => {
    const term = caseSearch.trim().toLowerCase();
    if (!term) return true;
    return (
      item.nomeCompleto.toLowerCase().includes(term) ||
      (item.nomeSocial || "").toLowerCase().includes(term) ||
      item.protocolo.toLowerCase().includes(term)
    );
  });

  const selectedCase = data?.caso ?? (casesData?.casos ?? []).find((item) => item.id === selectedCaseId);

  function toggleViolenceType(type: ViolenceType) {
    setForm((current) => {
      const exists = current.tiposViolencia.includes(type);
      const next = exists ? current.tiposViolencia.filter((item) => item !== type) : [...current.tiposViolencia, type];
      return { ...current, tiposViolencia: next.length ? next : current.tiposViolencia };
    });
  }

  // Animation variants
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
      title="Registrar Atendimento"
      subtitle="Vincule a ação executada ao caso para atualizar a rede."
      showBack
    >
      <motion.form
        variants={containerVariants}
        initial="hidden"
        animate="show"
        onSubmit={(event) => {
          event.preventDefault();
          if (!selectedCaseId) {
            toast.error("Vincule um caso ativo primeiro.");
            return;
          }
          mutation.mutate();
        }}
        className="space-y-6 pb-8"
      >
        <motion.section variants={itemVariants} className="glass-panel relative overflow-hidden p-6 z-10">
          <div className="absolute right-0 top-0 h-40 w-40 translate-x-1/3 -translate-y-1/3 rounded-full bg-accent/10 blur-3xl"></div>
          <div className="relative z-10">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Etapa Vinculativa
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Seleção do Caso-Alvo</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Todo atendimento é anexado à timeline compartilhada para prevenir vitimização secundária (repetição de histórias).
            </p>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="glass-panel p-5 space-y-4 relative z-20">
          <div className="space-y-3">
             <label className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Buscador Rápido</label>
             <div className="relative">
               <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
               <input
                 type="text"
                 value={caseSearch}
                 onChange={(event) => setCaseSearch(event.target.value)}
                 placeholder="Pesquise por nome civil, nome social ou protocolo..."
                 className="glass-input w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm"
               />
             </div>
             
             <select
               value={selectedCaseId}
               onChange={(event) => setSelectedCaseId(event.target.value)}
                className="glass-input w-full rounded-2xl px-4 py-3.5 text-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_16px_center] bg-no-repeat"
             >
               <option value="" disabled>Selecione um processo do banco de dados</option>
               {availableCases.map((item) => (
                 <option key={item.id} value={item.id}>
                   {(item.nomeSocial || item.nomeCompleto)} • Protocolo: {item.protocolo}
                 </option>
               ))}
             </select>
          </div>

          <AnimatePresence>
            {selectedCase && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-primary mb-1">
                     <User className="h-4 w-4" />
                     <p className="font-display text-base font-bold">
                       {selectedCase.nomeSocial || selectedCase.nomeCompleto}
                     </p>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                     <Building className="h-3 w-3 text-muted-foreground" />
                     <p className="text-xs font-semibold text-muted-foreground">
                       Origem: {getOrganizationName(selectedCase.orgaoEntrada)}
                     </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-background px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-border/50">
                      Cor: {ethnicityLabel(selectedCase.etniaCor ?? "nao_informada")}
                    </span>
                    {(selectedCase.tiposViolencia ?? []).map((tipo) => (
                      <span key={tipo} className="rounded-full bg-warning/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-warning">
                        {violenceTypeLabel(tipo)}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        <motion.section variants={itemVariants} className="glass-panel space-y-5 p-5">
          <div className="space-y-2">
            <label className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Natureza do Contato</label>
            <select
              value={form.tipoAtendimento}
              onChange={(event) => setForm({ ...form, tipoAtendimento: event.target.value })}
              className="glass-input w-full rounded-2xl px-4 py-3.5 text-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_16px_center] bg-no-repeat"
              required
            >
              <option value="" disabled>Qual foi a ação realizada hoje?</option>
              {tipos.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Ata Compartilhada do Atendimento</label>
            <textarea
              value={form.resumo}
              onChange={(event) => setForm({ ...form, resumo: event.target.value })}
              rows={4}
              placeholder="O que foi escutado, o que foi orientado..."
              className="glass-input w-full resize-none rounded-2xl p-4 text-sm"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Grau de Risco Confirmado</label>
            <div className="flex flex-wrap gap-2">
              {riskOptions.map((item) => {
                 const isActive = form.riscoIdentificado === item.value;
                 return (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={item.value}
                    type="button"
                    onClick={() => setForm({ ...form, riscoIdentificado: item.value })}
                    className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                      isActive
                        ? "border-primary bg-foreground text-background shadow-md"
                        : "border-border/50 bg-background text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </motion.button>
                 );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <label className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Fenomenologia Constatada</label>
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
                 )
              })}
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="glass-panel space-y-5 p-5">
           <div className="space-y-2">
            <label className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Diretivas para a Rede (Próximos Passos)</label>
            <textarea
              value={form.proximosPassos}
              onChange={(event) => setForm({ ...form, proximosPassos: event.target.value })}
              rows={3}
              placeholder="Onde o caso deve ir a seguir?"
              className="glass-input w-full resize-none rounded-2xl p-4 text-sm"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">Observações Técnicas / Internas</label>
              <span className="bg-muted px-2 py-0.5 rounded text-[10px] uppercase font-bold text-muted-foreground">Sigiloso</span>
            </div>
            <textarea
              value={form.observacoesInternas}
              onChange={(event) => setForm({ ...form, observacoesInternas: event.target.value })}
              rows={3}
              placeholder="Anotações cruciais invisíveis fora do setor..."
              className="glass-input w-full resize-none rounded-2xl border-dashed border-muted-foreground/30 p-4 text-sm"
            />
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4 transition-colors hover:bg-primary/10">
            <input
              type="checkbox"
              checked={form.necessidadeEncaminhamento}
              onChange={(event) => setForm({ ...form, necessidadeEncaminhamento: event.target.checked })}
              className="h-5 w-5 rounded border-border text-primary focus:ring-primary/20"
            />
            <div>
              <p className="font-display text-sm font-bold text-primary">Necessita Encaminhamento Inter-Setorial</p>
              <p className="max-w-[280px] mt-0.5 text-[11px] leading-tight text-primary/70">
                Alerta a gestão matriz para despachar o caso para um órgão terceirizado ativo.
              </p>
            </div>
          </label>
        </motion.section>

        <motion.div variants={itemVariants} className="pt-2">
          <motion.button
            whileTap={!mutation.isPending && selectedCaseId ? { scale: 0.98 } : {}}
            type="submit"
            disabled={mutation.isPending || !selectedCaseId}
            className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-primary px-4 py-4.5 font-display text-base font-bold text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {mutation.isPending ? (
              <>
                 <Loader2 className="h-5 w-5 animate-spin" />
                 Atualizando Diário...
              </>
            ) : (
               <>
                 <Stethoscope className="h-5 w-5" />
                 Lançar Atendimento Oficial
               </>
            )}
          </motion.button>
        </motion.div>
      </motion.form>
    </AppLayout>
  );
}
