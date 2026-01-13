import Handlebars from 'handlebars';
import { ensureDir, readFileUtf8, writeFileUtf8, readdir } from '../../utils/fileHelpers';
import { join, basename, extname, dirname } from '../../utils/pathHelpers';
import type { TaskDef } from '../../types';

/**
 * Pagination metadata object exposed to templates.
 */
export interface PaginationMeta {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items across all pages */
  totalItems: number;
  /** Number of items per page */
  itemsPerPage: number;
  /** Whether there is a next page */
  hasNext: boolean;
  /** Whether there is a previous page */
  hasPrev: boolean;
  /** URL to the next page (null if no next page) */
  nextUrl: string | null;
  /** URL to the previous page (null if no previous page) */
  prevUrl: string | null;
  /** URL to the first page */
  firstUrl: string;
  /** URL to the last page */
  lastUrl: string;
  /** Array of all page links for generating page number navigation */
  pages: Array<{
    number: number;
    url: string;
    isCurrent: boolean;
  }>;
}

/**
 * Configuration for generatePaginatedItemsTask.
 */
export interface GeneratePaginatedItemsConfig {
  /**
   * Path to a JSON file containing the data.
   * Mutually exclusive with dataVar.
   */
  dataFile?: string;

  /**
   * Variable name from globals to use as data source.
   * Use ${varName} syntax (e.g., '${thoughtsList}').
   * Mutually exclusive with dataFile.
   */
  dataVar?: string;

  /**
   * Optional key within the JSON data to read the array from.
   * E.g., 'timeline' to read from data.timeline.
   */
  dataKey?: string;

  /** Number of items per page */
  itemsPerPage: number;

  /** Path to the Handlebars template for each page */
  template: string;

  /** Directory containing Handlebars partials */
  partialsDir: string;

  /** Output directory for generated pages */
  outDir: string;

  /**
   * Base path for URLs and output files.
   * E.g., '/life-fitness' results in:
   * - /life-fitness.html (page 1)
   * - /life-fitness/page/2.html (page 2)
   */
  basePath: string;

  /**
   * Variable name for the items array in templates.
   * Defaults to 'items'.
   */
  outputVar?: string;

  /**
   * Variable name for the pagination metadata in templates.
   * Defaults to 'pagination'.
   */
  paginationVar?: string;

  /**
   * Optional function to transform each item before passing to the template.
   * Receives the item and its index.
   */
  itemTransformFn?: (item: unknown, index: number) => unknown;

  /**
   * Optional function to inject additional variables per page.
   * Receives page context including pageNumber, totalPages, and items.
   */
  additionalVarsFn?: (args: {
    pageNumber: number;
    totalPages: number;
    items: unknown[];
  }) => Record<string, unknown> | Promise<Record<string, unknown>>;
}

/**
 * Splits an array into chunks of the specified size.
 */
function chunk<T>(array: T[], size: number): T[][] {
  if (size <= 0) return [array];
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Generates the URL for a given page number.
 */
function getPageUrl(pageNumber: number, basePath: string): string {
  // Ensure basePath starts with /
  const normalizedBase = basePath.startsWith('/') ? basePath : '/' + basePath;
  if (pageNumber === 1) {
    return normalizedBase;
  }
  return `${normalizedBase}/page/${pageNumber}`;
}

/**
 * Generates the output file path for a given page number.
 */
function getOutputPath(pageNumber: number, basePath: string, outDir: string): string {
  // Remove leading slash from basePath for file system paths
  const normalizedBase = basePath.replace(/^\/+/, '');
  if (pageNumber === 1) {
    return join(outDir, normalizedBase + '.html');
  }
  return join(outDir, normalizedBase, 'page', pageNumber + '.html');
}

/**
 * Builds the pagination metadata object for a given page.
 */
function buildPaginationMeta(
  pageNumber: number,
  totalPages: number,
  totalItems: number,
  itemsPerPage: number,
  basePath: string,
): PaginationMeta {
  const pages: PaginationMeta['pages'] = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push({
      number: i,
      url: getPageUrl(i, basePath),
      isCurrent: i === pageNumber,
    });
  }

  return {
    currentPage: pageNumber,
    totalPages,
    totalItems,
    itemsPerPage,
    hasNext: pageNumber < totalPages,
    hasPrev: pageNumber > 1,
    nextUrl: pageNumber < totalPages ? getPageUrl(pageNumber + 1, basePath) : null,
    prevUrl: pageNumber > 1 ? getPageUrl(pageNumber - 1, basePath) : null,
    firstUrl: getPageUrl(1, basePath),
    lastUrl: getPageUrl(totalPages, basePath),
    pages,
  };
}

