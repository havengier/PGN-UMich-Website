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
      id         SERIAL PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name  VARCHAR(100) NOT NULL,
      role       VARCHAR(200),
      major      VARCHAR(100),
      minor      VARCHAR(100),
      photo_url  TEXT,
      hue        TEXT         DEFAULT 'from-amber-900 via-amber-800 to-stone-700',
      categories TEXT[]       DEFAULT '{}',
      sort_order INT          DEFAULT 0,
      created_at TIMESTAMPTZ  DEFAULT NOW()
    )
  `);
  console.log("Database migrations complete.");
}
