import type { AuditLogItem, UserNotificationItem } from "@/types/domain";

export type AuditNotificationItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  kind: "info" | "success" | "alert";
  read: boolean;
};

export function mapAuditToNotification(log: AuditLogItem): AuditNotificationItem {
  const time = new Date(log.data).toLocaleString("pt-BR");

  const map: Record<string, Omit<AuditNotificationItem, "id" | "time">> = {
    "auth.login": {
      title: "Login realizado",
      description: "Sua conta entrou no sistema com autenticação local.",
      kind: "info",
      read: true,
    },
    "auth.supabase-login": {
      title: "Login validado pelo Supabase",
      description: "Sua sessão foi autenticada e vinculada ao ambiente Athena.",
      kind: "info",
      read: true,
    },
    "profile.updated": {
      title: "Perfil atualizado",
      description: "As informações principais da sua conta foram salvas.",
      kind: "success",
      read: false,
    },
    "profile.avatar.updated": {
      title: "Foto de perfil atualizada",
      description: "A nova imagem da conta foi enviada com sucesso.",
      kind: "success",
      read: false,
    },
    "profile.contact_change.requested": {
      title: "Código de confirmação gerado",
      description: "Uma alteração de contato foi iniciada e aguarda a validação do código.",
      kind: "alert",
      read: false,
    },
    "profile.contact_change.failed": {
      title: "Falha na confirmação do código",
      description: "Houve tentativas inválidas de confirmar a troca de contato.",
      kind: "alert",
      read: false,
    },
    "profile.contact_change.confirmed": {
      title: "Contato confirmado",
      description: "A alteração de e-mail ou celular foi validada e aplicada na conta.",
      kind: "success",
      read: false,
    },
    "woman.help-request.created": {
      title: "Solicitação de apoio enviada",
      description: "A rede recebeu seu pedido e registrou a ocorrência para acompanhamento.",
      kind: "success",
      read: false,
    },
    "chat.created": {
      title: "Chat iniciado",
      description: "Um novo canal de atendimento foi aberto com a equipe.",
      kind: "success",
      read: false,
    },
    "chat.assumed": {
      title: "Chat assumido pela equipe",
      description: "Uma conta interna assumiu o atendimento deste chamado.",
      kind: "success",
      read: false,
    },
    "chat.closed": {
      title: "Chat encerrado",
      description: "O atendimento foi finalizado e arquivado no histórico.",
      kind: "info",
      read: true,
    },
    "case.created": {
      title: "Caso criado",
      description: "Um novo protocolo foi aberto no sistema.",
      kind: "success",
      read: false,
    },
    "case.status.updated": {
      title: "Status do caso alterado",
      description: "O acompanhamento mudou de etapa dentro do fluxo institucional.",
      kind: "alert",
      read: false,
    },
    "attendance.created": {
      title: "Atendimento registrado",
      description: "Um novo atendimento foi salvo no histórico do caso.",
      kind: "success",
      read: false,
    },
    "referral.created": {
      title: "Encaminhamento registrado",
      description: "O caso foi encaminhado para outro órgão da rede.",
      kind: "alert",
      read: false,
    },
    "internal-user.created": {
      title: "Conta interna criada",
      description: "Uma nova conta institucional foi criada para operação do ambiente.",
      kind: "success",
      read: false,
    },
  };

  const entry = map[log.acao] ?? {
    title: "Evento registrado",
    description: "Uma nova ação foi registrada no histórico da sua conta.",
    kind: "info" as const,
    read: true,
  };

  return {
    id: log.id,
    time,
    ...entry,
  };
}

export function mapUserNotificationToNotification(notification: UserNotificationItem): AuditNotificationItem {
  return {
    id: notification.id,
    title: notification.titulo,
    description: notification.descricao,
    time: new Date(notification.data).toLocaleString("pt-BR"),
    kind: notification.tipo,
    read: notification.lida,
  };
}
