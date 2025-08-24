import { sqliteTable, text, blob, integer } from 'drizzle-orm/sqlite-core';

export const bookmarks = sqliteTable('bookmarks', {
  id: text('id').primaryKey(),
  url: text('url').notNull().unique(),
  title: text('title'),              // Make nullable for pending bookmarks
  content: text('content'),          // Make nullable for pending bookmarks
  embedding: blob('embedding', { mode: 'buffer' }),  // Make nullable for pending bookmarks
  status: text('status').notNull().default('completed'), // Default to completed for existing bookmarks
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  processedAt: integer('processed_at', { mode: 'timestamp' }),
  errorMessage: text('error_message'),
});

export const activeTokens = sqliteTable('active_tokens', {
  jti: text('jti').primaryKey(),
  name: text('name').notNull(),
});

export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;
export type ActiveToken = typeof activeTokens.$inferSelect;
export type NewActiveToken = typeof activeTokens.$inferInsert;