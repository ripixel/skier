import minimist from 'minimist';
import { TaskDef } from './taskRegistry';
import * as path from 'path';
import * as fs from 'fs';


function parseCliArgs(argv: string[]) : { only: string[]; skip: string[] } {
  const args = minimist(argv.slice(2), {
    string: ['only', 'skip'],
    alias: {},
    default: {},
  });
  let only: string[] = [];
  let skip: string[] = [];
  if (typeof args.only === 'string') {
    only = args.only.split(',').map((s: string) => s.trim()).filter(Boolean);
  } else if (Array.isArray(args.only)) {
    only = args.only.flatMap((s: string) => s.split(',').map((x: string) => x.trim()));
  }
  if (typeof args.skip === 'string') {
    skip = args.skip.split(',').map((s: string) => s.trim()).filter(Boolean);
  } else if (Array.isArray(args.skip)) {
    skip = args.skip.flatMap((s: string) => s.split(',').map((x: string) => x.trim()));
  }
  return { only, skip };
}

export async function runSkier(argv: string[]) {
  // Look for humble.tasks.js or humble.tasks.ts in the current working directory
  const cwd = process.cwd();
  let tasksPath = path.join(cwd, 'skier.tasks.js');
  if (!fs.existsSync(tasksPath)) {
    tasksPath = path.join(cwd, 'skier.tasks.cjs');
  }
  if (!fs.existsSync(tasksPath)) {
    tasksPath = path.join(cwd, 'skier.tasks.ts');
  }
  if (!fs.existsSync(tasksPath)) {
    console.error('❌ Could not find a skier.tasks.js, skier.tasks.cjs, or skier.tasks.ts file in your project root.');
    process.exit(1);
  }
  // Dynamically import the user's tasks
  let userTasks: TaskDef[];
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    userTasks = require(tasksPath).tasks;
  } catch (e) {
    console.error('❌ Failed to load tasks from', tasksPath, e);
    process.exit(1);
  }
  const { only, skip } = parseCliArgs(argv);
  let tasksToRun: TaskDef[] = userTasks;
  if (only && only.length > 0) {
    tasksToRun = userTasks.filter((task: TaskDef) => only.includes(task.name));
  } else if (skip && skip.length > 0) {
    tasksToRun = userTasks.filter((task: TaskDef) => !skip.includes(task.name));
  }
  // Shared context for variable propagation
  let skierContext: Record<string, any> = {};
  for (const task of tasksToRun) {
    const ora = (await import('ora')).default;
    const spinner = ora({
      text: task.title,
      spinner: 'dots',
    }).start();
    try {
      // Type guard for objects with a 'globals' property
      function hasGlobals(obj: any): obj is { globals: Record<string, any> } {
        return obj && typeof obj === 'object' && 'globals' in obj && typeof obj.globals === 'object';
      }
      if (hasGlobals(task)) {
        task.globals = { ...skierContext, ...(task.globals || {}) };
      }
      // Run the task and capture output
      const result = await task.run();
      // If the task returned an object, merge it into the context
      if (result && typeof result === 'object') {
        for (const key of Object.keys(result)) {
          if (key in skierContext) {
            console.warn(`⚠️  Skier warning: outputVar/global '${key}' is being overwritten by a later task. This may indicate a configuration issue.`);
          }
          skierContext[key] = result[key];
        }
      }
      spinner.succeed(`${task.title} — done`);
    } catch (err) {
      spinner.fail(`${task.title} — failed`);
      console.error('❌ Task failed:', err);
      process.exit(1);
    }
  }
  console.log('\n✅ Site generation complete!');
}
