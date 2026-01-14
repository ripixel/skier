---
title: Migration Guide
section: Advanced
order: 3
---

# Migration Guide

How to upgrade between Skier versions and migrate your configuration.

---

## v2 → v3 Migration

Skier v3 introduces **native ESM** as the default module system and adds several new features.

### Breaking Changes

| Change | v2 | v3 |
|--------|----|----|
| Module system | CommonJS | ESM (default) |
| Task file naming | `skier.tasks.cjs` | `skier.tasks.mjs` (preferred) |
| Imports | `require()` | `import` |
| Node.js version | 18+ | 22+ |

### Step-by-Step Upgrade

**1. Update package.json**

```json
{
  "dependencies": {
    "skier": "^3.0.0"
  }
}
```

Then run:
```bash
npm install
```

**2. Rename your config file**

```bash
mv skier.tasks.cjs skier.tasks.mjs
```

**3. Convert to ESM syntax**

Before (CommonJS):
```js
const { generatePagesTask, copyStaticTask } = require('skier');

module.exports = [
  generatePagesTask({ /* ... */ }),
  copyStaticTask({ /* ... */ }),
];
```

After (ESM):
```js
import { generatePagesTask, copyStaticTask } from 'skier';

export default [
  generatePagesTask({ /* ... */ }),
  copyStaticTask({ /* ... */ }),
];
```

**4. Update any custom tasks**

If you have custom tasks in separate files:

```js
// Before
const myTask = require('./tasks/myTask.cjs');

// After
import myTask from './tasks/myTask.mjs';
```

---

## CommonJS to ESM Conversion

If you need to keep CommonJS dependencies while using ESM, use `createRequire`:

```js
// skier.tasks.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Now you can require CommonJS modules
const legacyPlugin = require('./legacy-plugin.cjs');

import { generatePagesTask } from 'skier';

export default [
  generatePagesTask({ /* ... */ }),
  legacyPlugin.task,
];
```

---

## CommonJS Fallback

If you cannot migrate to ESM, Skier v3 still supports `.cjs` files:

```bash
# This still works
skier.tasks.cjs
```

Just use CommonJS syntax as before. However, ESM is recommended for:
- Better tree-shaking
- Native async/await at top level
- Future compatibility

---

## Jest Configuration for ESM

If you test custom tasks with Jest, update your config:

**jest.config.js:**
```js
export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
};
```

---

## Common Migration Issues

### "require() of ES Module not supported"

**Cause:** A dependency is now ESM-only (e.g., `chalk` v5+, `feed` v5+).

**Fix:** Convert your config to ESM (`.mjs`) or use dynamic import:

```js
// In a .cjs file
const chalk = await import('chalk');
```

### "Cannot use import statement outside a module"

**Cause:** Your file uses `import` but is treated as CommonJS.

**Fix:** Either:
- Rename to `.mjs`
- Add `"type": "module"` to package.json
- Use `require()` instead

### "ERR_MODULE_NOT_FOUND"

**Cause:** ESM requires file extensions in imports.

**Fix:**
```js
// Before (doesn't work in ESM)
import { helper } from './utils';

// After
import { helper } from './utils.js';
```

---

## Supported Config File Names

Skier v3 checks for config files in this order:

1. `skier.tasks.mjs` — ESM (recommended)
2. `skier.tasks.js` — ESM if `"type": "module"` in package.json
3. `skier.tasks.cjs` — CommonJS
4. `skier.tasks.ts` — TypeScript (requires ts-node or esbuild)

---

**Need help?** Check the [FAQ](./faq.md) or open an issue on GitHub.
