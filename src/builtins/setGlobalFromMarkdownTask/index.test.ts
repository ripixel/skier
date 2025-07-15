import { setGlobalFromMarkdownTask, SetGlobalFromMarkdownConfig } from './index';
import * as fs from 'fs-extra';
import path from 'path';
import type { TaskContext } from '../../types';

describe('setGlobalFromMarkdownTask', () => {
  const testOutDir = path.join(__dirname, 'testAssets', 'out');
  const changelogMd = path.join(__dirname, 'testAssets', 'changelog.md');
  const expectedHtml = path.join(__dirname, 'testAssets', 'expected', 'changelog.html');
  const ctx: TaskContext = {
    debug: false,
    globals: {},
    logger: { warn: jest.fn(), debug: jest.fn(), error: jest.fn(), info: jest.fn() },
  };

  afterAll(async () => {
    await fs.remove(testOutDir);
  });

  it('sets global variable from rendered Markdown', async () => {
    const config: SetGlobalFromMarkdownConfig = {
      mdPath: changelogMd,
      outputVar: 'changelogHtml',
    };
    const task = setGlobalFromMarkdownTask(config);
    const result = await task.run(config, ctx);
    // Check that the variable is set in the returned object
    expect(result.changelogHtml).toBeDefined();
    const actual = (result.changelogHtml as string).replace(/\r\n/g, '\n').replace(/\s+/g, '');
    const expected = (await fs.readFile(expectedHtml, 'utf8')).replace(/\r\n/g, '\n').replace(/\s+/g, '');
    expect(actual).toBe(expected);
  });
});
