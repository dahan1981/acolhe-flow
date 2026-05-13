const fs = require('fs');

// 1. Update server/src/lib/auth.ts
let auth = fs.readFileSync('server/src/lib/auth.ts', 'utf8');

auth = auth.replace(
  /export function signAuthToken\(userId: string, role: Role\) \{[\s\S]*?expiresIn: config\.jwtExpiresIn as jwt\.SignOptions\["expiresIn"\],[\s\S]*?\},[\s\S]*?\);[\s\S]*?\}/,
  `export function signAuthToken(userId: string, role: Role) {
  return jwt.sign(
    { sub: userId, role },
    config.jwtSecret,
    { expiresIn: "15m" }
  );
}

export function signRefreshToken(userId: string, role: Role) {
  return jwt.sign(
    { sub: userId, role, type: "refresh" },
    config.jwtSecret,
    { expiresIn: "7d" }
  );
}`
);

auth = auth.replace(
  /export function buildAuthCookieOptions\(\) \{[\s\S]*?maxAge: 1000 \* 60 \* 60 \* 12,[\s\S]*?\}/,
  `export function buildAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: 1000 * 60 * 15,
  };
}

export function buildRefreshCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  };
}`
);

fs.writeFileSync('server/src/lib/auth.ts', auth);

// 2. Update server/src/index.ts
let index = fs.readFileSync('server/src/index.ts', 'utf8');

index = index.replace(
  'import { buildAuthCookieOptions, hashPassword, signAuthToken, verifyAuthToken, verifyPassword } from "./lib/auth.js";',
  'import { buildAuthCookieOptions, buildRefreshCookieOptions, hashPassword, signAuthToken, signRefreshToken, verifyAuthToken, verifyPassword } from "./lib/auth.js";'
);

index = index.replace(
  /function setSessionCookie\(response: Response, userId: string, role: Role\) \{[\s\S]*?response\.cookie\(config\.cookieName, signAuthToken\(userId, role\), buildAuthCookieOptions\(\)\);[\s\S]*?\}/,
  `function setSessionCookie(response: Response, userId: string, role: Role) {
  response.cookie(config.cookieName, signAuthToken(userId, role), buildAuthCookieOptions());
  response.cookie(config.cookieName + "_refresh", signRefreshToken(userId, role), buildRefreshCookieOptions());
}`
);

index = index.replace(
  /function clearSessionCookie\(response: Response\) \{[\s\S]*?response\.clearCookie\(config\.cookieName, \{[\s\S]*?\.\.\.buildAuthCookieOptions\(\),[\s\S]*?maxAge: undefined,[\s\S]*?\}\);[\s\S]*?\}/,
  `function clearSessionCookie(response: Response) {
  response.clearCookie(config.cookieName, { ...buildAuthCookieOptions(), maxAge: undefined });
  response.clearCookie(config.cookieName + "_refresh", { ...buildRefreshCookieOptions(), maxAge: undefined });
}`
);

const oldRequireAuth = `async function requireAuth(request: Request, _response: Response, next: NextFunction) {
  const token = request.cookies[config.cookieName];

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
      // Continua para o fluxo Supabase apenas se a sessão local falhar.
    }
  }`;

const newRequireAuth = `async function requireAuth(request: Request, response: Response, next: NextFunction) {
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
  }`;

index = index.replace(oldRequireAuth, newRequireAuth);

fs.writeFileSync('server/src/index.ts', index);
