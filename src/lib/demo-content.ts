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
  content: string[];
};

export type DemoSection = {
  title: string;
  body: string;
};

export const roleDescriptions: Record<UserProfile, string> = {
  mulher: "Ambiente de acolhimento para acompanhamento do caso, acesso a orientações essenciais e leitura segura das atualizações da rede autorizada.",
  profissional: "Área operacional para triagem, registro de atendimentos e articulação de encaminhamentos com continuidade entre equipes e histórico do caso.",
  gestora: "Área de monitoramento para acompanhar indicadores, validar fluxos e coordenar a operação institucional com visão consolidada da plataforma.",
};

export const notificationsByRole: Record<UserProfile, DemoNotification[]> = {
  mulher: [
    { id: "n1", title: "Atualização no acompanhamento", description: "Sua solicitação recebeu novo registro de andamento pela equipe responsável.", time: "Hoje, 09:20", kind: "info", read: false },
    { id: "n2", title: "Encaminhamento em análise", description: "O apoio jurídico solicitado foi direcionado para a etapa de validação interna.", time: "Ontem, 16:45", kind: "success", read: false },
    { id: "n3", title: "Revisão de segurança", description: "Mantenha seus dados de contato atualizados e revise os canais de apoio imediato.", time: "Ontem, 08:10", kind: "alert", read: true },
  ],
  profissional: [
    { id: "n4", title: "Caso prioritário atualizado", description: "Um caso de risco alto recebeu nova movimentação e exige leitura da equipe responsável.", time: "Hoje, 10:05", kind: "alert", read: false },
    { id: "n5", title: "Resumo operacional disponível", description: "O consolidado de atendimentos do turno foi atualizado para consulta.", time: "Hoje, 08:00", kind: "info", read: true },
    { id: "n6", title: "Registro sincronizado", description: "O último atendimento foi incorporado ao histórico compartilhado do caso.", time: "Ontem, 17:20", kind: "success", read: true },
  ],
  gestora: [
    { id: "n7", title: "Solicitação de acesso pendente", description: "Há um cadastro interno aguardando validação da gestão.", time: "Hoje, 09:40", kind: "alert", read: false },
    { id: "n8", title: "Indicadores atualizados", description: "Os painéis de volume, risco e distribuição por órgão foram recalculados.", time: "Hoje, 07:55", kind: "info", read: true },
    { id: "n9", title: "Revisão de governança concluída", description: "Os registros de permissão e acompanhamento foram consolidados nesta semana.", time: "Ontem, 15:30", kind: "success", read: true },
  ],
};

