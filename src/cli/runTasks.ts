import type { TaskDef } from '../types';
import { runTask } from './runTask';

export async function runTasks(tasks: TaskDef[], context: Record<string, any>, debug: boolean): Promise<void> {
  for (const task of tasks) {
    await runTask(task, context, debug);
  }
}
