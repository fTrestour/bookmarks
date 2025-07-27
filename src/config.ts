import { config } from "dotenv";
import { z } from "zod";

config();

const configSchema = z.object({
  port: z.number({ coerce: true }).int().positive(),
  host: z.string().min(1),
  env: z.enum(["development", "production", "test"]),
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
  const configData = {
    port: process.env.PORT,
    host: process.env.HOST,
    env: process.env.NODE_ENV,
    dbUri: process.env.DATABASE_URL,
    scrapingAiModel: process.env.SCRAPING_AI_MODEL,
    embeddingModel: process.env.AI_EMBEDDING_MODEL,
    jwtSecret: process.env.JWT_SECRET,
  };

  let parsedConfig = configSchema.partial().parse(configData);

  if (parsedConfig.env !== "production") {
    parsedConfig = { ...parsedConfig, ...defaultConfig };
  }

  return configSchema.parse(parsedConfig);
}
