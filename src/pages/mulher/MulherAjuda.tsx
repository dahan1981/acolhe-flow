import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Heart, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { ethnicityOptions, riskOptions, violenceTypeOptions } from "@/lib/form-options";
import type { Ethnicity, ViolenceType } from "@/types/domain";

const services = [
  { icon: Phone, label: "Solicitar apoio imediato", desc: "Registrar necessidade urgente de contato ou orientacao", value: "apoio_imediato" },
  { icon: MapPin, label: "Protecao e abrigo", desc: "Informar necessidade de local seguro ou deslocamento assistido", value: "protecao_abrigo" },
  { icon: MessageCircle, label: "Atendimento especializado", desc: "Abrir chat protegido com assistencia social", value: "atendimento_especializado" },
  { icon: Heart, label: "Nova ocorrencia", desc: "Registrar uma nova situacao e iniciar o acompanhamento", value: "nova_ocorrencia" },
];

export default function MulherAjuda() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState(services[0].value);
  const [message, setMessage] = useState("");
  const [riskLevel, setRiskLevel] = useState<"baixo" | "medio" | "alto" | "critico">("medio");
  const [etniaCor, setEtniaCor] = useState<Ethnicity>("nao_informada");
  const [tiposViolencia, setTiposViolencia] = useState<ViolenceType[]>(["violencia_psicologica"]);

  const mutation = useMutation({
    mutationFn: api.createSupportRequest,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["woman-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["woman-case"] }),
        queryClient.invalidateQueries({ queryKey: ["cases"] }),
        queryClient.invalidateQueries({ queryKey: ["professional-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["manager-dashboard"] }),
      ]);
      toast.success("Solicitacao registrada com sucesso.");
      navigate("/mulher/caso");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel enviar a solicitacao.");
    },
  });

  function toggleViolenceType(type: ViolenceType) {
    setTiposViolencia((current) => {
      const exists = current.includes(type);
      const next = exists ? current.filter((item) => item !== type) : [...current, type];
      return next.length ? next : current;
    });
  }

  return (
    <AppLayout title="Registrar solicitacao" subtitle="Descreva a necessidade atual para abrir ou atualizar o acompanhamento do caso." showBack>
      <div className="space-y-5">
        <section className="rounded-[26px] border border-primary/15 bg-card/95 p-5 shadow-card">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Fluxo protegido
          </div>
          <p className="text-sm text-muted-foreground">
            Quando uma solicitacao e registrada, o caso passa a ficar disponivel para acompanhamento da equipe responsavel e da gestao autorizada.
          </p>
        </section>

        <section className="space-y-3">
          {services.map((service) => (
            <button
              key={service.value}
              onClick={() => {
                setSelectedService(service.value);
                if (service.value === "atendimento_especializado") {
                  navigate("/mulher/chat?start=1");
                }
              }}
              className={`flex w-full items-center gap-4 rounded-[24px] p-4 text-left transition-all ${
                selectedService === service.value
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "border border-border/70 bg-card/90 shadow-card hover:shadow-card-hover"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <service.icon className={`h-6 w-6 ${selectedService === service.value ? "text-primary-foreground" : "text-primary"}`} />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{service.label}</p>
                <p className={`text-sm ${selectedService === service.value ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{service.desc}</p>
              </div>
            </button>
          ))}
        </section>

        <section className="grid gap-4 rounded-[26px] border border-border/70 bg-card/95 p-5 shadow-card">
          <div>
            <label className="text-sm font-medium text-foreground">Relato da solicitacao</label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              placeholder="Descreva o ocorrido, o tipo de apoio necessario e qualquer informacao importante para a triagem inicial."
              className="mt-1 w-full rounded-2xl border border-border bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <p className="mt-2 text-xs text-muted-foreground">Esse texto fica visivel no historico inicial do caso.</p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Percepcao atual de risco</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {riskOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setRiskLevel(item.value)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    riskLevel === item.value
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
            <label className="text-sm font-medium text-foreground">Tipos de violencia relacionados</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {violenceTypeOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => toggleViolenceType(item.value)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    tiposViolencia.includes(item.value)
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
            <label className="text-sm font-medium text-foreground">Etnia/cor</label>
            <select
              value={etniaCor}
              onChange={(event) => setEtniaCor(event.target.value as Ethnicity)}
              className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {ethnicityOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {selectedService === "atendimento_especializado" ? (
            <button
              type="button"
              onClick={() => navigate("/mulher/chat?start=1")}
              className="w-full rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-card transition-all hover:shadow-card-hover active:scale-[0.98]"
            >
              Abrir chat com assistencia social
            </button>
          ) : (
            <button
              onClick={() =>
                mutation.mutate({
                  tipo: selectedService,
                  mensagem: message,
                  situacaoRisco: riskLevel,
                  tiposViolencia,
                  etniaCor,
                })
              }
              disabled={mutation.isPending}
              className="w-full rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-card transition-all hover:shadow-card-hover active:scale-[0.98] disabled:opacity-70"
            >
              {mutation.isPending ? "Registrando solicitacao..." : "Registrar solicitacao"}
            </button>
          )}
          <p className="text-xs text-muted-foreground">
            Depois do envio, acompanhe o status em "Meu caso" e veja as atualizacoes realizadas pela equipe responsavel.
          </p>
        </section>

        <section className="rounded-[24px] bg-urgent/10 p-4">
          <div className="mb-1 flex items-center gap-2 text-urgent">
            <CheckCircle2 className="h-4 w-4" />
            <p className="text-sm font-semibold">Em situacao de emergencia?</p>
          </div>
          <p className="text-sm text-muted-foreground">Em risco imediato, priorize os canais emergenciais e busque apoio presencial da rede de protecao.</p>
        </section>
      </div>
    </AppLayout>
  );
}
