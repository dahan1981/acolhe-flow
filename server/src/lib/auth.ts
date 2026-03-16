import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { config, isProduction } from "../config.js";

type AuthTokenPayload = {
  sub: string;
  role: Role;
};

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signAuthToken(userId: string, role: Role) {
  return jwt.sign(
    { sub: userId, role },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"],
    },
  );
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
}

export function buildAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: 1000 * 60 * 60 * 12,
  };
}
