import { getConfig } from "./config.ts";
import { server } from "./server.ts";

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
