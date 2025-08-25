import { getConfig } from "./config.ts";
import { api } from "./api.ts";
import { getDb } from "./data/database.ts";

const start = async () => {
  try {
    const { port, host, env, dbUri } = getConfig();

    await getDb();
    api.log.info(`Connected to database at ${dbUri}`);

    await api.listen({ port, host });
    api.log.info(`Server is running on http://${host}:${port} in ${env} mode`);
  } catch (err) {
    api.log.error(err);
    process.exit(1);
  }
};

await start();
