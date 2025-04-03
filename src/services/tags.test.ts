import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { TagsService } from "./tags";
import { BookmarksService } from "./bookmarks";
import { BookmarkRepository } from "../data/repository";
import { setupTestDb, teardownTestDb } from "../tests/utils";

describe("TagsService", () => {
  let tagsService: TagsService;
  let bookmarksService: BookmarksService;
  let repository: BookmarkRepository;
  let dbUrl: string;

  beforeEach(async () => {
    const { db, url } = await setupTestDb();
    dbUrl = url;
    repository = new BookmarkRepository(db);
    tagsService = new TagsService(repository);
    bookmarksService = new BookmarksService(repository);
  });

  afterEach(async () => {
    await teardownTestDb(dbUrl);
  });

  describe("listTags", () => {
    test("should return all tags with their counts", async () => {
      // Create bookmarks with different tags
      await bookmarksService.createBookmark(
        "Programming Book",
        "http://programming.com",
        "A book about programming",
        ["programming", "typescript"]
      );

      await bookmarksService.createBookmark(
        "Another Programming Book",
        "http://programming2.com",
        "Another book about programming",
        ["programming", "javascript"]
      );

      await bookmarksService.createBookmark(
        "Cooking Book",
        "http://cooking.com",
        "A book about cooking",
        ["cooking"]
      );

      const tags = await tagsService.listTags();

      // Sort tags by count (desc) then name (asc) for deterministic comparison
      const sortedTags = tags.sort((a, b) => {
        if (a.count !== b.count) {
          return b.count - a.count;
        }
        return a.tag.localeCompare(b.tag);
      });

      expect(sortedTags).toEqual([
        { tag: "programming", count: 2 },
        { tag: "cooking", count: 1 },
        { tag: "javascript", count: 1 },
        { tag: "typescript", count: 1 },
      ]);
    });

    test("should return empty array when no bookmarks exist", async () => {
      const tags = await tagsService.listTags();
      expect(tags).toEqual([]);
    });
  });
});
