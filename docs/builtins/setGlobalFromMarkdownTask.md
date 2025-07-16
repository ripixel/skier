# setGlobalFromMarkdownTask

Reads a Markdown file, renders it to HTML, and sets the result as a global variable for use in templates and tasks. Ideal for site-wide content like an About section, footer, or legal notices.

## Summary
Reads a Markdown file, renders it to HTML, and sets the result as a global variable for use in templates and tasks. Ideal for site-wide content like an About section, footer, or legal notices.

## Default Behavior
With minimal config, reads the specified Markdown file, renders it to HTML, and sets it as a global variable with the given key.

## Configuration Options
- `mdPath` (string, required): Path to the Markdown file to read (e.g., `src/about.md`).
- `outputVar` (string, required): The name of the global variable to set (e.g., `aboutHtml`).

**Example config:**
```js
setGlobalFromMarkdownTask({
  mdPath: 'src/about.md',
  outputVar: 'aboutHtml',
})
```

## Input Expectations
- A Markdown file at the specified path.
- Can include frontmatter; only the body is rendered to HTML.

## Output
- Renders the Markdown file to HTML and sets it as `globals[globalKey]` for all subsequent tasks and templates.

## Practical Example
```js
const { setGlobalFromMarkdownTask } = require('skier/builtins');

module.exports = [
  setGlobalFromMarkdownTask({
    mdPath: 'src/about.md',
    outputVar: 'aboutHtml',
  }),
  // ...other tasks
];
```

## Common Pitfalls & Tips
- The rendered HTML is unescaped; use triple braces (`{{{aboutHtml}}}`) in your templates to inject it.
- If your Markdown file contains frontmatter, it will be ignored in the rendered HTML but fields are not set as globals (use `setGlobalsTask` for that).
- Useful for legal, about, or reusable content blocks.

## Related Tasks/Docs
- [setGlobalsTask](./setGlobalsTask.md)
- [Markdown & Frontmatter](../markdown-frontmatter.md)
