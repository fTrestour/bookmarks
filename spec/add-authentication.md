# Specification Template

> Ingest the information from this file, implement the Low-Level Tasks, and generate the code that will satisfy the High and Mid-Level Objectives.

## High-Level Objective

- Add authentication to the application on the bookmarks insertion endpoint.

## Mid-Level Objective

- Add a new table to store active token IDs
- Add a new authenticated endpoint to create a new token, that returns the created token
- Update the bookmarks insertion endpoints to require a valid token

## Implementation Notes

- Use JWT tokens with a JTI (JWT ID) claim to identify the token
- Store JTIs in a new active_tokens table, along with a name provided at creation time
- Read the token from the Authorization header as a Bearer token

## Context

### Beginning context

- src/database.ts
- src/server.ts
- src/server.test.ts
- src/config.ts
- src/types.ts
- package.json (read-only)

- https://github.com/auth0/node-jsonwebtoken#readme

### Ending context

- src/database.ts
- src/server.ts
- src/server.test.ts
- src/config.ts
- src/types.ts
- src/authentication.ts (new file)

## Low-Level Tasks

> Ordered from start to finish

1. Create src/authentication.ts

```aider
UPDATE src/config.ts:
  ADD jwtSecret: string.
UPDATE src/types.ts:
  ADD ActiveToken = {jti: string, name: string}.
UPDATE src/database.ts:
  UPDATE getDb() ADD active_tokens table with jti PRIMARY KEY and name TEXT,
  CREATE function insertActiveToken(activeToken: ActiveToken): void
  CREATE function isActiveToken(jti: string): boolean.
  CREATE function deleteActiveToken(jti: string): void
CREATE src/authentication.ts:
  CREATE function createToken(name: string): {payload: ActiveToken, token: string} USE jwtSecret no expiration date and set a JTI claim,
  CREATE function readToken(token: string): ActiveToken USE jwtSecret,
  CREATE function validateToken(token: string): boolean USE jwtSecret and isActiveToken.
```

2. Create an endpoint to create a new token

```aider
UPDATE src/server.ts:
  ADD POST /tokens endpoint with body {name: string} and return {token: string},
  UPDATE POST /bookmarks and POST /bookmarks/batch:
    CALL validateToken with the content of the Bearer token,
    RETURN 401 if not valid.
  ADD DELETE /tokens/:jti endpoint to delete a token.
UPDATE src/server.test.ts:
  ADD test for POST /tokens,
  ADD test for DELETE /tokens/:jti.
  ADD test for unauthorized POST /bookmarks,
  ADD test for unauthorized POST /bookmarks/batch,
  UPDATE test for POST /bookmarks and POST /bookmarks/batch to use a valid token.
```
