import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { err, ok, type Result } from "neverthrow";
import { getConfig } from "../config.ts";
import type { DatabaseConnectionError } from "../errors.ts";
import {
  createDatabaseConnectionError,
  createDatabaseError,
} from "../errors.ts";
import { join } from "path";
import * as schema from "./schema.ts";

let drizzleDb: ReturnType<typeof drizzle> | null = null;
let initialized: Promise<Result<void, DatabaseConnectionError>> | null = null;

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
  initialized ??= (async (): Promise<Result<void, DatabaseConnectionError>> => {
    try {
      const { dbUri, dbAuthToken } = getConfig();
      const client = createClient({ url: dbUri, authToken: dbAuthToken });
      const newDrizzle = drizzle(client, { schema });

      const migrationResult = await runMigrations(newDrizzle);
      if (migrationResult.isErr()) {
        return err(
          createDatabaseConnectionError(
            migrationResult.error.message,
            migrationResult.error.cause,
          ),
        );
      }

      drizzleDb = newDrizzle;
      return ok(undefined);
    } catch (error) {
      return err(
        createDatabaseConnectionError(
          "Failed to initialize database connection",
          error,
        ),
      );
    }
  })();

  const initResult = await initialized;
  if (initResult.isErr()) {
    return err(initResult.error);
  }

  if (!drizzleDb) {
    return err(
      createDatabaseError("Database not initialized properly after migrations"),
    );
  }

  return ok(drizzleDb);
}