export const helpArticlesByRole: Record<UserProfile, DemoArticle[]> = {
  mulher: [
    {
      id: "a1",
      category: "Primeiros passos",
      title: "Como registrar uma solicitação com informações essenciais",
      description:
        "Descreva o ocorrido com objetividade, mantenha seus canais de contato atualizados e acompanhe o andamento pelo painel da conta.",
      content: [
        "Sua segurança é a prioridade absoluta da rede Athena. O processo inicial de registro de ajuda foi idealizado para ser o mais breve e seguro possível.",
        "Para iniciar, procure o botão de 'Nova Solicitação' em seu painel principal. Ao ser perguntada sobre o que aconteceu, busque descrever a situação de forma direta. O nível de detalhes depende exclusivamente de quão à vontade você está para registrar essas informações agora.",
        "Lembre-se sempre de conferir e atualizar o número de telefone de contato logo abaixo do formulário. Nós dependemos dessa informação para priorizar sua emergência e alocar as forças mais próximas."
      ],
    },
    {
      id: "a2",
      category: "Segurança",
      title: "Quando priorizar a rede de emergência",
      description:
        "Em situações de risco imediato, acione os canais emergenciais. A plataforma apoia o registro, o acompanhamento e a organização do atendimento posterior.",
      content: [
        "A plataforma digital Athena é desenhada como uma central de orquestração de rede, ou seja, servem para orientar as etapas legais e documentais de forma estruturada.",
        "Apesar da criptografia e comunicação com o Estado, em cenários de risco Imediato (presença do agressor ou escalada de risco à vida), o 190 (Polícia Militar Central) é a via recomendada imperativa.",
        "Após garantir sua segurança imediata com patrulha, volte à plataforma para formalizar seu pedido perante as assistentes, vinculando os atendimentos legais que venham na sequência das tratativas da PM."
      ],
    },
    {
      id: "a3",
      category: "Acompanhamento",
      title: "Como interpretar o status do caso",
      description:
        "Os status indicam se a solicitação foi recebida, está em acompanhamento, foi encaminhada para outro órgão da rede ou teve a etapa concluída.",
      content: [
        "Seu protocolo passa por várias chancelas organizacionais de segurança desde o momento que você o cria até o desfecho formal.",
        "Na fase de TRIAGEM, os dados foram gravados de forma segura e nosso núcleo interno (CREAS ou Casa Abrigo) está se designando como analista ponta a ponta deste serviço.",
        "Em ACOMPANHAMENTO, você provavelmente já terá as sessões agendadas com os devidos especialistas e sua linha do tempo no aplicativo mostrará as atualizações constantes publicadas pela Assistente de Caso alocada a você.",
        "Se o status mudar para TRANSFERÊNCIA ou ATUANDO EM REDE, significa que o nosso protocolo exigiu envolver outros parceiros formais de seguridade, mas nós da origem continuamos monitorando e responsáveis pelas integrações e relatórios."
      ],
    },
  ],
  profissional: [
    {
      id: "a4",
      category: "Operação",
      title: "Boas práticas para registrar um atendimento",
      description:
        "Formalize contexto, avaliação de risco, providências adotadas e próximos passos com linguagem objetiva, consistente e adequada ao histórico institucional do caso.",
      content: [
        "Como assistentes, atuamos na proteção diária e na consistência das informações jurídicas, que formam a espinha dorsal de todo o acompanhamento interinstitucional Athena.",
        "Evite laudos subjetivos que descrevam achismos do momento. Foque estritamente em registrar descrições literais do ambiente avaliado e da integridade da assistida, para não contaminar evidências posteriores.",
        "Sempre determine claramente um grau avaliativo de risco (Baixo, Médio, Elevado) porque é esta flag de metadado que determina a ordenação das filas nos dashboards de Secretarias da Mulher Integradas. Sem esta precisão, fluxórias inteiras param."
      ],
    },
    {
      id: "a5",
      category: "Fluxo",
      title: "Quando abrir um encaminhamento na rede",
      description:
        "Utilize encaminhamentos quando houver necessidade de acionar outro serviço ou órgão, sempre registrando motivo, prioridade e expectativa de continuidade.",
      content: [
        "Nenhum caso complexo é resolvido isoladamente. Portanto, a regra é compartilhar o fardo com os órgãos especializados e acionar alçadas conforme manual municipal orientador.",
        "Sempre registre na ficha de encaminhamento exatamente qual 'Expectativa' motiva a criação: Você deseja uma resposta jurídica de uma promotoria? Uma vaga de abrigo pela secretaria?",
        "O encaminhamento nunca retira o histórico do seu colo (dono original), apenas distribui pendências visuais para os colegas do ecossistema atuarem unificadamente no mesmo id de cidadã."
      ],
    },
    {
      id: "a6",
      category: "Acesso",
      title: "Como consultar o escopo do seu perfil",
      description:
        "A área de permissões resume os recursos liberados para sua conta e ajuda a manter o uso aderente ao papel institucional definido para a equipe.",
      content: [
        "A proteção de dados na rede Athena é o coração da operação baseada na nuvem. Você pode verificar nos ajustes da sua conta quais tabelas de privilégios estão vinculadas a você temporalmente.",
        "Qualquer visualização ou gravação gerará um carimbo criptografado de quem executou a alteração que é permanentemente monitorado via trilha de auditoria pela Gestora Central."
      ],
    },
  ],
  gestora: [
    {
      id: "a7",
      category: "Administração",
      title: "Como estruturar acessos internos com governança",
      description:
        "Associe cada conta a um órgão, defina escopo compatível com a função exercida e mantenha revisões periódicas de acesso para sustentar a operação institucional.",
      content: [
        "A função basilar da Gestão é orquestrar uma orla contornada de segurança nas contas interdepartamentais que estão logando em seu ambiente hospedado Athena.",
        "O processo mais vital é a Auditoria de Revogação de Credenciais de assistentes desativadas no município, garantindo o imediato desligamento de perfis inoperantes da base e redirecionando as titularidades ativas de protocolo."
      ],
    },
    {
      id: "a8",
      category: "Indicadores",
      title: "Como ler o painel gerencial com foco operacional",
      description:
        "Observe volume, risco, distribuição por órgão, tempos e concentração de atendimentos para identificar gargalos e orientar decisões da implantação.",
      content: [
        "Em vez de apenas extrair relatórios ao longo dos ciclos finais do processo administrativo analise a topologia atual da rede na página de Relatórios periodicamente.",
        "A distribuição de casos ativos entre Creas, Cras e Casa da Mulher é indicativa da eficácia de transferência nos nós setoriais. Taxas altas indicam represamento interinstitucional urgente."
      ],
    },
    {
      id: "a9",
      category: "Implantação",
      title: "Como acompanhar a operação inicial com consistência",
      description:
        "Use os painéis e registros para monitorar aderência aos fluxos, distribuição da carga entre equipes e estabilidade dos atendimentos em operação controlada.",
      content: [
        "Na etapa de Shadow Launching que estamos operando o fator determinante do sucesso não é escalonar acesso a múltiplas prefeituras, e sim acompanhar ativamente os primeiros testes orgânicos executados.",
        "Refine o treinamento dos operadores locais a cada nova etapa validada utilizando a arquitetura de simulações integradas ou consultando a equipe Cloud Athena via requisição oficial."
      ],
    },
  ],
};

