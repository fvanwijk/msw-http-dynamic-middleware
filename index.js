import { rest } from 'msw';

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
        const { method, path } = handler.info;
        return rest[method.toLowerCase()](path, (req, res, ctx) => {
          // Forward call to active resolver that comes from scenario or fall back to default resolver
          console.log('call', method, path, activeResolvers[path]?.[method])
          const resolver = activeResolvers[path]?.[method] || defaultResolver;
  
          return resolver(req, res, ctx);
        });
      })
    }),

    // Create endpoint to set mock for any endpoint
    rest.put('/scenario', (req, res, ctx) => {
      const scenarioName = req.body.scenario;

      if (!scenarioName) {
        return res(
          ctx.status(401),
          ctx.text(`Please provide a scename in the request body. Example: { "scenario": "user success" }`),
        );
      }

      const selectedScenario = scenarios[scenarioName];
      if (!selectedScenario) {
        return res(ctx.status(401), ctx.text(`Scenario "${scenarioName}" does not exist`));
      }

      const { path, method } = selectedScenario.info;

      if (!(path in activeResolvers)) {
        activeResolvers[path] = {};
      }

      activeResolvers[path][method] = selectedScenario.resolver;

      return res(ctx.status(205));
    }),
  ];
};
