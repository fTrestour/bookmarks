import fastify from "fastify";
import {
  getAllBookmarks,
  insertBookmarks,
  deleteActiveToken,
} from "./database.ts";
import { z } from "zod";
import { getBookmarkDataFromUrl } from "./domains/bookmarks.ts";
import { embedText } from "./ai/embeddings.ts";
import { getLoggerConfig } from "./logger.ts";
import type { BookmarkWithContent } from "./types.ts";
import { createToken, assertAuthorized } from "./authentication.ts";

export const server = fastify({ logger: getLoggerConfig() });

server.get("/", () => {
  return "👋";
});

server.post("/tokens", async (request) => {
  const { name } = z.object({ name: z.string() }).parse(request.body);
  const { token, payload } = await createToken(name);
  return { token, jti: payload.jti };
});

server.delete("/tokens/:jti", async (request) => {
  const { jti } = z.object({ jti: z.string() }).parse(request.params);
  await deleteActiveToken(jti);
  return { success: true };
});

server.get("/bookmarks", async (request) => {
  const querySchema = z.object({ search: z.string().optional() });
  const { search } = querySchema.parse(request.query);

  const searchEmbedding = search ? await embedText(search) : undefined;
  const bookmarks = await getAllBookmarks(searchEmbedding);
  return bookmarks;
});

server.post("/bookmarks", async (request, reply) => {
  if (!(await assertAuthorized(request, reply))) return;
  const bodySchema = z.object({
    url: z.string().url(),
  });
  const body = bodySchema.parse(request.body);

  const bookmark = await getBookmarkDataFromUrl(body.url);

  await insertBookmarks([bookmark]);
  return { success: true };
});

server.post("/bookmarks/batch", async (request, reply) => {
  if (!(await assertAuthorized(request, reply))) return;
  const bodySchema = z.object({
    url: z.string().url(),
  });
  const batchBodySchema = z.array(bodySchema);
  const body = batchBodySchema.parse(request.body);

  const bookmarks: BookmarkWithContent[] = [];
  const BATCH_SIZE = 20;
  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalFailed = 0;

  for (let i = 0; i < body.length; i += BATCH_SIZE) {
    const batch = body.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map((item) => getBookmarkDataFromUrl(item.url)),
    );

    batchResults.forEach((result, index) => {
      const url = batch[index].url;
      totalProcessed++;

      if (result.status === "fulfilled") {
        bookmarks.push(result.value);
        totalSuccess++;
      } else {
        request.log.error(
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
    success: true,
    stats: {
      totalProcessed,
      totalSuccess,
      totalFailed,
      bookmarksInserted: bookmarks.length,
    },
  };
});
