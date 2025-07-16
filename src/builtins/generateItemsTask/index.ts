import Handlebars from 'handlebars';
import { renderMarkdown } from '../../utils/markdown';
import { ensureDir, readFileUtf8, writeFileUtf8, readdir, stat } from '../../utils/fileHelpers';
import { titleFromFilename, excerptFromMarkdown } from '../../utils/stringUtils';
import { formatDateDisplay } from '../../utils/dateUtils';
import { SkierItem, TaskDef } from '../../types';
import { extname, basename, join, relativePath } from '../../utils/pathHelpers';
import { findMarkdownFiles, findNearestTemplate } from './recursiveUtils';
import { rewriteLinks } from '../../utils/linkRewrite';

/**
 * The default variables provided to every item template in generateItemisedTask
 */
export interface ItemisedRenderVars {
  /** Section name (e.g. 'thoughts', 'blog', etc) */
  section: string;
  /** Item name (filename without extension) */
  itemName: string;
  /** Absolute path to the item file */
  itemPath: string;
  /** Output HTML path for this item */
  outPath: string;
  /** Path to output relative to outDir */
  relativePath: string;
  /** Title (from frontmatter, filename, or user logic) */
  title?: string;
  /** Date (ISO string, from frontmatter, filename, or file stat) */
  date?: string;
  /** Date object, if available */
  dateObj?: Date;
  /** Human-readable date string, if available */
  dateDisplay?: string;
  /** Excerpt, if available */
  excerpt?: string;
  /** Raw markdown body (HTML) */
  body: string;
  /** Link to this item (relative to site root) */
  link: string;
  /** Rendered HTML content */
  content: string;
  /** Any global variables injected by context globals or pipeline additionalVarsFn */
  [key: string]: any;
}

export interface GenerateItemsConfig {
  /**
   * Optional link rewriting config for Markdown output. If provided, all internal links will be rewritten accordingly.
   * - stripPrefix: string or string[] of prefixes to remove from hrefs (e.g. '/docs', 'docs/')
   * - fromExt: extension to replace (default: '.md')
   * - toExt: extension to use in output (default: '.html')
   * - rootRelative: if true, ensures links start with '/'
   */
  linkRewrite?: {
    stripPrefix?: string | string[];
    fromExt?: string;
    toExt?: string;
    rootRelative?: boolean;
    prefix?: string;
  };

  /** Extension for section templates (default: .html) */
  templateExtension?: string;
  /** Extension for partials (default: .html) */
  partialExtension?: string;
  /** If true, treat all files in itemsDir as items (no sections). Default: false */
  flatStructure?: boolean;
  /** Custom frontmatter parser: (raw: string) => { [key: string]: any } */
  frontmatterParser?: (raw: string) => Record<string, any>;
  /** Custom excerpt extractor: (raw: string, meta: any) => string | Promise<string> */
  excerptFn?: (raw: string, meta: any) => string | Promise<string>;
  /** Custom sorting function for items */
  sortFn?: (a: SkierItem, b: SkierItem) => number;
  /** Custom link generator: (args: { section, itemName, meta }) => string */
  linkFn?: (args: { section: string; itemName: string; meta: any }) => string;
  /** Custom output path generator: (args: { section, itemName, meta }) => string */
  outputPathFn?: (args: { section: string; itemName: string; meta: any }) => string;
  /** Custom markdown renderer: (md: string) => string | Promise<string> */
  markdownRenderer?: (md: string) => string | Promise<string>;

  itemsDir: string; // e.g. 'items'
  partialsDir: string;
  outDir: string;
  outputVar: string; // Name of the variable to output the item list as
  /**
   * Optional user override for date extraction. Receives (args: { section, itemName, itemPath, content, fileStat })
   * and should return a Date, string, or undefined.
   */
  extractDate?: (args: {
    section: string;
    itemName: string;
    itemPath: string;
    content: string;
    fileStat: import('fs-extra').Stats;
  }) => Date | string | undefined;
  /**
   * Optional function to inject additional variables into the render context for each item.
   * Receives all innate ItemisedRenderVars.
   */
  additionalVarsFn?: (
    args: ItemisedRenderVars,
  ) => Record<string, any> | Promise<Record<string, any>>;
}

