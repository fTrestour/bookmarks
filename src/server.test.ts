import { describe, it, expect } from 'vitest';
import fastify from 'fastify';

describe('api', () => {
  it('accepts calls on /', async () => {
    const server = fastify({ logger: false });

    server.get('/', async (request, reply) => {
      return '👋';
    });

    const response = await server.inject({
      method: 'GET',
      url: '/'
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('👋');
  });
});
