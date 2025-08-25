import { randomUUID } from "crypto";
import { err, ok } from "neverthrow";
import { embedText } from "../ai/embeddings.ts";
import { getPageContent, getPageMetadata } from "../ai/scrapper.ts";
import {
  insertBookmarks,
  updateBookmark,
  updateBookmarkStatus,
} from "../data/bookmarks.queries.ts";
import { createInvalidUrlError } from "../errors.ts";
import type { BookmarkStatus } from "./types.ts";

export async function saveBookmark(url: string) {
  try {
    new URL(url);
  } catch {
    return ok({
      processedCount: 1,
      successCount: 0,
      failedCount: 1,
    });
  }

  const bookmarkId = randomUUID();
  const insertResult = await insertBookmarks([
    {
      id: bookmarkId,
      url,
      status: "pending" as BookmarkStatus,
    },
  ]);

  if (insertResult.isErr()) {
    return err(insertResult.error);
  }

  processBookmarkAsync(bookmarkId, url).catch(console.error);

  return ok({
    processedCount: 1,
    successCount: 1,
    failedCount: 0,
  });
}

async function processBookmarkAsync(bookmarkId: string, url: string) {
  const statusUpdateResult = await updateBookmarkStatus(
    bookmarkId,
    "processing" as BookmarkStatus,
  );
  if (statusUpdateResult.isErr()) {
    console.error(
      `Failed to update status to processing for bookmark ${bookmarkId}:`,
      statusUpdateResult.error,
    );
    return;
  }

  try {
    const contentResult = await getPageContent(url);
    if (contentResult.isErr()) {
      await updateBookmarkStatus(
        bookmarkId,
        "failed" as BookmarkStatus,
        contentResult.error.message,
      );
      return;
    }

    const content = contentResult.value;

    const [embeddingResult, metadataResult] = await Promise.all([
      embedText(content),
      getPageMetadata(content, url),
    ]);

    if (embeddingResult.isErr()) {
      await updateBookmarkStatus(
        bookmarkId,
        "failed" as BookmarkStatus,
        embeddingResult.error.message,
      );
      return;
    }

    if (metadataResult.isErr()) {
      await updateBookmarkStatus(
        bookmarkId,
        "failed" as BookmarkStatus,
        metadataResult.error.message,
      );
      return;
    }

    const updateResult = await updateBookmark(
      bookmarkId,
      content,
      metadataResult.value.title || "",
      embeddingResult.value,
    );

    if (updateResult.isErr()) {
      await updateBookmarkStatus(
        bookmarkId,
        "failed" as BookmarkStatus,
        updateResult.error.message,
      );
      return;
    }

    console.log(`Successfully processed bookmark ${bookmarkId}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await updateBookmarkStatus(
      bookmarkId,
      "failed" as BookmarkStatus,
      errorMessage,
    );
    console.error(`Failed to process bookmark ${bookmarkId}:`, error);
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

export async function reprocessBookmark(bookmarkId: string, url: string) {
  console.log(`Reprocessing bookmark ${bookmarkId}...`);
  await processBookmarkAsync(bookmarkId, url);
}
