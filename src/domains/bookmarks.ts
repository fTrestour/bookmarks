import { randomUUID } from "crypto";
import { err, ok } from "neverthrow";
import { embedText } from "../ai/embeddings.ts";
import { getPageContent, getPageMetadata } from "../ai/scrapper.ts";
import {
  insertBookmarks,
  updateBookmark,
  updateBookmarkStatus,
} from "../database.ts";
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
  const insertResult = await insertBookmarks([
    {
      id: bookmarkId,
      url,
      title: null,
      content: null,
      embedding: null,
      status: "pending",
      createdAt: now,
    },
  ]);

  if (insertResult.isErr()) {
    return err(insertResult.error);
  }

  // Queue async processing (don't await)
  processBookmarkAsync(bookmarkId, url).catch((error: unknown) => {
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
    {
      const r = await updateBookmarkStatus(bookmarkId, "processing");
      if (r.isErr()) {
        console.error(`Failed to set processing for ${bookmarkId}:`, r.error);
      }
    }

    // Get page content and metadata
    const contentResult = await getPageContent(url);
    if (contentResult.isErr()) {
      const r = await updateBookmarkStatus(
        bookmarkId,
        "failed",
        contentResult.error.message,
      );
      if (r.isErr())
        console.error(`Failed to set failed for ${bookmarkId}:`, r.error);
      return;
    }

    const content = contentResult.value;

    const [embeddingResult, metadataResult] = await Promise.all([
      embedText(content),
      getPageMetadata(content, url),
    ]);

    if (embeddingResult.isErr()) {
      const r = await updateBookmarkStatus(
        bookmarkId,
        "failed",
        embeddingResult.error.message,
      );
      if (r.isErr())
        console.error(`Failed to set failed for ${bookmarkId}:`, r.error);
      return;
    }

    if (metadataResult.isErr()) {
      const r = await updateBookmarkStatus(
        bookmarkId,
        "failed",
        metadataResult.error.message,
      );
      if (r.isErr())
        console.error(`Failed to set failed for ${bookmarkId}:`, r.error);
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
      const r = await updateBookmarkStatus(
        bookmarkId,
        "failed",
        updateResult.error.message,
      );
      if (r.isErr())
        console.error(`Failed to set failed for ${bookmarkId}:`, r.error);
      return;
    }

    // Mark as completed
    {
      const r = await updateBookmarkStatus(bookmarkId, "completed");
      if (r.isErr())
        console.error(`Failed to set completed for ${bookmarkId}:`, r.error);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const r = await updateBookmarkStatus(bookmarkId, "failed", errorMessage);
    if (r.isErr())
      console.error(`Failed to set failed for ${bookmarkId}:`, r.error);
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
