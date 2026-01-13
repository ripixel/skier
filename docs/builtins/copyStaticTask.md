# copyStaticTask

Copy static assets to the output directory without processing.

---

## When to Use

✅ Use `copyStaticTask` for:
- Images, fonts, videos
- favicon.ico, robots.txt
- Pre-built JavaScript libraries
- Any file that doesn't need templating

❌ Use `bundleCssTask` instead for:
- CSS files you want concatenated/minified

---

## Quick Start

```js
copyStaticTask({
  from: 'src/static',
  to: 'public',
})
```

**Input:** All files in `src/static/`
**Output:** Same files copied to `public/`

---

## Configuration

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `from` | string | ✅ | Source directory |
| `to` | string | ✅ | Destination directory |

---

## Directory Preservation

The entire directory structure is preserved:

```
src/static/          →    public/
├── favicon.ico      →    ├── favicon.ico
├── robots.txt       →    ├── robots.txt
├── fonts/           →    ├── fonts/
│   └── Inter.woff2  →    │   └── Inter.woff2
└── images/          →    └── images/
    ├── logo.png     →        ├── logo.png
    └── hero.jpg     →        └── hero.jpg
```

---

## Multiple Static Directories

Call the task multiple times for different sources:

```js
export default [
  // Copy general assets
  copyStaticTask({
    from: 'src/static',
    to: 'public',
  }),

  // Copy root files (favicon, etc.)
  copyStaticTask({
    from: 'src/root',
    to: 'public',
  }),
];
```

---

## Avoid Conflicts

If files exist in multiple source directories with the same name, the last task wins:

```js
// ⚠️ If both have logo.png, final one wins
copyStaticTask({ from: 'src/shared', to: 'public' }),
copyStaticTask({ from: 'src/images', to: 'public' }), // This logo.png kept
```

---

## Related Tasks

- [bundleCssTask](./bundleCssTask.md) — For CSS bundling
- [generatePagesTask](./generatePagesTask.md) — For templated pages
