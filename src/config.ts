import { z } from "zod";

const configSchema = z.object({
  port: z.number({ coerce: true }).int().positive(),
  host: z.string().min(1),
  env: z.enum(["development", "production", "test"]),
  dbUri: z.string().min(1),
  dbAuthToken: z.string().min(1).optional(),
  openaiApiKey: z.string().min(1),
  scrapingAiModel: z.string().min(1),
  embeddingModel: z.string().min(1),
  jwtSecret: z.string().min(1),
  corsAllowOrigin: z.string().optional(),
  limit: z.number({ coerce: true }).int().positive(),
});

const defaultConfig = {
  port: 3000,
  host: "localhost",
  env: "development",
  dbUri: "file:sqlite/db.sqlite",
  dbAuthToken: undefined,
  openaiApiKey: "dummy",
  scrapingAiModel: "gpt-4.1-mini",
  embeddingModel: "text-embedding-3-small",
  jwtSecret: "dev_secret",
  corsAllowOrigin: "*",
  limit: 10,
} as const;

export function getConfig(): z.infer<typeof configSchema> {
  const configData = {
    port: process.env.PORT,
    host: process.env.HOST,
    env: process.env.NODE_ENV,
    dbUri: process.env.DB_URL,
    dbAuthToken: process.env.DB_AUTH_TOKEN,
    openaiApiKey: process.env.OPENAI_API_KEY,
    scrapingAiModel: process.env.SCRAPING_AI_MODEL,
    embeddingModel: process.env.AI_EMBEDDING_MODEL,
    jwtSecret: process.env.JWT_SECRET,
    corsAllowOrigin: process.env.CORS_ALLOW_ORIGIN,
    limit: process.env.LIMIT,
  };

  let parsedConfig = configSchema.partial().parse(configData);

  if (parsedConfig.env !== "production") {
    parsedConfig = {
      port: parsedConfig.port ?? defaultConfig.port,
      host: parsedConfig.host ?? defaultConfig.host,
      env: parsedConfig.env ?? defaultConfig.env,
      dbUri: parsedConfig.dbUri ?? defaultConfig.dbUri,
      dbAuthToken: parsedConfig.dbAuthToken ?? defaultConfig.dbAuthToken,
      openaiApiKey: parsedConfig.openaiApiKey ?? defaultConfig.openaiApiKey,
      scrapingAiModel:
        parsedConfig.scrapingAiModel ?? defaultConfig.scrapingAiModel,
      embeddingModel:
        parsedConfig.embeddingModel ?? defaultConfig.embeddingModel,
      jwtSecret: parsedConfig.jwtSecret ?? defaultConfig.jwtSecret,
      corsAllowOrigin:
        parsedConfig.corsAllowOrigin ?? defaultConfig.corsAllowOrigin,
      limit: parsedConfig.limit ?? defaultConfig.limit,
    };
  }

  return configSchema.parse(parsedConfig);
}
