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
import { applyHeicBackfill } from "./heic-backfill.js";

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
const primaryUploadsDir =
  process.env.UPLOADS_DIR ||
  (fs.existsSync("/data/uploads") || fs.existsSync("/data") ? "/data/uploads" : path.resolve(__dirname, "../public/uploads"));
try {
  fs.mkdirSync(primaryUploadsDir, { recursive: true });
} catch {}

// Recursive file finder across candidate root directories
function findFileDeep(roots: string[], targetName: string, maxDepth = 4): string | null {
  const normTarget = targetName.toLowerCase();
  const targetBase = normTarget.replace(/\.[^/.]+$/, "");

  function scanDir(dir: string, depth: number): string | null {
    if (depth > maxDepth) return null;
    try {
      if (!fs.existsSync(dir)) return null;
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      // Pass 1: exact or case-insensitive filename match
      for (const entry of entries) {
        if (entry.isFile()) {
          if (entry.name.toLowerCase() === normTarget) {
            return path.join(dir, entry.name);
          }
        }
      }

      // Pass 2: match base name (without extension) or prefix
      if (targetBase.length > 5) {
        for (const entry of entries) {
          if (entry.isFile()) {
            const entryBase = entry.name.toLowerCase().replace(/\.[^/.]+$/, "");
            if (entryBase === targetBase || entry.name.toLowerCase().startsWith(targetBase)) {
              return path.join(dir, entry.name);
            }
          }
        }
      }

      // Pass 3: recurse into subdirectories
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".git") {
          const res = scanDir(path.join(dir, entry.name), depth + 1);
          if (res) return res;
        }
      }
    } catch {}
    return null;
  }

  for (const root of roots) {
    const found = scanDir(root, 0);
    if (found) return found;
  }
  return null;
}

function getAllFilesRecursive(dir: string, maxDepth = 4): string[] {
  const results: string[] = [];
  function walk(current: string, depth: number) {
    if (depth > maxDepth) return;
    try {
      if (!fs.existsSync(current)) return;
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(current, e.name);
        if (e.isFile()) {
          results.push(full);
        } else if (e.isDirectory() && e.name !== "node_modules" && e.name !== ".git") {
          walk(full, depth + 1);
        }
      }
    } catch {}
  }
  walk(dir, 0);
  return results;
}

