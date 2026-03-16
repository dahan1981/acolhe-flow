/* eslint-disable @typescript-eslint/no-namespace */
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CaseStatus,
  Prisma,
  Priority,
  ReferralStatus,
  RiskLevel,
  Role,
} from "@prisma/client";
import { z } from "zod";
import { buildAuthCookieOptions, hashPassword, signAuthToken, verifyAuthToken, verifyPassword } from "./lib/auth.js";
import { asyncHandler, AppError, errorHandler } from "./lib/errors.js";
import { prisma } from "./lib/prisma.js";
import {
  serializeAttendance,
  serializeAuditLog,
  serializeCaseSummary,
  serializeOrganization,
  serializeReferral,
  serializeSessionUser,
  serializeSupportRequest,
  serializeWomanProfile,
  toCaseStatusLabel,
  toRoleLabel,
  toRiskLabel,
} from "./lib/serializers.js";
import { config, isProduction } from "./config.js";

const app = express();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.resolve(__dirname, "../../dist/client");

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origem nao autorizada pelo CORS."));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use((request, _response, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    next();
    return;
  }

  const origin = request.headers.origin;
  if (origin && !config.allowedOrigins.includes(origin)) {
    next(new AppError(403, "Origem nao autorizada."));
    return;
  }

  next();
});

type AuthenticatedUser = Awaited<ReturnType<typeof getUserForSession>>;

declare global {
  namespace Express {
    interface Request {
      currentUser?: AuthenticatedUser;
    }
  }
}

const registerSchema = z.object({
  nomeCompleto: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  cpf: z.string().min(11).max(14),
  dataNascimento: z.string().date(),
  telefone: z.string().min(10),
  endereco: z.string().min(5),
  municipio: z.string().min(2),
  uf: z.string().min(2).max(2),
  nomeSocial: z.string().optional().or(z.literal("")),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  perfil: z.enum(["mulher", "profissional", "gestora"]).optional(),
});

const supportRequestSchema = z.object({
  tipo: z.string().min(2),
  mensagem: z.string().max(500).optional(),
  situacaoRisco: z.enum(["baixo", "medio", "alto", "critico"]).default("medio"),
});

const attendanceSchema = z.object({
  caseId: z.string().min(1),
  tipoAtendimento: z.string().min(2),
  resumo: z.string().min(10),
  riscoIdentificado: z.enum(["baixo", "medio", "alto", "critico"]),
  necessidadeEncaminhamento: z.boolean().default(false),
  proximosPassos: z.string().max(500).optional(),
});

const referralSchema = z.object({
  caseId: z.string().min(1),
  atendimentoId: z.string().optional(),
  orgaoDestinoId: z.string().min(1),
  motivo: z.string().min(10),
  prioridade: z.enum(["baixa", "media", "alta", "urgente"]),
});

const caseStatusSchema = z.object({
  status: z.enum(["ativo", "em_andamento", "encaminhado", "resolvido", "arquivado"]),
});

const internalUserSchema = z.object({
  nomeCompleto: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  perfil: z.enum(["profissional", "gestora"]),
  organizationId: z.string().min(1),
  cargo: z.string().optional(),
  especialidades: z.string().optional(),
});

function riskLevelFromLabel(value: "baixo" | "medio" | "alto" | "critico") {
  return {
    baixo: RiskLevel.BAIXO,
    medio: RiskLevel.MEDIO,
    alto: RiskLevel.ALTO,
    critico: RiskLevel.CRITICO,
  }[value];
}

function priorityFromLabel(value: "baixa" | "media" | "alta" | "urgente") {
  return {
    baixa: Priority.BAIXA,
    media: Priority.MEDIA,
    alta: Priority.ALTA,
    urgente: Priority.URGENTE,
  }[value];
}

function caseStatusFromLabel(value: "ativo" | "em_andamento" | "encaminhado" | "resolvido" | "arquivado") {
  return {
    ativo: CaseStatus.ATIVO,
    em_andamento: CaseStatus.EM_ANDAMENTO,
    encaminhado: CaseStatus.ENCAMINHADO,
    resolvido: CaseStatus.RESOLVIDO,
    arquivado: CaseStatus.ARQUIVADO,
  }[value];
}

