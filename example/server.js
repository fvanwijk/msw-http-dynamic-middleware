const express = require('express');
const { rest } = require('msw');
const { createMiddleware } = require('@mswjs/http-middleware');
const { createHandlers, middleware } = require('msw-dynamic-http-middleware');
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

const handlers = createHandlers(scenarios, 'success');

const app = express();

app.use(express.json());
app.use(createMiddleware(...handlers));
app.use('/ui', middleware);

const port = 9800;
app.listen(port, () => logger.info(`MSW server running at http://localhost:${port}`));
