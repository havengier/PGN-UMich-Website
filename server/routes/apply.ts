import { Router, Request, Response } from "express";
import { pool } from "../db.js";

export const applyRouter = Router();

const VALID_YEARS = new Set(["Freshman", "Sophomore", "Junior", "Senior", "Graduate Student"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cap(s: string | undefined, max: number): string | null {
  const t = s?.trim();
  return t ? t.slice(0, max) : null;
}

applyRouter.post("/apply", async (req: Request, res: Response) => {
  const {
    firstName, lastName, email, phone,
    year, major, minor, gpa,
    whyPGN, strengths, involvement, questions,
  } = req.body as Record<string, string>;

  const missing = [firstName, lastName, email, year, major, whyPGN, strengths].some((v) => !v?.trim());
  if (missing) {
    res.status(400).json({ error: "Missing required fields." });
    return;
  }

  if (!EMAIL_RE.test(email.trim())) {
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
    await pool.query(
      `INSERT INTO applications
         (first_name, last_name, email, phone, year, major, minor, gpa, why_pgn, strengths, involvement, questions)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        cap(firstName, 100), cap(lastName, 100),
        cap(email, 255), cap(phone, 20),
        year, cap(major, 100),
        cap(minor, 100), cap(gpa, 10),
        cap(whyPGN, 5000), cap(strengths, 5000),
        cap(involvement, 5000), cap(questions, 2000),
      ],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("Application insert failed:", err);
    res.status(500).json({ error: "Failed to submit application. Please try again." });
  }
});
