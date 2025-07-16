//@ts-check
const {
  prepareOutputTask,
  copyStaticTask,
  bundleCssTask,
  generateItemsTask,
  generatePagesTask,
  setGlobalsTask,
} = require('./dist/');

exports.tasks = [
  // Prepare output directory
  prepareOutputTask({
    outDir: 'public',
  }),

  // Copy docs assets (CSS, images, etc.)
  copyStaticTask({
    from: 'site/assets',
    to: 'public/assets',
  }),

  // Bundle docs-site CSS
  bundleCssTask({
    from: 'site/assets',
    to: 'public/assets',
    output: 'docs.min.css',
    minify: true,
  }),

  // Set some globals
  setGlobalsTask({
    values: {
      year: new Date().getFullYear(),
      noindex:
        process.env.NODE_ENV === 'production' ? '' : '<meta name="robots" content="noindex">',
    },
  }),

  // Render Markdown docs as HTML pages
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
    additionalVarsFn: ({ title }) => ({
      subtitle: '| ' + title,
    }),
  }),

  // Render pages
  generatePagesTask({
    pagesDir: 'site/pages',
    partialsDir: 'site/partials',
    outDir: 'public',
    pageExt: '.hbs',
  }),

  // Post-step: Alias README.html to index.html for builtins
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
