import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import type { RiskLevel } from "@/types/domain";

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
    "Acolhimento Inicial",
    "Acompanhamento Social",
    "Atendimento Psicologico",
    "Orientacao Juridica",
    "Registro de Ocorrencia",
    "Acolhimento em Abrigo",
    "Visita Domiciliar",
    "Reavaliacao de Risco",
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

  const selectedCase =
    data?.caso ?? (casesData?.casos ?? []).find((item) => item.id === selectedCaseId);

  return (
    <AppLayout title="Novo Atendimento" subtitle="O registro atualiza o historico do caso e o andamento visivel para os demais perfis." showBack>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!selectedCaseId) {
            toast.error("Selecione uma vitima antes de registrar o atendimento.");
            return;
          }
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <div>
          <label className="text-sm font-medium text-foreground">Vitima / caso</label>
          <div className="mt-1 rounded-[24px] border border-border/70 bg-card/90 p-4 shadow-card space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={caseSearch}
                onChange={(event) => setCaseSearch(event.target.value)}
                placeholder="Buscar por nome ou protocolo"
                className="w-full rounded-2xl border border-border/70 bg-background pl-10 pr-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary"
              />
            </div>
            <select
              value={selectedCaseId}
              onChange={(event) => setSelectedCaseId(event.target.value)}
              className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary"
              required
            >
              <option value="">Selecione a vitima</option>
              {availableCases.map((item) => (
                <option key={item.id} value={item.id}>
                  {(item.nomeSocial || item.nomeCompleto) + " • #" + item.protocolo}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Caso selecionado</label>
          <div className="mt-1 min-h-[78px] rounded-xl border border-border/70 bg-card/90 p-3 shadow-card">
            <p className="text-sm font-medium text-foreground">
              {selectedCase ? selectedCase.nomeSocial || selectedCase.nomeCompleto : "Nenhuma vitima selecionada"}
            </p>
            <p className="text-xs text-muted-foreground">
              Protocolo #{selectedCase ? selectedCase.protocolo : "aguardando selecao"}
            </p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Tipo de atendimento</label>
          <select
            value={form.tipoAtendimento}
            onChange={(event) => setForm({ ...form, tipoAtendimento: event.target.value })}
            className="mt-1 w-full p-3 bg-card rounded-xl border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          >
            <option value="">Selecione...</option>
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
            className="mt-1 w-full p-3 bg-card rounded-xl border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Risco identificado</label>
          <div className="mt-2 flex gap-2 flex-wrap">
            {(["baixo", "medio", "alto", "critico"] as RiskLevel[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setForm({ ...form, riscoIdentificado: item })}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  form.riscoIdentificado === item ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border"
                }`}
              >
                {item}
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
            className="mt-1 w-full p-3 bg-card rounded-xl border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        <div className="flex items-center gap-3 bg-card p-4 rounded-xl shadow-card">
          <input
            type="checkbox"
            id="encaminhamento"
            checked={form.necessidadeEncaminhamento}
            onChange={(event) => setForm({ ...form, necessidadeEncaminhamento: event.target.checked })}
            className="w-5 h-5 rounded border-border text-primary focus:ring-primary/20"
          />
          <label htmlFor="encaminhamento" className="text-sm text-foreground">
            Necessita encaminhamento para outro orgao
          </label>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || !selectedCaseId}
          className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-semibold text-base shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all disabled:opacity-70"
        >
          {mutation.isPending ? "Registrando..." : "Registrar Atendimento"}
        </button>
      </form>
    </AppLayout>
  );
}
