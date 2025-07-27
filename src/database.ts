import { getConfig } from "./config.ts";
import { bookmarksSchema, parse, type Bookmark } from "./types.ts";
import { type Client, createClient, type ResultSet } from "@libsql/client";

let db: Client | null = null;
async function getDb() {
  if (db) {
    return db;
  }

  const { dbUri } = getConfig();

  const newDb = createClient({ url: dbUri });
  await newDb.execute(
    "CREATE TABLE IF NOT EXISTS bookmarks (id TEXT PRIMARY KEY, url TEXT UNIQUE, content TEXT, embedding F32_BLOB(1536))",
  );

  db = newDb;

  return db;
}

export async function insertBookmarks(bookmarks: Bookmark[]): Promise<void> {
  const db = await getDb();

  await db.batch(
    bookmarks.map((bookmark) => ({
      sql: `INSERT INTO bookmarks (id, url, content, embedding) VALUES (?, ?, ?, vector32(?))`,
      args: [
        bookmark.id,
        bookmark.url,
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
  let args: unknown[] = [];
  if (searchEmbedding) {
    sql =
      "SELECT id, url, content, embedding FROM bookmarks ORDER BY vector_distance_cos(embedding, vector32(?)) ASC";
    args = [JSON.stringify(searchEmbedding)];
  }

  const result = await db.execute({ sql, args });
  return parse(bookmarksSchema, toObject(result));
}

function toObject({ columns, rows }: ResultSet) {
  return rows.map((row) =>
    columns.reduce((acc, column, index) => {
      const value = row[index];
      // Handle embedding field - convert vector32 result back to array
      if (column === "embedding") {
        if (typeof value === "string") {
          return { ...acc, [column]: JSON.parse(value) };
        } else if (value && typeof value === "object" && Array.isArray(value)) {
          return { ...acc, [column]: value };
        } else if (value && typeof value === "object") {
          // If it's a vector32 object, try to extract the array data
          // This might need adjustment based on the actual structure returned by vector32
          return { ...acc, [column]: Object.values(value) };
        }
        return { ...acc, [column]: [] };
      }
      return { ...acc, [column]: value };
    }, {}),
  );
}
