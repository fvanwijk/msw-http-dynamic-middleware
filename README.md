# MSW dynamic HTTP middleware

@mswjs/http-middleware is a solution to run MSW in a separate server to which you have to proxy the HTTP calls from your app.
The nature of MSW and also the http-middleware is that everything is configured in code, meaning that the mock handlers are hard coded.

This helper that uses http-middleware generates an extra endpoint `PUT /scenario` to apply a predefined scenario for an endpoint.
For example when you want to set the scenario 'user success' for `GET /user`, just call this endpoint with in the body:

```json
{
    "method": "GET",
    "path": "/user",
    "scenario": "user success"
}
```

The success scenario is predefined.
You need scenarios because MSW handlers are not (easily) serializable and a scenario is.

## Does this package work with vanilla MSW

This package builds upon @mswjs/http-middleware but if you want to set redefined scenarios for 

## How to use

Set up http-middleware as described in their docs, but instead of importing handlers, you import a function from 'msw-dynamic-http-middleware' to create handlers for you, based on the scenarios and the endpoints you provide.

```
import { createServer } from '@mswjs/http-middleware'
import { createHandlers } from 'msw-dynamic-http-middleware'

const scenarios = {
  'user success': (req, res, ctx) => res(ctx.json({ name: 'frank' }))
}
  
const endpoints = [
  ['GET', '/user'],
  ['GET', '/users']
];

const handlers = createHandlers(endpoints, scenarios);

const httpServer = createServer(...handlers)

httpServer.listen(9090)
```

Endpoints that don't have a handler assigned (yet), for example when the server starts, return a default response, which is currently an empty body with status 200.
