import { eq, and, isNotNull, sql } from "drizzle-orm";
import { err, ok } from "neverthrow";
import { createDatabaseError } from "../errors.ts";
import { getDb } from "./database.ts";
import { bookmarks, type NewBookmark } from "./schema.ts";

export async function insertBookmarks(bookmarksToInsert: NewBookmark[]) {
  const dbResult = await getDb();
  if (dbResult.isErr()) {
    return err(dbResult.error);
  }
  const db = dbResult.value;

  try {
    await db.insert(bookmarks).values(bookmarksToInsert);
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

export async function getAllBookmarks(
  searchEmbedding: number[] | null,
  limitCount?: number,
) {
  const dbResult = await getDb();
  if (dbResult.isErr()) {
    return err(dbResult.error);
  }
  const db = dbResult.value;

  // TODO: Make that DRYer
  try {
    if (searchEmbedding) {
      if (limitCount) {
        const result = await db
          .select({
            id: bookmarks.id,
            url: bookmarks.url,
            title: bookmarks.title,
            content: bookmarks.content,
          })
          .from(bookmarks)
          .where(isNotNull(bookmarks.embedding))
          .orderBy(
            sql`vector_distance_cos(${bookmarks.embedding}, vector32(${JSON.stringify(searchEmbedding)}))`,
          )
          .limit(limitCount);
        return ok(result);
      } else {
        const result = await db
          .select({
            id: bookmarks.id,
            url: bookmarks.url,
            title: bookmarks.title,
            content: bookmarks.content,
          })
          .from(bookmarks)
          .where(isNotNull(bookmarks.embedding))
          .orderBy(
            sql`vector_distance_cos(${bookmarks.embedding}, vector32(${JSON.stringify(searchEmbedding)}))`,
          );
        return ok(result);
      }
    } else {
      if (limitCount) {
        const result = await db.select().from(bookmarks).limit(limitCount);
        return ok(result);
      } else {
        const result = await db.select().from(bookmarks);
        return ok(result);
      }
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
  const db = dbResult.value;

  try {
    const result = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.id, id))
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
  const db = dbResult.value;

  try {
    await db
      .update(bookmarks)
      .set({ content, title, embedding })
      .where(eq(bookmarks.id, id));
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
  const db = dbResult.value;

  try {
    const result = await db
      .select()
      .from(bookmarks)
      .where(and(isNotNull(bookmarks.content), isNotNull(bookmarks.embedding)));

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
