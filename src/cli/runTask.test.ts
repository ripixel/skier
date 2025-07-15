jest.mock('../logger');
import { runTask } from './runTask';

describe('runTask', () => {
  it('runs a task, updates context, and returns result', async () => {
    const context: Record<string, any> = { foo: 1 };
    const task = {
      name: 'task',
      config: { bar: 'baz' },
      run: jest.fn(async (cfg, ctx) => ({ result: 42, foo: 2 })),
    };
    const result = await runTask(task as any, context, false);
    expect(task.run).toHaveBeenCalledWith({ bar: 'baz' }, expect.objectContaining({ logger: expect.anything(), debug: false, globals: context }));
    expect(result).toEqual({ result: 42, foo: 2 });
    expect(context.foo).toBe(2);
    expect(context.result).toBe(42);
  });

  it('warns if context var is overwritten', async () => {
    const context: Record<string, any> = { x: 1 };
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
    jest.spyOn(require('../logger'), 'createTaskLogger').mockReturnValue(logger);
    const task = {
      name: 'task',
      config: {},
      run: async () => ({ x: 2 }),
    };
    await runTask(task as any, context, false);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('overwritten'));
    expect(context.x).toBe(2);
  });

  it('logs and throws on error', async () => {
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
    jest.spyOn(require('../logger'), 'createTaskLogger').mockReturnValue(logger);
    const task = {
      name: 'task',
      config: {},
      run: async () => { throw new Error('fail'); },
    };
    await expect(runTask(task as any, {}, false)).rejects.toThrow('fail');
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('fail'));
  });
});
