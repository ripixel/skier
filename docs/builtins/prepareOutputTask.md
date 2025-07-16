# prepareOutputTask

## Summary
Ensures the output directory exists and is ready for site generation. This is typically the first task in your pipeline and prevents errors from missing or stale output folders.

## Default Behavior
By default, creates the specified output directory (`outDir`) if it does not exist, and optionally empties it before the build if `clean` is enabled.

## Configuration Options
- `outDir` (string, required): Path to your output directory (e.g., `public`).

**Example config:**
```js
prepareOutputTask({
  outDir: 'public',
})
```

## Input Expectations
- No input files required. This task operates on the output directory only.

## Output
- Ensures the output directory exists.
- If `clean: true`, removes all files/folders inside the output directory before the build.

## Practical Example
```js
const { prepareOutputTask } = require('skier/builtins');

module.exports = [
  prepareOutputTask({
    outDir: 'public',
  }),
  // ...other tasks
];
```

## Common Pitfalls & Tips
- Use `clean: true` to avoid stale files from previous builds, but be careful if you manually place files in the output directory.
- Always run this task before any that write to the output directory.

## Related Tasks/Docs
- [copyStaticTask](./copyStaticTask.md)
- [generatePagesTask](./generatePagesTask.md)
- [Getting Started guide](../getting-started.md)
