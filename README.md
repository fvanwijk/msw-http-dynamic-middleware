<h1 align="center">MSW dynamic HTTP middleware</h1>

<p align="center">Create dynamic handlers for MSW HTTP middleware</p>

# Features

[@mswjs/http-middleware](https://github.com/mswjs/http-middleware) is a solution to run MSW in a separate server to which you have to proxy the HTTP calls from your app.
The nature of MSW and also the http-middleware is that everything is configured in code, meaning that the mock handlers are hard coded.

This helper that uses http-middleware generates an extra endpoint `PUT /scenario` to apply a predefined scenario for a REST endpoint. Note that GraphQL is not supported yet.
For example when you want to set the scenario 'user success', just call this endpoint with in the body:

```json
{
  "scenario": "user success"
}
```

The success scenario is a predefined MSW handler.
You need scenarios because MSW handlers are not (easily) serializable and a scenario name is.

## Clearing handlers

Endpoints that don't have a handler assigned (yet), for example when the server starts, return a default response, which is currently an empty body with status 200.
However, you could pass a default scenario name to `createHandlers` to start the server with an initial set of handlers.

Besides setting scenarios on runtime using the `PUT /scenarios` endpoint, you could also reset state to the default handler using the `DELETE /scenarios` call. If the handlers were created with a default scenario, the default scenario is also set, unless you pass `?clearAll=true` query parameter.

Endpoints that do not exist because there are no scenarios defined for this endpoint, do return the default response from `@mswjs/http-middelware`, which is `{ "error": "Mock not found" }` with status 404.

## Does this package work with MSW only?

This package builds upon @mswjs/http-middleware but if you want to set predefined scenarios for vanilla MSW handlers, consider using [MSW UI](https://github.com/fvanwijk/msw-ui).

## Installation

First install this package and @msw/http-middleware as devDependency:

```
npm install -D msw-dynamic-http-middleware @msw/http-middleware
```

Set up http-middleware as described in their docs, but instead of importing handlers, you import a function from `msw-dynamic-http-middleware` to create handlers for you, based on the scenarios you provide.

```javascript
import { createServer } from '@mswjs/http-middleware';
import { createHandlers } from 'msw-dynamic-http-middleware';

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

const handlers = createHandlers(scenarios, 'success'); // Success scenario is set on initialization

const httpServer = createServer(...handlers);

httpServer.listen(9090);
```
