# Athena

Aplicação full-stack para acolhimento unificado à mulher, com frontend React/Vite e backend Express + Prisma.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind
- Backend: Node.js, Express, Prisma
- Banco recomendado: Postgres
- Autenticação: JWT em cookie HttpOnly

## Perfis

- `mulher`: cadastro público permitido, acesso apenas aos próprios dados
- `profissional`: criado internamente, acessa casos compatíveis com sua organização/permissão
- `gestora`: criada internamente, acessa painel gerencial e criação protegida de contas internas

## Requisitos

- Node.js 20+
- npm
- Postgres local ou remoto

## Variaveis de ambiente

Crie um arquivo `.env` com base em `.env.example`.

Obrigatorias:

- `DATABASE_URL`
- `JWT_SECRET`
- `APP_WEB_ORIGIN`

## Como rodar localmente

Com Postgres disponivel:

```bash
npm install
npm run db:push
npm run db:seed
npm run dev:full
```

Aplicações:

- Frontend: `http://localhost:8080`
- API: `http://localhost:4000`

## Contas seed

- Mulher: `ana@exemplo.com` / `Acolhe@123`
- Profissional: `carla@exemplo.com` / `Acolhe@123`
- Gestora: `fernanda@exemplo.com` / `Acolhe@123`

Em desenvolvimento, a conta seed da Mulher continua podendo entrar localmente para bootstrap e demonstração.
Em produção, mantenha `ALLOW_LOCAL_WOMAN_SEED_LOGIN=false`.

## Scripts

- `npm run dev:client`: sobe o frontend
- `npm run dev:server`: sobe a API
- `npm run dev:full`: sobe frontend + backend
- `npm run db:push`: sincroniza schema do Prisma no banco
- `npm run db:seed`: popula dados iniciais
- `npm run build`: gera build de frontend e backend
- `npm start`: inicia o servidor
- `npm run start:railway`: aplica schema e sobe o servidor para Railway

## Melhor caminho de deploy

O caminho recomendado para este projeto e:

- Railway para hospedar a aplicação Node
- Postgres gerenciado no proprio Railway
- frontend e backend no mesmo servico

Isso evita os limites de hospedagem estática e é compatível com autenticação, API protegida e persistência real.

## Como subir no Railway

1. Crie um novo projeto no Railway.
2. Conecte este repositorio GitHub.
3. Adicione um banco Postgres no projeto.
4. Configure as variaveis:
   - `DATABASE_URL`: use a do Postgres do Railway
   - `JWT_SECRET`: gere uma chave forte
   - `JWT_EXPIRES_IN=12h`
   - `AUTH_COOKIE_NAME=athena_auth`
   - `APP_WEB_ORIGIN=https://seu-dominio.com` ou URL pública do Railway
   - `VITE_API_BASE_URL=` deixe vazio para usar mesma origem
5. Build command:
   - `npm install && npm run build`
6. Start command:
   - `npm run start:railway`
7. Depois do primeiro deploy, rode uma vez no shell do servico:
   - `npm run db:push`
8. Se quiser popular dados de exemplo no ambiente remoto:
   - `npm run db:seed`

## Seed em ambiente remoto

Para bootstrap inicial no Railway, rode quando quiser dados de demonstração:

```bash
npm run db:seed
```

Depois disso, remova as contas de exemplo se for um ambiente de uso real.

## Dominio GoDaddy

GoDaddy cuida do DNS, não da execução da aplicação.

Fluxo recomendado:

1. publique no Railway
2. valide com a URL pública do Railway
3. adicione seu dominio customizado no Railway
4. aponte o DNS na GoDaddy para o alvo informado pelo Railway
5. atualize `APP_WEB_ORIGIN` para o dominio final

## Abordagem adotada para contas internas

Foi implementada uma rota protegida `POST /api/internal/users`, acessivel apenas por `gestora`, para criar contas `profissional` e `gestora`.

Motivo:

- evita cadastro público indevido
- não depende de seeds fixas para operar em ambiente real
- encaixa na base atual sem exigir painel administrativo novo neste primeiro ciclo

As contas seed continuam existindo apenas para desenvolvimento inicial e bootstrap.
