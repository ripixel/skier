import { bundleCssTask, BundleCssConfig } from './index.js';
import * as fs from 'fs-extra';
import path from 'path';
import type { TaskContext } from '../../types.js';

describe('bundleCssTask', () => {
  const testOutDir = path.join(__dirname, 'testAssets', 'out');
  const cssDir = path.join(__dirname, 'testAssets', 'css');
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

  it('bundles CSS files into a single output file', async () => {
    const config: BundleCssConfig = {
      from: cssDir,
      to: testOutDir,
      output: 'bundle.css',
    };
    const task = bundleCssTask(config);
    await task.run(config, ctx);
    const outPath = path.join(testOutDir, 'bundle.css');
    const expectedPath = path.join(__dirname, 'testAssets', 'expected', 'bundle.css');
    expect(await fs.pathExists(outPath)).toBe(true);
    expect(await fs.pathExists(expectedPath)).toBe(true);
    const actual = (await fs.readFile(outPath, 'utf8')).replace(/\r\n/g, '\n').replace(/\s+/g, '');
    const expected = (await fs.readFile(expectedPath, 'utf8'))
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, '');
    expect(actual).toBe(expected);
  });
});
