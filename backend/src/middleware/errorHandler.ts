import type { NextFunction, Request, Response } from "express";
import { isProd } from "@/config/env";

export class CustomError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = {
  badRequest: (message: string) => new CustomError(message, 400),
  unauthorized: (message: string) => new CustomError(message, 401),
  forbidden: (message: string) => new CustomError(message, 403),
  notFound: (message: string) => new CustomError(message, 404),
  conflict: (message: string) => new CustomError(message, 409),
  tooManyRequests: (message: string) => new CustomError(message, 429),
  internal: (message: string) => new CustomError(message, 500),
};

export const asyncHandler =
  <T extends Request = Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const statusCode = err instanceof CustomError ? err.statusCode : 500;
  const message = err instanceof CustomError && err.isOperational ? err.message : "Internal server error";

  if (statusCode >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(isProd ? {} : { stack: err.stack }),
  });
}
