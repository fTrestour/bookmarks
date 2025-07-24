import { createClient } from '@libsql/client';
import { getConfig } from './config';

export function initDb() {
  const { dbUri } = getConfig();
  
  const client = createClient({
    url: dbUri
  });
  
  return client;
}
