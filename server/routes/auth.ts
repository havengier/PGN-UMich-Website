import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";

export const authRouter = Router();

const ALLOWED_DOMAINS = (process.env.ALLOWED_DOMAINS ?? "umich.edu")
  .split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);

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

function getClient() {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL}/api/auth/callback`,
  );
}

// Only allow same-origin redirect paths to prevent open redirect attacks
function safeRedirectPath(raw: unknown): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.includes("://")) return "/";
  return raw;
}

// Step 1: redirect browser to Google's OAuth consent screen
authRouter.get("/google", (req: Request, res: Response) => {
  if (!process.env.GOOGLE_CLIENT_SECRET || !process.env.APP_URL) {
    res.status(500).send("Server misconfigured: GOOGLE_CLIENT_SECRET or APP_URL is missing.");
    return;
  }
  const redirectTo = safeRedirectPath(req.query.redirect);
  const state = Buffer.from(redirectTo).toString("base64url");
  const authUrl = getClient().generateAuthUrl({
    access_type: "online",
    scope: ["openid", "email", "profile"],
    state,
  });
  res.redirect(authUrl);
});

// Step 2: Google redirects back here with the auth code
authRouter.get("/callback", async (req: Request, res: Response) => {
  const { code, state, error: oauthError } = req.query as Record<string, string>;
  const redirectTo = state ? safeRedirectPath(Buffer.from(state, "base64url").toString()) : "/";

  if (oauthError) {
    res.redirect(`${redirectTo}?auth_error=${encodeURIComponent(oauthError)}`);
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) { res.status(500).send("Server misconfigured."); return; }

  try {
    const oauthClient = getClient();
    const { tokens } = await oauthClient.getToken(code);
    if (!tokens.id_token) throw new Error("No ID token received.");

    const ticket = await new OAuth2Client(process.env.GOOGLE_CLIENT_ID).verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload?.email?.toLowerCase();
    if (!email) throw new Error("No email in token.");

    const domain = email.split("@")[1];
    if (!ALLOWED_DOMAINS.includes(domain)) {
      res.redirect(`${redirectTo}?auth_error=domain_not_allowed`);
      return;
    }

    const user = {
      email,
      name: payload?.name ?? email,
      picture: payload?.picture ?? null,
      isAdmin: ADMIN_EMAILS.has(email),
    };

    const signed = jwt.sign(user, secret, { expiresIn: "7d" });
    res.cookie("auth_token", signed, COOKIE_OPTS);
    res.redirect(redirectTo);
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.redirect(`${redirectTo}?auth_error=auth_failed`);
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

// Temporary: shows the exact redirect URI this server will send to Google
authRouter.get("/debug-redirect-uri", (_req: Request, res: Response) => {
  res.json({ redirectUri: `${process.env.APP_URL}/api/auth/callback` });
});
