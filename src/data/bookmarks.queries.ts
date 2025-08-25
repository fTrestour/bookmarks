import { type InValue, type ResultSet } from "@libsql/client";
import { err, ok } from "neverthrow";
import { createDatabaseError } from "../errors.ts";
import type { BookmarkWithContent } from "../types.ts";
import { bookmarksSchema } from "../types.ts";
import { getDb } from "./database.ts";

export async function insertBookmarks(bookmarks: BookmarkWithContent[]) {
  const dbResult = await getDb();
  if (dbResult.isErr()) {
    return err(dbResult.error);
  }
  const db = dbResult.value;

  try {
    await db.batch(
      bookmarks.map((bookmark) => {
        const now = Math.floor(Date.now() / 1000);
        const hasContent = bookmark.content && bookmark.embedding;

        return {
          sql: `INSERT INTO bookmarks (id, url, title, content, embedding, status, created_at, processed_at) VALUES (?, ?, ?, ?, ${hasContent ? "vector32(?)" : "?"}, ?, ?, ?)`,
          args: [
            bookmark.id,
            bookmark.url,
            bookmark.title ?? null,
            bookmark.content ?? null,
            hasContent ? JSON.stringify(bookmark.embedding) : null,
            bookmark.status ?? (hasContent ? "completed" : "pending"),
            now,
            hasContent ? now : null,
          ],
        };
      }),
      "write",
    );

    return ok(undefined);
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
  limit?: number,
) {
  const dbResult = await getDb();
  if (dbResult.isErr()) {
    return err(dbResult.error);
  }
  const db = dbResult.value;

  try {
    let sql = "SELECT * FROM bookmarks WHERE status = 'completed'";
    let args: InValue[] = [];
    if (searchEmbedding) {
      sql =
        "SELECT id, url, title, content, embedding FROM bookmarks WHERE status = 'completed' AND embedding IS NOT NULL ORDER BY vector_distance_cos(embedding, vector32(?)) ASC";
      args = [JSON.stringify(searchEmbedding)];
    }

    if (limit) {
      sql += " LIMIT ?";
      args.push(limit);
    }

    const result = await db.execute({ sql, args });
    const bookmarks = bookmarksSchema.parse(toObject(result));
    return ok(bookmarks);
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
    const result = await db.execute("SELECT * FROM bookmarks WHERE id = ?", [
      id,
    ]);

    if (result.rows.length === 0) {
      return err(createDatabaseError(`Bookmark with ID ${id} not found`, null));
    }

    const row = result.rows[0];
    return ok({
      id: row[0] as string,
      url: row[1] as string,
      title: row[2] as string,
      content: row[3] as string,
    });
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
    await db.execute(
      "UPDATE bookmarks SET content = ?, title = ?, embedding = vector32(?) WHERE id = ?",
      [content, title, JSON.stringify(embedding), id],
    );
    return ok(undefined);
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
    const result = await db.execute(
      "SELECT * FROM bookmarks WHERE status IN ('pending', 'processing')",
    );

    return ok(
      result.rows.map((row) => ({
        id: row[0] as string,
        url: row[1] as string,
        title: row[2] as string | null,
        content: row[3] as string | null,
        status: row[5] as string,
        createdAt: new Date((row[6] as number) * 1000),
        processedAt: row[7] ? new Date((row[7] as number) * 1000) : null,
        errorMessage: row[8] as string | null,
      })),
    );
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
  const db = dbResult.value;

  try {
    const now = Math.floor(Date.now() / 1000);

    if (status === "completed") {
      await db.execute(
        "UPDATE bookmarks SET status = ?, processed_at = ?, error_message = NULL WHERE id = ?",
        [status, now, id],
      );
    } else {
      await db.execute(
        "UPDATE bookmarks SET status = ?, error_message = ? WHERE id = ?",
        [status, errorMessage ?? null, id],
      );
    }

    return ok(undefined);
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

function toObject({ columns, rows }: ResultSet) {
  return rows.map((row) =>
    columns.reduce((acc, column, index) => {
      const value = row[index];
      // Handle ArrayBuffer type - convert to array
      if (value instanceof ArrayBuffer) {
        const float32Array = new Float32Array(value);
        return {
          ...acc,
          [column]: Array.from(float32Array).map(
            (num) => Math.round(num * 1000000) / 1000000,
          ),
        };
      }
      return { ...acc, [column]: value };
    }, {}),
  );
}
