# generateSitemapTask

## Summary
Generates a `sitemap.xml` file for your site based on the pages produced by your build. This helps search engines index your site efficiently.

## Default Behavior
With minimal config, collects all generated HTML pages in your output directory and writes their URLs to a `sitemap.xml` file at the site root.

## Configuration Options
- `scanDir` (string, required): Directory to scan for HTML files (e.g., `public`).
- `outDir` (string, required): Directory to output the sitemap file to (e.g., `public`).
- `siteUrl` (string, optional): The fully qualified base URL of your site (e.g., `https://example.com`).

**Example config:**
```js
generateSitemapTask({
  scanDir: 'public',
  outDir: 'public',
  siteUrl: 'https://example.com',
})
```

## Input Expectations
- An output directory with generated HTML files.
- Base URL must be provided for correct sitemap URLs.

## Output
- A `sitemap.xml` file at the root of your output directory, listing all included pages as absolute URLs.

## Practical Example
```js
const { generateSitemapTask } = require('skier/builtins');

module.exports = [
  // ...other tasks
  generateSitemapTask({
    scanDir: 'public',
    outDir: 'public',
    siteUrl: 'https://example.com',
  }),
];
```

## Common Pitfalls & Tips
- Ensure your `baseUrl` is correct and includes the protocol (http/https).
- Exclude error pages or drafts with the `exclude` option.
- Run this task after your page generation tasks so all pages are included.

## Related Tasks/Docs
- [generatePagesTask](./generatePagesTask.md)
- [Getting Started guide](../getting-started.md)
