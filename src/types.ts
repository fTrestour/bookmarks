import { z } from "zod";

const bookmarkInsertSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  status: z.enum(["pending"]),
});

export const bookmarkSchema = bookmarkInsertSchema.extend({
  title: z.string().min(1),
});

export const bookmarkWithContentSchema = bookmarkSchema.extend({
  content: z.string(),
});

export const pendingBookmarkSchema = bookmarkInsertSchema.extend({
  title: z.string().nullable(),
  content: z.string().nullable(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  createdAt: z.date(),
  processedAt: z.date().nullable(),
  errorMessage: z.string().nullable(),
});

export const bookmarksSchema = z.array(bookmarkSchema);

export type BookmarkInsert = z.infer<typeof bookmarkInsertSchema>;

export type Bookmark = z.infer<typeof bookmarkSchema>;

export const activeTokenSchema = z.object({
  jti: z.string().uuid(),
  name: z.string().min(1).trim(),
});

export type ActiveToken = z.infer<typeof activeTokenSchema>;
