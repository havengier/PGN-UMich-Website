import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = (req.cookies as Record<string, string>)?.auth_token;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: "Server misconfigured" });
    return;
  }
  try {
    const user = jwt.verify(token, secret) as { isAdmin?: boolean };
    if (!user.isAdmin) {
      res.status(403).json({ error: "Forbidden: admin access required" });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}
