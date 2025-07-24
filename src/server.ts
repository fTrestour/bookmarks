import fastify from 'fastify';

export const server = fastify({ logger: true });

// Add a root route that returns a wave emoji
server.get('/', async (request, reply) => {
  return '👋';
});

// Start the server
const start = async () => {
  try {
    await server.listen({ port: 3000 });
    console.log('Server listening on http://localhost:3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
