import {
  type Client,
  createClient,
  type InValue,
  type ResultSet,
} from "@libsql/client";
import { getConfig } from "./config.ts";
import type { Bookmark, BookmarkWithContent, ActiveToken } from "./types.ts";
import { bookmarksSchema } from "./types.ts";

let db: Client | null = null;
async function getDb() {
  if (db) {
    return db;
  }

  const { dbUri, dbAuthToken } = getConfig();

  const newDb = createClient({ url: dbUri, authToken: dbAuthToken });
  await newDb.execute(
    "CREATE TABLE IF NOT EXISTS bookmarks (id TEXT PRIMARY KEY NOT NULL, url TEXT UNIQUE NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, embedding F32_BLOB(1536) NOT NULL)",
  );
  await newDb.execute(
    "CREATE TABLE IF NOT EXISTS active_tokens (jti TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL)",
  );

  db = newDb;

  return db;
}

export async function insertBookmarks(
  bookmarks: BookmarkWithContent[],
): Promise<void> {
  try {
    const db = await getDb();

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
  } catch (error) {
    throw new Error(
      `Failed to insert bookmarks: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

export async function insertActiveToken({ jti, name }: ActiveToken) {
  try {
    const db = await getDb();
    await db.execute("INSERT INTO active_tokens (jti, name) VALUES (?, ?)", [
      jti,
      name,
    ]);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      throw new Error(`Token with JTI '${jti}' already exists`);
    }

    throw new Error(
      `Failed to insert active token: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

export async function isActiveToken(jti: string): Promise<boolean> {
  const db = await getDb();
  const res = await db.execute("SELECT 1 FROM active_tokens WHERE jti = ?", [
    jti,
  ]);
  return res.rows.length > 0;
}

export async function deleteActiveToken(jti: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM active_tokens WHERE jti = ?", [jti]);
}

export async function getAllBookmarks(
  searchEmbedding: number[] | null,
): Promise<Bookmark[]> {
  const db = await getDb();

  let sql = "SELECT * FROM bookmarks";
  let args: InValue[] = [];
  if (searchEmbedding) {
    sql =
      "SELECT id, url, title, content, embedding FROM bookmarks ORDER BY vector_distance_cos(embedding, vector32(?)) ASC";
    args = [JSON.stringify(searchEmbedding)];
  }

  const result = await db.execute({ sql, args });
  return bookmarksSchema.parse(toObject(result));
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
