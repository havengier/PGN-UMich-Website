import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { applyRouter } from "./routes/apply.js";
import { runMigrations } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ?? 3000;

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", applyRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

// Serve the Vite build; fall through to index.html for SPA routing
const distPath = path.resolve(__dirname, "../dist");
app.use(express.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

async function main() {
  await runMigrations();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