export const institutionalContent: Record<
  "ajuda" | "sobre" | "permissoes" | "seguranca" | "notificacoes",
  DemoSection[]
> = {
  ajuda: [
    {
      title: "Central de apoio",
      body:
        "Esta área reúne orientações essenciais para o uso seguro e consistente da plataforma durante a implantação assistida. O conteúdo foi organizado para apoiar decisões rápidas, reduzir dúvidas operacionais e manter a leitura do fluxo clara para cada perfil autorizado.",
    },
    {
      title: "Fluxos guiados",
      body:
        "As orientações desta central acompanham as etapas mais frequentes da jornada, desde o registro inicial até o acompanhamento de status, atendimentos e encaminhamentos. A proposta é apoiar o uso cotidiano sem depender de instruções externas ou interpretações ambíguas.",
    },
  ],
  sobre: [
    {
      title: "Visão do sistema",
      body:
        "A plataforma foi estruturada para integrar acolhimento, acompanhamento e gestão em um mesmo ambiente de trabalho. Nesta etapa de implantação, o sistema prioriza clareza institucional, continuidade do fluxo e leitura objetiva das informações registradas.",
    },
    {
      title: "Proposta de operação",
      body:
        "O objetivo é reduzir a fragmentação entre atendimentos, ampliar a rastreabilidade do caso e fortalecer a coordenação entre equipes e órgãos da rede. O ambiente atual representa uma operação em uso assistido, com evolução orientada por validação prática.",
    },
  ],
  permissoes: [
    {
      title: "Controle por perfil",
      body:
        "Cada perfil acessa apenas os recursos compatíveis com seu contexto de atuação. Essa organização reforça a separação entre acolhimento, operação e gestão, reduz ambiguidades na navegação e contribui para um uso mais seguro do ambiente.",
    },
    {
      title: "Escopos de acesso",
      body:
        "Os acessos disponíveis nesta etapa foram estruturados para refletir responsabilidades reais da equipe e preservar a leitura adequada de cada fluxo. A distribuição por perfil ajuda a manter coerência entre papel institucional e ação executada.",
    },
  ],
  seguranca: [
    {
      title: "Confiança de uso",
      body:
        "A experiência foi desenhada para preservar clareza de contexto, separação entre perfis e previsibilidade de navegação. Esses elementos sustentam o uso monitorado da plataforma e apoiam a leitura correta de cada etapa do atendimento.",
    },
    {
      title: "Proteção da jornada",
      body:
        "O ambiente reforça cuidado com informações sensíveis, continuidade entre registros e leitura objetiva das ações executadas. A proposta é oferecer uma experiência confiável, discreta e institucional, adequada a um sistema em validação assistida.",
    },
  ],
  notificacoes: [
    {
      title: "Atualizações relevantes",
      body:
        "As notificações destacam apenas eventos que alteram o acompanhamento do caso, a fila operacional ou a leitura gerencial do sistema. O objetivo é reduzir ruído e facilitar a percepção imediata do que mudou e do que exige providência.",
    },
    {
      title: "Leitura orientada",
      body:
        "As mensagens foram estruturadas para leitura rápida, com contexto suficiente, horários visíveis e prioridade reconhecível. Esse desenho ajuda cada perfil a agir com mais segurança e menos retrabalho no uso cotidiano.",
    },
  ],
};

export const teamMembers = [
  { id: "t1", name: "Carla Mendes", role: "Profissional", org: "Secretaria da Mulher", status: "Ativa", focus: "Acolhimento inicial e articulação de rede" },
  { id: "t2", name: "Helena Bastos", role: "Gestora", org: "Secretaria da Mulher", status: "Ativa", focus: "Governança e indicadores" },
  { id: "t3", name: "Lucia Ramos", role: "Profissional", org: "CREAS", status: "Em revisão", focus: "Acompanhamento socioassistencial" },
  { id: "t4", name: "Marcia Tavares", role: "Profissional", org: "Delegacia da Mulher", status: "Ativa", focus: "Registro e articulação protetiva" },
];

export const adminHighlights = [
  { label: "Contas internas ativas", value: "18", description: "Profissionais e gestoras com acesso institucional validado." },
  { label: "Solicitações pendentes", value: "03", description: "Aguardando aprovação ou complemento de informações." },
  { label: "Perfis revisados", value: "92%", description: "Cadastros avaliados nas últimas quatro semanas." },
];

export const adminAccessChecklist = [
  "Associar cada conta a um órgão de referência",
  "Definir escopo do perfil antes da liberação",
  "Revisar acessos inativos periodicamente",
  "Registrar observações internas para auditoria",
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

