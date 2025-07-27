import { config } from "dotenv";

config();

export function getConfig(): {
  port: number;
  host: string;
  env: string;
  dbUri: string;
  scrapingAiModel: string;
  embeddingModel: string;
} {
  const port = parseInt(process.env.PORT ?? "3000");
  const host = process.env.HOST ?? "localhost";
  const env = process.env.NODE_ENV ?? "development";
  const dbUri = process.env.DATABASE_URL ?? "file:sqlite/db.sqlite";
  const scrapingAiModel = process.env.SCRAPING_AI_MODEL ?? "gpt-4.1-mini";
  const embeddingModel =
    process.env.AI_EMBEDDING_MODEL ?? "text-embedding-3-small";

  return {
    port,
    host,
    env,
    dbUri,
    scrapingAiModel,
    embeddingModel,
  };
}
