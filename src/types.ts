import { z } from "zod";

export const bookmarkSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
});

export const bookmarkWithContentSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  content: z.string(),
  embedding: z.array(z.number()),
});

export const bookmarksSchema = z.array(bookmarkSchema);
export const bookmarksWithContentSchema = z.array(bookmarkWithContentSchema);

export type Bookmark = z.infer<typeof bookmarkSchema>;

export type BookmarkWithContent = Bookmark & {
  content: string;
  embedding: number[];
};
