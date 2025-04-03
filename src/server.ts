import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import { initDb } from "./data/db";
import { BookmarkRepository } from "./data/repository";
import { BookmarksService } from "./services/bookmarks";
import { TagsService } from "./services/tags";
import { rateLimit } from "express-rate-limit";
import cron from "node-cron";
import { PocketService } from "./third-parties/pocket";
import logger from "./logger";

const app = express();
app.use(cors());
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  logger.http(`${req.method} ${req.url}`);
  next();
});

if (process.env.RATE_LIMIT_WINDOW_MS || process.env.RATE_LIMIT_MAX_REQUESTS) {
  if (!process.env.RATE_LIMIT_WINDOW_MS) {
    throw new Error("RATE_LIMIT_WINDOW_MS is not set");
  }

  if (!process.env.RATE_LIMIT_MAX_REQUESTS) {
    throw new Error("RATE_LIMIT_MAX_REQUESTS is not set");
  }

  const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10);

  const rateLimitMaxRequests = parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS,
    10
  );

  const limiter = rateLimit({
    windowMs: rateLimitWindowMs,
    max: rateLimitMaxRequests,
  });
  app.use(limiter);
} else {
  logger.warn(
    "Rate limiting is not enabled, set RATE_LIMIT_WINDOW_MS and RATE_LIMIT_MAX_REQUESTS to enable"
  );
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}
const db = await initDb(process.env.DATABASE_URL);
const repository = new BookmarkRepository(db);
const bookmarksService = new BookmarksService(repository);
const tagsService = new TagsService(repository);

// Setup Pocket sync if credentials are provided
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

const api = express.Router();

api.get("/bookmarks", async (req: Request, res: Response) => {
  try {
    const { search, limit } = req.query;

    if (search) {
      if (typeof search !== "string") {
        logger.warn("Invalid search parameter type received");
        res
          .status(400)
          .json({ error: "Query parameter 'search' must be a string" });
        return;
      }

      const searchLimit = limit ? parseInt(limit as string, 10) : 10;
      const bookmarks = await bookmarksService.searchBookmarks(
        search,
        searchLimit
      );
      res.json(bookmarks);
      return;
    }

    const bookmarks = await bookmarksService.listBookmarks();
    res.json(bookmarks);
  } catch (error) {
    logger.error("Error handling bookmarks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

api.get("/tags", async (req: Request, res: Response) => {
  try {
    const tags = await tagsService.listTags();
    res.json(tags);
  } catch (error) {
    logger.error("Error listing tags:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use("/api", api);

// Error handling middleware
api.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

if (!process.env.PORT) {
  throw new Error("PORT is not set");
}
const port = parseInt(process.env.PORT, 10);

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
