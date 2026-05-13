import { PrismaClient } from "@prisma/client";

declare global {
  var __athenaPrisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__athenaPrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__athenaPrisma__ = prisma;
}
