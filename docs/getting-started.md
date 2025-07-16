# Getting Started with Skier

Welcome to **Skier** — an opinionated, minimal, and extensible static site generator for modern web projects. This guide will help you get up and running quickly.

---

## What is Skier?

Skier is a modular static site generator (SSG) designed for reliability, extensibility, and minimalism. It powers the [ripixel-website](https://github.com/ripixel/ripixel-website) and is intended for developers who want full control over their build pipeline without bloat.

- **Minimal**: No unnecessary dependencies or features.
- **Extensible**: Add or customize tasks as needed.
- **Type-safe**: Written in TypeScript, with a focus on maintainability.

---

## Prerequisites
- **Node.js**: v22.17.0 or later (see `.nvmrc` and `package.json` for current version)
- **npm**: v9 or later

---

## Installation

Install Skier as a dev dependency in your project:

```sh
npm install --save-dev skier
```

Or, to use it globally:

```sh
npm install -g skier
```

---

## Project Structure
A typical Skier-powered site might look like:

```
my-site/
  src/
    pages/            # Your page templates (e.g., about.html, contact.html)
    partials/         # Shared partial templates (e.g., header.html, footer.html)
    blog/             # Blog posts or content collections (Markdown or HTML)
    static/           # Static assets (images, fonts, etc.)
  skier.tasks.js      # Skier pipeline config
  package.json
  public/             # (Generated) Output site
  ...
```

---

## Minimal Configuration

Create a `skier.tasks.js` (or `.ts`/`.cjs`) file at your project root:

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
    template: 'src/pages/blog-post.html', // or your preferred template
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

## Running Skier

Add a script to your `package.json`:

```json
"scripts": {
  "build": "skier"
}
```

Then build your site:

```sh
npm run build
```

---

## Next Steps
- Explore built-in tasks for feeds, sitemaps, CSS bundling, and more.
- You’ll define your build pipeline as an array of tasks in a config file (usually `skier.tasks.cjs`). Each task does one thing—copy static files, render pages, generate a feed, etc. You can use any of the built-in tasks, or write your own. See the [Built-In Tasks](./builtins/README.md) page for a full list and details on each built-in.
- Customize your pipeline by adding or writing custom tasks.
- See the [Configuration](./configuration.md) and [Tasks](./tasks.md) docs for more details.

---

**Need help?** Check out the [FAQ](./faq.md) or open an issue on GitHub.
