import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL is not set. Database features will be unavailable.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export async function runMigrations() {
  if (!process.env.DATABASE_URL) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id          SERIAL PRIMARY KEY,
      first_name  VARCHAR(100) NOT NULL,
      last_name   VARCHAR(100) NOT NULL,
      email       VARCHAR(255) NOT NULL,
      phone       VARCHAR(20),
      year        VARCHAR(50)  NOT NULL,
      major       VARCHAR(100) NOT NULL,
      minor       VARCHAR(100),
      gpa         VARCHAR(10),
      why_pgn     TEXT         NOT NULL,
      strengths   TEXT         NOT NULL,
      involvement TEXT,
      questions   TEXT,
      extra_answers JSONB DEFAULT '{}',
      submitted_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`
    ALTER TABLE applications
      ADD COLUMN IF NOT EXISTS extra_answers JSONB DEFAULT '{}'
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_content (
      key        VARCHAR(255) PRIMARY KEY,
      value      TEXT         NOT NULL,
      updated_at TIMESTAMPTZ  DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS members (
      id           SERIAL PRIMARY KEY,
      name         VARCHAR(200),
      first_name   VARCHAR(100),
      last_name    VARCHAR(100),
      role         VARCHAR(200),
      major        VARCHAR(100),
      minor        VARCHAR(100),
      pledge_class VARCHAR(100),
      linkedin_url TEXT,
      photo_url    TEXT,
      hue          TEXT         DEFAULT 'from-amber-900 via-amber-800 to-stone-700',
      categories   TEXT[]       DEFAULT '{}',
      sort_order   INT          DEFAULT 0,
      created_at   TIMESTAMPTZ  DEFAULT NOW()
    )
  `);
  await pool.query(`
    ALTER TABLE members
      ADD COLUMN IF NOT EXISTS name VARCHAR(200),
      ADD COLUMN IF NOT EXISTS pledge_class VARCHAR(100),
      ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
      ALTER COLUMN first_name DROP NOT NULL,
      ALTER COLUMN last_name DROP NOT NULL
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS recruitment_cycles (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(200) NOT NULL,
      status      VARCHAR(50)  NOT NULL DEFAULT 'draft',
      created_at  TIMESTAMPTZ  DEFAULT NOW(),
      created_by  VARCHAR(255)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS recruitment_cycle_forms (
      id              SERIAL PRIMARY KEY,
      cycle_id        INT NOT NULL REFERENCES recruitment_cycles(id) ON DELETE CASCADE UNIQUE,
      questions       JSONB NOT NULL DEFAULT '[]',
      opens_at        TIMESTAMPTZ,
      closes_at       TIMESTAMPTZ,
      is_locked       BOOLEAN NOT NULL DEFAULT false,
      status_messages JSONB DEFAULT '{}',
      updated_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS application_submissions (
      id                  SERIAL PRIMARY KEY,
      cycle_id            INT NOT NULL REFERENCES recruitment_cycles(id) ON DELETE CASCADE,
      applicant_user_id   VARCHAR(255) NOT NULL,
      applicant_email     VARCHAR(255) NOT NULL,
      applicant_name      VARCHAR(255),
      answers             JSONB NOT NULL DEFAULT '{}',
      application_status  VARCHAR(50) NOT NULL DEFAULT 'pending_review',
      round_1_status      VARCHAR(50) NOT NULL DEFAULT 'pending',
      round_2_status      VARCHAR(50) NOT NULL DEFAULT 'pending',
      app_override        BOOLEAN NOT NULL DEFAULT false,
      r1_override         BOOLEAN NOT NULL DEFAULT false,
      r2_override         BOOLEAN NOT NULL DEFAULT false,
      submitted_at        TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_cycle_applicant UNIQUE (cycle_id, applicant_user_id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS application_scores (
      id            SERIAL PRIMARY KEY,
      submission_id INT NOT NULL REFERENCES application_submissions(id) ON DELETE CASCADE,
      rater_id      VARCHAR(255) NOT NULL,
      rater_name    VARCHAR(255) NOT NULL,
      score         NUMERIC(3, 1) NOT NULL,
      note          TEXT,
      rated_at      TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_app_score_submission_rater UNIQUE (submission_id, rater_id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS round_evaluations (
      id            SERIAL PRIMARY KEY,
      submission_id INT NOT NULL REFERENCES application_submissions(id) ON DELETE CASCADE,
      round         INT NOT NULL CHECK (round IN (1, 2)),
      rater_id      VARCHAR(255) NOT NULL,
      rater_name    VARCHAR(255) NOT NULL,
      score         NUMERIC(3, 1) NOT NULL,
      note          TEXT,
      rated_at      TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_round_eval_sub_round_rater UNIQUE (submission_id, round, rater_id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS application_assignments (
      id            SERIAL PRIMARY KEY,
      submission_id INT NOT NULL REFERENCES application_submissions(id) ON DELETE CASCADE,
      brother_email VARCHAR(255) NOT NULL,
      assigned_by   VARCHAR(255),
      assigned_at   TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_app_brother_assign UNIQUE (submission_id, brother_email)
    )
  `);
  console.log("Database migrations complete.");
}
