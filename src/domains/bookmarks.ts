import { randomUUID } from "crypto";
import { getPageContent } from "../scrapper.ts";
import { embedText } from "../embeddings.ts";
import type { Bookmark } from "../types.ts";

export async function getBookmarkDataFromUrl(url: string): Promise<Bookmark> {
  const content = await getPageContent(url);

  return {
    id: randomUUID(),
    url: url,
    content: content,
    embedding: await embedText(content),
  };
}
