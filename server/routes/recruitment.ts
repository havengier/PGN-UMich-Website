import { Router } from "express";
import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { requireAuth, type AuthRequest, type AuthUser } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import { requireBrother } from "../middleware/brother.js";
import { DEFAULT_APPLY_CONFIG } from "./apply-config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_STORE_PATH = path.resolve(__dirname, "../data/recruitment-store.json");
const UPLOADS_DIR = process.env.UPLOADS_DIR || (process.env.NODE_ENV === "production" ? "/data/uploads" : path.resolve(__dirname, "../../public/uploads"));

function getOptionalAuthUser(req: Request): AuthUser | null {
  const token = (req.cookies as Record<string, string>)?.auth_token;
  if (!token) return null;
  const secret = process.env.JWT_SECRET || (process.env.NODE_ENV !== "production" ? "dev-secret-key-12345678901234567890" : undefined);
  if (!secret) return null;
  try {
    const user = jwt.verify(token, secret) as AuthUser;
    return user?.email ? user : null;
  } catch {
    return null;
  }
}

export const recruitmentRouter = Router();

// ── Default Status Messages ───────────────────────────────────────────────────
export const DEFAULT_STATUS_MESSAGES = {
  application: {
    pending_review: {
      title: "Application Under Review",
      body: "Thank you for applying to Phi Gamma Nu! Our executive board is currently reviewing all written applications. You will receive an update here once decisions have been finalized.",
    },
    advanced_to_round_1: {
      title: "Invited to Round 1 Interviews!",
      body: "Congratulations! We were thoroughly impressed with your application and invite you to Round 1 Interviews. Please check your @umich.edu email for interview details and scheduling instructions.",
    },
    not_selected_application: {
      title: "Application Update",
      body: "Thank you for your interest in Phi Gamma Nu and for taking the time to submit your application. Due to a highly competitive applicant pool, we are unable to advance your application this cycle. We truly appreciate your time and encourage you to apply again next recruitment cycle.",
    },
  },
  round1: {
    pending: {
      title: "Round 1 Under Review",
      body: "Thank you for attending your Round 1 interview! Our brotherhood is currently evaluating all candidates. Decisions regarding advancement to Round 2 will be posted here shortly.",
    },
    advanced: {
      title: "Moving Forward to Round 2!",
      body: "Congratulations! You have successfully advanced to Round 2 Interviews. We look forward to speaking with you further. Please check your @umich.edu email for details on your next interview.",
    },
    not_selected: {
      title: "Recruitment Update",
      body: "Thank you for interviewing with us in Round 1. While we enjoyed meeting you and learning more about your story, we are unable to advance you to Round 2 this cycle. We wish you the very best in your academic and professional journey, and hope to see you at future events.",
    },
  },
  round2: {
    pending: {
      title: "Final Decisions in Progress",
      body: "Thank you for completing your Round 2 interview! Our brotherhood is currently holding final deliberations. Bid decisions will be updated here as soon as they are finalized.",
    },
    offered_bid: {
      title: "Congratulations, You've Been Extended a Bid!",
      body: "Welcome to Phi Gamma Nu! On behalf of the entire chapter, we are ecstatic to extend you an official bid to join our brotherhood. Check your @umich.edu inbox for your official bid letter, welcome packet, and details regarding Bid Night!",
    },
    not_selected: {
      title: "Recruitment Decision",
      body: "Thank you for participating in our recruitment process through Round 2. We were deeply impressed by your passion, talent, and accomplishments. While we are unable to extend a bid this cycle, we encourage you to stay connected and wish you tremendous success.",
    },
  },
};

const VALID_SCORES = new Set([-1, -0.5, 0, 0.5, 1]);

// ── Types ─────────────────────────────────────────────────────────────────────
export interface RecruitmentCycle {
  id: number;
  name: string;
  status: "draft" | "open" | "closed" | "archived";
  created_at: string;
  created_by: string;
}

export interface NormalizationConfig {
  k: number;
  minWeight: number;
  maxWeight: number;
  targetDistribution: {
    "-1": number;
    "-0.5": number;
    "0": number;
    "0.5": number;
    "1": number;
  };
}

export const DEFAULT_NORMALIZATION_CONFIG: NormalizationConfig = {
  k: 15,
  minWeight: 0.3,
  maxWeight: 3.0,
  targetDistribution: {
    "-1": 0.05,
    "-0.5": 0.10,
    "0": 0.70,
    "0.5": 0.10,
    "1": 0.05,
  },
};

export interface RaterCalibration {
  raterId: string;
  raterName: string;
  totalRatings: number;
  counts: Record<string, number>;
  observedPercentages: Record<string, number>;
  smoothedPercentages: Record<string, number>;
  targetPercentages: Record<string, number>;
  weights: Record<string, number>;
  biasTendency: "easy" | "harsh" | "balanced" | "calibrating";
  isClamped: boolean;
}

export interface CycleForm {
  id: number;
  cycle_id: number;
  questions: any[];
  opens_at: string | null;
  closes_at: string | null;
  is_locked: boolean;
  status_messages: any;
  normalization_config?: NormalizationConfig | null;
  updated_at: string;
}

export interface ApplicationSubmission {
  id: number;
  cycle_id: number;
  applicant_user_id: string;
  applicant_email: string;
  applicant_name: string;
  answers: Record<string, any>;
  application_status: "pending_review" | "advanced_to_round_1" | "not_selected_application";
  round_1_status: "pending" | "advanced" | "not_selected";
  round_2_status: "pending" | "offered_bid" | "not_selected";
  app_override: boolean;
  r1_override: boolean;
  r2_override: boolean;
  app_highlight?: "green" | "yellow" | "red" | null;
  r1_highlight?: "green" | "yellow" | "red" | null;
  r2_highlight?: "green" | "yellow" | "red" | null;
  is_bba?: boolean | null;
  candidate_number?: number | null;
  submitted_at: string;
}

export interface ApplicationScore {
  id: number;
  submission_id: number;
  rater_id: string;
  rater_name: string;
  score: number;
  note: string | null;
  rated_at: string;
}

export interface RoundEvaluation {
  id: number;
  submission_id: number;
  round: 1 | 2;
  rater_id: string;
  rater_name: string;
  score: number;
  note: string | null;
  rated_at: string;
}

export interface ApplicationAssignment {
  id: number;
  submission_id: number;
  brother_email: string;
  assigned_by: string;
  assigned_at: string;
}

interface LocalStoreData {
  nextId: {
    cycles: number;
    forms: number;
    submissions: number;
    appScores: number;
    roundEvals: number;
    assignments: number;
  };
  cycles: RecruitmentCycle[];
  forms: CycleForm[];
  submissions: ApplicationSubmission[];
  appScores: ApplicationScore[];
  roundEvals: RoundEvaluation[];
  assignments: ApplicationAssignment[];
}

// ── Local In-Memory / File Fallback Store ──────────────────────────────────────
function readLocalStore(): LocalStoreData {
  try {
    if (!fs.existsSync(LOCAL_STORE_PATH)) {
      const initialStore: LocalStoreData = {
        nextId: { cycles: 2, forms: 2, submissions: 1, appScores: 1, roundEvals: 1, assignments: 1 },
        cycles: [
          {
            id: 1,
            name: "Fall 2026 Rush",
            status: "open",
            created_at: new Date().toISOString(),
            created_by: "system@umich.edu",
          },
        ],
        forms: [
          {
            id: 1,
            cycle_id: 1,
            questions: DEFAULT_APPLY_CONFIG.sections,
            opens_at: null,
            closes_at: null,
            is_locked: false,
            status_messages: DEFAULT_STATUS_MESSAGES,
            updated_at: new Date().toISOString(),
          },
        ],
        submissions: [],
        appScores: [],
        roundEvals: [],
        assignments: [],
      };
      fs.mkdirSync(path.dirname(LOCAL_STORE_PATH), { recursive: true });
      fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(initialStore, null, 2), "utf8");
      return initialStore;
    }
    const raw = fs.readFileSync(LOCAL_STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed.assignments) parsed.assignments = [];
    if (!parsed.nextId.assignments) parsed.nextId.assignments = 1;
    return parsed;
  } catch (err) {
    console.error("Failed to read local recruitment store:", err);
    return {
      nextId: { cycles: 1, forms: 1, submissions: 1, appScores: 1, roundEvals: 1, assignments: 1 },
      cycles: [],
      forms: [],
      submissions: [],
      appScores: [],
      roundEvals: [],
      assignments: [],
    };
  }
}

function writeLocalStore(data: LocalStoreData) {
  try {
    fs.mkdirSync(path.dirname(LOCAL_STORE_PATH), { recursive: true });
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write local recruitment store:", err);
  }
}

const useDb = Boolean(process.env.DATABASE_URL);

// ── Brother Role Verification Helper ──────────────────────────────────────────
export async function isUserBrother(email: string): Promise<boolean> {
  const normEmail = email.trim().toLowerCase();
  const BROTHER_EMAILS = new Set(
    (process.env.BROTHER_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
  if (BROTHER_EMAILS.has(normEmail)) return true;

  if (useDb) {
    try {
      const res = await pool.query(
        "SELECT 1 FROM application_assignments WHERE LOWER(brother_email) = $1 LIMIT 1",
        [normEmail],
      );
      return res.rows.length > 0;
    } catch {
      return false;
    }
  } else {
    const store = readLocalStore();
    return store.assignments.some((a) => a.brother_email.toLowerCase() === normEmail);
  }
}

// ── Store Operations ──────────────────────────────────────────────────────────

async function getCycles(): Promise<(RecruitmentCycle & { submissionCount: number })[]> {
  if (useDb) {
    const res = await pool.query(`
      SELECT c.*,
        COUNT(s.id)::int as submission_count
      FROM recruitment_cycles c
      LEFT JOIN application_submissions s ON s.cycle_id = c.id
      GROUP BY c.id
      ORDER BY c.id DESC
    `);
    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      created_at: r.created_at,
      created_by: r.created_by,
      submissionCount: r.submission_count ?? 0,
    }));
  } else {
    const store = readLocalStore();
    return store.cycles
      .slice()
      .reverse()
      .map((c) => ({
        ...c,
        submissionCount: store.submissions.filter((s) => s.cycle_id === c.id).length,
      }));
  }
}

async function getCycleById(id: number): Promise<RecruitmentCycle | null> {
  if (useDb) {
    const res = await pool.query("SELECT * FROM recruitment_cycles WHERE id = $1", [id]);
    return res.rows[0] ?? null;
  } else {
    const store = readLocalStore();
    return store.cycles.find((c) => c.id === id) ?? null;
  }
}

async function getActiveCycle(): Promise<{ cycle: RecruitmentCycle; form: CycleForm } | null> {
  if (useDb) {
    const res = await pool.query(
      "SELECT * FROM recruitment_cycles WHERE status = 'open' ORDER BY id DESC LIMIT 1",
    );
    const cycle = res.rows[0];
    if (!cycle) return null;
    const formRes = await pool.query("SELECT * FROM recruitment_cycle_forms WHERE cycle_id = $1", [cycle.id]);
    let form = formRes.rows[0];
    if (!form) {
      const ins = await pool.query(
        `INSERT INTO recruitment_cycle_forms (cycle_id, questions, status_messages)
         VALUES ($1, $2, $3) RETURNING *`,
        [cycle.id, JSON.stringify(DEFAULT_APPLY_CONFIG.sections), JSON.stringify(DEFAULT_STATUS_MESSAGES)],
      );
      form = ins.rows[0];
    }
    return { cycle, form };
  } else {
    const store = readLocalStore();
    const cycle = store.cycles.find((c) => c.status === "open");
    if (!cycle) return null;
    let form = store.forms.find((f) => f.cycle_id === cycle.id);
    if (!form) {
      form = {
        id: store.nextId.forms++,
        cycle_id: cycle.id,
        questions: DEFAULT_APPLY_CONFIG.sections,
        opens_at: null,
        closes_at: null,
        is_locked: false,
        status_messages: DEFAULT_STATUS_MESSAGES,
        updated_at: new Date().toISOString(),
      };
      store.forms.push(form);
      writeLocalStore(store);
    }
    return { cycle, form };
  }
}

async function getCycleForm(cycleId: number): Promise<CycleForm | null> {
  if (useDb) {
    const res = await pool.query("SELECT * FROM recruitment_cycle_forms WHERE cycle_id = $1", [cycleId]);
    if (res.rows.length > 0) return res.rows[0];
    const ins = await pool.query(
      `INSERT INTO recruitment_cycle_forms (cycle_id, questions, status_messages)
       VALUES ($1, $2, $3) RETURNING *`,
      [cycleId, JSON.stringify(DEFAULT_APPLY_CONFIG.sections), JSON.stringify(DEFAULT_STATUS_MESSAGES)],
    );
    return ins.rows[0];
  } else {
    const store = readLocalStore();
    let form = store.forms.find((f) => f.cycle_id === cycleId);
    if (!form) {
      form = {
        id: store.nextId.forms++,
        cycle_id: cycleId,
        questions: DEFAULT_APPLY_CONFIG.sections,
        opens_at: null,
        closes_at: null,
        is_locked: false,
        status_messages: DEFAULT_STATUS_MESSAGES,
        updated_at: new Date().toISOString(),
      };
      store.forms.push(form);
      writeLocalStore(store);
    }
    return form;
  }
}

