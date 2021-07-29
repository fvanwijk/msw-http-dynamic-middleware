import { createMiddleware } from '@mswjs/http-middleware';
import { ServerApi, createServer } from '@open-draft/test-server';
import { rest, RestHandler } from 'msw';
import fetch from 'node-fetch';
import { createHandlers } from '../src';
const r = new RegExp('user');

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

let server: ServerApi;

const setup = (handlers: RestHandler[]): Promise<ServerApi> => {
  return createServer(app => {
    app.use(createMiddleware(...handlers));
  });
};

const assertJson = async (path: string, json: any) => {
  const res = await fetch(server.http.makeUrl(path));
  expect(await res.json()).toEqual(json);
};
const assertText = async (path: string, text: string) => {
  const res = await fetch(server.http.makeUrl(path));
  expect(await res.text()).toEqual(text);
};

afterEach(() => {
  server && server.close();
});

describe('createHandlers', () => {
  it('should throw error when there is a handler with path that is RegExp', async () => {
    expect(() => setup(createHandlers({ regexp: rest.get(/test/, () => {}) }))).toThrowError(
      new Error('Only strings as path are supported'),
    );
  });

  it('should execute default handler when no handlers are active', async () => {
    server = await setup(createHandlers(scenarios));

    const res = await fetch(server.http.makeUrl('/user'));
    await assertText('/user', '');
  });

  describe('initial scenario', () => {
    it('should set initial scenario', async () => {
      // Scenario with one handler
      server = await setup(createHandlers(scenarios, 'user success'));

      await assertJson('/user', { name: 'frank' });
      await assertText('/users', '');
      server.close();

      // Scenario with multiple handlers
      server = await setup(createHandlers(scenarios, 'success'));

      await assertJson('/user', { name: 'frank' });
      await assertJson('/users', [{ name: 'frank' }]);
    });

    it('should throw error when initial scenario does not exist', async () => {
      expect(() => setup(createHandlers(scenarios, 'not-exist'))).toThrowError(
        new Error('Scenario "not-exist" does not exist'),
      );
    });
  });
});
