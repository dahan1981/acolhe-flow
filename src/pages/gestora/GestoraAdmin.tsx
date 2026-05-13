import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Plus, ShieldCheck, Users2 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { adminAccessChecklist, adminHighlights, organizationOptionsLabel } from "@/lib/demo-content";
import type { UserProfile } from "@/types/domain";

type InternalRole = Extract<UserProfile, "profissional" | "gestora">;

const initialForm = {
  nomeCompleto: "",
  email: "",
  password: "Acolhe@123",
  perfil: "profissional" as InternalRole,
  organizationId: "",
  cargo: "",
  especialidades: "",
};

export default function GestoraAdmin() {
  const [form, setForm] = useState(initialForm);
  const [createdUsers, setCreatedUsers] = useState<Array<{ nome: string; perfil: string; orgao: string }>>([]);
  const { data } = useQuery({
    queryKey: ["organizations"],
    queryFn: api.getOrganizations,
  });

  const organizations = data?.organizations ?? [];

  const createUserMutation = useMutation({
    mutationFn: api.createInternalUser,
    onSuccess: ({ user }) => {
      setCreatedUsers((current) => [{ nome: user.nome, perfil: user.perfil, orgao: user.orgao ?? "Não informado" }, ...current].slice(0, 4));
      setForm({
        ...initialForm,
        organizationId: organizations[0]?.id ?? "",
      });
      toast.success("Conta interna criada com sucesso.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar a conta.");
    },
  });

  const canSubmit = useMemo(
    () => form.nomeCompleto && form.email && form.password && form.organizationId,
    [form.email, form.nomeCompleto, form.organizationId, form.password],
  );

  return (
    <AppLayout title="Painel administrativo" subtitle="Criação interna de contas, organização da equipe e governança de acesso.">
      <div className="space-y-5">
        <section className="grid grid-cols-1 gap-3">
          {adminHighlights.map((item) => (
            <div key={item.label} className="rounded-[24px] border border-border/70 bg-card/90 p-4 shadow-card">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="text-3xl font-semibold text-foreground">{item.value}</p>
                <p className="max-w-[180px] text-right text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-[28px] border border-white/60 bg-card/90 p-5 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Criar conta interna</h2>
          </div>
          <div className="grid gap-3">
            <input
              value={form.nomeCompleto}
              onChange={(event) => setForm((current) => ({ ...current, nomeCompleto: event.target.value }))}
              placeholder="Nome completo"
              className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary"
            />
            <input
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="E-mail institucional"
              className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.perfil}
                onChange={(event) => setForm((current) => ({ ...current, perfil: event.target.value as InternalRole }))}
                className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary"
              >
                <option value="profissional">Profissional</option>
                <option value="gestora">Gestora</option>
              </select>
              <select
                value={form.organizationId}
                onChange={(event) => setForm((current) => ({ ...current, organizationId: event.target.value }))}
                className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary"
              >
                <option value="">Selecione o órgão</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organizationOptionsLabel(organization)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={form.cargo}
                onChange={(event) => setForm((current) => ({ ...current, cargo: event.target.value }))}
                placeholder="Cargo"
                className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary"
              />
              <input
                value={form.especialidades}
                onChange={(event) => setForm((current) => ({ ...current, especialidades: event.target.value }))}
                placeholder="Especialidades ou escopo"
                className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary"
              />
            </div>
            <button
              onClick={() => createUserMutation.mutate(form)}
              disabled={!canSubmit || createUserMutation.isPending}
              className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-card disabled:opacity-60"
            >
              {createUserMutation.isPending ? "Criando conta..." : "Criar conta interna"}
            </button>
          </div>
        </section>

        <section className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <Users2 className="h-4 w-4 text-accent" />
            <h3 className="text-base font-semibold text-foreground">Últimas contas criadas nesta sessão</h3>
          </div>
          <div className="space-y-3">
            {createdUsers.length ? (
              createdUsers.map((item) => (
                <div key={`${item.nome}-${item.orgao}`} className="flex items-start gap-3 rounded-2xl bg-background px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.perfil} • {item.orgao}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">As contas criadas nesta sessão aparecem aqui para facilitar a validação do fluxo administrativo.</p>
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Checklist de liberação</h3>
          </div>
          <div className="space-y-3">
            {adminAccessChecklist.map((item) => (
              <div key={item} className="rounded-2xl border border-border/70 px-4 py-3 text-sm text-muted-foreground">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
