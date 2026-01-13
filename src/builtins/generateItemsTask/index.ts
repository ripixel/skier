import { renderMarkdown } from '../../utils/markdown';
import { ensureDir, readFileUtf8, writeFileUtf8, stat } from '../../utils/fileHelpers';
import { titleFromFilename, excerptFromMarkdown } from '../../utils/stringUtils';
import { formatDateDisplay } from '../../utils/dateUtils';
import { SkierItem, TaskDef } from '../../types';
import { extname, basename, join, relativePath } from '../../utils/pathHelpers';
import { findMarkdownFiles, findNearestTemplate } from './recursiveUtils';
import { rewriteLinks } from '../../utils/linkRewrite';
import { validateRequiredConfig } from '../../utils/errors';
import { setupHandlebarsEnvironment } from '../../utils/handlebars';

/**
 * Frontmatter data structure.
 */
export interface FrontmatterData {
  title?: string;
  date?: string;
  excerpt?: string;
  [key: string]: unknown;
}

/**
 * The default variables provided to every item template in generateItemsTask.
 */
export interface ItemisedRenderVars extends Record<string, unknown> {
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
}

/**
 * Link rewrite configuration.
 */
export interface LinkRewriteConfig {
  stripPrefix?: string | string[];
  fromExt?: string;
  toExt?: string;
  rootRelative?: boolean;
  prefix?: string;
}

/**
 * Arguments for custom functions.
 */
export interface ItemFunctionArgs {
  section: string;
  itemName: string;
  itemPath: string;
  content: string;
  fileStat: import('fs-extra').Stats;
}

export interface GenerateItemsConfig {
  /** Directory containing markdown/HTML items */
  itemsDir: string;
  /** Directory containing partials */
  partialsDir: string;
  /** Output directory */
  outDir: string;
  /** Name of the variable to output the item list as */
  outputVar: string;

  /** Optional link rewriting config for Markdown output */
  linkRewrite?: LinkRewriteConfig;
  /** Extension for section templates (default: .html) */
  templateExtension?: string;
  /** Extension for partials (default: .html) */
  partialExtension?: string;
  /** If true, treat all files in itemsDir as items (no sections). Default: false */
  flatStructure?: boolean;

  /** Custom frontmatter parser */
  frontmatterParser?: (raw: string) => FrontmatterData;
  /** Custom excerpt extractor */
  excerptFn?: (raw: string, meta: FrontmatterData) => string | Promise<string>;
  /** Custom sorting function for items */
  sortFn?: (a: SkierItem, b: SkierItem) => number;
  /** Custom link generator */
  linkFn?: (args: { section: string; itemName: string; meta: FrontmatterData }) => string;
  /** Custom output path generator */
  outputPathFn?: (args: { section: string; itemName: string; meta: FrontmatterData }) => string;
  /** Custom markdown renderer */
  markdownRenderer?: (md: string) => string | Promise<string>;
  /** User override for date extraction */
  extractDate?: (args: ItemFunctionArgs) => Date | string | undefined;
  /** Optional function to inject additional variables per item */
  additionalVarsFn?: (args: ItemisedRenderVars) => Record<string, unknown> | Promise<Record<string, unknown>>;
}

/**
 * Parses simple YAML frontmatter from markdown content.
 */
function parseSimpleFrontmatter(raw: string): FrontmatterData {
  const frontmatter: FrontmatterData = {};
  if (!raw.startsWith('---')) return frontmatter;

  const fmMatch = raw.match(/^---\n([\s\S]*?)---/);
  const fm = fmMatch?.[1];
  if (!fm) return frontmatter;

  const lines = fm.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      frontmatter[key] = value;
    }
  }
  return frontmatter;
}

/**
 * Extracts date from frontmatter.
 */
function extractDateFromFrontmatter(frontmatter: FrontmatterData): Date | undefined {
  if (frontmatter['date']) {
    const d = new Date(frontmatter['date'] as string);
    if (!isNaN(d.getTime())) return d;
  }
  return undefined;
}

function extractDateFromFilename(itemName: string): Date | undefined {
  const fileDateMatch = itemName.match(/(\d{4}-\d{2}-\d{2})/);
  const dateStr = fileDateMatch?.[1];
  if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
  }
  return undefined;
}

/**
 * Built-in task for generating multiple HTML pages from templates and Markdown/HTML items.
 * Uses an isolated Handlebars environment.
 */
