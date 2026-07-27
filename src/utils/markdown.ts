import { marked, type Tokens, type TokenizerAndRendererExtension } from 'marked';
import hljs from 'highlight.js';
import { isAbsolute, resolve } from 'node:path';
import { pathExists, readFileUtf8 } from './fileHelpers.js';
import { extname } from './pathHelpers.js';

/**
 * Escapes a string for safe use inside a double-quoted HTML attribute.
 */
function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Escapes a string for safe use inside HTML text content.
 */
function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export interface CodeMeta {
  /** Language token from the fence info string, e.g. `ts` (empty if none). */
  lang: string;
  /** Optional filename/title from a `title="..."` (or `filename="..."`) meta pair. */
  filename?: string;
}

/**
 * Parses a fenced code block's info string into a language token and optional
 * filename. Supports a meta convention for the filename, e.g.:
 *
 *     ```ts title="skier.config.ts"
 *     ```js filename='vite.config.js'
 *     ```bash title=deploy.sh
 *
 * The language is the first whitespace-delimited token; the filename is read
 * from a `title=` or `filename=` key anywhere in the remainder of the string.
 * Quotes (single or double) are optional but recommended for values with spaces.
 */
export function parseCodeMeta(infostring: string | undefined): CodeMeta {
  const info = (infostring || '').trim();
  const lang = info.match(/^\S*/)?.[0] ?? '';

  const rest = info.slice(lang.length);
  // title="..." | title='...' | title=token  (also accepts `filename` as an alias)
  const meta = rest.match(/\b(?:title|filename)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/i);
  const filename = meta ? (meta[1] ?? meta[2] ?? meta[3]) : undefined;

  return filename ? { lang, filename } : { lang };
}

/**
 * Renders a fenced code block into structured markup that a template's CSS and
 * a small vanilla-JS copy handler can hook onto, without hard-coding any
 * presentation (no label chip, no copy button — those belong to the template).
 *
 * The output shape is:
 *
 *     <figure class="code-block" data-language="ts" data-filename="skier.config.ts">
 *       <pre><code class="hljs language-ts">…highlighted…</code></pre>
 *     </figure>
 *
 * - `data-language` is present whenever a fence language was given.
 * - `data-filename` is present only when a `title=`/`filename=` meta pair is set.
 * - The `<code>` element's textContent is the original source, so a copy
 *   handler can read it directly with no duplicated payload.
 */
export function renderCodeBlock(code: string, infostring: string | undefined): string {
  const { lang, filename } = parseCodeMeta(infostring);
  return buildCodeBlock(code, lang, filename);
}

/**
 * Builds the structured `<figure class="code-block">` markup for a piece of
 * highlighted code. Shared by fenced code blocks (`renderCodeBlock`) and by
 * snippet transclusion, so an included file renders identically to a hand-written
 * fenced block.
 */
function buildCodeBlock(code: string, lang: string, filename?: string): string {
  let highlighted: string;
  let codeClass: string;
  if (lang && hljs.getLanguage(lang)) {
    highlighted = hljs.highlight(code, { language: lang }).value;
    codeClass = `hljs language-${lang}`;
  } else {
    highlighted = hljs.highlightAuto(code).value;
    // Preserve the author's declared language on the class even when highlight.js
    // does not recognise it, so styling/labelling stays consistent.
    codeClass = lang ? `hljs language-${lang}` : 'hljs';
  }

  const attrs = [
    lang ? ` data-language="${escapeHtmlAttr(lang)}"` : '',
    filename ? ` data-filename="${escapeHtmlAttr(filename)}"` : '',
  ].join('');

  return `<figure class="code-block"${attrs}><pre><code class="${codeClass}">${highlighted}</code></pre></figure>`;
}

/**
 * Callout / admonition blocks.
 *
 * Container syntax (VitePress / Docusaurus `:::` convention), with an optional
 * title on the opening line:
 *
 *     :::note
 *     Body markdown here — supports **inline** and block content.
 *     :::
 *
 *     :::warning Heads up
 *     A titled warning.
 *     :::
 *
 * Renders semantic, class-driven markup that a design bundle can theme per
 * type — no presentation is hard-coded here:
 *
 *     <div class="callout callout-warning" data-callout="warning">
 *       <p class="callout-title">Heads up</p>
 *       <div class="callout-body">…rendered body…</div>
 *     </div>
 */
const CALLOUT_TYPES = ['note', 'tip', 'info', 'warning', 'danger'] as const;
type CalloutType = (typeof CALLOUT_TYPES)[number];

// Common aliases from other docs tools; resolve to a canonical type.
const CALLOUT_ALIASES: Record<string, CalloutType> = {
  caution: 'danger',
  important: 'info',
};

/**
 * Resolves a raw callout keyword to a canonical type, or null if unrecognised
 * (in which case the block is left untouched for normal markdown parsing).
 */
