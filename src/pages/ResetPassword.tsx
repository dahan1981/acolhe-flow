import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AthenaMark } from "@/components/brand/AthenaMark";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";

function homePath(profile: "mulher" | "profissional" | "gestora") {
  if (profile === "mulher") return "/mulher";
  if (profile === "profissional") return "/profissional";
  return "/gestora";
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const { setCurrentUser } = useAuthStore();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Validando o link de redefinição...");

  const recoveryError = useMemo(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    return hashParams.get("error_description") ?? hashParams.get("error");
  }, []);

  useEffect(() => {
    if (!supabase) {
      setStatusMessage("A recuperação de senha não está disponível neste ambiente.");
      return;
    }

    if (recoveryError) {
      setStatusMessage("O link de redefinição é inválido ou já expirou.");
      return;
    }

    let isMounted = true;

    const syncRecoveryState = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!isMounted) {
        return;
      }

      if (session?.access_token) {
        setIsRecoveryReady(true);
        setStatusMessage("");
      } else {
        setStatusMessage("Abra novamente o link enviado para o seu e-mail.");
      }
    };

    void syncRecoveryState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) {
        return;
      }

      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session?.access_token) {
        setIsRecoveryReady(true);
        setStatusMessage("");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [recoveryError]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      toast.error("A recuperação de senha não está disponível neste ambiente.");
      return;
    }

    if (password.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas informadas não coincidem.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error("A sessão de recuperação não foi localizada.");
      }

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      const response = await api.syncSupabaseSession(accessToken);
      setCurrentUser(response.user);
      toast.success("Senha redefinida com sucesso.");
      navigate(homePath(response.user.perfil), { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível redefinir a senha agora.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[8%] top-[12%] h-[420px] w-[420px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-8%] h-[520px] w-[520px] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md rounded-[32px] border border-border/50 bg-card/80 p-8 shadow-2xl backdrop-blur-md"
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
            <AthenaMark className="h-7 w-7" />
          </div>
          <div>
            <p className="font-display text-2xl font-semibold text-foreground">Athena</p>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Recuperação de acesso</p>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-foreground">Criar nova senha</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Defina uma senha forte para continuar acessando sua conta institucional.
          </p>
        </div>

        {!isRecoveryReady ? (
          <div className="rounded-3xl border border-border/50 bg-background/80 p-5 text-sm text-muted-foreground">
            {statusMessage}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm text-foreground/80">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Sessão de recuperação validada
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                A nova senha será aplicada imediatamente e você voltará ao aplicativo já autenticada.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nova senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Criar nova senha"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-input bg-card/70 py-3.5 pl-11 pr-12 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-card/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirmar nova senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Confirmar nova senha"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-xl border border-input bg-card/70 py-3.5 pl-11 pr-12 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-card/30"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-primary to-accent py-4 font-display text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70"
            >
              {isSubmitting ? "Atualizando senha..." : "Salvar nova senha"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
