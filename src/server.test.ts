import { describe, it, expect } from 'vitest';
import { server } from './server';

describe('api', () => {
  it('accepts calls on /', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/'
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('👋');
  });
});