async function createCycle(name: string, createdBy: string): Promise<RecruitmentCycle> {
  if (useDb) {
    const res = await pool.query(
      `INSERT INTO recruitment_cycles (name, status, created_by)
       VALUES ($1, 'draft', $2) RETURNING *`,
      [name.trim(), createdBy],
    );
    const newCycle = res.rows[0];
    await pool.query(
      `INSERT INTO recruitment_cycle_forms (cycle_id, questions, status_messages)
       VALUES ($1, $2, $3)`,
      [newCycle.id, JSON.stringify(DEFAULT_APPLY_CONFIG.sections), JSON.stringify(DEFAULT_STATUS_MESSAGES)],
    );
    return newCycle;
  } else {
    const store = readLocalStore();
    const cycle: RecruitmentCycle = {
      id: store.nextId.cycles++,
      name: name.trim(),
      status: "draft",
      created_at: new Date().toISOString(),
      created_by: createdBy,
    };
    store.cycles.push(cycle);
    store.forms.push({
      id: store.nextId.forms++,
      cycle_id: cycle.id,
      questions: DEFAULT_APPLY_CONFIG.sections,
      opens_at: null,
      closes_at: null,
      is_locked: false,
      status_messages: DEFAULT_STATUS_MESSAGES,
      updated_at: new Date().toISOString(),
    });
    writeLocalStore(store);
    return cycle;
  }
}

async function updateCycle(
  id: number,
  patch: { name?: string; status?: "draft" | "open" | "closed" | "archived" },
): Promise<RecruitmentCycle | null> {
  if (patch.status === "open") {
    if (useDb) {
      await pool.query("UPDATE recruitment_cycles SET status = 'closed' WHERE id != $1 AND status = 'open'", [id]);
    } else {
      const store = readLocalStore();
      store.cycles.forEach((c) => {
        if (c.id !== id && c.status === "open") c.status = "closed";
      });
      writeLocalStore(store);
    }
  }

  if (useDb) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (patch.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(patch.name.trim());
    }
    if (patch.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(patch.status);
    }
    values.push(id);
    const res = await pool.query(
      `UPDATE recruitment_cycles SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values,
    );
    return res.rows[0] ?? null;
  } else {
    const store = readLocalStore();
    const cycle = store.cycles.find((c) => c.id === id);
    if (!cycle) return null;
    if (patch.name !== undefined) cycle.name = patch.name.trim();
    if (patch.status !== undefined) cycle.status = patch.status;
    writeLocalStore(store);
    return cycle;
  }
}

async function deleteCycle(id: number): Promise<boolean> {
  if (useDb) {
    await pool.query("DELETE FROM recruitment_cycles WHERE id = $1", [id]);
    return true;
  } else {
    const store = readLocalStore();
    const cycleIdx = store.cycles.findIndex((c) => c.id === id);
    if (cycleIdx === -1) return false;
    store.cycles.splice(cycleIdx, 1);
    store.forms = store.forms.filter((f) => f.cycle_id !== id);
    const subIds = new Set(store.submissions.filter((s) => s.cycle_id === id).map((s) => s.id));
    store.submissions = store.submissions.filter((s) => s.cycle_id !== id);
    store.appScores = store.appScores.filter((sc) => !subIds.has(sc.submission_id));
    store.roundEvals = store.roundEvals.filter((ev) => !subIds.has(ev.submission_id));
    store.assignments = store.assignments.filter((a) => !subIds.has(a.submission_id));
    writeLocalStore(store);
    return true;
  }
}

async function updateCycleForm(
  cycleId: number,
  patch: {
    questions?: any[];
    opens_at?: string | null;
    closes_at?: string | null;
    is_locked?: boolean;
    status_messages?: any;
    normalization_config?: NormalizationConfig | null;
  },
): Promise<CycleForm | null> {
  if (useDb) {
    const res = await pool.query(
      `INSERT INTO recruitment_cycle_forms (cycle_id, questions, opens_at, closes_at, is_locked, status_messages, normalization_config, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (cycle_id) DO UPDATE SET
         questions = COALESCE($2, recruitment_cycle_forms.questions),
         opens_at = $3,
         closes_at = $4,
         is_locked = COALESCE($5, recruitment_cycle_forms.is_locked),
         status_messages = COALESCE($6, recruitment_cycle_forms.status_messages),
         normalization_config = COALESCE($7, recruitment_cycle_forms.normalization_config),
         updated_at = NOW()
       RETURNING *`,
      [
        cycleId,
        patch.questions ? JSON.stringify(patch.questions) : null,
        patch.opens_at ?? null,
        patch.closes_at ?? null,
        patch.is_locked ?? null,
        patch.status_messages ? JSON.stringify(patch.status_messages) : null,
        patch.normalization_config ? JSON.stringify(patch.normalization_config) : null,
      ],
    );
    return res.rows[0];
  } else {
    const store = readLocalStore();
    let form = store.forms.find((f) => f.cycle_id === cycleId);
    if (!form) {
      form = {
        id: store.nextId.forms++,
        cycle_id: cycleId,
        questions: patch.questions ?? DEFAULT_APPLY_CONFIG.sections,
        opens_at: patch.opens_at ?? null,
        closes_at: patch.closes_at ?? null,
        is_locked: patch.is_locked ?? false,
        status_messages: patch.status_messages ?? DEFAULT_STATUS_MESSAGES,
        normalization_config: patch.normalization_config ?? DEFAULT_NORMALIZATION_CONFIG,
        updated_at: new Date().toISOString(),
      };
      store.forms.push(form);
    } else {
      if (patch.questions !== undefined) form.questions = patch.questions;
      if (patch.opens_at !== undefined) form.opens_at = patch.opens_at;
      if (patch.closes_at !== undefined) form.closes_at = patch.closes_at;
      if (patch.is_locked !== undefined) form.is_locked = patch.is_locked;
      if (patch.status_messages !== undefined) form.status_messages = patch.status_messages;
      if (patch.normalization_config !== undefined) form.normalization_config = patch.normalization_config;
      form.updated_at = new Date().toISOString();
    }
    writeLocalStore(store);
    return form;
  }
}

async function getSubmissionForUser(
  cycleId: number,
  userId: string,
): Promise<ApplicationSubmission | null> {
  const normEmail = userId.trim().toLowerCase();
  if (useDb) {
    const res = await pool.query(
      `SELECT * FROM application_submissions
       WHERE cycle_id = $1 AND LOWER(applicant_user_id) = $2 LIMIT 1`,
      [cycleId, normEmail],
    );
    return res.rows[0] ?? null;
  } else {
    const store = readLocalStore();
    return (
      store.submissions.find(
        (s) => s.cycle_id === cycleId && s.applicant_user_id.toLowerCase() === normEmail,
      ) ?? null
    );
  }
}

async function createSubmission(data: {
  cycleId: number;
  applicantUserId: string;
  applicantEmail: string;
  applicantName: string;
  answers: Record<string, any>;
  questionLabels?: Record<string, string>;
}): Promise<ApplicationSubmission> {
  const normEmail = data.applicantUserId.trim().toLowerCase();
  const isBba = isApplicantBba({ answers: data.answers }, data.questionLabels);
  if (useDb) {
    const res = await pool.query(
      `INSERT INTO application_submissions
       (cycle_id, applicant_user_id, applicant_email, applicant_name, answers, application_status, round_1_status, round_2_status, is_bba, candidate_number, submitted_at)
       VALUES ($1, $2, $3, $4, $5, 'pending_review', 'pending', 'pending', $6,
         (SELECT COALESCE(MAX(candidate_number), 0) + 1 FROM application_submissions WHERE cycle_id = $1),
         NOW())
       RETURNING *`,
      [data.cycleId, normEmail, data.applicantEmail.trim(), data.applicantName.trim(), JSON.stringify(data.answers), isBba],
    );
    return res.rows[0];
  } else {
    const store = readLocalStore();
    const isTestId = normEmail.includes("#test_");
    const existing = store.submissions.find(
      (s) => s.cycle_id === data.cycleId && s.applicant_user_id.toLowerCase() === normEmail,
    );
    if (existing && !isTestId) {
      throw new Error("Application already submitted for this cycle.");
    }
    const cycleSubs = store.submissions.filter((s) => s.cycle_id === data.cycleId);
    const nextCandidateNum = cycleSubs.reduce((max, s) => Math.max(max, s.candidate_number || 0), 0) + 1;

    const submission: ApplicationSubmission = {
      id: store.nextId.submissions++,
      cycle_id: data.cycleId,
      applicant_user_id: normEmail,
      applicant_email: data.applicantEmail.trim(),
      applicant_name: data.applicantName.trim(),
      answers: data.answers,
      application_status: "pending_review",
      round_1_status: "pending",
      round_2_status: "pending",
      app_override: false,
      r1_override: false,
      r2_override: false,
      is_bba: isBba,
      candidate_number: nextCandidateNum,
      submitted_at: new Date().toISOString(),
    };
    store.submissions.push(submission);
    writeLocalStore(store);
    return submission;
  }
}

async function deleteSubmission(submissionId: number): Promise<boolean> {
  if (useDb) {
    const res = await pool.query(
      "DELETE FROM application_submissions WHERE id = $1 RETURNING id",
      [submissionId],
    );
    return (res.rowCount ?? 0) > 0;
  } else {
    const store = readLocalStore();
    const idx = store.submissions.findIndex((s) => s.id === submissionId);
    if (idx === -1) return false;
    store.submissions.splice(idx, 1);
    store.appScores = store.appScores.filter((sc) => sc.submission_id !== submissionId);
    store.roundEvals = store.roundEvals.filter((ev) => ev.submission_id !== submissionId);
    store.assignments = store.assignments.filter((a) => a.submission_id !== submissionId);
    writeLocalStore(store);
    return true;
  }
}

// ── Application Assignment Operations ──────────────────────────────────────────

async function assignBrother(
  submissionId: number,
  brotherEmail: string,
  assignedBy: string,
): Promise<void> {
  const normEmail = brotherEmail.trim().toLowerCase();
  if (useDb) {
    await pool.query(
      `INSERT INTO application_assignments (submission_id, brother_email, assigned_by, assigned_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (submission_id, brother_email) DO NOTHING`,
      [submissionId, normEmail, assignedBy],
    );
  } else {
    const store = readLocalStore();
    const exists = store.assignments.some(
      (a) => a.submission_id === submissionId && a.brother_email.toLowerCase() === normEmail,
    );
    if (!exists) {
      store.assignments.push({
        id: store.nextId.assignments++,
        submission_id: submissionId,
        brother_email: normEmail,
        assigned_by: assignedBy,
        assigned_at: new Date().toISOString(),
      });
      writeLocalStore(store);
    }
  }
}

async function unassignBrother(submissionId: number, brotherEmail: string): Promise<void> {
  const normEmail = brotherEmail.trim().toLowerCase();
  if (useDb) {
    await pool.query(
      "DELETE FROM application_assignments WHERE submission_id = $1 AND LOWER(brother_email) = $2",
      [submissionId, normEmail],
    );
  } else {
    const store = readLocalStore();
    store.assignments = store.assignments.filter(
      (a) => !(a.submission_id === submissionId && a.brother_email.toLowerCase() === normEmail),
    );
    writeLocalStore(store);
  }
}

export async function ensureCandidateNumbers(cycleId: number): Promise<void> {
  if (useDb) {
    const unnumbered = await pool.query(
      "SELECT id FROM application_submissions WHERE cycle_id = $1 AND candidate_number IS NULL ORDER BY submitted_at ASC, id ASC",
      [cycleId],
    );
    if (unnumbered.rows.length === 0) return;

    const maxRes = await pool.query(
      "SELECT COALESCE(MAX(candidate_number), 0) AS max_num FROM application_submissions WHERE cycle_id = $1",
      [cycleId],
    );
    let nextNum = Number(maxRes.rows[0]?.max_num || 0) + 1;

    for (const row of unnumbered.rows) {
      await pool.query(
        "UPDATE application_submissions SET candidate_number = $1 WHERE id = $2",
        [nextNum++, row.id],
      );
    }
  } else {
    const store = readLocalStore();
    const cycleSubs = store.submissions.filter((s) => s.cycle_id === cycleId);
    const unnumbered = cycleSubs
      .filter((s) => s.candidate_number == null)
      .sort((a, b) => (a.submitted_at || "").localeCompare(b.submitted_at || "") || a.id - b.id);
    if (unnumbered.length === 0) return;

    let maxNum = cycleSubs.reduce((m, s) => Math.max(m, s.candidate_number || 0), 0);
    for (const s of unnumbered) {
      s.candidate_number = ++maxNum;
    }
    writeLocalStore(store);
  }
}

export interface GradingGroupInput {
  name: string;
  brothers: string[];
}

export interface MassAssignResult {
  ok: boolean;
  totalApplicants: number;
  groups: Array<{
    name: string;
    brotherCount: number;
    applicantCount: number;
    brothers: string[];
  }>;
}

export async function massAssignGroups(
  cycleId: number,
  groupsInput: GradingGroupInput[],
  assignedBy: string,
): Promise<MassAssignResult> {
  // 1. Sanitize groups
  const cleanGroups: Array<{ name: string; brothers: string[] }> = [];
  for (let i = 0; i < (groupsInput || []).length; i++) {
    const g = groupsInput[i];
    const name = (g.name || `Group ${i + 1}`).trim();
    const brothers = Array.from(
      new Set(
        (g.brothers || [])
          .map((b) => (typeof b === "string" ? b.trim().toLowerCase() : ""))
          .filter((b) => b.length > 0),
      ),
    );
    if (brothers.length > 0) {
      cleanGroups.push({ name, brothers });
    }
  }

  if (cleanGroups.length === 0) {
    throw new Error("At least one group with valid brother email(s) must be provided.");
  }

  // 2. Ensure all candidates have permanent, stable candidate numbers
  await ensureCandidateNumbers(cycleId);

  // 3. Fetch submissions for this cycle
  let submissionIds: number[] = [];
  if (useDb) {
    const subRes = await pool.query(
      "SELECT id FROM application_submissions WHERE cycle_id = $1 ORDER BY id ASC",
      [cycleId],
    );
    submissionIds = subRes.rows.map((r: any) => r.id);
  } else {
    const store = readLocalStore();
    submissionIds = store.submissions
      .filter((s) => s.cycle_id === cycleId)
      .map((s) => s.id);
  }

  if (submissionIds.length === 0) {
    return {
      ok: true,
      totalApplicants: 0,
      groups: cleanGroups.map((g) => ({
        name: g.name,
        brotherCount: g.brothers.length,
        applicantCount: 0,
        brothers: g.brothers,
      })),
    };
  }

  // 4. Shuffle submission IDs randomly purely for group distribution (Fisher-Yates)
  // NOTE: Candidate numbers remain completely unchanged and permanent!
  const shuffledIds = [...submissionIds];
  for (let i = shuffledIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
  }

  // 5. Distribute submissions round-robin across cleanGroups
  const groupApplicantCounts = new Array(cleanGroups.length).fill(0);
  const newAssignments: Array<{ submissionId: number; brotherEmail: string }> = [];

  for (let idx = 0; idx < shuffledIds.length; idx++) {
    const groupIdx = idx % cleanGroups.length;
    groupApplicantCounts[groupIdx]++;
    const subId = shuffledIds[idx];
    for (const bEmail of cleanGroups[groupIdx].brothers) {
      newAssignments.push({ submissionId: subId, brotherEmail: bEmail });
    }
  }

  // 6. Clear existing assignments for submissions of this cycle and insert new ones
  if (useDb) {
    await pool.query(
      "DELETE FROM application_assignments WHERE submission_id IN (SELECT id FROM application_submissions WHERE cycle_id = $1)",
      [cycleId],
    );

    if (newAssignments.length > 0) {
      const batchSize = 400;
      for (let b = 0; b < newAssignments.length; b += batchSize) {
        const batch = newAssignments.slice(b, b + batchSize);
        const valuePlaceholders: string[] = [];
        const params: any[] = [];
        let pIdx = 1;
        for (const item of batch) {
          valuePlaceholders.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, NOW())`);
          params.push(item.submissionId, item.brotherEmail, assignedBy);
        }
        await pool.query(
          `INSERT INTO application_assignments (submission_id, brother_email, assigned_by, assigned_at)
           VALUES ${valuePlaceholders.join(", ")}
           ON CONFLICT (submission_id, brother_email) DO NOTHING`,
          params,
        );
      }
    }
  } else {
    const store = readLocalStore();
    const cycleSubSet = new Set(submissionIds);
    store.assignments = store.assignments.filter((a) => !cycleSubSet.has(a.submission_id));

    for (const item of newAssignments) {
      store.assignments.push({
        id: store.nextId.assignments++,
        submission_id: item.submissionId,
        brother_email: item.brotherEmail,
        assigned_by: assignedBy,
        assigned_at: new Date().toISOString(),
      });
    }
    writeLocalStore(store);
  }

  return {
    ok: true,
    totalApplicants: submissionIds.length,
    groups: cleanGroups.map((g, idx) => ({
      name: g.name,
      brotherCount: g.brothers.length,
      applicantCount: groupApplicantCounts[idx],
      brothers: g.brothers,
    })),
  };
}

