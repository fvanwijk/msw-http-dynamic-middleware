import { rest } from 'msw';
import { createHandlers } from '../src';

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

describe('createHandlers', () => {
  it('should create handlers from scenarios', () => {
    const handlers = createHandlers(scenarios);
    const handlersInfo = handlers.map(({ info: { callFrame, ...info } }) => info);

    expect(handlersInfo).toHaveLength(10); // 8 scenarios + PUT /scenario + DELETE /scenario
    expect(handlersInfo).toMatchSnapshot();
  });
});
