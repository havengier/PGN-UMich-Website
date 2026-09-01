import { Router } from "express";
import type { Request, Response } from "express";
import { pool } from "../db.js";
import { requireAdmin } from "../middleware/admin.js";

export const applyConfigRouter = Router();

const CONFIG_KEY = "apply.config";

export const DEFAULT_APPLY_CONFIG = {
  sections: [
    {
      id: "personal",
      label: "Personal Information",
      fields: [
        { id: "firstName", type: "text", label: "First Name", placeholder: "Jane", required: true, core: true },
        { id: "lastName", type: "text", label: "Last Name", placeholder: "Doe", required: true, core: true },
        { id: "email", type: "email", label: "University Email", placeholder: "jdoe@umich.edu", required: true, core: true },
        { id: "phone", type: "tel", label: "Phone Number", placeholder: "(555) 000-0000", required: false, core: false },
      ],
    },
    {
      id: "academic",
      label: "Academic Background",
      fields: [
        { id: "year", type: "select", label: "Year", options: ["Freshman", "Sophomore", "Junior", "Senior", "Graduate Student"], required: true, core: true },
        { id: "major", type: "text", label: "Major", placeholder: "e.g. Business Administration", required: true, core: true },
        { id: "minor", type: "text", label: "Minor (if applicable)", placeholder: "e.g. Psychology", required: false, core: false },
        { id: "gpa", type: "text", label: "Cumulative GPA", placeholder: "e.g. 3.7", required: false, core: false },
      ],
    },
    {
      id: "shortAnswers",
      label: "Short Answers",
      fields: [
        { id: "whyPGN", type: "textarea", label: "Why do you want to join Phi Gamma Nu?", hint: "Tell us what drew you to PGN and what you hope to gain from membership. (150–300 words)", placeholder: "I am drawn to PGN because...", required: true, core: true },
        { id: "strengths", type: "textarea", label: "What unique strengths would you bring to PGN?", hint: "Highlight specific skills, experiences, or perspectives. (150–300 words)", placeholder: "One strength I would bring is...", required: true, core: true },
        { id: "involvement", type: "textarea", label: "Describe your previous involvement in campus or professional organizations.", hint: "Include clubs, internships, research, volunteer work, or leadership roles.", placeholder: "I have been involved in...", required: false, core: false },
      ],
    },
    {
      id: "resumeAdditional",
      label: "Resume & Additional Information",
      fields: [
        { id: "resume", type: "file", label: "Upload Resume", required: false, core: false },
        { id: "questions", type: "textarea", label: "Any questions or additional comments?", placeholder: "Feel free to share anything else you would like us to know.", required: false, core: false },
      ],
    },
  ],
};

// GET /api/apply-config  — public
applyConfigRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query("SELECT value FROM site_content WHERE key = $1", [CONFIG_KEY]);
    if (rows.length) {
      res.json(JSON.parse(rows[0].value));
    } else {
      res.json(DEFAULT_APPLY_CONFIG);
    }
  } catch {
    res.json(DEFAULT_APPLY_CONFIG);
  }
});

// PUT /api/apply-config  — admin only
applyConfigRouter.put("/", requireAdmin, async (req: Request, res: Response) => {
  const config = req.body;
  if (!config?.sections || !Array.isArray(config.sections)) {
    res.status(400).json({ error: "Invalid config: sections array required" });
    return;
  }
  try {
    await pool.query(
      `INSERT INTO site_content (key, value, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [CONFIG_KEY, JSON.stringify(config)],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save apply config" });
  }
});