/**
 * Built-in task for generating multiple HTML pages from templates and Markdown/HTML items (e.g. blog posts, projects, etc.)
 */
export function generateItemsTask(
  config: GenerateItemsConfig,
): TaskDef<GenerateItemsConfig, { [outputVar: string]: SkierItem[] }> {
  return {
    name: 'generate-items',
    title: `Generate HTML items (Markdown/HTML) from ${config.itemsDir}`,
    config,
    run: async (cfg, ctx) => {
      // TODO: When extracting item metadata, ensure fields like date, dateObj, dateNum are included if available.
      const generatedItems: SkierItem[] = [];

      // Register all partials (configurable extension)
      const partialExt = cfg.partialExtension ?? '.html';
      const partialFiles = (await readdir(cfg.partialsDir)).filter(
        (file) => extname(file) === partialExt,
      );
      for (const file of partialFiles) {
        const partialName = basename(file, partialExt);
        const partialPath = join(cfg.partialsDir, file);
        const partialContent = await readFileUtf8(partialPath);
        Handlebars.registerPartial(partialName, partialContent);
      }

      // --- BEGIN RECURSIVE REFACTOR ---
      // Only declare templateExt ONCE for the whole function
      const templateExt = cfg.templateExtension ?? '.html';
      const markdownFiles = await findMarkdownFiles(cfg.itemsDir);
      if (markdownFiles.length === 0) {
        ctx.logger.warn(`No markdown files found in ${cfg.itemsDir}`);
        return { [cfg.outputVar]: [] };
      }
      for (const md of markdownFiles) {
        ctx.logger.debug(`Found markdown file: absPath=${md.absPath}, relPath=${md.relPath}`);
        const itemPath = md.absPath;
        const itemName = basename(md.absPath, extname(md.absPath));
        const section = cfg.flatStructure ? '' : md.dir.replace(/\\/g, '/');
        let outPath: string;
        if (typeof cfg.outputPathFn === 'function') {
          outPath = cfg.outputPathFn({ section, itemName, meta: {} });
        } else if (cfg.flatStructure) {
          await ensureDir(cfg.outDir);
          outPath = join(cfg.outDir, itemName + '.html');
        } else {
          const outDir = md.dir ? join(cfg.outDir, md.dir) : cfg.outDir;
          await ensureDir(outDir);
          outPath = join(outDir, itemName + '.html');
        }
        // Find nearest template up the tree
        const absDir = join(cfg.itemsDir, md.dir);
        const templatePath = await findNearestTemplate(absDir, cfg.itemsDir, templateExt);
        if (templatePath) {
          ctx.logger.debug(`Using template: ${templatePath} for ${md.relPath}`);
        } else {
          ctx.logger.debug(`No template found for ${md.relPath}, skipping.`);
          continue;
        }
        const templateContent = await readFileUtf8(templatePath);
        const template = Handlebars.compile(templateContent);
        let rawMarkdown = await readFileUtf8(itemPath);
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
        body = rawMarkdown;
        fileStat = await stat(itemPath);
        // 1. User override
        if (typeof cfg.extractDate === 'function') {
          const userDate = cfg.extractDate({
            section,
            itemName,
            itemPath,
            content: rawMarkdown,
            fileStat,
          });
          if (userDate instanceof Date) {
            dateObj = userDate;
            date = userDate.toISOString();
          } else if (typeof userDate === 'string') {
            date = userDate;
            dateObj = new Date(userDate);
          }
        }
        // 2. Markdown frontmatter (if not set by override)
        let frontmatter: Record<string, any> = {};
        if (!dateObj && rawMarkdown.startsWith('---')) {
          if (typeof cfg.frontmatterParser === 'function') {
            frontmatter = cfg.frontmatterParser(rawMarkdown);
            if (frontmatter.date) {
              const d = new Date(frontmatter.date);
              if (!isNaN(d.getTime())) {
                dateObj = d;
                date = d.toISOString();
              }
            }
          } else {
            const fmMatch = rawMarkdown.match(/^---\n([\s\S]*?)---/);
            if (fmMatch) {
              const fm = fmMatch[1];
              const dateLine = fm.split('\n').find((line) => line.trim().startsWith('date:'));
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
        }
        // 3. Filename convention (YYYY-MM-DD)
        if (!dateObj) {
          const fileDateMatch = itemName.match(/(\d{4}-\d{2}-\d{2})/);
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
          if (frontmatter.title) {
            title = frontmatter.title;
          }
          if (frontmatter.excerpt) {
            excerpt =
              typeof frontmatter.excerpt === 'string'
                ? await renderMarkdown(frontmatter.excerpt)
                : undefined;
            if (excerpt && cfg.linkRewrite) {
              excerpt = rewriteLinks(excerpt, cfg.linkRewrite);
            }
          }
        }
        if (!title) {
          let nameForTitle = itemName;
          const datePrefixMatch = nameForTitle.match(/^\d{4}-\d{2}-\d{2}[-_]?(.+)$/);
          if (datePrefixMatch) {
            nameForTitle = datePrefixMatch[1];
          }
          title = titleFromFilename(nameForTitle);
        }
        // Fallback: auto-excerpt from first two non-empty paragraphs if not provided in frontmatter
        if (!excerpt) {
          if (typeof cfg.excerptFn === 'function') {
            excerpt = await cfg.excerptFn(rawMarkdown, frontmatter);
          } else {
            excerpt = await excerptFromMarkdown(rawMarkdown);
          }
        }
        // Now render markdown to HTML for body
        let content: string;
        if (typeof cfg.markdownRenderer === 'function') {
          content = await cfg.markdownRenderer(rawMarkdown);
        } else {
          content = await renderMarkdown(rawMarkdown);
        }
        // If linkRewrite is configured, rewrite links in rendered HTML
        if (cfg.linkRewrite) {
          let linkRewriteOpts = { ...cfg.linkRewrite };
          // For sectioned docs, prefix all relative links with section path unless they start with '../', '/', or a protocol
          if (!cfg.flatStructure && section) {
            linkRewriteOpts.prefix = '/' + section.replace(/^\/+|\/+$/g, '');
            // But do not prefix if link starts with '../', '/', or protocol (handled in linkRewrite)
          } else {
            delete linkRewriteOpts.prefix;
          }
          content = rewriteLinks(content, linkRewriteOpts);
        }
        // Output path and link configurable
        let finalOutPath: string = outPath;
        if (typeof cfg.outputPathFn === 'function') {
          finalOutPath = cfg.outputPathFn({ section, itemName, meta: frontmatter });
        }
        const relPath = relativePath(cfg.outDir, finalOutPath);
        let renderVars: ItemisedRenderVars = {
          ...ctx.globals,
          section,
          itemName,
          itemPath,
          outPath: finalOutPath,
          relativePath: relPath,
          title,
          date,
          dateObj,
          dateDisplay: dateObj ? formatDateDisplay(dateObj) : undefined,
          excerpt,
          body,
          link:
            typeof cfg.linkFn === 'function'
              ? cfg.linkFn({ section, itemName, meta: frontmatter })
              : `/${section ? section + '/' : ''}${itemName}.html`,
          content,
        };
        // If user provided, call additionalVarsFn with all innate fields and ctx
        if (typeof cfg.additionalVarsFn === 'function') {
          const additional = await cfg.additionalVarsFn({
            ...renderVars,
          });
          if (additional && typeof additional === 'object') {
            renderVars = { ...renderVars, ...additional };
          }
        }
        const output = template(renderVars);
        await writeFileUtf8(finalOutPath, output);
        generatedItems.push({
          section,
          itemName,
          itemPath,
          outPath: finalOutPath,
          relativePath: relPath,
          type: 'md',
          date,
          dateObj,
          dateDisplay: dateObj ? formatDateDisplay(dateObj) : undefined,
          title,
          excerpt,
          body,
          link: renderVars.link,
        });
        ctx.logger.debug(`Generated ${finalOutPath}`);
      }
      // Sort items (configurable)
      if (typeof cfg.sortFn === 'function') {
        generatedItems.sort(cfg.sortFn);
      } else {
        // Default: reverse chronologically
        generatedItems.sort((a, b) => {
          if (!a.dateObj || !b.dateObj) return 0;
          return b.dateObj.getTime() - a.dateObj.getTime();
        });
      }
      return { [cfg.outputVar]: generatedItems };
    },
  };
}
