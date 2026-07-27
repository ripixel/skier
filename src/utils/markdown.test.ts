import { renderMarkdown, renderMarkdownWithHeadings } from './markdown.js';

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
