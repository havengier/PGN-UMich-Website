import { Router } from "express";
import type { Request, Response } from "express";
import { pool } from "../db.js";
import { requireAdmin } from "../middleware/admin.js";

export const membersApiRouter = Router();

function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// GET /api/members  — public
membersApiRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM members ORDER BY sort_order ASC, id ASC",
    );
    res.json(rows);
  } catch {
    res.json([]);
  }
});

// POST /api/members  — admin only
membersApiRouter.post("/", requireAdmin, async (req: Request, res: Response) => {
  const { first_name, last_name, role, major, minor, photo_url, hue, categories, sort_order } = req.body;
  if (!first_name || !last_name) {
    res.status(400).json({ error: "first_name and last_name are required" });
    return;
  }
  if (photo_url && !isValidHttpUrl(photo_url)) {
    res.status(400).json({ error: "Invalid photo_url" });
    return;
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO members (first_name, last_name, role, major, minor, photo_url, hue, categories, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        first_name,
        last_name,
        role ?? "",
        major ?? "",
        minor ?? "",
        photo_url || null,
        hue ?? "from-amber-900 via-amber-800 to-stone-700",
        categories ?? [],
        sort_order ?? 0,
      ],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create member" });
  }
});

// PUT /api/members/:id  — admin only
membersApiRouter.put("/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { first_name, last_name, role, major, minor, photo_url, hue, categories, sort_order } = req.body;
  if (!first_name || !last_name) {
    res.status(400).json({ error: "first_name and last_name are required" });
    return;
  }
  if (photo_url && !isValidHttpUrl(photo_url)) {
    res.status(400).json({ error: "Invalid photo_url" });
    return;
  }
  try {
    const { rows } = await pool.query(
      `UPDATE members
       SET first_name=$1, last_name=$2, role=$3, major=$4, minor=$5,
           photo_url=$6, hue=$7, categories=$8, sort_order=$9
       WHERE id=$10 RETURNING *`,
      [first_name, last_name, role, major, minor, photo_url || null, hue, categories, sort_order, id],
    );
    if (!rows.length) { res.status(404).json({ error: "Member not found" }); return; }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update member" });
  }
});

// DELETE /api/members/:id  — admin only
membersApiRouter.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await pool.query("DELETE FROM members WHERE id = $1", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete member" });
  }
});
