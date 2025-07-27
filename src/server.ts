import fastify from "fastify";
import {
  getAllBookmarks,
  insertBookmarks,
  deleteActiveToken,
} from "./database.ts";
import { z } from "zod";
import {
  getBookmarkDataFromUrl,
  insertManyBookmarks,
} from "./domains/bookmarks.ts";
import { embedText } from "./ai/embeddings.ts";
import { getLoggerConfig } from "./logger.ts";
import type { BookmarkWithContent } from "./types.ts";
import { createToken } from "./authentication.ts";
import { assertAuthorized } from "./middleware.ts";

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

server.post("/bookmarks", {
  preHandler: void assertAuthorized,
  handler: async (request) => {
    const bodySchema = z.object({
      url: z.string().url(),
    });
    const body = bodySchema.parse(request.body);

    const bookmark = await getBookmarkDataFromUrl(body.url);

    await insertBookmarks([bookmark]);
    return { success: true };
  },
});

server.post("/bookmarks/batch", {
  preHandler: void assertAuthorized,
  handler: async (request) => {
    const bodySchema = z.object({
      url: z.string().url(),
    });
    const batchBodySchema = z.array(bodySchema);
    const body = batchBodySchema.parse(request.body);

    const urls = body.map((item) => item.url);
    const stats = await insertManyBookmarks(urls);

    return {
      success: true,
      stats,
    };
  },
});
