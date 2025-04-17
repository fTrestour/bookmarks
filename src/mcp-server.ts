import { Router, type Request, type Response } from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import type { BookmarksService } from "./services/bookmarks";
import type { TagsService } from "./services/tags";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export const createMcp = ({ bookmarksService, tagsService }: { bookmarksService: BookmarksService, tagsService: TagsService }) => {
    const mcp = Router();

    const mcpServer = new McpServer({
        name: "bookmarks-server",
        version: "1.0.0"
    });

    mcpServer.tool(
        "list-bookmarks",
        {},
        async () => {
            const bookmarks = await bookmarksService.listBookmarks();
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(bookmarks, null, 2)
                }]
            };
        }
    );
    mcpServer.tool(
        "search-bookmarks",
        {
            query: z.string().describe("Search query to find relevant bookmarks"),
            limit: z.number().optional().describe("Maximum number of results to return (default: 10)")
        },
        async ({ query, limit }) => {
            const bookmarks = await bookmarksService.searchBookmarks(query, limit);
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(bookmarks, null, 2)
                }]
            };
        }
    );
    mcpServer.tool(
        "list-tags",
        {},
        async () => {
            const tags = await tagsService.listTags();
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(tags, null, 2)
                }]
            };
        }
    );

    const transports: { [sessionId: string]: SSEServerTransport } = {};

    mcp.get("/sse", async (req: Request, res: Response) => {
        const transport = new SSEServerTransport('/messages', res);
        transports[transport.sessionId] = transport;
        res.on("close", () => {
            delete transports[transport.sessionId];
        });

        // FIXME: This is never resolving and never answers the client
        await mcpServer.connect(transport);
    });

    mcp.post("/messages", async (req: Request, res: Response) => {
        const sessionId = req.query.sessionId as string;

        const transport = transports[sessionId];
        if (transport) {
            await transport.handlePostMessage(req, res);
        } else {
            res.status(400).send('No transport found for sessionId');
        }
    });

    return mcp;
};

