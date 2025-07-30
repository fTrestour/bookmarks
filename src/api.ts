import fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { getAllBookmarks, deleteActiveToken } from "./database.ts";
import { z } from "zod";
import { saveBookmark } from "./domains/bookmarks.ts";
import { embedText } from "./ai/embeddings.ts";
import { getLoggerConfig } from "./logger.ts";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { createToken, validateToken } from "./domains/authentication.ts";
import { getConfig } from "./config.ts";

const config = getConfig();

export const api = fastify({ logger: getLoggerConfig() });

if (config.corsAllowOrigin) {
  api.register(cors, {
    origin: config.corsAllowOrigin,
  });
}

if (config.env !== "test") {
  await api.register(rateLimit, {
    max: 200,
    timeWindow: "1 minute",
  });
}

api.get("/", () => {
  return "👋";
});

api.post("/tokens", {
  config:
    config.env !== "test"
      ? {
          rateLimit: {
            max: 1,
            timeWindow: "1 hour",
          },
        }
      : undefined,
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
  config:
    config.env !== "test"
      ? {
          rateLimit: {
            max: 1,
            timeWindow: "1 minute",
          },
        }
      : undefined,
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  preHandler: assertAuthorized,
  handler: async (request) => {
    const bodySchema = z.object({
      url: z.string().url(),
    });
    const body = bodySchema.parse(request.body);

    const stats = await saveBookmark(body.url);

    return { success: stats.failedCount === 0, stats };
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
