jest.mock('../logger');
import { runTasks } from './runTasks';

describe('runTasks', () => {
  it('runs all tasks in order and updates context', async () => {
    const context: Record<string, any> = {};
    const calls: string[] = [];
    const tasks = [
      {
        name: 'a',
        config: {},
        run: async () => {
          calls.push('a');
          return { a: 1 };
        },
      },
      {
        name: 'b',
        config: {},
        run: async () => {
          calls.push('b');
          return { b: 2 };
        },
      },
    ];
    await runTasks(tasks as any, context, false);
    expect(calls).toEqual(['a', 'b']);
    expect(context.a).toBe(1);
    expect(context.b).toBe(2);
  });

  it('propagates errors from runTask', async () => {
    const tasks = [
      {
        name: 'fail',
        config: {},
        run: async () => {
          throw new Error('fail!');
        },
      },
    ];
    await expect(runTasks(tasks as any, {}, false)).rejects.toThrow('fail!');
  });
});
