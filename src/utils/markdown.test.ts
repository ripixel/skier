import * as fs from 'fs-extra';
import os from 'os';
import path from 'path';
import {
  extractLines,
  extractRegion,
  parseCodeMeta,
  parseIncludeDirective,
  renderCodeBlock,
  renderMarkdown,
  renderMarkdownWithHeadings,
  resolveCalloutType,
  SnippetIncludeError,
} from './markdown.js';

describe('parseCodeMeta', () => {
  it('returns an empty language for an empty info string', () => {
    expect(parseCodeMeta(undefined)).toEqual({ lang: '' });
    expect(parseCodeMeta('')).toEqual({ lang: '' });
  });

  it('reads the language from the first token', () => {
    expect(parseCodeMeta('ts')).toEqual({ lang: 'ts' });
    expect(parseCodeMeta('  bash  ')).toEqual({ lang: 'bash' });
  });

  it('reads a double-quoted title as the filename', () => {
    expect(parseCodeMeta('ts title="skier.config.ts"')).toEqual({
      lang: 'ts',
      filename: 'skier.config.ts',
    });
  });

  it('reads a single-quoted title', () => {
    expect(parseCodeMeta("js title='vite.config.js'")).toEqual({
      lang: 'js',
      filename: 'vite.config.js',
    });
  });

  it('reads an unquoted title token', () => {
    expect(parseCodeMeta('bash title=deploy.sh')).toEqual({
      lang: 'bash',
      filename: 'deploy.sh',
    });
  });

  it('accepts filename as an alias for title', () => {
    expect(parseCodeMeta('ts filename="a.ts"')).toEqual({ lang: 'ts', filename: 'a.ts' });
  });

  it('supports a filename with spaces inside quotes', () => {
    expect(parseCodeMeta('text title="my notes.txt"')).toEqual({
      lang: 'text',
      filename: 'my notes.txt',
    });
  });
});

describe('renderCodeBlock', () => {
  it('wraps output in a figure with the code-block class', () => {
    const html = renderCodeBlock('const x = 1;', 'ts');
    expect(html).toMatch(/^<figure class="code-block"/);
    expect(html).toContain('<pre><code');
    expect(html).toContain('</code></pre></figure>');
  });

  it('exposes the language as a data attribute and hljs class', () => {
    const html = renderCodeBlock('const x = 1;', 'ts');
    expect(html).toContain('data-language="ts"');
    expect(html).toContain('class="hljs language-ts"');
  });

  it('exposes the filename as a data attribute', () => {
    const html = renderCodeBlock('const x = 1;', 'ts title="skier.config.ts"');
    expect(html).toContain('data-filename="skier.config.ts"');
    expect(html).toContain('data-language="ts"');
  });

  it('omits data-filename when no title is given', () => {
    const html = renderCodeBlock('const x = 1;', 'ts');
    expect(html).not.toContain('data-filename');
  });

  it('omits data-language for a bare fence and auto-highlights', () => {
    const html = renderCodeBlock('const x = 1;', undefined);
    expect(html).not.toContain('data-language');
    expect(html).toContain('class="hljs"');
    expect(html).toMatch(/^<figure class="code-block"><pre>/);
  });

  it('keeps the declared language on the class even when unrecognised', () => {
    const html = renderCodeBlock('some code', 'unknownlang');
    expect(html).toContain('data-language="unknownlang"');
    expect(html).toContain('class="hljs language-unknownlang"');
  });

  it('escapes quotes and angle brackets in the filename attribute', () => {
    const html = renderCodeBlock('x', 'ts title="a<b>&.ts"');
    expect(html).toContain('data-filename="a&lt;b&gt;&amp;.ts"');
    expect(html).not.toContain('data-filename="a<b>');
  });

  it('preserves the original source as the code textContent', () => {
    // highlight.js wraps tokens in spans, but textContent must equal the source
    // so a copy handler can read it back verbatim.
    const source = 'const greeting = "hi";';
    const html = renderCodeBlock(source, 'ts');
    const inner = html.match(/<code[^>]*>([\s\S]*)<\/code>/)?.[1] ?? '';
    // strip highlight.js token spans, then decode the entities it emits
    const decoded = inner
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, '&');
    expect(decoded).toBe(source);
  });
});

