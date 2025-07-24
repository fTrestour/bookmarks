export function getConfig(): { port: number; baseUrl: string; env: string; dbUri: string } {
  const port = Number(process.env.PORT) || 3000;
  const baseUrl = process.env.BASE_URL || 'localhost';
  const env = process.env.NODE_ENV || 'development';
  const dbUri = process.env.DATABASE_URL || 'mongodb://localhost:27017/myapp';

  return { port, baseUrl, env, dbUri };
}
