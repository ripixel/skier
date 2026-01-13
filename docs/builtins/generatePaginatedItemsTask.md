# generatePaginatedItemsTask

Generate multiple HTML pages from a data array with built-in pagination controls.

---

## When to Use

✅ Use `generatePaginatedItemsTask` when you need:
- Paginated blog archives
- Activity timelines split across pages
- Any large dataset that should be chunked

❌ Use `generateItemsTask` instead when:
- Each item needs its own detail page
- Data comes from Markdown files

---

## Quick Start

```js
generatePaginatedItemsTask({
  dataVar: '${posts}',
  itemsPerPage: 10,
  template: 'src/pages/blog.html',
  partialsDir: 'src/partials',
  outDir: 'public',
  basePath: '/blog',
})
```

**Output files:**
```
public/
├── blog.html           # Page 1
└── blog/
    └── page/
        ├── 2.html      # Page 2
        └── 3.html      # Page 3
```

---

## Configuration

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `dataFile` | string | ⚡ | Path to JSON file |
| `dataVar` | string | ⚡ | Pipeline variable using `${varName}` syntax |
| `dataKey` | string | | Key to extract array from JSON object |
| `itemsPerPage` | number | ✅ | Items per page |
| `template` | string | ✅ | Handlebars template path |
| `partialsDir` | string | ✅ | Partials directory |
| `outDir` | string | ✅ | Output directory |
| `basePath` | string | ✅ | URL base path (for links) |
| `outputVar` | string | | Template variable name for items (default: `'items'`) |
| `paginationVar` | string | | Template variable for pagination (default: `'pagination'`) |
| `itemTransformFn` | function | | Transform each item |
| `additionalVarsFn` | function | | Add extra template variables |

⚡ Exactly one of `dataFile` or `dataVar` is required.

---

## Data Sources

**From pipeline globals (recommended):**
```js
generateItemsTask({ outputVar: 'posts' }),
generatePaginatedItemsTask({
  dataVar: '${posts}',
  // ...
})
```

**From JSON file:**
```js
generatePaginatedItemsTask({
  dataFile: './data/activities.json',
  dataKey: 'timeline',  // Extract data.timeline
  // ...
})
```

---

## Pagination Object

Your template receives a `pagination` object:

```js
{
  currentPage: 2,
  totalPages: 5,
  totalItems: 47,
  itemsPerPage: 10,

  hasNext: true,
  hasPrev: true,

  nextUrl: '/blog/page/3',
  prevUrl: '/blog',          // Page 1 uses base path
  firstUrl: '/blog',
  lastUrl: '/blog/page/5',

  pages: [
    { number: 1, url: '/blog', isCurrent: false },
    { number: 2, url: '/blog/page/2', isCurrent: true },
    { number: 3, url: '/blog/page/3', isCurrent: false },
    // ...
  ]
}
```

---

## Template Example

```handlebars
<h1>Blog Archive</h1>

{{#each items}}
  <article>
    <h2><a href="{{this.link}}">{{this.title}}</a></h2>
    <time>{{this.formattedDate}}</time>
    <p>{{this.excerpt}}</p>
  </article>
{{/each}}

{{#if pagination.totalPages}}
<nav class="pagination">
  {{#if pagination.hasPrev}}
    <a href="{{pagination.prevUrl}}" rel="prev">← Newer</a>
  {{/if}}

  {{#each pagination.pages}}
    {{#if this.isCurrent}}
      <span class="current">{{this.number}}</span>
    {{else}}
      <a href="{{this.url}}">{{this.number}}</a>
    {{/if}}
  {{/each}}

  {{#if pagination.hasNext}}
    <a href="{{pagination.nextUrl}}" rel="next">Older →</a>
  {{/if}}
</nav>
{{/if}}
```

---

## Transforming Items

Format data before rendering:

```js
generatePaginatedItemsTask({
  // ...
  itemTransformFn: (item) => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  }),
})
```

---

## Additional Page Variables

Inject extra data per page:

```js
generatePaginatedItemsTask({
  // ...
  additionalVarsFn: ({ pageNumber, totalPages, items }) => ({
    pageTitle: pageNumber === 1
      ? 'Blog'
      : `Blog - Page ${pageNumber} of ${totalPages}`,
    isFirstPage: pageNumber === 1,
  }),
})
```

---

## Real-World Example

Activity timeline with date grouping:

```js
generatePaginatedItemsTask({
  dataVar: '${activities}',
  itemsPerPage: 20,
  template: 'src/pages/activity-timeline.html',
  partialsDir: 'src/partials',
  outDir: 'public',
  basePath: '/activity',
  outputVar: 'activities',

  itemTransformFn: (activity) => ({
    ...activity,
    icon: getActivityIcon(activity.type),
    formattedDate: formatDate(activity.date),
  }),

  additionalVarsFn: ({ pageNumber, items }) => {
    // Group by month for this page
    const byMonth = items.reduce((acc, item) => {
      const month = item.date.slice(0, 7);
      (acc[month] = acc[month] || []).push(item);
      return acc;
    }, {});

    return {
      pageTitle: `Activity${pageNumber > 1 ? ` - Page ${pageNumber}` : ''}`,
      monthGroups: Object.entries(byMonth),
    };
  },
})
```

---

## Edge Cases

| Situation | Behavior |
|-----------|----------|
| 0 items | Generates page 1 with empty `items` array |
| Items ≤ itemsPerPage | Single page, `hasNext: false`, `hasPrev: false` |
| Missing dataVar | Empty array, logs warning |
| Missing dataKey | Empty array if key not found in JSON |

---

## Common Mistakes

❌ **Confusing basePath and outDir:**
```js
{
  outDir: 'public',        // Filesystem path
  basePath: '/blog',       // URL path (for links!)
}
```

❌ **Expecting sorted data:**
Items are NOT sorted automatically. Sort in `dataFile`, via `itemTransformFn`, or in a prior task.

❌ **Using wrong variable syntax:**
```js
dataVar: 'posts',      // ❌ Wrong
dataVar: '${posts}',   // ✅ Correct
```

---

## Related Tasks

- [generateItemsTask](./generateItemsTask.md) — For individual item pages
- [generatePagesTask](./generatePagesTask.md) — For standalone pages
- [generateSitemapTask](./generateSitemapTask.md) — Includes paginated pages
