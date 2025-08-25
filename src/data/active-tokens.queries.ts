import { eq } from "drizzle-orm";
import { err, ok } from "neverthrow";
import { createDatabaseError, createDuplicateTokenError } from "../errors.ts";
import { getDb } from "./database.ts";
import { activeTokens, type NewActiveToken } from "./schema.ts";

export async function insertActiveToken({ jti, name }: NewActiveToken) {
  const dbResult = await getDb();
  if (dbResult.isErr()) {
    return err(dbResult.error);
  }
  const db = dbResult.value;

  try {
    await db.insert(activeTokens).values({ jti, name });
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
  const db = dbResult.value;

  try {
    const result = await db
      .select()
      .from(activeTokens)
      .where(eq(activeTokens.jti, jti))
      .limit(1);

    return ok(result.length > 0);
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
    await db.delete(activeTokens).where(eq(activeTokens.jti, jti));
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
