import { randomUUID } from "crypto";
import { getPageContent, getPageMetadata } from "../ai/scrapper.ts";
import { embedText } from "../ai/embeddings.ts";
import { insertBookmarks } from "../database.ts";
import type { BookmarkWithContent } from "../types.ts";

export async function saveBookmarks(urls: string[]) {
  const bookmarks: BookmarkWithContent[] = [];
  const BATCH_SIZE = 20;
  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalFailed = 0;

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map((url) => getBookmarkDataFromUrl(url)),
    );

    batchResults.forEach((result, index) => {
      const url = batch[index];
      totalProcessed++;

      if (result.status === "fulfilled") {
        bookmarks.push(result.value);
        totalSuccess++;
      } else {
        console.error(
          `Failed to process bookmark for URL: ${url}`,
          result.reason,
        );
        totalFailed++;
      }
    });
  }

  if (bookmarks.length > 0) {
    await insertBookmarks(bookmarks);
  }

  return {
    totalProcessed,
    totalSuccess,
    totalFailed,
    bookmarksInserted: bookmarks.length,
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
