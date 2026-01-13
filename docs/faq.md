# FAQ & Troubleshooting

Real solutions for real problems you'll encounter with Skier.

---

## Build Issues

### My build is slow

**Symptoms:** Build takes 10+ seconds for a small site.

**Common causes:**

1. **Large static assets** — Use `copyStaticTask` for big files, not template processing
2. **Too many partials** — Each partial is re-read per page; consolidate if possible
3. **Expensive `additionalVarsFn`** — Avoid file I/O or computation inside these functions

**Debug:** Run with `--debug` to see per-task timing:
```bash
npx skier --debug
```

---

### "require() of ES Module not supported"

**Symptoms:** Build fails with this error when using v3+.

**Cause:** A dependency (often `chalk`, `feed`, or others) has migrated to ESM-only.

**Fix:** Convert your config to ESM:

```bash
# Rename your config
mv skier.tasks.cjs skier.tasks.mjs
```

Then update the syntax:
```js
// Before
const { generatePagesTask } = require('skier');
module.exports = [/* ... */];

// After
import { generatePagesTask } from 'skier';
export default [/* ... */];
```

See the [Migration Guide](./migration.md) for full details.

---

### "Cannot find module" errors

**Symptoms:** Imports fail despite the file existing.

**Cause:** ESM requires file extensions in relative imports.

**Fix:**
```js
// Wrong
import { helper } from './utils';

// Correct
import { helper } from './utils.js';
```

---

## Template Issues

### Variable not found / undefined in template

**Symptoms:** `{{myVar}}` renders as empty or `undefined`.

**Debug steps:**

1. **Check task order** — Is the task that sets the variable running *before* the task that uses it?
   ```js
   // Wrong order
   generatePagesTask({ /* uses posts */ }),
   generateItemsTask({ outputVar: 'posts' }), // Too late!

   // Correct order
   generateItemsTask({ outputVar: 'posts' }),
   generatePagesTask({ /* uses posts */ }),
   ```

2. **Check the variable name** — Is it `posts` or `allPosts`? Check your `outputVar` setting.

3. **Check globals** — Run with `--debug` to see the globals object at each step.

---

### Markdown not rendering as HTML

**Symptoms:** Raw Markdown appears in the page instead of formatted HTML.

**Cause:** You're using double braces which HTML-escape the content.

**Fix:** Use triple braces for raw HTML:
```handlebars
<!-- Wrong: escapes HTML -->
{{content}}

<!-- Correct: renders HTML -->
{{{content}}}
```

---

### Partial not found

**Symptoms:** `{{> myPartial}}` throws an error.

**Checklist:**
1. Does the file exist at `partialsDir/myPartial.html`?
2. Is `partialsDir` correctly configured in your task?
3. Does the file extension match `partialExtension` (default: `.html`)?

---

## Pagination Issues

### Pagination URLs are wrong

**Symptoms:** Links go to `/undefined/page/2` or similar.

**Cause:** `basePath` is misconfigured.

**Fix:** `basePath` should be the URL path, not the output directory:
```js
generatePaginatedItemsTask({
  outDir: 'public',        // Filesystem path
  basePath: '/blog',       // URL path (what appears in links)
  // ...
})
```

---

### Page 1 URL is different from other pages

**Expected behavior!** Page 1 is at the base path (`/blog`), subsequent pages at `/blog/page/N`.

If you need consistent URLs, handle it in your template:
```handlebars
{{#if (eq pagination.currentPage 1)}}
  <link rel="canonical" href="/blog">
{{else}}
  <link rel="canonical" href="/blog/page/{{pagination.currentPage}}">
{{/if}}
```

---

## Feed Issues

### Dates in feed are invalid

**Symptoms:** Feed validators complain about date format.

**Cause:** Dates must be ISO 8601 format or JavaScript Date objects.

**Fix:** Ensure your frontmatter dates are properly formatted:
```yaml
# In your Markdown frontmatter
date: 2024-01-15T10:00:00Z  # ISO 8601

# Or in generateItemsTask, transform the date
itemTransformFn: (item) => ({
  ...item,
  dateObj: new Date(item.date),
})
```

---

### Feed URLs are relative

**Symptoms:** Feed readers show broken links.

**Cause:** `site.link` must be an absolute URL.

**Fix:**
```js
generateFeedTask({
  site: {
    link: 'https://example.com',  // Include protocol!
    // ...
  }
})
```

---

## CSS Issues

### CSS order is wrong

**Symptoms:** Later CSS rules don't override earlier ones as expected.

**Cause:** `bundleCssTask` concatenates files in alphabetic order.

**Fix:** Prefix filenames to control order:
```
src/styles/
  01-reset.css
  02-variables.css
  03-components.css
  99-overrides.css
```

---

## Custom Task Issues

### Custom task not running

**Symptoms:** Your task appears to do nothing.

**Checklist:**
1. Is the task in the exported array?
2. Is `run` an async function that's actually called?
3. Check for silent errors — wrap in try/catch:
   ```js
   run: async (config, ctx) => {
     try {
       // Your code
     } catch (err) {
       ctx.logger.error('Task failed:', err);
       throw err;
     }
   }
   ```

---

### Globals from custom task not available

**Symptoms:** You return data but it's not in globals.

**Cause:** You must return a plain object, not assign to ctx.globals.

```js
// Wrong — direct assignment doesn't persist
run: async (config, ctx) => {
  ctx.globals.myData = computeData();
}

// Correct — return triggers a merge
run: async (config, ctx) => {
  return { myData: computeData() };
}
```

---

## Getting Help

Still stuck?

1. **Check debug output:** `npx skier --debug`
2. **Read the source:** Skier is small and readable
3. **Open an issue:** [GitHub Issues](https://github.com/ripixel/skier/issues)
