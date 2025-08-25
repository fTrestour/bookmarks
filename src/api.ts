import rateLimit from "@fastify/rate-limit";
import fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import type { Err } from "neverthrow";
import { z } from "zod";
import { embedText } from "./ai/embeddings.ts";
import { getConfig } from "./config.ts";
import { deleteActiveToken } from "./data/active-token.queries.ts";
import { getAllCompletedBookmarks } from "./data/bookmarks.queries.ts";
import { createToken, validateToken } from "./domains/authentication.ts";
import { saveBookmark } from "./domains/bookmarks.ts";
import type { AppError } from "./errors.ts";
import { getLoggerConfig } from "./logger.ts";

const config = getConfig();

export const api = fastify({ logger: getLoggerConfig() });

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
  handler: async (request, reply) => {
    const { name } = z.object({ name: z.string() }).parse(request.body);
    const result = await createToken(name);

    if (result.isErr()) {
      handleError(result, reply);
      return;
    }

    const tokenData = result.value;
    return { token: tokenData.token, jti: tokenData.payload.jti };
  },
});

api.delete("/tokens/:jti", {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  preHandler: assertAuthorized,
  handler: async (request, reply) => {
    const { jti } = z.object({ jti: z.string() }).parse(request.params);
    const result = await deleteActiveToken(jti);

    if (result.isErr()) {
      handleError(result, reply);
      return;
    }

    return { success: true };
  },
});

api.get("/bookmarks", async (request, reply) => {
  const querySchema = z.object({ search: z.string().optional() });
  const { search } = querySchema.parse(request.query);

  let searchEmbedding: number[] | null = null;
  if (search) {
    const embeddingResult = await embedText(search);
    if (embeddingResult.isErr()) {
      handleError(embeddingResult, reply);
      return;
    }
    searchEmbedding = embeddingResult.value;
  }

  const bookmarksResult = await getAllCompletedBookmarks(
    searchEmbedding,
    search ? config.limit : undefined,
  );
  if (bookmarksResult.isErr()) {
    handleError(bookmarksResult, reply);
    return;
  }

  return bookmarksResult.value;
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
  handler: async (request, reply) => {
    const bodySchema = z.object({
      url: z.string().url(),
    });
    const body = bodySchema.parse(request.body);

    const result = await saveBookmark(body.url);
    if (result.isErr()) {
      handleError(result, reply);
      return;
    }

    const stats = result.value;
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

  const result = await validateToken(header.slice(7));

  if (result.isErr()) {
    reply.code(401).send({ error: "Unauthorized" });
    return;
  }

  if (!result.value) {
    reply.code(401).send({ error: "Unauthorized" });
    return;
  }
}

function handleError(
  result: Err<unknown, AppError>,
  reply: FastifyReply,
): void {
  const { code, message } = result.error;

  const statusCode = (() => {
    switch (code) {
      case "INVALID_TOKEN_ERROR":
        return 401;
      case "DUPLICATE_TOKEN_ERROR":
        return 409;
      case "INVALID_URL_ERROR":
      case "EMPTY_TEXT_ERROR":
        return 400;
      case "DATABASE_ERROR":
      case "DATABASE_CONNECTION_ERROR":
      case "EMBEDDING_ERROR":
      case "SCRAPING_ERROR":
      case "CONTENT_EXTRACTION_ERROR":
      default:
        return 500;
    }
  })();

  reply.code(statusCode).send({ error: message, code });

  if (statusCode < 500) {
    api.log.warn(result.error);
  } else {
    api.log.error(result.error);
  }
}
