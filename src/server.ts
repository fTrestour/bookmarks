import express, { type NextFunction, type Request, type Response } from "express";
import cron from "node-cron";
import { createApi } from "./api";
import { initDb } from "./data/db";
import { BookmarkRepository } from "./data/repository";
import logger from "./logger";
import { BookmarksService } from "./services/bookmarks";
import { TagsService } from "./services/tags";
import { PocketService } from "./third-parties/pocket";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}
const db = await initDb(process.env.DATABASE_URL);
const repository = new BookmarkRepository(db);
const bookmarksService = new BookmarksService(repository);
const tagsService = new TagsService(repository);

if (!process.env.POCKET_CONSUMER_KEY) {
  throw new Error("POCKET_CONSUMER_KEY is not set");
}

if (!process.env.POCKET_ACCESS_TOKEN) {
  throw new Error("POCKET_ACCESS_TOKEN is not set");
}

const pocketService = new PocketService(
  bookmarksService,
  process.env.POCKET_CONSUMER_KEY,
  process.env.POCKET_ACCESS_TOKEN
);

if (!process.env.POCKET_SYNC_CRON) {
  throw new Error("POCKET_SYNC_CRON is not set");
}

const syncCron = process.env.POCKET_SYNC_CRON;

const sync = async () => {
  try {
    logger.info("Starting Pocket sync...");
    const created = await pocketService.syncFavorites();
    logger.info(`Pocket sync completed. Created ${created} bookmarks.`);
  } catch (error) {
    logger.error("Error during Pocket sync:", error);
  }
};
await sync();
cron.schedule(syncCron, sync);

logger.info(`Pocket sync scheduled with cron: ${syncCron}`);

if (!process.env.PORT) {
  throw new Error("PORT is not set");
}
const port = parseInt(process.env.PORT, 10);

const app = express();

app.use("/api", createApi({ bookmarksService, tagsService }));

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});
