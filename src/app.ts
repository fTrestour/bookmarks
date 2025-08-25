import { getConfig } from "./config.ts";
import { api } from "./api.ts";
import { getDb } from "./data/database.ts";

const start = async () => {
  try {
    const { port, host, env, dbUri } = getConfig();

    await api.listen({ port, host });
    api.log.info(`Server is running on http://${host}:${port} in ${env} mode`);

    const dbResult = await getDb();
    if (dbResult.isErr()) {
      api.log.error(dbResult.error);
      process.exit(1);
    }
    api.log.info(`Connected to database at ${dbUri}`);
  } catch (err) {
    api.log.error(err);
    process.exit(1);
  }
};

await start();
