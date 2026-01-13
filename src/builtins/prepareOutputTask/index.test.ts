import { prepareOutputTask, PrepareOutputConfig } from './index.js';
import * as fs from 'fs-extra';
import path from 'path';
import type { TaskContext } from '../../types.js';

describe('prepareOutputTask', () => {
  const testOutDir = path.join(__dirname, 'testAssets', 'out');
  const ctx: TaskContext = {
    debug: false,
    globals: {},
    logger: { warn: jest.fn(), debug: jest.fn(), error: jest.fn(), info: jest.fn() },
  };

  afterAll(async () => {
    await fs.remove(testOutDir);
  });

  it('ensures the output directory exists and is empty', async () => {
    // Pre-populate out dir with a file
    await fs.ensureDir(testOutDir);
    await fs.writeFile(path.join(testOutDir, 'should-be-removed.txt'), 'to be removed');
    const config: PrepareOutputConfig = {
      outDir: testOutDir,
    };
    const task = prepareOutputTask(config);
    await task.run(config, ctx);
    // Output directory should exist and be empty
    expect(await fs.pathExists(testOutDir)).toBe(true);
    const files = await fs.readdir(testOutDir);
    expect(files.length).toBe(0);
  });
});