export function generateItemsTask(
  config: GenerateItemsConfig,
): TaskDef<GenerateItemsConfig, Record<string, SkierItem[]>> {
  return {
    name: 'generate-items',
    title: `Generate HTML items (Markdown/HTML) from ${config.itemsDir}`,
    config,
    run: async (cfg, ctx) => {
      // Validate required config
      validateRequiredConfig(ctx, 'generate-items', cfg, [
        'itemsDir',
        'partialsDir',
        'outDir',
        'outputVar',
      ]);

      const generatedItems: SkierItem[] = [];

      // Setup isolated Handlebars environment
      const partialExt = cfg.partialExtension ?? '.html';
      const handlebars = await setupHandlebarsEnvironment(cfg.partialsDir, ctx.logger, [
        partialExt,
        '.hbs',
      ]);

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

        // Determine output path
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

        // Find template
        const absDir = join(cfg.itemsDir, md.dir);
        const templatePath = await findNearestTemplate(absDir, cfg.itemsDir, templateExt);

        if (templatePath) {
          ctx.logger.debug(`Using template: ${templatePath} for ${md.relPath}`);
        } else {
          ctx.logger.debug(`No template found for ${md.relPath}, skipping.`);
          continue;
        }

        const templateContent = await readFileUtf8(templatePath);
        const template = handlebars.compile(templateContent);

        const rawMarkdown = await readFileUtf8(itemPath);
        const fileStat = await stat(itemPath);

        // Parse frontmatter
        let frontmatter: FrontmatterData;
        if (typeof cfg.frontmatterParser === 'function') {
          frontmatter = cfg.frontmatterParser(rawMarkdown);
        } else {
          frontmatter = parseSimpleFrontmatter(rawMarkdown);
        }

        // Extract date with priority: user override > frontmatter > filename > mtime
        let dateObj: Date | undefined;
        let date: string | undefined;

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

        if (!dateObj) {
          dateObj = extractDateFromFrontmatter(frontmatter);
          if (dateObj) date = dateObj.toISOString();
        }

        if (!dateObj) {
          dateObj = extractDateFromFilename(itemName);
          if (dateObj) date = dateObj.toISOString();
        }

        if (!dateObj) {
          dateObj = fileStat.mtime;
          date = fileStat.mtime.toISOString();
        }

        // Extract title
        let title = frontmatter['title'] as string | undefined;
        if (!title) {
          let nameForTitle = itemName;
          const datePrefixMatch = nameForTitle.match(/^\d{4}-\d{2}-\d{2}[-_]?(.+)$/);
          if (datePrefixMatch?.[1]) {
            nameForTitle = datePrefixMatch[1];
          }
          title = titleFromFilename(nameForTitle);
        }

        // Extract excerpt
        let excerpt: string | undefined;
        if (frontmatter['excerpt']) {
          excerpt = await renderMarkdown(frontmatter['excerpt'] as string);
          if (cfg.linkRewrite) {
            excerpt = rewriteLinks(excerpt, cfg.linkRewrite);
          }
        } else if (typeof cfg.excerptFn === 'function') {
          excerpt = await cfg.excerptFn(rawMarkdown, frontmatter);
        } else {
          excerpt = await excerptFromMarkdown(rawMarkdown);
        }

        // Render markdown to HTML
        let content: string;
        if (typeof cfg.markdownRenderer === 'function') {
          content = await cfg.markdownRenderer(rawMarkdown);
        } else {
          content = await renderMarkdown(rawMarkdown);
        }

        // Apply link rewriting
        if (cfg.linkRewrite) {
          let linkRewriteOpts = { ...cfg.linkRewrite };
          if (!cfg.flatStructure && section) {
            linkRewriteOpts.prefix = '/' + section.replace(/^\/+|\/+$/g, '');
          } else {
            delete linkRewriteOpts.prefix;
          }
          content = rewriteLinks(content, linkRewriteOpts);
        }

        // Final output path
        let finalOutPath = outPath;
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
          body: rawMarkdown,
          link:
            typeof cfg.linkFn === 'function'
              ? cfg.linkFn({ section, itemName, meta: frontmatter })
              : `/${section ? section + '/' : ''}${itemName}.html`,
          content,
        };

        // Inject additional variables
        if (typeof cfg.additionalVarsFn === 'function') {
          const additional = await cfg.additionalVarsFn({ ...renderVars });
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
          body: rawMarkdown,
          link: renderVars.link,
        });

        ctx.logger.debug(`Generated ${finalOutPath}`);
      }

      // Sort items
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
