import type { TaskDef, TaskContext, Logger, SkierItem, SkierGlobals } from './index.js';

// Guards the package's public *type* surface. The core task-authoring contract
// (TaskDef, TaskContext, Logger, SkierItem, SkierGlobals) is documented in
// docs/api-reference as importable from the package root, and custom tasks are
// typed against it. These are compile-time-only imports: if src/index.ts stops
// re-exporting them from './types.js', this file fails to compile (TS2305) and
// the suite goes red — so the docs can't silently drift from the real exports.
describe('package public type surface', () => {
  it('re-exports the core task-authoring contract from the package root', () => {
    const item: SkierItem = {
      itemName: 'hello-world',
      itemPath: 'src/items/hello-world.md',
      outPath: 'public/hello-world/index.html',
      type: 'md',
      title: 'Hello World',
      link: '/hello-world/',
      body: '<p>Hi</p>',
    };

    const task: TaskDef<{ greeting: string }, SkierGlobals> = {
      name: 'greet',
      title: 'Greet the world',
      config: { greeting: 'hello' },
      run: async (config, ctx: TaskContext) => {
        const logger: Logger = ctx.logger;
        logger.info(`${config.greeting}, ${item.title}`);
        return { greeted: item.itemName };
      },
    };

    expect(task.name).toBe('greet');
    expect(task.config.greeting).toBe('hello');
  });
});
