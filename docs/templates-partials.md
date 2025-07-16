# Templates & Partials

Skier uses [Handlebars](https://handlebarsjs.com/) for templating. Templates and partials let you create flexible layouts and reusable components for your site.

---

## Templates

- Templates are HTML (or `.hbs`) files with Handlebars expressions (e.g., `{{title}}`, `{{content}}`).
- Place your main templates in `src/pages/` (or another directory as configured).
- Each page or item is rendered using a template.

Example template (`src/pages/blog-post.html`):

```html
<!DOCTYPE html>
<html>
  <head>
    <title>{{title}}</title>
  </head>
  <body>
    {{> header}}
    <main>
      <h1>{{title}}</h1>
      <article>{{{content}}}</article>
    </main>
    {{> footer}}
  </body>
</html>
```

---

## Partials

- Partials are reusable template snippets (e.g., header, footer, nav).
- Place partials in `src/partials/` (or as configured).
- Register and use in templates with `{{> partialName}}`.

Example partial (`src/partials/header.html`):

```html
<header>
  <nav>
    <a href="/">Home</a>
    <a href="/blog/">Blog</a>
  </nav>
</header>
```

---

## Variables & Helpers

- All frontmatter fields and globals are available as template variables.
- Use triple braces (`{{{content}}}`) for unescaped HTML (e.g., rendered Markdown).
- You can register [Handlebars helpers](https://handlebarsjs.com/guide/#custom-helpers) for custom logic (see custom tasks).

---

## Folder Structure Example

```
src/
  pages/
    index.html
    blog-post.html
  partials/
    header.html
    footer.html
```

---

## Tips
- Use partials to avoid duplicating layout code.
- Use variables for dynamic content (title, date, etc.).
- Use helpers for formatting (dates, lists, etc.).

---

**Next:** Learn more about [Markdown & Frontmatter](./markdown-frontmatter.md) or [Custom Tasks](./custom-tasks.md).
