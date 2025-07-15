jest.mock('./logger')

jest.mock('./cli/loadTasks');
import { runSkier } from './cli';
import * as fs from 'fs';
import * as path from 'path';
import type { TaskDef } from './types';
import { loadTasks } from './cli/loadTasks';

const TEST_OUT_DIR = path.join(__dirname, 'cli_test_out');
const TEST_TASKS_PATH = path.join(__dirname, 'skier.tasks.js');

const basicTask: TaskDef = {
  name: 'test-task',
  title: 'Test Task',
  config: {},
  run: async (cfg, ctx) => {
    fs.mkdirSync(TEST_OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(TEST_OUT_DIR, 'output.txt'), 'success');
    return {};
  },
};

describe('CLI runner', () => {
  let exitSpy: jest.SpyInstance;
  let origCwd: string;
  beforeAll(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => { throw new Error(`process.exit: ${code}`); }) as any);
    origCwd = process.cwd();
    process.chdir(__dirname);
  });
  afterAll(() => {
    exitSpy.mockRestore();
    process.chdir(origCwd);
  });
  beforeEach(() => {
    if (fs.existsSync(TEST_OUT_DIR)) {
      fs.rmSync(TEST_OUT_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_OUT_DIR, { recursive: true });
    jest.resetAllMocks();
  });

  afterEach(() => {
    if (fs.existsSync(TEST_OUT_DIR)) {
      fs.rmSync(TEST_OUT_DIR, { recursive: true, force: true });
    }
  });

  it('runs a basic task from skier.tasks.js', async () => {
    (loadTasks as jest.Mock).mockResolvedValueOnce([
      {
        name: 'test-task',
        title: 'Test Task',
        config: {},
        run: async () => {
          fs.mkdirSync(TEST_OUT_DIR, { recursive: true });
          fs.writeFileSync(path.join(TEST_OUT_DIR, 'output.txt'), 'success');
          return {};
        },
      },
    ]);
    await runSkier(['node', 'cli.js']);
    const files = fs.readdirSync(TEST_OUT_DIR);
    expect(files).toContain('output.txt');
    const content = fs.readFileSync(path.join(TEST_OUT_DIR, 'output.txt'), 'utf8');
    expect(content).toBe('success');
  });

  it('respects the --only argument', async () => {
    (loadTasks as jest.Mock).mockResolvedValueOnce([
      {
        name: 'test-task',
        title: 'Test Task',
        config: {},
        run: async () => {
          fs.mkdirSync(TEST_OUT_DIR, { recursive: true });
          fs.writeFileSync(path.join(TEST_OUT_DIR, 'output.txt'), 'success');
          return {};
        },
      },
      {
        name: 'only-task',
        title: 'Only Task',
        config: {},
        run: async () => {
          fs.writeFileSync(path.join(TEST_OUT_DIR, 'only.txt'), 'only');
          return {};
        },
      },
    ]);
    await runSkier(['node', 'cli.js', '--only=only-task']);
    const files = fs.readdirSync(TEST_OUT_DIR);
    expect(files).toContain('only.txt');
    expect(files).not.toContain('output.txt');
  });

  it('respects the --skip argument', async () => {
    (loadTasks as jest.Mock).mockResolvedValueOnce([
      {
        name: 'test-task',
        title: 'Test Task',
        config: {},
        run: async () => {
          fs.mkdirSync(TEST_OUT_DIR, { recursive: true });
          fs.writeFileSync(path.join(TEST_OUT_DIR, 'output.txt'), 'success');
          return {};
        },
      },
      {
        name: 'skip-task',
        title: 'Skip Task',
        config: {},
        run: async () => {
          fs.writeFileSync(path.join(TEST_OUT_DIR, 'skip.txt'), 'skip');
          return {};
        },
      },
    ]);
    await runSkier(['node', 'cli.js', '--skip=skip-task']);
    const files = fs.readdirSync(TEST_OUT_DIR);
    expect(files).toContain('output.txt');
    expect(files).not.toContain('skip.txt');
  });
});
