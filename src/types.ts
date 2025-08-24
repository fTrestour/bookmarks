import { z } from "zod";

export const bookmarkSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  title: z.string().min(1).nullable(),
});

export const bookmarksSchema = z.array(bookmarkSchema);

export type Bookmark = z.infer<typeof bookmarkSchema>;

export type BookmarkWithContent = Bookmark & {
  content: string | null;
  embedding: number[] | null;
  status?: string;
  createdAt?: Date;
  processedAt?: Date;
  errorMessage?: string;
};

export const activeTokenSchema = z.object({
  jti: z.string().uuid(),
  name: z.string().min(1).trim(),
});

export type ActiveToken = z.infer<typeof activeTokenSchema>;
