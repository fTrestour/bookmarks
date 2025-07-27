import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { getConfig } from "./config.ts";
import { insertActiveToken, isActiveToken } from "./database.ts";
import type { ActiveToken } from "./types.ts";
import { activeTokenSchema } from "./types.ts";

export async function createToken(name: string): Promise<{
  payload: ActiveToken;
  token: string;
}> {
  const { jwtSecret } = getConfig();
  const jti = randomUUID();
  const payload: ActiveToken = { jti, name };
  const token = jwt.sign(payload, jwtSecret, {
    algorithm: "HS256",
  });
  await insertActiveToken(payload);
  return { payload, token };
}

export function readToken(token: string): ActiveToken {
  const { jwtSecret } = getConfig();
  const decoded = jwt.verify(token, jwtSecret);
  return activeTokenSchema.parse(decoded);
}

export async function validateToken(token: string): Promise<boolean> {
  try {
    const { jti } = readToken(token);
    return await isActiveToken(jti);
  } catch {
    return false;
  }
}
