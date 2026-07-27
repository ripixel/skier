//@ts-check
const {
  prepareOutputTask,
  copyStaticTask,
  bundleCssTask,
  generateItemsTask,
  generateNavDataTask,
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

  // Generate navigation data from docs
  generateNavDataTask({
    docsDir: 'docs',
    outputVar: 'navData',
    basePath: '',
    // Docs information architecture. Sections are declared per-page via
    // `section:` frontmatter; this map only fixes their order in the sidebar.
    // See docs/markdown-frontmatter.md → "Docs site navigation" for the
    // frontmatter conventions every docs page follows.
    sectionOrder: {
      'Getting Started': 1,
      Guides: 2,
      'Task Reference': 3,
      'API Reference': 4,
      Recipes: 5,
      FAQ: 6,
    },
    // Ordering for the subcategory groups inside Task Reference.
    subcategoryOrder: {
      Setup: 1,
      Globals: 2,
      Content: 3,
      'Feeds & SEO': 4,
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
];
