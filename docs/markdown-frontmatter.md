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
