import { TaskDef } from '../taskRegistry';
import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';
import { marked } from 'marked';

import type { Logger } from '../logger';

export interface GenerateItemisedConfig {
  itemsDir: string; // e.g. 'items'
  partialsDir: string;
  outDir: string;
  outputVar: string; // Name of the variable to output the item list as
  globals?: Record<string, any>;
}

/**
 * Built-in task for generating multiple HTML pages from templates and Markdown/HTML items (e.g. blog posts, projects, etc.)
 */
export function generateItemisedTask(config: GenerateItemisedConfig): TaskDef<GenerateItemisedConfig> {
  return {
    name: 'generate-itemised',
    title: `Generate itemised HTML (Markdown/HTML) from ${config.itemsDir}`,
    config,
    run: async (cfg: GenerateItemisedConfig, ctx) => {
      const generatedItems: Array<Record<string, any>> = [];
      // Register all partials
      const partialFiles = await fs.readdir(cfg.partialsDir);
      for (const file of partialFiles) {
        if (path.extname(file) === '.html') {
          const partialName = path.basename(file, '.html');
          const partialPath = path.join(cfg.partialsDir, file);
          const partialContent = await fs.readFile(partialPath, 'utf8');
          Handlebars.registerPartial(partialName, partialContent);
        }
      }
      // For each section (e.g. blog, projects)
      const allSectionNames = await fs.readdir(cfg.itemsDir);
      const sectionDirs: string[] = [];
      for (const name of allSectionNames) {
        const stat = await fs.stat(path.join(cfg.itemsDir, name));
        if (stat.isDirectory()) sectionDirs.push(name);
      }
      for (const section of sectionDirs) {
        const sectionPath = path.join(cfg.itemsDir, section);
        const templatePath = path.join(sectionPath, 'template.html');
        const hasTemplate = await fs.pathExists(templatePath);
        const itemFiles = (await fs.readdir(sectionPath)).filter(f => f !== 'template.html' && (f.endsWith('.md') || f.endsWith('.html')));
        const mdFiles = itemFiles.filter(f => f.endsWith('.md'));
        const htmlFiles = itemFiles.filter(f => f.endsWith('.html'));

        if (!hasTemplate && mdFiles.length > 0) {
          throw new Error(`[skier] No template.html found in ${sectionPath}, but found Markdown files. Markdown items require a template.`);
        }

        // Handle .md files (only if template exists)
        if (hasTemplate) {
          const templateContent = await fs.readFile(templatePath, 'utf8');
          const template = Handlebars.compile(templateContent);
          for (const itemFile of mdFiles) {
            const itemName = path.basename(itemFile, path.extname(itemFile));
            const itemPath = path.join(sectionPath, itemFile);
            let content = await fs.readFile(itemPath, 'utf8');
            content = await marked(content);
            const renderVars = {
              ...cfg.globals,
              currentSection: section,
              itemName,
              itemPath: itemFile,
              content,
              logger: ctx.logger,
            };
            const output = template(renderVars);
            const outDir = path.join(cfg.outDir, section);
            await fs.ensureDir(outDir);
            const outPath = path.join(outDir, itemName + '.html');
            await fs.writeFile(outPath, output, 'utf8');
            generatedItems.push({
              section,
              itemName,
              itemPath,
              outPath,
              type: 'md',
            });
            if (ctx.logger) {
              ctx.logger.task(`Generated ${outPath}`);
            }
          }
          // Handle .html files (copy as-is, or process with template if desired)
          for (const itemFile of htmlFiles) {
            const itemName = path.basename(itemFile, '.html');
            const itemPath = path.join(sectionPath, itemFile);
            let content = await fs.readFile(itemPath, 'utf8');
            // Optionally process with template, or just copy as-is
            const renderVars = {
              ...cfg.globals,
              currentSection: section,
              itemName,
              itemPath: itemFile,
              content,
              logger: ctx.logger,
            };
            // If you want to process .html files with the template, uncomment below:
            // const output = template(renderVars);
            // Otherwise, just use the content as is:
            const output = content;
            const outDir = path.join(cfg.outDir, section);
            await fs.ensureDir(outDir);
            const outPath = path.join(outDir, itemName + '.html');
            await fs.writeFile(outPath, output, 'utf8');
            generatedItems.push({
              section,
              itemName,
              itemPath,
              outPath,
              type: 'html',
            });
            if (ctx.logger) {
              ctx.logger.task(`Generated ${outPath}`);
            }
          }
        }
      }
      return { [cfg.outputVar]: generatedItems };
    }
  };
}
