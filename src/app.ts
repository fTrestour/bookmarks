import { getConfig } from "./config.ts";
import { api } from "./api.ts";

const start = async () => {
  try {
    const { port, host, env } = getConfig();

    await api.listen({ port, host });
    api.log.info(`Server is running on http://${host}:${port} in ${env} mode`);
  } catch (err) {
    api.log.error(err);
    process.exit(1);
  }
};

await start();
