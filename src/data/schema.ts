import { sql } from "drizzle-orm";
import {
  numeric,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const bookmarks = sqliteTable(
  "bookmarks",
  {
    id: text().primaryKey().notNull(),
    url: text().notNull(),
    title: text(),
    content: text(),
    embedding: numeric().default(sql`(NULL)`),
  },
  (table) => [uniqueIndex("bookmarks_url_unique").on(table.url)],
);

export const activeTokens = sqliteTable("active_tokens", {
  jti: text().primaryKey().notNull(),
  name: text().notNull(),
});
