import { TaskDef } from '../taskRegistry';
import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';

export type GenerateHtmlConfig = {
  pagesDir: string;
  partialsDir: string;
  outDir: string;
  globals?: Record<string, any>;
};

/**
 * Built-in HTML generation task for Skier: supports partials, variables, and per-page metadata.
 */
export function generateHtmlTask(config: GenerateHtmlConfig): TaskDef {
  return {
    name: 'generate-html',
    title: `Generate HTML from ${config.pagesDir} with partials from ${config.partialsDir}`,
    run: async () => {
      // Register all partials
      const partialFiles = await fs.readdir(config.partialsDir);
      for (const file of partialFiles) {
        if (path.extname(file) === '.html') {
          const partialName = path.basename(file, '.html');
          const partialPath = path.join(config.partialsDir, file);
          const partialContent = await fs.readFile(partialPath, 'utf8');
          Handlebars.registerPartial(partialName, partialContent);
        }
      }
      // Render each page
      await fs.ensureDir(config.outDir);
      const pageFiles = await fs.readdir(config.pagesDir);
      for (const file of pageFiles) {
        if (path.extname(file) === '.html') {
          const pageName = path.basename(file, '.html');
          const pagePath = path.join(config.pagesDir, file);
          const outPath = path.join(config.outDir, file);
          let pageContent = await fs.readFile(pagePath, 'utf8');
          // (Optional) TODO: parse frontmatter for per-page variables
          // Compose render context
          const renderVars = {
            ...config.globals,
            currentPage: pageName,
            currentPagePath: file,
          };
          const template = Handlebars.compile(pageContent);
          const output = template(renderVars);
          await fs.writeFile(outPath, output, 'utf8');
          console.log(`[skier] Generated ${outPath}`);
        }
      }
    }
  };
}
