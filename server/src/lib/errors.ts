import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function asyncHandler(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<unknown>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

export function errorHandler(
  error: unknown,
  request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      error: error.message,
      requestId: request.requestId,
    });
  }

  if (error instanceof ZodError) {
    return response.status(422).json({
      error: "Dados invalidos.",
      requestId: request.requestId,
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  console.error(
    JSON.stringify({
      level: "error",
      requestId: request.requestId,
      method: request.method,
      path: request.originalUrl,
      message: error instanceof Error ? error.message : "Unhandled error",
      stack: error instanceof Error ? error.stack : undefined,
    }),
  );
  return response.status(500).json({ error: "Erro interno do servidor.", requestId: request.requestId });
}
