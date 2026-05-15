import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let db: PostgresJsDatabase<typeof schema> | undefined;

export function getDb() {
  if (db) return db;

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for GoPadi backend routes.");
  }

  const client = postgres(databaseUrl, {
    max: 10,
    prepare: false,
  });

  db = drizzle(client, { schema });
  return db;
}
