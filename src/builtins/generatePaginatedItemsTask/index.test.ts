import { generatePaginatedItemsTask } from './index';
import { join } from '../../utils/pathHelpers';
import { readFileUtf8, removeDir, ensureDir, pathExists } from '../../utils/fileHelpers';
import type { TaskContext } from '../../types';

const testAssetsDir = join(__dirname, 'testAssets');
const testOutDir = join(__dirname, 'testAssets', '_testOutput');

// Mock logger for testing
const createMockLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
});

// Create a test context
const createTestContext = (globals: Record<string, unknown> = {}): TaskContext => ({
  logger: createMockLogger(),
  debug: false,
  globals,
});

describe('generatePaginatedItemsTask', () => {
  beforeEach(async () => {
    // Clean up test output directory before each test
    await removeDir(testOutDir);
    await ensureDir(testOutDir);
  });

  afterAll(async () => {
    // Clean up test output directory after all tests
    await removeDir(testOutDir);
  });

  describe('basic pagination', () => {
    it('generates multiple pages from JSON file', async () => {
      const task = generatePaginatedItemsTask({
        dataFile: join(testAssetsDir, 'sample-data.json'),
        dataKey: 'items',
        itemsPerPage: 3,
        template: join(testAssetsDir, 'template.html'),
        partialsDir: join(testAssetsDir, 'partials'),
        outDir: testOutDir,
        basePath: '/test',
      });

      const ctx = createTestContext();
      await task.run(task.config, ctx);

      // Should generate 3 pages (7 items / 3 per page = 3 pages)
      expect(await pathExists(join(testOutDir, 'test.html'))).toBe(true);
      expect(await pathExists(join(testOutDir, 'test/page/2.html'))).toBe(true);
      expect(await pathExists(join(testOutDir, 'test/page/3.html'))).toBe(true);
    });

    it('includes correct pagination metadata in page 1', async () => {
      const task = generatePaginatedItemsTask({
        dataFile: join(testAssetsDir, 'sample-data.json'),
        dataKey: 'items',
        itemsPerPage: 3,
        template: join(testAssetsDir, 'template.html'),
        partialsDir: join(testAssetsDir, 'partials'),
        outDir: testOutDir,
        basePath: '/test',
      });

      const ctx = createTestContext();
      await task.run(task.config, ctx);

      const page1 = await readFileUtf8(join(testOutDir, 'test.html'));
      expect(page1).toContain('Page 1 of 3');
      expect(page1).toContain('class="prev disabled"'); // No prev on page 1
      expect(page1).toContain('href="/test/page/2"'); // Next link
    });

    it('includes correct pagination metadata in middle page', async () => {
      const task = generatePaginatedItemsTask({
        dataFile: join(testAssetsDir, 'sample-data.json'),
        dataKey: 'items',
        itemsPerPage: 3,
        template: join(testAssetsDir, 'template.html'),
        partialsDir: join(testAssetsDir, 'partials'),
        outDir: testOutDir,
        basePath: '/test',
      });

      const ctx = createTestContext();
      await task.run(task.config, ctx);

      const page2 = await readFileUtf8(join(testOutDir, 'test/page/2.html'));
      expect(page2).toContain('Page 2 of 3');
      expect(page2).toContain('href="/test"'); // Prev link (page 1)
      expect(page2).toContain('href="/test/page/3"'); // Next link
    });

    it('includes correct pagination metadata in last page', async () => {
      const task = generatePaginatedItemsTask({
        dataFile: join(testAssetsDir, 'sample-data.json'),
        dataKey: 'items',
        itemsPerPage: 3,
        template: join(testAssetsDir, 'template.html'),
        partialsDir: join(testAssetsDir, 'partials'),
        outDir: testOutDir,
        basePath: '/test',
      });

      const ctx = createTestContext();
      await task.run(task.config, ctx);

      const page3 = await readFileUtf8(join(testOutDir, 'test/page/3.html'));
      expect(page3).toContain('Page 3 of 3');
      expect(page3).toContain('href="/test/page/2"'); // Prev link
      expect(page3).toContain('class="next disabled"'); // No next on last page
    });
  });

  describe('edge cases', () => {
    it('generates single page when items <= itemsPerPage', async () => {
      const task = generatePaginatedItemsTask({
        dataFile: join(testAssetsDir, 'sample-data.json'),
        dataKey: 'items',
        itemsPerPage: 10, // More than 7 items
        template: join(testAssetsDir, 'template.html'),
        partialsDir: join(testAssetsDir, 'partials'),
        outDir: testOutDir,
        basePath: '/single',
      });

      const ctx = createTestContext();
      await task.run(task.config, ctx);

      expect(await pathExists(join(testOutDir, 'single.html'))).toBe(true);
      expect(await pathExists(join(testOutDir, 'single/page/2.html'))).toBe(false);

      const page1 = await readFileUtf8(join(testOutDir, 'single.html'));
      expect(page1).toContain('Page 1 of 1');
      expect(page1).toContain('class="prev disabled"');
      expect(page1).toContain('class="next disabled"');
    });

    it('generates page 1 with empty items when data is empty array', async () => {
      const task = generatePaginatedItemsTask({
        dataVar: '${emptyData}',
        itemsPerPage: 10,
        template: join(testAssetsDir, 'template.html'),
        partialsDir: join(testAssetsDir, 'partials'),
        outDir: testOutDir,
        basePath: '/empty',
      });

      const ctx = createTestContext({ emptyData: [] });
      await task.run(task.config, ctx);

      expect(await pathExists(join(testOutDir, 'empty.html'))).toBe(true);
      const page1 = await readFileUtf8(join(testOutDir, 'empty.html'));
      expect(page1).toContain('Page 1 of 1');
    });
  });

  describe('dataVar support', () => {
    it('loads data from globals variable', async () => {
      const task = generatePaginatedItemsTask({
        dataVar: '${myItems}',
        itemsPerPage: 2,
        template: join(testAssetsDir, 'template.html'),
        partialsDir: join(testAssetsDir, 'partials'),
        outDir: testOutDir,
        basePath: '/from-var',
      });

      const ctx = createTestContext({
        myItems: [
          { id: 1, title: 'Var Item 1' },
          { id: 2, title: 'Var Item 2' },
          { id: 3, title: 'Var Item 3' },
        ],
      });
      await task.run(task.config, ctx);

      expect(await pathExists(join(testOutDir, 'from-var.html'))).toBe(true);
      expect(await pathExists(join(testOutDir, 'from-var/page/2.html'))).toBe(true);

      const page1 = await readFileUtf8(join(testOutDir, 'from-var.html'));
      expect(page1).toContain('Var Item 1');
      expect(page1).toContain('Var Item 2');
    });
  });

  describe('transform functions', () => {
    it('applies itemTransformFn to each item', async () => {
      const task = generatePaginatedItemsTask({
        dataFile: join(testAssetsDir, 'sample-data.json'),
        dataKey: 'items',
        itemsPerPage: 3,
        template: join(testAssetsDir, 'template.html'),
        partialsDir: join(testAssetsDir, 'partials'),
        outDir: testOutDir,
        basePath: '/transformed',
        itemTransformFn: (item: any, index: number) => ({
          ...item,
          title: `TRANSFORMED: ${item.title}`,
        }),
      });

      const ctx = createTestContext();
      await task.run(task.config, ctx);

      const page1 = await readFileUtf8(join(testOutDir, 'transformed.html'));
      expect(page1).toContain('TRANSFORMED: Item 1');
    });

    it('applies additionalVarsFn per page', async () => {
      // Create a template that uses the additional var
      const customTemplate = `
        <h1>{{pageTitle}}</h1>
        <p>Showing {{items.length}} items</p>
      `;
      const customTemplatePath = join(testOutDir, 'custom-template.html');
      const { writeFileUtf8 } = await import('../../utils/fileHelpers');
      await writeFileUtf8(customTemplatePath, customTemplate);

      const task = generatePaginatedItemsTask({
        dataFile: join(testAssetsDir, 'sample-data.json'),
        dataKey: 'items',
        itemsPerPage: 3,
        template: customTemplatePath,
        partialsDir: join(testAssetsDir, 'partials'),
        outDir: testOutDir,
        basePath: '/with-vars',
        additionalVarsFn: ({ pageNumber, totalPages }) => ({
          pageTitle: pageNumber === 1 ? 'Latest Items' : `Page ${pageNumber} of ${totalPages}`,
        }),
      });

      const ctx = createTestContext();
      await task.run(task.config, ctx);

      const page1 = await readFileUtf8(join(testOutDir, 'with-vars.html'));
      expect(page1).toContain('Latest Items');

      const page2 = await readFileUtf8(join(testOutDir, 'with-vars/page/2.html'));
      expect(page2).toContain('Page 2 of 3');
    });
  });

  describe('dataKey support', () => {
    it('reads nested data using dataKey', async () => {
      const task = generatePaginatedItemsTask({
        dataFile: join(testAssetsDir, 'nested-data.json'),
        dataKey: 'timeline',
        itemsPerPage: 2,
        template: join(testAssetsDir, 'template.html'),
        partialsDir: join(testAssetsDir, 'partials'),
        outDir: testOutDir,
        basePath: '/nested',
      });

      const ctx = createTestContext();
      await task.run(task.config, ctx);

      const page1 = await readFileUtf8(join(testOutDir, 'nested.html'));
      expect(page1).toContain('Nested Item 1');
      expect(page1).toContain('Nested Item 2');

      const page2 = await readFileUtf8(join(testOutDir, 'nested/page/2.html'));
      expect(page2).toContain('Nested Item 3');
    });
  });

  describe('validation', () => {
    it('throws error when neither dataFile nor dataVar provided', async () => {
      const task = generatePaginatedItemsTask({
        itemsPerPage: 10,
        template: join(testAssetsDir, 'template.html'),
        partialsDir: join(testAssetsDir, 'partials'),
        outDir: testOutDir,
        basePath: '/invalid',
      });

      const ctx = createTestContext();
      await expect(task.run(task.config, ctx)).rejects.toThrow(
        'Either dataFile or dataVar must be provided',
      );
    });

    it('throws error when both dataFile and dataVar provided', async () => {
      const task = generatePaginatedItemsTask({
        dataFile: join(testAssetsDir, 'sample-data.json'),
        dataVar: '${items}',
        itemsPerPage: 10,
        template: join(testAssetsDir, 'template.html'),
        partialsDir: join(testAssetsDir, 'partials'),
        outDir: testOutDir,
        basePath: '/invalid',
      });

      const ctx = createTestContext();
      await expect(task.run(task.config, ctx)).rejects.toThrow(
        'Cannot specify both dataFile and dataVar',
      );
    });

    it('throws error when itemsPerPage is not positive', async () => {
      const task = generatePaginatedItemsTask({
        dataFile: join(testAssetsDir, 'sample-data.json'),
        itemsPerPage: 0,
        template: join(testAssetsDir, 'template.html'),
        partialsDir: join(testAssetsDir, 'partials'),
        outDir: testOutDir,
        basePath: '/invalid',
      });

      const ctx = createTestContext();
      await expect(task.run(task.config, ctx)).rejects.toThrow(
        'itemsPerPage must be a positive number',
      );
    });
  });
});
