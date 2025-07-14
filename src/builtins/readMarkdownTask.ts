import fs from 'fs-extra';
import { marked } from 'marked';
import type { TaskDef, TaskContext } from '../types';

export interface ReadMarkdownConfig {
  mdPath: string; // Path to markdown file
  outputVar: string; // Variable name for output HTML
}

/**
 * Reads a markdown file, converts to HTML, and outputs it as a variable for downstream tasks.
 * Example: outputVar: 'changelogHtml' => { changelogHtml: '<h1>...</h1>' }
 */
export function readMarkdownTask(config: ReadMarkdownConfig): TaskDef<ReadMarkdownConfig, { [outputVar: string]: string }> {
  return {
    name: 'read-markdown',
    title: `Read and convert markdown from ${config.mdPath}`,
    config,
    run: async (cfg: ReadMarkdownConfig, ctx: TaskContext) => {
      const md = await fs.readFile(cfg.mdPath, 'utf8');
      const html = await marked.parse(md);
      ctx.logger.debug(`Read and converted markdown: ${cfg.mdPath}`);
      return {
        [cfg.outputVar]: html,
      };
    }
  };
}
