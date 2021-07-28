import pino from 'pino';
import { ResponseResolver, rest, RestHandler } from 'msw';
import { Path } from 'node-match-path';

export type Scenarios = Record<string, RestHandler | RestHandler[]>;

const logger = pino({ prettyPrint: {
  translateTime: true,
  ignore: 'pid,hostname'
} });

const defaultResolver: ResponseResolver = (_, res, ctx) => res(ctx.status(200));

const assertPath = (path: Path): path is string => {
  if (path instanceof RegExp) {
    throw new Error(`Only strings as path are supported`);
  }
  return true;
}

/**
 * Create REST endpoints (handlers) based on the given scenarios.
 * When a scenario is set using PUT /scenario, the path and method of the scenario handler are used as keys in the activeResolvers map and the resolver is used as value
 *
 * @param {*} scenarios an object of RestHandlers with scenario name as key.
 * @returns RestHandler[]
 */
export const createHandlers = (scenarios: Scenarios)  => {
  /* Store currently active resolvers by method and path, for example:
   * {
   *   '/user/': {
   *     GET: [resolver]
   *   }
   * }
   */
  const activeResolvers: Record<string, Record<string, ResponseResolver>> = {};

  return [
    // Create mock endpoints for all defined scenarios. Possible duplicates
    ...Object.values(scenarios).flatMap(handler => {
      const handlers = Array.isArray(handler) ? handler : [handler];
      
      return handlers.map(handler => {
        const { method, path, header } = handler.info;
        return rest[method.toLowerCase() as keyof typeof rest](path, (req, res, ctx) => {
          // Forward call to active resolver that comes from scenario or fall back to default resolver
          if (assertPath(path)) {
            let resolver = activeResolvers[path]?.[method];
            
            if (!resolver) {
              resolver = defaultResolver
              logger.info(`${header} (default resolver)`);
            } else {
              logger.info(header);
            }
            
            return resolver(req, res, ctx);
          }
        });
      })
    }),

    // Create endpoint to set mock for any endpoint
    rest.put('/scenario', (req, res, ctx) => {
      const scenarioName = (req.body as Record<string, any>)?.scenario;

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
        if (assertPath(path)) {
          if (!(path in activeResolvers)) {
            activeResolvers[path] = {};
          }
          
          // @ts-ignore resolver is protected but I don't care
          activeResolvers[path][method] = handler.resolver;
          return header;
        }
        return;
      })
      
      logger.info(`Set scenario "${scenarioName}" with resolvers for endpoints: ${headers.join(', ')}`)

      return res(ctx.status(205));
    }),
  ];
};
