import pino from 'pino';
import { ResponseResolver, rest, RestHandler } from 'msw';
import { Path } from 'node-match-path';

export * from './middleware';

export type Scenarios = Record<string, RestHandler | RestHandler[]>;

const logger = pino({
  prettyPrint: {
    translateTime: true,
    ignore: 'pid,hostname',
  },
});

const defaultResolver: ResponseResolver = (_, res, ctx) => res(ctx.status(200));

const assertPath = (path: Path): path is string => {
  if (path instanceof RegExp) {
    throw new Error(`Only strings as path are supported`);
  }
  return true;
};

const setScenario = (
  scenarios: Scenarios,
  scenarioName: string,
  activeResolvers: Record<string, Record<string, ResponseResolver>>,
): void => {
  const handler = scenarios[scenarioName];
  if (!handler) {
    throw new Error(`Scenario "${scenarioName}" does not exist`);
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
  });

  logger.info(`Set scenario "${scenarioName}" with resolvers for endpoints: ${headers.join(', ')}`);
};

/**
 * Create REST endpoints (handlers) based on the given scenarios.
 * When a scenario is set using PUT /scenario, the path and method of the scenario handler are used as keys in the activeResolvers map and the resolver is used as value
 *
 * @param {Scenarios} scenarios an object of RestHandlers with scenario name as key.
 * @param {string} [defaultScenarioName] set a scenario when the server starts
 * @returns RestHandler[]
 */
export const createHandlers = (scenarios: Scenarios, defaultScenarioName?: string) => {
  /* Store currently active resolvers by method and path, for example:
   * {
   *   '/user/': {
   *     GET: [resolver]
   *   }
   * }
   */
  let activeResolvers: Record<string, Record<string, ResponseResolver>> = {};

  if (defaultScenarioName) {
    setScenario(scenarios, defaultScenarioName, activeResolvers);
  }

  return [
    // Create mock endpoints for all defined scenarios. Possible duplicates
    ...Object.values(scenarios).flatMap(handler => {
      const handlers = Array.isArray(handler) ? handler : [handler];

      return handlers.map(handler => {
        const { method, path, header } = handler.info;

        assertPath(path);

        return rest[method.toLowerCase() as keyof typeof rest](path, (req, res, ctx) => {
          // Forward call to active resolver that comes from scenario or fall back to default resolver
          if (assertPath(path)) {
            let resolver = activeResolvers[path]?.[method];

            if (!resolver) {
              resolver = defaultResolver;
              logger.info(`${header} (default resolver)`);
            } else {
              logger.info(header);
            }

            return resolver(req, res, ctx);
          }
        });
      });
    }),

    rest.get('/scenario', (_, res, ctx) => {
      const mappedScenarios = Object.entries(scenarios).reduce((acc, [scenarioName, handlers]) => {
        const toInfoLite = (handler: RestHandler, { header, method, path }: RestHandler['info']) => {
          const activeResolver = activeResolvers[path.toString()]?.[method];

          return {
            // @ts-ignore
            isActive: activeResolver === handler.resolver,
            header,
            method,
            path: path.toString(),
          };
        };

        if (Array.isArray(handlers)) {
          acc[scenarioName] = handlers.map(handler => toInfoLite(handler, handler.info));
        } else {
          acc[scenarioName] = toInfoLite(handlers, handlers.info);
        }

        return acc;
      }, {} as Record<string, { header: string; method: string; path: string } | { header: string; method: string; path: string }[]>);
      return res(ctx.json({ scenarios: mappedScenarios }));
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

      try {
        setScenario(scenarios, scenarioName, activeResolvers);
      } catch (error) {
        return res(ctx.status(400), ctx.text(error.message));
      }

      return res(ctx.status(205));
    }),

    // Reset all active scenarios
    rest.delete('/scenario', (req, res, ctx) => {
      activeResolvers = {};

      const resetAll: string | null = req.url.searchParams.get('resetAll');

      if (defaultScenarioName && resetAll?.toLowerCase() !== 'true') {
        logger.info('Reset server to default scenario');
        setScenario(scenarios, defaultScenarioName, activeResolvers);
      } else {
        logger.info('Reset all handlers to default resolver');
      }

      return res(ctx.status(205));
    }),
  ];
};
