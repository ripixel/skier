import { join } from '../utils/pathHelpers.js';
import { pathExists } from '../utils/fileHelpers.js';
import type { TaskDef } from '../types.js';

/**
 * Loads the user's tasks definition from skier.tasks.js/mjs/cjs/ts in cwd.
 * Returns the exported `tasks` array, or throws if not found/invalid.
 */
export async function loadTasks(cwd: string): Promise<TaskDef[]> {
  let tasksPath = join(cwd, 'skier.tasks.js');
  if (!(await pathExists(tasksPath))) {
    tasksPath = join(cwd, 'skier.tasks.mjs');
  }
  if (!(await pathExists(tasksPath))) {
    tasksPath = join(cwd, 'skier.tasks.cjs');
  }
  if (!(await pathExists(tasksPath))) {
    tasksPath = join(cwd, 'skier.tasks.ts');
  }
  if (!(await pathExists(tasksPath))) {
    throw new Error(
      '❌ Could not find a skier.tasks.js, skier.tasks.mjs, skier.tasks.cjs, or skier.tasks.ts file in your project root.',
    );
  }
  // Dynamic import for ESM compatibility
  const mod = await import(tasksPath);
  if (!mod.tasks || !Array.isArray(mod.tasks)) {
    throw new Error('❌ skier.tasks file does not export a tasks array.');
  }
  return mod.tasks;
}
