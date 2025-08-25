import { err, ok } from "neverthrow";
import { createDatabaseError, createDuplicateTokenError } from "../errors.ts";
import type { ActiveToken } from "../types.ts";
import { getDb } from "./database.ts";

export async function insertActiveToken({ jti, name }: ActiveToken) {
  const dbResult = await getDb();
  if (dbResult.isErr()) {
    return err(dbResult.error);
  }
  const db = dbResult.value;

  try {
    await db.execute("INSERT INTO active_tokens (jti, name) VALUES (?, ?)", [
      jti,
      name,
    ]);
    return ok(undefined);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      return err(createDuplicateTokenError(jti));
    }

    return err(
      createDatabaseError(
        `Failed to insert active token: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        error,
      ),
    );
  }
}

export async function isActiveToken(jti: string) {
  const dbResult = await getDb();
  if (dbResult.isErr()) {
    return err(dbResult.error);
  }
  const db = dbResult.value;

  try {
    const res = await db.execute("SELECT 1 FROM active_tokens WHERE jti = ?", [
      jti,
    ]);
    return ok(res.rows.length > 0);
  } catch (error) {
    return err(
      createDatabaseError(
        `Failed to check active token: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        error,
      ),
    );
  }
}

export async function deleteActiveToken(jti: string) {
  const dbResult = await getDb();
  if (dbResult.isErr()) {
    return err(dbResult.error);
  }
  const db = dbResult.value;

  try {
    await db.execute("DELETE FROM active_tokens WHERE jti = ?", [jti]);
    return ok(undefined);
  } catch (error) {
    return err(
      createDatabaseError(
        `Failed to delete active token: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        error,
      ),
    );
  }
}
