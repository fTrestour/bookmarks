import { config } from "dotenv";
import { z } from "zod";

config();

const configSchema = z.object({
  port: z.number().int().positive(),
  host: z.string().min(1),
  env: z.string().min(1),
  dbUri: z.string().min(1),
  scrapingAiModel: z.string().min(1),
  embeddingModel: z.string().min(1),
  jwtSecret: z.string().min(1),
});

const defaultConfig = {
  port: 3000,
  host: "localhost",
  env: "development",
  dbUri: "file:sqlite/db.sqlite",
  scrapingAiModel: "gpt-4.1-mini",
  embeddingModel: "text-embedding-3-small",
  jwtSecret: "dev_secret",
} as const;

export function getConfig(): z.infer<typeof configSchema> {
  const rawPort = process.env.PORT;
  const port = Number.isInteger(Number(rawPort)) ? Number(rawPort) : defaultConfig.port;

  const configData = {
    port,
    host: process.env.HOST ?? defaultConfig.host,
    env: process.env.NODE_ENV ?? defaultConfig.env,
    dbUri: process.env.DATABASE_URL ?? defaultConfig.dbUri,
    scrapingAiModel: process.env.SCRAPING_AI_MODEL ?? defaultConfig.scrapingAiModel,
    embeddingModel: process.env.AI_EMBEDDING_MODEL ?? defaultConfig.embeddingModel,
    jwtSecret: process.env.JWT_SECRET ?? defaultConfig.jwtSecret,
  };

  return configSchema.parse(configData);
}
