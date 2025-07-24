import fastify from "fastify";
import { getConfig } from "./config.ts";
import { getAllBookmarks } from "./database";

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

// Start the server
const start = async () => {
  try {
    const { port, baseUrl } = getConfig();
    await server.listen({ port });
    console.log(`Server listening on http://${baseUrl}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

await start();
