# Configuration

How to configure your Skier build pipeline.

---

## Config File Location

Skier looks for a config file at your project root, in this order:

| Filename | Module System | When to Use |
|----------|---------------|-------------|
| `skier.tasks.mjs` | ESM | **Recommended** for v3+ |
| `skier.tasks.js` | ESM* | If `"type": "module"` in package.json |
| `skier.tasks.cjs` | CommonJS | Legacy projects |
| `skier.tasks.ts` | TypeScript | Type safety (requires ts-node) |

\* Without `"type": "module"`, `.js` is treated as CommonJS.

---

## Basic Configuration

Your config exports an array of tasks:

```js
// skier.tasks.mjs
import { prepareOutputTask, generatePagesTask, copyStaticTask } from 'skier';

export default [
  prepareOutputTask({ outDir: 'public' }),
  generatePagesTask({
    pagesDir: 'src/pages',
    partialsDir: 'src/partials',
    outDir: 'public',
  }),
  copyStaticTask({
    from: 'src/static',
    to: 'public',
  }),
];
```

---

## Complete Production Example

A real-world config from a blog with pagination, feeds, and pre-built data:

```js
// skier.tasks.mjs
import { readFileSync } from 'fs';
import {
  prepareOutputTask,
  setGlobalsTask,
  generateItemsTask,
  generatePaginatedItemsTask,
  generatePagesTask,
  generateFeedTask,
  generateSitemapTask,
  bundleCssTask,
  copyStaticTask,
} from 'skier';

// Load pre-fetched external data (see Recipes for the fetch script)
const externalData = JSON.parse(
  readFileSync('./_data/external.json', 'utf-8')
);

export default [
  // === SETUP ===
  prepareOutputTask({ outDir: 'public' }),

  setGlobalsTask({
    values: {
      siteTitle: 'My Awesome Blog',
      siteUrl: 'https://myblog.example.com',
      author: 'Jane Doe',
      currentYear: new Date().getFullYear(),
      externalData: externalData.items,
    },
  }),

  // === CONTENT ===
  // Process blog posts (creates individual pages + populates globals.posts)
  generateItemsTask({
    itemsDir: 'src/items/posts',
    partialsDir: 'src/partials',
    outDir: 'public/posts',
    outputVar: 'posts',
    templateExtension: '.html',
    sortFn: (a, b) => new Date(b.date) - new Date(a.date),
    excerptFn: (content) => content.split('<!--more-->')[0],
  }),

  // Paginated blog index
  generatePaginatedItemsTask({
    dataVar: '${posts}',
    itemsPerPage: 10,
    template: 'src/pages/blog.html',
    partialsDir: 'src/partials',
    outDir: 'public',
    basePath: '/blog',
    additionalVarsFn: ({ pageNumber }) => ({
      pageTitle: pageNumber === 1 ? 'Blog' : `Blog - Page ${pageNumber}`,
    }),
  }),

  // Static pages (about, contact, etc.)
  generatePagesTask({
    pagesDir: 'src/pages',
    partialsDir: 'src/partials',
    outDir: 'public',
  }),

  // === FEEDS & DISCOVERY ===
  generateFeedTask({
    articles: '${posts}',
    outDir: 'public',
    site: {
      title: 'My Awesome Blog',
      description: 'Thoughts on code and life',
      id: 'https://myblog.example.com/',
      link: 'https://myblog.example.com/',
      language: 'en',
      author: { name: 'Jane Doe', email: 'jane@example.com' },
    },
  }),

  generateSitemapTask({
    outDir: 'public',
    baseUrl: 'https://myblog.example.com',
  }),

  // === ASSETS ===
  bundleCssTask({
    from: 'src/styles',
    to: 'public',
    output: 'styles.min.css',
    minify: true,
  }),

  copyStaticTask({
    from: 'src/static',
    to: 'public',
  }),
];
```

---

## Dynamic Configuration

Export a function for environment-aware configs:

```js
// skier.tasks.mjs
import { setGlobalsTask, generatePagesTask } from 'skier';

export default (env) => {
  const isProd = process.env.NODE_ENV === 'production';

  return [
    setGlobalsTask({
      values: {
        siteUrl: isProd
          ? 'https://example.com'
          : 'http://localhost:3000',
        analyticsEnabled: isProd,
      },
    }),
    generatePagesTask({ /* ... */ }),
  ];
};
```

---

## Computed Globals

Use `valuesFn` to compute globals from other globals:

```js
setGlobalsTask({
  valuesFn: (globals) => ({
    // Latest 5 posts for the homepage
    recentPosts: globals.posts?.slice(0, 5) || [],

    // Total post count
    postCount: globals.posts?.length || 0,

    // Posts grouped by year
    postsByYear: (globals.posts || []).reduce((acc, post) => {
      const year = new Date(post.date).getFullYear();
      (acc[year] = acc[year] || []).push(post);
      return acc;
    }, {}),
  }),
}),
```

---

## Task Order Matters

Tasks run sequentially. Data-producing tasks must come before data-consuming tasks:

```js
export default [
  // ✅ Correct: generateItemsTask populates globals.posts
  generateItemsTask({ outputVar: 'posts', /* ... */ }),

  // ✅ Correct: generatePagesTask can now use globals.posts
  generatePagesTask({ /* ... */ }),

  // ❌ Wrong order would mean posts is undefined in templates
];
```

---

## Running the Build

Add to your `package.json`:

```json
{
  "scripts": {
    "build": "skier",
    "build:debug": "skier --debug"
  }
}
```

Then:
```bash
npm run build
```

---

**Next:** Learn about [Tasks](./tasks.md) and [Built-in Tasks](./builtins/README.md).
