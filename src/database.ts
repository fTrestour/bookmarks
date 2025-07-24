import Database from 'libsql';
import { getConfig } from './config';

export function initDb() {
  const { dbUri } = getConfig();

  const db = new Database(dbUri);

  return db;
}

export async function createTables(): Promise<void> {
  const db = initDb();
  
  await db.exec("CREATE TABLE bookmarks (id TEXT PRIMARY KEY, url TEXT)");
}
