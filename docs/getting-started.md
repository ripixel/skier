---
title: Quick Start
section: Getting Started
order: 1
---

# Quick Start

Skier is a static site generator you drive from a plain list of **tasks**. You
describe your build as a pipeline — clean the output, render pages, copy assets —
and the `skier` CLI runs it top to bottom. There is no scaffold step and no hidden
config: a project is one `skier.tasks.mjs` file plus your source.

This guide takes you from an empty folder to a **live site in under ten minutes**.
Every command is copy-paste-ready; do them in order.

:::note Prerequisites
Skier needs **Node.js ≥ 22.17** (this repo pins `22.17.1` in `.nvmrc`) and npm.
Check with `node --version` before you start. The deploy step at the end also
uses a free [Firebase](https://console.firebase.google.com/) project — you can
stop after the preview step if you only want a local build.
:::

At a glance, the whole path:

| Step | What you do | Time |
|------|-------------|------|
| 1 | [Create a project and install Skier](#1-create-a-project-2-min) | ~2 min |
| 2 | [Write your first page](#2-write-your-first-page-1-min) | ~1 min |
| 3 | [Define the pipeline](#3-define-the-pipeline-1-min) | ~1 min |
| 4 | [Build](#4-build-30-sec) | ~30 sec |
| 5 | [Preview locally](#5-preview-locally-30-sec) | ~30 sec |
| 6 | [Deploy to Firebase Hosting](#6-deploy-to-firebase-hosting-4-min) | ~4 min |

---

## 1. Create a project (~2 min)

Make a folder, initialise a package, and add Skier as a dev dependency. The two
`src/` directories are where your pages and shared partials will live:

```bash
mkdir my-site && cd my-site
npm init -y
npm install --save-dev skier
mkdir -p src/pages src/partials
```

That leaves you with the smallest layout that builds:

```text
my-site/
├── src/
│   ├── pages/          # your pages (Handlebars-enabled HTML)
│   └── partials/       # shared template partials (may be empty)
├── skier.tasks.mjs     # your build pipeline (created in step 3)
└── package.json
```

:::note
Skier imposes no fixed layout — tasks point at whatever directories you name.
But `generatePagesTask` **reads** its `partialsDir`, so that folder must exist
even when you have no partials yet. `mkdir -p src/partials` is enough.
:::

---

## 2. Write your first page (~1 min)

Create `src/pages/index.html`. Pages are ordinary HTML with Handlebars available,
so `{{variables}}` and partials work — but plain HTML is a valid page too:

```html title="src/pages/index.html"
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

---

## 3. Define the pipeline (~1 min)

Your build lives in `skier.tasks.mjs`. It must **export a `tasks` array** — a
named export called `tasks` is exactly what the CLI loads:

```js title="skier.tasks.mjs"
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

Tasks run **in array order** — ordering *is* your build's control flow:

- [`prepareOutputTask`](./task-reference/prepareOutputTask.md) cleans and
  recreates `public/` so each build starts from a blank slate.
- [`generatePagesTask`](./task-reference/generatePagesTask.md) compiles every
  `.html` file in `pagesDir` through Handlebars (registering any partials from
  `partialsDir`) and writes the result to `outDir`.

:::tip
Skier auto-detects the config file, trying `skier.tasks.js`, then `.mjs`,
`.cjs`, and `.ts` in that order. This guide uses **`.mjs`** because it works
regardless of your package's `type` field.
:::

---

## 4. Build (~30 sec)

Run the CLI:

```bash
npx skier
```

You'll see each task start and finish, and your site lands in `public/`:

```text
ℹ️ [skier/runner] Started
ℹ️ [skier/prepare-output] Started task
ℹ️ [skier/prepare-output] Finished task
ℹ️ [skier/generate-pages] Started task
ℹ️ [skier/generate-pages] Finished task
ℹ️ [skier/runner] Completed
```

Prefer a script? Add one to `package.json` and use `npm run build` instead —
it's the same command:

```json title="package.json"
{
  "scripts": {
    "build": "skier"
  }
}
```

:::tip
If a build does something unexpected, re-run with `npx skier --debug` for
per-task logging (paths written, partials registered, …). You can also narrow a
run with `--only <names>` or `--skip <names>` (comma-separated task names, e.g.
`--only generate-pages`). Task names come from the built-ins — the pipeline
above exposes `prepare-output` and `generate-pages`.
:::

---

## 5. Preview locally (~30 sec)

Skier writes plain static files, so any static server works. The quickest:

```bash
npx serve public
```

Open the printed URL and you'll see your page. Re-run `npx skier` whenever you
change a source file, then refresh. **That's a complete Skier build** — the rest
is deploying it and growing the pipeline.

---

## 6. Deploy to Firebase Hosting (~4 min)

Skier's output is a static `public/` directory, so it deploys anywhere. Skier's
own docs site (the one you're reading) is built by Skier and deployed to
**Firebase Hosting** — here's that same flow for your site.

You'll need a free Firebase project first: create one at
[console.firebase.google.com](https://console.firebase.google.com/) and note its
**project ID**. Then install the CLI and sign in:

```bash
npm install --save-dev firebase-tools
npx firebase login
```

Add a **`firebase.json`** pointing Firebase at your build output:

```json title="firebase.json"
{
  "hosting": {
    "public": "public",
    "cleanUrls": true,
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  }
}
```

Build, then deploy — pass your project ID with `--project` (or run
`npx firebase use --add` once to save it in a `.firebaserc`):

```bash
npx skier
npx firebase deploy --only hosting --project your-project-id
```

The CLI prints your live **Hosting URL**. To share a change before it goes live,
deploy to a temporary preview channel instead:

```bash
npx firebase hosting:channel:deploy preview --project your-project-id
```

:::note Skier's own docs go further
Skier's docs deploy uses separate **staging** and **production** hosting targets
in `firebase.json` + `.firebaserc`, so changes ship to staging first. See those
two files in the [Skier repo](https://github.com/Ripixel-Studio/skier) for the
real, dogfooded configuration.
:::

**Install → build → preview → deploy, done.** You have a live site.

---

## Grow the pipeline

Adding capability means adding tasks — the shape never changes. A few common
next moves:

- **Share values across templates** with
  [`setGlobalsTask`](./task-reference/setGlobalsTask.md). Globals are available to
  every template as `{{variable}}`.
- **Ship CSS and assets** with
  [`bundleCssTask`](./task-reference/bundleCssTask.md) (concatenate + minify) and
  [`copyStaticTask`](./task-reference/copyStaticTask.md) (copy verbatim).
- **Author pages in Markdown** with
  [`generateItemsTask`](./task-reference/generateItemsTask.md), which renders a
  directory of Markdown files (frontmatter and all) through a Handlebars template.

Order still matters: keep `prepareOutputTask` first, set globals before the tasks
that read them, and generate content before the feeds or sitemaps that index it.

---

## Next steps

| Guide | Why |
|-------|-----|
| [Configuration](./configuration.md) | Config-file options, CLI flags, and patterns |
| [Task Reference](./task-reference/index.md) | Every built-in task and its options |
| [Markdown & Frontmatter](./markdown-frontmatter.md) | Author content in Markdown |
| [Templates & Partials](./templates-partials.md) | Handlebars templating and shared partials |
| [Custom Tasks](./custom-tasks.md) | Write your own task when a built-in doesn't fit |
| [Architecture](./architecture.md) | How Skier works under the hood |
| [Recipes](./recipes.md) | Complete, real-world pipelines |

Stuck? The [FAQ](./faq.md) covers common build errors.
