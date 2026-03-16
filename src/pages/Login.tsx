import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { Shield, Heart, Users, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { UserProfile } from '@/data/mock-data';

const profiles: Array<{ id: UserProfile; label: string; desc: string; icon: React.ElementType; email: string }> = [
  { id: 'mulher', label: 'Mulher', desc: 'Acompanhe seu caso e solicite apoio', icon: Heart, email: 'ana@exemplo.com' },
  { id: 'profissional', label: 'Profissional', desc: 'Gerencie atendimentos e encaminhamentos', icon: Users, email: 'carla@exemplo.com' },
  { id: 'gestora', label: 'Gestora', desc: 'Painel de indicadores e relatórios', icon: BarChart3, email: 'fernanda@exemplo.com' },
];

export default function Login() {
  const [step, setStep] = useState<'welcome' | 'profiles'>('welcome');
  const { selectProfile } = useAuthStore();
  const navigate = useNavigate();

  const handleSelectProfile = (profile: UserProfile) => {
    selectProfile(profile);
    navigate(`/${profile}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">AcolheSistemas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plataforma Unificada de Proteção à Mulher
          </p>
        </div>

        {step === 'welcome' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <button
              onClick={() => setStep('profiles')}
              className="w-full py-4 px-6 bg-primary text-primary-foreground rounded-2xl font-semibold text-base shadow-card hover:shadow-card-hover transition-all duration-200 active:scale-[0.98]"
            >
              Entrar na Plataforma
            </button>
            <p className="text-center text-xs text-muted-foreground">
              Demonstração funcional — selecione um perfil para explorar
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            <p className="text-sm font-medium text-foreground text-center mb-4">
              Selecione o perfil de acesso
            </p>
            {profiles.map((p, i) => (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => handleSelectProfile(p.id)}
                className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-200 active:scale-[0.98] text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <p.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{p.label}</p>
                  <p className="text-sm text-muted-foreground">{p.desc}</p>
                </div>
              </motion.button>
            ))}
            <button
              onClick={() => setStep('welcome')}
              className="w-full text-center text-sm text-muted-foreground mt-4 py-2 hover:text-foreground transition-colors"
            >
              Voltar
            </button>
          </motion.div>
        )}
      </motion.div>

      <p className="text-xs text-muted-foreground mt-12 text-center">
        Secretaria da Mulher — Município de São Paulo
      </p>
    </div>
  );
}
