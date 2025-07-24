import Database from "libsql/promise";
import { getConfig } from "./config.ts";
import { bookmarksSchema, parse, type Bookmark } from "./types.ts";

export function initDb() {
  const { dbUri } = getConfig();

  const db = new Database(dbUri, { async: true });

  return db;
}

export async function createTables(): Promise<void> {
  const db = initDb();

  await db.exec(
    "CREATE TABLE IF NOT EXISTS bookmarks (id TEXT PRIMARY KEY, url TEXT)",
  );
}

export async function insertBookmarks(bookmarks: Bookmark[]): Promise<void> {
  const db = initDb();

  for (const bookmark of bookmarks) {
    await db.exec(
      `INSERT INTO bookmarks (id, url) VALUES ('${bookmark.id}', '${bookmark.url}')`,
    );
  }
}

export async function getAllBookmarks(): Promise<Bookmark[]> {
  const db = initDb();

  // Ensure the table exists
  await createTables();

  const result = await db.exec("SELECT id, url FROM bookmarks");

  // Validate and parse the result using the bookmarks schema
  return parse(bookmarksSchema, result);
}
