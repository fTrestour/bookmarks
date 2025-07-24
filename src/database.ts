import Database from "libsql/promise";
import { getConfig } from "./config.ts";
import { bookmarkSchema, type Bookmark } from "./types.ts";

export function initDb() {
  const { dbUri } = getConfig();

  const db = new Database(dbUri, { async: true });

  return db;
}

export async function createTables(): Promise<void> {
  const db = initDb();

  await db.exec("CREATE TABLE bookmarks (id TEXT PRIMARY KEY, url TEXT)");
}

export async function getAllBookmarks(): Promise<Bookmark[]> {
  const db = initDb();

  const result = await db.exec("SELECT id, url FROM bookmarks");

  // Validate and parse each row using the schema
  return result.map((row: any) => bookmarkSchema.parse(row));
}
