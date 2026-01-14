---
title: bundleCssTask
subcategory: Setup
order: 3
---

# bundleCssTask

Bundle and minify CSS files into a single optimized stylesheet.

---

## When to Use

✅ Use `bundleCssTask` when you want:
- Multiple CSS files combined into one
- Production minification
- Consistent ordering of stylesheets

❌ Use `copyStaticTask` instead for:
- Pre-minified CSS libraries
- CSS you don't want modified

---

## Quick Start

```js
bundleCssTask({
  from: 'src/styles',
  to: 'public',
  output: 'styles.min.css',
  minify: true,
})
```

**Input:** All `.css` files in `src/styles/`
**Output:** Single `public/styles.min.css`

---

## Configuration

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `from` | string | ✅ | Source CSS directory |
| `to` | string | ✅ | Output directory |
| `output` | string | ✅ | Output filename |
| `minify` | boolean | | Minify output (default: `true`) |

---

## File Order

Files are concatenated in **alphabetical order**. Control ordering with filename prefixes:

```
src/styles/
├── 01-reset.css        # First: CSS reset
├── 02-variables.css    # Second: Custom properties
├── 03-base.css         # Third: Base styles
├── 10-components.css   # Components
├── 20-layouts.css      # Layouts
└── 99-utilities.css    # Last: Utility overrides
```

---

## Development vs Production

Disable minification for readable debug output:

```js
bundleCssTask({
  from: 'src/styles',
  to: 'public',
  output: process.env.NODE_ENV === 'production'
    ? 'styles.min.css'
    : 'styles.css',
  minify: process.env.NODE_ENV === 'production',
})
```

---

## Referencing in Templates

Link to your bundled stylesheet:

```handlebars
<link rel="stylesheet" href="/styles.min.css">
```

---

## Related Tasks

- [copyStaticTask](./copyStaticTask.md) — For assets that don't need processing
- [generatePagesTask](./generatePagesTask.md) — Templates that reference CSS
