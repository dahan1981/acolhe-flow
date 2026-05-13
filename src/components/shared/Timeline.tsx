import { AlertCircle, ArrowRight, ClipboardList, FileText, Flag, ShieldAlert } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { ethnicityLabel, formatDate, getOrganizationName, violenceTypeLabel } from "@/lib/domain";
import type { Attendance, CaseDetail, Referral, SupportRequest } from "@/types/domain";

interface TimelineProps {
  caso?: CaseDetail;
  atendimentos: Attendance[];
  encaminhamentos: Referral[];
  solicitacoesApoio?: SupportRequest[];
}

type TimelineItem =
  | { id: string; type: "abertura"; date: string; caso: CaseDetail }
  | { id: string; type: "solicitacao"; date: string; item: SupportRequest }
  | { id: string; type: "atendimento"; date: string; item: Attendance }
  | { id: string; type: "encaminhamento"; date: string; item: Referral };

export function Timeline({ caso, atendimentos, encaminhamentos, solicitacoesApoio = [] }: TimelineProps) {
  const items: TimelineItem[] = [
    ...(caso ? [{ id: `${caso.id}-opening`, type: "abertura" as const, date: caso.dataPrimeiroAtendimento, caso }] : []),
    ...solicitacoesApoio.map((item) => ({ id: item.id, type: "solicitacao" as const, date: item.data, item })),
    ...atendimentos.map((item) => ({ id: item.id, type: "atendimento" as const, date: item.data, item })),
    ...encaminhamentos.map((item) => ({ id: item.id, type: "encaminhamento" as const, date: item.data, item })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (items.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-border/70 bg-card/70 px-5 py-8 text-center text-sm text-muted-foreground">
        Nenhum movimento foi registrado para este caso até o momento.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {caso ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Protocolo" value={caso.protocolo} helper="Vinculo principal do caso" />
          <SummaryCard label="Solicitações" value={String(solicitacoesApoio.length)} helper="Pedidos registrados pela conta" />
          <SummaryCard label="Atendimentos" value={String(atendimentos.length)} helper="Ações conduzidas pela equipe" />
          <SummaryCard label="Encaminhamentos" value={String(encaminhamentos.length)} helper="Movimentos para a rede de apoio" />
        </div>
      ) : null}

      {items.map((entry, index) => (
        <div key={entry.id} className="relative pl-7">
          <div className="absolute left-0 top-3 flex h-4 w-4 items-center justify-center rounded-full border border-primary/20 bg-background">
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
          </div>
          {index < items.length - 1 ? <div className="absolute left-[7px] top-7 bottom-[-18px] w-px bg-border" /> : null}
          {entry.type === "abertura" ? <OpeningCard caso={entry.caso} /> : null}
          {entry.type === "solicitacao" ? <SupportRequestCard item={entry.item} /> : null}
          {entry.type === "atendimento" ? <AttendanceCard atendimento={entry.item} /> : null}
          {entry.type === "encaminhamento" ? <ReferralCard encaminhamento={entry.item} /> : null}
        </div>
      ))}
    </div>
  );
}

function SummaryCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-[22px] border border-border/70 bg-card/85 px-4 py-4 shadow-card">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

function OpeningCard({ caso }: { caso: CaseDetail }) {
  return (
    <div className="rounded-[24px] border border-primary/15 bg-card/95 p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Abertura do caso</span>
        <span className="ml-auto text-xs text-muted-foreground">{formatDate(caso.dataPrimeiroAtendimento)}</span>
      </div>
      <p className="text-xs text-muted-foreground">Protocolo gerado e caso distribuído para início do acompanhamento.</p>
      <p className="text-sm font-semibold text-foreground">Protocolo #{caso.protocolo}</p>
      <p className="mt-1 text-sm text-muted-foreground">{caso.observacoesIniciais}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge type="status" value={caso.status} />
        <StatusBadge type="risk" value={caso.situacaoRisco} />
      </div>
      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        <div className="rounded-2xl bg-background px-3 py-2">Órgão de entrada: {getOrganizationName(caso.orgaoEntrada)}</div>
        <div className="rounded-2xl bg-background px-3 py-2">Etnia/cor: {ethnicityLabel(caso.etniaCor ?? "nao_informada")}</div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {(caso.tiposViolencia ?? []).map((tipo) => (
          <span key={tipo} className="rounded-full bg-warning/10 px-2.5 py-1 text-[11px] font-medium text-warning">
            {violenceTypeLabel(tipo)}
          </span>
        ))}
      </div>
    </div>
  );
}

function SupportRequestCard({ item }: { item: SupportRequest }) {
  return (
    <div className="rounded-[24px] border border-border/70 bg-card/95 p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-urgent" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-urgent">Solicitação registrada</span>
        <span className="ml-auto text-xs text-muted-foreground">{new Date(item.data).toLocaleString("pt-BR")}</span>
      </div>
      <p className="text-xs text-muted-foreground">Solicitação registrada pela conta da mulher e encaminhada para análise da equipe.</p>
      <p className="text-sm font-semibold text-foreground">{item.tipo}</p>
      <p className="mt-1 text-sm text-muted-foreground">{item.mensagem || "Sem observação adicional informada."}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {(item.tiposViolencia ?? []).map((tipo) => (
          <span key={tipo} className="rounded-full bg-warning/10 px-2.5 py-1 text-[11px] font-medium text-warning">
            {violenceTypeLabel(tipo)}
          </span>
        ))}
      </div>
    </div>
  );
}

function AttendanceCard({ atendimento }: { atendimento: Attendance }) {
  return (
    <div className="rounded-[24px] border border-border/70 bg-card/95 p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Atendimento</span>
        <span className="ml-auto text-xs text-muted-foreground">{formatDate(atendimento.data)}</span>
      </div>
      <p className="text-xs text-muted-foreground">Registro operacional com avaliação de risco e próxima conduta definida.</p>
      <p className="text-sm font-semibold text-foreground">{atendimento.tipoAtendimento}</p>
      <p className="mt-1 text-sm text-muted-foreground">{atendimento.resumo}</p>
      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        <div className="rounded-2xl bg-background px-3 py-2">Responsável: {atendimento.profissionalResponsavel}</div>
        <div className="rounded-2xl bg-background px-3 py-2">Órgão: {getOrganizationName(atendimento.orgao)}</div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge type="risk" value={atendimento.riscoIdentificado} />
        {(atendimento.tiposViolencia ?? []).map((tipo) => (
          <span key={tipo} className="rounded-full bg-warning/10 px-2.5 py-1 text-[11px] font-medium text-warning">
            {violenceTypeLabel(tipo)}
          </span>
        ))}
      </div>
      {atendimento.proximosPassos ? (
        <div className="mt-3 rounded-2xl bg-background px-3 py-3 text-sm text-muted-foreground">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Próximos passos</p>
          {atendimento.proximosPassos}
        </div>
      ) : null}
      {atendimento.observacoesInternas ? (
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-border/60 bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Observação operacional</p>
            {atendimento.observacoesInternas}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReferralCard({ encaminhamento }: { encaminhamento: Referral }) {
  return (
    <div className="rounded-[24px] border border-accent/15 bg-card/95 p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <ArrowRight className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Encaminhamento</span>
        <span className="ml-auto text-xs text-muted-foreground">{formatDate(encaminhamento.data)}</span>
      </div>
      <p className="text-xs text-muted-foreground">Movimento formal para outro órgão ou serviço da rede com prioridade definida.</p>
      <p className="text-sm font-semibold text-foreground">{getOrganizationName(encaminhamento.orgaoDestino)}</p>
      <p className="mt-1 text-sm text-muted-foreground">{encaminhamento.motivo}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge type="priority" value={encaminhamento.prioridade} />
        <StatusBadge type="encaminhamento" value={encaminhamento.status} />
        <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          <Flag className="h-3 w-3" />
          Distribuição na rede
        </span>
      </div>
    </div>
  );
}
