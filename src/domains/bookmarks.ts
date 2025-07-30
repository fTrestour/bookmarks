import { randomUUID } from "crypto";
import { err, ok } from "neverthrow";
import { embedText } from "../ai/embeddings.ts";
import { getPageContent, getPageMetadata } from "../ai/scrapper.ts";
import { insertBookmarks } from "../database.ts";
import { createInvalidUrlError } from "../errors.ts";

export async function saveBookmark(url: string) {
  const bookmarkResult = await getBookmarkDataFromUrl(url);
  if (bookmarkResult.isErr()) {
    return ok({
      processedCount: 1,
      successCount: 0,
      failedCount: 1,
    });
  }

  const insertResult = await insertBookmarks([bookmarkResult.value]);
  if (insertResult.isErr()) {
    return err(insertResult.error);
  }

  return ok({
    processedCount: 1,
    successCount: 1,
    failedCount: 0,
  });
}

async function getBookmarkDataFromUrl(url: string) {
  try {
    new URL(url);
  } catch {
    return err(createInvalidUrlError(url));
  }

  const contentResult = await getPageContent(url);
  if (contentResult.isErr()) {
    return err(contentResult.error);
  }

  const content = contentResult.value;

  const [embeddingResult, metadataResult] = await Promise.all([
    embedText(content),
    getPageMetadata(content, url),
  ]);

  if (embeddingResult.isErr()) {
    return err(embeddingResult.error);
  }

  if (metadataResult.isErr()) {
    return err(metadataResult.error);
  }

  return ok({
    id: randomUUID(),
    url,
    content,
    embedding: embeddingResult.value,
    ...metadataResult.value,
  });
}
