import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { formatDate, getOrganizationName } from "@/lib/domain";
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
      className="w-full text-left bg-card p-4 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-200 group"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Protocolo #{caso.protocolo}
          </span>
          <h3 className="text-base font-semibold text-foreground leading-tight mt-0.5 truncate">
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
      <div className="text-xs text-muted-foreground mt-2">Desde {formatDate(caso.dataPrimeiroAtendimento)}</div>
    </button>
  );
}
