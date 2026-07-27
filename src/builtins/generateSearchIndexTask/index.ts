import type { TaskDef, SkierGlobals } from '../../types.js';
import {
  ensureDir,
  writeFileUtf8,
  readFileUtf8,
  findFilesRecursive,
} from '../../utils/fileHelpers.js';
import { join, basename } from '../../utils/pathHelpers.js';
import { throwTaskError, validateRequiredConfig } from '../../utils/errors.js';

/** Default glob patterns excluded from the search index (kept in step with the sitemap task). */
const DEFAULT_EXCLUDES = ['404.html', '404/**'];

/**
 * A single heading extracted from a page, in document order.
 *
 * `id` is populated when the rendered heading carries an `id` attribute (as
 * produced once heading-anchor support lands), so search results can deep-link
 * straight to the relevant section. It is omitted when no anchor is present.
 */
export interface SearchHeading {
  /** Heading text with all inline HTML stripped */
  text: string;
  /** Heading level, 1–6 (from `<h1>`–`<h6>`) */
  level: number;
  /** Anchor slug for deep-linking, when the heading has an `id` */
  id?: string;
}

/**
 * One entry in the search index: everything a client-side search UI needs to
 * find and rank a page, and nothing it doesn't.
 */
export interface SearchIndexEntry {
  /** Clean, extension-free URL of the page (root-relative, or absolute if `siteUrl` is set) */
  url: string;
  /** Page title (first `<h1>`, falling back to `<title>`, then filename) */
  title: string;
  /** Headings in document order, for section-level matching and result grouping */
  headings: SearchHeading[];
  /** Plain, HTML-stripped, whitespace-collapsed body text for full-text matching */
  body: string;
}

/**
 * The complete search index document written to disk as JSON.
 *
 * This format is a stable public contract consumed by the client-side search
 * UI (a separate task). Add fields additively; do not rename or repurpose
 * existing ones.
 */
export interface SearchIndex {
  /** All indexed pages, sorted by URL for deterministic output */
  pages: SearchIndexEntry[];
}

export interface GenerateSearchIndexConfig {
  /** Directory to scan for rendered `.html` pages */
  scanDir: string;
  /** Directory to write the search index JSON into */
  outDir: string;
  /** Output filename for the index (default: `'search-index.json'`) */
  fileName?: string;
  /** Site root URL for absolute page URLs (default: root-relative URLs) */
  siteUrl?: string;
  /**
   * Tag name whose contents are indexed, scoping out shared chrome (sidebar,
   * header, footer). Default: `'main'`. Use `'body'` to index the whole body.
   * If the tag is not found on a page, the task falls back to `<body>`.
   */
  contentSelector?: string;
  /** Glob patterns to exclude from the index. Merged with defaults (`404.html`, `404/**`). */
  excludes?: string[];
  /** If set, the index object is also exposed on `globals[outputVar]` for downstream tasks. */
  outputVar?: string;
  /** Cap each page's body text to this many characters (default: `0` = no limit). */
  maxBodyLength?: number;
  /** Pretty-print the JSON (default: `false` — compact output keeps the payload lean). */
  pretty?: boolean;
}

/**
 * Test whether a relative path matches a simple glob pattern.
 * Supports `**` (any path segments), `*` (any filename chars), and literal matching.
 */
function matchesGlob(relPath: string, pattern: string): boolean {
  const norm = relPath.replace(/^\/+/, '');
  const pat = pattern.replace(/^\/+/, '');

  const regexStr = pat
    .split('**')
    .map((segment) =>
      segment
        .split('*')
        .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('[^/]*'),
    )
    .join('.*');

  return new RegExp(`^${regexStr}$`).test(norm);
}

/**
 * Clean a relative HTML path into a search-friendly URL.
 * - `index.html` → `/`
 * - `foo/index.html` → `/foo/`
 * - `about.html` → `/about`
 */
function cleanUrl(relPath: string): string {
  const url = '/' + relPath.replace(/^\/+/, '');

  if (url === '/index.html') return '/';
  if (url.endsWith('/index.html')) return url.slice(0, -'index.html'.length);
  if (url.endsWith('.html')) return url.slice(0, -'.html'.length);
  return url;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/** Decode the handful of HTML entities that survive tag-stripping into plain text. */
function decodeEntities(str: string): string {
  return str.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, ent: string) => {
    if (ent[0] === '#') {
      const isHex = ent[1] === 'x' || ent[1] === 'X';
      const code = isHex ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    const named = NAMED_ENTITIES[ent.toLowerCase()];
    return named !== undefined ? named : match;
  });
}

/** Strip all HTML from a fragment and normalise whitespace into searchable plain text. */
function htmlToText(html: string): string {
  const text = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  return decodeEntities(text).replace(/\s+/g, ' ').trim();
}

/**
 * Extract the inner HTML of the first `selector` element (or `<body>` when
 * `selector` is empty/`'body'`). Returns `null` if the requested element is
 * absent so the caller can fall back.
 */
function extractRegion(html: string, selector: string): string | null {
  if (!selector || selector.toLowerCase() === 'body') {
    const body = html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i);
    return body ? body[1]! : html;
  }
  const re = new RegExp(`<${selector}\\b[^>]*>([\\s\\S]*?)<\\/${selector}>`, 'i');
  const match = html.match(re);
  return match ? match[1]! : null;
}

