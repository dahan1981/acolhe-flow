import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Heart, Users, BarChart3 } from "lucide-react";
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">AcolheSistemas</h1>
          <p className="text-sm text-muted-foreground mt-1">Plataforma Unificada de Protecao a Mulher</p>
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
              className={`rounded-2xl p-3 text-left transition-all ${
                selectedProfile === profile.id ? "bg-primary text-primary-foreground" : "bg-card shadow-card"
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
              className={`flex-1 rounded-xl py-2 text-sm font-medium ${mode === "login" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-xl py-2 text-sm font-medium ${mode === "register" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
            >
              Criar conta
            </button>
          </div>
        )}

        {mode === "login" || selectedProfile !== "mulher" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 bg-card rounded-3xl p-6 shadow-card">
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
              Cadastros publicos sao permitidos apenas para Mulheres.
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 bg-card rounded-3xl p-6 shadow-card">
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

      <p className="text-xs text-muted-foreground mt-8 text-center">
        Secretaria da Mulher - Municipio de Mangaratiba
      </p>
    </div>
  );
}
