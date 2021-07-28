import { RestHandler } from 'msw';
export declare type Scenarios = Record<string, RestHandler | RestHandler[]>;
/**
 * Create REST endpoints (handlers) based on the given scenarios.
 * When a scenario is set using PUT /scenario, the path and method of the scenario handler are used as keys in the activeResolvers map and the resolver is used as value
 *
 * @param {*} scenarios an object of RestHandlers with scenario name as key.
 * @returns RestHandler[]
 */
export declare const createHandlers: (scenarios: Scenarios) => RestHandler<import("msw").MockedRequest<import("msw").DefaultRequestBody>>[];
