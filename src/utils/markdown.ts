import { marked, type Tokens, type TokenizerAndRendererExtension } from 'marked';
import hljs from 'highlight.js';

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

export async function renderMarkdown(md: string): Promise<string> {
  // Strip frontmatter before rendering
  const content = stripFrontmatter(md);
  let html = await marked.parse(content);

  return html;
}
