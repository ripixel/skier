import type { TaskDef, SkierGlobals } from '../types.js';
import { runTask } from './runTask.js';

export async function runTasks(
  tasks: TaskDef[],
  context: SkierGlobals,
  debug: boolean,
): Promise<void> {
  for (const task of tasks) {
    await runTask(task, context, debug);
  }
}
