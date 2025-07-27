import { getConfig } from "./config.ts";
import type { BookmarkWithContent, Bookmark } from "./types.ts";
import { bookmarksSchema } from "./types.ts";
import {
  type Client,
  createClient,
  type ResultSet,
  type InValue,
} from "@libsql/client";

let db: Client | null = null;
async function getDb() {
  if (db) {
    return db;
  }

  const { dbUri } = getConfig();

  const newDb = createClient({ url: dbUri });
  await newDb.execute(
    "CREATE TABLE IF NOT EXISTS bookmarks (id TEXT PRIMARY KEY, url TEXT UNIQUE, title TEXT, author TEXT, content TEXT, embedding F32_BLOB(1536))",
  );

  db = newDb;

  return db;
}

export async function insertBookmarks(
  bookmarks: BookmarkWithContent[],
): Promise<void> {
  const db = await getDb();

  await db.batch(
    bookmarks.map((bookmark) => ({
      sql: `INSERT INTO bookmarks (id, url, title, author, content, embedding) VALUES (?, ?, ?, ?, ?, vector32(?))`,
      args: [
        bookmark.id,
        bookmark.url,
        bookmark.title,
        bookmark.author,
        bookmark.content,
        JSON.stringify(bookmark.embedding),
      ],
    })),
    "write",
  );
}

export async function getAllBookmarks(
  searchEmbedding?: number[],
): Promise<Bookmark[]> {
  const db = await getDb();

  let sql = "SELECT * FROM bookmarks";
  let args: InValue[] = [];
  if (searchEmbedding) {
    sql =
      "SELECT id, url, title, author, content, embedding FROM bookmarks ORDER BY vector_distance_cos(embedding, vector32(?)) ASC";
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
