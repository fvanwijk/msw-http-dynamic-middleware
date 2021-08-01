const { rest } = require('msw');
const { createServer } = require('@mswjs/http-middleware');
const { createHandlers } = require('msw-dynamic-http-middleware');
const pino = require('pino');

const logger = pino({
  prettyPrint: {
    translateTime: true,
    ignore: 'pid,hostname',
  },
});

const scenarios = {
  // Scenarios for one endpoint
  'user success': rest.get('/user', (req, res, ctx) => res(ctx.json({ name: 'frank' }))),
  'user error': rest.get('/user', (req, res, ctx) => res(ctx.status(500))),
  'users success': rest.get('/users', (req, res, ctx) => res(ctx.json([{ name: 'frank' }]))),
  'users error': rest.get('/users', (req, res, ctx) => res(ctx.status(500))),

  // Scenarios for multiple endpoints
  success: [
    rest.get('/user', (req, res, ctx) => res(ctx.json({ name: 'frank' }))),
    rest.get('/users', (req, res, ctx) => res(ctx.json([{ name: 'frank' }]))),
  ],
  error: [
    rest.get('/user', (req, res, ctx) => res(ctx.status(500))),
    rest.get('/users', (req, res, ctx) => res(ctx.status(500))),
  ],
};

const port = 9800;
const server = createServer(...createHandlers(scenarios, 'success'));
server.listen(port, () => logger.info(`MSW server running at http://localhost:${port}`));
