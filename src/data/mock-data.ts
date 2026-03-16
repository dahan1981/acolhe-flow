export type UserProfile = 'mulher' | 'profissional' | 'gestora';

export type RiskLevel = 'baixo' | 'medio' | 'alto' | 'critico';
export type CaseStatus = 'ativo' | 'em_andamento' | 'encaminhado' | 'resolvido' | 'arquivado';
export type Priority = 'baixa' | 'media' | 'alta' | 'urgente';

export interface Orgao {
  id: string;
  nome: string;
  sigla: string;
  cor: string;
}

export interface Mulher {
  id: string;
  nomeCompleto: string;
  nomeSocial?: string;
  dataNascimento: string;
  cpf: string;
  telefone: string;
  endereco: string;
  municipio: string;
  situacaoRisco: RiskLevel;
  orgaoEntrada: string;
  dataPrimeiroAtendimento: string;
  observacoesIniciais: string;
  status: CaseStatus;
  protocolo: string;
}

export interface Atendimento {
  id: string;
  mulherId: string;
  data: string;
  profissionalResponsavel: string;
  orgao: string;
  tipoAtendimento: string;
  resumo: string;
  riscoIdentificado: RiskLevel;
  necessidadeEncaminhamento: boolean;
  proximosPassos: string;
}

export interface Encaminhamento {
  id: string;
  mulherId: string;
  atendimentoId: string;
  orgaoDestino: string;
  motivo: string;
  prioridade: Priority;
  data: string;
  status: 'pendente' | 'aceito' | 'em_atendimento' | 'concluido';
}

export interface UserAccount {
  id: string;
  nome: string;
  email: string;
  perfil: UserProfile;
  orgao: string;
  avatar?: string;
}

export const orgaos: Orgao[] = [
  { id: 'sec-mulher', nome: 'Secretaria da Mulher', sigla: 'SM', cor: 'hsl(224, 71%, 45%)' },
  { id: 'creas', nome: 'CREAS', sigla: 'CREAS', cor: 'hsl(162, 37%, 45%)' },
  { id: 'cras', nome: 'CRAS', sigla: 'CRAS', cor: 'hsl(199, 60%, 45%)' },
  { id: 'delegacia', nome: 'Delegacia da Mulher', sigla: 'DEAM', cor: 'hsl(260, 50%, 50%)' },
  { id: 'ubs', nome: 'UBS', sigla: 'UBS', cor: 'hsl(340, 60%, 50%)' },
  { id: 'defensoria', nome: 'Defensoria Pública', sigla: 'DP', cor: 'hsl(30, 70%, 50%)' },
  { id: 'abrigo', nome: 'Casa Abrigo', sigla: 'CA', cor: 'hsl(0, 60%, 50%)' },
];

export const users: UserAccount[] = [
  { id: 'u1', nome: 'Ana Beatriz Santos', email: 'ana@exemplo.com', perfil: 'mulher', orgao: 'sec-mulher' },
  { id: 'u2', nome: 'Dra. Carla Mendes', email: 'carla@exemplo.com', perfil: 'profissional', orgao: 'sec-mulher' },
  { id: 'u3', nome: 'Fernanda Oliveira', email: 'fernanda@exemplo.com', perfil: 'gestora', orgao: 'sec-mulher' },
];

