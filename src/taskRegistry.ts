// Humble Task Type
export interface TaskRuntimeContext {
  logger: import('./logger').Logger;
  debug: boolean;
  [key: string]: any;
}

export interface TaskDef<C = any> {
  name: string;
  title: string;
  config: C;
  run: (config: C, ctx: TaskRuntimeContext) => Promise<any> | any;
}


// All TaskDef objects must now include a .config property for type-safe config injection.
// User projects should supply their own array of TaskDef objects.
// Example:
// import { TaskDef } from 'humble';
// export const tasks: TaskDef[] = [ ... ];
