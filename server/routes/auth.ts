import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";

export const authRouter = Router();

// No clientId needed — getTokenInfo validates any access token
const client = new OAuth2Client();

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

authRouter.post("/google", async (req: Request, res: Response) => {
  const { token } = req.body as { token?: string };
  if (!token) { res.status(400).json({ error: "Missing token." }); return; }

  const secret = process.env.JWT_SECRET;
  if (!secret) { res.status(500).json({ error: "Server misconfigured." }); return; }

  try {
    // Validate the access token and extract email
    const tokenInfo = await client.getTokenInfo(token);
    const email = tokenInfo.email?.toLowerCase();
    if (!email) throw new Error("No email returned from token.");

    if (!email.endsWith("@umich.edu")) {
      res.status(403).json({ error: "Only @umich.edu accounts are allowed." });
      return;
    }

    // Fetch the user's profile (name, picture) using the access token
    const profileRes = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`,
    );
    const profile = profileRes.ok ? await profileRes.json() as { name?: string; picture?: string } : {};

    const user = {
      email,
      name: profile.name ?? email,
      picture: profile.picture ?? null,
      isAdmin: ADMIN_EMAILS.has(email),
    };

    const signed = jwt.sign(user, secret, { expiresIn: "7d" });
    res.cookie("auth_token", signed, COOKIE_OPTS);
    res.json({ ok: true, user });
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ error: "Authentication failed. Please try again." });
  }
});

authRouter.get("/me", (req: Request, res: Response) => {
  const token = (req as any).cookies?.auth_token;
  if (!token) { res.status(401).json({ user: null }); return; }
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET!) as object;
    res.json({ user });
  } catch {
    res.status(401).json({ user: null });
  }
});

authRouter.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("auth_token", { ...COOKIE_OPTS, maxAge: 0 });
  res.json({ ok: true });
});
