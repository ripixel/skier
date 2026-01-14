---
title: Recipes
section: Advanced
order: 2
---

# Recipes

Practical, copy-pasteable examples for common Skier use cases. Each recipe is a complete, working configuration.

---

## Blog with Pagination

A blog with paginated index pages and individual post pages.

**Project structure:**
```
src/
├── items/posts/
│   ├── 2024-01-15-hello-world.md
│   └── 2024-01-20-second-post.md
├── pages/
│   ├── index.html
│   └── post.html
└── partials/
    ├── header.html
    └── pagination.html
```

**Configuration:**
```js
// skier.tasks.mjs
import {
  prepareOutputTask,
  setGlobalsTask,
  generateItemsTask,
  generatePaginatedItemsTask,
  generateFeedTask,
  generateSitemapTask,
} from 'skier';

export default [
  prepareOutputTask({ outDir: 'public' }),

  setGlobalsTask({
    values: {
      siteTitle: 'My Blog',
      siteUrl: 'https://example.com',
    }
  }),

  // Generate individual post pages + collect posts array
  generateItemsTask({
    itemsDir: 'src/items/posts',
    partialsDir: 'src/partials',
    outDir: 'public/posts',
    outputVar: 'posts',
    sortFn: (a, b) => new Date(b.date) - new Date(a.date),
  }),

  // Paginated blog index (10 posts per page)
  generatePaginatedItemsTask({
    dataVar: '${posts}',
    itemsPerPage: 10,
    template: 'src/pages/index.html',
    partialsDir: 'src/partials',
    outDir: 'public',
    basePath: '/',
  }),

  // RSS/Atom feeds
  generateFeedTask({
    articles: '${posts}',
    outDir: 'public',
    site: {
      title: 'My Blog',
      link: 'https://example.com',
      author: { name: 'Jane Doe' },
    },
  }),

  generateSitemapTask({ outDir: 'public' }),
];
```

**Pagination partial (`src/partials/pagination.html`):**
```handlebars
{{#if pagination.totalPages}}
<nav class="pagination">
  {{#if pagination.hasPrev}}
    <a href="{{pagination.prevUrl}}">← Newer</a>
  {{/if}}

  <span>Page {{pagination.currentPage}} of {{pagination.totalPages}}</span>

  {{#if pagination.hasNext}}
    <a href="{{pagination.nextUrl}}">Older →</a>
  {{/if}}
</nav>
{{/if}}
```

---

## Documentation Site

Multi-section docs with auto-generated navigation (like this site!).

**Project structure:**
```
docs/
├── getting-started.md
├── configuration.md
├── builtins/
│   ├── README.md
│   ├── generatePagesTask.md
│   └── generateItemsTask.md
└── advanced/
    ├── custom-tasks.md
    └── architecture.md
```

**Configuration:**
```js
// skier.tasks.mjs
import {
  prepareOutputTask,
  setGlobalsTask,
  generateNavDataTask,
  generatePagesTask,
} from 'skier';

export default [
  prepareOutputTask({ outDir: 'public' }),

  setGlobalsTask({
    values: {
      siteTitle: 'My Library Docs',
      version: '3.0.0',
    }
  }),

  // Auto-generate nav structure from docs folder
  generateNavDataTask({
    docsDir: 'docs',
    outputVar: 'nav',
    order: [
      'getting-started',
      'configuration',
      { section: 'builtins', order: ['README', 'generatePagesTask'] },
      { section: 'advanced' },
    ],
  }),

  // Render docs as pages
  generatePagesTask({
    pagesDir: 'site/templates',
    partialsDir: 'site/partials',
    outDir: 'public',
  }),
];
```

---

## Portfolio / Project Gallery

Showcase projects with category filtering.

**Configuration:**
```js
// skier.tasks.mjs
import {
  prepareOutputTask,
  setGlobalsTask,
  generateItemsTask,
  generatePagesTask,
} from 'skier';

export default [
  prepareOutputTask({ outDir: 'public' }),

  // Load projects and group by category
  generateItemsTask({
    itemsDir: 'src/items/projects',
    partialsDir: 'src/partials',
    outDir: 'public/projects',
    outputVar: 'projects',
    sortFn: (a, b) => b.year - a.year,
  }),

  // Compute category groups
  setGlobalsTask({
    valuesFn: (globals) => ({
      projectsByCategory: globals.projects.reduce((acc, project) => {
        const cat = project.category || 'Other';
        (acc[cat] = acc[cat] || []).push(project);
        return acc;
      }, {}),
    }),
  }),

  generatePagesTask({
    pagesDir: 'src/pages',
    partialsDir: 'src/partials',
    outDir: 'public',
  }),
];
```

**Project frontmatter (`src/items/projects/my-app.md`):**
```yaml
---
title: My Awesome App
category: Web Apps
year: 2024
thumbnail: /images/my-app.png
link: https://myapp.example.com
---
Description of the project goes here...
```

---

## External API Integration

Fetch data from an API at build time.

**Pre-build script (`scripts/fetch-data.js`):**
```js
// Run before skier build
import fs from 'fs';

const response = await fetch('https://api.example.com/products');
const data = await response.json();

fs.writeFileSync('_data/products.json', JSON.stringify({ products: data }));
```

**Configuration:**
```js
// skier.tasks.mjs
import { readFileSync } from 'fs';
import { setGlobalsTask, generatePagesTask } from 'skier';

// Load pre-fetched data
const productData = JSON.parse(readFileSync('./_data/products.json', 'utf-8'));

export default [
  setGlobalsTask({
    values: {
      products: productData.products,
    }
  }),

  generatePagesTask({
    pagesDir: 'src/pages',
    partialsDir: 'src/partials',
    outDir: 'public',
  }),
];
```

**package.json:**
```json
{
  "scripts": {
    "fetch": "node scripts/fetch-data.js",
    "build": "npm run fetch && skier"
  }
}
```

---

## Hybrid: Static Marketing + SPA

Use Skier for landing pages, Vite for the app.

**Project structure:**
```
marketing/         # Skier project
├── src/
├── public/
└── skier.tasks.mjs

app/               # Vite project
├── src/
└── vite.config.js

dist/              # Combined output
├── index.html     # From Skier
├── features.html  # From Skier
└── app/           # From Vite
    └── index.html
```

**Build script (`package.json`):**
```json
{
  "scripts": {
    "build:marketing": "cd marketing && skier",
    "build:app": "cd app && vite build --outDir ../dist/app",
    "build": "npm run build:marketing && npm run build:app"
  }
}
```

---

**Next:** See [Custom Tasks](./custom-tasks.md) for building your own pipeline steps.
