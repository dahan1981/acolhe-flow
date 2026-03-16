import type {
  Attendance,
  CaseDetail,
  CaseStatus,
  CaseSummary,
  CreateAttendancePayload,
  CreateReferralPayload,
  CreateSupportRequestPayload,
  ManagerStats,
  Referral,
  SessionUser,
  SupportRequest,
} from "@/types/domain";

const DEMO_CASES_STORAGE_KEY = "acolhe-flow-demo-cases";
const DEMO_SESSION_STORAGE_KEY = "acolhe-flow-demo-session";

type DemoCaseRecord = {
  ownerEmail: string;
  ownerName: string;
  lastUpdatedAt: string;
  lastUpdateSummary: string;
  caseData: CaseDetail;
};

type CaseActivitySummary = {
  date: string;
  status: CaseStatus;
  summary: string;
};

type InternalProtocolPayload = {
  nomeCompleto: string;
  nomeSocial?: string;
  cpf?: string;
  telefone?: string;
  endereco?: string;
  municipio?: string;
  uf?: string;
  situacaoRisco: CaseDetail["situacaoRisco"];
  observacoesIniciais: string;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function loadRecords() {
  if (!isBrowser()) return [] as DemoCaseRecord[];

  try {
    const raw = window.localStorage.getItem(DEMO_CASES_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DemoCaseRecord[];
  } catch {
    return [];
  }
}

function saveRecords(records: DemoCaseRecord[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(DEMO_CASES_STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent("acolhe-flow-demo-cases-updated"));
}

function readSessionUser() {
  if (!isBrowser()) return null;

  try {
    const raw = window.localStorage.getItem(DEMO_SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

function sortByRecent<T extends { lastUpdatedAt?: string; caseData?: { dataPrimeiroAtendimento: string } }>(items: T[]) {
  return [...items].sort((a, b) => {
    const left = a.lastUpdatedAt ?? a.caseData?.dataPrimeiroAtendimento ?? "";
    const right = b.lastUpdatedAt ?? b.caseData?.dataPrimeiroAtendimento ?? "";
    return new Date(right).getTime() - new Date(left).getTime();
  });
}

function normalizeCaseSummary(caso: CaseDetail): CaseSummary {
  return {
    id: caso.id,
    protocolo: caso.protocolo,
    nomeCompleto: caso.nomeCompleto,
    nomeSocial: caso.nomeSocial,
    cpf: caso.cpf,
    telefone: caso.telefone,
    endereco: caso.endereco,
    municipio: caso.municipio,
    situacaoRisco: caso.situacaoRisco,
    orgaoEntrada: caso.orgaoEntrada,
    dataPrimeiroAtendimento: caso.dataPrimeiroAtendimento,
    observacoesIniciais: caso.observacoesIniciais,
    status: caso.status,
  };
}

function nextProtocol(records: DemoCaseRecord[]) {
  return `DM-${String(records.length + 1).padStart(4, "0")}`;
}

function caseStatusLabel(status: CaseStatus) {
  if (status === "em_andamento") return "Em andamento";
  if (status === "encaminhado") return "Encaminhado";
  if (status === "resolvido") return "Resolvido";
  if (status === "arquivado") return "Arquivado";
  return "Ativo";
}

function buildInitialAttendance(ownerName: string, payload: CreateSupportRequestPayload): Attendance {
  return {
    id: `demo-att-${Date.now()}`,
    data: today(),
    profissionalResponsavel: "Triagem automatizada da demo",
    orgao: "sec-mulher",
    tipoAtendimento: "Registro inicial",
    resumo: payload.mensagem?.trim() || `Solicitacao registrada em ${payload.tipo}.`,
    riscoIdentificado: payload.situacaoRisco,
    necessidadeEncaminhamento: false,
    proximosPassos: `Aguardando revisao inicial da equipe para ${ownerName}.`,
  };
}

function buildInitialSupportRequest(payload: CreateSupportRequestPayload): SupportRequest {
  return {
    id: `demo-support-${Date.now()}`,
    tipo: payload.tipo,
    mensagem: payload.mensagem?.trim() || "Solicitacao registrada pela area da Mulher.",
    status: "recebido",
    data: nowIso(),
  };
}

function upsertRecord(nextRecord: DemoCaseRecord) {
  const records = loadRecords();
  const index = records.findIndex((item) => item.caseData.id === nextRecord.caseData.id);

  if (index >= 0) {
    records[index] = nextRecord;
  } else {
    records.unshift(nextRecord);
  }

  saveRecords(sortByRecent(records));
}

export function syncDemoSessionUser(user: SessionUser | null) {
  if (!isBrowser()) return;

  if (!user) {
    window.localStorage.removeItem(DEMO_SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify(user));
}

export function getDemoCaseRecords() {
  return sortByRecent(loadRecords());
}

export function getOwnDemoCaseRecords() {
  const user = readSessionUser();
  if (!user) return [];

  return getDemoCaseRecords().filter((item) => item.ownerEmail === user.email);
}

export function getOwnLatestDemoCase() {
  return getOwnDemoCaseRecords()[0]?.caseData ?? null;
}

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
      summary: `Encaminhado para ${item.orgaoDestino} com prioridade ${item.prioridade}.`,
    })),
    ...caso.solicitacoesApoio.map((item) => ({
      date: item.data,
      status: caso.status,
      summary: item.mensagem || `Solicitacao de ${item.tipo} registrada.`,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return entries[0] ?? { date: caso.dataPrimeiroAtendimento, status: caso.status, summary: caso.observacoesIniciais };
}

export function createDemoSupportCase(payload: CreateSupportRequestPayload) {
  const user = readSessionUser();
  if (!user) {
    throw new Error("Sessao da demo indisponivel para criar o caso.");
  }

  const records = loadRecords();
  const initialAttendance = buildInitialAttendance(user.nome, payload);
  const initialSupportRequest = buildInitialSupportRequest(payload);
  const caseId = `demo-case-${Date.now()}`;

  const caseData: CaseDetail = {
    id: caseId,
    protocolo: nextProtocol(records),
    nomeCompleto: user.nome,
    nomeSocial: null,
    cpf: "Nao informado",
    telefone: "(21) 90000-0000",
    endereco: "Endereco protegido na demonstracao",
    municipio: "Mangaratiba",
    situacaoRisco: payload.situacaoRisco,
    orgaoEntrada: "sec-mulher",
    dataPrimeiroAtendimento: today(),
    observacoesIniciais: payload.mensagem?.trim() || "Solicitacao registrada na area da Mulher.",
    status: "ativo",
    perfilMulher: {
      id: `demo-profile-${user.id}`,
      nomeSocial: null,
      cpf: "Nao informado",
      dataNascimento: today(),
      telefone: "(21) 90000-0000",
      endereco: "Endereco protegido na demonstracao",
      municipio: "Mangaratiba",
      uf: "RJ",
    },
    atribuidaPara: "Fila inicial da rede",
    orgaoAtual: "sec-mulher",
    atendimentos: [initialAttendance],
    encaminhamentos: [],
    solicitacoesApoio: [initialSupportRequest],
  };

  upsertRecord({
    ownerEmail: user.email,
    ownerName: user.nome,
    lastUpdatedAt: initialSupportRequest.data,
    lastUpdateSummary: initialSupportRequest.mensagem || initialAttendance.resumo,
    caseData,
  });

  return caseData;
}

export function createDemoInternalProtocol(payload: InternalProtocolPayload) {
  const user = readSessionUser();
  if (!user) {
    throw new Error("Sessao da demo indisponivel para criar protocolo.");
  }

  const records = loadRecords();
  const createdAt = nowIso();
  const attendance: Attendance = {
    id: `demo-att-int-${Date.now()}`,
    data: today(),
    profissionalResponsavel: user.nome,
    orgao: user.orgao || "sec-mulher",
    tipoAtendimento: "Registro institucional",
    resumo: payload.observacoesIniciais,
    riscoIdentificado: payload.situacaoRisco,
    necessidadeEncaminhamento: false,
    proximosPassos: "Aguardando triagem e distribuicao para acompanhamento.",
  };

  const caseData: CaseDetail = {
    id: `demo-case-${Date.now()}`,
    protocolo: nextProtocol(records),
    nomeCompleto: payload.nomeCompleto.trim(),
    nomeSocial: payload.nomeSocial?.trim() || null,
    cpf: payload.cpf?.trim() || "Nao informado",
    telefone: payload.telefone?.trim() || "(21) 90000-0000",
    endereco: payload.endereco?.trim() || "Endereco em validacao",
    municipio: payload.municipio?.trim() || "Mangaratiba",
    situacaoRisco: payload.situacaoRisco,
    orgaoEntrada: user.orgao || "sec-mulher",
    dataPrimeiroAtendimento: today(),
    observacoesIniciais: payload.observacoesIniciais.trim(),
    status: "ativo",
    perfilMulher: {
      id: `demo-profile-${Date.now()}`,
      nomeSocial: payload.nomeSocial?.trim() || null,
      cpf: payload.cpf?.trim() || "Nao informado",
      dataNascimento: today(),
      telefone: payload.telefone?.trim() || "(21) 90000-0000",
      endereco: payload.endereco?.trim() || "Endereco em validacao",
      municipio: payload.municipio?.trim() || "Mangaratiba",
      uf: payload.uf?.trim() || "RJ",
    },
    atribuidaPara: user.nome,
    orgaoAtual: user.orgao || "sec-mulher",
    atendimentos: [attendance],
    encaminhamentos: [],
    solicitacoesApoio: [],
  };

  upsertRecord({
    ownerEmail: `${caseData.protocolo.toLowerCase()}@demo.local`,
    ownerName: caseData.nomeCompleto,
    lastUpdatedAt: createdAt,
    lastUpdateSummary: payload.observacoesIniciais.trim(),
    caseData,
  });

  return caseData;
}

export function updateDemoCaseStatus(caseId: string, status: CaseStatus) {
  const sessionUser = readSessionUser();
  const records = loadRecords();
  const target = records.find((item) => item.caseData.id === caseId);

  if (!target) return null;

  const updateNote: Attendance = {
    id: `demo-att-status-${Date.now()}`,
    data: today(),
    profissionalResponsavel: sessionUser?.nome || "Equipe da demo",
    orgao: sessionUser?.orgao || "sec-mulher",
    tipoAtendimento: "Atualizacao de andamento",
    resumo: `Status ajustado para ${caseStatusLabel(status)} na demonstracao.`,
    riscoIdentificado: target.caseData.situacaoRisco,
    necessidadeEncaminhamento: false,
    proximosPassos: status === "resolvido" ? "Caso concluido para fins demonstrativos." : "Acompanhamento segue em curso.",
  };

  const nextRecord: DemoCaseRecord = {
    ...target,
    lastUpdatedAt: nowIso(),
    lastUpdateSummary: updateNote.resumo,
    caseData: {
      ...target.caseData,
      status,
      atendimentos: [updateNote, ...target.caseData.atendimentos],
    },
  };

  upsertRecord(nextRecord);
  return normalizeCaseSummary(nextRecord.caseData);
}

export function createDemoAttendance(payload: CreateAttendancePayload) {
  const sessionUser = readSessionUser();
  const records = loadRecords();
  const target = records.find((item) => item.caseData.id === payload.caseId);

  if (!target) return null;

  const attendance: Attendance = {
    id: `demo-att-${Date.now()}`,
    data: today(),
    profissionalResponsavel: sessionUser?.nome || "Profissional da demo",
    orgao: sessionUser?.orgao || "sec-mulher",
    tipoAtendimento: payload.tipoAtendimento,
    resumo: payload.resumo,
    riscoIdentificado: payload.riscoIdentificado,
    necessidadeEncaminhamento: payload.necessidadeEncaminhamento,
    proximosPassos: payload.proximosPassos,
  };

  const nextRecord: DemoCaseRecord = {
    ...target,
    lastUpdatedAt: nowIso(),
    lastUpdateSummary: attendance.resumo,
    caseData: {
      ...target.caseData,
      status: "em_andamento",
      situacaoRisco: payload.riscoIdentificado,
      orgaoAtual: sessionUser?.orgao || target.caseData.orgaoAtual,
      atendimentos: [attendance, ...target.caseData.atendimentos],
    },
  };

  upsertRecord(nextRecord);
  return attendance;
}

export function createDemoReferral(payload: CreateReferralPayload, organizationName: string) {
  const records = loadRecords();
  const target = records.find((item) => item.caseData.id === payload.caseId);

  if (!target) return null;

  const referral: Referral = {
    id: `demo-ref-${Date.now()}`,
    data: today(),
    orgaoDestino: organizationName,
    motivo: payload.motivo,
    prioridade: payload.prioridade,
    status: "pendente",
  };

  const nextRecord: DemoCaseRecord = {
    ...target,
    lastUpdatedAt: nowIso(),
    lastUpdateSummary: `Encaminhamento registrado para ${organizationName}.`,
    caseData: {
      ...target.caseData,
      status: "encaminhado",
      orgaoAtual: organizationName,
      encaminhamentos: [referral, ...target.caseData.encaminhamentos],
    },
  };

  upsertRecord(nextRecord);
  return referral;
}

export function findDemoCase(caseId: string) {
  return getDemoCaseRecords().find((item) => item.caseData.id === caseId)?.caseData ?? null;
}

export function mergeCaseCollections(remoteCases: CaseSummary[]) {
  const demoCases = getDemoCaseRecords().map((item) => normalizeCaseSummary(item.caseData));
  const merged = [...remoteCases];

  demoCases.forEach((demoCase) => {
    if (!merged.some((item) => item.id === demoCase.id)) {
      merged.unshift(demoCase);
    }
  });

  return merged;
}

export function filterCases(cases: CaseSummary[], search: string, status: string) {
  return cases.filter((item) => {
    const matchesStatus = status === "todos" ? true : item.status === status;
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      item.nomeCompleto.toLowerCase().includes(term) ||
      (item.nomeSocial || "").toLowerCase().includes(term) ||
      item.protocolo.toLowerCase().includes(term) ||
      item.cpf.toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });
}

export function mergeProfessionalDashboard(remote: {
  casosAtivos: number;
  atendimentosHoje: number;
  casosPrioritarios: CaseSummary[];
  ultimosAtendimentos: Array<Attendance & { caso: { id: string; protocolo: string; nomeCompleto: string; nomeSocial?: string | null } }>;
}) {
  const demoRecords = getDemoCaseRecords();
  const demoActive = demoRecords.filter((item) => item.caseData.status !== "resolvido" && item.caseData.status !== "arquivado");
  const demoAttendances = demoRecords.flatMap((record) =>
    record.caseData.atendimentos.map((attendance) => ({
      ...attendance,
      caso: {
        id: record.caseData.id,
        protocolo: record.caseData.protocolo,
        nomeCompleto: record.caseData.nomeCompleto,
        nomeSocial: record.caseData.nomeSocial,
      },
    })),
  );

  const topCases = mergeCaseCollections(remote.casosPrioritarios)
    .sort((a, b) => riskSortWeight(b.situacaoRisco) - riskSortWeight(a.situacaoRisco))
    .slice(0, 4);

  return {
    casosAtivos: remote.casosAtivos + demoActive.length,
    atendimentosHoje: remote.atendimentosHoje + demoAttendances.filter((item) => item.data === today()).length,
    casosPrioritarios: topCases,
    ultimosAtendimentos: [...demoAttendances, ...remote.ultimosAtendimentos]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 6),
  };
}

export function mergeManagerStats(remote: ManagerStats): ManagerStats {
  const demoRecords = getDemoCaseRecords();
  const totalAtendimentos = demoRecords.reduce((sum, item) => sum + item.caseData.atendimentos.length, 0);
  const pendingReferrals = demoRecords.reduce(
    (sum, item) => sum + item.caseData.encaminhamentos.filter((referral) => referral.status === "pendente").length,
    0,
  );

  const statusTotals = demoRecords.reduce(
    (acc, item) => {
      if (item.caseData.status === "ativo") acc.ativos += 1;
      if (item.caseData.status === "em_andamento") acc.emAndamento += 1;
      if (item.caseData.status === "encaminhado") acc.encaminhados += 1;
      if (item.caseData.status === "resolvido") acc.resolvidos += 1;
      return acc;
    },
    { ativos: 0, emAndamento: 0, encaminhados: 0, resolvidos: 0 },
  );

  const byRisk = [...remote.porRisco].map((item) => ({ ...item }));
  demoRecords.forEach((item) => {
    const riskKey = item.caseData.situacaoRisco;
    const match = byRisk.find((entry) => entry.nivel.toLowerCase() === riskKey);
    if (match) {
      match.total += 1;
    }
  });

  const byOrg = [...remote.porOrgao].map((item) => ({ ...item }));
  demoRecords.forEach((item) => {
    const orgName = item.caseData.orgaoAtual;
    const match = byOrg.find((entry) => entry.orgao === orgName || entry.sigla === orgName);
    if (match) {
      match.total += 1;
      return;
    }

    byOrg.push({ orgao: orgName, sigla: orgName.slice(0, 3).toUpperCase(), total: 1 });
  });

  return {
    ...remote,
    total: remote.total + demoRecords.length,
    ativos: remote.ativos + statusTotals.ativos,
    emAndamento: remote.emAndamento + statusTotals.emAndamento,
    encaminhados: remote.encaminhados + statusTotals.encaminhados,
    resolvidos: remote.resolvidos + statusTotals.resolvidos,
    totalAtendimentos: remote.totalAtendimentos + totalAtendimentos,
    encaminhamentosPendentes: remote.encaminhamentosPendentes + pendingReferrals,
    porRisco: byRisk,
    porOrgao: byOrg,
  };
}

function riskSortWeight(risk: CaseSummary["situacaoRisco"]) {
  if (risk === "critico") return 4;
  if (risk === "alto") return 3;
  if (risk === "medio") return 2;
  return 1;
}
