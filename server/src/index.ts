/* eslint-disable @typescript-eslint/no-namespace */
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { createServer, type IncomingMessage } from "node:http";
import { createHash, randomInt, randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer, WebSocket } from "ws";
import {
  CaseStatus,
  ChatTicketStatus,
  ContactChangeType,
  Prisma,
  Priority,
  ReferralStatus,
  RiskLevel,
  Role,
  NotificationKind,
} from "@prisma/client";
import { z } from "zod";
import { buildAuthCookieOptions, buildRefreshCookieOptions, hashPassword, signAuthToken, signRefreshToken, verifyAuthToken, verifyPassword } from "./lib/auth.js";
import { sendContactChangeOtpEmail } from "./lib/email.js";
import { asyncHandler, AppError, errorHandler } from "./lib/errors.js";
import { prisma } from "./lib/prisma.js";
import { requireSupabaseAdmin } from "./lib/supabase.js";
import {
  serializeAttendance,
  serializeAuditLog,
  serializeCaseSummary,
  serializeChatTicket,
  serializeOrganization,
  serializeReferral,
  serializeSessionUser,
  serializeSupportRequest,
  serializeUserNotification,
  serializeWomanProfile,
  toCaseStatusLabel,
  toRoleLabel,
  toRiskLabel,
} from "./lib/serializers.js";
import { config, isProduction } from "./config.js";
import { isValidCPF } from "./lib/cpf.js";

const app = express();
const server = createServer(app);
const realtimeServer = new WebSocketServer({ noServer: true });
const isVercel = Boolean(process.env.VERCEL);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.resolve(__dirname, "../../dist/client");

app.set("trust proxy", 1);

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

      callback(new Error("Origem não autorizada pelo CORS."));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use((request, response, next) => {
  const requestId = randomUUID();
  request.requestId = requestId;
  response.setHeader("x-request-id", requestId);
  next();
});
app.use(morgan("dev"));

realtimeServer.on("connection", (socket) => {
  const realtimeSocket = socket as RealtimeSocket;
  registerSocketConnection(realtimeSocket);

  sendSocketEvent(realtimeSocket, {
    type: "socket.ready",
  });

  realtimeSocket.on("close", () => {
    unregisterSocketConnection(realtimeSocket);
  });
});

server.on("upgrade", async (request, socket, head) => {
  if (request.url !== "/ws") {
    socket.destroy();
    return;
  }

  const currentUser = await getSocketUser(request);
  if (!currentUser) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  realtimeServer.handleUpgrade(request, socket, head, (ws) => {
    const realtimeSocket = ws as RealtimeSocket;
    realtimeSocket.currentUserId = currentUser.id;
    realtimeSocket.currentUserRole = currentUser.role;
    realtimeServer.emit("connection", realtimeSocket, request);
  });
});

app.use((request, _response, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    next();
    return;
  }

  const origin = request.headers.origin;
  if (origin && !config.allowedOrigins.includes(origin)) {
    next(new AppError(403, "Origem não autorizada."));
    return;
  }

  next();
});

type AuthenticatedUser = Awaited<ReturnType<typeof getUserForSession>>;
type CurrentUser = NonNullable<AuthenticatedUser>;
type RealtimeSocket = WebSocket & {
  currentUserId: string;
  currentUserRole: Role;
};

const WOMAN_SEED_EMAIL_DOMAIN = "@exemplo.com";
const PROFILE_AVATAR_BUCKET = "profile-avatars";
const CONTACT_CHANGE_CODE_TTL_MINUTES = 10;
const CONTACT_CHANGE_MAX_ATTEMPTS = 5;

const socketsByUser = new Map<string, Set<RealtimeSocket>>();
const internalSockets = new Set<RealtimeSocket>();
let ensureProfileAvatarBucketPromise: Promise<void> | null = null;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

declare global {
  namespace Express {
    interface Request {
      currentUser?: AuthenticatedUser;
      requestId?: string;
    }
  }
}

