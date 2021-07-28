'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var pino = _interopDefault(require('pino'));
var msw = require('msw');

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
/**
 * Create REST endpoints (handlers) based on the given scenarios.
 * When a scenario is set using PUT /scenario, the path and method of the scenario handler are used as keys in the activeResolvers map and the resolver is used as value
 *
 * @param {*} scenarios an object of RestHandlers with scenario name as key.
 * @returns RestHandler[]
 */


var createHandlers = function createHandlers(scenarios) {
  /* Store currently active resolvers by method and path, for example:
   * {
   *   '/user/': {
   *     GET: [resolver]
   *   }
   * }
   */
  var activeResolvers = {};
  return [].concat(Object.values(scenarios).flatMap(function (handler) {
    var handlers = Array.isArray(handler) ? handler : [handler];
    return handlers.map(function (handler) {
      var _handler$info = handler.info,
          method = _handler$info.method,
          path = _handler$info.path,
          header = _handler$info.header;
      return msw.rest[method.toLowerCase()](path, function (req, res, ctx) {
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
  }), [// Create endpoint to set mock for any endpoint
  msw.rest.put('/scenario', function (req, res, ctx) {
    var _req$body;

    var scenarioName = (_req$body = req.body) == null ? void 0 : _req$body.scenario;

    if (!scenarioName) {
      return res(ctx.status(400), ctx.text("Please provide a scenario name in the request body. Example: { \"scenario\": \"user success\" }"));
    }

    var handler = scenarios[scenarioName];

    if (!handler) {
      return res(ctx.status(400), ctx.text("Scenario \"" + scenarioName + "\" does not exist"));
    }

    var handlers = Array.isArray(handler) ? handler : [handler];
    var headers = handlers.map(function (handler) {
      var _handler$info2 = handler.info,
          path = _handler$info2.path,
          method = _handler$info2.method,
          header = _handler$info2.header;

      if (assertPath(path)) {
        if (!(path in activeResolvers)) {
          activeResolvers[path] = {};
        } // @ts-ignore resolver is protected but I don't care


        activeResolvers[path][method] = handler.resolver;
        return header;
      }
    });
    logger.info("Set scenario \"" + scenarioName + "\" with resolvers for endpoints: " + headers.join(', '));
    return res(ctx.status(205));
  })]);
};

exports.createHandlers = createHandlers;
//# sourceMappingURL=msw-dynamic-http-middleware.cjs.development.js.map
