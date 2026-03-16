import { AppLayout } from '@/components/layout/AppLayout';
import { Heart, Phone, MapPin, MessageCircle } from 'lucide-react';

const services = [
  { icon: Phone, label: 'Ligue 180', desc: 'Central de Atendimento à Mulher', action: 'Ligar agora' },
  { icon: MapPin, label: 'Encontrar abrigo', desc: 'Locais seguros mais próximos', action: 'Ver mapa' },
  { icon: MessageCircle, label: 'Falar com alguém', desc: 'Chat com profissional da rede', action: 'Iniciar conversa' },
  { icon: Heart, label: 'Solicitar novo apoio', desc: 'Saúde, jurídico, assistência social', action: 'Solicitar' },
];

export default function MulherAjuda() {
  return (
    <AppLayout title="Pedir Ajuda">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Você não está sozinha. Escolha uma das opções abaixo para receber apoio.
        </p>

        <div className="space-y-3">
          {services.map(s => (
            <button
              key={s.label}
              className="w-full flex items-center gap-4 bg-card p-4 rounded-2xl shadow-card hover:shadow-card-hover transition-all active:scale-[0.98] text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <s.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{s.label}</p>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Emergency */}
        <div className="bg-urgent/10 p-4 rounded-2xl mt-6">
          <p className="text-sm font-semibold text-urgent">Em situação de emergência?</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ligue imediatamente para o 190 (Polícia Militar) ou vá à delegacia mais próxima.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
