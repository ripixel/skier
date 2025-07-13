// Shared type for all itemised content in Skier pipelines

export interface SkierItem {
  section?: string;
  itemName: string;
  itemPath: string;
  outPath: string;
  type: string; // 'html', 'md', etc.
  relativePath?: string;
  title: string;
  link: string;
  body: string;
  date?: string;
  dateObj?: Date;
  dateDisplay?: string;
  excerpt?: string;
  // If you want to extend with custom fields, extend this interface in your own project.
}

export interface SkierGlobals {
  [key: string]: unknown;
}

export interface Logger {
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
  debug(msg: string): void;
}

export interface TaskContext {
  logger: Logger;
  debug: boolean;
  globals: SkierGlobals;
}

export interface TaskDef<Config = unknown, Output = unknown> {
  name: string;
  title?: string;
  config: Config;
  run: (config: Config, ctx: TaskContext) => Promise<Output>;
}

