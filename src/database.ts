import {
  type Client,
  createClient,
  type InValue,
  type ResultSet,
} from "@libsql/client";
import { err, ok } from "neverthrow";
import { getConfig } from "./config.ts";
import {
  createDatabaseConnectionError,
  createDatabaseError,
  createDuplicateTokenError,
} from "./errors.ts";
import type { ActiveToken, BookmarkWithContent } from "./types.ts";
import { bookmarksSchema } from "./types.ts";

let db: Client | null = null;
export async function getDb() {
  if (db) {
    return ok(db);
  }

  try {
    const { dbUri, dbAuthToken } = getConfig();

    const newDb = createClient({ url: dbUri, authToken: dbAuthToken });
    await newDb.execute(
      "CREATE TABLE IF NOT EXISTS bookmarks (id TEXT PRIMARY KEY NOT NULL, url TEXT UNIQUE NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, embedding F32_BLOB(1536) NOT NULL)",
    );
    await newDb.execute(
      "CREATE TABLE IF NOT EXISTS active_tokens (jti TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL)",
    );

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

export async function insertBookmarks(bookmarks: BookmarkWithContent[]) {
  const dbResult = await getDb();
  if (dbResult.isErr()) {
    return err(dbResult.error);
  }

  try {
    const db = dbResult.value;

    await db.batch(
      bookmarks.map((bookmark) => ({
        sql: `INSERT INTO bookmarks (id, url, title, content, embedding) VALUES (?, ?, ?, ?, vector32(?))`,
        args: [
          bookmark.id,
          bookmark.url,
          bookmark.title,
          bookmark.content,
          JSON.stringify(bookmark.embedding),
        ],
      })),
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

    let sql = "SELECT * FROM bookmarks";
    let args: InValue[] = [];
    if (searchEmbedding) {
      sql =
        "SELECT id, url, title, content, embedding FROM bookmarks ORDER BY vector_distance_cos(embedding, vector32(?)) ASC";
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
