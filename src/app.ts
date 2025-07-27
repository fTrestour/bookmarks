import { getConfig } from "./config.ts";
import { server } from "./server.ts";

const start = async () => {
  try {
    const { port, host } = getConfig();
    await server.listen({ port, host });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

await start();
