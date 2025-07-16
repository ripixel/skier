# FAQ

Frequently Asked Questions about Skier

---

## What is Skier?
Skier is a minimal, modular static site generator for modern web projects. It emphasizes reliability, extensibility, and a no-bloat philosophy.

---

## How do I install Skier?
Install as a dev dependency:
```sh
npm install --save-dev skier
```
Or globally:
```sh
npm install -g skier
```

---

## Where does Skier look for my config?
At the project root: `skier.tasks.js`, `skier.tasks.cjs`, or `skier.tasks.ts`.

---

## How do I add a blog or content section?
Use `generateItemsTask` with your content directory (e.g., `src/blog/`). See the [Getting Started](./getting-started.md) guide for an example.

---

## Can I use Markdown with frontmatter?
Yes! Skier supports Markdown with YAML frontmatter for metadata. See [Markdown & Frontmatter](./markdown-frontmatter.md).

---

## How do I add custom build steps?
Write a [custom task](./custom-tasks.md) and add it to your config array.

---

## How do I use partials and templates?
Put your main templates in `src/pages/`, partials in `src/partials/`, and reference them in your config. See [Templates & Partials](./templates-partials.md).

---

## How do I debug my pipeline?
Run Skier with the `--debug` flag for verbose logging.

---

## Why isn’t my static file or page showing up?
- Check your config paths and output directory.
- Make sure your content is in the correct folder.
- Run with `--debug` to see what’s happening.

---

## Can I use TypeScript for my config or tasks?
Yes, but you’ll need to compile or use `ts-node`.

---

## How do I contribute?
See the [Contributing](./contributing.md) guide for how to open issues or PRs.

---

## Where can I get help?
- Check the docs and FAQ
- Open an issue on GitHub
- Ask in your team’s chat or forum

---
Troubleshooting tips for Skier users.
