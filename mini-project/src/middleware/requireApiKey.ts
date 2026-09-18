import type { Request, Response, NextFunction } from "express";

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    res.status(401).json({ error: "Missing API key" });
    return;
  }

  next();
}