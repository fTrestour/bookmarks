import type { FastifyRequest, FastifyReply } from "fastify";
import { validateToken } from "./authentication.js";

export async function assertAuthorized(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    reply.code(401).send({ error: "Unauthorized" });
    return false;
  }
  const ok = await validateToken(header.slice(7));
  if (!ok) {
    reply.code(401).send({ error: "Unauthorized" });
    return false;
  }
  return true;
}
