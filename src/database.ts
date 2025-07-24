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
    "CREATE TABLE IF NOT EXISTS bookmarks (id TEXT PRIMARY KEY, url TEXT UNIQUE)",
  );

  db = newDb;

  return db;
}

export async function insertBookmarks(bookmarks: Bookmark[]): Promise<void> {
  const db = await getDb();

  await db.batch(
    bookmarks.map((bookmark) => ({
      sql: `INSERT INTO bookmarks (id, url) VALUES (?, ?)`,
      args: [bookmark.id, bookmark.url],
    })),
    "write",
  );
}

export async function getAllBookmarks(): Promise<Bookmark[]> {
  const db = await getDb();

  const result = await db.execute({
    sql: "SELECT * FROM bookmarks",
  });
  return parse(bookmarksSchema, toObject(result));
}

function toObject({ columns, rows }: ResultSet) {
  return rows.map((row) =>
    columns.reduce(
      (acc, column, index) => ({ ...acc, [column]: row[index] }),
      {},
    ),
  );
}
