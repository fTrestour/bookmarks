import fastify from 'fastify';

export const server = fastify({ logger: true });

// Add a root route that returns a wave emoji
server.get('/', async (request, reply) => {
  return '👋';
});

// Start the server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    const baseUrl = process.env.BASE_URL || 'localhost';
    await server.listen({ port });
    console.log(`Server listening on http://${baseUrl}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