function roleFromLabel(value: "profissional" | "gestora") {
  return value === "gestora" ? Role.GESTORA : Role.PROFISSIONAL;
}

function generateProtocol() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  return `${year}-${suffix}`;
}

async function getUserForSession(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      organization: true,
      womanProfile: true,
      professionalProfile: true,
      managerProfile: true,
    },
  });
}

function setSessionCookie(response: Response, userId: string, role: Role) {
  response.cookie(config.cookieName, signAuthToken(userId, role), buildAuthCookieOptions());
}

function clearSessionCookie(response: Response) {
  response.clearCookie(config.cookieName, {
    ...buildAuthCookieOptions(),
    maxAge: undefined,
  });
}

async function audit(
  request: Request,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>,
) {
  await prisma.auditLog.create({
    data: {
      actorUserId: request.currentUser?.id,
      action,
      entityType,
      entityId,
      details: details ? JSON.stringify(details) : undefined,
      ipAddress: request.ip,
      userAgent: request.get("user-agent") ?? undefined,
    },
  });
}

async function requireAuth(request: Request, _response: Response, next: NextFunction) {
  const token = request.cookies[config.cookieName];

  if (!token) {
    next(new AppError(401, "Autenticacao obrigatoria."));
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    const user = await getUserForSession(payload.sub);

    if (!user || !user.isActive) {
      next(new AppError(401, "Sessao invalida."));
      return;
    }

    request.currentUser = user;
    next();
  } catch {
    next(new AppError(401, "Sessao expirada ou invalida."));
  }
}

function requireRole(...roles: Role[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.currentUser) {
      next(new AppError(401, "Autenticacao obrigatoria."));
      return;
    }

    if (!roles.includes(request.currentUser.role)) {
      next(new AppError(403, "Voce nao tem permissao para esta acao."));
      return;
    }

    next();
  };
}

function accessibleCaseWhere(user: AuthenticatedUser): Prisma.CaseRecordWhereInput {
  if (!user) {
    return { id: "__none__" };
  }

  if (user.role === Role.GESTORA) {
    return {};
  }

  if (user.role === Role.MULHER) {
    return {
      womanProfile: {
        userId: user.id,
      },
    };
  }

  const organizationId = user.organizationId ?? "";

  return {
    OR: [
      { entryOrganizationId: organizationId },
      { currentOrganizationId: organizationId },
      { assignedProfessionalId: user.id },
      { attendances: { some: { professionalUserId: user.id } } },
      { referrals: { some: { targetOrganizationId: organizationId } } },
      { referrals: { some: { createdByUserId: user.id } } },
    ],
  };
}

