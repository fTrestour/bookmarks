export function getConfig(): {
  port: number;
  baseUrl: string;
  env: string;
  dbUri: string;
  scrappingAiModel: string;
} {
  const port = parseInt(process.env.PORT ?? "3000");
  const baseUrl = process.env.BASE_URL ?? "localhost";
  const env = process.env.NODE_ENV ?? "development";
  const dbUri = process.env.DATABASE_URL ?? "file:sqlite/db.sqlite";
  const scrappingAiModel = process.env.AI_MODEL ?? "gpt-4.1-mini";

  return { port, baseUrl, env, dbUri, scrappingAiModel };
}
