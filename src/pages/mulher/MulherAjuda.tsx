import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Heart, MapPin, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import type { RiskLevel } from "@/types/domain";

const services = [
  { icon: Phone, label: "Ligue 180", desc: "Central de Atendimento a Mulher", value: "ligue_180" },
  { icon: MapPin, label: "Encontrar abrigo", desc: "Locais seguros mais proximos", value: "abrigo" },
  { icon: MessageCircle, label: "Falar com alguem", desc: "Contato com profissional da rede", value: "contato_profissional" },
  { icon: Heart, label: "Solicitar novo apoio", desc: "Saude, juridico, assistencia social", value: "apoio_geral" },
];

export default function MulherAjuda() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState(services[0].value);
  const [message, setMessage] = useState("");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("medio");

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
      toast.success("Solicitacao registrada e compartilhada na demo.");
      navigate("/mulher/caso");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel enviar a solicitacao.");
    },
  });

  return (
    <AppLayout title="Pedir Ajuda" showBack>
      <div className="space-y-4">
        <div className="rounded-[24px] border border-white/60 bg-card/90 p-4 shadow-card">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Fluxo integrado da demo
          </div>
          <p className="text-sm text-muted-foreground">
            Ao registrar esta solicitacao, um novo caso sera criado na sua area e tambem aparecera automaticamente para a
            Profissional e para a Gestora no mesmo navegador.
          </p>
        </div>

        <div className="space-y-3">
          {services.map((service) => (
            <button
              key={service.value}
              onClick={() => setSelectedService(service.value)}
              className={`w-full flex items-center gap-4 p-4 rounded-[24px] text-left transition-all ${
                selectedService === service.value
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "bg-card/90 shadow-card hover:shadow-card-hover border border-border/70"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <service.icon className={`w-6 h-6 ${selectedService === service.value ? "text-primary-foreground" : "text-primary"}`} />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{service.label}</p>
                <p className={`text-sm ${selectedService === service.value ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {service.desc}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-card/90 p-4 rounded-[24px] shadow-card space-y-4 border border-border/70">
          <div>
            <label className="text-sm font-medium text-foreground">Mensagem</label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              placeholder="Descreva o ocorrido, o apoio desejado e qualquer detalhe importante para a triagem."
              className="mt-1 w-full p-3 bg-background rounded-xl border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Nivel de risco percebido</label>
            <div className="mt-2 flex gap-2 flex-wrap">
              {(["baixo", "medio", "alto", "critico"] as RiskLevel[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRiskLevel(item)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    riskLevel === item ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground border border-border"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() =>
              mutation.mutate({
                tipo: selectedService,
                mensagem: message,
                situacaoRisco: riskLevel,
              })
            }
            disabled={mutation.isPending}
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-semibold text-base shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all disabled:opacity-70"
          >
            {mutation.isPending ? "Registrando caso..." : "Criar denuncia de teste"}
          </button>
          <p className="text-xs text-muted-foreground">
            Depois do envio, acompanhe o andamento em "Meu caso" e valide o reflexo nas areas Profissional e Gestora.
          </p>
        </div>

        <div className="bg-urgent/10 p-4 rounded-[24px] mt-6">
          <p className="text-sm font-semibold text-urgent">Em situacao de emergencia?</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ligue imediatamente para o 190 ou procure a delegacia mais proxima.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
