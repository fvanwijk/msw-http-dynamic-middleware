import { rest, setupWorker } from 'msw';

const worker = setupWorker(
  rest.get('/scenario', (_, res, ctx) => {
    return res(
      ctx.json({
        'user success': rest.get('/user', (_, res, ctx) => res(ctx.json({ name: 'frank' }))),
        'user error': rest.get('/user', (_, res, ctx) => res(ctx.status(500))),
        'users success': rest.get('/users', (_, res, ctx) => res(ctx.json([{ name: 'frank' }]))),
        'users error': rest.get('/users', (_, res, ctx) => res(ctx.status(500))),
        success: [
          rest.get('/user', (_, res, ctx) => res(ctx.json({ name: 'frank' }))),
          rest.get('/users', (_, res, ctx) => res(ctx.json([{ name: 'frank' }]))),
        ],
        error: [
          rest.get('/user', (_, res, ctx) => res(ctx.status(500))),
          rest.get('/users', (_, res, ctx) => res(ctx.status(500))),
        ],
      }),
    );
  }),
  rest.put('/scenario', (_, res, ctx) => res(ctx.status(205))),
);

export default worker;
