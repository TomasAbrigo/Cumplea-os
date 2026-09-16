import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import postgres from "postgres";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "..", ".env.local") });

const connectionString = process.env.POSTGRES_URL_NON_POOLING;
if (!connectionString) {
  console.error("Missing POSTGRES_URL_NON_POOLING in .env.local");
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: "require" });
const schema = readFileSync(path.join(__dirname, "..", "supabase", "schema.sql"), "utf8");

try {
  await sql.unsafe(schema);
  console.log("Schema applied successfully.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await sql.end();
}
