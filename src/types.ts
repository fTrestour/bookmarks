import { z } from "zod";

export const bookmarkSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  author: z.string(),
});

export const bookmarksSchema = z.array(bookmarkSchema);

export type Bookmark = z.infer<typeof bookmarkSchema>;

export type BookmarkWithContent = Bookmark & {
  content: string;
  embedding: number[];
};