export function extractQuestionLabels(formQuestions: any[]): Record<string, string> {
  const labels: Record<string, string> = {};
  if (!Array.isArray(formQuestions)) return labels;
  for (const sec of formQuestions) {
    if (sec && Array.isArray(sec.fields)) {
      for (const f of sec.fields) {
        if (f && f.id) {
          labels[f.id] = (f.label || f.id).trim();
        }
      }
    }
  }
  return labels;
}

export function resolveApplicantPhoto(
  answers: Record<string, any> = {},
  questionLabels: Record<string, string> = {},
): string {
  let parsedAnswers: Record<string, any> = answers;
  if (typeof answers === "string") {
    try {
      parsedAnswers = JSON.parse(answers);
    } catch {
      return "";
    }
  }

  if (!parsedAnswers || typeof parsedAnswers !== "object") {
    return "";
  }

  let bestPhoto = "";
  let bestScore = -1;

  for (const [key, val] of Object.entries(parsedAnswers)) {
    if (!val) continue;
    const strVal = typeof val === "string" ? val.trim() : "";
    if (!strVal) continue;

    const isDoc =
      /\.(pdf|docx?|doc|txt|xlsx?|pptx?|csv)(\?.*)?$/i.test(strVal) ||
      strVal.startsWith("/uploads/resume_");
    if (isDoc) continue;

    const isExplicitImg =
      strVal.startsWith("data:image/") ||
      strVal.startsWith("/uploads/photo_") ||
      /\.(jpe?g|png|webp|gif|avif|bmp|svg)(\?.*)?$/i.test(strVal);

    const isGenericUrl =
      strVal.startsWith("http://") ||
      strVal.startsWith("https://") ||
      strVal.startsWith("/uploads/");

    if (!isExplicitImg && !isGenericUrl) continue;

    const label = (questionLabels[key] || "").toLowerCase();
    const keyLower = key.toLowerCase();
    const combined = `${label} ${keyLower}`.trim();

    // 1. Artifacts, creative works, and non-profile introductions:
    // E.g.: "Provide a personal artifact to help introduce yourself to your future PGN Brothers.
    // It can be a photo, short story, poem, portfolio, song, or anything else you would like."
    // These are creative or personal artifacts, NOT the candidate's professional profile picture.
    const isArtifact =
      /artifact|portfolio|poem|song|story|creative|artwork|drawing|screenshot|audio|music/i.test(combined) ||
      (/introduce\s*yourself/i.test(combined) && /artifact|photo|story|poem|song|portfolio/i.test(combined));

    // 2. Explicit professional indicators:
    const isProfessional = /professional|formal|business|official/i.test(combined);

    // 3. Headshot / portrait / profile picture indicators:
    const hasHeadshot = /head\s*shot/i.test(combined);
    const hasPortrait = /portrait/i.test(combined);
    const hasProfilePic = /profile\s*(photo|picture|pic|image)/i.test(combined);

    // 4. Photo / picture words:
    const hasPhotoWord = /photo|picture|portrait|head\s*shot|image|pic\b/i.test(combined);

    // 5. Phrases explicitly requesting a photo of the applicant:
    // Note: "picture of yourself" is a standard prompt for a headshot/profile picture, NOT an artifact.
    const isPhotoOfSelf =
      /(photo|picture|image|portrait|headshot)\s*(of|for)\s*(yourself|you)\b/i.test(combined) ||
      /(upload|provide|submit)\s*(a|your)?\s*(professional\s*)?(photo|picture|image|headshot|portrait)\b/i.test(combined);

    // 6. Casual / informal personal picture (e.g. "casual photo", "fun photo"):
    const isCasualOrFun = /casual\s*(photo|picture|pic)|fun\s*(photo|picture|pic)|favorite\s*(photo|pic)|hobby/i.test(combined);

    let score = 0;

    if (isArtifact) {
      // Personal artifacts (stories, poems, creative artifacts, songs, etc.)
      // should never be used as the applicant's profile picture avatar.
      score = 0;
    } else if (isProfessional && (hasHeadshot || hasProfilePic || hasPhotoWord || isPhotoOfSelf)) {
      // Top Tier: "Please upload a professional picture of yourself", "Professional headshot", "Professional photo"
      score = 150;
    } else if (hasHeadshot || hasProfilePic) {
      // Tier 2: "Headshot", "Profile picture"
      score = 120;
    } else if (hasPortrait) {
      // Tier 3: "Portrait"
      score = 100;
    } else if (isPhotoOfSelf && !isCasualOrFun) {
      // Tier 4: "Please upload a picture of yourself" (without the word 'professional')
      score = 90;
    } else if (hasPhotoWord && !isCasualOrFun) {
      // Tier 5: Generic "Photo", "Picture"
      score = 70;
    } else if (isExplicitImg && !isCasualOrFun) {
      // Tier 6: Unlabeled image file upload
      score = 40;
    } else if (isCasualOrFun) {
      // Tier 7: Explicitly casual/fun picture (only fallback if no professional/headshot exists)
      score = 10;
    } else {
      score = 5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestPhoto = strVal;
    }
  }

  // Fallback to direct keys if not picked up above with a high-confidence score
  if (!bestPhoto || bestScore < 70) {
    const directHeadshot =
      parsedAnswers.headshot ||
      parsedAnswers.photo_headshot ||
      parsedAnswers.professional_headshot;
    if (typeof directHeadshot === "string" && directHeadshot.trim()) {
      return directHeadshot.trim();
    }
  }

  if (!bestPhoto || bestScore < 40) {
    const directFallback =
      parsedAnswers.photo ||
      parsedAnswers.photo_url ||
      parsedAnswers.picture;
    if (typeof directFallback === "string" && directFallback.trim()) {
      return directFallback.trim();
    }
  }

  // If the only matched item was an artifact (score <= 0), don't return it as a profile picture
  if (bestScore <= 0) {
    return "";
  }

  return bestPhoto;
}

export function resolveApplicantFields(
  answers: Record<string, any> = {},
  questionLabels: Record<string, string> = {},
) {
  let major = answers.major || "";
  let minor = answers.minor || "";
  let gpa = answers.gpa || "";
  let grad_term = answers.grad_term || answers.graduation_term || answers.grad_year || "";
  let phone = answers.phone || answers.phone_number || "";
  let pronouns = answers.pronouns || "";
  let resume_url = answers.resume || answers.resume_url || "";
  let photo_url = resolveApplicantPhoto(answers, questionLabels);

  // Scan answers with key & label fuzzy matching
  for (const [key, val] of Object.entries(answers)) {
    if (!val) continue;
    const strVal = typeof val === "string" ? val.trim() : "";
    if (!strVal) continue;
    const label = (questionLabels[key] || "").toLowerCase();
    const keyLower = key.toLowerCase();

    if (!major && (/major|field.*study|concentration/i.test(label) || /major|field.*study|concentration/i.test(keyLower))) {
      major = strVal;
    }
    if (!minor && (/minor/i.test(label) || /minor/i.test(keyLower))) {
      minor = strVal;
    }
    if (!gpa && (/gpa|grade\s*point/i.test(label) || /^gpa$/i.test(keyLower))) {
      gpa = strVal;
    }
    if (!grad_term && (/grad.*term|graduation|grad.*year|class\s*standing/i.test(label) || /grad/i.test(keyLower))) {
      grad_term = strVal;
    }
    if (!phone && (/phone/i.test(label) || /phone/i.test(keyLower))) {
      phone = strVal;
    }
    if (!pronouns && (/pronoun/i.test(label) || /pronoun/i.test(keyLower))) {
      pronouns = strVal;
    }
    if (!resume_url && (/resume|cv|curriculum/i.test(label) || /resume|cv/i.test(keyLower))) {
      if (strVal.startsWith("http") || strVal.startsWith("/uploads/")) {
        resume_url = strVal;
      }
    }
    // Fallback detection from uploaded paths for resume
    if (!resume_url && (strVal.startsWith("/uploads/resume_") || (strVal.startsWith("/uploads/") && /\.(pdf|docx?)$/i.test(strVal)))) {
      resume_url = strVal;
    }
  }

  return { major, minor, gpa, grad_term, phone, pronouns, resume_url, photo_url };
}

