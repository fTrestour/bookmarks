# Specification Template

> Ingest the information from this file, implement the Low-Level Tasks, and generate the code that will satisfy the High and Mid-Level Objectives.

## High-Level Objective

- Add a small text presentation of the bookmark explaining how it fits the search query

## Mid-Level Objective

- Add a function `getBookmarkDescription(search: string, bookmark: Bookmark): string` that uses the `ai` library to generate a description of the bookmark explaining how it fits the search query.
- Add as `description` field to the bookmarks returned by the GET /bookmarks endpoint.

## Implementation Notes

- ADD a new `descriptionGenerationAiModel` to the config.ts file.
- CREATE `ai/description.ts` file.
  - CREATE `getDescription(search: string, content: string): string` function using the `ai` library with `descriptionGenerationAiModel`
- CREATE `searchBookmarks(search: string)` function that replaces the logic of the GET /bookmarks controller.
  - USE `getDescription` to generate the description of the search results
- UPDATE `api.test.ts` accordingly.

## Context

### Beginning context

- `src/config.ts`
- `src/api.ts`
- `src/api.test.ts`
- `src/domains/bookmarks.ts`

### Ending context

- `src/config.ts`
- `src/api.ts`
- `src/api.test.ts`
- `src/domains/bookmarks.ts`
- `src/ai/description.ts` (new file)
