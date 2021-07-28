import { pino } from 'pino';
import { rest } from 'msw';

const logger = pino({ prettyPrint: {
  translateTime: true,
  ignore: 'pid,hostname'
} });

const defaultResolver = (req, res, ctx) => res(ctx.status(200));

/**
 * Create REST endpoints (handlers) based on the given scenarios.
 * When a scenario is set using PUT /scenario, the path and method of the scenario handler are used as keys in the activeResolvers map and the resolver is used as value
 *
 * @param {*} scenarios an object of RestHandlers with scenario name as key.
 * @returns RestHandler[]
 */
export const createHandlers = scenarios => {
  /* Store currently active resolvers by method and path, for example:
   * {
   *   '/user/': {
   *     GET: [resolver]
   *   }
   * }
   */
  const activeResolvers = {};

  return [
    // Create mock endpoints for all defined scenarios. Possible duplicates
    ...Object.values(scenarios).flatMap(handler => {
      const handlers = Array.isArray(handler) ? handler : [handler];
      
      return handlers.map(handler => {
        const { method, path, header } = handler.info;
        return rest[method.toLowerCase()](path, (req, res, ctx) => {
          // Forward call to active resolver that comes from scenario or fall back to default resolver
          let resolver = activeResolvers[path]?.[method];
          
          if (!resolver) {
            resolver = defaultResolver
            logger.info(`${header} (default resolver)`);
          } else {
            logger.info(header);
          }
  
          return resolver(req, res, ctx);
        });
      })
    }),

    // Create endpoint to set mock for any endpoint
    rest.put('/scenario', (req, res, ctx) => {
      const scenarioName = req.body.scenario;

      if (!scenarioName) {
        return res(
          ctx.status(400),
          ctx.text(`Please provide a scenario name in the request body. Example: { "scenario": "user success" }`),
        );
      }

      const handler = scenarios[scenarioName];
      if (!handler) {
        return res(ctx.status(400), ctx.text(`Scenario "${scenarioName}" does not exist`));
      }
      
      const handlers = Array.isArray(handler) ? handler : [handler];

      const headers = handlers.map(handler => {
        const { path, method, header } = handler.info;
  
        if (!(path in activeResolvers)) {
          activeResolvers[path] = {};
        }
  
        activeResolvers[path][method] = handler.resolver;
        return header;
      })
      
      logger.info(`Set scenario "${scenarioName}" with resolvers for endpoints: ${headers.join(', ')}`)

      return res(ctx.status(205));
    }),
  ];
};
