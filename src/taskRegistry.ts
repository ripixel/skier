// Humble Task Type
export interface TaskDef {
  name: string;
  title: string;
  run: () => Promise<any> | any;
}

// User projects should supply their own array of TaskDef objects.
// Example:
// import { TaskDef } from 'humble';
// export const tasks: TaskDef[] = [ ... ];
