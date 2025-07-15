import { Logger } from '../logger';
import { resolveConfigVars } from './resolveConfigVars';
import { createTaskLogger } from './logger';
import type { TaskDef } from '../types';

export async function runTask(task: TaskDef, context: Record<string, any>, debug: boolean): Promise<Record<string, any>> {
  const userConfig = task.config;
  const taskLogger = createTaskLogger(task.name, debug);
  taskLogger.info('Started task');
  const resolvedConfig = resolveConfigVars(userConfig, context, taskLogger);
  try {
    const result = await task.run(resolvedConfig, { logger: taskLogger, debug, globals: context });
    if (result && typeof result === 'object') {
      for (const key of Object.keys(result)) {
        if (key in context) {
          taskLogger.warn(`outputVar/global '${key}' is being overwritten by a later task. This may indicate a configuration issue.`);
        }
        context[key] = (result as Record<string, any>)[key];
        taskLogger.debug(`Added/updated variable: ${key} = ${JSON.stringify((result as Record<string, any>)[key], null, 2)}`);
      }
    }
    taskLogger.info('Finished task');
    return result || {};
  } catch (err) {
    taskLogger.error('Task failed: ' + (err instanceof Error ? err.message : String(err)));
    throw err;
  }
}
