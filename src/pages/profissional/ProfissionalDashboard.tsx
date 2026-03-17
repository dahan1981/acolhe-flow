import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRightLeft, Clock, FilePlus2, FileText, ShieldCheck, Stethoscope, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CaseCard } from "@/components/shared/CaseCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { api } from "@/lib/api";
import { roleDescriptions } from "@/lib/demo-content";
import { formatDate, getOrganizationName } from "@/lib/domain";

export default function ProfissionalDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["professional-dashboard"],
    queryFn: api.getProfessionalDashboard,
  });

  if (isLoading) {
    return (
      <AppLayout>
        <p className="text-sm text-muted-foreground">Carregando painel profissional...</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="rounded-[28px] border border-white/60 bg-card/90 p-5 shadow-card">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Operacao assistida
          </div>
          <h2 className="text-xl font-semibold text-foreground">Painel profissional</h2>
          <p className="mt-1 text-sm text-muted-foreground">{roleDescriptions.profissional}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button onClick={() => navigate("/profissional/novo-protocolo")} className="rounded-2xl bg-primary px-4 py-3 text-left text-sm font-medium text-primary-foreground shadow-card">
              <div className="mb-1 flex items-center gap-2">
                <FilePlus2 className="h-4 w-4" />
                Novo protocolo
              </div>
              <p className="text-xs text-primary-foreground/80">Cadastrar nova mulher e abrir caso</p>
            </button>
            <button onClick={() => navigate("/profissional/novo-atendimento")} className="rounded-2xl bg-background px-4 py-3 text-left text-sm font-medium text-foreground shadow-card">
              <div className="mb-1 flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-accent" />
                Novo atendimento
              </div>
              <p className="text-xs text-muted-foreground">Escolher caso, registrar atendimento e atualizar status</p>
            </button>
            <button onClick={() => navigate("/profissional/historico")} className="rounded-2xl bg-background px-4 py-3 text-left text-sm font-medium text-foreground shadow-card">
              Fila operacional
            </button>
            <button onClick={() => navigate("/profissional/permissoes")} className="rounded-2xl bg-background px-4 py-3 text-left text-sm font-medium text-foreground shadow-card">
              Ver permissoes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card/90 p-4 rounded-2xl shadow-card border border-border/70">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Casos ativos</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{data?.casosAtivos ?? 0}</p>
          </div>
          <div className="bg-card/90 p-4 rounded-2xl shadow-card border border-border/70">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Atendimentos hoje</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{data?.atendimentosHoje ?? 0}</p>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Casos prioritarios</h2>
            <button onClick={() => navigate("/profissional/casos")} className="text-xs font-medium text-primary">
              Ver todos
            </button>
          </div>
          <div className="space-y-3">
            {data?.casosPrioritarios.map((caso) => (
              <CaseCard key={caso.id} caso={caso} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Ultimos atendimentos</h2>
          <div className="space-y-3">
            {data?.ultimosAtendimentos.map((item) => (
              <div key={item.id} className="bg-card/90 p-4 rounded-2xl shadow-card border border-border/70">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{formatDate(item.data)}</span>
                  <StatusBadge type="risk" value={item.riscoIdentificado} />
                </div>
                <p className="text-sm font-medium text-foreground">{item.caso.nomeSocial || item.caso.nomeCompleto}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.tipoAtendimento} - {getOrganizationName(item.orgao)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-card">
          <div className="mb-2 flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Fluxo operacional</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            A equipe consegue alternar entre fila, detalhe do caso, registro de atendimento, encaminhamento, ajuda e
            permissoes sem perder o contexto do atendimento em curso.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
