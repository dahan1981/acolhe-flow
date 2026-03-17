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

  return (
    <button
      onClick={() => navigate(`${basePath}/caso/${caso.id}`)}
      className="w-full rounded-[26px] border border-border/70 bg-card/95 p-4 text-left shadow-card transition-all duration-200 group hover:shadow-card-hover"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <FolderKanban className="h-3.5 w-3.5" />
              Caso
            </span>
            <span className="inline-flex items-center gap-1">
              <Hash className="h-3.5 w-3.5" />
              Protocolo {caso.protocolo}
            </span>
          </div>
          <h3 className="mt-0.5 truncate text-base font-semibold leading-tight text-foreground">
            {caso.nomeSocial || caso.nomeCompleto}
          </h3>
        </div>
        <div className="flex items-center gap-2 ml-2 shrink-0">
          <StatusBadge type="risk" value={caso.situacaoRisco} />
          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{getOrganizationName(caso.orgaoEntrada)}</span>
        <StatusBadge type="status" value={caso.status} />
      </div>
      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        <div className="rounded-2xl bg-background px-3 py-2">
          <div className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-[0.16em]">
            <Clock3 className="h-3.5 w-3.5" />
            Abertura
          </div>
          Desde {formatDate(caso.dataPrimeiroAtendimento)}
        </div>
        <div className="rounded-2xl bg-background px-3 py-2">
          <div className="mb-1 text-[11px] uppercase tracking-[0.16em]">Etnia/cor</div>
          {ethnicityLabel(caso.etniaCor ?? "nao_informada")}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(caso.tiposViolencia ?? []).slice(0, 2).map((tipo) => (
          <span key={tipo} className="rounded-full bg-warning/10 px-2.5 py-1 text-[11px] font-medium text-warning">
            {violenceTypeLabel(tipo)}
          </span>
        ))}
      </div>
    </button>
  );
}
