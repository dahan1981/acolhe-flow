import { PrismaClient } from "@prisma/client";

declare global {
  var __acolhePrisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__acolhePrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__acolhePrisma__ = prisma;
}
