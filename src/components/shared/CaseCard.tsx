import { useNavigate } from "react-router-dom";
import { ChevronRight, Clock3, FolderKanban, Hash } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { ethnicityLabel, formatDate, getOrganizationName, violenceTypeLabel } from "@/lib/domain";
import type { CaseSummary } from "@/types/domain";

interface CaseCardProps {
  caso: CaseSummary;
  basePath?: string;
}

export function CaseCard({ caso, basePath = "/profissional" }: CaseCardProps) {
  const navigate = useNavigate();
  const currentOrganization = caso.orgaoAtual ?? caso.orgaoEntrada;

  return (
    <button
      onClick={() => navigate(`${basePath}/caso/${caso.id}`)}
      className="group w-full rounded-[28px] border border-white/65 bg-card/95 p-4 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/10 bg-primary/10 px-2 py-1 text-primary">
              <FolderKanban className="h-3.5 w-3.5" />
              Caso
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-2 py-1">
              <Hash className="h-3.5 w-3.5" />
              Protocolo {caso.protocolo}
            </span>
          </div>
          <h3 className="mt-0.5 text-base font-semibold leading-tight text-foreground">
            {caso.nomeSocial || caso.nomeCompleto}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {getOrganizationName(caso.orgaoEntrada)} - acompanhamento atual em {getOrganizationName(currentOrganization)}
          </p>
        </div>
        <div className="ml-2 flex shrink-0 items-center gap-2">
          <StatusBadge type="risk" value={caso.situacaoRisco} />
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-40 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-[22px] border border-border/60 bg-background/80 px-3 py-3 text-sm text-muted-foreground">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Situação atual</p>
          <p className="truncate text-sm font-medium text-foreground">{getOrganizationName(currentOrganization)}</p>
        </div>
        <StatusBadge type="status" value={caso.status} />
      </div>

      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        <div className="rounded-[22px] border border-border/60 bg-background/80 px-3 py-3">
          <div className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-[0.16em]">
            <Clock3 className="h-3.5 w-3.5" />
            Abertura
          </div>
          Desde {formatDate(caso.dataPrimeiroAtendimento)}
        </div>
        <div className="rounded-[22px] border border-border/60 bg-background/80 px-3 py-3">
          <div className="mb-1 text-[11px] uppercase tracking-[0.16em]">Etnia/cor</div>
          {ethnicityLabel(caso.etniaCor ?? "nao_informada")}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(caso.tiposViolencia ?? []).slice(0, 2).map((tipo) => (
          <span
            key={tipo}
            className="rounded-full border border-warning/20 bg-warning/10 px-2.5 py-1 text-[11px] font-medium text-warning"
          >
            {violenceTypeLabel(tipo)}
          </span>
        ))}
      </div>
    </button>
  );
}
