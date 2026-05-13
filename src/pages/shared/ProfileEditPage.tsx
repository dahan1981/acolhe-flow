import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Ban, Camera, Lock, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { PendingContactChange } from "@/types/domain";

interface EditProfileForm {
  telefone: string;
  email: string;
  novaSenha: string;
  confirmarSenha: string;
}

type ChangeType = "email" | "telefone";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.4 } },
};

function maskCpf(value?: string) {
  if (!value) return "--";
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) return value;
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
}

function formatPhone(value?: string) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{0,4})(\d{0,4}).*$/, "($1) $2-$3").trim();
  }
  return digits.replace(/^(\d{2})(\d{0,5})(\d{0,4}).*$/, "($1) $2-$3").trim();
}

function normalizePhone(value?: string) {
  return (value ?? "").replace(/\D/g, "");
}

function formatPendingExpiry(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem selecionada."));
    reader.readAsDataURL(file);
  });
}

export default function ProfileEditPage() {
  const { currentUser, setCurrentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentUser?.avatarUrl ?? null);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [activeChangeType, setActiveChangeType] = useState<ChangeType | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [previewCodes, setPreviewCodes] = useState<Partial<Record<ChangeType, string>>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const profileQueryKey = ["profile", currentUser?.id];
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: profileQueryKey,
    queryFn: api.getProfile,
    enabled: Boolean(currentUser),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProfileForm>({
    defaultValues: {
      email: currentUser?.email || "",
      telefone: "",
      novaSenha: "",
      confirmarSenha: "",
    },
  });

  useEffect(() => {
    reset({
      email: profileData?.user.email ?? currentUser?.email ?? "",
      telefone: formatPhone(profileData?.womanProfile?.telefone),
      novaSenha: "",
      confirmarSenha: "",
    });
    setAvatarPreview(profileData?.user.avatarUrl ?? currentUser?.avatarUrl ?? null);
  }, [currentUser?.avatarUrl, currentUser?.email, profileData, reset]);

  const pendingChanges = profileData?.pendingContactChanges ?? [];
  const activePendingChange = useMemo(
    () => pendingChanges.find((change) => change.tipo === activeChangeType) ?? null,
    [activeChangeType, pendingChanges],
  );

  const updateProfileMutation = useMutation({
    mutationFn: api.updateProfile,
    onSuccess: (response) => {
      setCurrentUser(response.user);
      queryClient.setQueryData(profileQueryKey, response);
      toast.success("Senha atualizada com sucesso.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar os dados da conta.");
    },
  });

  const updateAvatarMutation = useMutation({
    mutationFn: api.updateProfileAvatar,
    onSuccess: (response) => {
      setCurrentUser(response.user);
      queryClient.setQueryData(profileQueryKey, response);
      setAvatarPreview(response.user.avatarUrl ?? null);
      toast.success("Sua foto foi atualizada.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a foto.");
    },
  });

  const requestContactChangeMutation = useMutation({
    mutationFn: api.requestContactChange,
    onSuccess: (response, variables) => {
      setPreviewCodes((current) => ({
        ...current,
        [variables.tipo]: response.previewCode,
      }));
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
      setActiveChangeType(variables.tipo);
      setVerificationCode("");
      setVerificationDialogOpen(true);
      toast.success(
        variables.tipo === "email"
          ? "Código enviado para confirmar o novo e-mail."
          : "Código gerado para confirmar o novo celular.",
      );
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar o código.");
    },
  });

  const confirmContactChangeMutation = useMutation({
    mutationFn: api.confirmContactChange,
    onSuccess: (response, variables) => {
      setCurrentUser(response.user);
      queryClient.setQueryData(profileQueryKey, response);
      setPreviewCodes((current) => {
        const next = { ...current };
        delete next[variables.tipo];
        return next;
      });
      setVerificationCode("");
      setVerificationDialogOpen(false);
      toast.success(`${variables.tipo === "email" ? "E-mail" : "Celular"} confirmado com sucesso.`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Não foi possível confirmar o código.");
    },
  });

  if (!currentUser) return null;

  const isWoman = currentUser.perfil === "mulher";
  const womanProfile = profileData?.womanProfile ?? null;

  const currentEmail = profileData?.user.email ?? currentUser.email;
  const currentPhone = profileData?.womanProfile?.telefone ?? "";

  const openVerificationDialog = (tipo: ChangeType) => {
    setActiveChangeType(tipo);
    setVerificationCode("");
    setVerificationDialogOpen(true);
  };

  const onSubmit = async (data: EditProfileForm) => {
    const nextEmail = data.email.trim().toLowerCase();
    const nextPhone = normalizePhone(data.telefone);
    const hasEmailChange = nextEmail !== currentEmail;
    const hasPhoneChange = isWoman && nextPhone !== currentPhone;
    const hasPasswordChange = Boolean(data.novaSenha);

    if (data.novaSenha && data.novaSenha !== data.confirmarSenha) {
      toast.error("As senhas informadas não coincidem.");
      return;
    }

    if (!hasEmailChange && !hasPhoneChange && !hasPasswordChange) {
      toast.message("Nenhuma alteração nova para salvar.");
      return;
    }

    setLoading(true);

    try {
      if (hasPasswordChange) {
        await updateProfileMutation.mutateAsync({
          email: currentEmail,
          telefone: isWoman ? currentPhone : undefined,
          novaSenha: data.novaSenha || undefined,
        });
      }

      if (hasEmailChange) {
        await requestContactChangeMutation.mutateAsync({
          tipo: "email",
          valor: nextEmail,
        });
      }

      if (hasPhoneChange) {
        await requestContactChangeMutation.mutateAsync({
          tipo: "telefone",
          valor: nextPhone,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Use uma imagem JPG, PNG ou WEBP.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5 MB.");
      event.target.value = "";
      return;
    }

    try {
      const imageBase64 = await fileToBase64(file);
      setAvatarPreview(imageBase64);
      updateAvatarMutation.mutate({
        fileName: file.name,
        contentType: file.type as "image/jpeg" | "image/png" | "image/webp",
        imageBase64,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar a imagem.");
    } finally {
      event.target.value = "";
    }
  }

  function handleConfirmActiveChange() {
    if (!activeChangeType || verificationCode.length !== 6) {
      toast.error("Informe o código de 6 dígitos.");
      return;
    }

    confirmContactChangeMutation.mutate({
      tipo: activeChangeType,
      codigo: verificationCode,
    });
  }

  return (
    <AppLayout title="Minha Identidade" showBack={true}>
      <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl border-border/60 bg-background/95">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-foreground">
              Confirmar {activeChangeType === "telefone" ? "celular" : "e-mail"}
            </DialogTitle>
            <DialogDescription>
              Digite o código de 6 dígitos para aplicar a alteração na conta.
            </DialogDescription>
          </DialogHeader>

          {activePendingChange ? (
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm text-foreground/80">
              Destino: <span className="font-semibold text-foreground">{activePendingChange.destinoMascarado}</span>
              <div className="mt-1 text-xs text-muted-foreground">
                Expira em {formatPendingExpiry(activePendingChange.expiraEm)}.
              </div>
            </div>
          ) : null}

          {activeChangeType && previewCodes[activeChangeType] ? (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-950">
              <p className="font-semibold">Código interno de piloto</p>
              <p className="mt-1">
                {previewCodes[activeChangeType]}.
                <span className="ml-1 text-xs text-amber-900/70">Use apenas para teste enquanto o envio real não estiver configurado.</span>
              </p>
            </div>
          ) : null}

          <div className="flex justify-center py-2">
            <InputOTP
              maxLength={6}
              value={verificationCode}
              onChange={setVerificationCode}
              disabled={confirmContactChangeMutation.isPending}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={handleConfirmActiveChange}
              disabled={confirmContactChangeMutation.isPending}
              className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-70"
            >
              {confirmContactChangeMutation.isPending ? "Confirmando..." : "Confirmar código"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="mx-auto max-w-xl space-y-6 pb-24">
        <motion.div variants={itemVariants} className="flex flex-col items-center pt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="group relative mb-4"
            onClick={() => fileInputRef.current?.click()}
            disabled={updateAvatarMutation.isPending}
          >
            <Avatar className="h-32 w-32 border-4 border-background bg-card shadow-xl">
              <AvatarImage src={avatarPreview ?? undefined} alt={currentUser.nome} className="object-cover" />
              <AvatarFallback className="bg-primary/10 font-display text-4xl font-bold tracking-tight text-foreground/40">
                {currentUser.nome.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <motion.div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="mb-1 h-8 w-8" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {updateAvatarMutation.isPending ? "Enviando" : "Alterar"}
              </span>
            </motion.div>
          </button>
          <p className="font-display text-sm font-bold text-foreground">Sua foto de perfil</p>
          <p className="mt-1 text-xs text-muted-foreground">Toque para enviar uma nova imagem</p>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <motion.section variants={itemVariants} className="glass-panel relative space-y-5 overflow-hidden rounded-3xl p-5">
            <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-red-500/10 blur-2xl" />
            <div className="relative z-10 mb-2 flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <h3 className="cursor-default font-display text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Dados de governança (intransferíveis)
              </h3>
            </div>

            <div className="relative z-10 space-y-4 opacity-70">
              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome completo</label>
                <div className="relative">
                  <input
                    disabled
                    value={currentUser.nome}
                    className="w-full rounded-2xl border border-border/40 bg-muted/30 px-4 py-3 text-sm font-medium italic text-foreground shadow-inner"
                    readOnly
                  />
                  <Ban className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">CPF</label>
                  <div className="relative">
                    <input
                      disabled
                      value={maskCpf(womanProfile?.cpf)}
                      className="w-full rounded-xl border border-border/40 bg-muted/30 px-3 py-2.5 text-sm font-medium italic text-foreground shadow-inner"
                      readOnly
                    />
                    <Ban className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Etnia</label>
                  <div className="relative">
                    <input
                      disabled
                      value={womanProfile?.etniaCor ? womanProfile.etniaCor : "Não informado"}
                      className="w-full rounded-xl border border-border/40 bg-muted/30 px-3 py-2.5 text-sm font-medium italic text-foreground shadow-inner"
                      readOnly
                    />
                    <Ban className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="glass-panel relative space-y-5 overflow-hidden rounded-3xl p-5">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative z-10 mb-2 flex items-center gap-2">
              <h3 className="font-display text-[10px] font-bold uppercase tracking-widest text-primary">
                Informações de contato
              </h3>
            </div>

            <div className="relative z-10 space-y-4">
              {isWoman ? (
                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-bold uppercase tracking-wider text-foreground">
                    Celular de ocorrencia
                  </label>
                  <input
                    {...register("telefone", {
                      required: "Este campo é obrigatório",
                    })}
                    className="glass-input w-full"
                    placeholder="(DD) 90000-0000"
                  />
                  <p className="ml-1 text-[11px] text-muted-foreground">A troca do celular exige confirmação por código.</p>
                  {errors.telefone ? (
                    <p className="ml-2 mt-1 text-[10px] font-bold text-red-500">{errors.telefone.message}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-bold uppercase tracking-wider text-foreground">E-mail de acesso</label>
                <input
                  type="email"
                  {...register("email", { required: "Este campo é obrigatório" })}
                  className="glass-input w-full"
                />
                <p className="ml-1 text-[11px] text-muted-foreground">A troca do e-mail exige confirmação por código.</p>
                {errors.email ? <p className="ml-2 mt-1 text-[10px] font-bold text-red-500">{errors.email.message}</p> : null}
              </div>

              {pendingChanges.length > 0 ? (
                <div className="space-y-3 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Confirmações pendentes
                  </div>
                  {pendingChanges.map((change: PendingContactChange) => (
                    <div key={change.id} className="flex items-center justify-between gap-3 rounded-2xl bg-background/70 p-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {change.tipo === "email" ? "E-mail" : "Celular"} em validação
                        </p>
                        <p className="text-xs text-muted-foreground">{change.destinoMascarado}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Expira em {formatPendingExpiry(change.expiraEm)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openVerificationDialog(change.tipo)}
                        className="rounded-full border border-primary/30 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/10"
                      >
                        Informar código
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="glass-panel relative space-y-4 overflow-hidden rounded-3xl p-5">
            <div className="absolute bottom-0 left-0 h-32 w-32 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
            <h3 className="relative z-10 font-display text-[10px] font-bold uppercase tracking-widest text-accent">Segurança</h3>

            <div className="relative z-10 space-y-4">
              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-bold uppercase tracking-wider text-foreground">Redefinir senha</label>
                <input
                  type="password"
                  {...register("novaSenha")}
                  placeholder="Criar nova senha"
                  className="glass-input w-full"
                />
              </div>
              <div className="space-y-1.5">
                <input
                  type="password"
                  {...register("confirmarSenha")}
                  placeholder="Confirmar nova senha"
                  className="glass-input w-full"
                />
              </div>
            </div>
          </motion.section>

          <motion.div variants={itemVariants} className="pt-4">
            <button
              type="submit"
              disabled={loading || isProfileLoading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary/90 active:scale-95 disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Salvar alterações
                </>
              )}
            </button>
          </motion.div>
        </form>
      </motion.div>
    </AppLayout>
  );
}
