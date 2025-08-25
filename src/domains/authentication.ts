import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { err, ok } from "neverthrow";
import { getConfig } from "../config.ts";
import {
  insertActiveToken,
  isActiveToken,
} from "../data/active-token.queries.ts";
import { createInvalidTokenError } from "../errors.ts";

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
    return ok(decoded);
  } catch (error) {
    return err(createInvalidTokenError(error));
  }
}

export async function validateToken(token: string) {
  const tokenResult = readToken(token);
  if (tokenResult.isErr()) {
    return err(tokenResult.error);
  }

  if (typeof tokenResult.value !== "object") {
    return err(createInvalidTokenError("Token is not an object"));
  }

  if (!("jti" in tokenResult.value)) {
    return err(createInvalidTokenError("Token does not contain jti field"));
  }

  const { jti } = tokenResult.value;

  if (typeof jti !== "string") {
    return err(createInvalidTokenError("jti is not a string"));
  }

  return await isActiveToken(jti);
}
