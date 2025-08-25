import { randomUUID } from "crypto";
import { err, ok } from "neverthrow";
import { embedText } from "../ai/embeddings.ts";
import { getPageContent, getPageMetadata } from "../ai/scrapper.ts";
import {
  getBookmarkById,
  insertBookmark,
  updateBookmark,
  updateBookmarkStatus,
} from "../data/bookmarks.queries.ts";
import { createInvalidUrlError } from "../errors.ts";
import { z } from "zod";

export async function saveBookmark(url: string) {
  try {
    z.string().url().parse(url);
  } catch {
    return err(createInvalidUrlError(url));
  }

  const bookmarkId = randomUUID();

  const insertResult = await insertBookmark({
    id: bookmarkId,
    url,
    status: "pending",
  });

  if (insertResult.isErr()) {
    return err(insertResult.error);
  }

  processBookmark(bookmarkId)
    .then((result) => {
      if (result.isErr()) {
        console.error(
          `Failed to process bookmark ${bookmarkId}:`,
          result.error,
        );
      }
    })
    .catch((error: unknown) => {
      console.error(
        `Unexpected error while processing bookmark ${bookmarkId}:`,
        error,
      );
    });

  return ok({
    processedCount: 1,
    successCount: 1,
    failedCount: 0,
  });
}

export async function processBookmark(bookmarkId: string) {
  const r = await updateBookmarkStatus(bookmarkId, "processing");
  if (r.isErr()) {
    return err(r.error);
  }

  const bookmarkResult = await getBookmarkById(bookmarkId);
  if (bookmarkResult.isErr()) {
    return err(bookmarkResult.error);
  }
  const url = bookmarkResult.value.url;

  const contentResult = await getPageContent(url);
  if (contentResult.isErr()) {
    const r = await updateBookmarkStatus(
      bookmarkId,
      "failed",
      contentResult.error.message,
    );

    if (r.isErr()) {
      return err(r.error);
    }

    return err(contentResult.error);
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
    if (r.isErr()) {
      return err(r.error);
    }
    return err(embeddingResult.error);
  }

  if (metadataResult.isErr()) {
    const r = await updateBookmarkStatus(
      bookmarkId,
      "failed",
      metadataResult.error.message,
    );
    if (r.isErr()) return err(r.error);
    return err(metadataResult.error);
  }

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
    if (r.isErr()) return err(r.error);
    return err(updateResult.error);
  }

  return await updateBookmarkStatus(bookmarkId, "completed");
}
