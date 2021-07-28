import { rest } from 'msw';
import { createServer } from '@mswjs/http-middleware';
import { createHandlers } from './index.js';

const scenarios = {
  // Scenarios for one endpoint
  'user success': rest.get('/user', (req, res, ctx) => res(ctx.json({ name: 'frank' }))),
  'user error': rest.get('/user', (req, res, ctx) => res(ctx.status(500))),
  'users success': rest.get('/users', (req, res, ctx) => res(ctx.json([{ name: 'frank' }]))),
  'users error': rest.get('/users', (req, res, ctx) => res(ctx.status(500))),

  // Scenarios for multiple endpoints
  'success': [rest.get('/user', (req, res, ctx) => res(ctx.json({ name: 'frank' }))), rest.get('/users', (req, res, ctx) => res(ctx.json([{ name: 'frank' }])))],
  'error': [rest.get('/user', (req, res, ctx) => res(ctx.status(500))), rest.get('/users', (req, res, ctx) => res(ctx.status(500)))],
};

const handlers = createHandlers(scenarios);

const httpServer = createServer(...handlers);

httpServer.listen(9090);