/**
 * Built-in task for generating paginated HTML pages from a data source.
 * Produces multiple page files with navigation controls.
 *
 * @example
 * ```javascript
 * generatePaginatedItemsTask({
 *   dataFile: './items/life/fitness.json',
 *   dataKey: 'timeline',
 *   itemsPerPage: 15,
 *   template: './pages/life-fitness-paginated.html',
 *   partialsDir: './partials',
 *   outDir: './public',
 *   basePath: '/life-fitness',
 *   outputVar: 'activities',
 *   paginationVar: 'pagination',
 * })
 * ```
 */
export function generatePaginatedItemsTask(
  config: GeneratePaginatedItemsConfig,
): TaskDef<GeneratePaginatedItemsConfig, Record<string, never>> {
  return {
    name: 'generate-paginated-items',
    title: `Generate paginated pages for ${config.basePath}`,
    config,
    run: async (cfg, ctx) => {
      // Validate config
      if (!cfg.dataFile && !cfg.dataVar) {
        const msg = `[skier/generate-paginated-items] Either dataFile or dataVar must be provided.`;
        ctx.logger.error(msg);
        throw new Error(msg);
      }
      if (cfg.dataFile && cfg.dataVar) {
        const msg = `[skier/generate-paginated-items] Cannot specify both dataFile and dataVar.`;
        ctx.logger.error(msg);
        throw new Error(msg);
      }
      if (!cfg.itemsPerPage || cfg.itemsPerPage <= 0) {
        const msg = `[skier/generate-paginated-items] itemsPerPage must be a positive number.`;
        ctx.logger.error(msg);
        throw new Error(msg);
      }

      // 1. Load data
      let data: unknown[];
      if (cfg.dataFile) {
        ctx.logger.debug(`Loading data from file: ${cfg.dataFile}`);
        const fileContent = await readFileUtf8(cfg.dataFile);
        const json = JSON.parse(fileContent);
        if (cfg.dataKey) {
          data = json[cfg.dataKey];
          if (data === undefined) {
            ctx.logger.warn(
              `dataKey '${cfg.dataKey}' not found in ${cfg.dataFile}, using empty array`,
            );
            data = [];
          }
        } else {
          data = json;
        }
      } else {
        // dataVar - resolve from globals
        const varName = cfg.dataVar!.replace(/^\$\{|\}$/g, '');
        ctx.logger.debug(`Resolving data from global variable: ${varName}`);
        data = ctx.globals[varName] as unknown[];
        if (data === undefined) {
          ctx.logger.warn(`Global variable '${varName}' not found, using empty array`);
          data = [];
        }
      }

      // Ensure data is an array
      if (!Array.isArray(data)) {
        ctx.logger.warn(`Data is not an array, wrapping in array`);
        data = data ? [data] : [];
      }

      const totalItems = data.length;
      ctx.logger.debug(`Loaded ${totalItems} items`);

      // 2. Apply item transforms
      if (cfg.itemTransformFn) {
        ctx.logger.debug(`Applying itemTransformFn to ${data.length} items`);
        data = data.map((item, index) => cfg.itemTransformFn!(item, index));
      }

      // 3. Chunk into pages
      const chunks = chunk(data, cfg.itemsPerPage);
      const totalPages = Math.max(1, chunks.length); // At least 1 page even if empty
      ctx.logger.debug(`Split into ${totalPages} pages of ${cfg.itemsPerPage} items each`);

      // 4. Register partials
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
      ctx.logger.debug(`Registered ${partialFiles.length} partials`);

      // 5. Load and compile template
      const templateContent = await readFileUtf8(cfg.template);
      const template = Handlebars.compile(templateContent);

      // 6. Generate each page
      const outputVar = cfg.outputVar || 'items';
      const paginationVar = cfg.paginationVar || 'pagination';

      for (let i = 0; i < totalPages; i++) {
        const pageNumber = i + 1;
        const pageItems = chunks[i] || [];

        // Build pagination object
        const pagination = buildPaginationMeta(
          pageNumber,
          totalPages,
          totalItems,
          cfg.itemsPerPage,
          cfg.basePath,
        );

        // Build render context
        let vars: Record<string, unknown> = {
          ...ctx.globals,
          [outputVar]: pageItems,
          [paginationVar]: pagination,
        };

        // Apply additional vars function
        if (cfg.additionalVarsFn) {
          const additional = await cfg.additionalVarsFn({
            pageNumber,
            totalPages,
            items: pageItems,
          });
          if (additional && typeof additional === 'object') {
            vars = { ...vars, ...additional };
          }
        }

        // Render template
        const html = template(vars);

        // Write to output file
        const outPath = getOutputPath(pageNumber, cfg.basePath, cfg.outDir);
        await ensureDir(dirname(outPath));
        await writeFileUtf8(outPath, html);

        ctx.logger.debug(`Generated page ${pageNumber}/${totalPages}: ${outPath}`);
      }

      ctx.logger.info(
        `Generated ${totalPages} paginated page(s) for ${cfg.basePath} (${totalItems} items)`,
      );

      return {};
    },
  };
}
