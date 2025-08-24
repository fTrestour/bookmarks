import type { Config } from 'drizzle-kit';
import { getConfig } from './src/config.js';

const { dbUri, dbAuthToken } = getConfig();

export default {
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'turso',
  dbCredentials: {
    url: dbUri,
    authToken: dbAuthToken,
  },
} satisfies Config;