describe('renderMarkdownWithHeadings', () => {
  it('emits slugged id attributes on headings h2–h4', async () => {
    const md = ['## Getting Started', '### Install the CLI', '#### First build'].join('\n\n');
    const { html, headings } = await renderMarkdownWithHeadings(md);

    expect(html).toContain('<h2 id="getting-started">Getting Started</h2>');
    expect(html).toContain('<h3 id="install-the-cli">Install the CLI</h3>');
    expect(html).toContain('<h4 id="first-build">First build</h4>');

    expect(headings).toEqual([
      { level: 2, text: 'Getting Started', slug: 'getting-started' },
      { level: 3, text: 'Install the CLI', slug: 'install-the-cli' },
      { level: 4, text: 'First build', slug: 'first-build' },
    ]);
  });

  it('slugs h1 and deeper headings too', async () => {
    const { html, headings } = await renderMarkdownWithHeadings('# Title\n\n##### Deep\n');
    expect(html).toContain('<h1 id="title">Title</h1>');
    expect(html).toContain('<h5 id="deep">Deep</h5>');
    expect(headings.map((h) => h.level)).toEqual([1, 5]);
  });

  it('makes duplicate slugs collision-safe with -2, -3 suffixes', async () => {
    const md = ['## Setup', '## Setup', '## Setup'].join('\n\n');
    const { html, headings } = await renderMarkdownWithHeadings(md);

    expect(headings.map((h) => h.slug)).toEqual(['setup', 'setup-2', 'setup-3']);
    expect(html).toContain('<h2 id="setup">Setup</h2>');
    expect(html).toContain('<h2 id="setup-2">Setup</h2>');
    expect(html).toContain('<h2 id="setup-3">Setup</h2>');
  });

  it('uses plain text (no inline markup) for text and slug', async () => {
    const { html, headings } = await renderMarkdownWithHeadings('## The `fast` **path** & more\n');

    expect(headings).toEqual([
      { level: 2, text: 'The fast path & more', slug: 'the-fast-path-more' },
    ]);
    // The rendered heading keeps its inline markup in the body…
    expect(html).toContain('<code>fast</code>');
    // …but the id is the clean slug.
    expect(html).toContain('id="the-fast-path-more"');
  });

  it('is deterministic across calls (fresh slug state each render)', async () => {
    const md = '## Notes\n\n## Notes\n';
    const first = await renderMarkdownWithHeadings(md);
    const second = await renderMarkdownWithHeadings(md);
    expect(first.headings.map((h) => h.slug)).toEqual(['notes', 'notes-2']);
    // A second, independent render restarts the counter rather than continuing it.
    expect(second.headings.map((h) => h.slug)).toEqual(['notes', 'notes-2']);
  });

  it('falls back to "section" for headings with no sluggable characters', async () => {
    const { headings } = await renderMarkdownWithHeadings('## ???\n\n## ???\n');
    expect(headings.map((h) => h.slug)).toEqual(['section', 'section-2']);
  });

  it('strips frontmatter and still collects headings', async () => {
    const md = '---\ntitle: Hi\n---\n\n## Body Heading\n';
    const { html, headings } = await renderMarkdownWithHeadings(md);
    expect(html).not.toContain('title: Hi');
    expect(headings).toEqual([{ level: 2, text: 'Body Heading', slug: 'body-heading' }]);
  });
});

describe('renderMarkdown', () => {
  it('renders fenced code blocks through the structured renderer', async () => {
    const md = ['```ts title="skier.config.ts"', 'export default {};', '```'].join('\n');
    const html = await renderMarkdown(md);
    expect(html).toContain('<figure class="code-block"');
    expect(html).toContain('data-language="ts"');
    expect(html).toContain('data-filename="skier.config.ts"');
  });

  it('returns html only and still applies heading ids', async () => {
    const html = await renderMarkdown('## Hello World\n');
    expect(typeof html).toBe('string');
    expect(html).toContain('<h2 id="hello-world">Hello World</h2>');
  });

  it('preserves highlight.js code block rendering', async () => {
    const html = await renderMarkdown('```js\nconst a = 1;\n```\n');
    expect(html).toContain('<pre><code class="hljs language-js">');
  });
});

