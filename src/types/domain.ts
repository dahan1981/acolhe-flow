export type UserProfile = "mulher" | "profissional" | "gestora";
export type RiskLevel = "baixo" | "medio" | "alto" | "critico";
export type CaseStatus = "ativo" | "em_andamento" | "encaminhado" | "resolvido" | "arquivado";
export type Priority = "baixa" | "media" | "alta" | "urgente";
export type ReferralStatus = "pendente" | "aceito" | "em_atendimento" | "concluido";

export interface SessionUser {
  id: string;
  nome: string;
  email: string;
  perfil: UserProfile;
  orgao: string | null;
  organizationId: string | null;
}

export interface Organization {
  id: string;
  nome: string;
  sigla: string;
  codigo: string;
  cor: string;
}

export interface WomanProfile {
  id: string;
  nomeSocial?: string | null;
  cpf: string;
  dataNascimento: string;
  telefone: string;
  endereco: string;
  municipio: string;
  uf: string;
}

export interface CaseSummary {
  id: string;
  protocolo: string;
  nomeCompleto: string;
  nomeSocial?: string | null;
  cpf: string;
  telefone: string;
  endereco: string;
  municipio: string;
  situacaoRisco: RiskLevel;
  orgaoEntrada: string;
  dataPrimeiroAtendimento: string;
  observacoesIniciais: string;
  status: CaseStatus;
}

export interface Attendance {
  id: string;
  data: string;
  profissionalResponsavel: string;
  orgao: string;
  tipoAtendimento: string;
  resumo: string;
  riscoIdentificado: RiskLevel;
  necessidadeEncaminhamento: boolean;
  proximosPassos?: string | null;
}

export interface Referral {
  id: string;
  data: string;
  orgaoDestino: string;
  motivo: string;
  prioridade: Priority;
  status: ReferralStatus;
}

export interface SupportRequest {
  id: string;
  tipo: string;
  mensagem?: string | null;
  status: string;
  data: string;
}

export interface CaseDetail extends CaseSummary {
  perfilMulher: WomanProfile;
  atribuidaPara?: string | null;
  orgaoAtual: string;
  atendimentos: Attendance[];
  encaminhamentos: Referral[];
  solicitacoesApoio: SupportRequest[];
}

export interface WomanDashboardResponse {
  caso: CaseDetail | null;
  atendimentosRecentes: Attendance[];
  encaminhamentosRecentes: Referral[];
  solicitacoesApoio: SupportRequest[];
}

export interface ProfessionalDashboardResponse {
  casosAtivos: number;
  atendimentosHoje: number;
  casosPrioritarios: CaseSummary[];
  ultimosAtendimentos: Array<
    Attendance & {
      caso: {
        id: string;
        protocolo: string;
        nomeCompleto: string;
        nomeSocial?: string | null;
      };
    }
  >;
}

export interface ManagerStats {
  total: number;
  ativos: number;
  emAndamento: number;
  encaminhados: number;
  resolvidos: number;
  totalAtendimentos: number;
  encaminhamentosPendentes: number;
  porOrgao: Array<{ orgao: string; sigla: string; total: number }>;
  porRisco: Array<{ nivel: string; total: number; cor: string }>;
}

export interface RegisterWomanPayload {
  nomeCompleto: string;
  nomeSocial?: string;
  email: string;
  password: string;
  cpf: string;
  dataNascimento: string;
  telefone: string;
  endereco: string;
  municipio: string;
  uf: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  perfil?: UserProfile;
}

export interface CreateAttendancePayload {
  caseId: string;
  tipoAtendimento: string;
  resumo: string;
  riscoIdentificado: RiskLevel;
  necessidadeEncaminhamento: boolean;
  proximosPassos?: string;
}

export interface CreateReferralPayload {
  caseId: string;
  atendimentoId?: string;
  orgaoDestinoId: string;
  motivo: string;
  prioridade: Priority;
}

export interface CreateSupportRequestPayload {
  tipo: string;
  mensagem?: string;
  situacaoRisco: RiskLevel;
}

export interface CreateInternalUserPayload {
  nomeCompleto: string;
  email: string;
  password: string;
  perfil: Extract<UserProfile, "profissional" | "gestora">;
  organizationId: string;
  cargo?: string;
  especialidades?: string;
}
