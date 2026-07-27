---
title: Quick Start
section: Getting Started
order: 1
---

# Get Started with Skier

Skier is a static site generator you drive from a plain list of **tasks**. You
describe your build as a pipeline — clean the output, render pages, copy assets —
and the `skier` CLI runs it top to bottom. There is no scaffolding step and no
hidden config: a project is a `skier.tasks.mjs` file plus your source.

This guide takes you from nothing to a **deployed site in under 10 minutes**.
Start with the copy-paste happy path, then read the sections below to understand
each piece.

---

## The 2-minute version

Run these commands, create the two files, and build:

```bash
mkdir my-site && cd my-site
npm init -y
npm install --save-dev skier
mkdir -p src/pages src/partials
```

**`src/pages/index.html`** — your first page:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Hello, Skier</title>
  </head>
  <body>
    <h1>Hello, Skier 👋</h1>
  </body>
</html>
```

**`skier.tasks.mjs`** — your pipeline:

```js
import { prepareOutputTask, generatePagesTask } from 'skier';

export const tasks = [
  prepareOutputTask({ outDir: 'public' }),
  generatePagesTask({
    pagesDir: 'src/pages',
    partialsDir: 'src/partials',
    outDir: 'public',
  }),
];
```

Build it and preview:

```bash
npx skier
npx serve public
```

Open the printed URL and you'll see your page. That's a complete Skier build —
everything below is detail and how to grow it.

---

## Install Skier

Skier needs **Node.js ≥ 22.17** (this repo pins `22.17.1` in `.nvmrc`) and npm.
Check your version, then install Skier as a dev dependency:

```bash
node --version        # must be >= 22.17
npm install --save-dev skier
```

---

## Lay out a minimal project

Skier imposes no fixed layout — you point tasks at whatever directories you like.
The smallest project that builds looks like this:

```
my-site/
├── src/
│   ├── pages/
│   │   └── index.html      # your pages (Handlebars-enabled HTML)
│   └── partials/           # shared template partials (may be empty)
├── skier.tasks.mjs         # your build pipeline
└── package.json
```

> **Note:** `generatePagesTask` reads its `partialsDir`, so that directory must
> exist even if you have no partials yet. `mkdir -p src/partials` is enough.

---

## Define your pipeline

Your build lives in `skier.tasks.mjs`. It must **export a `tasks` array** (a
named export — this is what the CLI looks for):

```js
import { prepareOutputTask, generatePagesTask } from 'skier';

export const tasks = [
  prepareOutputTask({ outDir: 'public' }),
  generatePagesTask({
    pagesDir: 'src/pages',
    partialsDir: 'src/partials',
    outDir: 'public',
  }),
];
```

Tasks run **in array order**, so ordering is your build's control flow:

- `prepareOutputTask` cleans and recreates `public/` so each build starts fresh.
- `generatePagesTask` compiles every `.html` file in `pagesDir` through
  Handlebars (registering any partials from `partialsDir`) and writes the result
  to `outDir`.

Skier auto-detects the config file in your project root, trying
`skier.tasks.js`, then `.mjs`, `.cjs`, and `.ts` in that order. Use whichever
suits your setup — `.mjs` works regardless of your package's `type` field, which
is why this guide uses it.

---

## Run the build

Run the CLI directly:

```bash
npx skier
```

…or wire it into `package.json` so it's part of your normal workflow:

```json
{
  "scripts": {
    "build": "skier"
  }
}
```

```bash
npm run build
```

Either way, your generated site lands in `public/`. The CLI accepts a few flags:

| Flag | Effect |
|------|--------|
| `--debug` | Verbose per-task logging (paths written, partials registered, …). |
| `--only <names>` | Run only the named tasks, comma-separated (e.g. `--only generate-pages`). |
| `--skip <names>` | Run everything **except** the named tasks. |

Task names come from the built-ins themselves — the pipeline above exposes
`prepare-output` and `generate-pages`. Add `--debug` first when a build does
something unexpected:

```bash
npx skier --debug
```

---

## Preview locally

Skier writes plain static files, so any static server works. The quickest:

```bash
npx serve public
```

That serves `public/` on a local port and prints the URL. Re-run `npx skier`
(in another terminal) whenever you change a source file, then refresh.

---

## Grow the pipeline

Adding capability means adding tasks — the shape never changes. A few common
"how do I…" steps:

**Share values across templates** with `setGlobalsTask`. Globals are available
to every template as `{{variable}}`:

```js
import { setGlobalsTask } from 'skier';

setGlobalsTask({ values: { year: new Date().getFullYear(), siteName: 'My Site' } }),
```

```html
<footer>© {{year}} {{siteName}}</footer>
```

**Ship CSS and assets** with `bundleCssTask` (concatenate + minify) and
`copyStaticTask` (copy verbatim):

```js
import { bundleCssTask, copyStaticTask } from 'skier';

copyStaticTask({ from: 'src/static', to: 'public' }),
bundleCssTask({ from: 'src/css', to: 'public/assets', output: 'site.min.css', minify: true }),
```

**Write pages in Markdown** with `generateItemsTask`, which renders a directory
of Markdown files (frontmatter and all) through a Handlebars template. See the
[Task Reference](./builtins/README.md) for its full options — and for the other
built-ins (`generateNavDataTask`, `generateFeedTask`, `generateSitemapTask`,
`generatePaginatedItemsTask`).

Order still matters: put `prepareOutputTask` first, set globals before the tasks
that read them, and generate content before feeds or sitemaps that index it.

---

## Deploy to Firebase Hosting

Skier's output is a static `public/` directory, so it deploys anywhere. Skier's
own docs site (the one you're reading) is built by Skier and deployed to
**Firebase Hosting** — here's that same flow for your site.

Install the Firebase CLI and sign in:

```bash
npm install --save-dev firebase-tools
npx firebase login
```

Add a **`firebase.json`** pointing Firebase at your build output:

```json
{
  "hosting": {
    "public": "public",
    "cleanUrls": true,
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  }
}
```

Build, then deploy:

```bash
npx skier
npx firebase deploy --only hosting
```

To share a change before it goes live, deploy to a temporary preview URL instead:

```bash
npx firebase hosting:channel:deploy preview
```

> Skier's docs deploy uses a slightly richer setup — separate **staging** and
> **production** hosting targets in `firebase.json` and `.firebaserc` — so
> changes ship to staging first. Look at those two files in the
> [Skier repo](https://github.com/Ripixel-Studio/skier) for the real, dogfooded
> configuration.

That's install → build → preview → deploy. You now have a live site.

---

## Next steps

| Guide | Why |
|-------|-----|
| [Task Reference](./builtins/README.md) | Every built-in task and its options |
| [Markdown & Frontmatter](./markdown-frontmatter.md) | Author content in Markdown |
| [Templates & Partials](./templates-partials.md) | Handlebars templating and shared partials |
| [Custom Tasks](./custom-tasks.md) | Write your own task when a built-in doesn't fit |
| [Configuration](./configuration.md) | Config file options and patterns |
| [Recipes](./recipes.md) | Complete, real-world pipelines |

Stuck? The [FAQ](./faq.md) covers common build errors.
