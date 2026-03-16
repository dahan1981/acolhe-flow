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
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "12h",
  databaseUrl: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  cookieName: process.env.AUTH_COOKIE_NAME ?? "acolhe_auth",
  allowedOrigins: parseOrigins(process.env.APP_WEB_ORIGIN),
};

export const isProduction = config.nodeEnv === "production";
