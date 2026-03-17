import type {
  Attendance,
  CaseDetail,
  CaseStatus,
  CaseSummary,
  CreateAttendancePayload,
  CreateReferralPayload,
  CreateSupportRequestPayload,
  Ethnicity,
  ManagerStats,
  Referral,
  SessionUser,
  SupportRequest,
  ViolenceType,
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
  tiposViolencia?: ViolenceType[];
  etniaCor?: Ethnicity;
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

function defaultViolenceTypes(): ViolenceType[] {
  return ["violencia_psicologica"];
}

function normalizeViolenceTypes(types?: ViolenceType[]) {
  return types && types.length ? types : defaultViolenceTypes();
}

function normalizeEthnicity(value?: Ethnicity) {
  return value ?? "nao_informada";
}

function ensureCaseShape(caso: CaseDetail): CaseDetail {
  return {
    ...caso,
    tiposViolencia: normalizeViolenceTypes(caso.tiposViolencia),
    etniaCor: normalizeEthnicity(caso.etniaCor ?? caso.perfilMulher.etniaCor),
    ultimaAtualizacao: caso.ultimaAtualizacao ?? caso.dataPrimeiroAtendimento,
    perfilMulher: {
      ...caso.perfilMulher,
      etniaCor: normalizeEthnicity(caso.perfilMulher.etniaCor ?? caso.etniaCor),
    },
    atendimentos: caso.atendimentos.map((item) => ({
      ...item,
      tiposViolencia: normalizeViolenceTypes(item.tiposViolencia ?? caso.tiposViolencia),
      observacoesInternas: item.observacoesInternas ?? null,
    })),
    solicitacoesApoio: caso.solicitacoesApoio.map((item) => ({
      ...item,
      tiposViolencia: normalizeViolenceTypes(item.tiposViolencia ?? caso.tiposViolencia),
      etniaCor: normalizeEthnicity(item.etniaCor ?? caso.etniaCor),
    })),
  };
}

function loadRecords() {
  if (!isBrowser()) return [] as DemoCaseRecord[];

  try {
    const raw = window.localStorage.getItem(DEMO_CASES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DemoCaseRecord[];
    return parsed.map((item) => ({
      ...item,
      caseData: ensureCaseShape(item.caseData),
    }));
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
  const normalized = ensureCaseShape(caso);
  return {
    id: normalized.id,
    protocolo: normalized.protocolo,
    nomeCompleto: normalized.nomeCompleto,
    nomeSocial: normalized.nomeSocial,
    cpf: normalized.cpf,
    telefone: normalized.telefone,
    endereco: normalized.endereco,
    municipio: normalized.municipio,
    situacaoRisco: normalized.situacaoRisco,
    orgaoEntrada: normalized.orgaoEntrada,
    dataPrimeiroAtendimento: normalized.dataPrimeiroAtendimento,
    observacoesIniciais: normalized.observacoesIniciais,
    status: normalized.status,
    tiposViolencia: normalized.tiposViolencia,
    etniaCor: normalized.etniaCor,
    ultimaAtualizacao: normalized.ultimaAtualizacao,
  };
}

function nextProtocol(records: DemoCaseRecord[]) {
  return `AC-${String(records.length + 1).padStart(4, "0")}`;
}

function caseStatusLabel(status: CaseStatus) {
  if (status === "em_andamento") return "Em andamento";
  if (status === "encaminhado") return "Encaminhado";
  if (status === "resolvido") return "Resolvido";
  if (status === "arquivado") return "Arquivado";
  return "Em triagem";
}

function buildInitialAttendance(ownerName: string, payload: CreateSupportRequestPayload): Attendance {
  return {
    id: `demo-att-${Date.now()}`,
    data: today(),
    profissionalResponsavel: "Equipe de acolhimento",
    orgao: "sec-mulher",
    tipoAtendimento: "Triagem inicial",
    resumo: payload.mensagem?.trim() || `Solicitação recebida para ${ownerName}.`,
    riscoIdentificado: payload.situacaoRisco,
    necessidadeEncaminhamento: false,
    proximosPassos: "Aguardar validação inicial da equipe responsável.",
    observacoesInternas: "Registro aberto em ambiente piloto para acompanhamento controlado.",
    tiposViolencia: normalizeViolenceTypes(payload.tiposViolencia),
  };
}

function buildInitialSupportRequest(payload: CreateSupportRequestPayload): SupportRequest {
  return {
    id: `demo-support-${Date.now()}`,
    tipo: payload.tipo,
    mensagem: payload.mensagem?.trim() || "Solicitação registrada pela área da mulher.",
    status: "recebido",
    data: nowIso(),
    tiposViolencia: normalizeViolenceTypes(payload.tiposViolencia),
    etniaCor: normalizeEthnicity(payload.etniaCor),
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
      summary: `Encaminhamento emitido para ${item.orgaoDestino} com prioridade ${item.prioridade}.`,
    })),
    ...caso.solicitacoesApoio.map((item) => ({
      date: item.data,
      status: caso.status,
      summary: item.mensagem || `Solicitação de ${item.tipo} registrada.`,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return entries[0] ?? { date: caso.dataPrimeiroAtendimento, status: caso.status, summary: caso.observacoesIniciais };
}

export function createDemoSupportCase(payload: CreateSupportRequestPayload) {
  const user = readSessionUser();
  if (!user) {
    throw new Error("Sessão indisponível para registrar a solicitação.");
  }

  const records = loadRecords();
  const initialAttendance = buildInitialAttendance(user.nome, payload);
  const initialSupportRequest = buildInitialSupportRequest(payload);
  const caseId = `demo-case-${Date.now()}`;

  const caseData: CaseDetail = ensureCaseShape({
    id: caseId,
    protocolo: nextProtocol(records),
    nomeCompleto: user.nome,
    nomeSocial: null,
    cpf: "Não informado",
    telefone: "(21) 90000-0000",
    endereco: "Endereço protegido durante a fase piloto",
    municipio: "Mangaratiba",
    situacaoRisco: payload.situacaoRisco,
    orgaoEntrada: "sec-mulher",
    dataPrimeiroAtendimento: today(),
    observacoesIniciais: payload.mensagem?.trim() || "Solicitação registrada na área da mulher.",
    status: "ativo",
    tiposViolencia: normalizeViolenceTypes(payload.tiposViolencia),
    etniaCor: normalizeEthnicity(payload.etniaCor),
    ultimaAtualizacao: nowIso(),
    perfilMulher: {
      id: `demo-profile-${user.id}`,
      nomeSocial: null,
      cpf: "Não informado",
      dataNascimento: today(),
      telefone: "(21) 90000-0000",
      endereco: "Endereço protegido durante a fase piloto",
      municipio: "Mangaratiba",
      uf: "RJ",
      etniaCor: normalizeEthnicity(payload.etniaCor),
    },
    atribuidaPara: "Fila de triagem",
    orgaoAtual: "sec-mulher",
    atendimentos: [initialAttendance],
    encaminhamentos: [],
    solicitacoesApoio: [initialSupportRequest],
  });

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
    throw new Error("Sessão indisponível para criar protocolo.");
  }

  const records = loadRecords();
  const createdAt = nowIso();
  const attendance: Attendance = {
    id: `demo-att-int-${Date.now()}`,
    data: today(),
    profissionalResponsavel: user.nome,
    orgao: user.orgao || "sec-mulher",
    tipoAtendimento: "Registro inicial",
    resumo: payload.observacoesIniciais,
    riscoIdentificado: payload.situacaoRisco,
    necessidadeEncaminhamento: false,
    proximosPassos: "Aguardar triagem institucional e distribuição responsável.",
    observacoesInternas: "Caso aberto manualmente em ambiente piloto assistido.",
    tiposViolencia: normalizeViolenceTypes(payload.tiposViolencia),
  };

  const caseData: CaseDetail = ensureCaseShape({
    id: `demo-case-${Date.now()}`,
    protocolo: nextProtocol(records),
    nomeCompleto: payload.nomeCompleto.trim(),
    nomeSocial: payload.nomeSocial?.trim() || null,
    cpf: payload.cpf?.trim() || "Não informado",
    telefone: payload.telefone?.trim() || "(21) 90000-0000",
    endereco: payload.endereco?.trim() || "Endereço em validação",
    municipio: payload.municipio?.trim() || "Mangaratiba",
    situacaoRisco: payload.situacaoRisco,
    orgaoEntrada: user.orgao || "sec-mulher",
    dataPrimeiroAtendimento: today(),
    observacoesIniciais: payload.observacoesIniciais.trim(),
    status: "ativo",
    tiposViolencia: normalizeViolenceTypes(payload.tiposViolencia),
    etniaCor: normalizeEthnicity(payload.etniaCor),
    ultimaAtualizacao: createdAt,
    perfilMulher: {
      id: `demo-profile-${Date.now()}`,
      nomeSocial: payload.nomeSocial?.trim() || null,
      cpf: payload.cpf?.trim() || "Não informado",
      dataNascimento: today(),
      telefone: payload.telefone?.trim() || "(21) 90000-0000",
      endereco: payload.endereco?.trim() || "Endereço em validação",
      municipio: payload.municipio?.trim() || "Mangaratiba",
      uf: payload.uf?.trim() || "RJ",
      etniaCor: normalizeEthnicity(payload.etniaCor),
    },
    atribuidaPara: user.nome,
    orgaoAtual: user.orgao || "sec-mulher",
    atendimentos: [attendance],
    encaminhamentos: [],
    solicitacoesApoio: [],
  });

  upsertRecord({
    ownerEmail: `${caseData.protocolo.toLowerCase()}@piloto.local`,
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
    profissionalResponsavel: sessionUser?.nome || "Equipe responsável",
    orgao: sessionUser?.orgao || "sec-mulher",
    tipoAtendimento: "Atualização de andamento",
    resumo: `Status atualizado para ${caseStatusLabel(status)}.`,
    riscoIdentificado: target.caseData.situacaoRisco,
    necessidadeEncaminhamento: false,
    proximosPassos: status === "resolvido" ? "Acompanhar encerramento e registrar retorno, se necessário." : "Seguir com acompanhamento ativo.",
    observacoesInternas: "Atualização registrada durante o período piloto.",
    tiposViolencia: normalizeViolenceTypes(target.caseData.tiposViolencia),
  };

  const nextRecord: DemoCaseRecord = {
    ...target,
    lastUpdatedAt: nowIso(),
    lastUpdateSummary: updateNote.resumo,
    caseData: ensureCaseShape({
      ...target.caseData,
      status,
      ultimaAtualizacao: nowIso(),
      atendimentos: [updateNote, ...target.caseData.atendimentos],
    }),
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
    profissionalResponsavel: sessionUser?.nome || "Profissional responsável",
    orgao: sessionUser?.orgao || "sec-mulher",
    tipoAtendimento: payload.tipoAtendimento,
    resumo: payload.resumo,
    riscoIdentificado: payload.riscoIdentificado,
    necessidadeEncaminhamento: payload.necessidadeEncaminhamento,
    proximosPassos: payload.proximosPassos,
    observacoesInternas: payload.observacoesInternas ?? null,
    tiposViolencia: normalizeViolenceTypes(payload.tiposViolencia ?? target.caseData.tiposViolencia),
  };

  const nextRecord: DemoCaseRecord = {
    ...target,
    lastUpdatedAt: nowIso(),
    lastUpdateSummary: attendance.resumo,
    caseData: ensureCaseShape({
      ...target.caseData,
      status: "em_andamento",
      situacaoRisco: payload.riscoIdentificado,
      tiposViolencia: normalizeViolenceTypes(payload.tiposViolencia ?? target.caseData.tiposViolencia),
      orgaoAtual: sessionUser?.orgao || target.caseData.orgaoAtual,
      ultimaAtualizacao: nowIso(),
      atendimentos: [attendance, ...target.caseData.atendimentos],
    }),
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
    caseData: ensureCaseShape({
      ...target.caseData,
      status: "encaminhado",
      orgaoAtual: organizationName,
      ultimaAtualizacao: nowIso(),
      encaminhamentos: [referral, ...target.caseData.encaminhamentos],
    }),
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

  return merged.map((item) => ({
    ...item,
    tiposViolencia: normalizeViolenceTypes(item.tiposViolencia),
    etniaCor: normalizeEthnicity(item.etniaCor),
    ultimaAtualizacao: item.ultimaAtualizacao ?? item.dataPrimeiroAtendimento,
  }));
}

export function filterCases(cases: CaseSummary[], search: string, status: string) {
  return cases.filter((item) => {
    const matchesStatus = status === "todos" ? true : item.status === status;
    const term = search.trim().toLowerCase();
    const violenceText = (item.tiposViolencia ?? []).join(" ").toLowerCase();
    const ethnicityText = (item.etniaCor ?? "").toLowerCase();
    const matchesSearch =
      !term ||
      item.nomeCompleto.toLowerCase().includes(term) ||
      (item.nomeSocial || "").toLowerCase().includes(term) ||
      item.protocolo.toLowerCase().includes(term) ||
      item.cpf.toLowerCase().includes(term) ||
      violenceText.includes(term) ||
      ethnicityText.includes(term);

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

  const byViolence = [...(remote.porViolencia ?? [])];
  demoRecords.forEach((item) => {
    normalizeViolenceTypes(item.caseData.tiposViolencia).forEach((tipo) => {
      const match = byViolence.find((entry) => entry.tipo === tipo);
      if (match) match.total += 1;
      else byViolence.push({ tipo, total: 1 });
    });
  });

  const byEthnicity = [...(remote.porEtnia ?? [])];
  demoRecords.forEach((item) => {
    const etnia = normalizeEthnicity(item.caseData.etniaCor);
    const match = byEthnicity.find((entry) => entry.etnia === etnia);
    if (match) match.total += 1;
    else byEthnicity.push({ etnia, total: 1 });
  });

  const byPeriod = [...(remote.porPeriodo ?? [])];
  demoRecords.forEach((item) => {
    const date = new Date(item.lastUpdatedAt);
    const periodo = date.toLocaleDateString("pt-BR", { month: "short", day: "2-digit" });
    const match = byPeriod.find((entry) => entry.periodo === periodo);
    if (match) match.total += 1;
    else byPeriod.push({ periodo, total: 1 });
  });

  const referralDistribution = [...(remote.distribuicaoEncaminhamentos ?? [])];
  demoRecords.forEach((item) => {
    item.caseData.encaminhamentos.forEach((referral) => {
      const match = referralDistribution.find((entry) => entry.orgao === referral.orgaoDestino);
      if (match) match.total += 1;
      else referralDistribution.push({ orgao: referral.orgaoDestino, total: 1 });
    });
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
    porViolencia: byViolence,
    porEtnia: byEthnicity,
    porPeriodo: byPeriod,
    distribuicaoEncaminhamentos: referralDistribution,
  };
}

function riskSortWeight(risk: CaseSummary["situacaoRisco"]) {
  if (risk === "critico") return 4;
  if (risk === "alto") return 3;
  if (risk === "medio") return 2;
  return 1;
}
