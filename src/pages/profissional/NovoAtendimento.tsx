import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Search, Stethoscope } from "lucide-react";
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
      toast.success("Atendimento registrado com sucesso.");
      navigate(-1);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel registrar o atendimento.");
    },
  });

  const tipos = [
    "Acolhimento inicial",
    "Reavaliacao de risco",
    "Atendimento psicossocial",
    "Orientacao juridica",
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

  return (
    <AppLayout
      title="Registrar atendimento"
      subtitle="Selecione um caso ja aberto, registre a acao executada e atualize o andamento compartilhado."
      showBack
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!selectedCaseId) {
            toast.error("Selecione um caso antes de salvar o atendimento.");
            return;
          }
          mutation.mutate();
        }}
        className="space-y-5"
      >
        <section className="rounded-[26px] border border-primary/15 bg-card/95 p-5 shadow-card">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ClipboardCheck className="h-3.5 w-3.5" />
            Etapa 1 de 2
          </div>
          <h2 className="text-lg font-semibold text-foreground">Selecao do caso</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            O atendimento sempre fica vinculado a um caso e a um protocolo ja existentes, preservando a leitura do historico unico.
          </p>

          <div className="mt-4 space-y-3 rounded-[24px] border border-border/70 bg-background/70 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={caseSearch}
                onChange={(event) => setCaseSearch(event.target.value)}
                placeholder="Buscar por nome, protocolo ou nome social"
                className="w-full rounded-2xl border border-border/70 bg-background pl-10 pr-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary"
              />
            </div>
            <select
              value={selectedCaseId}
              onChange={(event) => setSelectedCaseId(event.target.value)}
              className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary"
              required
            >
              <option value="">Selecione o caso</option>
              {availableCases.map((item) => (
                <option key={item.id} value={item.id}>
                  {(item.nomeSocial || item.nomeCompleto) + " • protocolo " + item.protocolo}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 rounded-[24px] border border-border/70 bg-background px-4 py-4">
            <p className="text-sm font-semibold text-foreground">
              {selectedCase ? selectedCase.nomeSocial || selectedCase.nomeCompleto : "Nenhum caso selecionado"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedCase ? `Protocolo ${selectedCase.protocolo} • ${getOrganizationName(selectedCase.orgaoEntrada)}` : "Selecione um caso para visualizar o protocolo e os dados de referencia."}
            </p>
            {selectedCase ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  Etnia/cor: {ethnicityLabel(selectedCase.etniaCor ?? "nao_informada")}
                </span>
                {(selectedCase.tiposViolencia ?? []).map((tipo) => (
                  <span key={tipo} className="rounded-full bg-warning/10 px-2.5 py-1 text-[11px] font-medium text-warning">
                    {violenceTypeLabel(tipo)}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid gap-4 rounded-[26px] border border-border/70 bg-card/95 p-5 shadow-card">
          <div>
            <label className="text-sm font-medium text-foreground">Tipo de atendimento</label>
            <select
              value={form.tipoAtendimento}
              onChange={(event) => setForm({ ...form, tipoAtendimento: event.target.value })}
              className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            >
              <option value="">Selecione a acao realizada</option>
              {tipos.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Resumo do atendimento</label>
            <textarea
              value={form.resumo}
              onChange={(event) => setForm({ ...form, resumo: event.target.value })}
              rows={4}
              placeholder="Registre o atendimento realizado, a escuta qualificada e os encaminhamentos sugeridos."
              className="mt-1 w-full rounded-2xl border border-border bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Classificacao de risco atual</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {riskOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setForm({ ...form, riscoIdentificado: item.value })}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    form.riscoIdentificado === item.value
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-muted-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Tipos de violencia observados ou confirmados</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {violenceTypeOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => toggleViolenceType(item.value)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    form.tiposViolencia.includes(item.value)
                      ? "bg-warning text-warning-foreground"
                      : "border border-border bg-background text-muted-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Proximos passos</label>
            <textarea
              value={form.proximosPassos}
              onChange={(event) => setForm({ ...form, proximosPassos: event.target.value })}
              rows={3}
              placeholder="Informe o que deve ocorrer depois deste atendimento."
              className="mt-1 w-full rounded-2xl border border-border bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Observacao operacional</label>
            <textarea
              value={form.observacoesInternas}
              onChange={(event) => setForm({ ...form, observacoesInternas: event.target.value })}
              rows={3}
              placeholder="Use este campo para orientar a equipe interna, sem expor informacoes alem do necessario."
              className="mt-1 w-full rounded-2xl border border-border bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background px-4 py-4 shadow-card">
            <input
              type="checkbox"
              checked={form.necessidadeEncaminhamento}
              onChange={(event) => setForm({ ...form, necessidadeEncaminhamento: event.target.checked })}
              className="h-5 w-5 rounded border-border text-primary focus:ring-primary/20"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Encaminhamento necessario</p>
              <p className="text-xs text-muted-foreground">Marque quando a equipe precisar direcionar o caso para outro orgao.</p>
            </div>
          </label>
        </section>

        <button
          type="submit"
          disabled={mutation.isPending || !selectedCaseId}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-card transition-all hover:shadow-card-hover active:scale-[0.98] disabled:opacity-70"
        >
          <Stethoscope className="h-4 w-4" />
          {mutation.isPending ? "Salvando atendimento..." : "Salvar atendimento"}
        </button>
      </form>
    </AppLayout>
  );
}
