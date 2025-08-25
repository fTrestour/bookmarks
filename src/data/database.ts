import { type Client, createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { err, ok } from "neverthrow";
import { getConfig } from "../config.ts";
import {
  createDatabaseConnectionError,
  createDatabaseError,
} from "../errors.ts";

let db: Client | null = null;

export async function runMigrations(client: Client) {
  try {
    const drizzleDb = drizzle(client);
    await migrate(drizzleDb, { migrationsFolder: "./migrations" });
    return ok(undefined);
  } catch (error) {
    return err(
      createDatabaseError(
        `Failed to run migrations: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        error,
      ),
    );
  }
}

export async function getDb() {
  if (db) {
    return ok(db);
  }

  try {
    const { dbUri, dbAuthToken } = getConfig();

    const newDb = createClient({ url: dbUri, authToken: dbAuthToken });

    // Run migrations
    const migrationsResult = await runMigrations(newDb);
    if (migrationsResult.isErr()) {
      // Fallback to legacy table creation if migrations fail
      await newDb.execute(
        "CREATE TABLE IF NOT EXISTS bookmarks (id TEXT PRIMARY KEY NOT NULL, url TEXT UNIQUE NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, embedding F32_BLOB(1536) NOT NULL)",
      );
      await newDb.execute(
        "CREATE TABLE IF NOT EXISTS active_tokens (jti TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL)",
      );
    }

    db = newDb;

    return ok(db);
  } catch (error) {
    return err(
      createDatabaseConnectionError(
        "Failed to initialize database connection",
        error,
      ),
    );
  }
}
