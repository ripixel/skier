import minimist from 'minimist';
import type { TaskDef } from './types';


function parseCliArgs(argv: string[]) : { only: string[]; skip: string[]; debug: boolean } {
  const args = minimist(argv.slice(2), {
    string: ['only', 'skip'],
    boolean: ['debug'],
    alias: {},
    default: {},
  });
  let only: string[] = [];
  let skip: string[] = [];
  const debug: boolean = !!args.debug;
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
  return { only, skip, debug };
}

import { createTaskLogger } from './logger';
import { runTasks } from './cli/runTasks';

import { loadTasks } from './cli/loadTasks';

export async function runSkier(argv: string[]) {
  const cwd = process.cwd();
  let userTasks: TaskDef[];
  try {
    userTasks = await loadTasks(cwd);
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
  const { only, skip, debug } = parseCliArgs(argv);
  const logger = createTaskLogger('runner', debug);
  logger.info('Started');
  let tasksToRun: TaskDef[] = userTasks;
  if (only && only.length > 0) {
    tasksToRun = userTasks.filter((task: TaskDef) => only.includes(task.name));
  } else if (skip && skip.length > 0) {
    tasksToRun = userTasks.filter((task: TaskDef) => !skip.includes(task.name));
  }
  // Shared context for variable propagation
  let skierContext: Record<string, any> = {};
  await runTasks(tasksToRun, skierContext, debug);
  logger.info('Completed');
}
