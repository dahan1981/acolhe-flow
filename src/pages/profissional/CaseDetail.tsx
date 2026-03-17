import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Calendar, ClipboardList, FileText, MapPin, Phone, PlusCircle, User } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Timeline } from "@/components/shared/Timeline";
import { api } from "@/lib/api";
import { ethnicityLabel, formatDate, getOrganizationName, violenceTypeLabel } from "@/lib/domain";
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
        queryClient.invalidateQueries({ queryKey: ["woman-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["woman-case"] }),
      ]);
      toast.success("Status do caso atualizado.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Falha ao atualizar o status."),
  });

  if (isLoading) {
    return (
      <AppLayout title="Carregando caso" showBack>
        <p className="py-12 text-center text-muted-foreground">Carregando informacoes do caso...</p>
      </AppLayout>
    );
  }

  const caso = data?.caso;

  if (!caso) {
    return (
      <AppLayout title="Caso nao encontrado" showBack>
        <p className="py-12 text-center text-muted-foreground">Nao foi possivel localizar o caso solicitado.</p>
      </AppLayout>
    );
  }

  const canEdit = currentUser?.perfil === "profissional" || currentUser?.perfil === "gestora";
  const basePath = currentUser?.perfil === "gestora" ? "/gestora" : "/profissional";

  return (
    <AppLayout title={`Caso ${caso.protocolo}`} subtitle="Consulte dados principais, acompanhe a timeline unica e registre a proxima acao." showBack>
      <div className="space-y-5">
        <section className="rounded-[28px] border border-white/60 bg-card/95 p-5 shadow-card">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Caso
                </span>
                <span>Protocolo {caso.protocolo}</span>
              </div>
              <h2 className="text-lg font-semibold text-foreground">{caso.nomeCompleto}</h2>
              {caso.nomeSocial ? <p className="text-sm text-muted-foreground">Nome social: {caso.nomeSocial}</p> : null}
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <StatusBadge type="status" value={caso.status} />
            <StatusBadge type="risk" value={caso.situacaoRisco} />
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              Etnia/cor: {ethnicityLabel(caso.etniaCor ?? "nao_informada")}
            </span>
          </div>

          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-2xl bg-background px-3 py-3">
              <FileText className="h-4 w-4 shrink-0" />
              CPF: {caso.perfilMulher.cpf}
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-background px-3 py-3">
              <Phone className="h-4 w-4 shrink-0" />
              {caso.perfilMulher.telefone}
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-background px-3 py-3 sm:col-span-2">
              <MapPin className="h-4 w-4 shrink-0" />
              {caso.perfilMulher.endereco}, {caso.perfilMulher.municipio} - {caso.perfilMulher.uf}
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-background px-3 py-3">
              <Calendar className="h-4 w-4 shrink-0" />
              Abertura: {formatDate(caso.dataPrimeiroAtendimento)}
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-background px-3 py-3">
              <ArrowRight className="h-4 w-4 shrink-0" />
              Orgao atual: {getOrganizationName(caso.orgaoAtual)}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(caso.tiposViolencia ?? []).map((tipo) => (
              <span key={tipo} className="rounded-full bg-warning/10 px-2.5 py-1 text-[11px] font-medium text-warning">
                {violenceTypeLabel(tipo)}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-border/70 bg-card/95 p-5 shadow-card">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Resumo inicial</p>
              <h3 className="text-base font-semibold text-foreground">Contexto de abertura</h3>
            </div>
            <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              Atribuida para {caso.atribuidaPara || "fila de triagem"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{caso.observacoesIniciais}</p>
        </section>

        <section className="rounded-[24px] border border-border/70 bg-card/95 p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Acoes principais</p>
              <h3 className="text-base font-semibold text-foreground">Conducao operacional do caso</h3>
            </div>
            {canEdit ? (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Atualizacao compartilhada</span>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => navigate(`${basePath}/novo-atendimento?caseId=${caso.id}`)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary p-4 text-sm font-semibold text-primary-foreground shadow-card transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              Registrar atendimento
            </button>
            <button
              onClick={() => navigate(`${basePath}/novo-encaminhamento?caseId=${caso.id}`)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-accent p-4 text-sm font-semibold text-accent-foreground shadow-card transition-all"
            >
              <ArrowRight className="h-4 w-4" />
              Criar encaminhamento
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {([
              { value: "em_andamento", label: "Marcar em andamento" },
              { value: "resolvido", label: "Concluir caso" },
              { value: "arquivado", label: "Arquivar caso" },
            ] as const).map((status) => (
              <button
                key={status.value}
                onClick={() => statusMutation.mutate(status.value)}
                disabled={statusMutation.isPending || !canEdit}
                className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground disabled:opacity-60"
              >
                {status.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Atendimentos, status e encaminhamentos atualizam o mesmo historico visivel para a mulher acolhida e para a gestao.
          </p>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Timeline unica</p>
              <h3 className="text-base font-semibold text-foreground">Evolucao do caso</h3>
            </div>
            <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              {caso.atendimentos.length} atendimentos • {caso.encaminhamentos.length} encaminhamentos
            </span>
          </div>
          <Timeline caso={caso} atendimentos={caso.atendimentos} encaminhamentos={caso.encaminhamentos} solicitacoesApoio={caso.solicitacoesApoio} />
        </section>
      </div>
    </AppLayout>
  );
}
