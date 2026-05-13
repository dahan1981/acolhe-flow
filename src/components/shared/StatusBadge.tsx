import type { CaseStatus, Priority, RiskLevel } from "@/types/domain";

const riskConfig: Record<RiskLevel, { label: string; className: string }> = {
  baixo: { label: "Baixo", className: "border border-accent/15 bg-accent/12 text-accent" },
  medio: { label: "Medio", className: "border border-primary/15 bg-primary/12 text-primary" },
  alto: { label: "Alto", className: "border border-warning/20 bg-warning/14 text-warning" },
  critico: { label: "Critico", className: "border border-urgent/20 bg-urgent/14 text-urgent" },
};

const statusConfig: Record<CaseStatus, { label: string; className: string }> = {
  ativo: { label: "Ativo", className: "border border-urgent/20 bg-urgent/14 text-urgent" },
  em_andamento: { label: "Em andamento", className: "border border-primary/15 bg-primary/12 text-primary" },
  encaminhado: { label: "Encaminhado", className: "border border-warning/20 bg-warning/14 text-warning" },
  resolvido: { label: "Resolvido", className: "border border-accent/15 bg-accent/12 text-accent" },
  arquivado: { label: "Arquivado", className: "border border-border/70 bg-muted/80 text-muted-foreground" },
};

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  baixa: { label: "Baixa", className: "border border-accent/15 bg-accent/12 text-accent" },
  media: { label: "Media", className: "border border-primary/15 bg-primary/12 text-primary" },
  alta: { label: "Alta", className: "border border-warning/20 bg-warning/14 text-warning" },
  urgente: { label: "Urgente", className: "border border-urgent/20 bg-urgent/14 text-urgent" },
};

const referralStatusConfig: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "border border-warning/20 bg-warning/14 text-warning" },
  aceito: { label: "Aceito", className: "border border-primary/15 bg-primary/12 text-primary" },
  em_atendimento: { label: "Em atendimento", className: "border border-accent/15 bg-accent/12 text-accent" },
  concluido: { label: "Concluido", className: "border border-border/70 bg-muted/80 text-muted-foreground" },
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
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em] shadow-card ${config.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {config.label}
    </span>
  );
}
