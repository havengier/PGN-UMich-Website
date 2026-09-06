import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import { isUserBrother } from "./recruitment.js";

export const authRouter = Router();

const ALLOWED_DOMAINS = (process.env.ALLOWED_DOMAINS ?? "umich.edu")
  .split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

const BROTHER_EMAILS = new Set(
  (process.env.BROTHER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

async function checkIsBrother(email: string, isAdmin: boolean): Promise<boolean> {
  if (isAdmin) return true;
  if (BROTHER_EMAILS.has(email)) return true;
  try {
    return await isUserBrother(email);
  } catch (err) {
    console.error("Error checking isUserBrother:", err);
    return false;
  }
}

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

    const isAdmin = ADMIN_EMAILS.has(email);
    const isBrother = await checkIsBrother(email, isAdmin);

    const user = {
      email,
      name: payload?.name ?? email,
      picture: payload?.picture ?? null,
      isAdmin,
      isBrother,
    };

    const signed = jwt.sign(user, secret, { expiresIn: "7d" });
    res.cookie("auth_token", signed, COOKIE_OPTS);
    res.redirect(redirectTo);
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.redirect(`${redirectTo}?auth_error=auth_failed`);
  }
});

authRouter.get("/me", async (req: Request, res: Response) => {
  const token = (req as any).cookies?.auth_token;
  if (!token) { res.status(401).json({ user: null }); return; }
  try {
    const secret = process.env.JWT_SECRET || (process.env.NODE_ENV !== "production" ? "dev-secret-key-12345678901234567890" : "");
    const user = jwt.verify(token, secret) as any;
    if (user && user.email) {
      const email = user.email.toLowerCase();
      const isAdmin = Boolean(user.isAdmin || ADMIN_EMAILS.has(email));
      const isBrother = await checkIsBrother(email, isAdmin);
      user.isAdmin = isAdmin;
      user.isBrother = isBrother;
    }
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

// Development mode login helper (only active when not in production or when Google OAuth is not configured)
if (process.env.NODE_ENV !== "production" || !process.env.GOOGLE_CLIENT_SECRET) {
  authRouter.all("/dev-login", async (req: Request, res: Response) => {
    const email = (req.body?.email || req.query.email) as string | undefined;
    const name = (req.body?.name || req.query.name) as string | undefined;
    const isAdmin = req.body?.isAdmin !== undefined
      ? Boolean(req.body.isAdmin)
      : req.query.admin === "1" || req.query.admin === "true" || (!email && req.query.brother !== "1" && req.query.brother !== "true");
    const userEmail = (email || (isAdmin ? "recruitment.chair@umich.edu" : (req.query.brother === "1" || req.query.brother === "true" ? "brother@umich.edu" : "applicant@umich.edu"))).toLowerCase();
    const explicitBrother = req.body?.isBrother !== undefined
      ? Boolean(req.body.isBrother)
      : (req.query.brother === "1" || req.query.brother === "true");
    const isBrother = isAdmin || explicitBrother || await checkIsBrother(userEmail, isAdmin);
    const redirectTo = (typeof req.query.redirect === "string" && req.query.redirect.startsWith("/")) ? req.query.redirect : "/";
    const secret = process.env.JWT_SECRET || "dev-secret-key-12345678901234567890";
    const user = {
      email: userEmail,
      name: name || (isAdmin ? "Recruitment Chair" : (isBrother ? "Brother Wolverine" : "Applicant Wolverine")),
      picture: null,
      isAdmin: Boolean(isAdmin),
      isBrother: Boolean(isBrother),
    };
    const signed = jwt.sign(user, secret, { expiresIn: "7d" });
    res.cookie("auth_token", signed, COOKIE_OPTS);
    if (req.method === "GET") {
      res.redirect(redirectTo);
    } else {
      res.json({ ok: true, user });
    }
  });
}
