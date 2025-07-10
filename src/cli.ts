import minimist from 'minimist';
import { TaskDef } from './taskRegistry';
import * as path from 'path';
import * as fs from 'fs';
import ora from 'ora';

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

export async function runHumble(argv: string[]) {
  // Look for humble.tasks.js or humble.tasks.ts in the current working directory
  const cwd = process.cwd();
  let tasksPath = path.join(cwd, 'humble.tasks.js');
  if (!fs.existsSync(tasksPath)) {
    tasksPath = path.join(cwd, 'humble.tasks.ts');
  }
  if (!fs.existsSync(tasksPath)) {
    console.error('❌ Could not find a humble.tasks.js or humble.tasks.ts file in your project root.');
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
  for (const task of tasksToRun) {
    const spinner = ora({
      text: task.title,
      spinner: 'dots',
    }).start();
    try {
      await task.run();
      spinner.succeed(`${task.title} — done`);
    } catch (err) {
      spinner.fail(`${task.title} — failed`);
      console.error('❌ Task failed:', err);
      process.exit(1);
    }
  }
  console.log('\n✅ Site generation complete!');
}
