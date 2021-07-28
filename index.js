import { createServer } from '@mswjs/http-middleware'
import { createHandlers } from './handlers.js'

const scenarios = {
  'user': (req, res, ctx) => res(ctx.json({ name: 'frank' }))
}
  
const endpoints = [
  ['GET', '/user'],
  ['GET', '/users']
];

const handlers = createHandlers(endpoints, scenarios);

const httpServer = createServer(...handlers)

httpServer.listen(9090)