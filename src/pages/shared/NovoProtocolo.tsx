import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { createDemoInternalProtocol } from "@/lib/demo-case-store";
import type { RiskLevel } from "@/types/domain";

export default function NovoProtocolo() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    nomeCompleto: "",
    nomeSocial: "",
    cpf: "",
    telefone: "",
    endereco: "",
    municipio: "Mangaratiba",
    uf: "RJ",
    situacaoRisco: "medio" as RiskLevel,
    observacoesIniciais: "",
  });

  function updateField<Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <AppLayout title="Novo protocolo" subtitle="Criacao manual de caso demonstrativo para gestora e responsavel." showBack>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            const createdCase = createDemoInternalProtocol(form);
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ["cases"] }),
              queryClient.invalidateQueries({ queryKey: ["professional-dashboard"] }),
              queryClient.invalidateQueries({ queryKey: ["manager-dashboard"] }),
            ]);
            toast.success(`Protocolo #${createdCase.protocolo} criado com sucesso.`);
            navigate(-1);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Nao foi possivel criar o protocolo.");
          }
        }}
        className="space-y-4"
      >
        <div className="rounded-[24px] border border-white/60 bg-card/90 p-4 shadow-card">
          <p className="text-sm text-muted-foreground">
            Use esta tela para registrar um novo caso diretamente pela equipe interna. O caso entra na fila de atendimento e no
            painel gerencial da demo.
          </p>
        </div>

        <div className="grid gap-4 rounded-[24px] border border-border/70 bg-card/90 p-4 shadow-card">
          <div>
            <label className="text-sm font-medium text-foreground">Nome completo da vitima</label>
            <input
              required
              value={form.nomeCompleto}
              onChange={(event) => updateField("nomeCompleto", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Nome social</label>
            <input
              value={form.nomeSocial}
              onChange={(event) => updateField("nomeSocial", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground">CPF</label>
              <input
                value={form.cpf}
                onChange={(event) => updateField("cpf", event.target.value)}
                className="mt-1 w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Telefone</label>
              <input
                value={form.telefone}
                onChange={(event) => updateField("telefone", event.target.value)}
                className="mt-1 w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Endereco</label>
            <input
              value={form.endereco}
              onChange={(event) => updateField("endereco", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground">Municipio</label>
              <input
                value={form.municipio}
                onChange={(event) => updateField("municipio", event.target.value)}
                className="mt-1 w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">UF</label>
              <input
                value={form.uf}
                maxLength={2}
                onChange={(event) => updateField("uf", event.target.value.toUpperCase())}
                className="mt-1 w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Risco inicial</label>
            <div className="mt-2 flex gap-2 flex-wrap">
              {(["baixo", "medio", "alto", "critico"] as RiskLevel[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => updateField("situacaoRisco", item)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    form.situacaoRisco === item ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground border border-border"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Resumo inicial / ocorrencia</label>
            <textarea
              required
              rows={5}
              value={form.observacoesIniciais}
              onChange={(event) => updateField("observacoesIniciais", event.target.value)}
              placeholder="Descreva o contexto inicial, a forma de entrada do caso e a orientacao de triagem."
              className="mt-1 w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground shadow-card hover:shadow-card-hover transition-all"
        >
          Criar novo protocolo
        </button>
      </form>
    </AppLayout>
  );
}
