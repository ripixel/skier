import { loadTasks } from './loadTasks';
import * as fs from 'fs';
import * as path from 'path';

const TEST_DIR = path.join(__dirname, '__loadTasks_test__');
const JS_FILE = path.join(TEST_DIR, 'skier.tasks.js');
const CJS_FILE = path.join(TEST_DIR, 'skier.tasks.cjs');
const TS_FILE = path.join(TEST_DIR, 'skier.tasks.ts');

describe('loadTasks', () => {
  beforeAll(() => {
    if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR);
  });
  beforeEach(() => {
    [JS_FILE, CJS_FILE, TS_FILE].forEach((f) => {
      if (fs.existsSync(f)) {
        const resolved = require.resolve(f);
        if (require.cache[resolved]) delete require.cache[resolved];
      }
    });
  });
  afterEach(() => {
    [JS_FILE, CJS_FILE, TS_FILE].forEach((f) => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });
  });
  afterAll(() => {
    if (fs.existsSync(TEST_DIR)) fs.rmdirSync(TEST_DIR);
  });

  it('loads tasks from skier.tasks.js', async () => {
    fs.writeFileSync(
      JS_FILE,
      `exports.tasks = [{ name: 'test', config: {}, run: async () => ({}) }];`,
    );
    const tasks = await loadTasks(TEST_DIR);
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks[0]?.name).toBe('test');
  });

  it('loads tasks from skier.tasks.cjs if .js is missing', async () => {
    fs.writeFileSync(
      CJS_FILE,
      `exports.tasks = [{ name: 'cjs', config: {}, run: async () => ({}) }];`,
    );
    const tasks = await loadTasks(TEST_DIR);
    expect(tasks[0]?.name).toBe('cjs');
  });

  it('loads tasks from skier.tasks.ts if .js and .cjs are missing', async () => {
    fs.writeFileSync(
      TS_FILE,
      `exports.tasks = [{ name: 'ts', config: {}, run: async () => ({}) }];`,
    );
    const tasks = await loadTasks(TEST_DIR);
    expect(tasks[0]?.name).toBe('ts');
  });

  it('throws if no tasks file is found', async () => {
    await expect(loadTasks(TEST_DIR)).rejects.toThrow(
      'Could not find a skier.tasks.js, skier.tasks.cjs, or skier.tasks.ts file',
    );
  });

  it('throws if file does not export a tasks array', async () => {
    fs.writeFileSync(JS_FILE, `exports.notTasks = 123;`);
    jest.resetModules();
    await expect(loadTasks(TEST_DIR)).rejects.toThrow('does not export a tasks array');
  });
});
