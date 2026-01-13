import { generateSitemapTask, GenerateSitemapConfig } from './index.js';
import * as fs from 'fs-extra';
import path from 'path';
import type { TaskContext } from '../../types.js';

describe('generateSitemapTask', () => {
  const testOutDir = path.join(__dirname, 'testAssets', 'out');
  const testInputDir = path.join(__dirname, 'testAssets', 'input');
  const ctx: TaskContext = {
    debug: false,
    globals: {},
    logger: { warn: jest.fn(), debug: jest.fn(), error: jest.fn(), info: jest.fn() },
  };

  beforeAll(async () => {
    await fs.remove(testOutDir);
    await fs.ensureDir(testOutDir);
  });

  afterAll(async () => {
    await fs.remove(testOutDir);
  });

  it('generates correct sitemap.xml in the output directory', async () => {
    const config: GenerateSitemapConfig = {
      scanDir: testInputDir,
      outDir: testOutDir,
      siteUrl: 'https://example.com',
    };
    const task = generateSitemapTask(config);
    await task.run(config, ctx);
    const outPath = path.join(testOutDir, 'sitemap.xml');
    const expectedPath = path.join(__dirname, 'testAssets', 'expected', 'sitemap.xml');
    expect(await fs.pathExists(outPath)).toBe(true);
    expect(await fs.pathExists(expectedPath)).toBe(true);
    const actual = (await fs.readFile(outPath, 'utf8')).replace(/\r\n/g, '\n');
    const expected = (await fs.readFile(expectedPath, 'utf8')).replace(/\r\n/g, '\n');
    // Normalize by removing all whitespace for comparison
    const normalize = (str: string) => str.replace(/\s+/g, '');
    expect(normalize(actual)).toBe(normalize(expected));
  });
});
