import { getConfig } from "./config.ts";
import { server } from "./server.ts";

const start = async () => {
  try {
    const { port, host, env } = getConfig();
    await server.listen({ port, host });
    server.log.info(
      `Server is running on http://${host}:${port} in ${env} mode`,
    );
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

await start();
