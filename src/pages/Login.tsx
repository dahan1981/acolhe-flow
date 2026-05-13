import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Calendar,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  Shield,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { AthenaMark } from "@/components/brand/AthenaMark";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import type { RegisterWomanPayload, UserProfile } from "@/types/domain";

const profiles: Array<{ id: UserProfile; label: string; desc: string; icon: React.ElementType }> = [
  { id: "mulher", label: "Para você", desc: "Acesso seguro para solicitar apoio.", icon: Shield },
  { id: "profissional", label: "Profissional", desc: "Acesso institucional autorizado.", icon: Users },
  { id: "gestora", label: "Gestão", desc: "Acesso institucional autorizado.", icon: BarChart3 },
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
  const [mode, setMode] = useState<"login" | "register" | "select">("select");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState(initialRegisterState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);

  const formVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.25 } },
  };

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
      toast.error(error instanceof Error ? error.message : "Não foi possível entrar agora.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegisterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await registerWoman(registerForm);
      toast.success("Conta criada. Bem-vinda!");
      navigate(homePath(user.perfil));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir o cadastro agora.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotPasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      toast.error("Recuperação de senha indisponível neste ambiente.");
      return;
    }

    setIsSendingReset(true);

    try {
      const redirectTo = `${window.location.origin}/redefinir-senha`;
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail.trim().toLowerCase(), {
        redirectTo,
      });

      if (error) {
        throw error;
      }

      toast.success("Se houver uma conta vinculada a este e-mail, enviaremos o link de redefinição.");
      setForgotPasswordOpen(false);
      setForgotPasswordEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível iniciar a redefinição de senha.");
    } finally {
      setIsSendingReset(false);
    }
  }

  return (
    <div className="isolate relative flex min-h-screen w-full overflow-hidden bg-background">
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="max-w-md rounded-3xl border-border/60 bg-background/95">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-foreground">Redefinir senha</DialogTitle>
            <DialogDescription>
              Informe o e-mail da conta. Se ele existir, enviaremos um link seguro para criar uma nova senha.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={forgotPasswordEmail}
                  onChange={(event) => setForgotPasswordEmail(event.target.value)}
                  className="w-full rounded-xl border border-input bg-card/70 py-3.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-card/30"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <DialogFooter>
              <button
                type="submit"
                disabled={isSendingReset}
                className="w-full rounded-xl bg-gradient-to-r from-primary to-accent py-3 font-display text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70"
              >
                {isSendingReset ? "Enviando..." : "Enviar link de redefinição"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[10%] top-[20%] h-[500px] w-[500px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex min-h-screen w-full flex-col lg:flex-row">
        <div className="relative flex min-h-[30vh] w-full flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-accent to-urgent p-8 text-white shadow-2xl lg:min-h-screen lg:w-[45%] lg:p-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.12),transparent_42%)]" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative z-10 flex flex-col gap-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 shadow-inner backdrop-blur-md">
                <AthenaMark className="h-8 w-8 text-white drop-shadow-md" />
              </div>
              <span className="font-display text-2xl font-bold tracking-tight text-white drop-shadow-sm">Athena</span>
            </div>

            <div className="mt-8 hidden lg:block">
              <h1 className="font-display text-5xl font-medium leading-[1.1] tracking-tight">
                Proteção e
                <br />
                Acolhimento.
              </h1>
              <p className="mt-6 max-w-sm text-lg font-light leading-relaxed text-white/80">
                A plataforma integrada da rede municipal conecta o cuidado a quem precisa, sem fragmentação.
              </p>
            </div>
          </motion.div>

          <div className="relative z-10 mt-auto hidden lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md">
              <Shield className="h-4 w-4 text-white/80" />
              <span className="text-xs font-semibold uppercase tracking-wider text-white/90">
                Ambiente seguro e monitorado
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-20 flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-10 sm:px-12 lg:px-24">
          <div className="w-full max-w-[420px]">
            <AnimatePresence mode="wait">
              {mode === "select" && (
                <motion.div
                  key="select-mode"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="w-full space-y-8"
                >
                  <div className="text-left">
                    <h2 className="font-display text-3xl font-semibold text-foreground">Como deseja acessar?</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Escolha o perfil correto para continuar no ambiente autorizado.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {profiles.map((profile, index) => (
                      <motion.button
                        key={profile.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: index * 0.08 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedProfile(profile.id);
                          setMode("login");
                        }}
                        className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl border border-border bg-card/70 p-5 shadow-sm backdrop-blur-md transition-all hover:border-primary/40 hover:bg-white hover:shadow-md dark:hover:bg-card/90"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                            <profile.icon className="h-6 w-6" />
                          </div>
                          <div className="text-left">
                            <span className="block font-display text-base font-medium text-foreground">{profile.label}</span>
                            <span className="text-xs text-muted-foreground">{profile.desc}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground/60 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {mode === "login" && (
                <motion.div
                  key="login-mode"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="w-full"
                >
                  <div className="mb-8">
                    <button
                      onClick={() => setMode("select")}
                      className="mb-6 flex items-center text-sm font-medium text-primary hover:underline"
                    >
                      <ChevronRight className="mr-1 h-4 w-4 rotate-180" /> Voltar
                    </button>
                    <h2 className="font-display text-3xl font-semibold text-foreground">
                      {selectedProfile === "mulher"
                        ? "Bem-vinda"
                        : `Acesso de ${profiles.find((profile) => profile.id === selectedProfile)?.label}`}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Insira seus dados para entrar na sua conta institucional e segura.
                    </p>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-5" autoComplete="on">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        E-mail de acesso
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" />
                        <input
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="seu@email.com"
                          value={loginForm.email}
                          onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                          className="w-full rounded-xl border border-input bg-card/70 py-3.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-card/30"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Senha</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          autoComplete="current-password"
                          placeholder="••••••••"
                          value={loginForm.password}
                          onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                          className="w-full rounded-xl border border-input bg-card/70 py-3.5 pl-11 pr-12 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-card/30"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setForgotPasswordEmail(loginForm.email.trim());
                          setForgotPasswordOpen(true);
                        }}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Esqueci minha senha
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="mt-6 w-full rounded-xl bg-gradient-to-r from-primary to-accent py-4 font-display text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70"
                    >
                      {isSubmitting ? "Autenticando..." : "Acessar plataforma"}
                    </button>

                    {selectedProfile === "mulher" && (
                      <div className="mt-8 text-center text-sm">
                        <span className="text-muted-foreground">Precisa de apoio e é nova por aqui? </span>
                        <button
                          type="button"
                          onClick={() => setMode("register")}
                          className="font-semibold text-primary hover:underline"
                        >
                          Crie seu acesso
                        </button>
                      </div>
                    )}
                  </form>
                </motion.div>
              )}

              {mode === "register" && (
                <motion.div
                  key="register-mode"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="w-full"
                >
                  <div className="mb-6">
                    <button
                      onClick={() => setMode("login")}
                      className="mb-4 flex items-center text-sm font-medium text-primary hover:underline"
                    >
                      <ChevronRight className="mr-1 h-4 w-4 rotate-180" /> Voltar ao login
                    </button>
                    <h2 className="font-display text-2xl font-semibold text-foreground">Criar minha conta</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Preencha seus dados reais para que a rede possa apoiar e acompanhar seu processo.
                    </p>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-4" autoComplete="on">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Nome completo
                        </label>
                        <input
                          type="text"
                          required
                          autoComplete="name"
                          value={registerForm.nomeCompleto}
                          onChange={(event) => setRegisterForm({ ...registerForm, nomeCompleto: event.target.value })}
                          className="w-full rounded-xl border border-input bg-card/70 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Seu nome oficial"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Nome social (opcional)
                        </label>
                        <input
                          type="text"
                          value={registerForm.nomeSocial}
                          onChange={(event) => setRegisterForm({ ...registerForm, nomeSocial: event.target.value })}
                          className="w-full rounded-xl border border-input bg-card/70 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Como prefere ser chamada"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CPF</label>
                        <div className="relative">
                          <CreditCard className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                          <input
                            type="text"
                            required
                            value={registerForm.cpf}
                            onChange={(event) => setRegisterForm({ ...registerForm, cpf: event.target.value })}
                            className="w-full rounded-xl border border-input bg-card/70 py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="000.000.000-00"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Nascimento
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                          <input
                            type="date"
                            required
                            value={registerForm.dataNascimento}
                            onChange={(event) => setRegisterForm({ ...registerForm, dataNascimento: event.target.value })}
                            className="w-full rounded-xl border border-input bg-card/70 py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Telefone de contato
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                          <input
                            type="text"
                            required
                            autoComplete="tel"
                            value={registerForm.telefone}
                            onChange={(event) => setRegisterForm({ ...registerForm, telefone: event.target.value })}
                            className="w-full rounded-xl border border-input bg-card/70 py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="(00) 00000-0000"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 border-t pt-4">
                      <h3 className="mb-4 text-sm font-semibold text-foreground">Acesso</h3>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            E-mail
                          </label>
                          <input
                            type="email"
                            required
                            autoComplete="email"
                            value={registerForm.email}
                            onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                            className="w-full rounded-xl border border-input bg-card/70 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="seu@email.com"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Criar senha segura
                          </label>
                          <input
                            type="password"
                            required
                            minLength={8}
                            autoComplete="new-password"
                            value={registerForm.password}
                            onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                            className="w-full rounded-xl border border-input bg-card/70 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="No mínimo 8 caracteres"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="mt-6 w-full rounded-xl bg-gradient-to-r from-primary to-accent py-4 font-display text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70"
                    >
                      {isSubmitting ? "Finalizando cadastro..." : "Criar meu acesso seguro"}
                    </button>
                    <p className="mt-4 text-center text-xs text-muted-foreground">
                      Ao criar sua conta, seus dados são protegidos.
                    </p>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
