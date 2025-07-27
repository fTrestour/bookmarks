import { getConfig } from "./config.ts";
import { server } from "./server.ts";

const start = async () => {
  try {
    const { port, baseUrl } = getConfig();
    await server.listen({ port, host: baseUrl });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

await start();
