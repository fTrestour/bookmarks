import { randomUUID } from "crypto";
import { err, ok } from "neverthrow";
import { embedText } from "../ai/embeddings.ts";
import { getPageContent, getPageMetadata } from "../ai/scrapper.ts";
import { insertBookmarks, updateBookmark, updateBookmarkStatus } from "../database.ts";
import { createInvalidUrlError } from "../errors.ts";

// Fast path: Create bookmark immediately without content
export async function saveBookmark(url: string) {
  try {
    new URL(url);
  } catch {
    return err(createInvalidUrlError(url));
  }

  const bookmarkId = randomUUID();
  const now = new Date();
  
  // Insert bookmark with pending status
  const insertResult = await insertBookmarks([{
    id: bookmarkId,
    url,
    title: null,
    content: null,
    embedding: null,
    status: 'pending',
    createdAt: now,
  }]);

  if (insertResult.isErr()) {
    return err(insertResult.error);
  }

  // Queue async processing (don't await)
  processBookmarkAsync(bookmarkId, url).catch(error => {
    console.error(`Failed to process bookmark ${bookmarkId}:`, error);
  });

  return ok({
    processedCount: 1,
    successCount: 1,
    failedCount: 0,
  });
}

// Original function renamed for async processing
export async function saveBookmarkSync(url: string) {
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

// Async processing function
async function processBookmarkAsync(bookmarkId: string, url: string) {
  try {
    // Update status to processing
    await updateBookmarkStatus(bookmarkId, 'processing');

    // Get page content and metadata
    const contentResult = await getPageContent(url);
    if (contentResult.isErr()) {
      await updateBookmarkStatus(bookmarkId, 'failed', contentResult.error.message);
      return;
    }

    const content = contentResult.value;

    const [embeddingResult, metadataResult] = await Promise.all([
      embedText(content),
      getPageMetadata(content, url),
    ]);

    if (embeddingResult.isErr()) {
      await updateBookmarkStatus(bookmarkId, 'failed', embeddingResult.error.message);
      return;
    }

    if (metadataResult.isErr()) {
      await updateBookmarkStatus(bookmarkId, 'failed', metadataResult.error.message);
      return;
    }

    // Update bookmark with content, title, and embedding
    const updateResult = await updateBookmark(
      bookmarkId,
      content,
      metadataResult.value.title,
      embeddingResult.value,
    );

    if (updateResult.isErr()) {
      await updateBookmarkStatus(bookmarkId, 'failed', updateResult.error.message);
      return;
    }

    // Mark as completed
    await updateBookmarkStatus(bookmarkId, 'completed');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateBookmarkStatus(bookmarkId, 'failed', errorMessage);
  }
}

export async function getBookmarkDataFromUrl(url: string) {
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

// Function to reprocess a bookmark by ID (for CLI)
export async function reprocessBookmark(bookmarkId: string, url: string) {
  return processBookmarkAsync(bookmarkId, url);
}
