import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import type { FastifyRequest, FastifyReply } from "fastify";
import { getConfig } from "./config.ts";
import { insertActiveToken, isActiveToken } from "./database.ts";
import type { ActiveToken } from "./types.ts";

export async function createToken(name: string): Promise<{
  payload: ActiveToken;
  token: string;
}> {
  const { jwtSecret } = getConfig();
  const jti = randomUUID();
  const payload: ActiveToken = { jti, name };
  const token = jwt.sign(payload, jwtSecret, {
    algorithm: "HS256",
    jwtid: jti,
  });
  await insertActiveToken(payload);
  return { payload, token };
}

export function readToken(token: string): ActiveToken {
  const { jwtSecret } = getConfig();
  const decoded = jwt.verify(token, jwtSecret) as unknown as ActiveToken;
  return { jti: decoded.jti, name: decoded.name };
}

export async function validateToken(token: string): Promise<boolean> {
  try {
    const { jti } = readToken(token);
    return await isActiveToken(jti);
  } catch {
    return false;
  }
}

export async function assertAuthorized(request: FastifyRequest, reply: FastifyReply) {
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
