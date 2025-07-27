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

export function getConfig(): {
  port: number;
  host: string;
  env: string;
  dbUri: string;
  scrapingAiModel: string;
  embeddingModel: string;
  jwtSecret: string;
} {
  const rawPort = process.env.PORT;
  const port = Number.isInteger(Number(rawPort)) ? Number(rawPort) : 3000;

  const host = process.env.HOST ?? "localhost";
  const env = process.env.NODE_ENV ?? "development";
  const dbUri = process.env.DATABASE_URL ?? "file:sqlite/db.sqlite";
  const scrapingAiModel = process.env.SCRAPING_AI_MODEL ?? "gpt-4.1-mini";
  const embeddingModel =
    process.env.AI_EMBEDDING_MODEL ?? "text-embedding-3-small";
  const jwtSecret = process.env.JWT_SECRET ?? "dev_secret";

  const configData = {
    port,
    host,
    env,
    dbUri,
    scrapingAiModel,
    embeddingModel,
    jwtSecret,
  };

  return configSchema.parse(configData);
}
