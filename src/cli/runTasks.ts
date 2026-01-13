import type { TaskDef, SkierGlobals } from '../types';
import { runTask } from './runTask';

export async function runTasks(
  tasks: TaskDef[],
  context: SkierGlobals,
  debug: boolean,
): Promise<void> {
  for (const task of tasks) {
    await runTask(task, context, debug);
  }
}
