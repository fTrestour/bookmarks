import fastify from 'fastify';
import { getConfig } from './config';

export const server = fastify({ logger: true });

// Add a root route that returns a wave emoji
server.get('/', async (request, reply) => {
  return '👋';
});

// Start the server
const start = async () => {
  try {
    const { port, baseUrl } = getConfig();
    await server.listen({ port });
    console.log(`Server listening on http://${baseUrl}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
