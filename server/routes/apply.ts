import { Router, Response } from "express";
import { pool } from "../db.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

export const applyRouter = Router();

const VALID_YEARS = new Set(["Freshman", "Sophomore", "Junior", "Senior", "Graduate Student"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cap(s: string | undefined, max: number): string | null {
  const t = s?.trim();
  return t ? t.slice(0, max) : null;
}

applyRouter.post("/apply", requireAuth, async (req: AuthRequest, res: Response) => {
  const body = req.body as Record<string, string>;
  const authenticatedEmail = req.user?.email;
  const {
    firstName, lastName, email, phone,
    year, major, minor, gpa,
    whyPGN, strengths, involvement, questions,
    ...extraFields
  } = body;

  const finalEmail = (authenticatedEmail || email || "").trim();
  const missing = [firstName, lastName, finalEmail, year, major, whyPGN, strengths].some((v) => !v?.trim());
  if (missing) {
    res.status(400).json({ error: "Missing required fields." });
    return;
  }

  if (!EMAIL_RE.test(finalEmail)) {
    res.status(400).json({ error: "Invalid email address." });
    return;
  }

  if (!VALID_YEARS.has(year)) {
    res.status(400).json({ error: "Invalid year selection." });
    return;
  }

  if (!process.env.DATABASE_URL) {
    res.status(503).json({ error: "Database not configured." });
    return;
  }

  try {
    const configRow = await pool.query("SELECT value FROM site_content WHERE key = 'apply.config'");
    if (configRow.rows.length > 0) {
      const parsedConfig = JSON.parse(configRow.rows[0].value);
      if (parsedConfig.isOpen === false) {
        res.status(403).json({ error: "Applications are currently closed. Application opening soon." });
        return;
      }
    }
  } catch (err) {
    console.error("Failed to check apply config status:", err);
  }

  // Sanitise extra fields — only string values, max 2000 chars each
  const safeExtras: Record<string, string> = {};
  for (const [k, v] of Object.entries(extraFields)) {
    if (typeof v === "string" && /^[a-z0-9_]+$/i.test(k)) {
      safeExtras[k] = v.slice(0, 2000);
    }
  }

  try {
    await pool.query(
      `INSERT INTO applications
         (first_name, last_name, email, phone, year, major, minor, gpa, why_pgn, strengths, involvement, questions, extra_answers)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        cap(firstName, 100), cap(lastName, 100),
        cap(finalEmail, 255), cap(phone, 20),
        year, cap(major, 100),
        cap(minor, 100), cap(gpa, 10),
        cap(whyPGN, 5000), cap(strengths, 5000),
        cap(involvement, 5000), cap(questions, 2000),
        JSON.stringify(safeExtras),
      ],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("Application insert failed:", err);
    res.status(500).json({ error: "Failed to submit application. Please try again." });
  }
});
