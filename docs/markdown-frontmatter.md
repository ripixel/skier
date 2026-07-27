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

## Callouts / admonitions

Draw attention with callout blocks using a `:::` container. The keyword after
the colons is the callout type; an optional title can follow on the same line:

```markdown
:::note
A plain note. The body is full markdown — **bold**, links, lists, code.
:::

:::warning Heads up
A warning with a custom title.
:::
```

Supported types: `note`, `tip`, `info`, `warning`, `danger` (with `caution` →
`danger` and `important` → `info` accepted as aliases). An unrecognised keyword
is left as ordinary text, so `:::` used for anything else is untouched.

Each block renders as class-driven, semantic markup for the template's CSS to
theme per type — Skier hard-codes no colours or icons:

```html
<div class="callout callout-warning" data-callout="warning">
  <p class="callout-title">Heads up</p>
  <div class="callout-body">…rendered body…</div>
</div>
```

The title defaults to the capitalised type name (`Note`, `Warning`, …) when you
don't supply one.

---

## Snippet transclusion (`@include`)

Pull a slice of a **real** source or example file into a page at build time, so
code examples can't drift from the code they document. Write an `@include`
directive on its own line, starting at column 0:

```markdown
@include examples/quickstart.ts
@include src/config.ts region="setup"
@include src/config.ts lines="10-24"
@include "examples/with spaces.ts" lang="ts" title="config.ts"
```

The file is read at build time and rendered as a normal syntax-highlighted code
block (the same markup as a fenced block, so copy buttons and the filename label
work identically).

Modifiers (all optional):

| Modifier | Effect |
|----------|--------|
| `region="name"` | Only the lines between `#region name` and `#endregion` markers (the markers are matched anywhere on a line, so any comment style works). |
| `lines="a-b"` | A 1-indexed, inclusive line range (or a single line, `lines="12"`). |
| `lang="ts"` | Override the highlight language (default: inferred from the file extension). |
| `title="…"` | Override the filename label (default: the include path). |

Mark a region in the source file with matching comments:

```ts
// #region setup
const skier = createSkier({ outDir: 'public' });
// #endregion setup
```

Paths are resolved relative to the project working directory. A missing file,
an unknown region, or an out-of-range line span **fails the build with a clear
error** — a broken include never silently renders nothing. `@include` lines
inside a fenced code block are left untouched, so this page can show the syntax
without transcluding itself.

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
