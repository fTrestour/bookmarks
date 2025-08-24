import {
  type Client,
  createClient,
  type InValue,
  type ResultSet,
} from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { err, ok } from "neverthrow";
import { getConfig } from "./config.ts";
import {
  createDatabaseConnectionError,
  createDatabaseError,
  createDuplicateTokenError,
} from "./errors.ts";
import type { ActiveToken } from "./types.ts";
import { bookmarksSchema, type BookmarkInsert } from "./types.ts";
import * as schema from "./schema.ts";

let db: Client | null = null;

export async function runMigrations(client: Client) {
  try {
    // Resolve relative to this file to avoid CWD issues
    const urlModule = await import("node:url");
    const pathModule = await import("node:path");
    const migrationsFolder = pathModule.resolve(
      pathModule.dirname(urlModule.fileURLToPath(import.meta.url)),
      "../migrations",
    );

    const drizzleDb = drizzle(client, { schema });
    await migrate(drizzleDb, { migrationsFolder });
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

export async function insertBookmarks(
  bookmarks: (
    | BookmarkInsert
    | {
        id: string;
        url: string;
        title: string;
        content: string;
        embedding: number[];
        status?: string;
        createdAt?: Date;
        processedAt?: Date;
        errorMessage?: string;
      }
  )[],
) {
  const dbResult = await getDb();
  if (dbResult.isErr()) {
    return err(dbResult.error);
  }

  try {
    const db = dbResult.value;

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

export async function insertActiveToken({ jti, name }: ActiveToken) {
  const dbResult = await getDb();
  if (dbResult.isErr()) {
    return err(dbResult.error);
  }

  try {
    const db = dbResult.value;
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

  try {
    const db = dbResult.value;
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

  try {
    const db = dbResult.value;
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

export async function getAllBookmarks(
  searchEmbedding: number[] | null,
  limit?: number,
) {
  const dbResult = await getDb();
  if (dbResult.isErr()) {
    return err(dbResult.error);
  }

  try {
    const db = dbResult.value;

    let sql =
      "SELECT id, url, title, content, embedding, status FROM bookmarks";
    let args: InValue[] = [];

    if (searchEmbedding) {
      // For search, only return completed bookmarks with embeddings
      sql =
        "SELECT id, url, title, content, embedding, status FROM bookmarks WHERE status = 'completed' AND embedding IS NOT NULL ORDER BY vector_distance_cos(embedding, vector32(?)) ASC";
      args = [JSON.stringify(searchEmbedding)];
    } else {
      // For regular listing, show completed bookmarks (ones with title/content)
      sql +=
        " WHERE status = 'completed' OR (title IS NOT NULL AND content IS NOT NULL)";
    }

    if (limit) {
      sql += " LIMIT ?";
      args.push(limit);
    }

    const result = await db.execute({ sql, args });

    // Transform results to match expected schema, handling null titles
    const processedResults = toObject(result).map(
      (row: Record<string, unknown>) => ({
        ...row,
        title: (row.title as string | null) ?? "Untitled",
      }),
    );

    const bookmarks = bookmarksSchema.parse(processedResults);
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

  try {
    const db = dbResult.value;
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

  try {
    const db = dbResult.value;
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

// New functions for async processing
export async function getPendingBookmarks() {
  const dbResult = await getDb();
  if (dbResult.isErr()) {
    return err(dbResult.error);
  }

  try {
    const db = dbResult.value;
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

  try {
    const db = dbResult.value;
    const now = Math.floor(Date.now() / 1000);

    if (status === "completed" || status === "failed") {
      await db.execute(
        "UPDATE bookmarks SET status = ?, processed_at = ?, error_message = ? WHERE id = ?",
        [
          status,
          now,
          status === "completed" ? null : (errorMessage ?? null),
          id,
        ],
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
