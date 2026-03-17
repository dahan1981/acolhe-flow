import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ClipboardCheck, FilePlus2, Info } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { createDemoInternalProtocol } from "@/lib/demo-case-store";
import { ethnicityOptions, riskOptions, violenceTypeOptions } from "@/lib/form-options";
import type { Ethnicity, RiskLevel, ViolenceType } from "@/types/domain";

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
    etniaCor: "nao_informada" as Ethnicity,
    tiposViolencia: ["violencia_psicologica"] as ViolenceType[],
  });

  function updateField<Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleViolenceType(type: ViolenceType) {
    setForm((current) => {
      const exists = current.tiposViolencia.includes(type);
      const next = exists
        ? current.tiposViolencia.filter((item) => item !== type)
        : [...current.tiposViolencia, type];
      return { ...current, tiposViolencia: next.length ? next : current.tiposViolencia };
    });
  }

  return (
    <AppLayout
      title="Gerar protocolo"
      subtitle="Abra um novo caso com os dados iniciais de identificacao, risco e contexto do atendimento."
      showBack
    >
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
            toast.success(`Protocolo ${createdCase.protocolo} registrado com sucesso.`);
            navigate(-1);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Nao foi possivel registrar o protocolo.");
          }
        }}
        className="space-y-5"
      >
        <section className="rounded-[26px] border border-primary/15 bg-card/95 p-5 shadow-card">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ClipboardCheck className="h-3.5 w-3.5" />
            Etapa 1 de 3
          </div>
          <h2 className="text-lg font-semibold text-foreground">Identificacao inicial do caso</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            O protocolo gera a abertura formal do caso e disponibiliza o registro para a fila operacional e para o painel da gestao.
          </p>
        </section>

        <section className="grid gap-4 rounded-[26px] border border-border/70 bg-card/95 p-5 shadow-card">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground">Nome completo</label>
              <input
                required
                value={form.nomeCompleto}
                onChange={(event) => updateField("nomeCompleto", event.target.value)}
                placeholder="Informe o nome completo da mulher acolhida"
                className="mt-1 w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground">Nome social</label>
              <input
                value={form.nomeSocial}
                onChange={(event) => updateField("nomeSocial", event.target.value)}
                placeholder="Preencha se houver indicacao"
                className="mt-1 w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">CPF</label>
              <input
                value={form.cpf}
                onChange={(event) => updateField("cpf", event.target.value)}
                placeholder="Somente numeros, se informado"
                className="mt-1 w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Telefone principal</label>
              <input
                value={form.telefone}
                onChange={(event) => updateField("telefone", event.target.value)}
                placeholder="Canal prioritario para retorno"
                className="mt-1 w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground">Endereco de referencia</label>
              <input
                value={form.endereco}
                onChange={(event) => updateField("endereco", event.target.value)}
                placeholder="Endereco conhecido, ponto de referencia ou observacao protegida"
                className="mt-1 w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary"
              />
            </div>

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
        </section>

        <section className="grid gap-4 rounded-[26px] border border-border/70 bg-card/95 p-5 shadow-card">
          <div className="flex items-start gap-3 rounded-2xl bg-background px-4 py-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Registre o risco inicial, os tipos de violencia observados e o recorte de etnia/cor para apoiar leitura de contexto e metricas gerenciais.
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Classificacao inicial de risco</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {riskOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => updateField("situacaoRisco", item.value)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    form.situacaoRisco === item.value
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-muted-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Tipos de violencia relacionados ao caso</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {violenceTypeOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => toggleViolenceType(item.value)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    form.tiposViolencia.includes(item.value)
                      ? "bg-warning text-warning-foreground"
                      : "border border-border bg-background text-muted-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Etnia/cor declarada ou registrada</label>
            <select
              value={form.etniaCor}
              onChange={(event) => updateField("etniaCor", event.target.value as Ethnicity)}
              className="mt-1 w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary"
            >
              {ethnicityOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="grid gap-4 rounded-[26px] border border-border/70 bg-card/95 p-5 shadow-card">
          <div className="mb-1 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Contexto de abertura</h3>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Resumo inicial da ocorrencia</label>
            <textarea
              required
              rows={5}
              value={form.observacoesIniciais}
              onChange={(event) => updateField("observacoesIniciais", event.target.value)}
              placeholder="Descreva a forma de entrada, o contexto relatado, o risco percebido e a orientacao inicial da equipe."
              className="mt-1 w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary resize-none"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Esse texto aparece no detalhe do caso e orienta a primeira leitura da equipe responsavel.
            </p>
          </div>
        </section>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground shadow-card transition-all hover:shadow-card-hover"
        >
          <FilePlus2 className="h-4 w-4" />
          Registrar protocolo e abrir caso
        </button>
      </form>
    </AppLayout>
  );
}
