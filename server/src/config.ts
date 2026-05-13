import dotenv from "dotenv";

dotenv.config();

function parseOrigins(raw: string | undefined) {
  if (!raw) {
    return ["http://localhost:8080", "http://127.0.0.1:8080"];
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  appName: process.env.APP_NAME ?? "Athena",
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "12h",
  databaseUrl: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  cookieName: process.env.AUTH_COOKIE_NAME ?? "athena_auth",
  allowedOrigins: parseOrigins(process.env.APP_WEB_ORIGIN),
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  allowLocalWomanSeedLogin:
    process.env.ALLOW_LOCAL_WOMAN_SEED_LOGIN === "true" ||
    ((process.env.ALLOW_LOCAL_WOMAN_SEED_LOGIN ?? "") === "" && (process.env.NODE_ENV ?? "development") !== "production"),
  allowInternalUserAdminCreation:
    process.env.ALLOW_INTERNAL_USER_ADMIN_CREATION === "true" ||
    ((process.env.ALLOW_INTERNAL_USER_ADMIN_CREATION ?? "") === "" && (process.env.NODE_ENV ?? "development") !== "production"),
  otpDebugPreview:
    process.env.OTP_DEBUG_PREVIEW === "true" ||
    ((process.env.OTP_DEBUG_PREVIEW ?? "") === "" && (process.env.NODE_ENV ?? "development") !== "production"),
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "",
};

export const isProduction = config.nodeEnv === "production";
export const hasSupabaseServerConfig = Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);