async function getAccessibleCaseOrThrow(caseId: string, user: AuthenticatedUser) {
  const caseRecord = await prisma.caseRecord.findFirst({
    where: {
      id: caseId,
      AND: accessibleCaseWhere(user),
    },
    include: {
      womanProfile: {
        include: {
          user: true,
        },
      },
      entryOrganization: true,
      currentOrganization: true,
      assignedProfessional: true,
      attendances: {
        include: {
          professionalUser: true,
          organization: true,
        },
        orderBy: { occurredAt: "desc" },
      },
      referrals: {
        include: {
          targetOrganization: true,
        },
        orderBy: { createdAt: "desc" },
      },
      supportRequests: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!caseRecord) {
    throw new AppError(404, "Caso nao encontrado.");
  }

  return caseRecord;
}

function serializeCaseDetail(caseRecord: Awaited<ReturnType<typeof getAccessibleCaseOrThrow>>) {
  return {
    ...serializeCaseSummary(caseRecord),
    nomeCompleto: caseRecord.womanProfile.user.fullName,
    perfilMulher: serializeWomanProfile(caseRecord.womanProfile),
    atribuidaPara: caseRecord.assignedProfessional?.fullName ?? null,
    orgaoAtual: caseRecord.currentOrganization.code,
    atendimentos: caseRecord.attendances.map(serializeAttendance),
    encaminhamentos: caseRecord.referrals.map(serializeReferral),
    solicitacoesApoio: caseRecord.supportRequests.map(serializeSupportRequest),
  };
}

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.post(
  "/api/auth/register",
  asyncHandler(async (request, response) => {
    const payload = registerSchema.parse(request.body);
    const email = payload.email.trim().toLowerCase();
    const cpf = payload.cpf.replace(/\D/g, "");

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { womanProfile: { is: { cpf } } }],
      },
    });

    if (existingUser) {
      throw new AppError(409, "Ja existe cadastro com este e-mail ou CPF.");
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(payload.password),
        fullName: payload.nomeCompleto.trim(),
        role: Role.MULHER,
        womanProfile: {
          create: {
            socialName: payload.nomeSocial?.trim() || null,
            cpf,
            birthDate: new Date(`${payload.dataNascimento}T12:00:00.000Z`),
            phone: payload.telefone.replace(/\D/g, ""),
            addressLine: payload.endereco.trim(),
            city: payload.municipio.trim(),
            state: payload.uf.trim().toUpperCase(),
          },
        },
      },
      include: {
        organization: true,
      },
    });

    setSessionCookie(response, user.id, user.role);
    await audit(request, "auth.register.woman", "user", user.id, { role: "mulher" });

    response.status(201).json({
      user: serializeSessionUser(user),
    });
  }),
);

app.post(
  "/api/auth/login",
  asyncHandler(async (request, response) => {
    const payload = loginSchema.parse(request.body);
    const email = payload.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
        womanProfile: true,
        professionalProfile: true,
        managerProfile: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, "Credenciais invalidas.");
    }

    const isValidPassword = await verifyPassword(payload.password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError(401, "Credenciais invalidas.");
    }

    if (payload.perfil && payload.perfil !== toRoleLabel(user.role)) {
      throw new AppError(403, "Esta conta nao pertence ao perfil selecionado.");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    setSessionCookie(response, user.id, user.role);
    await audit(request, "auth.login", "user", user.id, { role: toRoleLabel(user.role) });

    response.json({
      user: serializeSessionUser(user),
    });
  }),
);

app.post("/api/auth/logout", (request, response) => {
  clearSessionCookie(response);
  response.status(204).send();
});

app.get(
  "/api/auth/me",
  requireAuth,
  asyncHandler(async (request, response) => {
    response.json({
      user: serializeSessionUser(request.currentUser!),
    });
  }),
);

app.get(
  "/api/profile",
  requireAuth,
  asyncHandler(async (request, response) => {
    response.json({
      user: serializeSessionUser(request.currentUser!),
      womanProfile: request.currentUser?.womanProfile
        ? serializeWomanProfile(request.currentUser.womanProfile)
        : null,
    });
  }),
);

app.get(
  "/api/organizations",
  requireAuth,
  asyncHandler(async (_request, response) => {
    const organizations = await prisma.organization.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    response.json({
      organizations: organizations.map(serializeOrganization),
    });
  }),
);

