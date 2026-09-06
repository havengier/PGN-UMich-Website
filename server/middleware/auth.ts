import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

export interface AuthUser {
  email: string;
  name?: string;
  picture?: string | null;
  isAdmin?: boolean;
  isBrother?: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = (req.cookies as Record<string, string>)?.auth_token;
  if (!token) {
    res.status(401).json({ error: "Unauthorized: Please log in with your @umich.edu Google account." });
    return;
  }

  const secret = process.env.JWT_SECRET || (process.env.NODE_ENV !== "production" ? "dev-secret-key-12345678901234567890" : undefined);
  if (!secret) {
    res.status(500).json({ error: "Server misconfigured: JWT_SECRET missing" });
    return;
  }

  try {
    const user = jwt.verify(token, secret) as AuthUser;
    if (!user || !user.email) {
      res.status(401).json({ error: "Invalid session" });
      return;
    }
    (req as AuthRequest).user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session. Please sign in again." });
  }
}
