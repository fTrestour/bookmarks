import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { err, ok } from "neverthrow";
import { getConfig } from "../config.ts";
import {
  insertActiveToken,
  isActiveToken,
} from "../data/active-token.queries.ts";
import { createInvalidTokenError } from "../errors.ts";
import { activeTokenSchema } from "../types.ts";

export async function createToken(name: string) {
  const { jwtSecret } = getConfig();
  const jti = randomUUID();
  const payload = { jti, name };
  const token = jwt.sign(payload, jwtSecret, {
    algorithm: "HS256",
  });

  const insertResult = await insertActiveToken(payload);
  return insertResult.map(() => ({ payload, token }));
}

export function readToken(token: string) {
  try {
    const { jwtSecret } = getConfig();
    const decoded = jwt.verify(token, jwtSecret);
    const parsedToken = activeTokenSchema.parse(decoded);
    return ok(parsedToken);
  } catch (error) {
    return err(createInvalidTokenError(error));
  }
}

export async function validateToken(token: string) {
  const tokenResult = readToken(token);
  if (tokenResult.isErr()) {
    return err(tokenResult.error);
  }

  const { jti } = tokenResult.value;
  return await isActiveToken(jti);
}