export const mulheres: Mulher[] = [
  {
    id: 'm1',
    nomeCompleto: 'Ana Beatriz Santos',
    nomeSocial: undefined,
    dataNascimento: '1990-03-15',
    cpf: '123.456.789-00',
    telefone: '(11) 98765-4321',
    endereco: 'Rua das Flores, 234, Jd. Primavera',
    municipio: 'São Paulo',
    situacaoRisco: 'alto',
    orgaoEntrada: 'sec-mulher',
    dataPrimeiroAtendimento: '2024-07-10',
    observacoesIniciais: 'Vítima de violência doméstica. Marido com histórico de agressão. Possui dois filhos menores.',
    status: 'em_andamento',
    protocolo: '2024-0812',
  },
  {
    id: 'm2',
    nomeCompleto: 'Maria Luísa Ferreira',
    nomeSocial: 'Malu',
    dataNascimento: '1985-11-22',
    cpf: '987.654.321-00',
    telefone: '(11) 91234-5678',
    endereco: 'Av. Brasil, 1500, Centro',
    municipio: 'São Paulo',
    situacaoRisco: 'critico',
    orgaoEntrada: 'delegacia',
    dataPrimeiroAtendimento: '2024-08-02',
    observacoesIniciais: 'Situação de risco iminente. Medida protetiva solicitada. Necessita abrigo emergencial.',
    status: 'ativo',
    protocolo: '2024-0945',
  },
  {
    id: 'm3',
    nomeCompleto: 'Juliana Costa Ribeiro',
    dataNascimento: '1993-06-08',
    cpf: '456.789.123-00',
    telefone: '(11) 97654-3210',
    endereco: 'Rua Esperança, 89, Vila Nova',
    municipio: 'São Paulo',
    situacaoRisco: 'medio',
    orgaoEntrada: 'cras',
    dataPrimeiroAtendimento: '2024-06-15',
    observacoesIniciais: 'Encaminhada pelo CRAS após relato de violência psicológica pelo companheiro.',
    status: 'encaminhado',
    protocolo: '2024-0723',
  },
  {
    id: 'm4',
    nomeCompleto: 'Patrícia Alves de Souza',
    dataNascimento: '1978-01-30',
    cpf: '321.654.987-00',
    telefone: '(11) 95432-1098',
    endereco: 'Rua São Jorge, 456, Pq. Industrial',
    municipio: 'São Paulo',
    situacaoRisco: 'baixo',
    orgaoEntrada: 'ubs',
    dataPrimeiroAtendimento: '2024-05-20',
    observacoesIniciais: 'Atendida na UBS com sinais de lesão. Relata queda, mas equipe identificou padrão suspeito.',
    status: 'resolvido',
    protocolo: '2024-0601',
  },
  {
    id: 'm5',
    nomeCompleto: 'Renata Vieira Lima',
    nomeSocial: 'Rê',
    dataNascimento: '1995-09-12',
    cpf: '654.321.987-00',
    telefone: '(11) 93210-9876',
    endereco: 'Trav. da Paz, 12, Jd. América',
    municipio: 'São Paulo',
    situacaoRisco: 'alto',
    orgaoEntrada: 'sec-mulher',
    dataPrimeiroAtendimento: '2024-08-10',
    observacoesIniciais: 'Chegou acompanhada da mãe. Relata ameaças constantes do ex-companheiro. Possui medida protetiva vigente.',
    status: 'ativo',
    protocolo: '2024-0978',
  },
  {
    id: 'm6',
    nomeCompleto: 'Cláudia Regina de Oliveira',
    dataNascimento: '1982-04-18',
    cpf: '789.123.456-00',
    telefone: '(11) 92109-8765',
    endereco: 'Rua dos Lírios, 78, Jd. Europa',
    municipio: 'São Paulo',
    situacaoRisco: 'medio',
    orgaoEntrada: 'creas',
    dataPrimeiroAtendimento: '2024-07-25',
    observacoesIniciais: 'Acompanhada pelo CREAS há 3 meses. Histórico de violência patrimonial.',
    status: 'em_andamento',
    protocolo: '2024-0856',
  },
];

export const atendimentos: Atendimento[] = [
  {
    id: 'a1',
    mulherId: 'm1',
    data: '2024-07-10',
    profissionalResponsavel: 'Dra. Carla Mendes',
    orgao: 'sec-mulher',
    tipoAtendimento: 'Acolhimento Inicial',
    resumo: 'Primeiro acolhimento. Mulher relatou agressões físicas e verbais frequentes nos últimos 6 meses. Apresenta marcas visíveis nos braços. Foi orientada sobre seus direitos e sobre a rede de proteção disponível.',
    riscoIdentificado: 'alto',
    necessidadeEncaminhamento: true,
    proximosPassos: 'Encaminhar para Delegacia da Mulher para registro de B.O. e solicitar medida protetiva.',
  },
  {
    id: 'a2',
    mulherId: 'm1',
    data: '2024-07-15',
    profissionalResponsavel: 'Del. Márcia Tavares',
    orgao: 'delegacia',
    tipoAtendimento: 'Registro de Ocorrência',
    resumo: 'Boletim de ocorrência registrado sob nº 2024/00456. Solicitada medida protetiva de urgência ao Juizado. Mulher orientada a não permanecer no domicílio.',
    riscoIdentificado: 'alto',
    necessidadeEncaminhamento: true,
    proximosPassos: 'Aguardar decisão judicial sobre medida protetiva. Encaminhar ao CREAS para acompanhamento social.',
  },
  {
    id: 'a3',
    mulherId: 'm1',
    data: '2024-07-22',
    profissionalResponsavel: 'Assistente Social Lúcia',
    orgao: 'creas',
    tipoAtendimento: 'Acompanhamento Social',
    resumo: 'Medida protetiva deferida. Mulher está temporariamente na casa da mãe com os dois filhos. Crianças matriculadas em escola próxima. Avaliação de necessidade de benefício emergencial.',
    riscoIdentificado: 'medio',
    necessidadeEncaminhamento: false,
    proximosPassos: 'Agendar retorno em 15 dias para reavaliação. Verificar inclusão em programa habitacional.',
  },
  {
    id: 'a4',
    mulherId: 'm2',
    data: '2024-08-02',
    profissionalResponsavel: 'Del. Márcia Tavares',
    orgao: 'delegacia',
    tipoAtendimento: 'Registro de Ocorrência',
    resumo: 'Mulher chegou em estado de choque. Relata agressão física grave na noite anterior. Encaminhada para exame de corpo de delito. Medida protetiva de urgência solicitada com pedido de afastamento do lar.',
    riscoIdentificado: 'critico',
    necessidadeEncaminhamento: true,
    proximosPassos: 'Encaminhamento imediato à Casa Abrigo. Solicitar acompanhamento da Defensoria Pública.',
  },
  {
    id: 'a5',
    mulherId: 'm2',
    data: '2024-08-03',
    profissionalResponsavel: 'Coord. Helena Bastos',
    orgao: 'abrigo',
    tipoAtendimento: 'Acolhimento em Abrigo',
    resumo: 'Mulher acolhida na Casa Abrigo com um filho de 4 anos. Recebeu kit de higiene e roupas. Psicóloga realizou primeiro atendimento. Mulher apresenta quadro ansioso.',
    riscoIdentificado: 'critico',
    necessidadeEncaminhamento: true,
    proximosPassos: 'Agendar atendimento com Defensoria Pública. Iniciar acompanhamento psicológico semanal.',
  },
  {
    id: 'a6',
    mulherId: 'm3',
    data: '2024-06-15',
    profissionalResponsavel: 'Dra. Carla Mendes',
    orgao: 'sec-mulher',
    tipoAtendimento: 'Acolhimento Inicial',
    resumo: 'Encaminhada pelo CRAS. Relata violência psicológica e controle financeiro pelo companheiro há 2 anos. Sem filhos. Deseja separação mas tem receio.',
    riscoIdentificado: 'medio',
    necessidadeEncaminhamento: true,
    proximosPassos: 'Encaminhar para atendimento jurídico na Defensoria Pública. Agendar retorno para acompanhamento.',
  },
];