async function getAssignedSubmissionsForBrother(
  brotherEmail: string,
  isAdmin: boolean,
): Promise<any[]> {
  const normEmail = brotherEmail.trim().toLowerCase();
  if (useDb) {
    let query = `
      SELECT s.*, c.name as cycle_name, f.questions as form_questions,
        COALESCE(
          (SELECT json_agg(a.brother_email) FROM application_assignments a WHERE a.submission_id = s.id),
          '[]'::json
        ) as assigned_brothers,
        (SELECT json_build_object('score', sc.score, 'note', sc.note, 'rated_at', sc.rated_at)
         FROM application_scores sc
         WHERE sc.submission_id = s.id AND LOWER(sc.rater_id) = $1
         LIMIT 1) as app_score,
        (SELECT json_build_object('score', re1.score, 'note', re1.note, 'rated_at', re1.rated_at)
         FROM round_evaluations re1
         WHERE re1.submission_id = s.id AND re1.round = 1 AND LOWER(re1.rater_id) = $1
         LIMIT 1) as r1_score,
        (SELECT json_build_object('score', re2.score, 'note', re2.note, 'rated_at', re2.rated_at)
         FROM round_evaluations re2
         WHERE re2.submission_id = s.id AND re2.round = 2 AND LOWER(re2.rater_id) = $1
         LIMIT 1) as r2_score
      FROM application_submissions s
      JOIN recruitment_cycles c ON c.id = s.cycle_id
      LEFT JOIN recruitment_cycle_forms f ON f.cycle_id = c.id
    `;
    if (!isAdmin) {
      query += ` JOIN application_assignments aa ON aa.submission_id = s.id AND LOWER(aa.brother_email) = $1`;
    }
    query += ` ORDER BY s.id DESC`;

    const mapSubmission = (s: any) => {
      let answers = s.answers || {};
      if (typeof answers === "string") {
        try {
          answers = JSON.parse(answers);
        } catch {
          answers = {};
        }
      }
      const assigned_brothers = s.assigned_brothers || [];
      let formQuestions = s.form_questions || [];
      if (typeof formQuestions === "string") {
        try {
          formQuestions = JSON.parse(formQuestions);
        } catch {
          formQuestions = [];
        }
      }
      const question_labels = extractQuestionLabels(formQuestions);
      const resolved = resolveApplicantFields(answers, question_labels);
      const is_bba = isApplicantBba({ ...s, answers }, question_labels);

      let current_round: "application" | "round1" | "round2" = "application";
      let current_round_name = "Application Round";
      let myScoreObj = s.app_score || null;

      if (s.application_status === "advanced_to_round_1") {
        if (s.round_1_status === "advanced") {
          current_round = "round2";
          current_round_name = "Round 2 Interview";
          myScoreObj = s.r2_score || null;
        } else {
          current_round = "round1";
          current_round_name = "Round 1 Interview";
          myScoreObj = s.r1_score || null;
        }
      }

      return {
        ...s,
        full_name: s.applicant_name,
        email: s.applicant_email,
        phone: resolved.phone,
        major: resolved.major,
        minor: resolved.minor,
        gpa: resolved.gpa,
        grad_term: resolved.grad_term,
        pronouns: resolved.pronouns,
        resume_url: resolved.resume_url,
        photo_url: resolved.photo_url,
        is_bba,
        responses: answers,
        question_labels,
        current_round,
        current_round_name,
        cycle_name: s.cycle_name || "Active Cycle",
        assigned_brothers,
        candidate_number: s.candidate_number ?? null,
        candidateNumber: s.candidate_number ?? null,
        my_score: myScoreObj,
        existingScore: myScoreObj
          ? { score: myScoreObj.score, notes: myScoreObj.note, round_name: current_round_name }
          : null,
      };
    };

    const res = await pool.query(query, [normEmail]);
    return res.rows.map(mapSubmission);
  } else {
    const store = readLocalStore();
    let subs = store.submissions;
    if (!isAdmin) {
      const assignedSubIds = new Set(
        store.assignments
          .filter((a) => a.brother_email.toLowerCase() === normEmail)
          .map((a) => a.submission_id),
      );
      subs = subs.filter((s) => assignedSubIds.has(s.id));
    }

    return subs.map((s) => {
      const cycle = store.cycles.find((c) => c.id === s.cycle_id);
      const form = store.forms.find((f) => f.cycle_id === s.cycle_id);
      const formQuestions = form?.questions || [];
      const question_labels = extractQuestionLabels(formQuestions);
      const assigned_brothers = store.assignments
        .filter((a) => a.submission_id === s.id)
        .map((a) => a.brother_email);

      let current_round: "application" | "round1" | "round2" = "application";
      let current_round_name = "Application Round";
      let myScoreObj: any = null;

      if (s.application_status === "advanced_to_round_1") {
        if (s.round_1_status === "advanced") {
          current_round = "round2";
          current_round_name = "Round 2 Interview";
          const r2 = store.roundEvals.find(
            (sc) => sc.submission_id === s.id && sc.round === 2 && sc.rater_id.toLowerCase() === normEmail,
          );
          myScoreObj = r2 ? { score: r2.score, note: r2.note, rated_at: r2.rated_at } : null;
        } else {
          current_round = "round1";
          current_round_name = "Round 1 Interview";
          const r1 = store.roundEvals.find(
            (sc) => sc.submission_id === s.id && sc.round === 1 && sc.rater_id.toLowerCase() === normEmail,
          );
          myScoreObj = r1 ? { score: r1.score, note: r1.note, rated_at: r1.rated_at } : null;
        }
      } else {
        const app = store.appScores.find(
          (sc) => sc.submission_id === s.id && sc.rater_id.toLowerCase() === normEmail,
        );
        myScoreObj = app ? { score: app.score, note: app.note, rated_at: app.rated_at } : null;
      }

      let answers = s.answers || {};
      if (typeof answers === "string") {
        try {
          answers = JSON.parse(answers);
        } catch {
          answers = {};
        }
      }
      const resolved = resolveApplicantFields(answers, question_labels);
      const is_bba = isApplicantBba({ ...s, answers }, question_labels);

      return {
        ...s,
        full_name: s.applicant_name,
        email: s.applicant_email,
        phone: resolved.phone,
        major: resolved.major,
        minor: resolved.minor,
        gpa: resolved.gpa,
        grad_term: resolved.grad_term,
        pronouns: resolved.pronouns,
        resume_url: resolved.resume_url,
        photo_url: resolved.photo_url,
        is_bba,
        responses: answers,
        question_labels,
        current_round,
        current_round_name,
        cycle_name: cycle?.name || "Active Cycle",
        assigned_brothers,
        candidate_number: s.candidate_number ?? null,
        candidateNumber: s.candidate_number ?? null,
        my_score: myScoreObj,
        existingScore: myScoreObj
          ? { score: myScoreObj.score, notes: myScoreObj.note, round_name: current_round_name }
          : null,
      };
    });
  }
}

// ── Round Data & Score Normalization Engine ────────────────────────────────────

export interface CandidateRow {
  submissionId: number;
  candidateNumber?: number | null;
  applicantName: string;
  applicantEmail: string;
  submittedAt: string;
  answers: Record<string, any>;
  status: string;
  isOverridden: boolean;
  assignedBrothers: string[];
  scores: Record<string, { score: number; note: string | null; ratedAt: string }>;
  referenceSum: number;
  scoredCount: number;
  normalizedScore: number | null;
  normalizedDetails: Array<{
    raterId: string;
    raterName: string;
    rawScore: number;
    weight: number;
  }>;
  highlight?: "green" | "yellow" | "red" | null;
  isBba: boolean;
  photoUrl?: string | null;
  resumeUrl?: string | null;
  major?: string | null;
  minor?: string | null;
  gpa?: string | null;
  gradTerm?: string | null;
  phone?: string | null;
  pronouns?: string | null;
}

export function isApplicantBba(
  sub: {
    id?: number;
    is_bba?: boolean | null;
    answers?: Record<string, any> | null;
  },
  questionLabels?: Record<string, string>,
): boolean {
  let answers = sub.answers;
  if (typeof answers === "string") {
    try {
      answers = JSON.parse(answers);
    } catch {
      answers = {};
    }
  }
  if (!answers || typeof answers !== "object") {
    answers = {};
  }

  // 1. Direct check for any Ross / BBA questions or answers
  for (const [k, v] of Object.entries(answers)) {
    if (v === undefined || v === null) continue;
    const keyLower = String(k).toLowerCase();
    const labelLower = String(questionLabels?.[k] || "").toLowerCase();

    // Does the question prompt or key ask about Ross, BBA, or Business School?
    const isRossQuestion =
      keyLower.includes("ross") ||
      keyLower.includes("is_bba") ||
      keyLower === "isross" ||
      labelLower.includes("ross") ||
      labelLower.includes("bba") ||
      labelLower.includes("business school");

    if (isRossQuestion) {
      if (typeof v === "boolean") {
        if (v === true) return true;
      }
      if (typeof v === "string") {
        const valLower = v.trim().toLowerCase();
        if (
          valLower === "yes" ||
          valLower === "y" ||
          valLower === "true" ||
          valLower === "1" ||
          valLower.startsWith("yes") ||
          valLower.includes("enrolled") ||
          valLower.includes("ross") ||
          valLower.includes("bba")
        ) {
          return true;
        }
      }
      if (Array.isArray(v)) {
        for (const item of v) {
          const itemLower = String(item).trim().toLowerCase();
          if (
            itemLower === "yes" ||
            itemLower.startsWith("yes") ||
            itemLower.includes("ross") ||
            itemLower.includes("bba")
          ) {
            return true;
          }
        }
      }
    }

    // What if the question is "School", "College", "School/College", or "Academic Unit"?
    const isSchoolQuestion =
      labelLower.includes("school") ||
      labelLower.includes("college") ||
      labelLower.includes("program") ||
      keyLower.includes("school") ||
      keyLower.includes("college");

    if (isSchoolQuestion && typeof v === "string") {
      const valLower = v.trim().toLowerCase();
      if (
        valLower.includes("ross") ||
        valLower.includes("bba") ||
        valLower.includes("business administration") ||
        valLower.includes("stephen m. ross")
      ) {
        return true;
      }
    }
  }

  // 2. Check major
  const resolved = resolveApplicantFields(answers, questionLabels || {});
  if (typeof resolved.major === "string") {
    const mLower = resolved.major.toLowerCase();
    if (
      mLower.includes("business administration") ||
      mLower.includes("bba") ||
      mLower.includes("ross")
    ) {
      return true;
    }
  }

  // 3. Fallback: Check if any answer value itself is explicitly Ross / BBA
  for (const [_, v] of Object.entries(answers)) {
    if (typeof v === "string" && v.length < 80) {
      const vl = v.trim().toLowerCase();
      if (
        vl === "ross" ||
        vl === "ross school of business" ||
        vl === "stephen m. ross school of business" ||
        vl === "bba" ||
        vl === "business administration"
      ) {
        return true;
      }
    }
  }

  // 4. If admin explicitly manually set is_bba to true, respect it
  if (sub.is_bba === true) {
    return true;
  }

  return false;
}

