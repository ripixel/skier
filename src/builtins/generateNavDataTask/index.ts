import * as fs from 'fs/promises';
import * as path from 'path';
import type { TaskDef, TaskContext, SkierGlobals } from '../../types';

/**
 * A navigation item representing a single page in the sidebar.
 */
export interface NavItem {
  /** Display title of the page */
  title: string;
  /** URL path to the page (e.g., '/getting-started') */
  url: string;
  /** Sort order within section (lower = earlier) */
  order: number;
  /** Whether this is the current page (template-time use) */
  active?: boolean;
}

/**
 * A section in the navigation sidebar containing multiple items.
 */
export interface NavSection {
  /** Section display name (e.g., 'Getting Started') */
  name: string;
  /** Sort order for sections (lower = earlier) */
  order: number;
  /** Pages within this section */
  items: NavItem[];
  /** Nested subsections (e.g., for builtin task categories) */
  children?: NavSection[];
}

/**
 * Complete navigation data structure for the docs sidebar.
 */
export interface NavData {
  /** Ordered list of navigation sections */
  sections: NavSection[];
  /** Flat list of all pages for prev/next navigation */
  pages: NavItem[];
}

export interface GenerateNavDataConfig {
  /** Directory containing documentation files to scan */
  docsDir: string;
  /** Output variable name for the navigation data (default: 'navData') */
  outputVar?: string;
  /** Base URL path for generated links (default: '') */
  basePath?: string;
  /** File extensions to consider as docs (default: ['.md']) */
  extensions?: string[];
  /** Default section name for ungrouped docs (default: 'Docs') */
  defaultSection?: string;
  /** Section ordering configuration */
  sectionOrder?: Record<string, number>;
}

interface ParsedFrontmatter {
  title?: string;
  order?: number;
  section?: string;
  [key: string]: unknown;
}

/**
 * Extracts YAML frontmatter from markdown content.
 * Returns empty object if no frontmatter found.
 */
function parseFrontmatter(content: string): ParsedFrontmatter {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match || !match[1]) return {};

  const yaml = match[1];
  const result: ParsedFrontmatter = {};

  // Simple YAML parsing (key: value lines)
  for (const line of yaml.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let value: string | number = line.slice(colonIdx + 1).trim();

      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // Parse numbers
      if (/^\d+$/.test(value)) {
        result[key] = parseInt(value, 10);
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

/**
 * Extracts title from markdown content (first H1 heading).
 */
function extractTitleFromContent(content: string): string | undefined {
  const match = content.match(/^#\s+(.+)$/m);
  return match && match[1] ? match[1].trim() : undefined;
}

/**
 * Generates navigation data from a docs directory by scanning files and parsing frontmatter.
 *
 * The task reads all markdown files in the specified directory, extracts metadata from
 * frontmatter (title, order, section), and produces a structured navigation object.
 *
 * @example
 * generateNavDataTask({
 *   docsDir: 'docs',
 *   outputVar: 'navData',
 *   sectionOrder: { 'Getting Started': 1, 'Core Concepts': 2, 'Built-in Tasks': 3 }
 * })
 */
export function generateNavDataTask(
  config: GenerateNavDataConfig,
): TaskDef<GenerateNavDataConfig, SkierGlobals> {
  return {
    name: 'generate-nav-data',
    title: 'Generate navigation data from docs',
    config,
    run: async (cfg, ctx: TaskContext) => {
      const {
        docsDir,
        outputVar = 'navData',
        basePath = '',
        extensions = ['.md'],
        defaultSection = 'Docs',
        sectionOrder = {},
      } = cfg;

      ctx.logger.debug(`Scanning ${docsDir} for navigation data...`);

      const sectionMap = new Map<string, NavItem[]>();
      const allPages: NavItem[] = [];

      // Recursively scan directory
      async function scanDir(dir: string, urlPrefix: string): Promise<void> {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            // Recurse into subdirectories
            await scanDir(fullPath, `${urlPrefix}/${entry.name}`);
          } else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
            // Skip template files
            if (entry.name === 'template.hbs' || entry.name === 'template.html') {
              continue;
            }

            const content = await fs.readFile(fullPath, 'utf-8');
            const frontmatter = parseFrontmatter(content);

            // Generate URL (strip extension, handle README/index)
            const basename = path.basename(entry.name, path.extname(entry.name));
            let url: string;
            if (basename.toLowerCase() === 'readme' || basename.toLowerCase() === 'index') {
              url = urlPrefix || '/';
            } else {
              url = `${urlPrefix}/${basename}`;
            }
            url = basePath + url;

            // Determine title
            const title =
              frontmatter.title ||
              extractTitleFromContent(content) ||
              basename.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

            // Determine section
            let section = frontmatter.section || defaultSection;
            if (urlPrefix.includes('/builtins')) {
              section = 'Built-in Tasks';
            }

            const navItem: NavItem = {
              title,
              url,
              order: typeof frontmatter.order === 'number' ? frontmatter.order : 999,
            };

            // Add to section
            if (!sectionMap.has(section)) {
              sectionMap.set(section, []);
            }
            sectionMap.get(section)!.push(navItem);
            allPages.push(navItem);
          }
        }
      }

      await scanDir(docsDir, '');

      // Build sections array with proper ordering
      const sections: NavSection[] = [];
      for (const [name, items] of sectionMap) {
        // Sort items by order, then by title
        items.sort((a, b) => {
          if (a.order !== b.order) return a.order - b.order;
          return a.title.localeCompare(b.title);
        });

        sections.push({
          name,
          order: sectionOrder[name] ?? 999,
          items,
        });
      }

      // Sort sections by order
      sections.sort((a, b) => a.order - b.order);

      // Sort all pages for prev/next navigation
      allPages.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.title.localeCompare(b.title);
      });

      ctx.logger.debug(`Generated nav data: ${sections.length} sections, ${allPages.length} pages`);

      const navData: NavData = { sections, pages: allPages };

      return { [outputVar]: navData };
    },
  };
}