export function resolveCalloutType(raw: string): CalloutType | null {
  const key = raw.toLowerCase();
  if ((CALLOUT_TYPES as readonly string[]).includes(key)) return key as CalloutType;
  return CALLOUT_ALIASES[key] ?? null;
}

function calloutLabel(type: CalloutType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

const CALLOUT_RULE =
  /^:::([A-Za-z]+)[ \t]*([^\n]*)(?:\r?\n([\s\S]*?))?(?:\r?\n)?:::[ \t]*(?:\r?\n|$)/;

const calloutExtension: TokenizerAndRendererExtension = {
  name: 'callout',
  level: 'block',
  start(src) {
    return src.match(/^:::[A-Za-z]/m)?.index;
  },
  tokenizer(src) {
    const match = CALLOUT_RULE.exec(src);
    if (!match) return undefined;
    const calloutType = resolveCalloutType(match[1] ?? '');
    if (!calloutType) return undefined; // not a known callout — let marked handle it

    const title = (match[2] ?? '').trim();
    const body = match[3] ?? '';
    const token: Tokens.Generic = {
      type: 'callout',
      raw: match[0],
      calloutType,
      title,
      tokens: [],
    };
    this.lexer.blockTokens(body, token.tokens);
    return token;
  },
  renderer(token) {
    const type = token.calloutType as CalloutType;
    const title = (token.title as string) || calloutLabel(type);
    const body = this.parser.parse(token.tokens ?? []);
    return (
      `<div class="callout callout-${type}" data-callout="${type}">` +
      `<p class="callout-title">${escapeHtml(title)}</p>` +
      `<div class="callout-body">${body}</div>` +
      `</div>`
    );
  },
};

/**
 * Snippet transclusion.
 *
 * A build-time include directive that pulls a slice of a real source/example
 * file into a docs page, so examples stay correct-by-construction and can't
 * drift from the source. The directive is a single line, at column 0:
 *
 *     @include path/to/file.ts
 *     @include path/to/file.ts region="setup"
 *     @include path/to/file.ts lines="10-24"
 *     @include "path with spaces.ts" lang="ts" title="example.ts"
 *
 * The file is read at render time and emitted as a normal syntax-highlighted
 * code block (the same markup as a fenced block). A missing file, an unknown
 * region, or an out-of-range line span throws — a broken include fails loudly
 * rather than silently producing empty output.
 *
 * Modifiers (all optional):
 *   region="name"  only the lines between `#region name` / `#endregion` markers
 *   lines="a-b"    a 1-indexed inclusive line range (or a single line, "a")
 *   lang="ts"      override the highlight language (default: inferred from ext)
 *   title="..."    override the filename label (default: the include path)
 *
 * Paths are resolved relative to the render base dir (the project working
 * directory by default; see `renderMarkdown` options).
 */
export class SnippetIncludeError extends Error {
  constructor(message: string) {
    super(`[skier] snippet include: ${message}`);
    this.name = 'SnippetIncludeError';
  }
}

export interface IncludeDirective {
  path: string;
  region?: string;
  lines?: string;
  lang?: string;
  title?: string;
}

// Map common file extensions to a highlight.js language; anything not listed
// falls back to the bare extension (highlight.js resolves aliases / auto-detects).
const EXT_LANG: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  json: 'json',
  md: 'markdown',
  markdown: 'markdown',
  yml: 'yaml',
  yaml: 'yaml',
  sh: 'bash',
  bash: 'bash',
  html: 'xml',
  htm: 'xml',
  py: 'python',
  go: 'go',
};

/**
 * Parses a single line into an include directive, or returns null if the line
 * is not an `@include` directive. The directive must start at column 0.
 */
export function parseIncludeDirective(line: string): IncludeDirective | null {
  const match = line.match(/^@include\s+(.+?)\s*$/);
  if (!match) return null;
  const rest = match[1] ?? '';

  // Path: quoted (allowing spaces) or the first bare token.
  const pathMatch = rest.match(/^(?:"([^"]*)"|'([^']*)'|(\S+))/);
  if (!pathMatch) return null;
  const path = pathMatch[1] ?? pathMatch[2] ?? pathMatch[3] ?? '';
  if (!path) return null;

  const directive: IncludeDirective = { path };
  const attrs = rest.slice(pathMatch[0].length);
  const attrRe = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g;
  let attr: RegExpExecArray | null;
  while ((attr = attrRe.exec(attrs)) !== null) {
    const key = attr[1];
    const value = attr[2] ?? attr[3] ?? attr[4] ?? '';
    if (key === 'region' || key === 'lines' || key === 'lang' || key === 'title') {
      directive[key] = value;
    }
  }
  return directive;
}

