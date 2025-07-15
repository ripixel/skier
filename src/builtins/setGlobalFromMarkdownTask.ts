import fs from 'fs-extra';
import { marked } from 'marked';
import type { TaskDef, TaskContext } from '../types';

export interface SetGlobalFromMarkdownConfig {
  mdPath: string; // Path to markdown file
  outputVar: string; // Variable name for output HTML
}

/**
 * Reads a markdown file, converts to HTML, and outputs it as a variable for downstream tasks.
 * Example: outputVar: 'changelogHtml' => { changelogHtml: '<h1>...</h1>' }
 */
export function setGlobalFromMarkdownTask(config: SetGlobalFromMarkdownConfig): TaskDef<SetGlobalFromMarkdownConfig, { [outputVar: string]: string }> {
  return {
    name: 'set-global-from-markdown',
    title: `Set global from markdown from ${config.mdPath}`,
    config,
    run: async (cfg, ctx) => {
      const md = await fs.readFile(cfg.mdPath, 'utf8');
      const html = await marked.parse(md);
      ctx.logger.debug(`Set global from markdown: ${cfg.mdPath}`);
      return {
        [cfg.outputVar]: html,
      };
    }
  };
}
