# generatePaginatedItemsTask

## Summary
Generates paginated HTML pages from a data source (JSON file or pipeline variable), producing multiple page files with navigation controls. Ideal for timelines, activity feeds, blog archives, or any collection that needs to be split across multiple pages.

## Default Behavior
Reads data from a JSON file or pipeline variable, chunks it into pages based on `itemsPerPage`, and renders each page using the specified Handlebars template. Page 1 is output at the base path, subsequent pages at `basePath/page/N.html`.

## Configuration Options
- `dataFile` (string): Path to a JSON file containing the data array. Mutually exclusive with `dataVar`.
- `dataVar` (string): Variable name from globals using `${varName}` syntax. Mutually exclusive with `dataFile`.
- `dataKey` (string, optional): Key within the JSON to extract the array (e.g., `'timeline'` for `data.timeline`).
- `itemsPerPage` (number, required): Number of items per page.
- `template` (string, required): Path to the Handlebars template for each page.
- `partialsDir` (string, required): Directory containing Handlebars partials.
- `outDir` (string, required): Output directory for generated pages.
- `basePath` (string, required): URL base path (e.g., `/life-fitness`).
- `outputVar` (string, optional): Variable name for items array in templates (default: `'items'`).
- `paginationVar` (string, optional): Variable name for pagination object (default: `'pagination'`).
- `itemTransformFn` (function, optional): Transform each item before rendering.
- `additionalVarsFn` (function, optional): Inject additional variables per page.

**Example config:**
```js
generatePaginatedItemsTask({
  dataFile: './data/posts.json',
  dataKey: 'articles',
  itemsPerPage: 10,
  template: './templates/archive.html',
  partialsDir: './partials',
  outDir: './public',
  basePath: '/blog',
})
```

## Pagination Object
Templates receive a `pagination` object with full navigation metadata:

```js
{
  currentPage: 2,           // 1-indexed
  totalPages: 5,
  totalItems: 47,
  itemsPerPage: 10,
  hasNext: true,
  hasPrev: true,
  nextUrl: '/blog/page/3',
  prevUrl: '/blog',         // Page 1 uses base path
  firstUrl: '/blog',
  lastUrl: '/blog/page/5',
  pages: [                  // For page number navigation
    { number: 1, url: '/blog', isCurrent: false },
    { number: 2, url: '/blog/page/2', isCurrent: true },
    // ...
  ]
}
```

## Output Structure
For `basePath: '/life-fitness'` with 47 items at 10 per page:

```
public/
├── life-fitness.html           # Page 1 (items 1-10)
└── life-fitness/
    └── page/
        ├── 2.html              # Page 2 (items 11-20)
        ├── 3.html              # Page 3 (items 21-30)
        ├── 4.html              # Page 4 (items 31-40)
        └── 5.html              # Page 5 (items 41-47)
```

## Template Example
```handlebars
<h1>Blog Archive</h1>

{{#each items}}
  <article>
    <h2>{{this.title}}</h2>
    <p>{{this.excerpt}}</p>
  </article>
{{/each}}

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

## Practical Example
```js
const { generatePaginatedItemsTask } = require('skier');

module.exports = [
  generatePaginatedItemsTask({
    dataFile: './items/life/fitness.json',
    dataKey: 'timeline',
    itemsPerPage: 15,
    template: './pages/life-fitness.html',
    partialsDir: './partials',
    outDir: './public',
    basePath: '/life-fitness',
    outputVar: 'activities',
    itemTransformFn: (item) => ({
      ...item,
      formattedDate: new Date(item.date).toLocaleDateString(),
    }),
    additionalVarsFn: ({ pageNumber, totalPages }) => ({
      page: 'life-fitness',
      subpage: pageNumber > 1 ? `| Page ${pageNumber}` : '',
    }),
  }),
];
```

## Edge Cases
- **0 items**: Generates page 1 with empty `items` array and `totalPages: 1`.
- **Items ≤ itemsPerPage**: Generates single page with `hasNext: false` and `hasPrev: false`.
- **Missing dataVar**: Uses empty array and logs a warning.
- **Missing dataKey**: Uses empty array if the key doesn't exist in the JSON.

## Common Pitfalls & Tips
- Items should be pre-sorted in your JSON or via `itemTransformFn`. The task does not sort for you.
- Use `dataKey` when your JSON wraps the array in an object (e.g., `{ "timeline": [...] }`).
- All generated pages are discoverable by `generateSitemapTask`.
- The `pages` array in the pagination object is useful for generating numbered page links.

## Related Tasks/Docs
- [generateItemsTask](./generateItemsTask.md)
- [generatePagesTask](./generatePagesTask.md)
- [generateSitemapTask](./generateSitemapTask.md)
