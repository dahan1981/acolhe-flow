import {
  CaseStatus,
  ChatTicketStatus,
  Priority,
  ReferralStatus,
  RiskLevel,
  Role,
  type Attendance,
  type AuditLog,
  type CaseRecord,
  type ChatMessage,
  type ChatTicket,
  type Organization,
  type UserNotification,
  type Referral,
  type SupportRequest,
  type User,
  type WomanProfile,
} from "@prisma/client";

export function toRoleLabel(role: Role) {
  switch (role) {
    case Role.MULHER:
      return "mulher";
    case Role.PROFISSIONAL:
      return "profissional";
    case Role.GESTORA:
      return "gestora";
  }
}

export function toRiskLabel(riskLevel: RiskLevel) {
  return riskLevel.toLowerCase();
}

export function toCaseStatusLabel(status: CaseStatus) {
  return status.toLowerCase();
}

export function toPriorityLabel(priority: Priority) {
  return priority.toLowerCase();
}

export function toReferralStatusLabel(status: ReferralStatus) {
  return status.toLowerCase();
}

export function toChatTicketStatusLabel(status: ChatTicketStatus) {
  return status.toLowerCase();
}

export function serializeOrganization(organization: Organization) {
  return {
    id: organization.id,
    nome: organization.name,
    sigla: organization.code.toUpperCase(),
    codigo: organization.code,
    cor: organization.color,
  };
}

export function serializeSessionUser(
  user: User & {
    organization: Organization | null;
  },
) {
  return {
    id: user.id,
    nome: user.fullName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    perfil: toRoleLabel(user.role),
    orgao: user.organization?.code ?? null,
    organizationId: user.organizationId ?? null,
  };
}

export function serializeWomanProfile(profile: WomanProfile) {
  return {
    id: profile.id,
    nomeSocial: profile.socialName,
    cpf: profile.cpf,
    dataNascimento: profile.birthDate.toISOString().slice(0, 10),
    telefone: profile.phone,
    endereco: profile.addressLine,
    municipio: profile.city,
    uf: profile.state,
  };
}

export function serializeCaseSummary(
  caseRecord: CaseRecord & {
    womanProfile: WomanProfile & { user: User };
    entryOrganization: Organization;
  },
) {
  return {
    id: caseRecord.id,
    protocolo: caseRecord.protocol,
    nomeCompleto: caseRecord.womanProfile.user.fullName,
    nomeSocial: caseRecord.womanProfile.socialName,
    cpf: caseRecord.womanProfile.cpf,
    telefone: caseRecord.womanProfile.phone,
    endereco: caseRecord.womanProfile.addressLine,
    municipio: caseRecord.womanProfile.city,
    situacaoRisco: toRiskLabel(caseRecord.riskLevel),
    orgaoEntrada: caseRecord.entryOrganization.code,
    dataPrimeiroAtendimento: caseRecord.createdAt.toISOString().slice(0, 10),
    observacoesIniciais: caseRecord.intakeSummary,
    status: toCaseStatusLabel(caseRecord.status),
  };
}

export function serializeAttendance(
  attendance: Attendance & {
    professionalUser: User;
    organization: Organization;
  },
) {
  return {
    id: attendance.id,
    data: attendance.occurredAt.toISOString().slice(0, 10),
    profissionalResponsavel: attendance.professionalUser.fullName,
    orgao: attendance.organization.code,
    tipoAtendimento: attendance.attendanceType,
    resumo: attendance.summary,
    riscoIdentificado: toRiskLabel(attendance.riskLevel),
    necessidadeEncaminhamento: attendance.needsReferral,
    proximosPassos: attendance.nextSteps,
  };
}

export function serializeReferral(
  referral: Referral & {
    targetOrganization: Organization;
  },
) {
  return {
    id: referral.id,
    data: referral.createdAt.toISOString().slice(0, 10),
    orgaoDestino: referral.targetOrganization.code,
    motivo: referral.reason,
    prioridade: toPriorityLabel(referral.priority),
    status: toReferralStatusLabel(referral.status),
  };
}

export function serializeSupportRequest(request: SupportRequest) {
  return {
    id: request.id,
    tipo: request.kind,
    mensagem: request.message,
    status: request.status,
    data: request.createdAt.toISOString(),
  };
}

export function serializeAuditLog(log: AuditLog) {
  return {
    id: log.id,
    acao: log.action,
    entidade: log.entityType,
    entidadeId: log.entityId,
    data: log.createdAt.toISOString(),
  };
}

export function serializeUserNotification(notification: UserNotification) {
  return {
    id: notification.id,
    titulo: notification.title,
    descricao: notification.description,
    tipo: notification.kind.toLowerCase(),
    acao: notification.action,
    entidade: notification.entityType,
    entidadeId: notification.entityId,
    lida: Boolean(notification.readAt),
    data: notification.createdAt.toISOString(),
  };
}

export function serializeChatMessage(message: ChatMessage & { senderUser: User | null }) {
  return {
    id: message.id,
    senderProfile: message.isSystem ? "sistema" : message.senderUser ? toRoleLabel(message.senderUser.role) : "sistema",
    senderName: message.senderName,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
  };
}

export function serializeChatTicket(
  ticket: ChatTicket & {
    ownerUser: User;
    assignedProfessionalUser: User | null;
    caseRecord: (CaseRecord & {
      womanProfile: WomanProfile & { user: User };
    }) | null;
    messages: Array<ChatMessage & { senderUser: User | null }>;
  },
) {
  return {
    id: ticket.id,
    caseId: ticket.caseId,
    ownerUserId: ticket.ownerUserId,
    ownerEmail: ticket.ownerUser.email,
    ownerName: ticket.caseRecord?.womanProfile.socialName || ticket.ownerUser.fullName,
    protocolo: ticket.caseRecord?.protocol ?? null,
    channel: ticket.channel,
    status: toChatTicketStatusLabel(ticket.status),
    queue: ticket.queue,
    assunto: ticket.subject,
    context: ticket.context,
    assignedProfessionalName: ticket.assignedProfessionalUser?.fullName ?? null,
    assignedProfessionalUserId: ticket.assignedProfessionalUserId,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    unreadForWoman: ticket.unreadForWoman,
    unreadForTeam: ticket.unreadForTeam,
    messages: ticket.messages.map(serializeChatMessage),
  };
}
