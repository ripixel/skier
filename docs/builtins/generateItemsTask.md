# generateItemsTask

## Summary
Generates HTML pages for collections of items (e.g., blog posts, portfolio entries) from Markdown or data files. Supports sorting, excerpts, custom templates, and configurable output structure.

## Default Behavior
With minimal config, reads all Markdown files in the specified `itemsDir`, sorts them by date (if available), and renders each to an HTML page using the specified item template. Also generates an index/list page for the collection.

## Configuration Options
- `itemsDir` (string, required): Path to the directory containing item Markdown files (e.g., `src/posts`).
- `partialsDir` (string, required): Path to your partials directory (e.g., `src/partials`).
- `outDir` (string, required): Path to the output directory for generated HTML (e.g., `public/posts`).
- `outputVar` (string, required): Name of the variable to output the item list as.
- `templateExtension` (string, optional): Extension for section templates (default: `.html`).
- `partialExtension` (string, optional): Extension for partials (default: `.html`).
- `flatStructure` (boolean, optional): If true, treat all files in itemsDir as items (no sections).
- `frontmatterParser` (function, optional): Custom frontmatter parser.
- `excerptFn` (function, optional): Custom excerpt extractor.
- `sortFn` (function, optional): Custom sorting function for items.
- `linkFn` (function, optional): Custom link generator.
- `outputPathFn` (function, optional): Custom output path generator.
- `markdownRenderer` (function, optional): Custom markdown renderer.
- `extractDate` (function, optional): Custom date extractor.
- `additionalVarsFn` (function, optional): Function to inject additional variables into the render context for each item.

**Example config:**
```js
generateItemsTask({
  itemsDir: 'src/posts',
  partialsDir: 'src/partials',
  outDir: 'public/posts',
  outputVar: 'posts',
  templateExtension: '.html',
  partialExtension: '.html',
  flatStructure: false,
})
```

## Input Expectations
- A directory of Markdown files, each representing an item (e.g., a blog post).
- Each file can include frontmatter (YAML or TOML) for metadata like title, date, tags.
- Templates for items and list/index pages (Handlebars or HTML).

**Example:**
```
src/
  posts/
    first-post.md
    second-post.md
  templates/
    post.html
    posts.html
```

## Output
- One HTML file per item, rendered from `itemTemplate`.
- One index/list HTML page rendered from `listTemplate`.
- Output filenames/structure configurable with `flat` option.

**Example:**
```
public/
  posts/
    first-post/index.html
    second-post/index.html
    index.html
```

## Practical Example
```js
const { generateItemsTask } = require('skier/builtins');

module.exports = [
  generateItemsTask({
    itemsDir: 'src/posts',
    partialsDir: 'src/partials',
    outDir: 'public/posts',
    outputVar: 'posts',
    templateExtension: '.html',
    partialExtension: '.html',
    flatStructure: false,
  }),
];
```

## Common Pitfalls & Tips
- If your Markdown files lack frontmatter, sorting by `date` may not work as expected.
- Use the `excerptSeparator` to control where the preview/summary ends in list views.
- If `flat` is true, all items are output as `outDir/slug.html`; otherwise, as `outDir/slug/index.html`.
- Ensure your templates expect the available item fields (frontmatter, excerpt, etc.).
- When adding new fields to frontmatter, update your templates accordingly.

## Related Tasks/Docs
- [generatePagesTask](./generatePagesTask.md)
- [generateFeedTask](./generateFeedTask.md)
- [Markdown & Frontmatter](../markdown-frontmatter.md)
