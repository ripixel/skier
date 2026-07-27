import { generateSearchIndexTask, GenerateSearchIndexConfig, SearchIndex } from './index.js';
import * as fs from 'fs-extra';
import path from 'path';
import type { TaskContext } from '../../types.js';

describe('generateSearchIndexTask', () => {
  const testInputDir = path.join(__dirname, 'testAssets', 'input');
  const testOutDir = path.join(__dirname, 'testAssets', 'out');
  const indexFile = path.join(testOutDir, 'search-index.json');

  const createCtx = (): TaskContext => ({
    debug: false,
    globals: {},
    logger: { warn: jest.fn(), debug: jest.fn(), error: jest.fn(), info: jest.fn() },
  });

  const readIndex = async (): Promise<SearchIndex> =>
    JSON.parse(await fs.readFile(indexFile, 'utf8'));

  const findPage = (index: SearchIndex, url: string) => index.pages.find((p) => p.url === url);

  beforeAll(async () => {
    await fs.ensureDir(testOutDir);
  });

  afterAll(async () => {
    await fs.remove(testOutDir);
  });

  afterEach(async () => {
    await fs.remove(indexFile);
  });

  const run = async (config: GenerateSearchIndexConfig, ctx = createCtx()) => {
    const task = generateSearchIndexTask(config);
    return task.run(config, ctx);
  };

  it('writes search-index.json and excludes 404 by default', async () => {
    await run({ scanDir: testInputDir, outDir: testOutDir });
    expect(await fs.pathExists(indexFile)).toBe(true);

    const index = await readIndex();
    const urls = index.pages.map((p) => p.url);
    // index.html, getting-started.html, guide/index.html, no-main.html (404 excluded)
    expect(urls).toEqual(['/', '/getting-started', '/guide/', '/no-main']);
    expect(urls).not.toContain('/404');
  });

  it('extracts title from the first h1, not the <title> tag', async () => {
    await run({ scanDir: testInputDir, outDir: testOutDir });
    const index = await readIndex();
    expect(findPage(index, '/')!.title).toBe('Welcome to Skier');
    expect(findPage(index, '/getting-started')!.title).toBe('Getting Started');
  });

  it('collects headings in order with levels and anchor ids', async () => {
    await run({ scanDir: testInputDir, outDir: testOutDir });
    const index = await readIndex();

    expect(findPage(index, '/')!.headings).toEqual([
      { text: 'Welcome to Skier', level: 1, id: 'home' },
      { text: 'Features', level: 2, id: 'features' },
    ]);
    expect(findPage(index, '/getting-started')!.headings).toEqual([
      { text: 'Getting Started', level: 1 },
      { text: 'Install', level: 2, id: 'install' },
      { text: 'Requirements', level: 3, id: 'requirements' },
    ]);
  });

  it('strips HTML to plain text and decodes entities', async () => {
    await run({ scanDir: testInputDir, outDir: testOutDir });
    const body = findPage(await readIndex(), '/')!.body;
    expect(body).toContain('Skier is a minimal static site generator');
    expect(body).toContain('Composable & fast. No magic.');
    // No markup leaks through
    expect(body).not.toMatch(/[<>]/);
  });

  it('excludes chrome, in-content nav, scripts and styles from the body', async () => {
    await run({ scanDir: testInputDir, outDir: testOutDir });
    const body = findPage(await readIndex(), '/')!.body;
    // <script> content
    expect(body).not.toContain('this must not be indexed');
    // breadcrumb <nav> inside <main>
    expect(body).not.toContain('Docs');
    // chrome outside <main>
    expect(body).not.toContain('Header Chrome');
    expect(body).not.toContain('Footer Chrome');
    expect(body).not.toContain('color: red');
  });

  it('produces root-relative URLs by default and absolute URLs with siteUrl', async () => {
    await run({ scanDir: testInputDir, outDir: testOutDir });
    let index = await readIndex();
    expect(findPage(index, '/')).toBeDefined();
    expect(findPage(index, '/getting-started')).toBeDefined();
    expect(findPage(index, '/guide/')).toBeDefined();

    await run({
      scanDir: testInputDir,
      outDir: testOutDir,
      siteUrl: 'https://skier.ripixel.co.uk/',
    });
    index = await readIndex();
    const urls = index.pages.map((p) => p.url);
    expect(urls).toContain('https://skier.ripixel.co.uk/');
    expect(urls).toContain('https://skier.ripixel.co.uk/getting-started');
    expect(urls).toContain('https://skier.ripixel.co.uk/guide/');
    expect(urls.every((u) => !u.endsWith('.html'))).toBe(true);
  });

  it('falls back to <body> when the content selector is absent', async () => {
    await run({ scanDir: testInputDir, outDir: testOutDir });
    const page = findPage(await readIndex(), '/no-main')!;
    expect(page.title).toBe('Standalone');
    expect(page.body).toContain('No main wrapper here.');
  });

  it('merges custom excludes with defaults', async () => {
    await run({
      scanDir: testInputDir,
      outDir: testOutDir,
      excludes: ['guide/**'],
    });
    const urls = (await readIndex()).pages.map((p) => p.url);
    expect(urls).not.toContain('/guide/'); // custom exclude
    expect(urls).not.toContain('/404'); // default still applies
    expect(urls).toContain('/getting-started'); // others remain
  });

  it('logs excluded files at info level', async () => {
    const ctx = createCtx();
    await run({ scanDir: testInputDir, outDir: testOutDir }, ctx);
    expect(ctx.logger.info).toHaveBeenCalledWith(expect.stringContaining('excluded /404.html'));
  });

  it('respects a custom fileName', async () => {
    await run({ scanDir: testInputDir, outDir: testOutDir, fileName: 'docs-search.json' });
    expect(await fs.pathExists(path.join(testOutDir, 'docs-search.json'))).toBe(true);
    await fs.remove(path.join(testOutDir, 'docs-search.json'));
  });

  it('truncates body text at maxBodyLength on a word boundary', async () => {
    await run({ scanDir: testInputDir, outDir: testOutDir, maxBodyLength: 20 });
    const body = findPage(await readIndex(), '/')!.body;
    expect(body.length).toBeLessThanOrEqual(20);
    expect(body).not.toMatch(/\s$/); // trimmed, no dangling partial word gap
  });

  it('exposes the index on globals when outputVar is set', async () => {
    const result = await run({
      scanDir: testInputDir,
      outDir: testOutDir,
      outputVar: 'searchIndex',
    });
    expect(result).toHaveProperty('searchIndex');
    const idx = (result as Record<string, SearchIndex>).searchIndex!;
    expect(idx.pages.length).toBe(4);
  });

  it('returns no globals when outputVar is not set', async () => {
    const result = await run({ scanDir: testInputDir, outDir: testOutDir });
    expect(result).toEqual({});
  });

  it('emits deterministic, URL-sorted output', async () => {
    await run({ scanDir: testInputDir, outDir: testOutDir });
    const first = await fs.readFile(indexFile, 'utf8');
    await fs.remove(indexFile);
    await run({ scanDir: testInputDir, outDir: testOutDir });
    const second = await fs.readFile(indexFile, 'utf8');
    expect(first).toBe(second);

    const urls = (await readIndex()).pages.map((p) => p.url);
    expect(urls).toEqual([...urls].sort((a, b) => a.localeCompare(b)));
  });

  it('throws a config error when required fields are missing', async () => {
    const ctx = createCtx();
    // @ts-expect-error deliberately omitting required outDir
    const task = generateSearchIndexTask({ scanDir: testInputDir });
    // @ts-expect-error deliberately omitting required outDir
    await expect(task.run({ scanDir: testInputDir }, ctx)).rejects.toThrow(
      /Missing required config/,
    );
  });
});
