import { z } from "zod";

export const bookmarkSchema = z.object({
  id: z.string(),
  url: z.string(),
});

export type Bookmark = z.infer<typeof bookmarkSchema>;