export function computeRoundNormalization(
  ratings: Array<{ raterId: string; raterName: string; submissionId: number; score: number }>,
  config: NormalizationConfig = DEFAULT_NORMALIZATION_CONFIG,
): {
  calibrationByRater: Record<string, RaterCalibration>;
  candidateScores: Map<
    number,
    {
      normalizedScore: number | null;
      details: Array<{ raterId: string; raterName: string; rawScore: number; weight: number }>;
    }
  >;
} {
  const validScoreKeys = ["-1", "-0.5", "0", "0.5", "1"];
  const targetDist = config.targetDistribution || DEFAULT_NORMALIZATION_CONFIG.targetDistribution;
  const k = typeof config.k === "number" && config.k > 0 ? config.k : 15;
  const minW = typeof config.minWeight === "number" ? config.minWeight : 0.3;
  const maxW = typeof config.maxWeight === "number" ? config.maxWeight : 3.0;

  // 1. Group ratings by rater
  const raterRatings = new Map<string, { raterName: string; scores: number[] }>();
  for (const r of ratings) {
    if (!raterRatings.has(r.raterId)) {
      raterRatings.set(r.raterId, { raterName: r.raterName, scores: [] });
    }
    raterRatings.get(r.raterId)!.scores.push(Number(r.score));
  }

  // 2. Compute calibration profiles per rater
  const calibrationByRater: Record<string, RaterCalibration> = {};
  for (const [raterId, data] of raterRatings.entries()) {
    const totalRatings = data.scores.length;
    const counts: Record<string, number> = { "-1": 0, "-0.5": 0, "0": 0, "0.5": 0, "1": 0 };
    let scoreSum = 0;

    for (const score of data.scores) {
      scoreSum += score;
      const key = (Math.round(score * 10) / 10).toString();
      if (counts[key] !== undefined) {
        counts[key]++;
      } else {
        let closestKey = "0";
        let minDiff = Infinity;
        for (const vk of validScoreKeys) {
          const diff = Math.abs(Number(vk) - score);
          if (diff < minDiff) {
            minDiff = diff;
            closestKey = vk;
          }
        }
        counts[closestKey]++;
      }
    }

    const observedPercentages: Record<string, number> = {};
    const smoothedPercentages: Record<string, number> = {};
    const targetPercentages: Record<string, number> = {};
    const weights: Record<string, number> = {};
    let isClamped = false;

    for (const vKey of validScoreKeys) {
      const count = counts[vKey] || 0;
      const targetP = targetDist[vKey] ?? (vKey === "0" ? 0.70 : vKey.includes("0.5") ? 0.10 : 0.05);
      targetPercentages[vKey] = Math.round(targetP * 10000) / 10000;

      // Observed percentage
      const obsP = totalRatings > 0 ? count / totalRatings : targetP;
      observedPercentages[vKey] = Math.round(obsP * 10000) / 10000;

      // Bayesian smoothed frequency: O_r(v) = (count + k * T(v)) / (n_r + k)
      const smoothedP = (count + k * targetP) / (totalRatings + k);
      smoothedPercentages[vKey] = Math.round(smoothedP * 10000) / 10000;

      // Weight w(r, v) = T(v) / O_r(v) clamped to [minW, maxW]
      let rawWeight = smoothedP > 0 ? targetP / smoothedP : 1.0;
      if (rawWeight <= minW) {
        weights[vKey] = minW;
        isClamped = true;
      } else if (rawWeight >= maxW) {
        weights[vKey] = maxW;
        isClamped = true;
      } else {
        weights[vKey] = Math.round(rawWeight * 1000) / 1000;
      }
    }

    // Bias tendency classification
    let biasTendency: "easy" | "harsh" | "balanced" | "calibrating" = "calibrating";
    if (totalRatings >= 5) {
      const meanScore = scoreSum / totalRatings;
      if (meanScore > 0.12) {
        biasTendency = "easy";
      } else if (meanScore < -0.12) {
        biasTendency = "harsh";
      } else {
        biasTendency = "balanced";
      }
    }

    calibrationByRater[raterId] = {
      raterId,
      raterName: data.raterName,
      totalRatings,
      counts,
      observedPercentages,
      smoothedPercentages,
      targetPercentages,
      weights,
      biasTendency,
      isClamped,
    };
  }

  // 3. Compute normalized scores per submission
  const ratingsBySub = new Map<number, Array<{ raterId: string; raterName: string; score: number }>>();
  for (const r of ratings) {
    if (!ratingsBySub.has(r.submissionId)) {
      ratingsBySub.set(r.submissionId, []);
    }
    ratingsBySub.get(r.submissionId)!.push({
      raterId: r.raterId,
      raterName: r.raterName,
      score: Number(r.score),
    });
  }

  const candidateScores = new Map<
    number,
    {
      normalizedScore: number | null;
      details: Array<{ raterId: string; raterName: string; rawScore: number; weight: number }>;
    }
  >();

  for (const [submissionId, subRatings] of ratingsBySub.entries()) {
    if (subRatings.length === 0) {
      candidateScores.set(submissionId, { normalizedScore: null, details: [] });
      continue;
    }

    let weightedSum = 0;
    let weightSum = 0;
    const details: Array<{ raterId: string; raterName: string; rawScore: number; weight: number }> = [];

    for (const r of subRatings) {
      const calib = calibrationByRater[r.raterId];
      const scoreKey = (Math.round(r.score * 10) / 10).toString();
      let weight = 1.0;
      if (calib && calib.weights[scoreKey] !== undefined) {
        weight = calib.weights[scoreKey];
      } else {
        let closestKey = "0";
        let minDiff = Infinity;
        for (const vk of validScoreKeys) {
          const diff = Math.abs(Number(vk) - r.score);
          if (diff < minDiff) {
            minDiff = diff;
            closestKey = vk;
          }
        }
        weight = calib ? calib.weights[closestKey] ?? 1.0 : 1.0;
      }

      weightedSum += weight * r.score;
      weightSum += weight;
      details.push({
        raterId: r.raterId,
        raterName: r.raterName,
        rawScore: r.score,
        weight: Math.round(weight * 1000) / 1000,
      });
    }

    const norm = weightSum > 0 ? Math.round((weightedSum / weightSum) * 100) / 100 : null;
    candidateScores.set(submissionId, {
      normalizedScore: norm,
      details,
    });
  }

  return {
    calibrationByRater,
    candidateScores,
  };
}

async function getRoundCandidates(
  cycleId: number,
  round: "application" | "round1" | "round2",
): Promise<{
  candidates: CandidateRow[];
  raters: { raterId: string; raterName: string }[];
  ratersCalibration: Record<string, RaterCalibration>;
  normalizationConfig: NormalizationConfig;
  questionLabels: Record<string, string>;
}> {
  const form = await getCycleForm(cycleId);
  const normConfig = form?.normalization_config || DEFAULT_NORMALIZATION_CONFIG;
  const questionLabels = extractQuestionLabels(form?.questions || []);

  await ensureCandidateNumbers(cycleId);

  if (useDb) {
    let filterClause = "cycle_id = $1";
    if (round === "round1") {
      filterClause += " AND application_status = 'advanced_to_round_1'";
    } else if (round === "round2") {
      filterClause += " AND application_status = 'advanced_to_round_1' AND round_1_status = 'advanced'";
    }

    const subRes = await pool.query(
      `SELECT * FROM application_submissions WHERE ${filterClause} ORDER BY id ASC`,
      [cycleId],
    );
    const submissions: ApplicationSubmission[] = subRes.rows;
    if (submissions.length === 0) {
      return {
        candidates: [],
        raters: [],
        ratersCalibration: {},
        normalizationConfig: normConfig,
        questionLabels,
      };
    }

    const subIds = submissions.map((s) => s.id);

    // Fetch assignments
    const assignRes = await pool.query(
      "SELECT submission_id, brother_email FROM application_assignments WHERE submission_id = ANY($1::int[])",
      [subIds],
    );
    const assignMap = new Map<number, string[]>();
    for (const row of assignRes.rows) {
      if (!assignMap.has(row.submission_id)) assignMap.set(row.submission_id, []);
      assignMap.get(row.submission_id)!.push(row.brother_email);
    }

    // Fetch scores strictly from isolated table
    let scoresRes: any[] = [];
    if (round === "application") {
      const res = await pool.query(
        `SELECT submission_id, rater_id, rater_name, score::float as score, note, rated_at
         FROM application_scores WHERE submission_id = ANY($1::int[])`,
        [subIds],
      );
      scoresRes = res.rows;
    } else {
      const roundNum = round === "round1" ? 1 : 2;
      const res = await pool.query(
        `SELECT submission_id, rater_id, rater_name, score::float as score, note, rated_at
         FROM round_evaluations WHERE submission_id = ANY($1::int[]) AND round = $2`,
        [subIds, roundNum],
      );
      scoresRes = res.rows;
    }

    const raterMap = new Map<string, string>();
    const scoresBySub = new Map<number, Record<string, { score: number; note: string | null; ratedAt: string }>>();

    for (const row of scoresRes) {
      raterMap.set(row.rater_id, row.rater_name);
      if (!scoresBySub.has(row.submission_id)) {
        scoresBySub.set(row.submission_id, {});
      }
      scoresBySub.get(row.submission_id)![row.rater_id] = {
        score: Number(row.score),
        note: row.note,
        ratedAt: row.rated_at,
      };
    }

    const raters = Array.from(raterMap.entries()).map(([raterId, raterName]) => ({
      raterId,
      raterName,
    }));

    // Compute normalization for this round
    const normResult = computeRoundNormalization(
      scoresRes.map((r) => ({
        raterId: r.rater_id,
        raterName: r.rater_name,
        submissionId: r.submission_id,
        score: Number(r.score),
      })),
      normConfig,
    );

    const candidates: CandidateRow[] = submissions.map((s) => {
      let answers = s.answers || {};
      if (typeof answers === "string") {
        try {
          answers = JSON.parse(answers);
        } catch {
          answers = {};
        }
      }

      const rowScores = scoresBySub.get(s.id) ?? {};
      const scoreValues = Object.values(rowScores).map((sc) => sc.score);
      const referenceSum = scoreValues.reduce((acc, val) => acc + val, 0);

      let status = s.application_status as string;
      let isOverridden = s.app_override;
      let highlight: "green" | "yellow" | "red" | null = null;
      if (round === "application") {
        status = s.application_status;
        isOverridden = s.app_override;
        highlight = (s as any).app_highlight || null;
      } else if (round === "round1") {
        status = s.round_1_status;
        isOverridden = s.r1_override;
        highlight = (s as any).r1_highlight || null;
      } else if (round === "round2") {
        status = s.round_2_status;
        isOverridden = s.r2_override;
        highlight = (s as any).r2_highlight || null;
      }

      const candNorm = normResult.candidateScores.get(s.id);
      const isBba = isApplicantBba({ ...s, answers }, questionLabels);

      // Auto-heal database record if previously saved as non-bba
      if (useDb && s.id && s.is_bba !== isBba) {
        pool.query("UPDATE application_submissions SET is_bba = $1 WHERE id = $2", [isBba, s.id]).catch(() => {});
      }

      const resolved = resolveApplicantFields(answers, questionLabels);

      return {
        submissionId: s.id,
        candidateNumber: s.candidate_number ?? null,
        applicantName: s.applicant_name,
        applicantEmail: s.applicant_email,
        submittedAt: s.submitted_at,
        answers,
        status,
        isOverridden,
        assignedBrothers: assignMap.get(s.id) ?? [],
        scores: rowScores,
        referenceSum: Math.round(referenceSum * 10) / 10,
        scoredCount: scoreValues.length,
        normalizedScore: candNorm?.normalizedScore ?? null,
        normalizedDetails: candNorm?.details ?? [],
        highlight,
        isBba,
        photoUrl: resolved.photo_url || null,
        resumeUrl: resolved.resume_url || null,
        major: resolved.major || "",
        minor: resolved.minor || "",
        gpa: resolved.gpa || "",
        gradTerm: resolved.grad_term || "",
        phone: resolved.phone || "",
        pronouns: resolved.pronouns || "",
      };
    });

    return {
      candidates,
      raters,
      ratersCalibration: normResult.calibrationByRater,
      normalizationConfig: normConfig,
      questionLabels,
    };
  } else {
    const store = readLocalStore();
    let eligible = store.submissions.filter((s) => s.cycle_id === cycleId);
    if (round === "round1") {
      eligible = eligible.filter((s) => s.application_status === "advanced_to_round_1");
    } else if (round === "round2") {
      eligible = eligible.filter(
        (s) => s.application_status === "advanced_to_round_1" && s.round_1_status === "advanced",
      );
    }

    if (eligible.length === 0) {
      return {
        candidates: [],
        raters: [],
        ratersCalibration: {},
        normalizationConfig: normConfig,
        questionLabels,
      };
    }

    const subIds = new Set(eligible.map((s) => s.id));
    const raterMap = new Map<string, string>();
    const scoresBySub = new Map<number, Record<string, { score: number; note: string | null; ratedAt: string }>>();
    let allRoundScores: Array<{ rater_id: string; rater_name: string; submission_id: number; score: number }> = [];

    if (round === "application") {
      const scores = store.appScores.filter((sc) => subIds.has(sc.submission_id));
      allRoundScores = scores;
      for (const sc of scores) {
        raterMap.set(sc.rater_id, sc.rater_name);
        if (!scoresBySub.has(sc.submission_id)) scoresBySub.set(sc.submission_id, {});
        scoresBySub.get(sc.submission_id)![sc.rater_id] = {
          score: sc.score,
          note: sc.note,
          ratedAt: sc.rated_at,
        };
      }
    } else {
      const roundNum = round === "round1" ? 1 : 2;
      const scores = store.roundEvals.filter((sc) => subIds.has(sc.submission_id) && sc.round === roundNum);
      allRoundScores = scores;
      for (const sc of scores) {
        raterMap.set(sc.rater_id, sc.rater_name);
        if (!scoresBySub.has(sc.submission_id)) scoresBySub.set(sc.submission_id, {});
        scoresBySub.get(sc.submission_id)![sc.rater_id] = {
          score: sc.score,
          note: sc.note,
          ratedAt: sc.rated_at,
        };
      }
    }

    const raters = Array.from(raterMap.entries()).map(([raterId, raterName]) => ({
      raterId,
      raterName,
    }));

    // Compute normalization for this round
    const normResult = computeRoundNormalization(
      allRoundScores.map((sc) => ({
        raterId: sc.rater_id,
        raterName: sc.rater_name,
        submissionId: sc.submission_id,
        score: sc.score,
      })),
      normConfig,
    );

    const candidates: CandidateRow[] = eligible.map((s) => {
      const rowScores = scoresBySub.get(s.id) ?? {};
      const scoreValues = Object.values(rowScores).map((sc) => sc.score);
      const referenceSum = scoreValues.reduce((acc, val) => acc + val, 0);

      let status = s.application_status as string;
      let isOverridden = s.app_override;
      let highlight: "green" | "yellow" | "red" | null = null;
      if (round === "application") {
        status = s.application_status;
        isOverridden = s.app_override;
        highlight = s.app_highlight || null;
      } else if (round === "round1") {
        status = s.round_1_status;
        isOverridden = s.r1_override;
        highlight = s.r1_highlight || null;
      } else if (round === "round2") {
        status = s.round_2_status;
        isOverridden = s.r2_override;
        highlight = s.r2_highlight || null;
      }

      const assignedBrothers = store.assignments
        .filter((a) => a.submission_id === s.id)
        .map((a) => a.brother_email);

      const candNorm = normResult.candidateScores.get(s.id);
      let answers = s.answers || {};
      if (typeof answers === "string") {
        try {
          answers = JSON.parse(answers);
        } catch {
          answers = {};
        }
      }
      const isBba = isApplicantBba({ ...s, answers }, questionLabels);
      s.is_bba = isBba;

      const resolved = resolveApplicantFields(answers, questionLabels);

      return {
        submissionId: s.id,
        candidateNumber: s.candidate_number ?? null,
        applicantName: s.applicant_name,
        applicantEmail: s.applicant_email,
        submittedAt: s.submitted_at,
        answers,
        status,
        isOverridden,
        assignedBrothers,
        scores: rowScores,
        referenceSum: Math.round(referenceSum * 10) / 10,
        scoredCount: scoreValues.length,
        normalizedScore: candNorm?.normalizedScore ?? null,
        normalizedDetails: candNorm?.details ?? [],
        highlight,
        isBba,
        photoUrl: resolved.photo_url || null,
        resumeUrl: resolved.resume_url || null,
        major: resolved.major || "",
        minor: resolved.minor || "",
        gpa: resolved.gpa || "",
        gradTerm: resolved.grad_term || "",
        phone: resolved.phone || "",
        pronouns: resolved.pronouns || "",
      };
    });

    return {
      candidates,
      raters,
      ratersCalibration: normResult.calibrationByRater,
      normalizationConfig: normConfig,
      questionLabels,
    };
  }
}

