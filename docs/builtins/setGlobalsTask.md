# setGlobalsTask

Sets global variables for use in templates and tasks. Use this to define site-wide values (site title, author, base URL, etc.) that are available everywhere in your pipeline.

## Summary
Sets global variables for use in templates and tasks. Use this to define site-wide values (site title, author, base URL, etc.) that are available everywhere in your pipeline.

## Default Behavior
With minimal config, sets the provided key-value pairs onto the global context. These values are accessible in all templates and subsequent tasks.

## Configuration Options
- `values` (object, optional): An object whose keys and values will be set as globals.
- `valuesFn` (function, optional): A function that receives the current globals and returns an object to merge into globals.

**Example config (static):**
```js
setGlobalsTask({
  values: {
    siteTitle: 'My Blog',
    author: 'Jane Doe',
    baseUrl: 'https://example.com',
  }
})
```

**Example config (dynamic):**
```js
setGlobalsTask({
  valuesFn: globals => ({
    latestVersion: extractVersion(globals.changelogHtml)
  })
})
```

## Input Expectations
- No input files required. You provide the globals directly in the config.

## Output
- Sets the specified globals on the global context for all subsequent tasks and templates.

## Practical Example
```js
const { setGlobalsTask } = require('skier/builtins');

module.exports = [
  setGlobalsTask({
    values: {
      siteTitle: 'My Blog',
      author: 'Jane Doe',
    }
  }),
  // ...other tasks
];
```

## Common Pitfalls & Tips
- Overwriting a global with the same key in a later task will replace its value.
- Use this task early in your pipeline to ensure all globals are available to later tasks.
- For Markdown-based globals, see [setGlobalFromMarkdownTask](./setGlobalFromMarkdownTask.md).

## Related Tasks/Docs
- [setGlobalFromMarkdownTask](./setGlobalFromMarkdownTask.md)
- [Tasks guide](../tasks.md)
