import { randomUUID } from "crypto";
import { getPageContent, getPageMetadata } from "../ai/scrapper.ts";
import { embedText } from "../ai/embeddings.ts";
import type { BookmarkWithContent } from "../types.ts";

export async function getBookmarkDataFromUrl(
  url: string,
): Promise<BookmarkWithContent> {
  try {
    new URL(url);
  } catch {
    throw new Error(`Invalid URL format: ${url}`);
  }

  const content = await getPageContent(url);

  const [embedding, metadata] = await Promise.all([
    embedText(content),
    getPageMetadata(content),
  ]);

  return {
    id: randomUUID(),
    url,
    content,
    embedding,
    ...metadata,
  };
}