/**
 * Returns the lines between `#region <name>` and its matching `#endregion`
 * marker (markers excluded). The comment leader is irrelevant — the markers are
 * matched anywhere on a line — so this works across languages. Throws if the
 * region is not found.
 */
export function extractRegion(content: string, name: string, source: string): string {
  const lines = content.split(/\r?\n/);
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const startRe = new RegExp(`#region\\s+${escaped}(?:\\s|$)`);
  const endRe = new RegExp(`#endregion(?:\\s+${escaped})?(?:\\s|$)`);

  const start = lines.findIndex((l) => startRe.test(l));
  if (start === -1) {
    throw new SnippetIncludeError(`region "${name}" not found in ${source}`);
  }
  for (let i = start + 1; i < lines.length; i++) {
    if (endRe.test(lines[i] ?? '')) {
      return lines.slice(start + 1, i).join('\n');
    }
  }
  throw new SnippetIncludeError(`region "${name}" in ${source} has no matching #endregion`);
}

/**
 * Returns a 1-indexed, inclusive line range from `content`. `spec` is either a
 * single line ("12") or a range ("12-20"). Throws on a malformed or
 * out-of-bounds range.
 */
export function extractLines(content: string, spec: string, source: string): string {
  const range = spec.match(/^(\d+)(?:-(\d+))?$/);
  if (!range) {
    throw new SnippetIncludeError(`invalid lines="${spec}" for ${source} (expected "n" or "a-b")`);
  }
  const start = Number(range[1]);
  const end = range[2] ? Number(range[2]) : start;
  const lines = content.split(/\r?\n/);
  if (start < 1 || end < start || end > lines.length) {
    throw new SnippetIncludeError(
      `lines="${spec}" out of range for ${source} (file has ${String(lines.length)} lines)`,
    );
  }
  return lines.slice(start - 1, end).join('\n');
}

/**
 * Reads a file and renders the requested slice as a highlighted code block.
 */
async function renderIncludedSnippet(
  directive: IncludeDirective,
  baseDir: string,
): Promise<string> {
  const abs = isAbsolute(directive.path) ? directive.path : resolve(baseDir, directive.path);
  if (!(await pathExists(abs))) {
    throw new SnippetIncludeError(`file not found: ${directive.path} (resolved to ${abs})`);
  }
  const raw = await readFileUtf8(abs);

  let content = raw;
  if (directive.region !== undefined) {
    content = extractRegion(raw, directive.region, directive.path);
  } else if (directive.lines !== undefined) {
    content = extractLines(raw, directive.lines, directive.path);
  }
  // Trim a single trailing newline so the code block has no blank last line.
  content = content.replace(/\r?\n$/, '');

  const ext = extname(directive.path).replace(/^\./, '').toLowerCase();
  const lang = directive.lang ?? EXT_LANG[ext] ?? ext;
  const filename = directive.title ?? directive.path;
  return buildCodeBlock(content, lang, filename);
}

/**
 * Preprocesses markdown, replacing `@include` directives with the rendered
 * content of the referenced files. Directives inside fenced code blocks are
 * left untouched, so a page can document the syntax without self-including.
 */
export async function transcludeSnippets(md: string, baseDir: string): Promise<string> {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let fence: string | null = null;

  for (const line of lines) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = (fenceMatch[1] ?? '').charAt(0);
      if (fence === null) {
        fence = marker;
      } else if (marker === fence) {
        fence = null;
      }
      out.push(line);
      continue;
    }

    if (fence === null) {
      const directive = parseIncludeDirective(line);
      if (directive) {
        const html = await renderIncludedSnippet(directive, baseDir);
        // Surround with blank lines so marked treats it as an HTML block.
        out.push('', html, '');
        continue;
      }
    }
    out.push(line);
  }
  return out.join('\n');
}

const renderer = new marked.Renderer();
renderer.code = (code, infostring) => renderCodeBlock(code, infostring);
marked.setOptions({ renderer });
marked.use({ extensions: [calloutExtension] });

/**
 * Strips YAML frontmatter from markdown content.
 * Frontmatter is delimited by --- at the start of the file.
 */
function stripFrontmatter(md: string): string {
  // Match frontmatter at the very start of the content
  const match = md.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  if (match) {
    return md.slice(match[0].length);
  }
  return md;
}

export interface RenderMarkdownOptions {
  /**
   * Base directory for resolving `@include` snippet paths. Defaults to the
   * project working directory (`process.cwd()`).
   */
  includeBaseDir?: string;
}

export async function renderMarkdown(md: string, options?: RenderMarkdownOptions): Promise<string> {
  // Strip frontmatter before rendering
  let content = stripFrontmatter(md);
  // Resolve @include snippet directives against real files before parsing.
  content = await transcludeSnippets(content, options?.includeBaseDir ?? process.cwd());
  const html = await marked.parse(content);

  return html;
}