app.get(
  "/api/woman/dashboard",
  requireAuth,
  requireRole(Role.MULHER),
  asyncHandler(async (request, response) => {
    const caseRecord = await prisma.caseRecord.findFirst({
      where: {
        womanProfile: {
          userId: request.currentUser!.id,
        },
      },
      include: {
        womanProfile: {
          include: { user: true },
        },
        entryOrganization: true,
        currentOrganization: true,
        assignedProfessional: true,
        attendances: {
          include: {
            professionalUser: true,
            organization: true,
          },
          orderBy: { occurredAt: "desc" },
          take: 5,
        },
        referrals: {
          include: {
            targetOrganization: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        supportRequests: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: [{ updatedAt: "desc" }],
    });

    response.json({
      caso: caseRecord ? serializeCaseDetail(caseRecord) : null,
      atendimentosRecentes: caseRecord?.attendances.map(serializeAttendance) ?? [],
      encaminhamentosRecentes: caseRecord?.referrals.map(serializeReferral) ?? [],
      solicitacoesApoio: caseRecord?.supportRequests.map(serializeSupportRequest) ?? [],
    });
  }),
);

app.get(
  "/api/woman/case",
  requireAuth,
  requireRole(Role.MULHER),
  asyncHandler(async (request, response) => {
    const caseRecord = await prisma.caseRecord.findFirst({
      where: {
        womanProfile: {
          userId: request.currentUser!.id,
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      include: {
        womanProfile: { include: { user: true } },
        entryOrganization: true,
        currentOrganization: true,
        assignedProfessional: true,
        attendances: {
          include: {
            professionalUser: true,
            organization: true,
          },
          orderBy: { occurredAt: "desc" },
        },
        referrals: {
          include: {
            targetOrganization: true,
          },
          orderBy: { createdAt: "desc" },
        },
        supportRequests: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    response.json({
      caso: caseRecord ? serializeCaseDetail(caseRecord) : null,
    });
  }),
);

app.post(
  "/api/woman/help-requests",
  requireAuth,
  requireRole(Role.MULHER),
  asyncHandler(async (request, response) => {
    const payload = supportRequestSchema.parse(request.body);
    const womanProfile = request.currentUser!.womanProfile;

    if (!womanProfile) {
      throw new AppError(400, "Perfil de mulher nao encontrado.");
    }

    let caseRecord = await prisma.caseRecord.findFirst({
      where: {
        womanProfileId: womanProfile.id,
        status: {
          in: [CaseStatus.ATIVO, CaseStatus.EM_ANDAMENTO, CaseStatus.ENCAMINHADO],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!caseRecord) {
      const defaultOrganization = await prisma.organization.findFirst({
        where: { code: "sec-mulher" },
      });

      if (!defaultOrganization) {
        throw new AppError(500, "Nenhum orgao base configurado.");
      }

      caseRecord = await prisma.caseRecord.create({
        data: {
          protocol: generateProtocol(),
          womanProfileId: womanProfile.id,
          createdByUserId: request.currentUser!.id,
          entryOrganizationId: defaultOrganization.id,
          currentOrganizationId: defaultOrganization.id,
          intakeSummary: payload.mensagem?.trim() || `Solicitacao de apoio: ${payload.tipo}`,
          riskLevel: riskLevelFromLabel(payload.situacaoRisco),
          status: CaseStatus.ATIVO,
        },
      });
    }

    const supportRequest = await prisma.supportRequest.create({
      data: {
        caseId: caseRecord.id,
        womanUserId: request.currentUser!.id,
        kind: payload.tipo,
        message: payload.mensagem?.trim() || null,
      },
    });

    await audit(request, "woman.help-request.created", "support_request", supportRequest.id, {
      caseId: caseRecord.id,
      kind: payload.tipo,
    });

    response.status(201).json({
      solicitacao: serializeSupportRequest(supportRequest),
      caseId: caseRecord.id,
    });
  }),
);

app.get(
  "/api/professional/dashboard",
  requireAuth,
  requireRole(Role.PROFISSIONAL),
  asyncHandler(async (request, response) => {
    const where = accessibleCaseWhere(request.currentUser!);

    const [activeCases, urgentCases, latestAttendances, todayAttendances] = await Promise.all([
      prisma.caseRecord.count({
        where: {
          AND: [where, { status: { in: [CaseStatus.ATIVO, CaseStatus.EM_ANDAMENTO] } }],
        },
      }),
      prisma.caseRecord.findMany({
        where: {
          AND: [
            where,
            {
              status: { in: [CaseStatus.ATIVO, CaseStatus.EM_ANDAMENTO, CaseStatus.ENCAMINHADO] },
              riskLevel: { in: [RiskLevel.ALTO, RiskLevel.CRITICO] },
            },
          ],
        },
        include: {
          womanProfile: { include: { user: true } },
          entryOrganization: true,
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 3,
      }),
      prisma.attendance.findMany({
        where: {
          OR: [
            { professionalUserId: request.currentUser!.id },
            { organizationId: request.currentUser!.organizationId ?? "__none__" },
          ],
        },
        include: {
          professionalUser: true,
          organization: true,
          caseRecord: {
            include: {
              womanProfile: { include: { user: true } },
            },
          },
        },
        orderBy: { occurredAt: "desc" },
        take: 3,
      }),
      prisma.attendance.count({
        where: {
          professionalUserId: request.currentUser!.id,
          occurredAt: {
            gte: new Date(new Date().toDateString()),
          },
        },
      }),
    ]);

    response.json({
      casosAtivos: activeCases,
      atendimentosHoje: todayAttendances,
      casosPrioritarios: urgentCases.map(serializeCaseSummary),
      ultimosAtendimentos: latestAttendances.map((attendance) => ({
        ...serializeAttendance(attendance),
        caso: {
          id: attendance.caseRecord.id,
          protocolo: attendance.caseRecord.protocol,
          nomeCompleto: attendance.caseRecord.womanProfile.user.fullName,
          nomeSocial: attendance.caseRecord.womanProfile.socialName,
        },
      })),
    });
  }),
);

app.get(
  "/api/manager/dashboard",
  requireAuth,
  requireRole(Role.GESTORA),
  asyncHandler(async (_request, response) => {
    const [allCases, totalAttendances, pendingReferrals, organizations] = await Promise.all([
      prisma.caseRecord.findMany({
        include: {
          entryOrganization: true,
        },
      }),
      prisma.attendance.count(),
      prisma.referral.count({
        where: { status: ReferralStatus.PENDENTE },
      }),
      prisma.organization.findMany({
        where: { isActive: true },
      }),
    ]);

    response.json({
      stats: {
        total: allCases.length,
        ativos: allCases.filter((item) => item.status === CaseStatus.ATIVO).length,
        emAndamento: allCases.filter((item) => item.status === CaseStatus.EM_ANDAMENTO).length,
        encaminhados: allCases.filter((item) => item.status === CaseStatus.ENCAMINHADO).length,
        resolvidos: allCases.filter((item) => item.status === CaseStatus.RESOLVIDO).length,
        totalAtendimentos: totalAttendances,
        encaminhamentosPendentes: pendingReferrals,
        porOrgao: organizations
          .map((organization) => ({
            orgao: organization.name,
            sigla: organization.code.toUpperCase(),
            total: allCases.filter((item) => item.entryOrganizationId === organization.id).length,
          }))
          .filter((item) => item.total > 0),
        porRisco: [
          { nivel: "Critico", total: allCases.filter((item) => item.riskLevel === RiskLevel.CRITICO).length, cor: "urgent" },
          { nivel: "Alto", total: allCases.filter((item) => item.riskLevel === RiskLevel.ALTO).length, cor: "warning" },
          { nivel: "Medio", total: allCases.filter((item) => item.riskLevel === RiskLevel.MEDIO).length, cor: "primary" },
          { nivel: "Baixo", total: allCases.filter((item) => item.riskLevel === RiskLevel.BAIXO).length, cor: "accent" },
        ],
      },
    });
  }),
);

app.get(
  "/api/manager/reports/summary",
  requireAuth,
  requireRole(Role.GESTORA),
  asyncHandler(async (_request, response) => {
    const latestCases = await prisma.caseRecord.findMany({
      include: {
        womanProfile: { include: { user: true } },
        entryOrganization: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    response.json({
      casosRecentes: latestCases.map(serializeCaseSummary),
    });
  }),
);

app.get(
  "/api/manager/reports/:type/export",
  requireAuth,
  requireRole(Role.GESTORA),
  asyncHandler(async (request, response) => {
    const type = String(request.params.type ?? "geral");
    const cases = await prisma.caseRecord.findMany({
      include: {
        womanProfile: { include: { user: true } },
        entryOrganization: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const rows = [
      ["Protocolo", "Nome", "Orgao", "Risco", "Status", "Data"],
      ...cases.map((item) => [
        item.protocol,
        item.womanProfile.user.fullName,
        item.entryOrganization.name,
        toRiskLabel(item.riskLevel),
        toCaseStatusLabel(item.status),
        item.createdAt.toISOString().slice(0, 10),
      ]),
    ];

    const csv = rows.map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader("Content-Disposition", `attachment; filename="relatorio-${type}.csv"`);
    response.send(csv);
  }),
);

app.get(
  "/api/cases",
  requireAuth,
  requireRole(Role.PROFISSIONAL, Role.GESTORA),
  asyncHandler(async (request, response) => {
    const search = typeof request.query.search === "string" ? request.query.search.trim() : "";
    const status = typeof request.query.status === "string" ? request.query.status.trim() : "";
    const filters: Prisma.CaseRecordWhereInput[] = [accessibleCaseWhere(request.currentUser!)];

    if (search) {
      filters.push({
        OR: [
          { protocol: { contains: search } },
          { womanProfile: { is: { user: { is: { fullName: { contains: search } } } } } },
          { womanProfile: { is: { socialName: { contains: search } } } },
          { womanProfile: { is: { cpf: { contains: search.replace(/\D/g, "") } } } },
        ],
      });
    }

    if (status && status !== "todos") {
      filters.push({
        status: caseStatusFromLabel(status as "ativo" | "em_andamento" | "encaminhado" | "resolvido" | "arquivado"),
      });
    }

    const cases = await prisma.caseRecord.findMany({
      where: { AND: filters },
      include: {
        womanProfile: { include: { user: true } },
        entryOrganization: true,
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    response.json({
      casos: cases.map(serializeCaseSummary),
    });
  }),
);

app.get(
  "/api/cases/:id",
  requireAuth,
  requireRole(Role.PROFISSIONAL, Role.GESTORA),
  asyncHandler(async (request, response) => {
    const caseId = String(request.params.id ?? "");
    const caseRecord = await getAccessibleCaseOrThrow(caseId, request.currentUser!);
    response.json({
      caso: serializeCaseDetail(caseRecord),
    });
  }),
);

app.patch(
  "/api/cases/:id/status",
  requireAuth,
  requireRole(Role.PROFISSIONAL, Role.GESTORA),
  asyncHandler(async (request, response) => {
    const payload = caseStatusSchema.parse(request.body);
    const caseId = String(request.params.id ?? "");
    await getAccessibleCaseOrThrow(caseId, request.currentUser!);

    await prisma.caseRecord.update({
      where: { id: caseId },
      data: {
        status: caseStatusFromLabel(payload.status),
        closedAt: payload.status === "resolvido" || payload.status === "arquivado" ? new Date() : null,
      },
    });

    const updated: Prisma.CaseRecordGetPayload<{
      include: {
        womanProfile: { include: { user: true } };
        entryOrganization: true;
      };
    }> = await prisma.caseRecord.findUniqueOrThrow({
      where: { id: caseId },
      include: {
        womanProfile: { include: { user: true } },
        entryOrganization: true,
      },
    });

    await audit(request, "case.status.updated", "case", updated.id, { status: payload.status });

    response.json({
      caso: serializeCaseSummary(updated),
    });
  }),
);

app.post(
  "/api/attendances",
  requireAuth,
  requireRole(Role.PROFISSIONAL, Role.GESTORA),
  asyncHandler(async (request, response) => {
    const payload = attendanceSchema.parse(request.body);
    const caseRecord = await getAccessibleCaseOrThrow(payload.caseId, request.currentUser!);

    const attendance = await prisma.attendance.create({
      data: {
        caseId: caseRecord.id,
        professionalUserId: request.currentUser!.id,
        organizationId: request.currentUser!.organizationId ?? caseRecord.currentOrganizationId,
        attendanceType: payload.tipoAtendimento,
        summary: payload.resumo,
        riskLevel: riskLevelFromLabel(payload.riscoIdentificado),
        needsReferral: payload.necessidadeEncaminhamento,
        nextSteps: payload.proximosPassos?.trim() || null,
        occurredAt: new Date(),
      },
      include: {
        professionalUser: true,
        organization: true,
      },
    });

    await prisma.caseRecord.update({
      where: { id: caseRecord.id },
      data: {
        status: CaseStatus.EM_ANDAMENTO,
        riskLevel: riskLevelFromLabel(payload.riscoIdentificado),
        currentOrganizationId: request.currentUser!.organizationId ?? caseRecord.currentOrganizationId,
      },
    });

    await audit(request, "attendance.created", "attendance", attendance.id, { caseId: caseRecord.id });

    response.status(201).json({
      atendimento: serializeAttendance(attendance),
    });
  }),
);

app.post(
  "/api/referrals",
  requireAuth,
  requireRole(Role.PROFISSIONAL, Role.GESTORA),
  asyncHandler(async (request, response) => {
    const payload = referralSchema.parse(request.body);
    const caseRecord = await getAccessibleCaseOrThrow(payload.caseId, request.currentUser!);

    const organization = await prisma.organization.findUnique({
      where: { id: payload.orgaoDestinoId },
    });

    if (!organization) {
      throw new AppError(404, "Orgao de destino nao encontrado.");
    }

    if (payload.atendimentoId) {
      const attendance = await prisma.attendance.findFirst({
        where: {
          id: payload.atendimentoId,
          caseId: caseRecord.id,
        },
      });

      if (!attendance) {
        throw new AppError(404, "Atendimento vinculado nao encontrado.");
      }
    }

    const referral = await prisma.referral.create({
      data: {
        caseId: caseRecord.id,
        attendanceId: payload.atendimentoId,
        createdByUserId: request.currentUser!.id,
        sourceOrganizationId: request.currentUser!.organizationId,
        targetOrganizationId: organization.id,
        reason: payload.motivo,
        priority: priorityFromLabel(payload.prioridade),
        status: ReferralStatus.PENDENTE,
      },
      include: {
        targetOrganization: true,
      },
    });

    await prisma.caseRecord.update({
      where: { id: caseRecord.id },
      data: {
        status: CaseStatus.ENCAMINHADO,
        currentOrganizationId: organization.id,
      },
    });

    await audit(request, "referral.created", "referral", referral.id, { caseId: caseRecord.id });

    response.status(201).json({
      encaminhamento: serializeReferral(referral),
    });
  }),
);

app.post(
  "/api/internal/users",
  requireAuth,
  requireRole(Role.GESTORA),
  asyncHandler(async (request, response) => {
    const payload = internalUserSchema.parse(request.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email.trim().toLowerCase() },
    });

    if (existingUser) {
      throw new AppError(409, "Ja existe conta com este e-mail.");
    }

    const organization = await prisma.organization.findUnique({
      where: { id: payload.organizationId },
    });

    if (!organization) {
      throw new AppError(404, "Orgao nao encontrado.");
    }

    const role = roleFromLabel(payload.perfil);
    const user = await prisma.user.create({
      data: {
        email: payload.email.trim().toLowerCase(),
        passwordHash: await hashPassword(payload.password),
        fullName: payload.nomeCompleto.trim(),
        role,
        organizationId: organization.id,
        professionalProfile:
          role === Role.PROFISSIONAL
            ? {
                create: {
                  organizationId: organization.id,
                  title: payload.cargo?.trim() || null,
                  specialties: payload.especialidades?.trim() || null,
                },
              }
            : undefined,
        managerProfile:
          role === Role.GESTORA
            ? {
                create: {
                  organizationId: organization.id,
                  scope: "municipal",
                },
              }
            : undefined,
      },
      include: {
        organization: true,
      },
    });

    await audit(request, "internal-user.created", "user", user.id, { role: payload.perfil });

    response.status(201).json({
      user: serializeSessionUser(user),
    });
  }),
);

app.get(
  "/api/audit-logs/me",
  requireAuth,
  asyncHandler(async (request, response) => {
    const logs = await prisma.auditLog.findMany({
      where: {
        actorUserId: request.currentUser!.id,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    response.json({
      logs: logs.map(serializeAuditLog),
    });
  }),
);

if (isProduction) {
  app.use(express.static(clientDistPath));
  app.get("*", (request, response, next) => {
    if (request.path.startsWith("/api")) {
      next();
      return;
    }

    response.sendFile(path.join(clientDistPath, "index.html"));
  });
}

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`API ouvindo em http://localhost:${config.port}`);
});
