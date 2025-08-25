import { eq, sql } from "drizzle-orm";
import { err, ok } from "neverthrow";
import { getDb } from "./database.ts";
import { createDatabaseError, createDuplicateTokenError } from "../errors.ts";
import type { ActiveToken } from "../types.ts";
import * as schema from "../schema.ts";

export async function insertActiveToken({ jti, name }: ActiveToken) {
  const dbResult = await getDb();
  if (dbResult.isErr()) {
    return err(dbResult.error);
  }
  const database = dbResult.value;

  try {
    await database.insert(schema.activeTokens).values({
      jti,
      name,
    });

    return ok();
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
  const database = dbResult.value;

  try {
    const result = await database
      .select({ count: sql<number>`count(*)` })
      .from(schema.activeTokens)
      .where(eq(schema.activeTokens.jti, jti));
    return ok(result[0]?.count > 0);
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
  const database = dbResult.value;

  try {
    await database
      .delete(schema.activeTokens)
      .where(eq(schema.activeTokens.jti, jti));
    return ok();
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