async function upsertScore(params: {
  round: "application" | "round1" | "round2";
  submissionId: number;
  raterId: string;
  raterName: string;
  score: number;
  note?: string;
}): Promise<void> {
  const { round, submissionId, raterId, raterName, score, note } = params;
  if (!VALID_SCORES.has(score)) {
    throw new Error(`Invalid score ${score}. Allowed: -1, -0.5, 0, 0.5, 1`);
  }

  if (useDb) {
    if (round === "application") {
      await pool.query(
        `INSERT INTO application_scores (submission_id, rater_id, rater_name, score, note, rated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (submission_id, rater_id)
         DO UPDATE SET score = EXCLUDED.score, note = EXCLUDED.note, rated_at = NOW()`,
        [submissionId, raterId, raterName, score, note ?? null],
      );
    } else {
      const roundNum = round === "round1" ? 1 : 2;
      await pool.query(
        `INSERT INTO round_evaluations (submission_id, round, rater_id, rater_name, score, note, rated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (submission_id, round, rater_id)
         DO UPDATE SET score = EXCLUDED.score, note = EXCLUDED.note, rated_at = NOW()`,
        [submissionId, roundNum, raterId, raterName, score, note ?? null],
      );
    }
  } else {
    const store = readLocalStore();
    if (round === "application") {
      let existing = store.appScores.find(
        (s) => s.submission_id === submissionId && s.rater_id === raterId,
      );
      if (existing) {
        existing.score = score;
        existing.note = note ?? null;
        existing.rated_at = new Date().toISOString();
      } else {
        store.appScores.push({
          id: store.nextId.appScores++,
          submission_id: submissionId,
          rater_id: raterId,
          rater_name: raterName,
          score,
          note: note ?? null,
          rated_at: new Date().toISOString(),
        });
      }
    } else {
      const roundNum = round === "round1" ? 1 : 2;
      let existing = store.roundEvals.find(
        (s) => s.submission_id === submissionId && s.round === roundNum && s.rater_id === raterId,
      );
      if (existing) {
        existing.score = score;
        existing.note = note ?? null;
        existing.rated_at = new Date().toISOString();
      } else {
        store.roundEvals.push({
          id: store.nextId.roundEvals++,
          submission_id: submissionId,
          round: roundNum,
          rater_id: raterId,
          rater_name: raterName,
          score,
          note: note ?? null,
          rated_at: new Date().toISOString(),
        });
      }
    }
    writeLocalStore(store);
  }
}

async function overrideSubmissionStatus(
  submissionId: number,
  round: "application" | "round1" | "round2",
  newStatus: string,
): Promise<void> {
  if (useDb) {
    if (round === "application") {
      await pool.query(
        "UPDATE application_submissions SET application_status = $1, app_override = true WHERE id = $2",
        [newStatus, submissionId],
      );
    } else if (round === "round1") {
      await pool.query(
        "UPDATE application_submissions SET round_1_status = $1, r1_override = true WHERE id = $2",
        [newStatus, submissionId],
      );
    } else if (round === "round2") {
      await pool.query(
        "UPDATE application_submissions SET round_2_status = $1, r2_override = true WHERE id = $2",
        [newStatus, submissionId],
      );
    }
  } else {
    const store = readLocalStore();
    const sub = store.submissions.find((s) => s.id === submissionId);
    if (!sub) throw new Error("Submission not found");
    if (round === "application") {
      sub.application_status = newStatus as any;
      sub.app_override = true;
    } else if (round === "round1") {
      sub.round_1_status = newStatus as any;
      sub.r1_override = true;
    } else if (round === "round2") {
      sub.round_2_status = newStatus as any;
      sub.r2_override = true;
    }
    writeLocalStore(store);
  }
}

async function bulkApplyCutoff(params: {
  cycleId: number;
  round: "application" | "round1" | "round2";
  decisions?: { submissionId: number; newStatus: string }[];
  highlights?: { submissionId: number; highlight: "green" | "yellow" | "red" | null }[];
}): Promise<void> {
  const { round, decisions, highlights } = params;
  if (useDb) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      if (decisions && decisions.length > 0) {
        for (const d of decisions) {
          if (round === "application") {
            await client.query(
              "UPDATE application_submissions SET application_status = $1, app_override = false WHERE id = $2",
              [d.newStatus, d.submissionId],
            );
          } else if (round === "round1") {
            await client.query(
              "UPDATE application_submissions SET round_1_status = $1, r1_override = false WHERE id = $2",
              [d.newStatus, d.submissionId],
            );
          } else if (round === "round2") {
            await client.query(
              "UPDATE application_submissions SET round_2_status = $1, r2_override = false WHERE id = $2",
              [d.newStatus, d.submissionId],
            );
          }
        }
      }
      if (highlights && highlights.length > 0) {
        for (const h of highlights) {
          if (round === "application") {
            await client.query(
              "UPDATE application_submissions SET app_highlight = $1 WHERE id = $2",
              [h.highlight, h.submissionId],
            );
          } else if (round === "round1") {
            await client.query(
              "UPDATE application_submissions SET r1_highlight = $1 WHERE id = $2",
              [h.highlight, h.submissionId],
            );
          } else if (round === "round2") {
            await client.query(
              "UPDATE application_submissions SET r2_highlight = $1 WHERE id = $2",
              [h.highlight, h.submissionId],
            );
          }
        }
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } else {
    const store = readLocalStore();
    if (decisions && decisions.length > 0) {
      const decMap = new Map(decisions.map((d) => [d.submissionId, d.newStatus]));
      for (const sub of store.submissions) {
        if (decMap.has(sub.id)) {
          const newStatus = decMap.get(sub.id)!;
          if (round === "application") {
            sub.application_status = newStatus as any;
            sub.app_override = false;
          } else if (round === "round1") {
            sub.round_1_status = newStatus as any;
            sub.r1_override = false;
          } else if (round === "round2") {
            sub.round_2_status = newStatus as any;
            sub.r2_override = false;
          }
        }
      }
    }
    if (highlights && highlights.length > 0) {
      const hlMap = new Map(highlights.map((h) => [h.submissionId, h.highlight]));
      for (const sub of store.submissions) {
        if (hlMap.has(sub.id)) {
          const hl = hlMap.get(sub.id) ?? null;
          if (round === "application") {
            sub.app_highlight = hl;
          } else if (round === "round1") {
            sub.r1_highlight = hl;
          } else if (round === "round2") {
            sub.r2_highlight = hl;
          }
        }
      }
    }
    writeLocalStore(store);
  }
}

async function setSingleHighlight(
  submissionId: number,
  round: "application" | "round1" | "round2",
  highlight: "green" | "yellow" | "red" | null,
): Promise<void> {
  if (useDb) {
    if (round === "application") {
      await pool.query("UPDATE application_submissions SET app_highlight = $1 WHERE id = $2", [highlight, submissionId]);
    } else if (round === "round1") {
      await pool.query("UPDATE application_submissions SET r1_highlight = $1 WHERE id = $2", [highlight, submissionId]);
    } else if (round === "round2") {
      await pool.query("UPDATE application_submissions SET r2_highlight = $1 WHERE id = $2", [highlight, submissionId]);
    }
  } else {
    const store = readLocalStore();
    const sub = store.submissions.find((s) => s.id === submissionId);
    if (sub) {
      if (round === "application") sub.app_highlight = highlight;
      else if (round === "round1") sub.r1_highlight = highlight;
      else if (round === "round2") sub.r2_highlight = highlight;
      writeLocalStore(store);
    }
  }
}

// ── HTTP Routes ───────────────────────────────────────────────────────────────

// 1. GET /api/recruitment/active-cycle  (Public / Admin Preview)
recruitmentRouter.get("/active-cycle", async (req: Request, res: Response) => {
  try {
    const authUser = getOptionalAuthUser(req);
    const isAdmin = Boolean(authUser?.isAdmin);

    let active = await getActiveCycle();
    if (!active && isAdmin) {
      // If admin and no cycle is currently open, fallback to latest cycle for testing
      const all = await getCycles();
      if (all.length > 0) {
        const latest = all[0];
        const form = await getCycleForm(latest.id);
        if (form) active = { cycle: latest, form };
      }
    }

    if (!active) {
      const all = await getCycles();
      res.json({ active: false, cycle: null, form: null, totalCycles: all.length });
      return;
    }

    const { cycle, form } = active;
    const now = new Date();
    const isLocked = Boolean(form.is_locked);
    const opensAt = form.opens_at ? new Date(form.opens_at) : null;
    const closesAt = form.closes_at ? new Date(form.closes_at) : null;

    let computedStatus: "scheduled" | "open" | "closed" = "closed";
    if (isLocked) {
      computedStatus = "closed";
    } else if (opensAt && now < opensAt) {
      computedStatus = "scheduled";
    } else if (closesAt && now > closesAt) {
      computedStatus = "closed";
    } else if (cycle.status === "open") {
      computedStatus = "open";
    }

    res.json({
      active: true,
      cycle,
      form,
      computedStatus,
      isAcceptingSubmissions: computedStatus === "open" || isAdmin,
      isAdminBypass: isAdmin,
    });
  } catch (err) {
    console.error("Error fetching active cycle:", err);
    res.status(500).json({ error: "Failed to load recruitment cycle." });
  }
});