// Route for serving uploaded files with multi-dir, case-insensitive, prefix, recursive disk search, and database fallback
app.get(["/uploads/:filename", "/uploads/*"], async (req, res) => {
  const rawParam = (req.params as any)[0] || (req.params as any).filename || "";
  if (!rawParam) {
    return res.status(404).json({ error: "File not found.", reason: "Empty filename parameter" });
  }

  // Strip query parameters or hash fragments
  const cleanParam = String(rawParam).split("?")[0].split("#")[0];
  let safeFilename = path.basename(cleanParam);
  try {
    safeFilename = path.basename(decodeURIComponent(cleanParam));
  } catch {}

  const candidateDirs = getCandidateUploadDirs();

  const ext = path.extname(safeFilename).toLowerCase();
  const isImageReq = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".heic", ".heif"].includes(ext);
  const baseWithoutExt = safeFilename.replace(/\.[^/.]+$/, "");
  const jpgAlias = safeFilename.replace(/\.hei[cf]$/i, ".jpg");

  function isHeicHeader(buf: Buffer): boolean {
    if (!buf || buf.length < 12) return false;
    const brand = buf.toString("ascii", 4, 12);
    return brand.includes("ftyp");
  }

  function isValidDiskFile(filePath: string, requestedExt: string): boolean {
    try {
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false;
      // If client requested a standard image, ensure file on disk is not a raw HEIC file
      if ([".jpg", ".jpeg", ".png", ".webp"].includes(requestedExt)) {
        const fd = fs.openSync(filePath, "r");
        const headerBuf = Buffer.alloc(16);
        fs.readSync(fd, headerBuf, 0, 16, 0);
        fs.closeSync(fd);
        if (isHeicHeader(headerBuf)) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  // 1. Check PostgreSQL uploaded_files table FIRST (exact, case-insensitive, and .heic -> .jpg alias)
  // PostgreSQL is the single source of truth for all uploaded and backfilled files!
  if (pool) {
    try {
      const dbRes = await pool.query(
        "SELECT filename, mime_type, data FROM uploaded_files WHERE filename = $1 OR LOWER(filename) = LOWER($1) OR filename = $2 LIMIT 1",
        [safeFilename, jpgAlias],
      );
      if (dbRes.rows.length > 0) {
        const fileRow = dbRes.rows[0];
        const isHeic = isHeicHeader(fileRow.data);
        // Do not serve raw HEIC bytes if client requests a web image (jpg/png)
        if (!isHeic || ext === ".heic" || ext === ".heif") {
          const mimeType = isHeic && (ext === ".heic" || ext === ".heif")
            ? "image/heic"
            : (fileRow.mime_type || "application/octet-stream");
          res.setHeader("Content-Type", mimeType);
          res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

          // Cache back to disk
          for (const dir of candidateDirs) {
            try {
              fs.mkdirSync(dir, { recursive: true });
              fs.writeFileSync(path.join(dir, fileRow.filename || safeFilename), fileRow.data);
              if (jpgAlias !== safeFilename) {
                fs.writeFileSync(path.join(dir, jpgAlias), fileRow.data);
              }
              break;
            } catch {}
          }

          return res.send(fileRow.data);
        }
      }
    } catch (err) {
      console.error("Error querying uploaded_files from DB:", err);
    }
  }

  // 2. Direct and case-insensitive search in candidate directories (with HEIC byte-safety check)
  for (const dir of candidateDirs) {
    try {
      if (!fs.existsSync(dir)) continue;
      const directPath = path.join(dir, safeFilename);
      if (isValidDiskFile(directPath, ext)) {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        return res.sendFile(directPath);
      }
      const files = fs.readdirSync(dir);
      const match = files.find((f) => f.toLowerCase() === safeFilename.toLowerCase());
      if (match) {
        const matchPath = path.join(dir, match);
        if (isValidDiskFile(matchPath, ext)) {
          res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
          return res.sendFile(matchPath);
        }
      }
      // If client requested .heic, check if .jpg exists on disk
      if (ext === ".heic" || ext === ".heif") {
        const jpgPath = path.join(dir, jpgAlias);
        if (isValidDiskFile(jpgPath, ".jpg")) {
          res.setHeader("Content-Type", "image/jpeg");
          res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
          return res.sendFile(jpgPath);
        }
      }
    } catch {}
  }

  // 3. Deep recursive search across /data, /app, and current working directory
  const searchRoots = Array.from(new Set(["/data", "/app", process.cwd(), ...candidateDirs]));
  const deepFound = findFileDeep(searchRoots, safeFilename);
  if (deepFound && isValidDiskFile(deepFound, ext)) {
    try {
      // Cache copy to primary upload dir for faster subsequent requests
      const primaryTarget = path.join(primaryUploadsDir, safeFilename);
      if (!fs.existsSync(primaryTarget)) {
        try {
          fs.copyFileSync(deepFound, primaryTarget);
        } catch {}
      }
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      return res.sendFile(deepFound);
    } catch {}
  }

  // 4. Prefix / extension-agnostic match on disk (e.g. matching photo_123.jpg with photo_123.png/jpeg, NEVER .heic)
  if (baseWithoutExt && baseWithoutExt.length > 5) {
    for (const dir of candidateDirs) {
      try {
        if (!fs.existsSync(dir)) continue;
        const files = fs.readdirSync(dir);
        const match = files.find(
          (f) =>
            f.toLowerCase().startsWith(baseWithoutExt.toLowerCase()) &&
            !f.toLowerCase().endsWith(".heic") &&
            !f.toLowerCase().endsWith(".heif") &&
            f !== "lost+found" &&
            !fs.statSync(path.join(dir, f)).isDirectory(),
        );
        if (match) {
          const fullPath = path.join(dir, match);
          if (isValidDiskFile(fullPath, ext)) {
            res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
            return res.sendFile(fullPath);
          }
        }
      } catch {}
    }
  }

  // 5. Collect available files from candidate dirs and recursive scan for diagnostics
  const allAvailableFiles: string[] = [];
  for (const dir of candidateDirs) {
    try {
      if (fs.existsSync(dir)) {
        const list = fs.readdirSync(dir).filter((f) => f !== "lost+found");
        for (const f of list) {
          if (!allAvailableFiles.includes(f)) allAvailableFiles.push(f);
        }
      }
    } catch {}
  }

  const allRecursiveFiles = getAllFilesRecursive("/data");

  // 6. Return 404 with helpful diagnostics
  res.status(404).json({
    error: "File not found.",
    requested: rawParam,
    searchedFilename: safeFilename,
    availableFilesCount: allAvailableFiles.length,
    availableFiles: allAvailableFiles,
    recursiveDataFilesCount: allRecursiveFiles.length,
    recursiveDataFiles: allRecursiveFiles,
  });
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
  const allDiskFiles = new Set<string>();

  for (const dir of dirs) {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        dirReport[dir] = { exists: true, count: files.length, sample: files.slice(0, 20) };
        for (const f of files) {
          if (f !== "lost+found") allDiskFiles.add(f);
        }
      } else {
        dirReport[dir] = { exists: false };
      }
    } catch (err: any) {
      dirReport[dir] = { error: err.message };
    }
  }

  const recursiveDataFiles = getAllFilesRecursive("/data");
  for (const f of recursiveDataFiles) {
    allDiskFiles.add(path.basename(f));
  }

  let dbUploadCount = 0;
  let dbFilesList: string[] = [];
  if (pool) {
    try {
      const q = await pool.query("SELECT filename FROM uploaded_files");
      dbUploadCount = q.rows.length;
      dbFilesList = q.rows.map((r: any) => r.filename);
    } catch {}
  }

  let submissionsSummary: any[] = [];
  if (pool) {
    try {
      const subRes = await pool.query(
        "SELECT id, applicant_name, applicant_email, answers, submitted_at FROM application_submissions ORDER BY id ASC",
      );
      submissionsSummary = subRes.rows.map((sub: any) => {
        let answersObj = sub.answers;
        if (typeof answersObj === "string") {
          try {
            answersObj = JSON.parse(answersObj);
          } catch {}
        }
        const fileReferences: Record<string, { url: string; onDisk: boolean; inDb: boolean }> = {};
        if (typeof answersObj === "object" && answersObj !== null) {
          for (const [key, val] of Object.entries(answersObj)) {
            if (typeof val === "string" && (val.includes("/uploads/") || val.includes("photo_") || val.includes("resume_"))) {
              const fname = path.basename(val.split("?")[0].split("#")[0]);
              fileReferences[key] = {
                url: val,
                onDisk: allDiskFiles.has(fname),
                inDb: dbFilesList.includes(fname),
              };
            }
          }
        }
        return {
          id: sub.id,
          name: sub.applicant_name,
          email: sub.applicant_email,
          submitted_at: sub.submitted_at,
          fileReferences,
        };
      });
    } catch (err: any) {
      submissionsSummary = [{ error: err.message }];
    }
  }

  res.json({
    ok: true,
    nodeEnv: process.env.NODE_ENV || "not set",
    uploadsDirEnv: process.env.UPLOADS_DIR || "not set",
    totalDiskFiles: allDiskFiles.size,
    diskFiles: Array.from(allDiskFiles),
    recursiveDataFiles,
    dbUploadCount,
    dbFilesList,
    dirs: dirReport,
    submissionsCount: submissionsSummary.length,
    submissions: submissionsSummary,
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
  await applyHeicBackfill();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
