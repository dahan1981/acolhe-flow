import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Bell, BookHeart, Clock, Shield, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { api } from "@/lib/api";
import { roleDescriptions } from "@/lib/demo-content";
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
        <div className="rounded-[28px] border border-white/60 bg-card/90 p-5 shadow-card space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Ambiente acolhedor
          </div>
          <p className="text-sm text-muted-foreground">{roleDescriptions.mulher}</p>
          <button
            onClick={() => navigate("/mulher/ajuda")}
            className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-card"
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
        <div className="rounded-[28px] border border-white/60 bg-card/90 p-5 shadow-card">
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
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/mulher/historico")}
              className="rounded-2xl bg-background px-4 py-3 text-left text-sm font-medium text-foreground shadow-card"
            >
              Ver historico
            </button>
            <button
              onClick={() => navigate("/mulher/notificacoes")}
              className="rounded-2xl bg-background px-4 py-3 text-left text-sm font-medium text-foreground shadow-card"
            >
              Abrir alertas
            </button>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">O que voce precisa?</h2>
            <button onClick={() => navigate("/mulher/central-ajuda")} className="text-xs font-medium text-primary">
              Central de ajuda
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {["Apoio juridico", "Saude", "Abrigo", "Assistencia social"].map((item) => (
              <button
                key={item}
                onClick={() => navigate("/mulher/ajuda")}
                className="bg-card/90 p-4 rounded-2xl shadow-card hover:shadow-card-hover transition-all text-left active:scale-[0.98] border border-border/70"
              >
                <p className="text-sm font-medium text-foreground">{item}</p>
                <p className="text-xs text-muted-foreground mt-1">Solicitar apoio</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/mulher/caso")}
            className="rounded-[24px] border border-border/70 bg-card/90 p-4 text-left shadow-card"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Status</p>
            <p className="mt-2 text-sm font-semibold text-foreground">Acompanhar meu caso</p>
          </button>
          <button
            onClick={() => navigate("/mulher/perfil")}
            className="rounded-[24px] border border-border/70 bg-card/90 p-4 text-left shadow-card"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Conta</p>
            <p className="mt-2 text-sm font-semibold text-foreground">Perfil e configuracoes</p>
          </button>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Atividade recente</h2>
          <div className="space-y-3">
            {data?.atendimentosRecentes.slice(0, 3).map((item) => (
              <div key={item.id} className="bg-card/90 p-4 rounded-2xl shadow-card border border-border/70">
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
          <div className="bg-card/90 p-4 rounded-2xl shadow-card space-y-3 border border-border/70">
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
            <div className="bg-card/90 p-4 rounded-2xl shadow-card space-y-3 border border-border/70">
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

        <div className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-card">
          <div className="mb-2 flex items-center gap-2">
            <BookHeart className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Orientacao rapida</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Este ambiente foi desenhado para reduzir complexidade. As principais acoes ficam visiveis logo na entrada, com acesso
            rapido ao pedido de ajuda, historico do caso e central de orientacoes.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
