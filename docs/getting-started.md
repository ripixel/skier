---
title: Quick Start
section: Getting Started
order: 1
---

# Getting Started

Get up and running with Skier in 5 minutes.

---

## Prerequisites

- **Node.js** v22.17.0 or later
- **npm** v9 or later

---

## Installation

```bash
npm install --save-dev skier
```

---

## Project Setup

Create this structure:

```
my-site/
├── src/
│   ├── pages/
│   │   └── index.html
│   └── partials/
│       └── header.html
├── skier.tasks.mjs
└── package.json
```

---

## Configuration

Create `skier.tasks.mjs`:

```js
import { prepareOutputTask, generatePagesTask, copyStaticTask } from 'skier';

export default [
  prepareOutputTask({ outDir: 'public' }),

  generatePagesTask({
    pagesDir: 'src/pages',
    partialsDir: 'src/partials',
    outDir: 'public',
  }),

  copyStaticTask({
    from: 'src/static',
    to: 'public',
  }),
];
```

---

## Build Script

Add to `package.json`:

```json
{
  "scripts": {
    "build": "skier"
  }
}
```

---

## Run It

```bash
npm run build
```

Your site is now in `public/` 🎉

---

## What's Next?

| Guide | Description |
|-------|-------------|
| [Architecture](./architecture.md) | Understand how Skier works |
| [Recipes](./recipes.md) | Complete project examples |
| [Configuration](./configuration.md) | Advanced config options |
| [Task Reference](/task-reference) | All available tasks |
| [Custom Tasks](./custom-tasks.md) | Extend the pipeline |

---

## Debug Mode

Having issues? Run with verbose output:

```bash
npx skier --debug
```

See the [FAQ](./faq.md) for common troubleshooting tips.
