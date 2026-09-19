import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { applyRouter } from "./routes/apply.js";
import { authRouter } from "./routes/auth.js";
import { contentRouter } from "./routes/content.js";
import { membersApiRouter } from "./routes/members-api.js";
import { applyConfigRouter } from "./routes/apply-config.js";
import { recruitmentRouter } from "./routes/recruitment.js";
import { runMigrations, pool } from "./db.js";

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
app.use(express.json({ limit: "15mb" }));

// Max 10 application submissions per IP per 15 minutes
const applyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
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
app.use("/api/recruitment", recruitmentRouter);

// Helper to find uploaded files across all candidate directories
const getCandidateUploadDirs = (): string[] => {
  const dirs = [
    process.env.UPLOADS_DIR,
    "/data/uploads",
    "/data",
    "/app/data/uploads",
    "/app/data",
    "/app/public/uploads",
    "/app/uploads",
    "/uploads",
    path.resolve(__dirname, "../public/uploads"),
    path.resolve(__dirname, "../../public/uploads"),
    path.resolve(process.cwd(), "public/uploads"),
    path.resolve(process.cwd(), "dist/uploads"),
    path.resolve(process.cwd(), "uploads"),
  ].filter((d): d is string => Boolean(d));
  return Array.from(new Set(dirs));
};

// Ensure primary upload directory exists
const primaryUploadsDir = process.env.UPLOADS_DIR || (process.env.NODE_ENV === "production" ? "/data/uploads" : path.resolve(__dirname, "../public/uploads"));
try {
  fs.mkdirSync(primaryUploadsDir, { recursive: true });
} catch {}

// Route for serving uploaded files with multi-dir and database fallback
app.get("/uploads/:filename", async (req, res) => {
  const rawFilename = req.params.filename;
  const safeFilename = path.basename(rawFilename);

  // 1. Search across all candidate disk directories
  const candidateDirs = getCandidateUploadDirs();
  for (const dir of candidateDirs) {
    try {
      const fullPath = path.join(dir, safeFilename);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        return res.sendFile(fullPath);
      }
    } catch {
      // Continue searching
    }
  }

  // 2. Check PostgreSQL uploaded_files table
  if (pool) {
    try {
      const dbRes = await pool.query(
        "SELECT mime_type, data FROM uploaded_files WHERE filename = $1 LIMIT 1",
        [safeFilename],
      );
      if (dbRes.rows.length > 0) {
        const fileRow = dbRes.rows[0];
        res.setHeader("Content-Type", fileRow.mime_type);
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

        // Cache back to disk
        for (const dir of candidateDirs) {
          try {
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(dir, safeFilename), fileRow.data);
            break;
          } catch {}
        }

        return res.send(fileRow.data);
      }
    } catch (err) {
      console.error("Error querying uploaded_files from DB:", err);
    }
  }

  // 3. Not found: return 404 (do NOT fall through to SPA index.html)
  res.status(404).json({ error: "File not found." });
});

// Also keep express.static fallback for any nested paths
for (const dir of getCandidateUploadDirs()) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    app.use("/uploads", express.static(dir, {
      setHeaders: (res) => {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      },
    }));
  } catch {}
}

app.get("/health", async (_req, res) => {
  const dirs = getCandidateUploadDirs();
  const dirReport: Record<string, any> = {};
  for (const dir of dirs) {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        dirReport[dir] = { exists: true, count: files.length, sample: files.slice(0, 15) };
      } else {
        dirReport[dir] = { exists: false };
      }
    } catch (err: any) {
      dirReport[dir] = { error: err.message };
    }
  }

  let dbUploadCount = 0;
  if (pool) {
    try {
      const q = await pool.query("SELECT COUNT(*) FROM uploaded_files");
      dbUploadCount = Number(q.rows[0].count);
    } catch {}
  }

  res.json({
    ok: true,
    nodeEnv: process.env.NODE_ENV || "not set",
    uploadsDirEnv: process.env.UPLOADS_DIR || "not set",
    dbUploadCount,
    dirs: dirReport,
  });
});

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
