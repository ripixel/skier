import { TaskDef } from '../taskRegistry';
import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';
import { marked } from 'marked';

export type GenerateItemisedConfig = {
  itemsDir: string; // e.g. 'items'
  partialsDir: string;
  outDir: string;
  globals?: Record<string, any>;
};

/**
 * Built-in task for generating multiple HTML pages from templates and Markdown/HTML items (e.g. blog posts, projects, etc.)
 */
export function generateItemisedTask(config: GenerateItemisedConfig): TaskDef {
  return {
    name: 'generate-itemised',
    title: `Generate itemised HTML (Markdown/HTML) from ${config.itemsDir}`,
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
      // For each section (e.g. blog, projects)
      const sectionDirs = (await fs.readdir(config.itemsDir)).filter(async (name) => {
        const stat = await fs.stat(path.join(config.itemsDir, name));
        return stat.isDirectory();
      });
      for (const section of sectionDirs) {
        const sectionPath = path.join(config.itemsDir, section);
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
              ...config.globals,
              currentSection: section,
              itemName,
              itemPath: itemFile,
              content,
            };
            const output = template(renderVars);
            const outDir = path.join(config.outDir, section);
            await fs.ensureDir(outDir);
            const outPath = path.join(outDir, itemName + '.html');
            await fs.writeFile(outPath, output, 'utf8');
            console.log(`[skier] Generated ${outPath}`);
          }
        }

        // Handle .html files (copy as-is, or optionally process with Handlebars if you want partials/globals)
        for (const itemFile of htmlFiles) {
          const itemName = path.basename(itemFile, path.extname(itemFile));
          const itemPath = path.join(sectionPath, itemFile);
          let content = await fs.readFile(itemPath, 'utf8');
          // Optionally, process .html files with Handlebars for partials/globals
          const renderVars = {
            ...config.globals,
            currentSection: section,
            itemName,
            itemPath: itemFile,
            content,
          };
          const output = Handlebars.compile(content)(renderVars);
          const outDir = path.join(config.outDir, section);
          await fs.ensureDir(outDir);
          const outPath = path.join(outDir, itemName + '.html');
          await fs.writeFile(outPath, output, 'utf8');
          console.log(`[skier] Generated ${outPath}`);
        }
      }
    }
  };
}
