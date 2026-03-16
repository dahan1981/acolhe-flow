import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import type { Priority } from "@/types/domain";

export default function NovoEncaminhamento() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get("caseId") || "";

  const { data: caseData } = useQuery({
    queryKey: ["case-detail", caseId],
    queryFn: () => api.getCase(caseId),
    enabled: Boolean(caseId),
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
        caseId,
        orgaoDestinoId: form.orgaoDestinoId,
        motivo: form.motivo,
        prioridade: form.prioridade,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["case-detail", caseId] }),
        queryClient.invalidateQueries({ queryKey: ["cases"] }),
        queryClient.invalidateQueries({ queryKey: ["professional-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["manager-dashboard"] }),
      ]);
      toast.success("Encaminhamento registrado com sucesso.");
      navigate(-1);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel registrar o encaminhamento.");
    },
  });

  return (
    <AppLayout title="Novo Encaminhamento" showBack>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <div>
          <label className="text-sm font-medium text-foreground">Caso</label>
          <div className="mt-1 bg-card p-3 rounded-xl shadow-card">
            <p className="text-sm font-medium text-foreground">
              {caseData?.caso.nomeSocial || caseData?.caso.nomeCompleto || "Carregando..."}
            </p>
            <p className="text-xs text-muted-foreground">Protocolo #{caseData?.caso.protocolo || "-"}</p>
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
          disabled={mutation.isPending}
          className="w-full py-4 bg-accent text-accent-foreground rounded-2xl font-semibold text-base shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all disabled:opacity-70"
        >
          {mutation.isPending ? "Registrando..." : "Registrar Encaminhamento"}
        </button>
      </form>
    </AppLayout>
  );
}
