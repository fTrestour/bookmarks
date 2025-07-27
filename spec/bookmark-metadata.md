# Specification Template

> Ingest the information from this file, implement the Low-Level Tasks, and generate the code that will satisfy the High and Mid-Level Objectives.

## High-Level Objective

- Extract title and author from the bookmark's content

## Mid-Level Objective

- After extracting the page content, use it to extract the title and author

## Implementation Notes

- Use `ai`'s `generateObject` function
- Update the Bookmark type
- Update the bookmark db table to include the title and author

## Context

### Beginning context

- src/types.ts
- src/database.ts
- src/ai/scrapper.ts
- src/domains/bookmarks.ts
- src/server.test.ts
- https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-object#generateobject

### Ending context

- src/types.ts
- src/database.ts
- src/ai/scrapper.ts
- src/domains/bookmarks.ts
- src/server.test.ts

## Low-Level Tasks

> Ordered from start to finish

1. Update the bookmark database table to include the title and author

```aider
UPDATE getDb:
  ADD title TEXT, author TEXT to the bookmarks table
```

2. Create metadata extraction function

```aider
UPDATE src/types.ts:
  ADD title, author to bookmarkSchema.
UPDATE src/ai/scrapper.ts:
  CREATE getPageMetadata(content: string): Promise<{ title: string; author: string }> USE `generateObject`.
UPDATE src/domains/bookmarks.ts:
  UPDATE getBookmarkDataFromUrl to use getPageMetadata, parallelize async calls.
UPDATE src/server.test.ts to include the new new fields in the test data.
```
