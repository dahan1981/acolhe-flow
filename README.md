# AcolheSistemas

Aplicacao full-stack para acolhimento unificado a mulher, com frontend React/Vite e backend Express + Prisma.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind
- Backend: Node.js, Express, Prisma
- Banco local: SQLite (`prisma/dev.db`)
- Autenticacao: JWT em cookie HttpOnly

## Perfis

- `mulher`: cadastro publico permitido, acesso apenas aos proprios dados
- `profissional`: criado internamente, acessa casos compativeis com sua organizacao/permissao
- `gestora`: criada internamente, acessa painel gerencial e criacao protegida de contas internas

## Requisitos

- Node.js 20+
- npm

## Variaveis de ambiente

Crie um arquivo `.env` com base em `.env.example`.

## Como rodar localmente

```bash
npm install
npm run db:push
npm run db:seed
npm run dev:full
```

Aplicacoes:

- Frontend: `http://localhost:8080`
- API: `http://localhost:4000`

## Contas seed

- Mulher: `ana@exemplo.com` / `Acolhe@123`
- Profissional: `carla@exemplo.com` / `Acolhe@123`
- Gestora: `fernanda@exemplo.com` / `Acolhe@123`

## Scripts

- `npm run dev:client`: sobe o frontend
- `npm run dev:server`: sobe a API
- `npm run dev:full`: sobe frontend + backend
- `npm run db:push`: sincroniza schema do Prisma no banco local
- `npm run db:seed`: popula dados iniciais
- `npm run build`: gera build de frontend e backend
- `npm start`: inicia o servidor de producao

## Build e producao

```bash
npm install
npm run db:push
npm run db:seed
npm run build
npm start
```

Em producao, o backend serve os arquivos estaticos do frontend a partir de `dist/client`.

## Deploy e dominio GoDaddy

O dominio da GoDaddy cobre DNS, nao hospedagem. Para publicar:

1. Hospede a aplicacao Node em um VPS, cPanel com Node, ou plataforma compativel.
2. Configure variaveis de ambiente de producao.
3. Rode `npm run db:push` no ambiente com volume persistente.
4. Aponte o DNS da GoDaddy para o host da aplicacao.
5. Configure HTTPS no host e use `APP_WEB_ORIGIN=https://seu-dominio.com`.

Se for usar subdominios, inclua todos em `APP_WEB_ORIGIN` separados por virgula.

## Abordagem adotada para contas internas

Foi implementada uma rota protegida `POST /api/internal/users`, acessivel apenas por `gestora`, para criar contas `profissional` e `gestora`.

Motivo:

- evita cadastro publico indevido
- nao depende de seeds fixas para operar em ambiente real
- encaixa na base atual sem exigir painel administrativo novo neste primeiro ciclo

As contas seed continuam existindo apenas para desenvolvimento inicial e bootstrap local.
