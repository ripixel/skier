import { rewriteLinks } from './linkRewrite';

describe('rewriteLinks', () => {
  it('removes /docs and docs/ prefixes from links', () => {
    const html =
      '<a href="/docs/foo.md">foo</a> <a href="docs/bar.md">bar</a> <a href="baz.md">baz</a>';
    const result = rewriteLinks(html, {
      stripPrefix: ['/docs/', 'docs/'],
      fromExt: '.md',
      toExt: '.html',
      rootRelative: true,
    });
    expect(result).toContain('href="/foo.html"');
    expect(result).toContain('href="/bar.html"');
    expect(result).toContain('href="/baz.html"');
  });

  it('removes prefix regardless of leading slash', () => {
    const html = '<a href="docs/foo.md">foo</a> <a href="/docs/bar.md">bar</a>';
    const result = rewriteLinks(html, {
      stripPrefix: ['/docs/', 'docs/'],
      fromExt: '.md',
      toExt: '.html',
      rootRelative: true,
    });
    expect(result).toContain('href="/foo.html"');
    expect(result).toContain('href="/bar.html"');
  });

  it('does not rewrite external or anchor links', () => {
    const html = '<a href="http://example.com/foo.md">ext</a> <a href="#section">anchor</a>';
    const result = rewriteLinks(html, {
      stripPrefix: ['/docs/', 'docs/'],
      fromExt: '.md',
      toExt: '.html',
      rootRelative: true,
    });
    expect(result).toContain('href="http://example.com/foo.md"');
    expect(result).toContain('href="#section"');
  });

  it('trims trailing slash from links except root', () => {
    const html = '<a href="foo/">foo</a> <a href="/bar/">bar</a> <a href="/">root</a>';
    const result = rewriteLinks(html, {
      stripPrefix: [],
      fromExt: '',
      toExt: '',
      rootRelative: false,
    });
    expect(result).toContain('href="foo"');
    expect(result).toContain('href="/bar"');
    expect(result).toContain('href="/"');
  });

  it('removes .md extension entirely if toExt is empty string', () => {
    const html = '<a href="foo.md">foo</a> <a href="bar.md#x">bar</a>';
    const result = rewriteLinks(html, {
      stripPrefix: [],
      fromExt: '.md',
      toExt: '',
      rootRelative: true,
    });
    expect(result).toContain('href="/foo"');
    expect(result).toContain('href="/bar#x"');
  });

  it('handles links with query/hash', () => {
    const html = '<a href="/docs/foo.md#bar">foo</a> <a href="docs/bar.md?x=1">bar</a>';
    const result = rewriteLinks(html, {
      stripPrefix: ['/docs/', 'docs/'],
      fromExt: '.md',
      toExt: '.html',
      rootRelative: true,
    });
    expect(result).toContain('href="/foo.html#bar"');
    expect(result).toContain('href="/bar.html?x=1"');
  });
});
