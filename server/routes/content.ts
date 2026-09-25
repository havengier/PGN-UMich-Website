import { Router } from "express";
import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../db.js";
import { requireAdmin } from "../middleware/admin.js";

export const contentRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_CONTENT_FILE = path.resolve(__dirname, "../data/content-store.json");

function getLocalContent(): Record<string, string> {
  try {
    if (fs.existsSync(LOCAL_CONTENT_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_CONTENT_FILE, "utf-8"));
    }
  } catch {}
  return {};
}

function saveLocalContent(content: Record<string, string>) {
  try {
    const dir = path.dirname(LOCAL_CONTENT_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_CONTENT_FILE, JSON.stringify(content, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save local content store:", err);
  }
}

function isValidHttpUrl(url: string): boolean {
  if (url === "#" || url.startsWith("/") || url.startsWith("#")) return true;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" || u.protocol === "mailto:";
  } catch {
    return false;
  }
}

// GET /api/content?ns=home  — public, no auth required
contentRouter.get("/", async (req: Request, res: Response) => {
  const ns = typeof req.query.ns === "string" ? req.query.ns : null;
  if (!process.env.DATABASE_URL) {
    const local = getLocalContent();
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(local)) {
      if (!ns || key.startsWith(`${ns}.`)) {
        result[key] = value;
      }
    }
    res.json(result);
    return;
  }
  try {
    const { rows } = ns
      ? await pool.query("SELECT key, value FROM site_content WHERE key LIKE $1", [`${ns}.%`])
      : await pool.query("SELECT key, value FROM site_content");
    const result: Record<string, string> = {};
    for (const row of rows) result[row.key] = row.value;
    res.json(result);
  } catch {
    res.json({});
  }
});

// PUT /api/content  — admin only, batch upsert { [key]: value }
contentRouter.put("/", requireAdmin, async (req: Request, res: Response) => {
  const updates = req.body as Record<string, string>;
  if (typeof updates !== "object" || Array.isArray(updates) || updates === null) {
    res.status(400).json({ error: "Body must be a plain object" });
    return;
  }

  for (const [key, val] of Object.entries(updates)) {
    if (!/^[a-z0-9_.:-]+$/i.test(key)) {
      res.status(400).json({ error: `Invalid key: ${key}` });
      return;
    }
    if (typeof val !== "string") {
      res.status(400).json({ error: `Value for ${key} must be a string` });
      return;
    }
    if ((key.endsWith("_url") || key.endsWith(".url")) && val !== "" && !isValidHttpUrl(val)) {
      res.status(400).json({ error: `Invalid URL for key: ${key}` });
      return;
    }
  }

  if (!process.env.DATABASE_URL) {
    const local = getLocalContent();
    for (const [key, value] of Object.entries(updates)) {
      local[key] = value;
    }
    saveLocalContent(local);
    res.json({ ok: true });
    return;
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    for (const [key, value] of Object.entries(updates)) {
      await client.query(
        `INSERT INTO site_content (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, value],
      );
    }
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    console.error("Content update error:", err);
    res.status(500).json({ error: "Failed to save content" });
  } finally {
    if (client) client.release();
  }
});
