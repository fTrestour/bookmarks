# Specification Template

> Ingest the information from this file, implement the Low-Level Tasks, and generate the code that will satisfy the High and Mid-Level Objectives.

## High-Level Objective

- Make it possible to search bookmarks by content.

## Mid-Level Objective

- `getBookmarkDataFromUrl` computes the embedding of the bookmark content.
- GET /bookmarks handles a query parameter `search` that is a string.
  - The search string is embedded
  - The database is queried for bookmarks which embedding are closer to the search embedding
  - The results are sorted by embedding similarity

## Implementation Notes

- Use the `ai` library with the `@ai-sdk/openai`
- Use the 'text-embedding-3-small' embedding model
- Use `vector_distance_cos` from the `@libsql/client` library to compute the similarity between the search embedding and the bookmark embedding
- Mock the embedding computation in `server.test.ts`
- Make the embedding model configurable in `config.ts`
- New features should be tested in `server.test.ts`

## Context

### Beginning context

- `src/domains/bookmarks.ts`
- `src/database.ts`
- `src/server.ts`
- `src/server.test.ts`
- `src/config.ts`
- `src/types.ts`
- `package.json` (read-only)
- https://ai-sdk.dev/docs/ai-sdk-core/embeddings#embeddings (web doc to for ai-sdk embeddings)
- https://docs.turso.tech/features/ai-and-embeddings#functions (web doc to for libsql embeddings functions)

### Ending context

- `src/domains/bookmarks.ts`
- `src/database.ts`
- `src/server.ts`
- `src/server.test.ts`
- `src/config.ts`
- `src/types.ts`
- `src/embeddings.ts` (new file)

## Low-Level Tasks

> Ordered from start to finish

1. Compute the embedding when inserting a bookmark

```aider
UPDATE `src/config.ts`:
  ADD `embeddingModel` VAR to store the embedding model name DEFAULT `text-embedding-3-small`.
CREATE `src/embeddings.ts`:
  CREATE embedBookmarkContent(content: string): Promise<number[]> using the `embeddingModel` from `config.ts`
UPDATE `getBookmarkDataFromUrl`:
  REPLACE [] with `embedBookmarkContent` call.
UPDATE `server.test.ts`:
  UPDATE "it creates a bookmark on POST /bookmarks" to check that the embedding is computed
  UPDATE "it creates multiple bookmarks on POST /bookmarks/batch" to check that the embedding is computed.
```

2. Accept a search query parameter in GET /bookmarks

```aider
UPDATE `getAllBookmarks`:
  ADD `searchEmbedding?: number[]` PARAM,
  USE `searchEmbedding` in the `sql` query with `vector_distance_cos` to compute cosine similarity between search and bookmark SORT ASC BY `vector_distance_cos`.
UPDATE `src/embeddings.ts`:
  ADD `embedSearchString` FUNCTION MIRROR `embedBookmarkContent`.
UPDATE `server.ts`:
  ADD `search` VAR defined as request.query.search if it exists.
  ADD `searchEmbedding` VAR defined as `embedSearchString` call if `search` exists.
  ADD `search` to the `getAllBookmarks` call.
UPDATE `server.test.ts`:
  UPDATE "it returns bookmarks on /bookmarks" to check that the search query parameter is handled.
```
