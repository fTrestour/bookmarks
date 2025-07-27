import { randomUUID } from "crypto";
import { getPageContent } from "../scrapper.ts";
import { embedText } from "../embeddings.ts";
import type { BookmarkWithContent } from "../types.ts";

export async function getBookmarkDataFromUrl(
  url: string,
): Promise<BookmarkWithContent> {
  const content = await getPageContent(url);

  return {
    id: randomUUID(),
    url,
    content,
    embedding: await embedText(content),
  };
}
