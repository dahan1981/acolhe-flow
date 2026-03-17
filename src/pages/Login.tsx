import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Heart, Users, BarChart3, CheckCircle2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import type { RegisterWomanPayload, UserProfile } from "@/types/domain";

const profiles: Array<{ id: UserProfile; label: string; desc: string; icon: React.ElementType }> = [
  { id: "mulher", label: "Mulher", desc: "Acompanhe seu caso e solicite apoio", icon: Heart },
  { id: "profissional", label: "Profissional", desc: "Gerencie atendimentos e encaminhamentos", icon: Users },
  { id: "gestora", label: "Gestora", desc: "Painel de indicadores e relatorios", icon: BarChart3 },
];

const initialRegisterState: RegisterWomanPayload = {
  nomeCompleto: "",
  nomeSocial: "",
  email: "",
  password: "",
  cpf: "",
  dataNascimento: "",
  telefone: "",
  endereco: "",
  municipio: "",
  uf: "RJ",
};

function homePath(profile: UserProfile) {
  if (profile === "mulher") return "/mulher";
  if (profile === "profissional") return "/profissional";
  return "/gestora";
}

export default function Login() {
  const navigate = useNavigate();
  const { login, registerWoman } = useAuthStore();
  const [selectedProfile, setSelectedProfile] = useState<UserProfile>("mulher");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState(initialRegisterState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const user = await login({
        ...loginForm,
        perfil: selectedProfile,
      });
      navigate(homePath(user.perfil));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel entrar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegisterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const user = await registerWoman(registerForm);
      toast.success("Cadastro criado com sucesso.");
      navigate(homePath(user.perfil));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel criar a conta.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-6 py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,rgba(38,110,150,0.18),transparent_38%),radial-gradient(circle_at_top_right,rgba(63,157,136,0.14),transparent_30%)]" />
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center gap-8">
        <div className="hidden max-w-md flex-1 lg:block">
          <div className="rounded-[32px] border border-white/60 bg-card/80 p-8 shadow-elevated backdrop-blur-sm">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Fase piloto assistida
            </div>
            <h1 className="text-4xl font-semibold text-foreground">Acolhe Flow</h1>
            <p className="mt-3 text-base text-muted-foreground">
              Plataforma para acolhimento, operacao e monitoramento integrado da rede de atendimento a mulher em fase de testes controlados.
            </p>
            <div className="mt-8 space-y-3">
              {[
                "Ambientes proprios para Mulher, Profissional e Gestora",
                "Navegacao completa com dashboards, historicos, protocolos e areas institucionais",
                "Fluxos acompanhados por equipe autorizada durante a implantacao inicial",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-background/80 px-4 py-3 shadow-card">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-accent" />
                  <p className="text-sm text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex w-full max-w-md flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4 shadow-card">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold text-foreground">Acolhe Flow</h1>
          <p className="text-sm text-muted-foreground mt-2">Plataforma unificada de acolhimento, atendimento e gestao em operacao assistida</p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => {
                setSelectedProfile(profile.id);
                if (profile.id !== "mulher") setMode("login");
              }}
              className={`rounded-[24px] border p-3 text-left transition-all ${
                selectedProfile === profile.id ? "border-primary/20 bg-primary text-primary-foreground shadow-card" : "border-border/70 bg-card/90 shadow-card"
              }`}
            >
              <profile.icon className="w-5 h-5 mb-2" />
              <p className="text-sm font-semibold">{profile.label}</p>
              <p className={`text-[11px] leading-4 ${selectedProfile === profile.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {profile.desc}
              </p>
            </button>
          ))}
        </div>

        {selectedProfile === "mulher" && (
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-2xl py-2.5 text-sm font-medium ${mode === "login" ? "bg-primary text-primary-foreground shadow-card" : "bg-card/90 text-muted-foreground shadow-card"}`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-2xl py-2.5 text-sm font-medium ${mode === "register" ? "bg-primary text-primary-foreground shadow-card" : "bg-card/90 text-muted-foreground shadow-card"}`}
            >
              Criar conta
            </button>
          </div>
        )}

        {mode === "login" || selectedProfile !== "mulher" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 bg-card/90 rounded-[32px] p-6 shadow-elevated border border-white/60">
            <div>
              <label className="text-sm font-medium text-foreground">E-mail</label>
              <input
                type="email"
                required
                value={loginForm.email}
                onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Senha</label>
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 bg-primary text-primary-foreground rounded-2xl font-semibold text-base shadow-card hover:shadow-card-hover transition-all duration-200 active:scale-[0.98] disabled:opacity-70"
            >
              {isSubmitting ? "Entrando..." : `Entrar como ${profiles.find((item) => item.id === selectedProfile)?.label}`}
            </button>
            <p className="text-xs text-muted-foreground text-center">
              O cadastro publico permanece disponivel apenas para mulheres acolhidas.
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 bg-card/90 rounded-[32px] p-6 shadow-elevated border border-white/60">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-sm font-medium text-foreground">Nome completo</label>
                <input
                  type="text"
                  required
                  value={registerForm.nomeCompleto}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, nomeCompleto: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-foreground">Nome social</label>
                <input
                  type="text"
                  value={registerForm.nomeSocial}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, nomeSocial: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">CPF</label>
                <input
                  type="text"
                  required
                  value={registerForm.cpf}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, cpf: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Nascimento</label>
                <input
                  type="date"
                  required
                  value={registerForm.dataNascimento}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, dataNascimento: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-foreground">Telefone</label>
                <input
                  type="text"
                  required
                  value={registerForm.telefone}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, telefone: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-foreground">Endereco</label>
                <input
                  type="text"
                  required
                  value={registerForm.endereco}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, endereco: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Municipio</label>
                <input
                  type="text"
                  required
                  value={registerForm.municipio}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, municipio: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">UF</label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={registerForm.uf}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, uf: event.target.value.toUpperCase() }))}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-foreground">E-mail</label>
                <input
                  type="email"
                  required
                  value={registerForm.email}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-foreground">Senha</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 bg-primary text-primary-foreground rounded-2xl font-semibold text-base shadow-card hover:shadow-card-hover transition-all duration-200 active:scale-[0.98] disabled:opacity-70"
            >
              {isSubmitting ? "Criando conta..." : "Criar conta de Mulher"}
            </button>
          </form>
        )}
      </motion.div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Ambiente em fase piloto com acesso acompanhado por equipes autorizadas
          </p>
        </div>
      </div>
    </div>
  );
}
