import Database from "libsql/promise";
import { getConfig } from "./config.ts";
import type { Bookmark } from "./types.ts";

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

  const stmt = db.prepare("SELECT id, url FROM bookmarks");
  const result = await stmt.all();
  return result as Bookmark[];
}
