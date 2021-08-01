import pino from 'pino';
import { rest } from 'msw';
import path from 'path';
import express from 'express';

var middleware = /*#__PURE__*/express["static"]( /*#__PURE__*/path.join(__dirname, 'ui'));

var logger = /*#__PURE__*/pino({
  prettyPrint: {
    translateTime: true,
    ignore: 'pid,hostname'
  }
});

var defaultResolver = function defaultResolver(_, res, ctx) {
  return res(ctx.status(200));
};

var assertPath = function assertPath(path) {
  if (path instanceof RegExp) {
    throw new Error("Only strings as path are supported");
  }

  return true;
};

var setScenario = function setScenario(scenarios, scenarioName, activeResolvers) {
  var handler = scenarios[scenarioName];

  if (!handler) {
    throw new Error("Scenario \"" + scenarioName + "\" does not exist");
  }

  var handlers = Array.isArray(handler) ? handler : [handler];
  var headers = handlers.map(function (handler) {
    var _handler$info = handler.info,
        path = _handler$info.path,
        method = _handler$info.method,
        header = _handler$info.header;

    if (assertPath(path)) {
      if (!(path in activeResolvers)) {
        activeResolvers[path] = {};
      } // @ts-ignore resolver is protected but I don't care


      activeResolvers[path][method] = handler.resolver;
      return header;
    }
  });
  logger.info("Set scenario \"" + scenarioName + "\" with resolvers for endpoints: " + headers.join(', '));
};
/**
 * Create REST endpoints (handlers) based on the given scenarios.
 * When a scenario is set using PUT /scenario, the path and method of the scenario handler are used as keys in the activeResolvers map and the resolver is used as value
 *
 * @param {Scenarios} scenarios an object of RestHandlers with scenario name as key.
 * @param {string} [defaultScenarioName] set a scenario when the server starts
 * @returns RestHandler[]
 */


var createHandlers = function createHandlers(scenarios, defaultScenarioName) {
  /* Store currently active resolvers by method and path, for example:
   * {
   *   '/user/': {
   *     GET: [resolver]
   *   }
   * }
   */
  var activeResolvers = {};

  if (defaultScenarioName) {
    setScenario(scenarios, defaultScenarioName, activeResolvers);
  }

  return [].concat(Object.values(scenarios).flatMap(function (handler) {
    var handlers = Array.isArray(handler) ? handler : [handler];
    return handlers.map(function (handler) {
      var _handler$info2 = handler.info,
          method = _handler$info2.method,
          path = _handler$info2.path,
          header = _handler$info2.header;
      assertPath(path);
      return rest[method.toLowerCase()](path, function (req, res, ctx) {
        // Forward call to active resolver that comes from scenario or fall back to default resolver
        if (assertPath(path)) {
          var _activeResolvers$path;

          var resolver = (_activeResolvers$path = activeResolvers[path]) == null ? void 0 : _activeResolvers$path[method];

          if (!resolver) {
            resolver = defaultResolver;
            logger.info(header + " (default resolver)");
          } else {
            logger.info(header);
          }

          return resolver(req, res, ctx);
        }
      });
    });
  }), [rest.get('/scenario', function (_, res, ctx) {
    return res(ctx.json(scenarios));
  }), // Create endpoint to set mock for any endpoint
  rest.put('/scenario', function (req, res, ctx) {
    var _req$body;

    var scenarioName = (_req$body = req.body) == null ? void 0 : _req$body.scenario;

    if (!scenarioName) {
      return res(ctx.status(400), ctx.text("Please provide a scenario name in the request body. Example: { \"scenario\": \"user success\" }"));
    }

    try {
      setScenario(scenarios, scenarioName, activeResolvers);
    } catch (error) {
      res(ctx.status(400), ctx.text(error.message));
    }

    return res(ctx.status(205));
  }), // Reset all active scenarios
  rest["delete"]('/scenario', function (req, res, ctx) {
    activeResolvers = {};
    var resetAll = req.url.searchParams.get('resetAll');

    if (defaultScenarioName && (resetAll == null ? void 0 : resetAll.toLowerCase()) !== 'true') {
      logger.info('Reset server to default scenario');
      setScenario(scenarios, defaultScenarioName, activeResolvers);
    } else {
      logger.info('Reset all handlers to default resolver');
    }

    return res(ctx.status(205));
  })]);
};

export { createHandlers, middleware };
//# sourceMappingURL=msw-dynamic-http-middleware.esm.js.map
