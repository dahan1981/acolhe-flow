import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import type { RiskLevel } from "@/types/domain";

export default function NovoAtendimento() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get("caseId") || "";

  const { data } = useQuery({
    queryKey: ["case-detail", caseId],
    queryFn: () => api.getCase(caseId),
    enabled: Boolean(caseId),
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
        caseId,
        tipoAtendimento: form.tipoAtendimento,
        resumo: form.resumo,
        riscoIdentificado: form.riscoIdentificado,
        necessidadeEncaminhamento: form.necessidadeEncaminhamento,
        proximosPassos: form.proximosPassos,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["case-detail", caseId] }),
        queryClient.invalidateQueries({ queryKey: ["cases"] }),
        queryClient.invalidateQueries({ queryKey: ["professional-dashboard"] }),
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

  return (
    <AppLayout title="Novo Atendimento" showBack>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <div>
          <label className="text-sm font-medium text-foreground">Caso selecionado</label>
          <div className="mt-1 bg-card p-3 rounded-xl shadow-card">
            <p className="text-sm font-medium text-foreground">
              {data?.caso.nomeSocial || data?.caso.nomeCompleto || "Carregando..."}
            </p>
            <p className="text-xs text-muted-foreground">Protocolo #{data?.caso.protocolo || "-"}</p>
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
          disabled={mutation.isPending}
          className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-semibold text-base shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all disabled:opacity-70"
        >
          {mutation.isPending ? "Registrando..." : "Registrar Atendimento"}
        </button>
      </form>
    </AppLayout>
  );
}
