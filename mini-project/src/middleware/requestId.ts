import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

declare module "express-serve-static-core" {
  interface Request {
    id: string;
  }
}

export function requestId(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const id = randomUUID();
  req.id = id;
  res.setHeader("x-request-id", id);
  next();
}
