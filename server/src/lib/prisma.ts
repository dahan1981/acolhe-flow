import path from "node:path";
import { PrismaClient } from "@prisma/client";

declare global {
  var __acolhePrisma__: PrismaClient | undefined;
}

function resolveDatasourceUrl() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    return `file:${path.resolve(process.cwd(), "prisma", "dev.db").replace(/\\/g, "/")}`;
  }

  if (url.startsWith("file:") && !path.isAbsolute(url.slice(5))) {
    return `file:${path.resolve(process.cwd(), "prisma", "dev.db").replace(/\\/g, "/")}`;
  }

  return url;
}

export const prisma =
  globalThis.__acolhePrisma__ ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolveDatasourceUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__acolhePrisma__ = prisma;
}