// 2. GET /api/recruitment/my-submission  (Requires @umich.edu auth)
recruitmentRouter.get("/my-submission", requireAuth, async (req: AuthRequest, res: Response) => {
  const userEmail = req.user?.email;
  const isAdmin = Boolean(req.user?.isAdmin);
  if (!userEmail) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const cycleIdParam = req.query.cycleId ? Number(req.query.cycleId) : null;
    let cycle: RecruitmentCycle | null = null;
    let form: CycleForm | null = null;

    if (cycleIdParam) {
      cycle = await getCycleById(cycleIdParam);
      if (cycle) form = await getCycleForm(cycle.id);
    } else {
      const active = await getActiveCycle();
      if (active) {
        cycle = active.cycle;
        form = active.form;
      } else if (isAdmin) {
        const all = await getCycles();
        if (all.length > 0) {
          cycle = all[0];
          form = await getCycleForm(cycle.id);
        }
      }
    }

    if (!cycle || !form) {
      res.json({ submitted: false, cycle: null, submission: null });
      return;
    }

    // If an admin requests a fresh form to submit another test application
    if (isAdmin && req.query.newTest === "true") {
      res.json({ submitted: false, cycle, submission: null });
      return;
    }

    const submission = await getSubmissionForUser(cycle.id, userEmail);
    if (!submission) {
      res.json({ submitted: false, cycle, submission: null });
      return;
    }

    const messages = form.status_messages || DEFAULT_STATUS_MESSAGES;
    let stage: "application" | "round1" | "round2" = "application";
    let statusKey = submission.application_status as string;
    let message = messages.application?.[statusKey] || DEFAULT_STATUS_MESSAGES.application[statusKey as keyof typeof DEFAULT_STATUS_MESSAGES.application];

    if (submission.application_status === "advanced_to_round_1") {
      stage = "round1";
      if (submission.round_1_status === "advanced") {
        stage = "round2";
        if (submission.round_2_status === "offered_bid") {
          statusKey = "offered_bid";
          message = messages.round2?.offered_bid || DEFAULT_STATUS_MESSAGES.round2.offered_bid;
        } else if (submission.round_2_status === "not_selected") {
          statusKey = "not_selected";
          message = messages.round2?.not_selected || DEFAULT_STATUS_MESSAGES.round2.not_selected;
        } else if (submission.round_2_status === "pending_review" || submission.round_2_status === "under_review") {
          statusKey = "pending";
          message = messages.round2?.pending || DEFAULT_STATUS_MESSAGES.round2.pending;
        } else {
          // Newly advanced to round 2 - show congrats on moving on message!
          statusKey = "advanced";
          message = messages.round1?.advanced || DEFAULT_STATUS_MESSAGES.round1.advanced;
        }
      } else if (submission.round_1_status === "not_selected") {
        statusKey = "not_selected";
        message = messages.round1?.not_selected || DEFAULT_STATUS_MESSAGES.round1.not_selected;
      } else if (submission.round_1_status === "pending_review" || submission.round_1_status === "under_review") {
        statusKey = "pending";
        message = messages.round1?.pending || DEFAULT_STATUS_MESSAGES.round1.pending;
      } else {
        // Newly advanced to round 1 - show congrats on moving on message!
        statusKey = "advanced_to_round_1";
        message = messages.application?.advanced_to_round_1 || DEFAULT_STATUS_MESSAGES.application.advanced_to_round_1;
      }
    }

    res.json({
      submitted: true,
      cycle,
      submission,
      stage,
      statusKey,
      message,
    });
  } catch (err) {
    console.error("Error fetching user submission:", err);
    res.status(500).json({ error: "Failed to fetch submission." });
  }
});

