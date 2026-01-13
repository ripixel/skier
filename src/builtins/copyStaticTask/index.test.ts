import { copyStaticTask, CopyStaticConfig } from './index.js';
import * as fs from 'fs-extra';
import path from 'path';
import type { TaskContext } from '../../types.js';

describe('copyStaticTask', () => {
  const testOutDir = path.join(__dirname, 'testAssets', 'out');
  const staticDir = path.join(__dirname, 'testAssets', 'static');
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

  it('copies static files to the output directory', async () => {
    const config: CopyStaticConfig = {
      from: staticDir,
      to: testOutDir,
    };
    const task = copyStaticTask(config);
    await task.run(config, ctx);
    // Check that files exist in output
    const expectedFiles = ['robots.txt', 'favicon.ico'];
    for (const file of expectedFiles) {
      const outPath = path.join(testOutDir, file);
      const expectedPath = path.join(staticDir, file);
      expect(await fs.pathExists(outPath)).toBe(true);
      expect((await fs.readFile(outPath)).equals(await fs.readFile(expectedPath))).toBe(true);
    }
  });
});
