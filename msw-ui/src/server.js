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

const userSuccess = rest.get('/user', (req, res, ctx) => res(ctx.json({ name: 'frank' })));
const userError = rest.get('/user', (req, res, ctx) => res(ctx.status(500)));
const usersSuccess = rest.get('/users', (req, res, ctx) => res(ctx.json([{ name: 'frank' }])));
const usersError = rest.get('/users', (req, res, ctx) => res(ctx.status(500)));
const scenarios = {
  // Scenarios for one endpoint
  'user success': userSuccess,
  'user error': userError,
  'users success': usersSuccess,
  'users error': usersError,

  // Scenarios for multiple endpoints
  success: [userSuccess, usersSuccess],
  error: [userError, usersError],
};

const port = 9800;
const server = createServer(...createHandlers(scenarios, 'success'));
server.listen(port, () => logger.info(`MSW server running at http://localhost:${port}`));
