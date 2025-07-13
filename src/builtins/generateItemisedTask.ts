import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';
import { marked } from 'marked';
import { SkierItem } from '../types';

import type { Logger } from '../logger';

export interface GenerateItemisedConfig {
  itemsDir: string; // e.g. 'items'
  partialsDir: string;
  outDir: string;
  outputVar: string; // Name of the variable to output the item list as
  /**
   * Optional user override for date extraction. Receives (args: { section, itemName, itemPath, content, fileStat })
   * and should return a Date, string, or undefined.
   */
  extractDate?: (args: { section: string, itemName: string, itemPath: string, content: string, fileStat: import('fs-extra').Stats }) => Date | string | undefined;
}

/**
 * Built-in task for generating multiple HTML pages from templates and Markdown/HTML items (e.g. blog posts, projects, etc.)
 */
import type { TaskContext, TaskDef } from '../types';

export function generateItemisedTask(config: GenerateItemisedConfig): TaskDef<GenerateItemisedConfig, { [outputVar: string]: SkierItem[] }> {
  return {
    name: 'generate-itemised',
    title: `Generate itemised HTML (Markdown/HTML) from ${config.itemsDir}`,
    config,
    run: async (cfg: GenerateItemisedConfig, ctx: TaskContext) => {
      // TODO: When extracting item metadata, ensure fields like date, dateObj, dateNum are included if available.
      const generatedItems: SkierItem[] = [];

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
            let rawMarkdown = await fs.readFile(itemPath, 'utf8');
            // Metadata variables for this item
            // Metadata variables for this item
            let date: string | undefined;
            let dateObj: Date | undefined;
            let title: string | undefined;
            let excerpt: string | undefined;
            let body: string;
            let fileStat: import('fs-extra').Stats;
            // Assignments only, no redeclaration below
            date = undefined;
            dateObj = undefined;
            title = undefined;
            excerpt = undefined;
            body = rawMarkdown;
            fileStat = await fs.stat(itemPath);
            // 1. User override
            if (typeof cfg.extractDate === 'function') {
              const userDate = cfg.extractDate({ section, itemName, itemPath, content: rawMarkdown, fileStat });
              if (userDate instanceof Date && !isNaN(userDate.getTime())) {
                dateObj = userDate;
                date = userDate.toISOString();
              } else if (typeof userDate === 'string') {
                const d = new Date(userDate);
                if (!isNaN(d.getTime())) {
                  dateObj = d;
                  date = d.toISOString();
                }
              }
            }
            // 2. Markdown frontmatter (if not set by override)
            if (!dateObj && rawMarkdown.startsWith('---')) {
              const fmMatch = rawMarkdown.match(/^---\n([\s\S]*?)---/);
              if (fmMatch) {
                const fm = fmMatch[1];
                const dateLine = fm.split('\n').find(line => line.trim().startsWith('date:'));
                if (dateLine) {
                  const dateVal = dateLine.split(':').slice(1).join(':').trim();
                  const d = new Date(dateVal);
                  if (!isNaN(d.getTime())) {
                    dateObj = d;
                    date = d.toISOString();
                  }
                }
              }
            }
            // 3. Filename convention (YYYY-MM-DD)
            if (!dateObj) {
              const fileDateMatch = itemFile.match(/(\d{4}-\d{2}-\d{2})/);
              if (fileDateMatch) {
                const d = new Date(fileDateMatch[1]);
                if (!isNaN(d.getTime())) {
                  dateObj = d;
                  date = d.toISOString();
                }
              }
            }
            // 4. Fallback to mtime
            if (!dateObj && fileStat) {
              dateObj = fileStat.mtime;
              date = fileStat.mtime.toISOString();
            }
            // Extract title and excerpt from frontmatter if present
            if (rawMarkdown.startsWith('---')) {
              const fmMatch = rawMarkdown.match(/^---\n([\s\S]*?)---/);
              if (fmMatch) {
                const fm = fmMatch[1];
                const titleLine = fm.split('\n').find(line => line.trim().startsWith('title:'));
                if (titleLine) {
                  title = titleLine.split(':').slice(1).join(':').trim();
                }
                const excerptLine = fm.split('\n').find(line => line.trim().startsWith('excerpt:'));
                if (excerptLine) {
                  excerpt = await marked(excerptLine.split(':').slice(1).join(':').trim());
                }
              }
            }
            if (!title) {
              // If date was extracted from filename, strip it from itemName before prettifying
              let nameForTitle = itemName;
              const datePrefixMatch = nameForTitle.match(/^\d{4}-\d{2}-\d{2}[-_]?(.+)$/);
              if (datePrefixMatch) {
                nameForTitle = datePrefixMatch[1];
              }
              title = nameForTitle.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            }
            // Fallback: auto-excerpt from first two non-empty paragraphs if not provided in frontmatter
            if (!excerpt) {
              // Remove frontmatter if present
              let mdForExcerpt = rawMarkdown;
              if (mdForExcerpt.startsWith('---')) {
                const fmEnd = mdForExcerpt.indexOf('---', 3);
                if (fmEnd !== -1) {
                  mdForExcerpt = mdForExcerpt.slice(fmEnd + 3);
                }
              }
              // Find first two non-empty paragraphs
              const paragraphs = mdForExcerpt.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
              if (paragraphs.length > 0) {
                excerpt = await marked(paragraphs.slice(0, 2).map(p => p.replace(/^#+\s*/, '').replace(/^>+\s*/, '').replace(/^\*+\s*/, '')).join('\n\n'));
              }
            }
            // Now render markdown to HTML for body
            let content = await marked(rawMarkdown);
            const renderVars = {
              ...ctx.globals,
              currentSection: section,
              itemName,
              itemPath: itemFile,
              content,
            };
            const output = template(renderVars);
            const outDir = path.join(cfg.outDir, section);
            await fs.ensureDir(outDir);
            const outPath = path.join(outDir, itemName + '.html');
            await fs.writeFile(outPath, output, 'utf8');
            if (!title) {
              // If date was extracted from filename, strip it from itemName before prettifying
              let nameForTitle = itemName;
              const datePrefixMatch = nameForTitle.match(/^(\d{4}-\d{2}-\d{2})[-_]?(.+)$/);
              if (datePrefixMatch) {
                nameForTitle = datePrefixMatch[1];
              }
              title = nameForTitle.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            }
            // Fallback: auto-excerpt from first two non-empty paragraphs if not provided in frontmatter
            if (!excerpt) {
              // Remove frontmatter if present
              let mdForExcerpt = content;
              if (mdForExcerpt.startsWith('---')) {
                const fmEnd = mdForExcerpt.indexOf('---', 3);
                if (fmEnd !== -1) {
                  mdForExcerpt = mdForExcerpt.slice(fmEnd + 3);
                }
              }
              // Find first two non-empty paragraphs
              const paragraphs = mdForExcerpt.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
              if (paragraphs.length > 0) {
                // Take first two, strip leading markdown formatting
                excerpt = paragraphs.slice(0, 2).map(p => p.replace(/^#+\s*/, '').replace(/^>+\s*/, '').replace(/^\*+\s*/, '')).join('\n\n');
              }
            }
            // Link: output path relative to site root
            const relLink = `/${section}/${itemName}.html`;
            generatedItems.push({
              section,
              itemName,
              itemPath,
              outPath,
              relativePath: path.relative(cfg.outDir, outPath),
              type: 'md',
              date,
              dateObj,
              dateDisplay: dateObj ? dateObj.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined,
              title,
              excerpt,
              body,
              link: relLink,
            });
            ctx.logger.debug(`Generated ${outPath}`);
          }
          // Handle .html files (copy as-is, or process with template if desired)
          for (const itemFile of htmlFiles) {
            const itemName = path.basename(itemFile, '.html');
            const itemPath = path.join(sectionPath, itemFile);
            let content = await fs.readFile(itemPath, 'utf8');
            // Optionally process with template, or just copy as-is
            const renderVars = {
              ...ctx.globals,
              currentSection: section,
              itemName,
              itemPath: itemFile,
              content,
            };
            // If you want to process .html files with the template, uncomment below:
            // const output = template(renderVars);
            // Otherwise, just use the content as is:
            const output = content;
            const outDir = path.join(cfg.outDir, section);
            await fs.ensureDir(outDir);
            const outPath = path.join(outDir, itemName + '.html');
            await fs.writeFile(outPath, output, 'utf8');
            // --- Multi-source date extraction for HTML ---
            // Declare metadata variables for this item only once
            let date: string | undefined;
            let dateObj: Date | undefined;
            let title: string | undefined;
            let excerpt: string | undefined;
            let body: string;
            let fileStat: import('fs-extra').Stats;
            date = undefined;
            dateObj = undefined;
            title = undefined;
            excerpt = undefined;
            body = content;
            fileStat = await fs.stat(itemPath);
            // 1. User override
            if (typeof cfg.extractDate === 'function') {
              const userDate = cfg.extractDate({ section, itemName, itemPath, content, fileStat });
              if (userDate instanceof Date && !isNaN(userDate.getTime())) {
                dateObj = userDate;
                date = userDate.toISOString();
              } else if (typeof userDate === 'string') {
                const d = new Date(userDate);
                if (!isNaN(d.getTime())) {
                  dateObj = d;
                  date = d.toISOString();
                }
              }
            }
            // 2. Filename convention (YYYY-MM-DD)
            if (!dateObj) {
              const fileDateMatch = itemFile.match(/(\d{4}-\d{2}-\d{2})/);
              if (fileDateMatch) {
                const d = new Date(fileDateMatch[1]);
                if (!isNaN(d.getTime())) {
                  dateObj = d;
                  date = d.toISOString();
                }
              }
            }
            // 3. Fallback to mtime
            if (!dateObj && fileStat) {
              dateObj = fileStat.mtime;
              date = fileStat.mtime.toISOString();
            }
            // Extract title from <title> tag if present, else prettify itemName
            const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
            if (titleMatch) {
              title = titleMatch[1].trim();
            }
            if (!title) {
              title = itemName.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            }
            // Link: output path relative to site root
            const relLink = `/${section}/${itemName}.html`;
            generatedItems.push({
              section,
              itemName,
              itemPath,
              outPath,
              type: 'html',
              date,
              dateObj,
              title,
              excerpt,
              body,
              link: relLink,
            });
            ctx.logger.debug(`Generated ${outPath}`);
          }
        }
      }
      return { [cfg.outputVar]: generatedItems };
    }
  };
}
