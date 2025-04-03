import { BookmarksService } from "../services/bookmarks";
import { PocketService } from "../third-parties/pocket";
import { initDb } from "../data/db";
import { BookmarkRepository } from "../data/repository";

const consumerKey = process.env.POCKET_CONSUMER_KEY;
if (!consumerKey) {
  throw new Error("POCKET_CONSUMER_KEY is not set");
}

const accessToken = process.env.POCKET_ACCESS_TOKEN;
if (!accessToken) {
  throw new Error("POCKET_ACCESS_TOKEN is not set");
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL is not set");
}

console.log("Initializing database...");
const db = await initDb(dbUrl);

const repository = new BookmarkRepository(db);
const bookmarkService = new BookmarksService(repository);
const pocketService = new PocketService(
  bookmarkService,
  consumerKey,
  accessToken
);

console.log("Starting Pocket sync...");
const created = await pocketService.syncFavorites();
console.log(`Sync completed successfully! Created ${created} bookmarks.`);
