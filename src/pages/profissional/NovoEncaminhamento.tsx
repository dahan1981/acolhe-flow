import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Search } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { getOrganizationName, violenceTypeLabel } from "@/lib/domain";
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

  const selectedCase = caseData?.caso ?? (casesData?.casos ?? []).find((item) => item.id === selectedCaseId);

  return (
    <AppLayout
      title="Criar encaminhamento"
      subtitle="Direcione o caso para outro orgao da rede e atualize o historico compartilhado."
      showBack
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!selectedCaseId) {
            toast.error("Selecione um caso antes de registrar o encaminhamento.");
            return;
          }
          mutation.mutate();
        }}
        className="space-y-5"
      >
        <section className="rounded-[26px] border border-primary/15 bg-card/95 p-5 shadow-card">
          <h2 className="text-lg font-semibold text-foreground">Caso de referencia</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            O encaminhamento preserva o caso e o protocolo de origem, acrescentando o orgao de destino e a justificativa da decisao.
          </p>
          <div className="mt-4 space-y-3 rounded-[24px] border border-border/70 bg-background/70 p-4">
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
              {selectedCase ? `Protocolo ${selectedCase.protocolo} • orgao atual ${getOrganizationName(selectedCase.orgaoEntrada)}` : "Selecione o caso para consultar o protocolo e o orgao de origem."}
            </p>
            {selectedCase?.tiposViolencia?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedCase.tiposViolencia.map((tipo) => (
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
            <label className="text-sm font-medium text-foreground">Orgao de destino</label>
            <select
              value={form.orgaoDestinoId}
              onChange={(event) => setForm({ ...form, orgaoDestinoId: event.target.value })}
              className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            >
              <option value="">Selecione o orgao de destino</option>
              {organizationsData?.organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Justificativa do encaminhamento</label>
            <textarea
              value={form.motivo}
              onChange={(event) => setForm({ ...form, motivo: event.target.value })}
              rows={4}
              placeholder="Explique por que o caso deve seguir para outro orgao, o objetivo esperado e o contexto da articulacao."
              className="mt-1 w-full rounded-2xl border border-border bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Prioridade do encaminhamento</label>
            <div className="mt-2 flex flex-wrap gap-2">
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
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    form.prioridade === item.v ? "bg-accent text-accent-foreground" : "border border-border bg-background text-muted-foreground"
                  }`}
                >
                  {item.l}
                </button>
              ))}
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={mutation.isPending || !selectedCaseId}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-base font-semibold text-accent-foreground shadow-card transition-all hover:shadow-card-hover active:scale-[0.98] disabled:opacity-70"
        >
          <ArrowRightLeft className="h-4 w-4" />
          {mutation.isPending ? "Salvando encaminhamento..." : "Salvar encaminhamento"}
        </button>
      </form>
    </AppLayout>
  );
}
