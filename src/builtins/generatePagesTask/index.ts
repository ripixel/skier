import { ensureDir, readdir, readFileUtf8, writeFileUtf8 } from '../../utils/fileHelpers';
import { join, extname, basename } from '../../utils/pathHelpers';
import { marked } from 'marked';
import hljs from 'highlight.js';
import Handlebars from 'handlebars';

const renderer = new marked.Renderer();
renderer.code = (code, infostring, escaped) => {
  const lang = (infostring || '').match(/\S*/)?.[0];
  if (lang && hljs.getLanguage(lang)) {
    const highlighted = hljs.highlight(code, { language: lang }).value;
    return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
  }
  const auto = hljs.highlightAuto(code).value;
  return `<pre><code class="hljs">${auto}</code></pre>`;
};
marked.setOptions({ renderer });

/**
 * The default variables provided to every page template in generateHtmlTask
 */
export interface HtmlRenderVars {
  /** The filename of the page (without extension) */
  currentPage: string;
  /** The filename of the page (with extension) */
  currentPagePath: string;
  /** Any global variables injected by context globals or pipeline additionalVarsFn */
  [key: string]: any;
}

export interface GeneratePagesConfig {
  pagesDir: string;
  partialsDir: string;
  outDir: string;
  /**
   * Extension to scan for in pagesDir (e.g., '.html', '.hbs'). Defaults to '.html'.
   */
  pageExt?: string;
  /**
   * Optional function to inject additional variables into the render context for each page.
   * Receives all innate HtmlRenderVars.
   */
  additionalVarsFn?: (args: HtmlRenderVars) => Record<string, any> | Promise<Record<string, any>>;
}

/**
 * Built-in HTML generation task for Skier: supports partials, variables, and per-page metadata.
 */
import type { TaskDef } from '../../types';

export function generatePagesTask(
  config: GeneratePagesConfig,
): TaskDef<GeneratePagesConfig, { [outputVar: string]: string[] }> {
  return {
    name: 'generate-pages',
    title: `Generate HTML pages from ${config.pagesDir} with partials from ${config.partialsDir}`,
    config,
    run: async (cfg, ctx) => {
      // Defensive checks for required config fields
      if (!cfg.pagesDir || !cfg.partialsDir || !cfg.outDir) {
        const msg = `[skier/generate-html] Missing required config: pagesDir, partialsDir, and outDir are required. Received: pagesDir=${cfg.pagesDir}, partialsDir=${cfg.partialsDir}, outDir=${cfg.outDir}`;
        if (ctx.logger) ctx.logger.error(msg);
        throw new Error(msg);
      }
      // Patch Handlebars to warn on missing variables and undefined #each, using the logger for this run
      const origLookupProperty = (Handlebars as any).Utils.lookupProperty;
      (Handlebars as any).Utils.lookupProperty = function (
        this: any,
        parent: any,
        propertyName: string,
      ) {
        const logger = (this && this.logger) || (ctx && ctx.logger);
        if (parent == null || typeof parent !== 'object' || !(propertyName in parent)) {
          if (typeof propertyName === 'string' && propertyName !== '__proto__') {
            if (logger && typeof logger.warn === 'function') {
              logger.warn(`Template references missing variable '{{${propertyName}}}'`);
              logger.WARN(`Template references missing variable '{{${propertyName}}}'`);
            } else {
              console.warn(
                `⚠️  Skier warning: Template references missing variable '{{${propertyName}}}'`,
              );
            }
          }
        }
        return origLookupProperty.apply(this, arguments);
      };
      const origEachHelper = Handlebars.helpers.each;
      Handlebars.unregisterHelper('each');
      Handlebars.registerHelper('each', function (this: any, context, options) {
        const logger =
          (options.data && options.data.root && options.data.root.logger) || (ctx && ctx.logger);
        if (context == null || (typeof context !== 'object' && !Array.isArray(context))) {
          if (logger && typeof logger.warn === 'function') {
            logger.WARN(`#each attempted on undefined or non-iterable variable.`);
          } else {
            console.warn(
              `⚠️  Skier warning: #each attempted on undefined or non-iterable variable.`,
            );
          }
          return '';
        }
        return origEachHelper.call(this, context, options);
      });
      // Register all partials
      const partialFiles = (await readdir(cfg.partialsDir)).filter((f: string) => {
        const ext = extname(f);
        return ext === '.hbs' || ext === '.html';
      });
      for (const file of partialFiles) {
        const ext = extname(file);
        const partialName = basename(file, ext);
        const partialPath = join(cfg.partialsDir, file);
        const partialContent = await readFileUtf8(partialPath);
        Handlebars.registerPartial(partialName, partialContent);
      }

      await ensureDir(cfg.outDir);
      const pageExt = cfg.pageExt || '.html';
      const pageFiles = (await readdir(cfg.pagesDir)).filter((f: string) => extname(f) === pageExt);
      for (const file of pageFiles) {
        const pageName = basename(file, pageExt);
        const pagePath = join(cfg.pagesDir, file);
        const pageContent = await readFileUtf8(pagePath);
        const outPath = join(cfg.outDir, pageName + '.html');
        let renderVars: HtmlRenderVars = {
          ...ctx.globals,
          currentPage: pageName,
          currentPagePath: file,
        };
        if (typeof cfg.additionalVarsFn === 'function') {
          const additional = await cfg.additionalVarsFn({
            ...renderVars,
          });
          if (additional && typeof additional === 'object') {
            renderVars = { ...renderVars, ...additional };
          }
        }

        const template = Handlebars.compile(pageContent);
        const output = template(renderVars);
        await writeFileUtf8(outPath, output);
        if (ctx.logger) {
          ctx.logger.debug(`Generated ${outPath}`);
        }
      }
      return {};
    },
  };
}