/** Remove non-content elements (scripts, styles, comments, in-content nav) before indexing. */
function cleanRegion(region: string): string {
  return region
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, ' ');
}

/** Extract headings (with optional anchor ids) from a cleaned content region, in order. */
function extractHeadings(region: string): SearchHeading[] {
  const headings: SearchHeading[] = [];
  const re = /<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(region)) !== null) {
    const level = parseInt(match[1]!, 10);
    const text = htmlToText(match[3]!);
    if (!text) continue;
    const idMatch = match[2]!.match(/\bid\s*=\s*["']([^"']+)["']/i);
    const heading: SearchHeading = { text, level };
    if (idMatch) heading.id = idMatch[1];
    headings.push(heading);
  }
  return headings;
}

/** Derive a page title: first `<h1>` in the content, then `<title>`, then the filename. */
function extractTitle(fullHtml: string, region: string, fallback: string): string {
  const h1 = region.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) {
    const text = htmlToText(h1[1]!);
    if (text) return text;
  }
  const titleTag = fullHtml.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  if (titleTag) {
    const text = htmlToText(titleTag[1]!);
    if (text) return text;
  }
  return fallback;
}

/**
 * Walks a directory of rendered HTML pages and emits a JSON search index for
 * client-side search — one entry per page with its title, headings, plain-text
 * body, and clean URL.
 *
 * Modelled on {@link generateNavDataTask} (same task shape and registration
 * pattern) but reads rendered HTML rather than Markdown source, so it captures
 * exactly what a reader sees. HTML is stripped to searchable text and shared
 * chrome (sidebar/header/footer) is scoped out via `contentSelector`, keeping
 * the payload lean. The output format is a stable contract for the search UI.
 *
 * @example
 * generateSearchIndexTask({
 *   scanDir: 'public',
 *   outDir: 'public',
 *   siteUrl: 'https://skier.ripixel.co.uk',
 * })
 * // → writes public/search-index.json
 */
export function generateSearchIndexTask(
  config: GenerateSearchIndexConfig,
): TaskDef<GenerateSearchIndexConfig, SkierGlobals> {
  return {
    name: 'generate-search-index',
    title: `Generate search index from ${config.scanDir}`,
    config,
    run: async (cfg, ctx) => {
      validateRequiredConfig(ctx, 'generate-search-index', cfg, ['scanDir', 'outDir']);

      const {
        scanDir,
        outDir,
        fileName = 'search-index.json',
        siteUrl,
        contentSelector = 'main',
        excludes = [],
        outputVar,
        maxBodyLength = 0,
        pretty = false,
      } = cfg;

      try {
        await ensureDir(scanDir);

        const allHtmlFiles = await findFilesRecursive(scanDir, '.html');
        const relFiles = allHtmlFiles.map((f) =>
          f.startsWith(scanDir) ? f.slice(scanDir.length).replace(/^\/+/, '') : f,
        );

        const excludePatterns = [...DEFAULT_EXCLUDES, ...excludes];
        const excluded: { file: string; pattern: string }[] = [];
        const includedFiles = relFiles.filter((rel) => {
          for (const pattern of excludePatterns) {
            if (matchesGlob(rel, pattern)) {
              excluded.push({ file: rel, pattern });
              return false;
            }
          }
          return true;
        });

        for (const { file, pattern } of excluded) {
          ctx.logger.info(`Search index: excluded /${file} (matched pattern: ${pattern})`);
        }

        if (includedFiles.length === 0) {
          ctx.logger.warn('No HTML files found in scanDir for search index generation.');
        }

        const entries: SearchIndexEntry[] = [];
        for (const rel of includedFiles) {
          const html = await readFileUtf8(join(scanDir, rel));

          let region = extractRegion(html, contentSelector);
          if (region === null) {
            ctx.logger.debug(
              `Search index: <${contentSelector}> not found in /${rel}, falling back to <body>`,
            );
            region = extractRegion(html, 'body');
          }
          const cleaned = cleanRegion(region ?? '');

          const fallbackTitle = basename(rel, '.html')
            .split('/')
            .pop()!
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());

          const title = extractTitle(html, cleaned, fallbackTitle);
          const headings = extractHeadings(cleaned);

          let body = htmlToText(cleaned);
          if (maxBodyLength > 0 && body.length > maxBodyLength) {
            body = body
              .slice(0, maxBodyLength)
              .replace(/\s+\S*$/, '')
              .trim();
          }

          const url = siteUrl ? `${siteUrl.replace(/\/$/, '')}${cleanUrl(rel)}` : cleanUrl(rel);

          entries.push({ url, title, headings, body });
        }

        // Sort by URL for stable, deterministic output across builds.
        entries.sort((a, b) => a.url.localeCompare(b.url));

        const index: SearchIndex = { pages: entries };

        await ensureDir(outDir);
        const outPath = join(outDir, fileName);
        await writeFileUtf8(outPath, JSON.stringify(index, null, pretty ? 2 : 0) + '\n');

        ctx.logger.debug(
          `Generated search index at ${outPath} with ${entries.length} pages (${excluded.length} excluded)`,
        );

        return outputVar ? { [outputVar]: index } : {};
      } catch (err) {
        if (err instanceof Error && err.message.startsWith('[skier/')) {
          throw err;
        }
        throwTaskError(
          ctx,
          'generate-search-index',
          'Failed to generate search index',
          err instanceof Error ? err : undefined,
        );
      }
    },
  };
}
