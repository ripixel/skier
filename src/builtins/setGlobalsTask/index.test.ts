import { setGlobalsTask, SetGlobalsConfig } from './index';
import type { TaskContext } from '../../types';

describe('setGlobalsTask', () => {
  const ctx: TaskContext = {
    debug: false,
    globals: { existing: 1 },
    logger: { warn: jest.fn(), debug: jest.fn(), error: jest.fn(), info: jest.fn() },
  };

  it('sets static globals from values', async () => {
    const config: SetGlobalsConfig = {
      values: { foo: 'bar', answer: 42 },
    };
    const task = setGlobalsTask(config);
    const result = await task.run(config, ctx);
    expect(result.foo).toBe('bar');
    expect(result.answer).toBe(42);
  });

  it('sets globals from valuesFn', async () => {
    const config: SetGlobalsConfig = {
      valuesFn: (globals) => ({ doubled: (Number(globals['existing']) || 0) * 2 }),
    };
    const task = setGlobalsTask(config);
    const result = await task.run(config, ctx);
    expect(result.doubled).toBe(2);
  });

  it('merges values and valuesFn', async () => {
    const config: SetGlobalsConfig = {
      values: { foo: 'bar' },
      valuesFn: (globals) => ({ bar: 'baz' }),
    };
    const task = setGlobalsTask(config);
    const result = await task.run(config, ctx);
    expect(result.foo).toBe('bar');
    expect(result.bar).toBe('baz');
  });
});
