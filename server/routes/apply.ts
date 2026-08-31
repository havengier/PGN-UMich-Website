import { Router, Request, Response } from "express";
import { pool } from "../db.js";

export const applyRouter = Router();

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

  if (!process.env.DATABASE_URL) {
    res.status(503).json({ error: "Database not configured." });
    return;
  }

  await pool.query(
    `INSERT INTO applications
       (first_name, last_name, email, phone, year, major, minor, gpa, why_pgn, strengths, involvement, questions)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      firstName.trim(), lastName.trim(), email.trim(),
      phone?.trim() || null, year, major.trim(),
      minor?.trim() || null, gpa?.trim() || null,
      whyPGN.trim(), strengths.trim(),
      involvement?.trim() || null, questions?.trim() || null,
    ],
  );

  res.json({ ok: true });
});
