import { rest } from 'msw';
import { createServer } from '@mswjs/http-middleware';
import { createHandlers } from './index.js';

const scenarios = {
  'user success': rest.get('/user', (req, res, ctx) => res(ctx.json({ name: 'frank' }))),
};

const handlers = createHandlers(scenarios);

const httpServer = createServer(...handlers);

httpServer.listen(9090);
