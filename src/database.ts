import Database from 'libsql';
import { getConfig } from './config';

export function initDb() {
  const { dbUri } = getConfig();

  const db = new Database(dbUri);

  return db;
}
