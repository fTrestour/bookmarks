import fastify from "fastify";
import { getAllBookmarks, insertBookmarks } from "./database.ts";
import { z } from "zod";
import { getBookmarkDataFromUrl } from "./domains/bookmarks.ts";
import { embedText } from "./ai/embeddings.ts";
import { getLoggerConfig } from "./logger.ts";

export const server = fastify({ logger: getLoggerConfig() });

server.get("/", () => {
  return "👋";
});

server.get("/bookmarks", async (request) => {
  const querySchema = z.object({ search: z.string().optional() });
  const { search } = querySchema.parse(request.query);

  const searchEmbedding = search ? await embedText(search) : undefined;
  const bookmarks = await getAllBookmarks(searchEmbedding);
  return bookmarks;
});

server.post("/bookmarks", async (request) => {
  const bodySchema = z.object({
    url: z.string(),
  });
  const body = bodySchema.parse(request.body);

  const bookmark = await getBookmarkDataFromUrl(body.url);

  await insertBookmarks([bookmark]);
  return { success: true };
});

server.post("/bookmarks/batch", async (request) => {
  const bodySchema = z.object({
    url: z.string(),
  });
  const batchBodySchema = z.array(bodySchema);
  const body = batchBodySchema.parse(request.body);

  const bookmarks = [];
  const BATCH_SIZE = 20;
  for (let i = 0; i < body.length; i += BATCH_SIZE) {
    const batch = body.slice(i, i + BATCH_SIZE);
    const batchBookmarks = await Promise.all(
      batch.map((item) => getBookmarkDataFromUrl(item.url)),
    );
    bookmarks.push(...batchBookmarks);
  }

  await insertBookmarks(bookmarks);
  return { success: true };
});
