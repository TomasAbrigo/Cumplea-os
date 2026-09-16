import "server-only";
import postgres from "postgres";

declare global {
  var __sql: ReturnType<typeof postgres> | undefined;
}

function createSql() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("Missing POSTGRES_URL env var");
  }
  return postgres(connectionString, { ssl: "require", max: 5 });
}

// Reutilizamos la conexión entre invocaciones en dev (hot reload) y producción.
export const sql = globalThis.__sql ?? createSql();
if (process.env.NODE_ENV !== "production") {
  globalThis.__sql = sql;
}
