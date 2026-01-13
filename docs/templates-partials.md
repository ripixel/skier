# Templates & Partials

Skier uses [Handlebars](https://handlebarsjs.com/) for templating.

---

## Templates

Templates are HTML files with Handlebars expressions:

```handlebars
<!DOCTYPE html>
<html>
<head>
  <title>{{title}} | {{siteTitle}}</title>
</head>
<body>
  {{> header}}

  <main>
    <h1>{{title}}</h1>
    {{{content}}}  {{!-- Triple braces for HTML --}}
  </main>

  {{> footer}}
</body>
</html>
```

**Key syntax:**
- `{{variable}}` — Escaped output (safe for user content)
- `{{{variable}}}` — Raw HTML output (for rendered Markdown)
- `{{> partialName}}` — Include a partial

---

## Partials

Partials are reusable template fragments:

```handlebars
{{!-- src/partials/header.html --}}
<header>
  <nav>
    <a href="/">{{siteTitle}}</a>
    {{#each navigation}}
      <a href="{{this.url}}">{{this.label}}</a>
    {{/each}}
  </nav>
</header>
```

Place partials in your `partialsDir` and reference by filename (without extension):

```
src/partials/
├── header.html    →  {{> header}}
├── footer.html    →  {{> footer}}
└── card.html      →  {{> card}}
```

---

## Available Variables

All globals and frontmatter fields are available:

```handlebars
{{!-- From setGlobalsTask --}}
{{siteTitle}}
{{author.name}}

{{!-- From frontmatter --}}
{{title}}
{{date}}
{{#each tags}}{{this}}{{/each}}

{{!-- From generateItemsTask --}}
{{#each posts}}
  <h2>{{this.title}}</h2>
{{/each}}
```

---

## Control Flow

```handlebars
{{!-- Conditionals --}}
{{#if featured}}
  <span class="badge">Featured</span>
{{/if}}

{{!-- Loops --}}
{{#each posts}}
  <article>{{this.title}}</article>
{{else}}
  <p>No posts yet.</p>
{{/each}}

{{!-- With context --}}
{{#with author}}
  <p>By {{name}} ({{email}})</p>
{{/with}}
```

---

## Common Patterns

**Conditional classes:**
```handlebars
<nav class="nav {{#if isHome}}nav--home{{/if}}">
```

**Safe access to nested data:**
```handlebars
{{#if posts}}
  {{posts.0.title}}
{{/if}}
```

**Passing data to partials:**
```handlebars
{{> card title=post.title link=post.link}}
```

---

## Learn More

- [Markdown & Frontmatter](./markdown-frontmatter.md) — Content file format
- [generatePagesTask](./builtins/generatePagesTask.md) — Rendering templates
- [Handlebars Docs](https://handlebarsjs.com/guide/) — Full syntax reference
