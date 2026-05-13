export type UserProfile = "mulher" | "profissional" | "gestora";
export type RiskLevel = "baixo" | "medio" | "alto" | "critico";
export type CaseStatus = "ativo" | "em_andamento" | "encaminhado" | "resolvido" | "arquivado";
export type Priority = "baixa" | "media" | "alta" | "urgente";
export type ReferralStatus = "pendente" | "aceito" | "em_atendimento" | "concluido";
export type ViolenceType =
  | "violencia_patrimonial"
  | "violencia_sexual"
  | "violencia_fisica"
  | "violencia_moral"
  | "violencia_psicologica";
export type Ethnicity =
  | "branca"
  | "preta"
  | "parda"
  | "amarela"
  | "indigena"
  | "nao_informada";
export type ChatStatus = "aguardando_assuncao" | "em_atendimento" | "encerrado";

export interface SessionUser {
  id: string;
  nome: string;
  email: string;
  avatarUrl?: string | null;
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
  etniaCor?: Ethnicity;
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
  orgaoAtual?: string | null;
  dataPrimeiroAtendimento: string;
  observacoesIniciais: string;
  status: CaseStatus;
  tiposViolencia?: ViolenceType[];
  etniaCor?: Ethnicity;
  ultimaAtualizacao?: string;
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
  observacoesInternas?: string | null;
  tiposViolencia?: ViolenceType[];
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
  tiposViolencia?: ViolenceType[];
  etniaCor?: Ethnicity;
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
  porViolencia?: Array<{ tipo: ViolenceType; total: number }>;
  porEtnia?: Array<{ etnia: Ethnicity; total: number }>;
  porPeriodo?: Array<{ periodo: string; total: number }>;
  distribuicaoEncaminhamentos?: Array<{ orgao: string; total: number }>;
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

export interface ProfileResponse {
  user: SessionUser;
  womanProfile?: WomanProfile | null;
  pendingContactChanges?: PendingContactChange[];
}

export interface UpdateProfilePayload {
  email: string;
  telefone?: string;
  novaSenha?: string;
}

export interface PendingContactChange {
  id: string;
  tipo: "email" | "telefone";
  destinoMascarado: string;
  expiraEm: string;
}

export interface ContactChangeRequestPayload {
  tipo: "email" | "telefone";
  valor: string;
}

export interface ContactChangeRequestResponse {
  pendingChange: PendingContactChange;
  previewCode?: string;
}

export interface ConfirmContactChangePayload {
  tipo: "email" | "telefone";
  codigo: string;
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
  observacoesInternas?: string;
  tiposViolencia?: ViolenceType[];
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
  tiposViolencia?: ViolenceType[];
  etniaCor?: Ethnicity;
}

export interface CreateCasePayload {
  nomeCompleto: string;
  nomeSocial?: string;
  cpf: string;
  dataNascimento: string;
  telefone: string;
  endereco: string;
  municipio: string;
  uf: string;
  observacoesIniciais: string;
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

export interface ChatMessage {
  id: string;
  senderProfile: UserProfile | "sistema";
  senderName: string;
  body: string;
  createdAt: string;
}

export interface ChatTicket {
  id: string;
  caseId?: string | null;
  ownerUserId: string;
  ownerEmail: string;
  ownerName: string;
  protocolo?: string | null;
  channel: string;
  status: ChatStatus;
  queue: "assistencia_social";
  assunto: string;
  context: string;
  assignedProfessionalName?: string | null;
  assignedProfessionalUserId?: string | null;
  createdAt: string;
  updatedAt: string;
  unreadForWoman: number;
  unreadForTeam: number;
  messages: ChatMessage[];
}

export interface AuditLogItem {
  id: string;
  acao: string;
  entidade: string;
  entidadeId?: string | null;
  data: string;
}

export interface UserNotificationItem {
  id: string;
  titulo: string;
  descricao: string;
  tipo: "info" | "success" | "alert";
  acao: string;
  entidade?: string | null;
  entidadeId?: string | null;
  lida: boolean;
  data: string;
}