export const encaminhamentos: Encaminhamento[] = [
  {
    id: 'e1',
    mulherId: 'm1',
    atendimentoId: 'a1',
    orgaoDestino: 'delegacia',
    motivo: 'Registro de Boletim de Ocorrência e solicitação de medida protetiva',
    prioridade: 'alta',
    data: '2024-07-10',
    status: 'concluido',
  },
  {
    id: 'e2',
    mulherId: 'm1',
    atendimentoId: 'a2',
    orgaoDestino: 'creas',
    motivo: 'Acompanhamento social da família e avaliação de vulnerabilidade',
    prioridade: 'alta',
    data: '2024-07-15',
    status: 'em_atendimento',
  },
  {
    id: 'e3',
    mulherId: 'm2',
    atendimentoId: 'a4',
    orgaoDestino: 'abrigo',
    motivo: 'Acolhimento emergencial — risco iminente à integridade física',
    prioridade: 'urgente',
    data: '2024-08-02',
    status: 'concluido',
  },
  {
    id: 'e4',
    mulherId: 'm2',
    atendimentoId: 'a5',
    orgaoDestino: 'defensoria',
    motivo: 'Acompanhamento jurídico e orientação sobre direitos',
    prioridade: 'alta',
    data: '2024-08-03',
    status: 'pendente',
  },
  {
    id: 'e5',
    mulherId: 'm3',
    atendimentoId: 'a6',
    orgaoDestino: 'defensoria',
    motivo: 'Orientação jurídica para separação e proteção patrimonial',
    prioridade: 'media',
    data: '2024-06-15',
    status: 'aceito',
  },
];

// Helper functions
export function getMulherById(id: string): Mulher | undefined {
  return mulheres.find(m => m.id === id);
}

export function getAtendimentosByMulher(mulherId: string): Atendimento[] {
  return atendimentos.filter(a => a.mulherId === mulherId).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}

export function getEncaminhamentosByMulher(mulherId: string): Encaminhamento[] {
  return encaminhamentos.filter(e => e.mulherId === mulherId).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}

export function getOrgaoById(id: string): Orgao | undefined {
  return orgaos.find(o => o.id === id);
}

export function getOrgaoNome(id: string): string {
  return orgaos.find(o => o.id === id)?.nome ?? id;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

// Stats for gestora
export function getStats() {
  const total = mulheres.length;
  const ativos = mulheres.filter(m => m.status === 'ativo').length;
  const emAndamento = mulheres.filter(m => m.status === 'em_andamento').length;
  const encaminhados = mulheres.filter(m => m.status === 'encaminhado').length;
  const resolvidos = mulheres.filter(m => m.status === 'resolvido').length;

  const porOrgao = orgaos.map(o => ({
    orgao: o.nome,
    sigla: o.sigla,
    total: mulheres.filter(m => m.orgaoEntrada === o.id).length,
  })).filter(o => o.total > 0);

  const porRisco = [
    { nivel: 'Crítico', total: mulheres.filter(m => m.situacaoRisco === 'critico').length, cor: 'urgent' },
    { nivel: 'Alto', total: mulheres.filter(m => m.situacaoRisco === 'alto').length, cor: 'warning' },
    { nivel: 'Médio', total: mulheres.filter(m => m.situacaoRisco === 'medio').length, cor: 'primary' },
    { nivel: 'Baixo', total: mulheres.filter(m => m.situacaoRisco === 'baixo').length, cor: 'accent' },
  ];

  const encaminhamentosPendentes = encaminhamentos.filter(e => e.status === 'pendente').length;
  const totalAtendimentos = atendimentos.length;

  return {
    total, ativos, emAndamento, encaminhados, resolvidos,
    porOrgao, porRisco, encaminhamentosPendentes, totalAtendimentos,
  };
}
