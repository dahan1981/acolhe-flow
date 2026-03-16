import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Calendar, FileText, MapPin, Phone, PlusCircle, User } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Timeline } from "@/components/shared/Timeline";
import { api } from "@/lib/api";
import { formatDate, getOrganizationName } from "@/lib/domain";
import { useAuthStore } from "@/stores/auth-store";

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["case-detail", id],
    queryFn: () => api.getCase(id || ""),
    enabled: Boolean(id),
  });

  const statusMutation = useMutation({
    mutationFn: (status: "em_andamento" | "resolvido" | "arquivado") => api.updateCaseStatus(id || "", status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["case-detail", id] }),
        queryClient.invalidateQueries({ queryKey: ["cases"] }),
        queryClient.invalidateQueries({ queryKey: ["manager-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["professional-dashboard"] }),
      ]);
      toast.success("Status do caso atualizado.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Falha ao atualizar o status."),
  });

  if (isLoading) {
    return (
      <AppLayout title="Carregando caso" showBack>
        <p className="text-muted-foreground text-center py-12">Carregando...</p>
      </AppLayout>
    );
  }

  const caso = data?.caso;

  if (!caso) {
    return (
      <AppLayout title="Caso nao encontrado" showBack>
        <p className="text-muted-foreground text-center py-12">Caso nao encontrado.</p>
      </AppLayout>
    );
  }

  const canEdit = currentUser?.perfil === "profissional";

  return (
    <AppLayout title={`#${caso.protocolo}`} showBack>
      <div className="space-y-4">
        <div className="bg-card p-5 rounded-2xl shadow-card">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-foreground">{caso.nomeCompleto}</h2>
              {caso.nomeSocial && <p className="text-sm text-muted-foreground">Nome social: {caso.nomeSocial}</p>}
            </div>
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            <StatusBadge type="status" value={caso.status} />
            <StatusBadge type="risk" value={caso.situacaoRisco} />
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 shrink-0" />
              <span>CPF: {caso.perfilMulher.cpf}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 shrink-0" />
              <span>{caso.perfilMulher.telefone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>
                {caso.perfilMulher.endereco}, {caso.perfilMulher.municipio} - {caso.perfilMulher.uf}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Primeiro atendimento: {formatDate(caso.dataPrimeiroAtendimento)}</span>
            </div>
          </div>
        </div>

        <div className="bg-card p-4 rounded-2xl shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-2">Observacoes iniciais</h3>
          <p className="text-sm text-muted-foreground">{caso.observacoesIniciais}</p>
        </div>

        <div className="bg-card p-4 rounded-2xl shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-3">Gestao do caso</h3>
          <div className="flex gap-2 flex-wrap">
            {(["em_andamento", "resolvido", "arquivado"] as const).map((status) => (
              <button
                key={status}
                onClick={() => statusMutation.mutate(status)}
                disabled={statusMutation.isPending || !canEdit}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-background border border-border text-foreground disabled:opacity-60"
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {canEdit ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate(`/profissional/novo-atendimento?caseId=${caso.id}`)}
              className="flex items-center gap-2 bg-primary text-primary-foreground p-3 rounded-2xl font-medium text-sm shadow-card active:scale-[0.98] transition-all justify-center"
            >
              <PlusCircle className="w-4 h-4" />
              Atendimento
            </button>
            <button
              onClick={() => navigate(`/profissional/novo-encaminhamento?caseId=${caso.id}`)}
              className="flex items-center gap-2 bg-accent text-accent-foreground p-3 rounded-2xl font-medium text-sm shadow-card active:scale-[0.98] transition-all justify-center"
            >
              <ArrowRight className="w-4 h-4" />
              Encaminhar
            </button>
          </div>
        ) : null}

        <div className="bg-card p-4 rounded-2xl shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-2">Orgao atual</h3>
          <p className="text-sm text-muted-foreground">{getOrganizationName(caso.orgaoAtual)}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Historico ({caso.atendimentos.length + caso.encaminhamentos.length} registros)
          </h3>
          <Timeline atendimentos={caso.atendimentos} encaminhamentos={caso.encaminhamentos} />
        </div>
      </div>
    </AppLayout>
  );
}
