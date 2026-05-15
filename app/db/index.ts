import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as typeof globalThis & {
  gopadiDb?: PostgresJsDatabase<typeof schema>;
  gopadiSql?: postgres.Sql;
};

export function getDb() {
  if (globalForDb.gopadiDb) return globalForDb.gopadiDb;

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for GoPadi backend routes.");
  }

  const client = globalForDb.gopadiSql ?? postgres(databaseUrl, {
    idle_timeout: 20,
    max: 1,
    prepare: false,
  });

  globalForDb.gopadiSql = client;
  globalForDb.gopadiDb = drizzle(client, { schema });
  return globalForDb.gopadiDb;
}