describe('resolveCalloutType', () => {
  it('resolves the core types case-insensitively', () => {
    expect(resolveCalloutType('note')).toBe('note');
    expect(resolveCalloutType('TIP')).toBe('tip');
    expect(resolveCalloutType('Warning')).toBe('warning');
    expect(resolveCalloutType('danger')).toBe('danger');
    expect(resolveCalloutType('info')).toBe('info');
  });

  it('resolves common aliases to a canonical type', () => {
    expect(resolveCalloutType('caution')).toBe('danger');
    expect(resolveCalloutType('important')).toBe('info');
  });

  it('returns null for unknown keywords', () => {
    expect(resolveCalloutType('banana')).toBeNull();
    expect(resolveCalloutType('')).toBeNull();
  });
});

describe('callout blocks', () => {
  it('renders a note callout with class and data-attribute', async () => {
    const md = [':::note', 'Something worth knowing.', ':::'].join('\n');
    const html = await renderMarkdown(md);
    expect(html).toContain('<div class="callout callout-note" data-callout="note">');
    expect(html).toContain('<div class="callout-body">');
    expect(html).toContain('Something worth knowing.');
  });

  it('defaults the title to a capitalised type label', async () => {
    const md = [':::warning', 'Be careful.', ':::'].join('\n');
    const html = await renderMarkdown(md);
    expect(html).toContain('data-callout="warning"');
    expect(html).toContain('<p class="callout-title">Warning</p>');
  });

  it('uses a custom title from the opening line', async () => {
    const md = [':::tip Pro tip', 'Do this instead.', ':::'].join('\n');
    const html = await renderMarkdown(md);
    expect(html).toContain('data-callout="tip"');
    expect(html).toContain('<p class="callout-title">Pro tip</p>');
  });

  it('renders inline and block markdown inside the body', async () => {
    const md = [':::info', 'Uses **bold** and a [link](/x).', '', '- one', '- two', ':::'].join(
      '\n',
    );
    const html = await renderMarkdown(md);
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<a href="/x">link</a>');
    expect(html).toContain('<li>one</li>');
  });

  it('maps aliases onto their canonical type', async () => {
    const md = [':::caution', 'Danger ahead.', ':::'].join('\n');
    const html = await renderMarkdown(md);
    expect(html).toContain('class="callout callout-danger"');
    expect(html).toContain('data-callout="danger"');
  });

  it('escapes HTML in a custom title', async () => {
    const md = [':::note <script>alert(1)</script>', 'body', ':::'].join('\n');
    const html = await renderMarkdown(md);
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it('leaves an unknown keyword as ordinary markdown', async () => {
    const md = [':::banana', 'not a callout', ':::'].join('\n');
    const html = await renderMarkdown(md);
    expect(html).not.toContain('class="callout');
    expect(html).toContain(':::banana');
  });

  it('renders an empty-body callout without throwing', async () => {
    const md = [':::note', ':::'].join('\n');
    const html = await renderMarkdown(md);
    expect(html).toContain('data-callout="note"');
    expect(html).toContain('<div class="callout-body"></div>');
  });
});

describe('parseIncludeDirective', () => {
  it('returns null for a non-directive line', () => {
    expect(parseIncludeDirective('just some prose')).toBeNull();
    expect(parseIncludeDirective('  @include indented.ts')).toBeNull(); // must be column 0
  });

  it('parses a bare path', () => {
    expect(parseIncludeDirective('@include src/utils/markdown.ts')).toEqual({
      path: 'src/utils/markdown.ts',
    });
  });

  it('parses a quoted path with spaces', () => {
    expect(parseIncludeDirective('@include "my examples/a b.ts"')).toEqual({
      path: 'my examples/a b.ts',
    });
  });

  it('parses region, lines, lang and title modifiers', () => {
    expect(
      parseIncludeDirective('@include a.ts region="setup" lines="1-3" lang="ts" title="a.ts"'),
    ).toEqual({ path: 'a.ts', region: 'setup', lines: '1-3', lang: 'ts', title: 'a.ts' });
  });
});

describe('extractRegion', () => {
  const src = [
    'const a = 1;',
    '// #region demo',
    'const b = 2;',
    '// #endregion demo',
    'const c = 3;',
  ].join('\n');

  it('returns the lines between the markers', () => {
    expect(extractRegion(src, 'demo', 'f.ts')).toBe('const b = 2;');
  });

  it('matches a bare #endregion', () => {
    const s = ['// #region x', 'body', '// #endregion'].join('\n');
    expect(extractRegion(s, 'x', 'f.ts')).toBe('body');
  });

  it('throws when the region is missing', () => {
    expect(() => extractRegion(src, 'nope', 'f.ts')).toThrow(SnippetIncludeError);
    expect(() => extractRegion(src, 'nope', 'f.ts')).toThrow(/region "nope" not found/);
  });

  it('throws when there is no matching #endregion', () => {
    const s = ['// #region y', 'body'].join('\n');
    expect(() => extractRegion(s, 'y', 'f.ts')).toThrow(/no matching #endregion/);
  });
});

describe('extractLines', () => {
  const src = ['one', 'two', 'three', 'four'].join('\n');

  it('returns a single line (1-indexed)', () => {
    expect(extractLines(src, '2', 'f.ts')).toBe('two');
  });

  it('returns an inclusive range', () => {
    expect(extractLines(src, '2-3', 'f.ts')).toBe('two\nthree');
  });

  it('throws on a malformed spec', () => {
    expect(() => extractLines(src, 'abc', 'f.ts')).toThrow(/invalid lines/);
  });

  it('throws when the range runs past the end of the file', () => {
    expect(() => extractLines(src, '3-9', 'f.ts')).toThrow(/out of range/);
  });
});

describe('snippet transclusion (renderMarkdown @include)', () => {
  let dir: string;
  const sample = [
    'export const first = 1;',
    '// #region greet',
    'export function greet(name: string) {',
    '  return `hi ${name}`;',
    '}',
    '// #endregion greet',
    'export const last = 2;',
  ].join('\n');

  beforeAll(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'skier-snippet-'));
    await fs.writeFile(path.join(dir, 'sample.ts'), sample + '\n', 'utf8');
  });

  afterAll(async () => {
    await fs.remove(dir);
  });

  const render = (md: string) => renderMarkdown(md, { includeBaseDir: dir });
  // highlight.js wraps tokens in spans; strip them to assert on the source text.
  const plain = (html: string) =>
    html
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, '&');

  it('includes a whole file as a highlighted code block', async () => {
    const html = await render('@include sample.ts');
    expect(html).toContain('<figure class="code-block"');
    expect(html).toContain('data-language="typescript"');
    expect(html).toContain('data-filename="sample.ts"');
    expect(plain(html)).toContain('export const first = 1;');
    expect(plain(html)).toContain('export const last = 2;');
  });

  it('includes only a named region', async () => {
    const html = await render('@include sample.ts region="greet"');
    expect(plain(html)).toContain('export function greet(name: string)');
    expect(plain(html)).not.toContain('export const first');
    expect(plain(html)).not.toContain('#region');
  });

  it('includes a line range', async () => {
    const html = await render('@include sample.ts lines="1"');
    expect(plain(html)).toContain('export const first = 1;');
    expect(plain(html)).not.toContain('export const last');
  });

  it('honours lang and title overrides', async () => {
    const html = await render('@include sample.ts lines="1" lang="js" title="demo.js"');
    expect(html).toContain('data-language="js"');
    expect(html).toContain('data-filename="demo.js"');
  });

  it('leaves @include inside a fenced code block untouched', async () => {
    const md = ['```', '@include sample.ts', '```'].join('\n');
    const html = await render(md);
    expect(plain(html)).not.toContain('export const first');
    expect(plain(html)).toContain('@include sample.ts');
  });

  it('throws a helpful error when the file is missing', async () => {
    await expect(render('@include does-not-exist.ts')).rejects.toThrow(SnippetIncludeError);
    await expect(render('@include does-not-exist.ts')).rejects.toThrow(/file not found/);
  });

  it('throws when the requested region is missing', async () => {
    await expect(render('@include sample.ts region="ghost"')).rejects.toThrow(
      /region "ghost" not found/,
    );
  });
});

describe('snippet transclusion (docs dogfood)', () => {
  // The transclusion docs page (`docs/markdown-frontmatter.md`) includes the
  // real `snippet-error` region of this renderer. This test guards that link:
  // if the region marker is renamed, moved, or removed, the docs example would
  // silently rot — here it fails loudly instead.
  const repoRoot = path.resolve(__dirname, '..', '..');

  it('resolves the region the docs page transcludes from real source', async () => {
    const html = await renderMarkdown('@include src/utils/markdown.ts region="snippet-error"', {
      includeBaseDir: repoRoot,
    });
    const plain = html.replace(/<[^>]+>/g, '');
    expect(plain).toContain('class SnippetIncludeError extends Error');
    expect(plain).not.toContain('#region');
  });
});
