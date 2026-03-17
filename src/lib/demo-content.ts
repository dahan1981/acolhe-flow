import type { Organization, UserProfile } from "@/types/domain";

export type DemoNotification = {
  id: string;
  title: string;
  description: string;
  time: string;
  kind: "info" | "alert" | "success";
  read: boolean;
};

export type DemoArticle = {
  id: string;
  category: string;
  title: string;
  description: string;
};

export type DemoSection = {
  title: string;
  body: string;
};

export const roleDescriptions: Record<UserProfile, string> = {
  mulher: "Ambiente de acolhimento em fase piloto, com acompanhamento do caso, orientacoes essenciais e atualizacoes da rede autorizada.",
  profissional: "Area operacional para triagem, registro de atendimentos e articulacao de encaminhamentos durante a implantacao assistida.",
  gestora: "Area de monitoramento para acompanhar indicadores, validar fluxos e coordenar a operacao em periodo de testes controlados.",
};

export const notificationsByRole: Record<UserProfile, DemoNotification[]> = {
  mulher: [
    { id: "n1", title: "Atualizacao no acompanhamento", description: "Sua solicitacao recebeu novo registro de andamento pela equipe responsavel.", time: "Hoje, 09:20", kind: "info", read: false },
    { id: "n2", title: "Encaminhamento em analise", description: "O apoio juridico solicitado foi direcionado para a etapa de validacao interna.", time: "Ontem, 16:45", kind: "success", read: false },
    { id: "n3", title: "Revisao de seguranca", description: "Mantenha seus dados de contato atualizados e revise os canais de apoio imediato.", time: "Ontem, 08:10", kind: "alert", read: true },
  ],
  profissional: [
    { id: "n4", title: "Caso prioritario atualizado", description: "Um caso de risco alto recebeu nova movimentacao e exige leitura da equipe responsavel.", time: "Hoje, 10:05", kind: "alert", read: false },
    { id: "n5", title: "Resumo operacional disponivel", description: "O consolidado de atendimentos do turno foi atualizado para consulta.", time: "Hoje, 08:00", kind: "info", read: true },
    { id: "n6", title: "Registro sincronizado", description: "O ultimo atendimento foi incorporado ao historico compartilhado do caso.", time: "Ontem, 17:20", kind: "success", read: true },
  ],
  gestora: [
    { id: "n7", title: "Solicitacao de acesso pendente", description: "Ha um cadastro interno aguardando validacao da gestao.", time: "Hoje, 09:40", kind: "alert", read: false },
    { id: "n8", title: "Indicadores atualizados", description: "Os paines de volume, risco e distribuicao por orgao foram recalculados.", time: "Hoje, 07:55", kind: "info", read: true },
    { id: "n9", title: "Revisao de governanca concluida", description: "Os registros de permissao e acompanhamento foram consolidados nesta semana.", time: "Ontem, 15:30", kind: "success", read: true },
  ],
};

export const helpArticlesByRole: Record<UserProfile, DemoArticle[]> = {
  mulher: [
    { id: "a1", category: "Primeiros passos", title: "Como registrar uma solicitacao com clareza", description: "Use uma descricao objetiva do que aconteceu, informe seus canais de contato e acompanhe o status pelo painel." },
    { id: "a2", category: "Seguranca", title: "Quando usar os canais de emergencia", description: "Em risco imediato, priorize os canais emergenciais. O sistema serve para acompanhamento e organizacao do suporte." },
    { id: "a3", category: "Acompanhamento", title: "Como ler os status do caso", description: "Cada etapa mostra se sua solicitacao foi recebida, esta em andamento, foi encaminhada ou concluida." },
  ],
  profissional: [
    { id: "a4", category: "Operacao", title: "Boas praticas para registrar atendimento", description: "Documente o contexto, a avaliacao de risco e os proximos passos com linguagem objetiva e institucional." },
    { id: "a5", category: "Fluxo", title: "Quando criar um encaminhamento", description: "Utilize encaminhamentos para articular a rede, sempre justificando motivo e prioridade." },
    { id: "a6", category: "Acesso", title: "Como navegar pelas permissoes do perfil", description: "A area de permissoes resume o que esta liberado no seu ambiente e ajuda a evitar acessos indevidos." },
  ],
  gestora: [
    { id: "a7", category: "Administracao", title: "Como estruturar acessos internos", description: "Cadastre perfis com escopo claro, associe orgaos e revise periodicamente a distribuicao de acessos." },
    { id: "a8", category: "Indicadores", title: "Como interpretar o painel gerencial", description: "Observe volume, risco, tempos e distribuicao por orgao para identificar gargalos e prioridades." },
    { id: "a9", category: "Implantacao", title: "Como acompanhar a fase piloto", description: "Use os paineis para monitorar volume, distribuicao de casos e aderencia da equipe aos fluxos definidos." },
  ],
};

