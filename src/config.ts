export function getConfig(): { port: number; baseUrl: string; env: string } {
  const port = Number(process.env.PORT) || 3000;
  const baseUrl = process.env.BASE_URL || 'localhost';
  const env = process.env.NODE_ENV || 'development';

  return { port, baseUrl, env };
}
