---
title: Markdown & Frontmatter
section: Core Concepts
order: 4
---

# Markdown & Frontmatter

Write content in Markdown with YAML frontmatter for metadata.

---

## File Format

```markdown
---
title: My First Post
date: 2024-01-15
category: Tech
tags:
  - javascript
  - web
---

# Hello World

This is my **first post** written in Markdown.

## Code Example

```javascript
console.log('Hello!');
```

More content here...
```

---

## Frontmatter

The YAML block at the top (between `---` markers) becomes template variables:

```handlebars
<h1>{{title}}</h1>
<time>{{date}}</time>
<span>{{category}}</span>

{{#each tags}}
  <span class="tag">{{this}}</span>
{{/each}}
```

---

## Supported Features

Skier uses [marked](https://marked.js.org/) with GitHub Flavored Markdown:

- **Headings**: `# H1` through `###### H6`
- **Emphasis**: `*italic*`, `**bold**`, `~~strikethrough~~`
- **Links**: `[text](url)`
- **Images**: `![alt](src)`
- **Code blocks**: Triple backticks with language
- **Tables**: GFM table syntax
- **Task lists**: `- [ ]` and `- [x]`
- **Blockquotes**: `>`
- **Horizontal rules**: `---`

---

## Syntax Highlighting

Code blocks are highlighted with [highlight.js](https://highlightjs.org/):

````markdown
```javascript
const greeting = 'Hello';
console.log(greeting);
```
````

Include the highlight.js CSS in your template:
```html
<link rel="stylesheet" href="https://unpkg.com/highlight.js@11/styles/github-dark.min.css">
```

### Code block markup

Each fenced code block is rendered as a `<figure class="code-block">` wrapper
so a template's CSS and a small copy-to-clipboard handler have stable hooks —
Skier exposes the metadata but does **not** hard-code a label chip or copy
button (those belong to your template):

```html
<figure class="code-block" data-language="ts" data-filename="skier.config.ts">
  <pre><code class="hljs language-ts">…highlighted…</code></pre>
</figure>
```

- `data-language` — the fence language, present whenever one is given.
- `data-filename` — present only when you set a filename (see below).
- The `<code>` element's `textContent` is the original, un-highlighted source,
  so a copy handler can read it back verbatim with no duplicated payload.

Attach a label with CSS (`.code-block[data-filename]::before { content: attr(data-filename); }`)
and a copy button with a few lines of vanilla JS that read `data-*` and the
`<code>` text — no framework, no plugin.

### Filenames / titles

Add a `title=` (or `filename=`) pair to the fence info string to label a block
with the file it represents:

````markdown
```ts title="skier.config.ts"
export default { outDir: 'public' };
```
````

Quotes are optional for single-token names (`title=deploy.sh`) and required for
names with spaces (`title="my notes.txt"`).

---

## Excerpts

For post summaries, use a marker:

```markdown
---
title: My Post
---

This is the excerpt that appears in lists.

<!--more-->

This is the full content that only appears on the detail page.
```

Configure in your task:
```js
generateItemsTask({
  excerptFn: (content) => content.split('<!--more-->')[0],
  // ...
})
```

---

## Common Fields

| Field | Type | Usage |
|-------|------|-------|
| `title` | string | Page title |
| `date` | string | ISO date (`2024-01-15`) |
| `description` | string | Meta description / excerpt |
| `tags` | array | Categories/labels |
| `featured` | boolean | Highlight post |
| `draft` | boolean | Skip in build |

---

## Tips

- **Dates**: Use ISO format (`2024-01-15`) for reliable parsing
- **No tabs**: YAML requires spaces for indentation
- **Optional**: Frontmatter block can be omitted if not needed
- **Custom fields**: Add any field; it's available in templates

---

## Learn More

- [Templates & Partials](./templates-partials.md) — Using content in templates
- [generateItemsTask](./builtins/generateItemsTask.md) — Processing Markdown files