export const institutionalContent: Record<
  "ajuda" | "sobre" | "permissoes" | "seguranca" | "notificacoes",
  DemoSection[]
> = {
  ajuda: [
    { title: "Central de apoio", body: "Esta area concentra orientacoes objetivas para uso do sistema em fase piloto, organizadas por perfil e por momento da jornada. O objetivo e facilitar a navegacao sem sobrecarregar a experiencia de quem precisa agir rapido." },
    { title: "Fluxos guiados", body: "Os conteudos desta central orientam tarefas frequentes, esclarecem etapas e reduzem duvidas comuns no uso cotidiano da plataforma em operacao assistida." },
  ],
  sobre: [
    { title: "Visao do sistema", body: "O sistema foi concebido para reunir acolhimento, acompanhamento e gestao em uma experiencia unica. Nesta fase piloto, a interface prioriza organizacao, confianca e clareza institucional." },
    { title: "Proposta de valor", body: "A plataforma busca reduzir fragmentacao entre atendimentos, melhorar a rastreabilidade do fluxo e ampliar a percepcao de continuidade entre os atores da rede." },
  ],
  permissoes: [
    { title: "Controle por perfil", body: "Cada perfil visualiza apenas os recursos relacionados ao seu contexto de atuacao. Essa organizacao melhora a legibilidade do sistema e reforca a separacao entre acolhimento, operacao e gestao." },
    { title: "Escopos claros", body: "Os acessos desta fase piloto foram organizados para traduzir responsabilidade operacional e administrativa de forma simples, com rotas e ambientes dedicados para cada equipe." },
  ],
  seguranca: [
    { title: "Confianca de uso", body: "A camada de seguranca privilegia previsibilidade de navegacao, clareza de contexto e separacao entre perfis, sustentando o uso monitorado da plataforma durante a implantacao inicial." },
    { title: "Protecao de jornada", body: "A experiencia visual reforca o cuidado com dados, o acompanhamento das etapas e a percepcao de produto maduro, sem depender de linguagem excessivamente tecnica." },
  ],
  notificacoes: [
    { title: "Atualizacoes relevantes", body: "As notificacoes destacam apenas eventos com impacto no acompanhamento da jornada, evitando ruido e ajudando cada perfil a perceber o que mudou, quando mudou e o que precisa ser feito." },
    { title: "Leitura orientada", body: "As mensagens foram estruturadas para leitura rapida, com contexto curto, horarios visiveis e prioridade clara durante o periodo de uso controlado." },
  ],
};

export const teamMembers = [
  { id: "t1", name: "Carla Mendes", role: "Profissional", org: "Secretaria da Mulher", status: "Ativa", focus: "Acolhimento inicial e articulacao de rede" },
  { id: "t2", name: "Helena Bastos", role: "Gestora", org: "Secretaria da Mulher", status: "Ativa", focus: "Governanca e indicadores" },
  { id: "t3", name: "Lucia Ramos", role: "Profissional", org: "CREAS", status: "Em revisao", focus: "Acompanhamento socioassistencial" },
  { id: "t4", name: "Marcia Tavares", role: "Profissional", org: "Delegacia da Mulher", status: "Ativa", focus: "Registro e articulacao protetiva" },
];

export const adminHighlights = [
  { label: "Contas internas ativas", value: "18", description: "Profissionais e gestoras com acesso institucional validado." },
  { label: "Solicitacoes pendentes", value: "03", description: "Aguardando aprovacao ou complemento de informacoes." },
  { label: "Perfis revisados", value: "92%", description: "Cadastros avaliados nas ultimas quatro semanas." },
];

export const adminAccessChecklist = [
  "Associar cada conta a um orgao de referencia",
  "Definir escopo do perfil antes da liberacao",
  "Revisar acessos inativos periodicamente",
  "Registrar observacoes internas para auditoria",
];

export function notificationToneClass(kind: DemoNotification["kind"]) {
  if (kind === "alert") return "border-warning/30 bg-warning/10";
  if (kind === "success") return "border-accent/30 bg-accent/10";
  return "border-primary/20 bg-primary/10";
}

export function roleAccent(profile: UserProfile) {
  if (profile === "mulher") return "from-rose-500/15 via-primary/10 to-accent/15";
  if (profile === "profissional") return "from-primary/20 via-sky-500/10 to-accent/20";
  return "from-slate-900/10 via-primary/10 to-warning/15";
}

export function organizationOptionsLabel(organization: Organization) {
  return `${organization.nome} (${organization.sigla})`;
}
