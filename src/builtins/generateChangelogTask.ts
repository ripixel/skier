import fs from 'fs-extra';
import path from 'path';
import { marked } from 'marked';
import Handlebars from 'handlebars';
import type { TaskDef, TaskContext } from '../types';

export interface GenerateChangelogConfig {
  changelogPath: string; // Path to CHANGELOG.md
  templatePath: string; // Path to HTML template (Handlebars)
  outDir: string; // Output directory for changelog.html
  outFile?: string; // Output filename, default: 'changelog.html'
  partialsDir?: string; // Optional partials directory
}

export function generateChangelogTask(config: GenerateChangelogConfig): TaskDef<GenerateChangelogConfig> {
  return {
    name: 'generate-changelog',
    title: `Generate changelog HTML from ${config.changelogPath}`,
    config,
    run: async (cfg: GenerateChangelogConfig, ctx: TaskContext) => {
      // Register partials if provided
      if (cfg.partialsDir) {
        const partialFiles = await fs.readdir(cfg.partialsDir);
        for (const file of partialFiles) {
          if (path.extname(file) === '.html') {
            const partialName = path.basename(file, '.html');
            const partialPath = path.join(cfg.partialsDir, file);
            const partialContent = await fs.readFile(partialPath, 'utf8');
            Handlebars.registerPartial(partialName, partialContent);
          }
        }
      }
      // Read and convert CHANGELOG.md
      const md = await fs.readFile(cfg.changelogPath, 'utf8');
      const changelogHtml = marked.parse(md);
      // Read template
      const templateSrc = await fs.readFile(cfg.templatePath, 'utf8');
      const template = Handlebars.compile(templateSrc);
      // Render
      const html = template({ changelog: changelogHtml });
      await fs.ensureDir(cfg.outDir);
      const outFile = cfg.outFile || 'changelog.html';
      const outPath = path.join(cfg.outDir, outFile);
      await fs.writeFile(outPath, html, 'utf8');
      if (ctx.logger) ctx.logger.info(`Generated changelog at ${outPath}`);
    }
  };
}
