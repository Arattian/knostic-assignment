import { Request, Response, NextFunction, RequestHandler } from "express";
import { Prisma } from "../generated/prisma/client";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`);
    this.name = "NotFoundError";
  }
}

// Express doesn't natively catch rejected promises from async handlers —
// without this wrapper, unhandled rejections crash the process instead of
// reaching the error middleware.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function asyncHandler(fn: (...args: any[]) => Promise<any>): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2025"
  ) {
    const model = (err.meta?.modelName as string) ?? "Resource";
    res.status(404).json({ error: `${model} not found` });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
}
