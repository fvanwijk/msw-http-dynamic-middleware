import { rest } from 'msw'

const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const defaultHandler = (req, res, ctx) => res(ctx.status(200));
const activeHandlers = {};

const createError = (res, ctx, fieldName) => {
  return res(ctx.status(401), ctx.text(`Please provide a ${fieldName} in the request body. Example: { "method": "GET", "path": "/user", "scenario": "user" }`));
}

export const createHandlers = (endpoints, scenarios) => [
  ...endpoints.map(([method, endpoint]) => {
    if (!methods.includes(method)) {
      throw new Error(`Invalid input method ${method} provided. Valid methods: ${methods.join(', ')}`);
    }

    return rest[method.toLowerCase()](endpoint, (req, res, ctx) => {
      return activeHandlers[endpoint]?.GET(req, res, ctx) || defaultHandler(req, res, ctx)
    })
  }),

  // Set mock for any endpoint
  rest.put('/scenario', (req, res, ctx) => {
    const { method, path, scenario} = req.body;

    if (!method) {
      return createError(res, ctx, 'method')
    }
    if (!path) {
      return createError(res, ctx, 'path')
    }
    if (!scenario) {
      return createError(res, ctx, 'scenario');
    }

    if (!(path in activeHandlers)) {
      activeHandlers[path] = {};
    }

    activeHandlers[path][method] = scenarios[scenario];

    return res(ctx.status(205));
  })
]