import { Logger } from '../logger';

export function createTaskLogger(taskName: string, debug: boolean): Logger {
  return new Logger({ debug, taskName });
}
