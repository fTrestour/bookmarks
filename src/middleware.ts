import type { FastifyRequest, FastifyReply } from "fastify";
import { validateToken } from "./authentication.ts";

export async function assertAuthorized(
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
