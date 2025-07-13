import minimist from 'minimist';
import type { TaskDef } from './types';
import * as path from 'path';
import * as fs from 'fs';


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

import { Logger } from './logger';

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
  const { only, skip, debug } = parseCliArgs(argv);
  const logger = new Logger({ debug, taskName: 'runner' });
  logger.info('Started');
  let tasksToRun: TaskDef[] = userTasks;
  if (only && only.length > 0) {
    tasksToRun = userTasks.filter((task: TaskDef) => only.includes(task.name));
  } else if (skip && skip.length > 0) {
    tasksToRun = userTasks.filter((task: TaskDef) => !skip.includes(task.name));
  }
  // Shared context for variable propagation
  let skierContext: Record<string, any> = {};
  function resolveConfigVars(config: any, context: Record<string, any>, logger: Logger): any {
    if (typeof config === 'string' && config.startsWith('${') && config.endsWith('}')) {
      const varName = config.slice(2, -1);
      if (context[varName] !== undefined) {
        logger.debug(`Resolved variable '\${${varName}}' to value of type '${typeof context[varName]}'`);
        return context[varName];
      } else {
        logger.debug(`Variable '\${${varName}}' not found in context, leaving as undefined`);
        return undefined;
      }
    } else if (Array.isArray(config)) {
      return config.map(item => resolveConfigVars(item, context, logger));
    } else if (typeof config === 'object' && config !== null) {
      const resolved: any = {};
      for (const key in config) {
        resolved[key] = resolveConfigVars(config[key], context, logger);
      }
      return resolved;
    }
    return config;
  }



  for (const task of tasksToRun) {
    // Always use the config property from TaskDef
    const userConfig = task.config;
    const taskLogger = new Logger({ debug, taskName: task.name });
    taskLogger.info('Started task');
    const resolvedConfig = resolveConfigVars(userConfig, skierContext, taskLogger);
    try {
      // Run the task and capture output with runtime context
      const result = await task.run(resolvedConfig, { logger: taskLogger, debug, globals: skierContext });
      // If the task returned an object, merge it into the context
      if (result && typeof result === 'object') {
        for (const key of Object.keys(result)) {
          if (key in skierContext) {
            taskLogger.warn(`outputVar/global '${key}' is being overwritten by a later task. This may indicate a configuration issue.`);
          }
          skierContext[key] = (result as { [key: string]: any })[key];
          taskLogger.debug(`Added/updated variable: ${key} = ${JSON.stringify((result as { [key: string]: any })[key], null, 2)}`);
        }
      }
      taskLogger.info('Finished task');
    } catch (err) {
      taskLogger.error('Task failed: ' + (err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  }
  logger.info('Completed');
}
