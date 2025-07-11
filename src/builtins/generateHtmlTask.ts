import { TaskDef } from '../taskRegistry';
import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';



import type { Logger } from '../logger';

export interface GenerateHtmlConfig {
  pagesDir: string;
  partialsDir: string;
  outDir: string;
  globals?: Record<string, any>;
}

/**
 * Built-in HTML generation task for Skier: supports partials, variables, and per-page metadata.
 */
export function generateHtmlTask(config: GenerateHtmlConfig): TaskDef<GenerateHtmlConfig> {
  return {
    name: 'generate-html',
    title: `Generate HTML from ${config.pagesDir} with partials from ${config.partialsDir}`,
    config,
    run: async (cfg: GenerateHtmlConfig, ctx) => {
      // Defensive checks for required config fields
      if (!cfg.pagesDir || !cfg.partialsDir || !cfg.outDir) {
        const msg = `[skier/generate-html] Missing required config: pagesDir, partialsDir, and outDir are required. Received: pagesDir=${cfg.pagesDir}, partialsDir=${cfg.partialsDir}, outDir=${cfg.outDir}`;
        if (ctx.logger) ctx.logger.error(msg);
        throw new Error(msg);
      }
      // Patch Handlebars to warn on missing variables and undefined #each, using the logger for this run
      const origLookupProperty = (Handlebars as any).Utils.lookupProperty;
      (Handlebars as any).Utils.lookupProperty = function(this: any, parent: any, propertyName: string) {
        const logger = (this && this.logger) || (ctx && ctx.logger);
        if (parent == null || typeof parent !== 'object' || !(propertyName in parent)) {
          if (typeof propertyName === 'string' && propertyName !== '__proto__') {
            if (logger && typeof logger.warn === 'function') {
              logger.warn(`Template references missing variable '{{${propertyName}}}'`);
            } else {
              console.warn(`⚠️  Skier warning: Template references missing variable '{{${propertyName}}}'`);
            }
          }
        }
        return origLookupProperty.apply(this, arguments);
      };
      const origEachHelper = Handlebars.helpers.each;
      Handlebars.unregisterHelper('each');
      Handlebars.registerHelper('each', function(this: any, context, options) {
        const logger = options.data && options.data.root && options.data.root.logger || (ctx && ctx.logger);
        if (context == null || (typeof context !== 'object' && !Array.isArray(context))) {
          if (logger && typeof logger.warn === 'function') {
            logger.warn(`#each attempted on undefined or non-iterable variable.`);
          } else {
            console.warn(`⚠️  Skier warning: #each attempted on undefined or non-iterable variable.`);
          }
          return '';
        }
        return origEachHelper.call(this, context, options);
      });
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
      // Render each page
      await fs.ensureDir(cfg.outDir);
      const pageFiles = await fs.readdir(cfg.pagesDir);
      for (const file of pageFiles) {
        if (path.extname(file) === '.html') {
          const pageName = path.basename(file, '.html');
          const pagePath = path.join(cfg.pagesDir, file);
          const outPath = path.join(cfg.outDir, file);
          let pageContent = await fs.readFile(pagePath, 'utf8');
          // (Optional) TODO: parse frontmatter for per-page variables
          // Compose render context
          const renderVars = {
            ...cfg.globals,
            currentPage: pageName,
            currentPagePath: file,
            logger: ctx.logger,
          };
          const template = Handlebars.compile(pageContent);
          const output = template(renderVars);
          await fs.writeFile(outPath, output, 'utf8');
          if (ctx.logger) {
            ctx.logger.task(`Generated ${outPath}`);
          }
        }
      }
      return {};
    }
  };
}
