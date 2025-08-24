import type { Config } from "drizzle-kit";
import { getConfig } from "./src/config.ts";

const { dbUri, dbAuthToken } = getConfig();

export default {
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "turso",
  dbCredentials: {
    url: dbUri,
    authToken: dbAuthToken,
  },
} satisfies Config;
