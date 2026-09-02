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
  const { name, first_name, last_name, role, major, minor, pledge_class, linkedin_url, photo_url, hue, categories, sort_order } = req.body;
  const fullName = (name || [first_name, last_name].filter(Boolean).join(" ")).trim();
  if (!fullName) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const parts = fullName.split(/\s+/);
  const finalFirstName = first_name || parts[0] || "";
  const finalLastName = last_name || parts.slice(1).join(" ") || "";

  if (photo_url && !isValidHttpUrl(photo_url)) {
    res.status(400).json({ error: "Invalid photo_url" });
    return;
  }
  if (linkedin_url && !isValidHttpUrl(linkedin_url)) {
    res.status(400).json({ error: "Invalid linkedin_url" });
    return;
  }
  try {
    const finalCategories = Array.from(new Set([...(categories || []), "ACTIVES"]));
    const { rows } = await pool.query(
      `INSERT INTO members (name, first_name, last_name, role, major, minor, pledge_class, linkedin_url, photo_url, hue, categories, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        fullName,
        finalFirstName,
        finalLastName,
        role ?? "",
        major ?? "",
        minor ?? "",
        pledge_class ?? "",
        linkedin_url || null,
        photo_url || null,
        hue ?? "from-amber-900 via-amber-800 to-stone-700",
        finalCategories,
        sort_order ?? 0,
      ],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create member" });
  }
});

// POST /api/members/bulk  — admin only
membersApiRouter.post("/bulk", requireAdmin, async (req: Request, res: Response) => {
  const { members: rows, mode } = req.body as {
    members?: Array<{
      name?: string;
      role?: string;
      position?: string;
      major?: string;
      minor?: string;
      pledge_class?: string;
      linkedin_url?: string;
      photo_url?: string;
      categories?: string[];
    }>;
    mode?: "append" | "replace";
  };

  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(400).json({ error: "No member data provided" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (mode === "replace") {
      await client.query("DELETE FROM members");
    }

    const startOrderRes = await client.query("SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM members");
    let currentOrder = parseInt(startOrderRes.rows[0]?.next_order ?? 0, 10);

    let insertedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const fullName = (row.name ?? "").trim();
      if (!fullName) {
        errors.push(`Row ${i + 1} skipped: Name is missing`);
        continue;
      }

      const role = (row.role || row.position || "Active Member").trim();
      const major = (row.major ?? "").trim();
      const minor = (row.minor ?? "").trim();
      const pledgeClass = (row.pledge_class ?? "").trim();
      let linkedinUrl = (row.linkedin_url ?? "").trim();
      if (linkedinUrl && !isValidHttpUrl(linkedinUrl)) {
        if (!linkedinUrl.startsWith("http://") && !linkedinUrl.startsWith("https://")) {
          linkedinUrl = `https://${linkedinUrl}`;
        }
        if (!isValidHttpUrl(linkedinUrl)) {
          linkedinUrl = "";
        }
      }
      const photoUrl = (row.photo_url ?? "").trim();
      const validPhoto = photoUrl && isValidHttpUrl(photoUrl) ? photoUrl : null;

      let categories = row.categories || [];
      if (!Array.isArray(categories)) {
        categories = [];
      }
      const lowerRole = role.toLowerCase();
      if (
        lowerRole.includes("president") ||
        lowerRole.includes("vp ") ||
        lowerRole.includes("vice president") ||
        lowerRole.includes("secretary") ||
        lowerRole.includes("treasurer")
      ) {
        if (!categories.includes("BOARD")) categories.push("BOARD");
      } else if (
        lowerRole.includes("director") ||
        lowerRole.includes("chair") ||
        lowerRole.includes("lead")
      ) {
        if (!categories.includes("CHAIRS")) categories.push("CHAIRS");
      }
      if (!categories.includes("ACTIVES")) {
        categories.push("ACTIVES");
      }

      const parts = fullName.split(/\s+/);
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";

      await client.query(
        `INSERT INTO members (name, first_name, last_name, role, major, minor, pledge_class, linkedin_url, photo_url, hue, categories, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          fullName,
          firstName,
          lastName,
          role,
          major,
          minor,
          pledgeClass,
          linkedinUrl || null,
          validPhoto,
          "from-amber-900 via-amber-800 to-stone-700",
          categories,
          currentOrder++,
        ],
      );
      insertedCount++;
    }

    await client.query("COMMIT");
    res.json({ ok: true, count: insertedCount, errors });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Bulk upload error:", err);
    res.status(500).json({ error: "Failed to process bulk upload" });
  } finally {
    client.release();
  }
});

// PUT /api/members/:id  — admin only
membersApiRouter.put("/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { name, first_name, last_name, role, major, minor, pledge_class, linkedin_url, photo_url, hue, categories, sort_order } = req.body;
  const fullName = (name || [first_name, last_name].filter(Boolean).join(" ")).trim();
  if (!fullName) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const parts = fullName.split(/\s+/);
  const finalFirstName = first_name || parts[0] || "";
  const finalLastName = last_name || parts.slice(1).join(" ") || "";

  if (photo_url && !isValidHttpUrl(photo_url)) {
    res.status(400).json({ error: "Invalid photo_url" });
    return;
  }
  if (linkedin_url && !isValidHttpUrl(linkedin_url)) {
    res.status(400).json({ error: "Invalid linkedin_url" });
    return;
  }
  try {
    const finalCategories = Array.from(new Set([...(categories || []), "ACTIVES"]));
    const { rows } = await pool.query(
      `UPDATE members
       SET name=$1, first_name=$2, last_name=$3, role=$4, major=$5, minor=$6, pledge_class=$7, linkedin_url=$8,
           photo_url=$9, hue=$10, categories=$11, sort_order=$12
       WHERE id=$13 RETURNING *`,
      [fullName, finalFirstName, finalLastName, role, major, minor, pledge_class ?? "", linkedin_url || null, photo_url || null, hue, finalCategories, sort_order, id],
    );
    if (!rows.length) { res.status(404).json({ error: "Member not found" }); return; }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update member" });
  }
});

// DELETE /api/members  — clear all members (admin only)
membersApiRouter.delete("/", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const { rowCount } = await pool.query("DELETE FROM members");
    res.json({ ok: true, deletedCount: rowCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to clear members directory" });
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
