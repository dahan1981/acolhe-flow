import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import type { Priority } from "@/types/domain";

export default function NovoEncaminhamento() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialCaseId = searchParams.get("caseId") || "";
  const [selectedCaseId, setSelectedCaseId] = useState(initialCaseId);
  const [caseSearch, setCaseSearch] = useState("");

  const { data: casesData } = useQuery({
    queryKey: ["cases", "", "todos", "referral-form"],
    queryFn: () => api.getCases("", "todos"),
  });

  const { data: caseData } = useQuery({
    queryKey: ["case-detail", selectedCaseId],
    queryFn: () => api.getCase(selectedCaseId),
    enabled: Boolean(selectedCaseId),
  });

  const { data: organizationsData } = useQuery({
    queryKey: ["organizations"],
    queryFn: api.getOrganizations,
  });

  const [form, setForm] = useState({
    orgaoDestinoId: "",
    motivo: "",
    prioridade: "media" as Priority,
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.createReferral({
        caseId: selectedCaseId,
        orgaoDestinoId: form.orgaoDestinoId,
        motivo: form.motivo,
        prioridade: form.prioridade,
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
      toast.success("Encaminhamento registrado com sucesso.");
      navigate(-1);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel registrar o encaminhamento.");
    },
  });

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
    caseData?.caso ?? (casesData?.casos ?? []).find((item) => item.id === selectedCaseId);

  return (
    <AppLayout title="Novo Encaminhamento" subtitle="O encaminhamento altera o status do caso e deixa o novo orgao visivel na demo." showBack>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!selectedCaseId) {
            toast.error("Selecione uma vitima antes de registrar o encaminhamento.");
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
          <label className="text-sm font-medium text-foreground">Caso</label>
          <div className="mt-1 min-h-[78px] bg-card/90 p-3 rounded-xl shadow-card border border-border/70">
            <p className="text-sm font-medium text-foreground">
              {selectedCase ? selectedCase.nomeSocial || selectedCase.nomeCompleto : "Nenhuma vitima selecionada"}
            </p>
            <p className="text-xs text-muted-foreground">
              Protocolo #{selectedCase ? selectedCase.protocolo : "aguardando selecao"}
            </p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Orgao de destino</label>
          <select
            value={form.orgaoDestinoId}
            onChange={(event) => setForm({ ...form, orgaoDestinoId: event.target.value })}
            className="mt-1 w-full p-3 bg-card rounded-xl border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          >
            <option value="">Selecione...</option>
            {organizationsData?.organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Motivo do encaminhamento</label>
          <textarea
            value={form.motivo}
            onChange={(event) => setForm({ ...form, motivo: event.target.value })}
            rows={4}
            className="mt-1 w-full p-3 bg-card rounded-xl border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Prioridade</label>
          <div className="mt-2 flex gap-2 flex-wrap">
            {([
              { v: "baixa", l: "Baixa" },
              { v: "media", l: "Media" },
              { v: "alta", l: "Alta" },
              { v: "urgente", l: "Urgente" },
            ] as Array<{ v: Priority; l: string }>).map((item) => (
              <button
                key={item.v}
                type="button"
                onClick={() => setForm({ ...form, prioridade: item.v })}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  form.prioridade === item.v ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border"
                }`}
              >
                {item.l}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || !selectedCaseId}
          className="w-full py-4 bg-accent text-accent-foreground rounded-2xl font-semibold text-base shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all disabled:opacity-70"
        >
          {mutation.isPending ? "Registrando..." : "Registrar Encaminhamento"}
        </button>
      </form>
    </AppLayout>
  );
}
