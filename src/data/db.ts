import { createClient } from "@libsql/client";

export async function initDb(url: string) {
  const database = createClient({ url });
  await database.execute(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      source_id TEXT UNIQUE,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      tags TEXT NOT NULL,
      vector BLOB NOT NULL
    )
  `);

  return database;
}
