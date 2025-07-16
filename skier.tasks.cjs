//@ts-check
const {
  prepareOutputTask,
  copyStaticTask,
  bundleCssTask,
  generateItemsTask,
  generatePagesTask,
} = require('./dist/');

exports.tasks = [
  // 1. Prepare output directory
  prepareOutputTask({
    outDir: 'public',
  }),

  // 2. Copy docs assets (CSS, images, etc.)
  copyStaticTask({
    from: 'site/assets',
    to: 'public/assets',
  }),

  // 3. Bundle docs-site CSS
  bundleCssTask({
    from: 'site/assets',
    to: 'public/assets',
    output: 'docs.css',
    minify: true,
  }),

  // 4. Render Markdown docs as HTML pages
  generateItemsTask({
    itemsDir: 'docs',
    partialsDir: 'site/partials',
    outDir: 'public',
    outputVar: 'docsPages',
    templateExtension: '.hbs',
    partialExtension: '.hbs',
    flatStructure: false,
    linkRewrite: {
      stripPrefix: ['/docs/', 'docs/'],
      fromExt: '.md',
      toExt: '',
      rootRelative: true,
    },
  }),

  // 5. Render pages
  generatePagesTask({
    pagesDir: 'site/pages',
    partialsDir: 'site/partials',
    outDir: 'public',
    pageExt: '.hbs',
  }),

  // 6. Post-step: Alias README.html to index.html for builtins
  {
    name: 'aliasBuiltinsReadmeToIndex',
    config: {},
    run: async (cfg, ctx) => {
      const fs = require('fs/promises');
      const src = 'public/builtins/README.html';
      const dest = 'public/builtins/index.html';
      try {
        await fs.copyFile(src, dest);
        ctx.logger.debug(`Aliased ${src} -> ${dest}`);
      } catch (err) {
        if (err.code === 'ENOENT') {
          // README.html doesn't exist, skip
          ctx.logger.warn(`Skipping alias: ${src} not found.`);
        } else {
          throw err;
        }
      }
    },
  },
];
