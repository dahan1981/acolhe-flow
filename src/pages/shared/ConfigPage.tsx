import { useMemo, useState } from "react";
import { Bell, HelpCircle, Info, Lock, Shield, ToggleLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuthStore } from "@/stores/auth-store";

export default function ConfigPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [toggles, setToggles] = useState({
    resumoDiario: true,
    alertaPrioridade: true,
    modoDiscreto: false,
  });

  const basePath = useMemo(() => {
    if (!currentUser) return "";
    if (currentUser.perfil === "mulher") return "/mulher";
    if (currentUser.perfil === "profissional") return "/profissional";
    return "/gestora";
  }, [currentUser]);

  const items = [
    { icon: Bell, label: "Notificacoes", desc: "Gerenciar alertas e avisos visuais", path: `${basePath}/notificacoes` },
    { icon: Lock, label: "Seguranca", desc: "Entender boas praticas e protecao de acesso", path: `${basePath}/seguranca` },
    { icon: Shield, label: "Permissoes", desc: "Ver escopo de acesso deste perfil", path: `${basePath}/permissoes` },
    { icon: HelpCircle, label: "Ajuda", desc: "Consultar orientacoes e fluxo de uso", path: `${basePath}/ajuda` },
    { icon: Info, label: "Sobre", desc: "Conhecer a proposta institucional do sistema", path: `${basePath}/sobre` },
  ];

  return (
    <AppLayout title="Configuracoes" subtitle="Preferencias de uso, notificacoes e privacidade para o periodo de testes assistidos.">
      <div className="space-y-5">
        <section className="rounded-[28px] border border-white/60 bg-card/90 p-5 shadow-card">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ToggleLeft className="h-3.5 w-3.5" />
            Preferencias
          </div>
          <h2 className="text-xl font-semibold text-foreground">Ajustes do ambiente</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Os controles abaixo organizam configuracoes de notificacao e modo de uso para apoiar a operacao durante a implantacao inicial.
          </p>
        </section>

        <section className="space-y-3">
          {[
            {
              key: "resumoDiario",
              title: "Receber resumo diario",
              description: "Mostra um resumo com movimentacoes relevantes do ambiente.",
            },
            {
              key: "alertaPrioridade",
              title: "Destacar alertas prioritarios",
              description: "Reforca mensagens sensiveis com maior contraste visual.",
            },
            {
              key: "modoDiscreto",
              title: "Ativar modo discreto",
              description: "Reduz informacoes sensiveis na primeira leitura da tela.",
            },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-4 rounded-[24px] border border-border/70 bg-card/90 p-4 shadow-card">
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <button
                onClick={() =>
                  setToggles((current) => ({
                    ...current,
                    [item.key]: !current[item.key as keyof typeof current],
                  }))
                }
                className={`h-8 w-14 rounded-full transition-all ${toggles[item.key as keyof typeof toggles] ? "bg-primary" : "bg-muted"}`}
              >
                <span
                  className={`block h-6 w-6 rounded-full bg-white transition-all ${
                    toggles[item.key as keyof typeof toggles] ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-4 bg-card/90 p-4 rounded-[24px] shadow-card hover:shadow-card-hover transition-all text-left active:scale-[0.98] border border-border/70"
            >
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </button>
          ))}
        </section>
      </div>
    </AppLayout>
  );
}
