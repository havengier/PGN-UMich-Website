import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import type { AuthRequest, AuthUser } from "./auth.js";

export function requireBrother(req: Request, res: Response, next: NextFunction): void {
  const token = (req.cookies as Record<string, string>)?.auth_token;
  if (!token) {
    res.status(401).json({ error: "Unauthorized: Please log in with your @umich.edu brother account." });
    return;
  }
  const secret = process.env.JWT_SECRET || (process.env.NODE_ENV !== "production" ? "dev-secret-key-12345678901234567890" : undefined);
  if (!secret) {
    res.status(500).json({ error: "Server misconfigured" });
    return;
  }
  try {
    const user = jwt.verify(token, secret) as AuthUser & { isBrother?: boolean };
    if (!user.isAdmin && !user.isBrother) {
      res.status(403).json({ error: "Forbidden: Brother access required" });
      return;
    }
    (req as AuthRequest).user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}
