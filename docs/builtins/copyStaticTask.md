# copyStaticTask

## Summary
Copies static assets (images, fonts, CSS, JS, etc.) from a source directory to your output directory. Use this to include files that don’t require processing (such as favicon, robots.txt, fonts, etc.) in your generated site.

## Default Behavior
With minimal config, all files and folders in the specified `from` directory are recursively copied to the specified `to` directory, preserving their relative paths.

## Configuration Options
- `from` (string, required): Path to your static assets folder (e.g., `src/static`).
- `to` (string, required): Path to your output directory (e.g., `public`).

**Example config:**
```js
copyStaticTask({
  from: 'src/static',
  to: 'public',
})
```

## Input Expectations
- A folder containing static files and subfolders (e.g., `src/static/`).
- Any file type is allowed; files are copied as-is.

**Example:**
```
src/
  static/
    favicon.ico
    fonts/
      OpenSans.woff2
    images/
      logo.png
    robots.txt
```

## Output
- The contents of `from` are copied to `to`, preserving the folder structure.

**Example:**
```
public/
  favicon.ico
  fonts/
    OpenSans.woff2
  images/
    logo.png
  robots.txt
```

## Practical Example
```js
const { copyStaticTask } = require('skier/builtins');

module.exports = [
  copyStaticTask({
    from: 'src/static',
    to: 'public',
  }),
];
```

## Common Pitfalls & Tips
- Make sure your `from` directory exists and contains only files you want published.
- If you have files in both your static folder and other output tasks (e.g., generated HTML), ensure there are no filename conflicts in the output directory.

## Related Tasks/Docs
- [generatePagesTask](./generatePagesTask.md): For generating HTML pages.
- [bundleCssTask](./bundleCssTask.md): For bundling CSS files.
- [Getting Started guide](../getting-started.md)
