import fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { getAllBookmarks, deleteActiveToken } from "./database.ts";
import { z } from "zod";
import { saveBookmarks } from "./domains/bookmarks.ts";
import { embedText } from "./ai/embeddings.ts";
import { getLoggerConfig } from "./logger.ts";
import { createToken, validateToken } from "./authentication.ts";

export const api = fastify({ logger: getLoggerConfig() });

api.get("/", () => {
  return "👋";
});

api.post("/tokens", {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  preHandler: assertAuthorized,
  handler: async (request) => {
    const { name } = z.object({ name: z.string() }).parse(request.body);
    const { token, payload } = await createToken(name);
    return { token, jti: payload.jti };
  },
});

api.delete("/tokens/:jti", {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  preHandler: assertAuthorized,
  handler: async (request) => {
    const { jti } = z.object({ jti: z.string() }).parse(request.params);
    await deleteActiveToken(jti);
    return { success: true };
  },
});

api.get("/bookmarks", async (request) => {
  const querySchema = z.object({ search: z.string().optional() });
  const { search } = querySchema.parse(request.query);

  const searchEmbedding = search ? await embedText(search) : null;
  const bookmarks = await getAllBookmarks(searchEmbedding);
  return bookmarks;
});

api.post("/bookmarks", {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  preHandler: assertAuthorized,
  handler: async (request) => {
    const bodySchema = z.object({
      url: z.string().url(),
    });
    const body = bodySchema.parse(request.body);

    await saveBookmarks([body.url]);
    return { success: true };
  },
});

api.post("/bookmarks/batch", {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  preHandler: assertAuthorized,
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
