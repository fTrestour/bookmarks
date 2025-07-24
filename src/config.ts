export function getConfig(): { port: number; baseUrl: string } {
  const port = Number(process.env.PORT) || 3000;
  const baseUrl = process.env.BASE_URL || 'localhost';

  return { port, baseUrl };
}
