import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { BookmarksService } from "./bookmarks";
import { BookmarkRepository } from "../data/repository";
import { setupTestDb, teardownTestDb } from "../tests/utils";

describe("BookmarksService", () => {
  let service: BookmarksService;
  let repository: BookmarkRepository;
  let dbUrl: string;

  beforeEach(async () => {
    const { db, url } = await setupTestDb();
    dbUrl = url;
    repository = new BookmarkRepository(db);
    service = new BookmarksService(repository);
  });

  afterEach(async () => {
    await teardownTestDb(dbUrl);
  });

  describe("createBookmark", () => {
    test("should create a bookmark with all fields", async () => {
      const bookmark = await service.createBookmark(
        "Test Bookmark",
        "http://test.com",
        "A test bookmark about programming",
        ["test", "programming"],
        "test-source-1"
      );

      expect(bookmark).toMatchObject({
        title: "Test Bookmark",
        url: "http://test.com",
        description: "A test bookmark about programming",
        tags: ["test", "programming"],
        source_id: "test-source-1",
      });
      expect(bookmark.id).toBeDefined();
      expect(bookmark.created_at).toBeInstanceOf(Date);
      expect(bookmark.updated_at).toBeInstanceOf(Date);
      expect(Array.isArray(bookmark.vector)).toBe(true);
      expect(bookmark.vector.length).toBeGreaterThan(0);

      // Verify the bookmark was saved
      const saved = await repository.findById(bookmark.id);
      expect(saved).toMatchObject({
        title: bookmark.title,
        url: bookmark.url,
        description: bookmark.description,
        tags: bookmark.tags,
        id: bookmark.id,
        source_id: bookmark.source_id,
      });
    });
  });

  describe("listBookmarks", () => {
    test("should return all bookmarks in creation order", async () => {
      // Create test bookmarks
      const first = await service.createBookmark(
        "First Bookmark",
        "http://first.com",
        "First bookmark",
        ["test"],
        "test-source-1"
      );

      const second = await service.createBookmark(
        "Second Bookmark",
        "http://second.com",
        "Second bookmark",
        ["test"],
        "test-source-2"
      );

      const result = await service.listBookmarks();

      expect(result).toHaveLength(2);
      expect(result[0].url).toBe(second.url); // Most recent first
      expect(result[1].url).toBe(first.url);
    });
  });

  describe("searchBookmarks", () => {
    test("should find bookmarks by semantic similarity", async () => {
      // Create test bookmarks with very different topics
      const programming = await service.createBookmark(
        "Programming Book",
        "http://programming.com",
        "A comprehensive guide to TypeScript development, covering advanced topics in web programming",
        ["programming"],
        "test-source-3"
      );

      const cooking = await service.createBookmark(
        "Cooking Book",
        "http://cooking.com",
        "A complete guide to Italian cuisine, with recipes for pasta, pizza, and traditional dishes",
        ["cooking"],
        "test-source-4"
      );

      const result = await service.searchBookmarks("TypeScript development");

      // The programming book should be first and have high similarity
      expect(result[0]).toMatchObject({
        url: programming.url,
        title: "Programming Book",
      });

      // The cooking book should be much less similar
      if (result.length > 1) {
        expect(result[1].url).toBe(cooking.url);
      }
    });

    test("should respect the limit parameter", async () => {
      // Create multiple bookmarks
      await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          service.createBookmark(
            `Bookmark ${i}`,
            `http://bookmark${i}.com`,
            `Description ${i}`,
            ["test"],
            `test-source-${i}`
          )
        )
      );

      const result = await service.searchBookmarks("test", 1);

      expect(result).toHaveLength(1);
    });
  });
});
