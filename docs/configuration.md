# Configuration

Skier is highly configurable, allowing you to tailor your build pipeline to your project's needs. This guide covers how to configure Skier, including file formats, global options, and examples.

---

## Config File Location & Format

Skier looks for a pipeline config file at your project root. Supported formats:

- `skier.tasks.js` (CommonJS, most common)
- `skier.tasks.cjs` (explicit CommonJS)
- `skier.tasks.ts` (TypeScript, requires build step or ts-node)

You can export either an array of tasks or a function returning an array (for dynamic configs).

---

## Example: Basic Config File

```js
// skier.tasks.js
const { generatePagesTask, generateItemsTask, copyStaticTask } = require('skier/builtins');

module.exports = [
  generatePagesTask({
    pagesDir: 'src/pages',
    partialsDir: 'src/partials',
    outDir: 'public',
  }),
  generateItemsTask({
    itemsDir: 'src/blog',
    template: 'src/pages/blog-post.html',
    partialsDir: 'src/partials',
    outDir: 'public/blog',
  }),
  copyStaticTask({
    staticDir: 'src/static',
    outDir: 'public',
  }),
];
```

---

## Global Options

Each task accepts its own config, but you can also define global variables and options that are available to all tasks and templates.

- **Globals**: Set via `setGlobalsTask` or `setGlobalFromMarkdownTask`.
- **Debug Mode**: Run Skier with `--debug` to enable verbose logging.
- **Output Directory**: Typically set per task (`outDir`), but you can use the same directory for all outputs.

---

## Dynamic Config Example

You can export a function for dynamic configuration:

```js
module.exports = (env) => [
  // Tasks can be conditionally included based on env
];
```

---

## Overriding Defaults

Most built-in tasks have sensible defaults, but you can override any option. See the docs for each built-in for details and examples.

---

## Best Practices
- Keep your config file small and focused—use custom tasks for advanced logic.
- Co-locate templates, partials, and content for clarity.
- Use globals for site-wide variables (site title, author, etc.).

---

**Next:** Learn more about [Tasks](./tasks.md) and [Built-in Tasks](./builtins/generateItemsTask.md) to customize your pipeline.
