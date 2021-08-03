import { createMiddleware } from '@mswjs/http-middleware';
import { ServerApi, createServer } from '@open-draft/test-server';
import { rest, RestHandler } from 'msw';
import fetch from 'node-fetch';
import { createHandlers } from '../src';

const userSuccess = rest.get('/user', (req, res, ctx) => res(ctx.json({ name: 'frank' })));
const userError = rest.get('/user', (req, res, ctx) => res(ctx.status(500)));
const usersSuccess = rest.get('/users', (req, res, ctx) => res(ctx.json([{ name: 'frank' }])));
const usersError = rest.get('/users', (req, res, ctx) => res(ctx.status(500)));
const scenarios = {
  // Scenarios for one endpoint
  'user success': userSuccess,
  'user error': userError,
  'users success': usersSuccess,
  'users error': usersError,

  // Scenarios for multiple endpoints
  success: [userSuccess, usersSuccess],
  error: [userError, usersError],
};

let server: ServerApi;

const setup = (handlers: RestHandler[]): Promise<ServerApi> => {
  return createServer(app => {
    app.use(createMiddleware(...handlers));
  });
};

const setScenario = async (scenarioName?: string) => {
  return await fetch(server.http.makeUrl('/scenario'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario: scenarioName }),
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

describe('createHandlers', () => {
  it('should throw error when there is a handler with path that is RegExp', async () => {
    expect(() => setup(createHandlers({ regexp: rest.get(/test/, () => {}) }))).toThrowError(
      new Error('Only strings as path are supported'),
    );
  });

  it('should execute default handler when no handlers are active', async () => {
    server = await setup(createHandlers(scenarios));

    await assertText('/user', '');

    server.close();
  });

  it('should return 404 for handlers that are not in a scenario', async () => {
    server = await setup(createHandlers(scenarios));

    const res = await fetch(server.http.makeUrl('/not-exist'));
    expect(res.status).toBe(404);

    server.close();
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

      server.close();
    });

    it('should throw error when initial scenario does not exist', async () => {
      expect(() => setup(createHandlers(scenarios, 'not-exist'))).toThrowError(
        new Error('Scenario "not-exist" does not exist'),
      );
    });
  });

  describe('GET /scenario', () => {
    it('should return the map with scenarios and handler info', async () => {
      server = await setup(createHandlers(scenarios));

      const json = await fetch(server.http.makeUrl('/scenario')).then(res => res.json());
      expect(json.scenarios).toMatchSnapshot();

      server.close();
    });

    it('should mark handlers as active if they were set by that scenario or have the same reference', async () => {
      server = await setup(createHandlers(scenarios, 'success'));

      const json = await fetch(server.http.makeUrl('/scenario')).then(res => res.json());

      expect(json.scenarios.success[0].isActive).toBe(true);
      expect(json.scenarios.success[1].isActive).toBe(true);
      expect(json.scenarios.error[0].isActive).toBe(false);
      expect(json.scenarios.error[1].isActive).toBe(false);
      expect(json.scenarios['user success'].isActive).toBe(true);
      expect(json.scenarios['user error'].isActive).toBe(false);
      expect(json.scenarios['users success'].isActive).toBe(true);
      expect(json.scenarios['users error'].isActive).toBe(false);

      server.close();

      server = await setup(createHandlers(scenarios, 'user success'));
      const json2 = await fetch(server.http.makeUrl('/scenario')).then(res => res.json());

      expect(json2.scenarios.success[0].isActive).toBe(true);
      expect(json2.scenarios.success[1].isActive).toBe(false);
      expect(json2.scenarios.error[0].isActive).toBe(false);
      expect(json2.scenarios.error[1].isActive).toBe(false);
      expect(json2.scenarios['user success'].isActive).toBe(true);
      expect(json2.scenarios['user error'].isActive).toBe(false);
      expect(json2.scenarios['users success'].isActive).toBe(false);
      expect(json2.scenarios['users error'].isActive).toBe(false);

      server.close();
    });
  });

  describe('PUT /scenario', () => {
    it('should return error with status 400 when no scenario given in body', async () => {
      server = await setup(createHandlers(scenarios));

      const res = await setScenario();
      expect(await res.text()).toBe(
        'Please provide a scenario name in the request body. Example: { "scenario": "user success" }',
      );
      expect(await res.status).toBe(400);

      server.close();
    });

    it('should return error with status 400 when the scenario does not exist', async () => {
      server = await setup(createHandlers(scenarios));

      const res = await setScenario('not-exist');

      expect(await res.text()).toBe('Scenario "not-exist" does not exist');
      expect(await res.status).toBe(400);

      server.close();
    });

    it('should set the scenario and return status 205', async () => {
      server = await setup(createHandlers(scenarios));

      // No mock set
      const userRes = await fetch(server.http.makeUrl('/user'));
      expect(userRes.status).toBe(200);
      expect(await userRes.text()).toBe('');

      // Success mock set
      const res = await setScenario('user success');
      expect(res.status).toBe(205);

      await assertJson('/user', { name: 'frank' });

      // Error mock set
      await setScenario('user error');

      const userErrorRes = await fetch(server.http.makeUrl('/user'));
      expect(userErrorRes.status).toBe(500);
      expect(await userErrorRes.text()).toBe('');

      server.close();
    });
  });

  describe('DELETE /scenario', () => {
    it('should reset the server', async () => {
      server = await setup(createHandlers(scenarios));

      setScenario('user success');

      await assertJson('/user', { name: 'frank' });

      await fetch(server.http.makeUrl('/scenario'), { method: 'DELETE' });

      await assertText('/user', '');

      server.close();
    });

    it('should reset the server to initial state', async () => {
      server = await setup(createHandlers(scenarios, 'user success'));

      setScenario('users success');

      await assertJson('/user', { name: 'frank' });
      await assertJson('/users', [{ name: 'frank' }]);

      await fetch(server.http.makeUrl('/scenario'), { method: 'DELETE' });

      await assertJson('/user', { name: 'frank' });
      await assertText('/users', '');

      server.close();
    });

    it('should reset the server completely when query param is given', async () => {
      server = await setup(createHandlers(scenarios, 'user success'));

      setScenario('users success');

      await assertJson('/user', { name: 'frank' });
      await assertJson('/users', [{ name: 'frank' }]);

      await fetch(server.http.makeUrl('/scenario?resetAll=true'), { method: 'DELETE' });

      await assertText('/user', '');
      await assertText('/users', '');

      server.close();
    });
  });
});
