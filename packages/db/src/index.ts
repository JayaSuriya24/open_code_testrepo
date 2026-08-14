import { sql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.ts";

export * from "./schema.ts";

export type Db = PostgresJsDatabase<typeof schema>;

export function createDb(url: string): Db {
  const client = postgres(url, { max: 5 });
  return drizzle(client, { schema });
}

export async function pingDb(db: Db): Promise<boolean> {
  try {
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}
