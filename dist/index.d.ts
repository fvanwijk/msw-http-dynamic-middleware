import { RestHandler } from 'msw';
export declare type Scenarios = Record<string, RestHandler | RestHandler[]>;
/**
 * Create REST endpoints (handlers) based on the given scenarios.
 * When a scenario is set using PUT /scenario, the path and method of the scenario handler are used as keys in the activeResolvers map and the resolver is used as value
 *
 * @param {Scenarios} scenarios an object of RestHandlers with scenario name as key.
 * @param {string} [defaultScenarioName] set a scenario when the server starts
 * @returns RestHandler[]
 */
export declare const createHandlers: (scenarios: Scenarios, defaultScenarioName?: string | undefined) => RestHandler<import("msw").MockedRequest<import("msw").DefaultRequestBody>>[];
