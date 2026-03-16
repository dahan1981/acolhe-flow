import type { CaseStatus, Priority, RiskLevel } from "@/types/domain";

const riskConfig: Record<RiskLevel, { label: string; className: string }> = {
  baixo: { label: "Baixo", className: "bg-accent/15 text-accent" },
  medio: { label: "Medio", className: "bg-primary/15 text-primary" },
  alto: { label: "Alto", className: "bg-warning/15 text-warning" },
  critico: { label: "Critico", className: "bg-urgent/15 text-urgent" },
};

const statusConfig: Record<CaseStatus, { label: string; className: string }> = {
  ativo: { label: "Ativo", className: "bg-urgent/15 text-urgent" },
  em_andamento: { label: "Em andamento", className: "bg-primary/15 text-primary" },
  encaminhado: { label: "Encaminhado", className: "bg-warning/15 text-warning" },
  resolvido: { label: "Resolvido", className: "bg-accent/15 text-accent" },
  arquivado: { label: "Arquivado", className: "bg-muted text-muted-foreground" },
};

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  baixa: { label: "Baixa", className: "bg-accent/15 text-accent" },
  media: { label: "Media", className: "bg-primary/15 text-primary" },
  alta: { label: "Alta", className: "bg-warning/15 text-warning" },
  urgente: { label: "Urgente", className: "bg-urgent/15 text-urgent" },
};

const referralStatusConfig: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-warning/15 text-warning" },
  aceito: { label: "Aceito", className: "bg-primary/15 text-primary" },
  em_atendimento: { label: "Em atendimento", className: "bg-accent/15 text-accent" },
  concluido: { label: "Concluido", className: "bg-muted text-muted-foreground" },
};

interface StatusBadgeProps {
  type: "risk" | "status" | "priority" | "encaminhamento";
  value: string;
}

export function StatusBadge({ type, value }: StatusBadgeProps) {
  let config: { label: string; className: string } | undefined;

  switch (type) {
    case "risk":
      config = riskConfig[value as RiskLevel];
      break;
    case "status":
      config = statusConfig[value as CaseStatus];
      break;
    case "priority":
      config = priorityConfig[value as Priority];
      break;
    case "encaminhamento":
      config = referralStatusConfig[value];
      break;
  }

  if (!config) return null;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
