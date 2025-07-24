import { z } from "zod";

export const bookmarkSchema = z.object({
  id: z.string(),
  url: z.string(),
  content: z.string(),
  embedding: z.array(z.number()),
});

export const bookmarksSchema = z.array(bookmarkSchema);

export type Bookmark = z.infer<typeof bookmarkSchema>;

export function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data);
}
