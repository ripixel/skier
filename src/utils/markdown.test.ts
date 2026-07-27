import { parseCodeMeta, renderCodeBlock, renderMarkdown } from './markdown.js';

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

describe('renderMarkdown', () => {
  it('renders fenced code blocks through the structured renderer', async () => {
    const md = ['```ts title="skier.config.ts"', 'export default {};', '```'].join('\n');
    const html = await renderMarkdown(md);
    expect(html).toContain('<figure class="code-block"');
    expect(html).toContain('data-language="ts"');
    expect(html).toContain('data-filename="skier.config.ts"');
  });
});
