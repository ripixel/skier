import { marked } from 'marked';
import hljs from 'highlight.js';

/**
 * A single heading extracted from a rendered markdown document.
 *
 * Exposed on the template render context (as `headings`) so templates can build
 * an on-page table of contents / right-rail. The list is in document order.
 */
export interface Heading {
  /** Heading level (1–6, from the number of `#`s). */
  level: number;
  /** Plain-text heading content (HTML tags and entities resolved). */
  text: string;
  /** Slugged, collision-safe anchor id — matches the `id` attribute emitted on the heading. */
  slug: string;
}

/**
 * The result of rendering markdown: the HTML plus the ordered list of headings
 * that were found (and given anchor ids) while rendering.
 */
export interface RenderedMarkdown {
  html: string;
  headings: Heading[];
}

/**
 * Converts a fragment of rendered inline HTML back to plain text: strips tags
 * and resolves the handful of entities marked emits. Used for heading display
 * text and slug generation, so a heading like `## The **fast** path` yields the
 * text `The fast path` rather than markup.
 */
function htmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * GitHub-style slug: lower-cased, punctuation dropped, whitespace collapsed to
 * single hyphens. Deterministic for a given input.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Builds a marked Renderer that:
 *  - highlights fenced code with highlight.js (unchanged behaviour), and
 *  - emits a slugged, collision-safe `id` on every heading while collecting the
 *    heading list into `headings`.
 *
 * A fresh renderer (and fresh slug/heading state) is built per render call so
 * concurrent renders never share the collision counter.
 */
function createRenderer(headings: Heading[]): InstanceType<typeof marked.Renderer> {
  const renderer = new marked.Renderer();
  const slugCounts = new Map<string, number>();

  renderer.code = (code, infostring) => {
    const lang = (infostring || '').match(/\S*/)?.[0];
    if (lang && hljs.getLanguage(lang)) {
      const highlighted = hljs.highlight(code, { language: lang }).value;
      return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
    }
    const auto = hljs.highlightAuto(code).value;
    return `<pre><code class="hljs">${auto}</code></pre>`;
  };

  renderer.heading = (text, level) => {
    const plain = htmlToText(text);
    const base = slugify(plain) || 'section';

    // Collision-safe: first occurrence keeps `base`, later dupes get -2, -3, …
    const seen = slugCounts.get(base) ?? 0;
    slugCounts.set(base, seen + 1);
    const slug = seen === 0 ? base : `${base}-${String(seen + 1)}`;

    headings.push({ level, text: plain, slug });
    const tag = `h${String(level)}`;
    return `<${tag} id="${slug}">${text}</${tag}>\n`;
  };

  return renderer;
}

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

/**
 * Renders markdown to HTML and returns the ordered list of headings found.
 *
 * Every heading is emitted with a deterministic, collision-safe anchor `id`
 * (duplicate slugs get `-2`, `-3`, … suffixes), giving pages deep-linkable
 * anchors, and `headings` lets templates build an on-page table of contents.
 */
export async function renderMarkdownWithHeadings(md: string): Promise<RenderedMarkdown> {
  const content = stripFrontmatter(md);
  const headings: Heading[] = [];
  const renderer = createRenderer(headings);
  const html = await marked.parse(content, { renderer });

  return { html, headings };
}

/**
 * Renders markdown to HTML. Headings still receive anchor ids; callers that also
 * need the heading list should use {@link renderMarkdownWithHeadings}.
 */
export async function renderMarkdown(md: string): Promise<string> {
  const { html } = await renderMarkdownWithHeadings(md);
  return html;
}