const registerSchema = z.object({
  nomeCompleto: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  cpf: z.string().min(11).max(14).refine(isValidCPF, { message: "CPF inválido" }),
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

const supabaseWomanBridgeSchema = z.object({
  accessToken: z.string().min(20),
  profile: registerSchema.optional(),
});

const supabaseSessionBridgeSchema = z.object({
  accessToken: z.string().min(20),
  perfil: z.enum(["mulher", "profissional", "gestora"]).optional(),
});

const supportRequestSchema = z.object({
  tipo: z.string().min(2),
  mensagem: z.string().max(500).optional(),
  situacaoRisco: z.enum(["baixo", "medio", "alto", "critico"]).default("medio"),
});

const updateProfileSchema = z.object({
  email: z.string().email(),
  telefone: z.string().optional(),
  novaSenha: z.string().min(8).optional(),
});

const requestContactChangeSchema = z.object({
  tipo: z.enum(["email", "telefone"]),
  valor: z.string().min(3),
});

const confirmContactChangeSchema = z.object({
  tipo: z.enum(["email", "telefone"]),
  codigo: z.string().trim().regex(/^\d{6}$/),
});

const updateProfileAvatarSchema = z.object({
  fileName: z.string().min(1).max(120),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  imageBase64: z.string().min(100),
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

const createCaseSchema = z.object({
  nomeCompleto: z.string().min(3),
  nomeSocial: z.string().optional(),
  cpf: z.string().min(11).max(14).refine(isValidCPF, { message: "CPF inválido" }),
  dataNascimento: z.string().date(),
  telefone: z.string().min(10),
  endereco: z.string().min(5),
  municipio: z.string().min(2),
  uf: z.string().min(2).max(2),
  observacoesIniciais: z.string().min(10),
  situacaoRisco: z.enum(["baixo", "medio", "alto", "critico"]),
});

const createChatSchema = z.object({
  context: z.string().min(5).max(500).optional(),
});

const chatMessageSchema = z.object({
  body: z.string().min(1).max(2000),
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

function roleFromSessionLabel(value: "mulher" | "profissional" | "gestora") {
  if (value === "mulher") return Role.MULHER;
  return roleFromLabel(value);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function toContactChangeType(value: "email" | "telefone") {
  return value === "telefone" ? ContactChangeType.PHONE : ContactChangeType.EMAIL;
}

function toContactChangeLabel(value: ContactChangeType) {
  return value === ContactChangeType.PHONE ? "telefone" : "email";
}

function maskEmail(value: string) {
  const [localPart, domain = ""] = value.split("@");
  if (!localPart || !domain) return value;
  const head = localPart.slice(0, Math.min(2, localPart.length));
  return `${head}${"*".repeat(Math.max(localPart.length - head.length, 1))}@${domain}`;
}

function maskPhone(value: string) {
  const digits = normalizePhone(value);
  if (digits.length < 4) return digits;
  return `(**) *****-${digits.slice(-4)}`;
}

function generateVerificationCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function hashVerificationCode(userId: string, type: ContactChangeType, nextValue: string, code: string) {
  return createHash("sha256")
    .update(`${config.jwtSecret}:${userId}:${type}:${nextValue}:${code}`)
    .digest("hex");
}

function serializePendingContactChange(change: {
  id: string;
  type: ContactChangeType;
  nextValue: string;
  expiresAt: Date;
}) {
  return {
    id: change.id,
    tipo: toContactChangeLabel(change.type),
    destinoMascarado: change.type === ContactChangeType.PHONE ? maskPhone(change.nextValue) : maskEmail(change.nextValue),
    expiraEm: change.expiresAt.toISOString(),
  };
}

function getClientIdentifier(request: Request) {
  const forwardedFor = request.get("x-forwarded-for");
  const candidate = forwardedFor?.split(",")[0]?.trim() || request.ip || "unknown";
  return candidate;
}

function cleanupExpiredRateLimitEntries(now: number) {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

function createRateLimiter(
  scope: string,
  {
    windowMs,
    max,
    message,
    keyResolver,
  }: {
    windowMs: number;
    max: number;
    message: string;
    keyResolver?: (request: Request) => string;
  },
) {
  return (request: Request, response: Response, next: NextFunction) => {
    const now = Date.now();
    if (rateLimitStore.size > 5_000) {
      cleanupExpiredRateLimitEntries(now);
    }

    const keyBase = keyResolver ? keyResolver(request) : getClientIdentifier(request);
    const key = `${scope}:${keyBase}`;
    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt <= now) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      next();
      return;
    }

    if (entry.count >= max) {
      response.setHeader("Retry-After", String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
      next(new AppError(429, message));
      return;
    }

    entry.count += 1;
    rateLimitStore.set(key, entry);
    next();
  };
}

const authRateLimiter = createRateLimiter("auth", {
  windowMs: 15 * 60 * 1000,
  max: 12,
  message: "Muitas tentativas de autenticação. Aguarde alguns minutos e tente novamente.",
});

const supabaseBridgeRateLimiter = createRateLimiter("supabase-bridge", {
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: "Muitas validações de sessão em seguida. Aguarde alguns instantes.",
});

const contactChangeRequestRateLimiter = createRateLimiter("contact-change-request", {
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Muitas solicitações de código. Aguarde alguns minutos antes de tentar de novo.",
  keyResolver: (request) => request.currentUser?.id ?? getClientIdentifier(request),
});

const contactChangeConfirmRateLimiter = createRateLimiter("contact-change-confirm", {
  windowMs: 10 * 60 * 1000,
  max: 12,
  message: "Muitas tentativas de confirmação. Solicite um novo código em alguns minutos.",
  keyResolver: (request) => request.currentUser?.id ?? getClientIdentifier(request),
});

const avatarUploadRateLimiter = createRateLimiter("avatar-upload", {
  windowMs: 10 * 60 * 1000,
  max: 8,
  message: "Muitos envios de foto em seguida. Aguarde alguns minutos.",
  keyResolver: (request) => request.currentUser?.id ?? getClientIdentifier(request),
});

const helpRequestRateLimiter = createRateLimiter("help-request", {
  windowMs: 10 * 60 * 1000,
  max: 8,
  message: "Muitas solicitações de apoio em pouco tempo. Aguarde alguns minutos.",
  keyResolver: (request) => request.currentUser?.id ?? getClientIdentifier(request),
});

const chatCreateRateLimiter = createRateLimiter("chat-create", {
  windowMs: 10 * 60 * 1000,
  max: 6,
  message: "Muitos chamados de chat abertos em sequencia. Aguarde alguns minutos.",
  keyResolver: (request) => request.currentUser?.id ?? getClientIdentifier(request),
});

const chatMessageRateLimiter = createRateLimiter("chat-message", {
  windowMs: 60 * 1000,
  max: 30,
  message: "Muitas mensagens em pouco tempo. Aguarde alguns segundos e tente novamente.",
  keyResolver: (request) => request.currentUser?.id ?? getClientIdentifier(request),
});

async function findSupabaseAuthUserByEmail(email: string): Promise<{ id: string } | null> {
  const supabase = requireSupabaseAdmin();
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      throw new AppError(502, "Não foi possível consultar usuários no Supabase.");
    }

    const users = data.users as Array<{ id: string; email?: string | null }>;
    const user = users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user || users.length < 100) {
      return user ?? null;
    }

    page += 1;
  }
}

async function ensureSupabaseAuthUserForInternalAccount(payload: z.infer<typeof internalUserSchema>) {
  const supabase = requireSupabaseAdmin();
  const email = payload.email.trim().toLowerCase();
  const metadata = {
    perfil: payload.perfil,
    nomeCompleto: payload.nomeCompleto.trim(),
    organizationId: payload.organizationId,
  };
  const existingUser = await findSupabaseAuthUserByEmail(email);

  if (existingUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      email,
      password: payload.password,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (error || !data.user) {
      throw new AppError(502, "Não foi possível atualizar a conta no Supabase.");
    }

    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: payload.password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (error || !data.user) {
    throw new AppError(502, "Não foi possível criar a conta no Supabase.");
  }

  return data.user;
}

async function ensureProfileAvatarBucket() {
  if (!ensureProfileAvatarBucketPromise) {
    ensureProfileAvatarBucketPromise = (async () => {
      const supabase = requireSupabaseAdmin();
      const { data, error } = await supabase.storage.listBuckets();

      if (error) {
        throw new AppError(502, "Não foi possível consultar os buckets de arquivos.");
      }

      const exists = data.some((bucket) => bucket.name === PROFILE_AVATAR_BUCKET);
      if (!exists) {
        const created = await supabase.storage.createBucket(PROFILE_AVATAR_BUCKET, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024,
          allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        });

        if (created.error) {
          throw new AppError(502, "Não foi possível preparar o armazenamento de fotos.");
        }
      }
    })().catch((error) => {
      ensureProfileAvatarBucketPromise = null;
      throw error;
    });
  }

  return ensureProfileAvatarBucketPromise;
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
      contactChangeRequests: {
        where: {
          verifiedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

async function getUserForSupabaseAuth(supabaseAuthUserId: string) {
  return prisma.user.findUnique({
    where: { supabaseAuthUserId },
    include: {
      organization: true,
      womanProfile: true,
      professionalProfile: true,
      managerProfile: true,
      contactChangeRequests: {
        where: {
          verifiedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

async function buildProfileResponse(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organization: true,
      womanProfile: true,
      professionalProfile: true,
      managerProfile: true,
      contactChangeRequests: {
        where: {
          verifiedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    throw new AppError(404, "Conta não encontrada.");
  }

  return {
    user: serializeSessionUser(user),
    womanProfile: user.womanProfile ? serializeWomanProfile(user.womanProfile) : null,
    pendingContactChanges: user.contactChangeRequests.map(serializePendingContactChange),
  };
}

function parseCookieHeader(rawCookie: string | undefined) {
  if (!rawCookie) return new Map<string, string>();

  return new Map(
    rawCookie
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [name, ...value] = item.split("=");
        return [name, decodeURIComponent(value.join("="))] as const;
      }),
  );
}

async function getSocketUser(request: IncomingMessage) {
  const cookies = parseCookieHeader(request.headers.cookie);
  const token = cookies.get(config.cookieName);

  if (!token) {
    return null;
  }

  try {
    const payload = verifyAuthToken(token);
    const user = await getUserForSession(payload.sub);
    if (!user || !user.isActive) {
      return null;
    }

    return user as CurrentUser;
  } catch {
    return null;
  }
}

function registerSocketConnection(socket: RealtimeSocket) {
  const userSockets = socketsByUser.get(socket.currentUserId) ?? new Set<RealtimeSocket>();
  userSockets.add(socket);
  socketsByUser.set(socket.currentUserId, userSockets);

  if (socket.currentUserRole === Role.PROFISSIONAL || socket.currentUserRole === Role.GESTORA) {
    internalSockets.add(socket);
  }
}

function unregisterSocketConnection(socket: RealtimeSocket) {
  const userSockets = socketsByUser.get(socket.currentUserId);
  if (userSockets) {
    userSockets.delete(socket);
    if (userSockets.size === 0) {
      socketsByUser.delete(socket.currentUserId);
    }
  }

  if (socket.currentUserRole === Role.PROFISSIONAL || socket.currentUserRole === Role.GESTORA) {
    internalSockets.delete(socket);
  }
}

function sendSocketEvent(socket: WebSocket, payload: Record<string, unknown>) {
  if (socket.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(JSON.stringify(payload));
}

function broadcastChatUpdate(ticket: { id: string; ownerUserId: string }) {
  const ownerSockets = socketsByUser.get(ticket.ownerUserId) ?? new Set<RealtimeSocket>();
  const deliveredSockets = new Set<WebSocket>();

  // Mulher e contas internas precisam receber a mesma notificação de atualização.
  for (const socket of [...ownerSockets, ...internalSockets]) {
    if (deliveredSockets.has(socket)) continue;
    deliveredSockets.add(socket);
    sendSocketEvent(socket, {
      type: "chat.updated",
      chatId: ticket.id,
    });
  }
}

function setSessionCookie(response: Response, userId: string, role: Role) {
  response.cookie(config.cookieName, signAuthToken(userId, role), buildAuthCookieOptions());
  response.cookie(config.cookieName + "_refresh", signRefreshToken(userId, role), buildRefreshCookieOptions());
}

function clearSessionCookie(response: Response) {
  response.clearCookie(config.cookieName, { ...buildAuthCookieOptions(), maxAge: undefined });
  response.clearCookie(config.cookieName + "_refresh", { ...buildRefreshCookieOptions(), maxAge: undefined });
}

function canUseLocalWomanSeedLogin(user: { role: Role; email: string }) {
  return (
    config.allowLocalWomanSeedLogin &&
    user.role === Role.MULHER &&
    user.email.toLowerCase().endsWith(WOMAN_SEED_EMAIL_DOMAIN)
  );
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

async function requireAuth(request: Request, response: Response, next: NextFunction) {
  const token = request.cookies[config.cookieName];
  const refreshToken = request.cookies[config.cookieName + "_refresh"];

  if (token) {
    try {
      const payload = verifyAuthToken(token);
      const user = await getUserForSession(payload.sub);

      if (!user || !user.isActive) {
        next(new AppError(401, "Sessao invalida."));
        return;
      }

      request.currentUser = user;
      next();
      return;
    } catch {
      // Access token failed, check refresh token
    }
  }

  if (refreshToken) {
    try {
      const payload = verifyAuthToken(refreshToken) as any;
      if (payload.type === "refresh") {
        const user = await getUserForSession(payload.sub);
        if (user && user.isActive) {
          setSessionCookie(response, user.id, user.role);
          request.currentUser = user;
          next();
          return;
        }
      }
    } catch {
      // Refresh token invalid
    }
  }

  const authorization = request.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null;

  if (!bearerToken) {
    next(new AppError(401, "Autenticação obrigatória."));
    return;
  }

  try {
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(bearerToken);

    if (error || !data.user) {
      next(new AppError(401, "Sessao Supabase invalida."));
      return;
    }

    const user = await getUserForSupabaseAuth(data.user.id);
    if (!user || !user.isActive) {
      next(new AppError(401, "Conta local vinculada não encontrada."));
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
      next(new AppError(401, "Autenticação obrigatória."));
      return;
    }

    if (!roles.includes(request.currentUser.role)) {
      next(new AppError(403, "Você não tem permissão para esta ação."));
      return;
    }

    next();
  };
}

function accessibleCaseWhere(user: CurrentUser): Prisma.CaseRecordWhereInput {
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

async function getAccessibleCaseOrThrow(caseId: string, user: CurrentUser) {
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
    throw new AppError(404, "Caso não encontrado.");
  }

  return caseRecord;
}

const chatTicketInclude = {
  ownerUser: true,
  assignedProfessionalUser: true,
  caseRecord: {
    include: {
      womanProfile: {
        include: {
          user: true,
        },
      },
    },
  },
  messages: {
    include: {
      senderUser: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  },
} satisfies Prisma.ChatTicketInclude;

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

function chatWhereForUser(user: CurrentUser): Prisma.ChatTicketWhereInput {
  if (user.role === Role.MULHER) {
    return {
      ownerUserId: user.id,
    };
  }

  return {};
}

async function getAccessibleChatOrThrow(ticketId: string, user: CurrentUser) {
  const ticket = await prisma.chatTicket.findFirst({
    where: {
      id: ticketId,
      AND: chatWhereForUser(user),
    },
    include: chatTicketInclude,
  });

  if (!ticket) {
    throw new AppError(404, "Chamado de chat não encontrado.");
  }

  return ticket;
}

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.post(
  "/api/session/register",
  authRateLimiter,
  asyncHandler(async (request, response) => {
    registerSchema.parse(request.body);
    throw new AppError(410, "O cadastro da Mulher e realizado pelo Supabase neste ambiente.");
  }),
);

app.post(
  "/api/session/login",
  authRateLimiter,
  asyncHandler(async (request, response) => {
    const payload = loginSchema.parse(request.body);
    if (isProduction) {
      throw new AppError(410, "A autenticação é realizada pelo Supabase neste ambiente.");
    }
    const email = payload.email.trim().toLowerCase();

    if (payload.perfil === "mulher" && !config.allowLocalWomanSeedLogin) {
      throw new AppError(403, "O acesso da Mulher e realizado pelo Supabase neste ambiente.");
    }

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

    if (user.role === Role.MULHER && !canUseLocalWomanSeedLogin(user)) {
      throw new AppError(403, "O acesso da Mulher e realizado pelo Supabase neste ambiente.");
    }

    const isValidPassword = await verifyPassword(payload.password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError(401, "Credenciais invalidas.");
    }

    if (payload.perfil && payload.perfil !== toRoleLabel(user.role)) {
      throw new AppError(403, "Esta conta não pertence ao perfil selecionado.");
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

app.post(
  "/api/session/supabase",
  supabaseBridgeRateLimiter,
  asyncHandler(async (request, response) => {
    const payload = supabaseSessionBridgeSchema.parse(request.body);
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(payload.accessToken);

    if (error || !data.user || !data.user.email) {
      throw new AppError(401, "Não foi possível validar a sessão no Supabase.");
    }

    const email = data.user.email.trim().toLowerCase();
    const expectedRole = payload.perfil ? roleFromSessionLabel(payload.perfil) : null;
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ supabaseAuthUserId: data.user.id }, { email }],
      },
      include: {
        organization: true,
        womanProfile: true,
        professionalProfile: true,
        managerProfile: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError(403, "Conta não autorizada para este ambiente.");
    }

    if (expectedRole && user.role !== expectedRole) {
      throw new AppError(403, "Esta conta não pertence ao perfil selecionado.");
    }

    if (user.supabaseAuthUserId !== data.user.id || user.email !== email) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email,
          supabaseAuthUserId: data.user.id,
        },
        include: {
          organization: true,
          womanProfile: true,
          professionalProfile: true,
          managerProfile: true,
        },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    setSessionCookie(response, user.id, user.role);
    await audit(request, "auth.supabase-login", "user", user.id, { role: toRoleLabel(user.role) });

    response.json({
      user: serializeSessionUser(user),
    });
  }),
);

app.post("/api/session/logout", (request, response) => {
  clearSessionCookie(response);
  response.status(204).send();
});

app.get(
  "/api/session/me",
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
    response.json(await buildProfileResponse(request.currentUser!.id));
  }),
);

app.patch(
  "/api/profile",
  requireAuth,
  asyncHandler(async (request, response) => {
    const payload = updateProfileSchema.parse(request.body);
    const currentUser = request.currentUser!;
    const nextEmail = normalizeEmail(payload.email);
    const nextPhone = normalizePhone(payload.telefone ?? "");
    const nextPassword = payload.novaSenha?.trim() || undefined;

    if (nextEmail !== currentUser.email) {
      throw new AppError(409, "Use a confirmação por código para alterar o e-mail.");
    }

    if (currentUser.role === Role.MULHER) {
      const currentPhone = currentUser.womanProfile?.phone ?? "";
      if (nextPhone !== currentPhone) {
        throw new AppError(409, "Use a confirmação por código para alterar o celular.");
      }
    }

    if (currentUser.supabaseAuthUserId) {
      const supabaseAttributes: { password?: string } = {};

      if (nextPassword) {
        supabaseAttributes.password = nextPassword;
      }

      if (Object.keys(supabaseAttributes).length > 0) {
        const supabase = requireSupabaseAdmin();
        const { error } = await supabase.auth.admin.updateUserById(currentUser.supabaseAuthUserId, supabaseAttributes);

        if (error) {
          throw new AppError(502, "Não foi possível atualizar a conta vinculada no Supabase.");
        }
      }
    }

    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        email: nextEmail,
        passwordHash: nextPassword ? await hashPassword(nextPassword) : undefined,
        womanProfile:
          currentUser.role === Role.MULHER && currentUser.womanProfile
            ? {
                update: {
                  phone: nextPhone || currentUser.womanProfile.phone,
                },
              }
            : undefined,
      },
      include: {
        organization: true,
        womanProfile: true,
        professionalProfile: true,
        managerProfile: true,
      },
    });

    await audit(request, "profile.updated", "user", user.id, {
      emailChanged: false,
      phoneChanged: false,
      passwordChanged: Boolean(nextPassword),
    });

    response.json(await buildProfileResponse(user.id));
  }),
);

app.post(
  "/api/profile/contact-changes/request",
  requireAuth,
  contactChangeRequestRateLimiter,
  asyncHandler(async (request, response) => {
    const payload = requestContactChangeSchema.parse(request.body);
    const currentUser = request.currentUser!;
    const type = toContactChangeType(payload.tipo);
    const nextValue = type === ContactChangeType.EMAIL ? normalizeEmail(payload.valor) : normalizePhone(payload.valor);
    const currentValue = type === ContactChangeType.EMAIL ? currentUser.email : currentUser.womanProfile?.phone ?? "";

    if (type === ContactChangeType.EMAIL) {
      const existingUserWithEmail = await prisma.user.findFirst({
        where: {
          email: nextValue,
          NOT: { id: currentUser.id },
        },
      });

      if (existingUserWithEmail) {
        throw new AppError(409, "Já existe outra conta com este e-mail.");
      }
    } else {
      if (currentUser.role !== Role.MULHER || !currentUser.womanProfile) {
        throw new AppError(403, "A troca de celular esta disponivel apenas para a conta da Mulher.");
      }

      if (nextValue.length < 10) {
        throw new AppError(400, "Informe um telefone válido.");
      }
    }

    if (!nextValue || nextValue === currentValue) {
      throw new AppError(400, `Informe um ${payload.tipo === "email" ? "e-mail" : "celular"} diferente do atual.`);
    }

    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + CONTACT_CHANGE_CODE_TTL_MINUTES * 60 * 1000);

    const pendingChange = await prisma.$transaction(async (transaction) => {
      await transaction.contactChangeRequest.deleteMany({
        where: {
          userId: currentUser.id,
          type,
          verifiedAt: null,
        },
      });

      return transaction.contactChangeRequest.create({
        data: {
          userId: currentUser.id,
          type,
          currentValue,
          nextValue,
          codeHash: hashVerificationCode(currentUser.id, type, nextValue, verificationCode),
          expiresAt,
          maxAttempts: CONTACT_CHANGE_MAX_ATTEMPTS,
        },
      });
    });

    if (type === ContactChangeType.EMAIL) {
      try {
        await sendContactChangeOtpEmail({
          to: nextValue,
          name: currentUser.fullName,
          code: verificationCode,
          destinationMasked: serializePendingContactChange(pendingChange).destinoMascarado,
          expiresInMinutes: CONTACT_CHANGE_CODE_TTL_MINUTES,
        });
      } catch (error) {
        await prisma.contactChangeRequest.delete({ where: { id: pendingChange.id } }).catch(() => undefined);
        throw error;
      }
    } else if (!config.otpDebugPreview) {
      await prisma.contactChangeRequest.delete({ where: { id: pendingChange.id } }).catch(() => undefined);
      throw new AppError(503, "O envio do código por celular ainda não foi configurado neste ambiente.");
    }

    await audit(request, "profile.contact_change.requested", "user", currentUser.id, {
      tipo: payload.tipo,
      destinoMascarado: serializePendingContactChange(pendingChange).destinoMascarado,
      entrega:
        type === ContactChangeType.EMAIL
          ? config.resendApiKey && config.emailFrom
            ? "email"
            : config.otpDebugPreview
              ? "preview"
              : "nao_configurado"
          : config.otpDebugPreview
            ? "preview"
            : "nao_configurado",
    });

    response.status(201).json({
      pendingChange: serializePendingContactChange(pendingChange),
      previewCode: config.otpDebugPreview ? verificationCode : undefined,
    });
  }),
);

app.post(
  "/api/profile/contact-changes/confirm",
  requireAuth,
  contactChangeConfirmRateLimiter,
  asyncHandler(async (request, response) => {
    const payload = confirmContactChangeSchema.parse(request.body);
    const currentUser = request.currentUser!;
    const type = toContactChangeType(payload.tipo);

    const pendingChange = await prisma.contactChangeRequest.findFirst({
      where: {
        userId: currentUser.id,
        type,
        verifiedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!pendingChange) {
      throw new AppError(404, "Nenhuma confirmação pendente foi encontrada.");
    }

    if (pendingChange.expiresAt.getTime() <= Date.now()) {
      await prisma.contactChangeRequest.delete({ where: { id: pendingChange.id } });
      throw new AppError(410, "O código expirou. Solicite um novo código.");
    }

    const expectedHash = hashVerificationCode(currentUser.id, type, pendingChange.nextValue, payload.codigo);
    if (expectedHash !== pendingChange.codeHash) {
      const attempts = pendingChange.attempts + 1;

      if (attempts >= pendingChange.maxAttempts) {
        await prisma.contactChangeRequest.delete({ where: { id: pendingChange.id } });
        await audit(request, "profile.contact_change.failed", "user", currentUser.id, {
          tipo: payload.tipo,
          motivo: "max_attempts_reached",
        });
        throw new AppError(429, "Código inválido. Solicite um novo código.");
      }

      await prisma.contactChangeRequest.update({
        where: { id: pendingChange.id },
        data: {
          attempts,
        },
      });

      throw new AppError(401, "Código inválido.");
    }

    if (type === ContactChangeType.EMAIL) {
      const existingUserWithEmail = await prisma.user.findFirst({
        where: {
          email: pendingChange.nextValue,
          NOT: { id: currentUser.id },
        },
      });

      if (existingUserWithEmail) {
        throw new AppError(409, "Já existe outra conta com este e-mail.");
      }

      if (currentUser.supabaseAuthUserId) {
        const supabase = requireSupabaseAdmin();
        const { error } = await supabase.auth.admin.updateUserById(currentUser.supabaseAuthUserId, {
          email: pendingChange.nextValue,
          email_confirm: true,
        });

        if (error) {
          throw new AppError(502, "Não foi possível atualizar o e-mail vinculado no Supabase.");
        }
      }
    }

    await prisma.$transaction(async (transaction) => {
      if (type === ContactChangeType.EMAIL) {
        await transaction.user.update({
          where: { id: currentUser.id },
          data: {
            email: pendingChange.nextValue,
          },
        });
      } else {
        await transaction.womanProfile.update({
          where: { userId: currentUser.id },
          data: {
            phone: pendingChange.nextValue,
          },
        });
      }

      await transaction.contactChangeRequest.update({
        where: { id: pendingChange.id },
        data: {
          verifiedAt: new Date(),
        },
      });
    });

    await audit(request, "profile.contact_change.confirmed", "user", currentUser.id, {
      tipo: payload.tipo,
    });

    response.json(await buildProfileResponse(currentUser.id));
  }),
);

app.post(
  "/api/profile/avatar",
  requireAuth,
  avatarUploadRateLimiter,
  asyncHandler(async (request, response) => {
    const payload = updateProfileAvatarSchema.parse(request.body);
    const currentUser = request.currentUser!;
    const base64Payload = payload.imageBase64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Payload, "base64");

    if (!buffer.length || buffer.length > 5 * 1024 * 1024) {
      throw new AppError(400, "Arquivo de imagem inválido ou acima do limite de 5 MB.");
    }

    await ensureProfileAvatarBucket();

    const safeFileName = payload.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
    const extension = payload.contentType === "image/png" ? "png" : payload.contentType === "image/webp" ? "webp" : "jpg";
    const filePath = `${currentUser.id}/${Date.now()}-${safeFileName}.${extension}`;
    const supabase = requireSupabaseAdmin();
    const uploaded = await supabase.storage.from(PROFILE_AVATAR_BUCKET).upload(filePath, buffer, {
      contentType: payload.contentType,
      upsert: true,
    });

    if (uploaded.error) {
      throw new AppError(502, "Não foi possível enviar a foto para o armazenamento.");
    }

    const publicUrl = supabase.storage.from(PROFILE_AVATAR_BUCKET).getPublicUrl(filePath).data.publicUrl;
    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        avatarUrl: publicUrl,
      },
      include: {
        organization: true,
        womanProfile: true,
        professionalProfile: true,
        managerProfile: true,
      },
    });

    await audit(request, "profile.avatar.updated", "user", user.id);

    response.json(await buildProfileResponse(user.id));
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
  helpRequestRateLimiter,
  asyncHandler(async (request, response) => {
    const payload = supportRequestSchema.parse(request.body);
    const womanProfile = request.currentUser!.womanProfile;

    if (!womanProfile) {
      throw new AppError(400, "Perfil de mulher não encontrado.");
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
        throw new AppError(500, "Nenhum órgão base configurado.");
      }

      caseRecord = await prisma.caseRecord.create({
        data: {
          protocol: generateProtocol(),
          womanProfileId: womanProfile.id,
          createdByUserId: request.currentUser!.id,
          entryOrganizationId: defaultOrganization.id,
          currentOrganizationId: defaultOrganization.id,
          intakeSummary: payload.mensagem?.trim() || `Solicitação de apoio: ${payload.tipo}`,
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

app.post(
  "/api/session/women/supabase",
  supabaseBridgeRateLimiter,
  asyncHandler(async (request, response) => {
    const payload = supabaseWomanBridgeSchema.parse(request.body);
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(payload.accessToken);

    if (error || !data.user || !data.user.email) {
      throw new AppError(401, "Não foi possível validar a sessão da Mulher no Supabase.");
    }

    const email = data.user.email.trim().toLowerCase();
    const metadata = data.user.user_metadata ?? {};
    const profile = payload.profile;
    const fullName = String(
      metadata.nomeCompleto ??
        metadata.full_name ??
        profile?.nomeCompleto ??
        data.user.email.split("@")[0],
    ).trim();

    const existingUser =
      (await prisma.user.findFirst({
        where: {
          OR: [{ supabaseAuthUserId: data.user.id }, { email }],
        },
        include: {
          organization: true,
          womanProfile: true,
          professionalProfile: true,
          managerProfile: true,
        },
      })) ?? null;

    if (existingUser && existingUser.role !== Role.MULHER) {
      throw new AppError(409, "Este e-mail ja pertence a uma conta interna. Use o acesso da equipe.");
    }

    const cpf =
      String(metadata.cpf ?? profile?.cpf ?? existingUser?.womanProfile?.cpf ?? "")
        .replace(/\D/g, "");
    const dataNascimento = String(
      metadata.dataNascimento ?? profile?.dataNascimento ?? existingUser?.womanProfile?.birthDate.toISOString().slice(0, 10) ?? "",
    );
    const telefone =
      String(metadata.telefone ?? profile?.telefone ?? existingUser?.womanProfile?.phone ?? "")
        .replace(/\D/g, "");
    const endereco = String(metadata.endereco ?? profile?.endereco ?? existingUser?.womanProfile?.addressLine ?? "").trim();
    const municipio = String(metadata.municipio ?? profile?.municipio ?? existingUser?.womanProfile?.city ?? "").trim();
    const uf = String(metadata.uf ?? profile?.uf ?? existingUser?.womanProfile?.state ?? "").trim().toUpperCase();
    const nomeSocial = String(metadata.nomeSocial ?? profile?.nomeSocial ?? existingUser?.womanProfile?.socialName ?? "").trim();

    if (!cpf || !dataNascimento || !telefone || !endereco || !municipio || !uf) {
      throw new AppError(400, "Os dados de perfil da Mulher ainda não estão completos para vincular a conta.");
    }

    const conflictingCpfProfile = await prisma.womanProfile.findUnique({
      where: { cpf },
      include: { user: true },
    });

    if (
      conflictingCpfProfile &&
      (!existingUser || conflictingCpfProfile.userId !== existingUser.id)
    ) {
      throw new AppError(409, "Ja existe uma conta de Mulher vinculada a este CPF.");
    }

    let user = existingUser;

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email,
          supabaseAuthUserId: data.user.id,
          fullName,
          role: Role.MULHER,
          isActive: true,
          womanProfile: user.womanProfile
            ? {
                update: {
                  socialName: nomeSocial || null,
                  cpf,
                  birthDate: new Date(`${dataNascimento}T12:00:00.000Z`),
                  phone: telefone,
                  addressLine: endereco,
                  city: municipio,
                  state: uf,
                },
              }
            : {
                create: {
                  socialName: nomeSocial || null,
                  cpf,
                  birthDate: new Date(`${dataNascimento}T12:00:00.000Z`),
                  phone: telefone,
                  addressLine: endereco,
                  city: municipio,
                  state: uf,
                },
              },
        },
        include: {
          organization: true,
          womanProfile: true,
          professionalProfile: true,
          managerProfile: true,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          supabaseAuthUserId: data.user.id,
          passwordHash: await hashPassword(randomUUID()),
          fullName,
          role: Role.MULHER,
          womanProfile: {
            create: {
              socialName: nomeSocial || null,
              cpf,
              birthDate: new Date(`${dataNascimento}T12:00:00.000Z`),
              phone: telefone,
              addressLine: endereco,
              city: municipio,
              state: uf,
            },
          },
        },
        include: {
          organization: true,
          womanProfile: true,
          professionalProfile: true,
          managerProfile: true,
        },
      });
    }

    setSessionCookie(response, user.id, Role.MULHER);

    response.json({
      user: serializeSessionUser(user),
    });
  }),
);

app.get(
  "/api/chats",
  requireAuth,
  asyncHandler(async (request, response) => {
    const chats = await prisma.chatTicket.findMany({
      where: chatWhereForUser(request.currentUser!),
      include: chatTicketInclude,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    response.json({
      chats: chats.map(serializeChatTicket),
    });
  }),
);

app.get(
  "/api/chats/:id",
  requireAuth,
  asyncHandler(async (request, response) => {
    const ticket = await getAccessibleChatOrThrow(String(request.params.id ?? ""), request.currentUser!);
    response.json({
      chat: serializeChatTicket(ticket),
    });
  }),
);

app.post(
  "/api/chats",
  requireAuth,
  requireRole(Role.MULHER),
  chatCreateRateLimiter,
  asyncHandler(async (request, response) => {
    const payload = createChatSchema.parse(request.body ?? {});

    const existing = await prisma.chatTicket.findFirst({
      where: {
        ownerUserId: request.currentUser!.id,
        queue: "assistencia_social",
        status: {
          not: ChatTicketStatus.ENCERRADO,
        },
      },
      include: chatTicketInclude,
      orderBy: { updatedAt: "desc" },
    });

    if (existing) {
      response.json({
        chat: serializeChatTicket(existing),
      });
      return;
    }

    const latestCase = await prisma.caseRecord.findFirst({
      where: {
        womanProfile: {
          userId: request.currentUser!.id,
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    const created = await prisma.$transaction(async (tx) => {
      const ticket = await tx.chatTicket.create({
        data: {
          caseId: latestCase?.id ?? null,
          ownerUserId: request.currentUser!.id,
          channel: "chat_protegido",
          queue: "assistencia_social",
          subject: "Atendimento especializado",
          context: payload.context?.trim() || "Solicitação de acolhimento com atendimento especializado.",
          unreadForWoman: 1,
          unreadForTeam: 1,
        },
      });

      await tx.chatMessage.create({
        data: {
          ticketId: ticket.id,
          senderName: "Sistema",
          body: "Seu chamado foi registrado. Uma assistente social de plantao podera assumir a conversa assim que houver disponibilidade.",
          isSystem: true,
        },
      });

      return tx.chatTicket.findUniqueOrThrow({
        where: { id: ticket.id },
        include: chatTicketInclude,
      });
    });

    await audit(request, "chat.created", "chat_ticket", created.id, {
      caseId: created.caseId,
      queue: created.queue,
    });
    broadcastChatUpdate(created);

    response.status(201).json({
      chat: serializeChatTicket(created),
    });
  }),
);

app.post(
  "/api/chats/:id/messages",
  requireAuth,
  chatMessageRateLimiter,
  asyncHandler(async (request, response) => {
    const payload = chatMessageSchema.parse(request.body);
    const ticketId = String(request.params.id ?? "");
    const currentUser = request.currentUser!;
    const ticket = await getAccessibleChatOrThrow(ticketId, currentUser);

    if (ticket.status === ChatTicketStatus.ENCERRADO) {
      throw new AppError(400, "Este atendimento ja foi encerrado.");
    }

    if (
      currentUser.role !== Role.MULHER &&
      ticket.assignedProfessionalUserId &&
      ticket.assignedProfessionalUserId !== currentUser.id
    ) {
      throw new AppError(403, "Este chat esta sendo conduzido por outra conta interna.");
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.chatMessage.create({
        data: {
          ticketId,
          senderUserId: currentUser.id,
          senderName: currentUser.fullName,
          body: payload.body.trim(),
        },
      });

      await tx.chatTicket.update({
        where: { id: ticketId },
        data: {
          status: ticket.assignedProfessionalUserId ? ChatTicketStatus.EM_ATENDIMENTO : ticket.status,
          unreadForWoman: currentUser.role === Role.MULHER ? 0 : { increment: 1 },
          unreadForTeam: currentUser.role === Role.MULHER ? { increment: 1 } : 0,
        },
      });

      return tx.chatTicket.findUniqueOrThrow({
        where: { id: ticketId },
        include: chatTicketInclude,
      });
    });
    broadcastChatUpdate(updated);

    response.status(201).json({
      chat: serializeChatTicket(updated),
    });
  }),
);

app.post(
  "/api/chats/:id/assume",
  requireAuth,
  requireRole(Role.PROFISSIONAL, Role.GESTORA),
  asyncHandler(async (request, response) => {
    const ticketId = String(request.params.id ?? "");
    const currentUser = request.currentUser!;
    const ticket = await getAccessibleChatOrThrow(ticketId, currentUser);

    if (ticket.status === ChatTicketStatus.ENCERRADO) {
      throw new AppError(400, "Este atendimento ja foi encerrado.");
    }

    if (ticket.assignedProfessionalUserId && ticket.assignedProfessionalUserId !== currentUser.id) {
      throw new AppError(409, "Este chat ja foi assumido por outra conta interna.");
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.chatTicket.update({
        where: { id: ticketId },
        data: {
          status: ChatTicketStatus.EM_ATENDIMENTO,
          assignedProfessionalUserId: currentUser.id,
          unreadForWoman: { increment: 1 },
          unreadForTeam: 0,
        },
      });

      await tx.chatMessage.create({
        data: {
          ticketId,
          senderName: "Sistema",
          body: `${currentUser.fullName} assumiu o atendimento e esta acompanhando esta conversa.`,
          isSystem: true,
        },
      });

      return tx.chatTicket.findUniqueOrThrow({
        where: { id: ticketId },
        include: chatTicketInclude,
      });
    });

    await audit(request, "chat.assumed", "chat_ticket", updated.id, {
      assignedProfessionalUserId: currentUser.id,
    });
    await createUserNotification({
      userId: updated.ownerUserId,
      title: "Chat assumido pela equipe",
      description: `${currentUser.fullName} assumiu seu atendimento e a conversa ja esta em acompanhamento.`,
      kind: NotificationKind.SUCCESS,
      action: "chat.assumed",
      entityType: "chat_ticket",
      entityId: updated.id,
    });
    broadcastChatUpdate(updated);

    response.json({
      chat: serializeChatTicket(updated),
    });
  }),
);

app.post(
  "/api/chats/:id/read",
  requireAuth,
  asyncHandler(async (request, response) => {
    const ticketId = String(request.params.id ?? "");
    const currentUser = request.currentUser!;
    await getAccessibleChatOrThrow(ticketId, currentUser);

    const updated = await prisma.chatTicket.update({
      where: { id: ticketId },
      data:
        currentUser.role === Role.MULHER
          ? {
              unreadForWoman: 0,
            }
          : {
              unreadForTeam: 0,
            },
      include: chatTicketInclude,
    });

    response.json({
      chat: serializeChatTicket(updated),
    });
  }),
);

app.post(
  "/api/chats/:id/close",
  requireAuth,
  requireRole(Role.PROFISSIONAL, Role.GESTORA),
  asyncHandler(async (request, response) => {
    const ticketId = String(request.params.id ?? "");
    const currentUser = request.currentUser!;
    const ticket = await getAccessibleChatOrThrow(ticketId, currentUser);

    if (
      ticket.assignedProfessionalUserId &&
      ticket.assignedProfessionalUserId !== currentUser.id &&
      currentUser.role !== Role.GESTORA
    ) {
      throw new AppError(403, "Este chat esta sendo conduzido por outra conta interna.");
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.chatTicket.update({
        where: { id: ticketId },
        data: {
          status: ChatTicketStatus.ENCERRADO,
          unreadForWoman: { increment: 1 },
          unreadForTeam: 0,
        },
      });

      await tx.chatMessage.create({
        data: {
          ticketId,
          senderName: "Sistema",
          body: "Atendimento encerrado. Caso precise, um novo chamado podera ser aberto a qualquer momento.",
          isSystem: true,
        },
      });

      return tx.chatTicket.findUniqueOrThrow({
        where: { id: ticketId },
        include: chatTicketInclude,
      });
    });

    await audit(request, "chat.closed", "chat_ticket", updated.id);
    await createUserNotification({
      userId: updated.ownerUserId,
      title: "Chat encerrado",
      description: "Seu atendimento no chat foi encerrado. Se precisar, voce pode abrir um novo contato protegido.",
      kind: NotificationKind.INFO,
      action: "chat.closed",
      entityType: "chat_ticket",
      entityId: updated.id,
    });
    broadcastChatUpdate(updated);

    response.json({
      chat: serializeChatTicket(updated),
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

app.post(
  "/api/cases",
  requireAuth,
  requireRole(Role.PROFISSIONAL, Role.GESTORA),
  asyncHandler(async (request, response) => {
    const payload = createCaseSchema.parse(request.body);
    const normalizedCpf = payload.cpf.replace(/\D/g, "");
    const fallbackOrganization = await prisma.organization.findFirst({
      where: { code: "sec-mulher" },
    });

    const currentOrganizationId = request.currentUser!.organizationId ?? fallbackOrganization?.id;

    if (!currentOrganizationId) {
      throw new AppError(500, "Nenhum órgão de referência foi encontrado para abrir o caso.");
    }

    const womanProfile = await prisma.$transaction(async (tx) => {
      const existingProfile = await tx.womanProfile.findUnique({
        where: { cpf: normalizedCpf },
        include: { user: true },
      });

      if (existingProfile) {
        await tx.user.update({
          where: { id: existingProfile.userId },
          data: {
            fullName: payload.nomeCompleto.trim(),
            isActive: true,
          },
        });

        return tx.womanProfile.update({
          where: { id: existingProfile.id },
          data: {
            socialName: payload.nomeSocial?.trim() || null,
            birthDate: new Date(`${payload.dataNascimento}T12:00:00.000Z`),
            phone: payload.telefone.replace(/\D/g, ""),
            addressLine: payload.endereco.trim(),
            city: payload.municipio.trim(),
            state: payload.uf.trim().toUpperCase(),
          },
        });
      }

      const placeholderEmail = `mulher+${normalizedCpf}@piloto.local`;
      const createdUser = await tx.user.create({
        data: {
          email: placeholderEmail,
          passwordHash: await hashPassword(randomUUID()),
          fullName: payload.nomeCompleto.trim(),
          role: Role.MULHER,
          isActive: true,
        },
      });

      return tx.womanProfile.create({
        data: {
          userId: createdUser.id,
          socialName: payload.nomeSocial?.trim() || null,
          cpf: normalizedCpf,
          birthDate: new Date(`${payload.dataNascimento}T12:00:00.000Z`),
          phone: payload.telefone.replace(/\D/g, ""),
          addressLine: payload.endereco.trim(),
          city: payload.municipio.trim(),
          state: payload.uf.trim().toUpperCase(),
        },
      });
    });

    const created = await prisma.caseRecord.create({
      data: {
        protocol: generateProtocol(),
        womanProfileId: womanProfile.id,
        createdByUserId: request.currentUser!.id,
        assignedProfessionalId: request.currentUser!.role === Role.PROFISSIONAL ? request.currentUser!.id : null,
        entryOrganizationId: currentOrganizationId,
        currentOrganizationId,
        intakeSummary: payload.observacoesIniciais.trim(),
        riskLevel: riskLevelFromLabel(payload.situacaoRisco),
        status: CaseStatus.ATIVO,
      },
      include: {
        womanProfile: { include: { user: true } },
        entryOrganization: true,
      },
    });

    await audit(request, "case.created", "case", created.id, {
      protocol: created.protocol,
      womanProfileId: womanProfile.id,
    });

    response.status(201).json({
      caso: serializeCaseSummary(created),
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
    await createUserNotification({
      userId: updated.womanProfile.user.id,
      title: "Caso atualizado",
      description: `Seu caso ${updated.protocol} avancou para o status ${toCaseStatusLabel(updated.status).replace(/_/g, " ")}.`,
      kind: NotificationKind.ALERT,
      action: "case.status.updated",
      entityType: "case",
      entityId: updated.id,
    });

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
    await createUserNotification({
      userId: caseRecord.womanProfile.user.id,
      title: "Novo atendimento registrado",
      description: `${request.currentUser!.fullName} registrou um novo atendimento no seu caso ${caseRecord.protocol}.`,
      kind: NotificationKind.SUCCESS,
      action: "attendance.created",
      entityType: "attendance",
      entityId: attendance.id,
    });

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
      throw new AppError(404, "Órgão de destino não encontrado.");
    }

    if (payload.atendimentoId) {
      const attendance = await prisma.attendance.findFirst({
        where: {
          id: payload.atendimentoId,
          caseId: caseRecord.id,
        },
      });

      if (!attendance) {
        throw new AppError(404, "Atendimento vinculado não encontrado.");
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
    await createUserNotification({
      userId: caseRecord.womanProfile.user.id,
      title: "Novo encaminhamento",
      description: `Seu caso ${caseRecord.protocol} recebeu encaminhamento para ${organization.code.toUpperCase()}.`,
      kind: NotificationKind.ALERT,
      action: "referral.created",
      entityType: "referral",
      entityId: referral.id,
    });

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
    if (!config.allowInternalUserAdminCreation) {
      throw new AppError(403, "A criação de contas internas está restrita ao processo administrativo do piloto.");
    }

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
      throw new AppError(404, "Órgão não encontrado.");
    }

    const role = roleFromLabel(payload.perfil);
    const supabaseUser = await ensureSupabaseAuthUserForInternalAccount(payload);
    const user = await prisma.user.create({
      data: {
        email: payload.email.trim().toLowerCase(),
        supabaseAuthUserId: supabaseUser.id,
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
  "/api/notifications/me",
  requireAuth,
  asyncHandler(async (request, response) => {
    const notifications = await prisma.userNotification.findMany({
      where: {
        userId: request.currentUser!.id,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    response.json({
      notifications: notifications.map(serializeUserNotification),
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

// ─── Panic Button ────────────────────────────────────────────────────────────

const panicSchema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
  timestamp: z.number().optional(),
});

app.post(
  "/api/panic",
  requireAuth,
  asyncHandler(async (request, response) => {
    const payload = panicSchema.parse(request.body);
    const user = request.currentUser!;

    await audit(request, "panic.triggered", "user", user.id, {
      lat: payload.lat,
      lng: payload.lng,
      timestamp: payload.timestamp ?? Date.now(),
    });

    // Notify all internal staff (profissional/gestora) via WebSocket
    for (const socket of internalSockets) {
      sendSocketEvent(socket, {
        type: "panic.alert",
        userId: user.id,
        userName: user.fullName,
        lat: payload.lat ?? null,
        lng: payload.lng ?? null,
        triggeredAt: new Date().toISOString(),
      });
    }

    response.json({ ok: true });
  }),
);

// ─── Mapa da Violência ────────────────────────────────────────────────────────

// Simple in-memory geocoding cache to avoid hammering Nominatim
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

async function geocodeCity(city: string, state: string): Promise<{ lat: number; lng: number } | null> {
  const key = `${city},${state},BR`;
  if (geocodeCache.has(key)) return geocodeCache.get(key)!;

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ", " + state + ", Brasil")}&format=json&limit=1`;
    const res = await fetch(url, { headers: { "User-Agent": "Athena-Platform/1.0" } });
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    const result = data[0] ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null;
    geocodeCache.set(key, result);
    return result;
  } catch {
    geocodeCache.set(key, null);
    return null;
  }
}

app.get(
  "/api/map/incidents",
  requireAuth,
  requireRole(Role.PROFISSIONAL, Role.GESTORA),
  asyncHandler(async (_request, response) => {
    const cases = await prisma.caseRecord.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        riskLevel: true,
        womanProfile: { select: { city: true, state: true } },
      },
    });

    // Group by city+state
    const grouped = new Map<string, { city: string; state: string; riskLevel: string; count: number }>();
    for (const c of cases) {
      const k = `${c.womanProfile.city}|${c.womanProfile.state}`;
      const existing = grouped.get(k);
      if (existing) {
        existing.count += 1;
        // Escalate risk level if higher
        const order = ["BAIXO", "MEDIO", "ALTO", "CRITICO"];
        if (order.indexOf(c.riskLevel) > order.indexOf(existing.riskLevel)) {
          existing.riskLevel = c.riskLevel;
        }
      } else {
        grouped.set(k, { city: c.womanProfile.city, state: c.womanProfile.state, riskLevel: c.riskLevel, count: 1 });
      }
    }

    // Geocode (limit to avoid overwhelming Nominatim on first call)
    const GEOCODE_LIMIT = 30;
    const entries = Array.from(grouped.values()).slice(0, GEOCODE_LIMIT);
    const incidents = await Promise.all(
      entries.map(async (entry) => {
        const coords = await geocodeCity(entry.city, entry.state);
        if (!coords) return null;
        return {
          id: `${entry.city}-${entry.state}`,
          city: entry.city,
          state: entry.state,
          riskLevel: entry.riskLevel,
          count: entry.count,
          lat: coords.lat,
          lng: coords.lng,
        };
      }),
    );

    response.json({ incidents: incidents.filter(Boolean) });
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

if (!isVercel) {
  server.listen(config.port, () => {
    console.log(`API ouvindo em http://localhost:${config.port}`);
  });
}

async function createUserNotification({
  userId,
  title,
  description,
  kind = NotificationKind.INFO,
  action,
  entityType,
  entityId,
}: {
  userId: string;
  title: string;
  description: string;
  kind?: NotificationKind;
  action: string;
  entityType?: string;
  entityId?: string;
}) {
  await prisma.userNotification.create({
    data: {
      userId,
      title,
      description,
      kind,
      action,
      entityType,
      entityId,
    },
  });
}

export default app;
