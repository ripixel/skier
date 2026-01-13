# prepareOutputTask

Initialize the output directory before building.

---

## When to Use

✅ Use `prepareOutputTask` as the **first task** in your pipeline to:
- Ensure the output directory exists
- Clean stale files from previous builds

---

## Quick Start

```js
prepareOutputTask({ outDir: 'public' })
```

---

## Configuration

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `outDir` | string | ✅ | Output directory path |

---

## Why It's Important

Without this task:
- Build may fail if output directory doesn't exist
- Old files from deleted pages remain in output

**Always place first in your pipeline:**

```js
export default [
  prepareOutputTask({ outDir: 'public' }),  // ← First!
  setGlobalsTask({ /* ... */ }),
  generatePagesTask({ /* ... */ }),
  // ...
];
```

---

## Related Tasks

- [copyStaticTask](./copyStaticTask.md) — Copies files to output
- [generatePagesTask](./generatePagesTask.md) — Writes pages to output
