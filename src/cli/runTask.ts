import { createTaskLogger } from '../logger.js';
import { resolveConfigVars } from './resolveConfigVars.js';
import type { TaskDef, SkierGlobals } from '../types.js';

export async function runTask(
  task: TaskDef,
  context: SkierGlobals,
  debug: boolean,
): Promise<SkierGlobals> {
  const userConfig = task.config;
  const taskLogger = createTaskLogger(task.name, debug);
  taskLogger.info('Started task');
  const resolvedConfig = resolveConfigVars(userConfig, context, taskLogger);

  try {
    const result = await task.run(resolvedConfig, { logger: taskLogger, debug, globals: context });

    if (result && typeof result === 'object') {
      for (const key of Object.keys(result)) {
        if (key in context) {
          taskLogger.warn(
            `outputVar/global '${key}' is being overwritten by a later task. This may indicate a configuration issue.`,
          );
        }
        const resultRecord = result as Record<string, unknown>;
        context[key] = resultRecord[key];
        taskLogger.debug(
          `Added/updated variable: ${key} = ${JSON.stringify(resultRecord[key], null, 2)}`,
        );
      }
    }

    taskLogger.info('Finished task');
    return (result as SkierGlobals) || {};
  } catch (err) {
    taskLogger.error('Task failed: ' + (err instanceof Error ? err.message : String(err)));
    throw err;
  }
}
