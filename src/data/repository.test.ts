import { expect, test, beforeAll, afterAll } from "bun:test";
import { setupTestDb, teardownTestDb } from "../__tests__/utils";
import { BookmarkRepository } from "./repository";
import type { Bookmark } from "./types";

const testBookmark: Bookmark = {
  id: "test-1",
  title: "Test Bookmark",
  url: "https://example.com",
  description: "A test bookmark",
  tags: ["test", "example"],
  vector: new Uint8Array([1, 2, 3, 4, 5]),
  created_at: new Date(),
  updated_at: new Date(),
};

let repository: BookmarkRepository;
let dbUrl: string;

beforeAll(async () => {
  const { db, url } = await setupTestDb();
  repository = new BookmarkRepository(db);
  dbUrl = url;
});

afterAll(async () => {
  await teardownTestDb(dbUrl);
});

test("create bookmark", async () => {
  await repository.create(testBookmark);
  const bookmark = await repository.findById(testBookmark.id);
  expect(bookmark).toBeDefined();
  expect(bookmark?.id).toBe(testBookmark.id);
  expect(bookmark?.title).toBe(testBookmark.title);
  expect(bookmark?.url).toBe(testBookmark.url);
  expect(bookmark?.description).toBe(testBookmark.description);
  expect(bookmark?.tags).toEqual(testBookmark.tags);
  expect(bookmark?.vector).toEqual(testBookmark.vector);
});

test("find bookmark by id", async () => {
  const bookmark = await repository.findById(testBookmark.id);
  expect(bookmark).toBeDefined();
  expect(bookmark?.id).toBe(testBookmark.id);
});

test("find all bookmarks", async () => {
  const bookmarks = await repository.findAll();
  expect(bookmarks).toHaveLength(1);
  expect(bookmarks[0].id).toBe(testBookmark.id);
});

test("search by vector similarity", async () => {
  const searchVector = new Uint8Array([1, 2, 3, 4, 5]);
  const results = await repository.searchByVector(searchVector);
  expect(results).toHaveLength(1);
  expect(results[0].id).toBe(testBookmark.id);
});

test("get all tags", async () => {
  const tags = await repository.getAllTags();
  expect(tags).toHaveLength(2);
  expect(tags).toEqual(
    expect.arrayContaining([
      { tag: "test", count: 1 },
      { tag: "example", count: 1 },
    ])
  );
});
