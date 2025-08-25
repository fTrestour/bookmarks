import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  customType,
} from "drizzle-orm/sqlite-core";

const float32Array = customType<{
  data: number[];
  config: { dimensions: number };
  configRequired: true;
  driverData: Buffer;
}>({
  dataType(config) {
    return `F32_BLOB(${config.dimensions})`;
  },
  fromDriver(value: Buffer) {
    return Array.from(new Float32Array(value.buffer));
  },
  toDriver(value: number[]) {
    return sql`vector32(${JSON.stringify(value)})`;
  },
});

export const bookmarks = sqliteTable(
  "bookmarks",
  {
    id: text().primaryKey().notNull(),
    url: text().notNull(),
    title: text(),
    content: text(),
    embedding: float32Array("embedding", { dimensions: 1536 }).default(
      sql`NULL`,
    ),
    status: text().notNull().default("pending"),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    processedAt: integer("processed_at"),
    errorMessage: text("error_message"),
  },
  (table) => [uniqueIndex("bookmarks_url_unique").on(table.url)],
);

export const activeTokens = sqliteTable("active_tokens", {
  jti: text().primaryKey().notNull(),
  name: text().notNull(),
});

export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;
export type ActiveToken = typeof activeTokens.$inferSelect;
export type NewActiveToken = typeof activeTokens.$inferInsert;
