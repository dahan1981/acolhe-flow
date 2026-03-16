import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Shield, Clock, ArrowRight, Bell } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { api } from "@/lib/api";
import { formatDate, getOrganizationName } from "@/lib/domain";

export default function MulherDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["woman-dashboard"],
    queryFn: api.getWomanDashboard,
  });

  if (isLoading) {
    return (
      <AppLayout>
        <p className="text-sm text-muted-foreground">Carregando seu caso...</p>
      </AppLayout>
    );
  }

  const caso = data?.caso;

  if (!caso) {
    return (
      <AppLayout>
        <div className="bg-card p-5 rounded-2xl shadow-card space-y-3">
          <p className="text-sm text-muted-foreground">Voce ainda nao possui caso ativo.</p>
          <button
            onClick={() => navigate("/mulher/ajuda")}
            className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold"
          >
            Solicitar ajuda agora
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="bg-card p-5 rounded-2xl shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status do seu caso</p>
              <p className="font-semibold text-foreground">Protocolo #{caso.protocolo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <StatusBadge type="status" value={caso.status} />
            <StatusBadge type="risk" value={caso.situacaoRisco} />
          </div>
          <p className="text-sm text-muted-foreground">
            Seu caso esta sendo acompanhado por {getOrganizationName(caso.orgaoAtual)}. O ultimo registro foi em{" "}
            {formatDate(caso.atendimentos[0]?.data || caso.dataPrimeiroAtendimento)}.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">O que voce precisa?</h2>
          <div className="grid grid-cols-2 gap-3">
            {["Apoio juridico", "Saude", "Abrigo", "Assistencia social"].map((item) => (
              <button
                key={item}
                onClick={() => navigate("/mulher/ajuda")}
                className="bg-card p-4 rounded-2xl shadow-card hover:shadow-card-hover transition-all text-left active:scale-[0.98]"
              >
                <p className="text-sm font-medium text-foreground">{item}</p>
                <p className="text-xs text-muted-foreground mt-1">Solicitar apoio</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Atividade recente</h2>
          <div className="space-y-3">
            {data?.atendimentosRecentes.slice(0, 3).map((item) => (
              <div key={item.id} className="bg-card p-4 rounded-2xl shadow-card">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{formatDate(item.data)}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{item.tipoAtendimento}</p>
                <p className="text-xs text-muted-foreground mt-1">{getOrganizationName(item.orgao)}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Quem acessou seu caso</h2>
          <div className="bg-card p-4 rounded-2xl shadow-card space-y-3">
            {data?.encaminhamentosRecentes.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <ArrowRight className="w-4 h-4 text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{getOrganizationName(item.orgaoDestino)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(item.data)}</p>
                </div>
                <StatusBadge type="encaminhamento" value={item.status} />
              </div>
            ))}
          </div>
        </div>

        {data?.solicitacoesApoio.length ? (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Solicitacoes de apoio</h2>
            <div className="bg-card p-4 rounded-2xl shadow-card space-y-3">
              {data.solicitacoesApoio.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">{item.tipo}</p>
                    <p className="text-xs text-muted-foreground">{new Date(item.data).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
