import { z } from "zod";

export const bookmarkSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  title: z.string().min(1),
});

export const bookmarksSchema = z.array(bookmarkSchema);

export type Bookmark = z.infer<typeof bookmarkSchema>;

export type BookmarkWithContent = Bookmark & {
  content: string;
  embedding: number[];
};

export const activeTokenSchema = z.object({
  jti: z.string().uuid(),
  name: z.string().min(1),
});

export type ActiveToken = z.infer<typeof activeTokenSchema>;
