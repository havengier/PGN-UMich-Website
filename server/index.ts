import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { applyRouter } from "./routes/apply.js";
import { authRouter } from "./routes/auth.js";
import { contentRouter } from "./routes/content.js";
import { membersApiRouter } from "./routes/members-api.js";
import { applyConfigRouter } from "./routes/apply-config.js";
import { runMigrations } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ?? 3000;
const isProd = process.env.NODE_ENV === "production";

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // accounts.google.com required for the Google Identity Services script (@react-oauth/google)
      scriptSrc: ["'self'", "accounts.google.com"],
      // 'unsafe-inline' required for Tailwind's injected styles and the inline <style> in index.html
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "lh3.googleusercontent.com", "https:"],
      mediaSrc: ["'self'"],
      connectSrc: ["'self'", "accounts.google.com"],
      frameAncestors: ["'none'"],
      frameSrc: ["accounts.google.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// In production the frontend and API share the same origin, so CORS is only needed in dev
app.use(cors({ origin: !isProd }));

app.use(cookieParser());
app.use(express.json({ limit: "50kb" }));

// Max 5 application submissions per IP per 15 minutes
const applyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many submissions. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/apply", applyLimiter);

app.use("/api/auth", authRouter);
app.use("/api", applyRouter);
app.use("/api/content", contentRouter);
app.use("/api/members", membersApiRouter);
app.use("/api/apply-config", applyConfigRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

// Serve the Vite build; fall through to index.html for SPA routing
const distPath = path.resolve(__dirname, "../dist");
app.use(express.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

async function main() {
  await runMigrations();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
