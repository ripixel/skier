import fs from 'fs-extra';
import path from 'path';
import { generateItemsTask, GenerateItemsConfig } from './index';
import type { TaskContext } from '../../types';

describe('generateItemsTask', () => {
  const testOutDir = path.join(__dirname, 'testAssets', 'out');
  const itemsDir = path.join(__dirname, 'testAssets', 'items');
  const partialsDir = path.join(__dirname, 'testAssets', 'partials');

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

  it('generates correct HTML for sectioned items (default config)', async () => {
    const config: GenerateItemsConfig = {
      itemsDir,
      partialsDir,
      outDir: testOutDir,
      outputVar: 'items',
    };
    const task = generateItemsTask(config);
    const result = await task.run(config, ctx);
    expect(result.items).toBeInstanceOf(Array);
    // Check that output HTML files exist and match expected output
    for (const item of result.items!) {
      // In this test, section is always 'blog'
      expect(item.section).toBe('blog');
      const outPath = path.join(testOutDir, 'blog', item.itemName + '.html');
      const expectedPath = path.join(
        __dirname,
        'testAssets',
        'expected',
        'blog',
        item.itemName + '.html',
      );
      expect(await fs.pathExists(outPath)).toBe(true);
      expect(await fs.pathExists(expectedPath)).toBe(true);
      const actual = (await fs.readFile(outPath, 'utf8')).replace(/\r\n/g, '\n');
      const expected = (await fs.readFile(expectedPath, 'utf8')).replace(/\r\n/g, '\n');
      // Normalize by removing all whitespace for comparison
      const normalize = (str: string) => str.replace(/\s+/g, '');
      expect(normalize(actual)).toBe(normalize(expected));
    }
  });

  // Additional tests for flatStructure, custom config, edge cases, etc. can be added here
});
