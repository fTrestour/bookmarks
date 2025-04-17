
import cors from "cors";
import express, {
    Router,
    type NextFunction,
    type Request,
    type Response,
} from "express";
import logger from "./logger";
import type { BookmarksService } from "./services/bookmarks";
import type { TagsService } from "./services/tags";


export const createApi = ({ bookmarksService, tagsService }: { bookmarksService: BookmarksService, tagsService: TagsService }) => {
    const api = Router();

    api.use(cors());
    api.use(express.json());

    api.use((req: Request, res: Response, next: NextFunction) => {
        logger.http(`${req.method} ${req.url}`);
        next();
    });

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


    return api;
};
