import fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { getAllBookmarks, deleteActiveToken } from "./database.ts";
import { z } from "zod";
import { saveBookmarks } from "./domains/bookmarks.ts";
import { embedText } from "./ai/embeddings.ts";
import { getLoggerConfig } from "./logger.ts";
import { createToken, validateToken } from "./authentication.ts";

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

  const searchEmbedding = search ? await embedText(search) : null;
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

    await saveBookmarks([body.url]);
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

    const stats = await saveBookmarks(body.map((item) => item.url));

    return {
      success: stats.totalFailed === 0,
      stats,
    };
  },
});

async function assertAuthorized(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const header = request.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    reply.code(401).send({ error: "Unauthorized" });
    return;
  }

  const ok = await validateToken(header.slice(7));

  if (!ok) {
    reply.code(401).send({ error: "Unauthorized" });
    return;
  }
}
