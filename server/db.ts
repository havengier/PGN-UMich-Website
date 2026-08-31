import { Pool } from "pg";

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
      submitted_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log("Database migrations complete.");
}
