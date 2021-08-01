<h1 align="center">MSW dynamic HTTP middleware</h1>

<p align="center">Create dynamic handlers for MSW HTTP middleware</p>

## Features

For rapid prototyping or local web application development, you probably want to mock API calls, so that you don't need a running API server.

This can be done using [MSW](http://mswjs.io) running inside the app using a service worker or by running a [separate MSW server](https://github.com/mswjs/http-middleware) to which you proxy API calls.

Both solutions use static mock handlers. The responses are fixed and cannot be changed during runtime of the app or mock server.
But how do you quickly test client side error handling when your API always returns success responses? This is not possible without code changes.

Changing handlers on runtime is also essential when you use a mock server in end-to-end testing, for example in Cypress.

This package is an extension on top of `@mswjs/http-middleware` that adds extra endpoints to change the mock handlers based on scenarios **at runtime**.

The following endpoints are available:

| Endpoint | When to use
| ---
| GET /scenario | Get all loaded scenarios and activated handlers
| PUT /scenario | Activate a scenario
| DELETE /scenario | Reset mock server to initial state, optionally with `?resetAll=true` to also deactive default scenario handlers

There is also a UI provided that can be statically hosted on for example `/ui`, so that you can set scenarios from the browser instead of using `curl` / Postman. Note that GraphQL is not supported (yet).

## How to use

First install this package and `@msw/http-middleware` as devDependency in your project:

```

npm install -D msw-dynamic-http-middleware @msw/http-middleware

```

_In the [example](./example) directory you find an example server. Run `npm install` in this dir and then `npm start` to run the server on http://localhost:9800._

Basically this is everything you need in your application for a dynamic MSW server:

```javascript
// server.js
const express = require('express');
const { rest } = require('msw');
const { createMiddleware } = require('@mswjs/http-middleware');
const { createHandlers, middleware } = require('msw-dynamic-http-middleware');

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
app.use('/ui', middleware); // Run the UI on /ui. Can be any path, but don't use /scenario or one of your scenario endpoints

const port = 9800;
app.listen(port, () => console.info(`MSW server running at http://localhost:${port}`));
```

Run the server with `node server.js`.

Then navigate to http://localhost:9800/ui or set scenarios by calling the endpoint:

```
PUT /scenario
{
  "scenario": "user success"
}
```

You need scenarios because MSW handlers are not (easily) serializable and a scenario name is.

Check the docs for your favorite client framework on how to proxy API calls to this web server
Here are some examples.

Vue CLI:

```javascript
// vue.config.js
export default {
  devServer: {
    proxy: {
      '^/api': 'http://localhost:9800',
    },
  },
};
```

ViteJS:

```javascript
// vite.config.js
export default {
  server: {
    proxy: {
      '^/api': 'http://localhost:9800',
    },
  },
};
```

Create React App:

```json
// package.json
"proxy": "http://localhost:4000",
```

Angular CLI:

```javascript
// src/proxy.conf.js
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false
  }
}

// angular.json
...
"architect": {
  "serve": {
    "builder": "@angular-devkit/build-angular:dev-server",
    "options": {
      "browserTarget": "your-application-name:build",
      "proxyConfig": "src/proxy.conf.json"
    },
...
```

### Clearing handlers

Endpoints that don't have a handler assigned (yet), for example when the server starts, return a default response, which is currently an empty body with status 200.
However, you could pass a default scenario name to `createHandlers` to start the server with an initial set of handlers. For example create a scenario 'success' with success responses for all your endpoints to start the server with a "happy flow" set up.

Besides setting scenarios on runtime using the `PUT /scenarios` endpoint, you could also reset state to the default handler using the `DELETE /scenarios` endpoint. If the handlers were created with a default scenario, the server resets to this default scenario, unless you pass `?resetAll=true` query parameter.

Endpoints that do not exist because there are no scenarios defined for this endpoint, do return the default response from `@mswjs/http-middelware`, which is `{ "error": "Mock not found" }` with status 404.

## Does this package work with MSW only?

This package builds upon `@mswjs/http-middleware` but if you want to set predefined scenarios for vanilla MSW handlers, consider using [MSW UI](https://github.com/fvanwijk/msw-ui).

The functionality in this package is loosely based on [ng-apimock](https://github.com/mdasberg/ng-apimock) but that project is pretty old and not maintained anymore. It is also less flexible because it depends on scenarios that are defined in JSON files.
