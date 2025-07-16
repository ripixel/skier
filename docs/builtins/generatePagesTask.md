# generatePagesTask

## Summary
Generates static HTML pages from templates and partials. Use this to render your site's main pages (home, about, contact, etc.) with Handlebars or HTML templates.

## Default Behavior
With minimal config, renders all `.html` (or `.hbs`) files in the specified `pagesDir` using the provided global context, and writes the output to the specified `outDir`.

## Configuration Options
- `pagesDir` (string, required): Path to your templates directory (e.g., `src/pages`).
- `partialsDir` (string, required): Path to your partials directory (e.g., `src/partials`).
- `outDir` (string, required): Path to your output directory (e.g., `public`).
- `pageExt` (string, optional): File extension for templates to process (e.g., `.html` or `.hbs`). Defaults to `.html`.
- `additionalVarsFn` (function, optional): Function to inject additional variables into the render context for each page.

**Example config:**
```js
generatePagesTask({
  pagesDir: 'src/pages',
  partialsDir: 'src/partials',
  outDir: 'public',
  pageExt: '.html',
})
```

## Input Expectations
- A directory with template files (default: `.html` or `.hbs`).
- Optional partials directory for reusable template snippets.
- Global context variables available for template rendering.

**Example:**
```
src/
  pages/
    index.html
    about.html
  partials/
    header.html
    footer.html
```

## Output
- Renders each template in `pagesDir` to an HTML file in `outDir`, preserving filenames.
- Partials are included where referenced in templates.

**Example:**
```
public/
  index.html
  about.html
```

## Practical Example
```js
const { generatePagesTask } = require('skier/builtins');

module.exports = [
  generatePagesTask({
    pagesDir: 'src/pages',
    partialsDir: 'src/partials',
    outDir: 'public',
    pageExt: '.html',
  }),
];
```

## Common Pitfalls & Tips
- Use partials for shared layout (header, footer, etc.) to avoid duplication.
- All global variables are available in templates; set them with `setGlobalsTask` or similar.
- If you use a non-default extension, set `ext` accordingly.

## Related Tasks/Docs
- [setGlobalsTask](./setGlobalsTask.md)
- [copyStaticTask](./copyStaticTask.md)
- [Templates & Partials guide](../templates-partials.md)
