import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { err, ok, type Result } from "neverthrow";
import { getConfig } from "../config.ts";
import {
  createDatabaseConnectionError,
  createDatabaseError,
  type DatabaseError,
} from "../errors.ts";
import { join } from "path";
import * as schema from "./schema.ts";

let drizzleDb: ReturnType<typeof drizzle> | null = null;
let initialized: Promise<Result<void, DatabaseError>> | null = null;

export async function runMigrations(drizzleDb: ReturnType<typeof drizzle>) {
  try {
    await migrate(drizzleDb, {
      migrationsFolder: join(import.meta.dirname, "..", "..", "migrations"),
    });

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
  if (drizzleDb) {
    return ok(drizzleDb);
  }

  try {
    const { dbUri, dbAuthToken } = getConfig();

    const newDb = createClient({ url: dbUri, authToken: dbAuthToken });
    drizzleDb = drizzle(newDb, { schema });

    if (!initialized) {
      console.log("Running migrations");
      initialized = runMigrations(drizzleDb);
    }
    const result = await initialized;
    if (result.isErr()) {
      return err(result.error);
    }

    return ok(drizzleDb);
  } catch (error) {
    return err(
      createDatabaseConnectionError(
        "Failed to initialize database connection",
        error,
      ),
    );
  }
}
