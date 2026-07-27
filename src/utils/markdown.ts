import { marked } from 'marked';
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

const renderer = new marked.Renderer();
renderer.code = (code, infostring) => renderCodeBlock(code, infostring);
marked.setOptions({ renderer });

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
