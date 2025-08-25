import { eq, and, inArray, sql } from "drizzle-orm";
import { err, ok } from "neverthrow";
import { getDb } from "./database.ts";
import { createDatabaseError } from "../errors.ts";
import * as schema from "../schema.ts";
import type { NewBookmark } from "../schema.ts";

export async function insertBookmark(bookmark: NewBookmark) {
  const dbResult = await getDb();
  if (dbResult.isErr()) {
    return err(dbResult.error);
  }
  const database = dbResult.value;

  try {
    await database.insert(schema.bookmarks).values(bookmark);

    return ok();
  } catch (error) {
    return err(
      createDatabaseError(
        `Failed to insert bookmarks: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        error,
      ),
    );
  }
}

export async function getAllCompletedBookmarks(
  searchEmbedding: number[] | null,
  limit?: number,
) {
  const dbResult = await getDb();
  if (dbResult.isErr()) {
    return err(dbResult.error);
  }

  try {
    const database = dbResult.value;

    const baseSelect = database
      .select({
        id: schema.bookmarks.id,
        url: schema.bookmarks.url,
        title: schema.bookmarks.title,
      })
      .from(schema.bookmarks);

    if (searchEmbedding) {
      const queryWithSearch = baseSelect
        .where(
          and(
            eq(schema.bookmarks.status, "completed"),
            sql`embedding IS NOT NULL`,
          ),
        )
        .orderBy(
          sql`vector_distance_cos(embedding, vector32(${JSON.stringify(searchEmbedding)})) ASC`,
        );

      const bookmarks = limit
        ? await queryWithSearch.limit(limit)
        : await queryWithSearch;

      return ok(bookmarks);
    } else {
      const queryWithoutSearch = baseSelect.where(
        eq(schema.bookmarks.status, "completed"),
      );

      const bookmarks = limit
        ? await queryWithoutSearch.limit(limit)
        : await queryWithoutSearch;

      return ok(bookmarks);
    }
  } catch (error) {
    return err(
      createDatabaseError(
        `Failed to retrieve bookmarks: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        error,
      ),
    );
  }
}

export async function getBookmarkById(id: string) {
  const dbResult = await getDb();
  if (dbResult.isErr()) {
    return err(dbResult.error);
  }
  const database = dbResult.value;

  try {
    const result = await database
      .select()
      .from(schema.bookmarks)
      .where(eq(schema.bookmarks.id, id))
      .limit(1);

    if (result.length === 0) {
      return err(createDatabaseError(`Bookmark with ID ${id} not found`, null));
    }

    return ok(result[0]);
  } catch (error) {
    return err(
      createDatabaseError(
        `Failed to retrieve bookmark: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        error,
      ),
    );
  }
}

export async function updateBookmark(
  id: string,
  content: string,
  title: string,
  embedding: number[],
) {
  const dbResult = await getDb();
  if (dbResult.isErr()) {
    return err(dbResult.error);
  }

  try {
    const database = dbResult.value;
    const embeddingBuffer = Buffer.from(new Float32Array(embedding).buffer);
    await database
      .update(schema.bookmarks)
      .set({
        content,
        title,
        embedding: embeddingBuffer,
      })
      .where(eq(schema.bookmarks.id, id));
    return ok();
  } catch (error) {
    return err(
      createDatabaseError(
        `Failed to update bookmark embedding: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        error,
      ),
    );
  }
}

export async function getPendingBookmarks() {
  const dbResult = await getDb();
  if (dbResult.isErr()) {
    return err(dbResult.error);
  }
  const database = dbResult.value;

  try {
    const result = await database
      .select()
      .from(schema.bookmarks)
      .where(inArray(schema.bookmarks.status, ["pending", "processing"]));

    return ok(result);
  } catch (error) {
    return err(
      createDatabaseError(
        `Failed to retrieve pending bookmarks: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        error,
      ),
    );
  }
}

export async function updateBookmarkStatus(
  id: string,
  status: string,
  errorMessage?: string,
) {
  const dbResult = await getDb();
  if (dbResult.isErr()) {
    return err(dbResult.error);
  }
  const database = dbResult.value;

  try {
    const now = new Date();

    if (status === "completed" || status === "failed") {
      await database
        .update(schema.bookmarks)
        .set({
          status,
          processedAt: now,
          errorMessage: status === "completed" ? null : (errorMessage ?? null),
        })
        .where(eq(schema.bookmarks.id, id));
    } else {
      await database
        .update(schema.bookmarks)
        .set({
          status,
          errorMessage: errorMessage ?? null,
        })
        .where(eq(schema.bookmarks.id, id));
    }

    return ok();
  } catch (error) {
    return err(
      createDatabaseError(
        `Failed to update bookmark status: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        error,
      ),
    );
  }
}
