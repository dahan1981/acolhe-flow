import type { CaseDetail, CaseStatus } from "@/types/domain";

type CaseActivitySummary = {
  date: string;
  status: CaseStatus;
  summary: string;
};

export function getCaseActivitySummary(caso: CaseDetail): CaseActivitySummary {
  const entries = [
    ...caso.atendimentos.map((item) => ({
      date: item.data,
      status: caso.status,
      summary: `${item.tipoAtendimento}: ${item.resumo}`,
    })),
    ...caso.encaminhamentos.map((item) => ({
      date: item.data,
      status: caso.status,
      summary: `Encaminhamento emitido para ${item.orgaoDestino} com prioridade ${item.prioridade}.`,
    })),
    ...caso.solicitacoesApoio.map((item) => ({
      date: item.data,
      status: caso.status,
      summary: item.mensagem || `Solicitacao de ${item.tipo} registrada.`,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return entries[0] ?? { date: caso.dataPrimeiroAtendimento, status: caso.status, summary: caso.observacoesIniciais };
}
