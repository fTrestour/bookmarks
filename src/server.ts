import fastify from "fastify";
import { getAllBookmarks, insertBookmarks } from "./database.ts";
import { parse } from "./types.ts";
import { z } from "zod";
import { getBookmarkDataFromUrl } from "../domains/bookmarks.ts";

export const server = fastify({ logger: true });

// Add a root route that returns a wave emoji
server.get("/", () => {
  return "👋";
});

// Add a bookmarks route that returns all bookmarks
server.get("/bookmarks", async () => {
  const bookmarks = await getAllBookmarks();
  return bookmarks;
});

// Add a POST route to insert bookmarks
server.post("/bookmarks", async (request) => {
  const bodySchema = z.object({
    url: z.string(),
  });
  const body = parse(bodySchema, request.body);
  const bookmark = await getBookmarkDataFromUrl(body.url);
  await insertBookmarks([bookmark]);
  return { success: true };
});

// Add a POST route to insert multiple bookmarks
server.post("/bookmarks/batch", async (request) => {
  const bodySchema = z.object({
    url: z.string(),
  });
  const batchBodySchema = z.array(bodySchema);
  const body = parse(batchBodySchema, request.body);
  const bookmarks = [];
  for (const item of body) {
    const bookmark = await getBookmarkDataFromUrl(item.url);
    bookmarks.push(bookmark);
  }
  await insertBookmarks(bookmarks);
  return { success: true };
});
