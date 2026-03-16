import { AppLayout } from '@/components/layout/AppLayout';
import { Shield, Bell, Lock, HelpCircle, Info } from 'lucide-react';

export default function ConfigPage() {
  const items = [
    { icon: Bell, label: 'Notificações', desc: 'Gerenciar alertas e avisos' },
    { icon: Lock, label: 'Segurança', desc: 'Senha e autenticação' },
    { icon: Shield, label: 'Permissões', desc: 'Controle de acesso por perfil' },
    { icon: HelpCircle, label: 'Ajuda', desc: 'Documentação e suporte' },
    { icon: Info, label: 'Sobre', desc: 'AcolheSistemas v1.0' },
  ];

  return (
    <AppLayout title="Configurações">
      <div className="space-y-3">
        {items.map(item => (
          <button
            key={item.label}
            className="w-full flex items-center gap-4 bg-card p-4 rounded-2xl shadow-card hover:shadow-card-hover transition-all text-left active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <item.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </button>
        ))}

        <p className="text-xs text-center text-muted-foreground mt-8">
          AcolheSistemas v1.0 — Demonstração Funcional<br />
          Secretaria da Mulher — Município de São Paulo
        </p>
      </div>
    </AppLayout>
  );
}