// 3. POST /api/recruitment/submit  (Requires @umich.edu auth)
recruitmentRouter.post("/submit", requireAuth, async (req: AuthRequest, res: Response) => {
  const userEmail = req.user?.email;
  const userName = req.user?.name || userEmail?.split("@")[0] || "Applicant";
  const isAdmin = Boolean(req.user?.isAdmin);

  if (!userEmail) {
    res.status(401).json({ error: "Unauthorized: @umich.edu Google sign-in required." });
    return;
  }

  const { cycleId, answers } = req.body as { cycleId?: number; answers?: Record<string, any> };
  if (!answers || typeof answers !== "object") {
    res.status(400).json({ error: "Invalid submission data." });
    return;
  }

  try {
    let active = await getActiveCycle();
    if (cycleId) {
      const c = await getCycleById(cycleId);
      if (c) {
        const f = await getCycleForm(c.id);
        if (f) active = { cycle: c, form: f };
      }
    } else if (!active && isAdmin) {
      const all = await getCycles();
      if (all.length > 0) {
        const c = all[0];
        const f = await getCycleForm(c.id);
        if (f) active = { cycle: c, form: f };
      }
    }

    if (!active) {
      res.status(403).json({ error: "Applications are not currently open." });
      return;
    }

    const { cycle, form } = active;

    // Normal applicants must satisfy all cycle status and window constraints
    if (!isAdmin) {
      if (cycle.status !== "open") {
        res.status(403).json({ error: "This recruitment cycle is not accepting applications." });
        return;
      }

      if (form.is_locked) {
        res.status(403).json({ error: "Applications are currently locked by the recruitment chairs." });
        return;
      }

      const now = new Date();
      if (form.opens_at && now < new Date(form.opens_at)) {
        res.status(403).json({ error: "Applications have not yet opened." });
        return;
      }
      if (form.closes_at && now > new Date(form.closes_at)) {
        res.status(403).json({ error: "The application deadline has passed." });
        return;
      }

      const existing = await getSubmissionForUser(cycle.id, userEmail);
      if (existing) {
        res.status(409).json({ error: "You have already submitted an application for this cycle." });
        return;
      }
    }

    const existing = await getSubmissionForUser(cycle.id, userEmail);
    if (!isAdmin && existing) {
      res.status(409).json({ error: "You have already submitted an application for this cycle." });
      return;
    }

    const sections = Array.isArray(form.questions) ? form.questions : [];
    for (const section of sections) {
      for (const field of section.fields || []) {
        const val = answers[field.id];
        const fieldLabel = String(field.label || "").split("\n")[0].trim() || field.label;
        if (field.required) {
          if (val === undefined || val === null || String(val).trim() === "") {
            res.status(400).json({ error: `Please answer required field: ${fieldLabel}` });
            return;
          }
        }
        if (
          (field.type === "text" || field.type === "textarea") &&
          field.word_limit &&
          Number(field.word_limit) > 0 &&
          val &&
          typeof val === "string"
        ) {
          const count = val.trim().split(/\s+/).filter(Boolean).length;
          if (count > Number(field.word_limit)) {
            res.status(400).json({
              error: `Response for "${fieldLabel}" exceeds the maximum limit of ${field.word_limit} words (${count} words entered).`,
            });
            return;
          }
        }
      }
    }

    const applicantName = (answers.firstName && answers.lastName)
      ? `${answers.firstName} ${answers.lastName}`.trim()
      : (answers.name || userName || userEmail);

    const applicantEmail = (answers.email && typeof answers.email === "string" && answers.email.includes("@"))
      ? answers.email.trim()
      : userEmail;

    // If an admin is submitting repeat applications for testing, assign a unique test applicant identifier
    // to satisfy PostgreSQL `CONSTRAINT uq_cycle_applicant UNIQUE (cycle_id, applicant_user_id)`
    const applicantUserId = (isAdmin && existing)
      ? `${userEmail.toLowerCase()}#test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      : userEmail;

    const questionLabels = extractQuestionLabels(sections);
    const submission = await createSubmission({
      cycleId: cycle.id,
      applicantUserId,
      applicantEmail,
      applicantName,
      answers,
      questionLabels,
    });

    res.json({
      ok: true,
      submission,
      isTestSubmission: Boolean(isAdmin && existing),
    });
  } catch (err: any) {
    console.error("Application submission failed:", err);
    res.status(500).json({ error: err.message || "Failed to submit application. Please try again." });
  }
});

// 4. POST /api/recruitment/upload  (Upload resume / files)
recruitmentRouter.post("/upload", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { filename, fileData } = req.body as {
      filename?: string;
      fileData?: string;
    };

    if (!fileData || !filename) {
      res.status(400).json({ error: "Filename and fileData are required." });
      return;
    }

    const ext = path.extname(filename).toLowerCase();
    const isDoc = [".pdf", ".docx", ".doc"].includes(ext);
    const isImage = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"].includes(ext);

    if (!isDoc && !isImage) {
      res.status(400).json({
        error: "Unsupported file format. Allowed formats: PDF, DOCX, JPG, PNG, WEBP.",
      });
      return;
    }

    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    const base64Clean = fileData.replace(/^data:([A-Za-z-+\/]+);base64,/, "");
    const buffer = Buffer.from(base64Clean, "base64");

    // Strictly enforce 2MB limit for photos and 10MB for documents
    if (isImage && buffer.length > 2 * 1024 * 1024) {
      res.status(400).json({ error: "Photo exceeds the maximum allowed size of 2MB." });
      return;
    }

    if (isDoc && buffer.length > 10 * 1024 * 1024) {
      res.status(400).json({ error: "Document exceeds the maximum allowed size of 10MB." });
      return;
    }

    const prefix = isImage ? "photo" : "resume";
    const safeName = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const targetPath = path.join(UPLOADS_DIR, safeName);
    fs.writeFileSync(targetPath, buffer);
    const fileUrl = `/uploads/${safeName}`;

    res.json({ ok: true, fileUrl, filename: safeName });
  } catch (err) {
    console.error("File upload error:", err);
    res.status(500).json({ error: "Failed to upload file." });
  }
});

// ── Brother Portal Endpoints (requireBrother) ──────────────────────────────────

// GET /api/recruitment/brother/assigned
recruitmentRouter.get("/brother/assigned", requireBrother, async (req: AuthRequest, res: Response) => {
  const userEmail = req.user?.email || "";
  const isAdmin = Boolean(req.user?.isAdmin);
  try {
    const submissions = await getAssignedSubmissionsForBrother(userEmail, isAdmin);
    res.json({ ok: true, submissions });
  } catch (err) {
    console.error("Error fetching brother assigned applications:", err);
    res.status(500).json({ error: "Failed to fetch assigned applications." });
  }
});

// POST /api/recruitment/brother/score
recruitmentRouter.post("/brother/score", requireBrother, async (req: AuthRequest, res: Response) => {
  const raterId = req.user?.email || "";
  const raterName = req.user?.name || raterId.split("@")[0];
  const { submissionId, score, round, roundName } = req.body as {
    submissionId?: number;
    score?: number;
    round?: "application" | "round1" | "round2";
    roundName?: string;
  };
  const note = (req.body?.note ?? req.body?.notes) as string | undefined;

  if (!submissionId || score === undefined) {
    res.status(400).json({ error: "submissionId and score are required." });
    return;
  }

  try {
    let targetRound: "application" | "round1" | "round2" = "application";
    if (round && ["application", "round1", "round2"].includes(round)) {
      targetRound = round;
    } else if (roundName?.toLowerCase().includes("round 2")) {
      targetRound = "round2";
    } else if (roundName?.toLowerCase().includes("round 1")) {
      targetRound = "round1";
    } else {
      // Look up candidate's active round
      let sub: ApplicationSubmission | null = null;
      if (useDb) {
        const subRes = await pool.query("SELECT * FROM application_submissions WHERE id = $1", [Number(submissionId)]);
        sub = subRes.rows[0] ?? null;
      } else {
        const store = readLocalStore();
        sub = store.submissions.find((s) => s.id === Number(submissionId)) ?? null;
      }
      if (sub) {
        if (sub.application_status === "advanced_to_round_1" && sub.round_1_status === "advanced") {
          targetRound = "round2";
        } else if (sub.application_status === "advanced_to_round_1") {
          targetRound = "round1";
        }
      }
    }

    await upsertScore({
      round: targetRound,
      submissionId: Number(submissionId),
      raterId,
      raterName,
      score: Number(score),
      note,
    });
    res.json({ ok: true, round: targetRound });
  } catch (err: any) {
    console.error("Error rating application as brother:", err);
    res.status(400).json({ error: err.message || "Failed to record score." });
  }
});

// ── Admin Endpoints (requireAdmin) ─────────────────────────────────────────────

// GET /api/recruitment/cycles  (Admin: list cycles)
recruitmentRouter.get("/cycles", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const cycles = await getCycles();
    res.json(cycles);
  } catch (err) {
    console.error("Error fetching cycles:", err);
    res.status(500).json({ error: "Failed to fetch recruitment cycles." });
  }
});

// POST /api/recruitment/cycles  (Admin: create cycle)
recruitmentRouter.post("/cycles", requireAdmin, async (req: AuthRequest, res: Response) => {
  const { name } = req.body as { name?: string };
  if (!name || !name.trim()) {
    res.status(400).json({ error: "Cycle name is required." });
    return;
  }
  try {
    const createdBy = req.user?.email || "admin";
    const cycle = await createCycle(name, createdBy);
    res.json(cycle);
  } catch (err) {
    console.error("Error creating cycle:", err);
    res.status(500).json({ error: "Failed to create cycle." });
  }
});

// PUT /api/recruitment/cycles/:id  (Admin: update cycle)
recruitmentRouter.put("/cycles/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, status } = req.body as {
    name?: string;
    status?: "draft" | "open" | "closed" | "archived";
  };
  try {
    const updated = await updateCycle(id, { name, status });
    if (!updated) {
      res.status(404).json({ error: "Cycle not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error("Error updating cycle:", err);
    res.status(500).json({ error: "Failed to update cycle." });
  }
});

// PATCH /api/recruitment/cycles/:id  (Admin: partial update cycle)
recruitmentRouter.patch("/cycles/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, status } = req.body as {
    name?: string;
    status?: "draft" | "open" | "closed" | "archived";
  };
  try {
    const updated = await updateCycle(id, { name, status });
    if (!updated) {
      res.status(404).json({ error: "Cycle not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error("Error updating cycle:", err);
    res.status(500).json({ error: "Failed to update cycle." });
  }
});

// DELETE /api/recruitment/cycles/:id  (Admin: delete cycle with confirmation)
recruitmentRouter.delete("/cycles/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { confirmName } = req.body as { confirmName?: string };

  try {
    const cycle = await getCycleById(id);
    if (!cycle) {
      res.status(404).json({ error: "Cycle not found" });
      return;
    }

    if (!confirmName || confirmName.trim() !== cycle.name.trim()) {
      res.status(400).json({
        error: `Confirmation mismatch. You must type "${cycle.name}" exactly to delete.`,
      });
      return;
    }

    await deleteCycle(id);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting cycle:", err);
    res.status(500).json({ error: "Failed to delete cycle." });
  }
});

// GET /api/recruitment/cycles/:id/form  (Admin: get form)
recruitmentRouter.get("/cycles/:id/form", requireAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const form = await getCycleForm(id);
    res.json(form);
  } catch (err) {
    console.error("Error fetching form:", err);
    res.status(500).json({ error: "Failed to fetch form configuration." });
  }
});

// PUT /api/recruitment/cycles/:id/form  (Admin: update form)
recruitmentRouter.put("/cycles/:id/form", requireAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { questions, opens_at, closes_at, is_locked, status_messages } = req.body;
  try {
    const updated = await updateCycleForm(id, {
      questions,
      opens_at,
      closes_at,
      is_locked,
      status_messages,
    });
    res.json(updated);
  } catch (err) {
    console.error("Error updating form:", err);
    res.status(500).json({ error: "Failed to update form." });
  }
});

// POST /api/recruitment/cycles/:id/toggle-lock  (Admin: quick lock toggle)
recruitmentRouter.post("/cycles/:id/toggle-lock", requireAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const form = await getCycleForm(id);
    if (!form) {
      res.status(404).json({ error: "Form not found" });
      return;
    }
    const nextLocked = !form.is_locked;
    const updated = await updateCycleForm(id, { is_locked: nextLocked });
    res.json({ ok: true, is_locked: updated?.is_locked });
  } catch (err) {
    console.error("Error toggling lock:", err);
    res.status(500).json({ error: "Failed to toggle lock." });
  }
});

// POST /api/recruitment/submissions/:id/assign  (Admin: assign application to brother)
recruitmentRouter.post(
  "/submissions/:id/assign",
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const submissionId = Number(req.params.id);
    const { brotherEmail } = req.body as { brotherEmail?: string };
    if (!brotherEmail || !brotherEmail.includes("@")) {
      res.status(400).json({ error: "Valid brother email is required." });
      return;
    }

    try {
      const assignedBy = req.user?.email || "admin";
      await assignBrother(submissionId, brotherEmail, assignedBy);
      res.json({ ok: true });
    } catch (err) {
      console.error("Error assigning brother:", err);
      res.status(500).json({ error: "Failed to assign brother." });
    }
  },
);

// DELETE /api/recruitment/submissions/:id/assign  (Admin: remove assigned brother)
recruitmentRouter.delete(
  "/submissions/:id/assign",
  requireAdmin,
  async (req: Request, res: Response) => {
    const submissionId = Number(req.params.id);
    const { brotherEmail } = req.body as { brotherEmail?: string };
    if (!brotherEmail) {
      res.status(400).json({ error: "brotherEmail is required." });
      return;
    }

    try {
      await unassignBrother(submissionId, brotherEmail);
      res.json({ ok: true });
    } catch (err) {
      console.error("Error removing assigned brother:", err);
      res.status(500).json({ error: "Failed to unassign brother." });
    }
  },
);

// DELETE /api/recruitment/submissions/:id  (Admin: delete application submission)
recruitmentRouter.delete(
  "/submissions/:id",
  requireAdmin,
  async (req: Request, res: Response) => {
    const submissionId = Number(req.params.id);
    if (!submissionId || isNaN(submissionId)) {
      res.status(400).json({ error: "Invalid submission ID." });
      return;
    }
    try {
      const deleted = await deleteSubmission(submissionId);
      if (!deleted) {
        res.status(404).json({ error: "Application submission not found." });
        return;
      }
      res.json({ ok: true, deletedId: submissionId });
    } catch (err: any) {
      console.error("Error deleting application submission:", err);
      res.status(500).json({ error: err.message || "Failed to delete application submission." });
    }
  },
);

// POST /api/recruitment/cycles/:id/mass-assign  (Admin: mass assign groups to applicants)
recruitmentRouter.post(
  "/cycles/:id/mass-assign",
  requireAdmin,
  async (req: Request, res: Response) => {
    const cycleId = Number(req.params.id);
    if (!cycleId || isNaN(cycleId)) {
      res.status(400).json({ error: "Invalid cycle ID." });
      return;
    }
    const { groups } = req.body as { groups?: GradingGroupInput[] };
    if (!Array.isArray(groups) || groups.length === 0) {
      res.status(400).json({ error: "Groups array is required." });
      return;
    }

    try {
      const assignedBy = (req as any).user?.email || "admin";
      const result = await massAssignGroups(cycleId, groups, assignedBy);
      res.json(result);
    } catch (err: any) {
      console.error("Error executing mass assignment:", err);
      res.status(500).json({ error: err.message || "Failed to execute mass assignment." });
    }
  },
);

// GET /api/recruitment/cycles/:id/round/:round  (Admin: fetch round candidates & independent scores)
recruitmentRouter.get(
  "/cycles/:id/round/:round",
  requireAdmin,
  async (req: Request, res: Response) => {
    const cycleId = Number(req.params.id);
    const round = req.params.round as "application" | "round1" | "round2";
    if (!["application", "round1", "round2"].includes(round)) {
      res.status(400).json({ error: "Invalid round parameter." });
      return;
    }

    try {
      const data = await getRoundCandidates(cycleId, round);
      res.json(data);
    } catch (err) {
      console.error("Error fetching round data:", err);
      res.status(500).json({ error: "Failed to fetch round data." });
    }
  },
);

// POST /api/recruitment/cycles/:id/round/:round/score  (Admin: score submission)
recruitmentRouter.post(
  "/cycles/:id/round/:round/score",
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const round = req.params.round as "application" | "round1" | "round2";
    const raterId = req.user?.email || "admin@umich.edu";
    const raterName = req.user?.name || raterId.split("@")[0];

    const { submissionId, score, note } = req.body as {
      submissionId?: number;
      score?: number;
      note?: string;
    };

    if (!submissionId || score === undefined) {
      res.status(400).json({ error: "submissionId and score are required." });
      return;
    }

    try {
      await upsertScore({
        round,
        submissionId: Number(submissionId),
        raterId,
        raterName,
        score: Number(score),
        note,
      });
      res.json({ ok: true });
    } catch (err: any) {
      console.error("Error rating submission:", err);
      res.status(400).json({ error: err.message || "Failed to record score." });
    }
  },
);

// POST /api/recruitment/cycles/:id/round/:round/cutoff  (Admin: apply cutoff / bulk highlight tool)
recruitmentRouter.post(
  "/cycles/:id/round/:round/cutoff",
  requireAdmin,
  async (req: Request, res: Response) => {
    const cycleId = Number(req.params.id);
    const round = req.params.round as "application" | "round1" | "round2";
    const { decisions, highlights } = req.body as {
      decisions?: { submissionId: number; newStatus: string }[];
      highlights?: { submissionId: number; highlight: "green" | "yellow" | "red" | null }[];
    };

    const hasDecisions = Array.isArray(decisions) && decisions.length > 0;
    const hasHighlights = Array.isArray(highlights) && highlights.length > 0;

    if (!hasDecisions && !hasHighlights) {
      res.status(400).json({ error: "Either decisions or highlights array is required." });
      return;
    }

    try {
      await bulkApplyCutoff({ cycleId, round, decisions, highlights });
      res.json({
        ok: true,
        updatedDecisions: decisions?.length || 0,
        updatedHighlights: highlights?.length || 0,
      });
    } catch (err) {
      console.error("Error applying cutoff:", err);
      res.status(500).json({ error: "Failed to apply cutoff." });
    }
  },
);

// PUT /api/recruitment/submissions/:id/highlight  (Admin: set candidate highlight)
recruitmentRouter.put(
  "/submissions/:id/highlight",
  requireAdmin,
  async (req: Request, res: Response) => {
    const submissionId = Number(req.params.id);
    const { round, highlight } = req.body as {
      round: "application" | "round1" | "round2";
      highlight: "green" | "yellow" | "red" | null;
    };

    if (!round || !["application", "round1", "round2"].includes(round)) {
      res.status(400).json({ error: "Valid round parameter (application, round1, round2) is required." });
      return;
    }

    try {
      await setSingleHighlight(submissionId, round, highlight ?? null);
      res.json({ ok: true, submissionId, round, highlight: highlight ?? null });
    } catch (err) {
      console.error("Error setting candidate highlight:", err);
      res.status(500).json({ error: "Failed to set candidate highlight." });
    }
  },
);

// PUT /api/recruitment/submissions/:id/override-status  (Admin: manual override)
recruitmentRouter.put(
  "/submissions/:id/override-status",
  requireAdmin,
  async (req: Request, res: Response) => {
    const submissionId = Number(req.params.id);
    const { round, status } = req.body as {
      round?: "application" | "round1" | "round2";
      status?: string;
    };

    if (!round || !status) {
      res.status(400).json({ error: "round and status are required." });
      return;
    }

    try {
      await overrideSubmissionStatus(submissionId, round, status);
      res.json({ ok: true });
    } catch (err) {
      console.error("Error overriding submission status:", err);
      res.status(500).json({ error: "Failed to override status." });
    }
  },
);

// PUT /api/recruitment/submissions/:id/bba-status  (Admin: toggle BBA/Ross status)
recruitmentRouter.put(
  "/submissions/:id/bba-status",
  requireAdmin,
  async (req: Request, res: Response) => {
    const submissionId = Number(req.params.id);
    const { isBba } = req.body as { isBba?: boolean };

    if (typeof isBba !== "boolean") {
      res.status(400).json({ error: "isBba (boolean) is required." });
      return;
    }

    try {
      if (useDb) {
        await pool.query("UPDATE application_submissions SET is_bba = $1 WHERE id = $2", [isBba, submissionId]);
      } else {
        const store = readLocalStore();
        const sub = store.submissions.find((s) => s.id === submissionId);
        if (!sub) {
          res.status(404).json({ error: "Submission not found." });
          return;
        }
        sub.is_bba = isBba;
        writeLocalStore(store);
      }
      res.json({ ok: true, submissionId, isBba });
    } catch (err) {
      console.error("Failed to update BBA status:", err);
      res.status(500).json({ error: "Failed to update BBA status." });
    }
  },
);

// GET /api/recruitment/cycles/:id/normalization-config  (Admin: fetch cycle normalization settings)
recruitmentRouter.get(
  "/cycles/:id/normalization-config",
  requireAdmin,
  async (req: Request, res: Response) => {
    const cycleId = Number(req.params.id);
    try {
      const form = await getCycleForm(cycleId);
      const config = form?.normalization_config || DEFAULT_NORMALIZATION_CONFIG;
      res.json({ ok: true, config });
    } catch (err) {
      console.error("Error fetching normalization config:", err);
      res.status(500).json({ error: "Failed to fetch normalization config." });
    }
  },
);

// PUT /api/recruitment/cycles/:id/normalization-config  (Admin: update cycle normalization settings)
recruitmentRouter.put(
  "/cycles/:id/normalization-config",
  requireAdmin,
  async (req: Request, res: Response) => {
    const cycleId = Number(req.params.id);
    const { k, minWeight, maxWeight, targetDistribution } = req.body;

    if (typeof k !== "number" || k <= 0) {
      res.status(400).json({ error: "Prior ratings count (k) must be a positive number." });
      return;
    }
    if (
      typeof minWeight !== "number" ||
      typeof maxWeight !== "number" ||
      minWeight <= 0 ||
      maxWeight <= minWeight
    ) {
      res.status(400).json({ error: "Invalid minWeight or maxWeight boundaries." });
      return;
    }
    const validScores = ["-1", "-0.5", "0", "0.5", "1"];
    if (!targetDistribution || typeof targetDistribution !== "object") {
      res.status(400).json({ error: "targetDistribution must be an object." });
      return;
    }
    let sumDist = 0;
    for (const v of validScores) {
      const val = Number(targetDistribution[v]);
      if (isNaN(val) || val < 0) {
        res.status(400).json({ error: `Distribution for ${v} must be a non-negative number.` });
        return;
      }
      sumDist += val;
    }
    if (Math.abs(sumDist - 1.0) > 0.02) {
      res.status(400).json({
        error: `Target distribution must sum to 100% (currently ${(sumDist * 100).toFixed(1)}%).`,
      });
      return;
    }

    try {
      const updatedForm = await updateCycleForm(cycleId, {
        normalization_config: {
          k,
          minWeight,
          maxWeight,
          targetDistribution: {
            "-1": Number(targetDistribution["-1"]),
            "-0.5": Number(targetDistribution["-0.5"]),
            "0": Number(targetDistribution["0"]),
            "0.5": Number(targetDistribution["0.5"]),
            "1": Number(targetDistribution["1"]),
          },
        },
      });
      res.json({ ok: true, config: updatedForm?.normalization_config });
    } catch (err) {
      console.error("Error updating normalization config:", err);
      res.status(500).json({ error: "Failed to update normalization config." });
    }
  },
);
