# Markdown & Frontmatter

Skier supports flexible Markdown content and (optionally) YAML frontmatter for metadata. This guide covers how Markdown is rendered, what features are available, and how frontmatter is handled in your content files.

---

## Supported Markdown Features

- Skier uses [marked](https://marked.js.org/) for Markdown parsing.
- CommonMark compliant: headings, lists, links, images, code blocks, blockquotes, tables, and more.
- Supports GitHub-flavored Markdown (GFM) features such as task lists, strikethrough, and autolinks.
- Syntax highlighting for code blocks via [highlight.js](https://highlightjs.org/).

---

## Writing Content with Markdown

You can place Markdown files anywhere in your content directories (e.g., `src/blog/2024-01-01-my-post.md`).

Example:

```
---
title: My First Post
date: 2024-01-01
description: This is my first post!
---

# Hello World

This is a **Markdown** post.
```

---

## Frontmatter Syntax

- Frontmatter is written as a YAML block at the very top of your Markdown file, between `---` lines.
- Common fields: `title`, `date`, `description`, `tags`, etc.
- All frontmatter fields are available as variables in your templates.

---

## How Skier Handles Frontmatter

- Skier parses YAML frontmatter and strips it from the Markdown before rendering.
- The frontmatter object is merged into the template variables for that page or item.
- If no frontmatter is present, only the Markdown body is rendered.
- You can access frontmatter fields in your templates like `{{title}}`, `{{date}}`, etc.

---

## Caveats & Tips
- Make sure your frontmatter is valid YAML (no tabs, use spaces for indentation).
- If you don't need metadata, you can omit the frontmatter block.
- Date fields are parsed as strings—parse/format as needed in your templates.
- If you have custom frontmatter fields, they are available in your template context.

---

**Next:** Learn more about [Templates & Partials](./templates-partials.md) or [Built-in Tasks](./builtins/generateItemsTask.md).
