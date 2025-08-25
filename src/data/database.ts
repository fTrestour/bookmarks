import { type Client, createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { err, ok } from "neverthrow";
import { resolve } from "path";
import { getConfig } from "../config.ts";
import {
  createDatabaseConnectionError,
  createDatabaseError,
} from "../errors.ts";
import * as schema from "../schema.ts";

let db: LibSQLDatabase<typeof schema> | null = null;
let client: Client | null = null;

async function runMigrations(client: Client) {
  try {
    const migrationsFolder = resolve("./migrations");
    console.log("Migrations folder:", migrationsFolder);

    const drizzleDb = drizzle(client, { schema });
    await migrate(drizzleDb, { migrationsFolder });
    return ok();
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
  if (db && client) {
    return ok(db);
  }

  try {
    const { dbUri, dbAuthToken } = getConfig();

    const newClient = createClient({ url: dbUri, authToken: dbAuthToken });

    console.log("Running migrations...");
    const migrationsResult = await runMigrations(newClient);
    if (migrationsResult.isErr()) {
      return err(migrationsResult.error);
    }

    client = newClient;
    db = drizzle(newClient, { schema });

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
