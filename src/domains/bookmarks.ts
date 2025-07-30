import { randomUUID } from "crypto";
import { getPageContent, getPageMetadata } from "../ai/scrapper.ts";
import { embedText } from "../ai/embeddings.ts";
import { insertBookmarks } from "../database.ts";
import type { BookmarkWithContent } from "../types.ts";

export async function saveBookmark(url: string) {
  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalFailed = 0;

  try {
    const bookmark = await getBookmarkDataFromUrl(url);
    await insertBookmarks([bookmark]);
    totalProcessed++;
    totalSuccess++;
  } catch (error) {
    console.error(`Failed to process bookmark for URL: ${url}`, error);
    totalProcessed++;
    totalFailed++;
  }

  return {
    processedCount: totalProcessed,
    successCount: totalSuccess,
    failedCount: totalFailed,
  };
}

async function getBookmarkDataFromUrl(
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
