# bundleCssTask

## Summary
Bundles and minifies CSS files for your site. Use this to optimize your stylesheets for production by combining multiple CSS files into one and reducing file size.

## Default Behavior
With minimal config, all `.css` files in the specified input directory are concatenated, minified, and written to the output file.

## Configuration Options
- `from` (string, required): Path to the directory containing source CSS files (e.g., `src/styles`).
- `to` (string, required): Path to the output directory (e.g., `public`).
- `output` (string, required): Output filename for the bundled/minified CSS (e.g., `styles.min.css`).
- `minify` (boolean, optional): Whether to minify the output CSS.

**Example config:**
```js
bundleCssTask({
  from: 'src/styles',
  to: 'public',
  output: 'styles.min.css',
  minify: true,
})
```

## Input Expectations
- A directory containing one or more `.css` files.
- Files are processed in alphanumeric order unless `include` is specified.

**Example:**
```
src/
  styles/
    reset.css
    main.css
    theme.css
```

## Output
- A single bundled (and optionally minified) CSS file at the specified output path.

**Example:**
```
public/
  styles.css
```

## Practical Example
```js
const { bundleCssTask } = require('skier/builtins');

module.exports = [
  bundleCssTask({
    from: 'src/styles',
    to: 'public',
    output: 'styles.min.css',
    minify: true,
  }),
];
```

## Common Pitfalls & Tips
- Make sure all CSS files you want included are in the input directory or match the `include` patterns.
- If you need to control the order of CSS, use filename prefixes (e.g., `01-reset.css`, `02-main.css`).
- If `minify` is false, the output will be readable but larger.

## Related Tasks/Docs
- [copyStaticTask](./copyStaticTask.md)
- [generatePagesTask](./generatePagesTask.md)
- [Getting Started guide](../getting-started.md)
