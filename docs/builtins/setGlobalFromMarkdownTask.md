# setGlobalFromMarkdownTask

Set a global variable from a rendered Markdown file.

---

## When to Use

✅ Use `setGlobalFromMarkdownTask` for:
- Site-wide content blocks (about, legal notices)
- Rendered Markdown you need in multiple templates
- Content that should be editable as Markdown

❌ Use `setGlobalsTask` instead for:
- Simple key-value configuration
- Computed values from other globals

---

## Quick Start

```js
setGlobalFromMarkdownTask({
  file: 'content/about.md',
  varName: 'aboutContent',
})
```

**Input:** Markdown file
**Output:** `globals.aboutContent` containing rendered HTML

---

## Configuration

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `file` | string | ✅ | Path to Markdown file |
| `varName` | string | ✅ | Global variable name for the HTML output |

---

## Using in Templates

```handlebars
<section class="about">
  {{{aboutContent}}}  {{!-- Triple braces for raw HTML --}}
</section>
```

---

## Real-World Example

Footer with Markdown content:

```js
setGlobalFromMarkdownTask({
  file: 'content/footer-legal.md',
  varName: 'footerLegal',
}),
```

```handlebars
{{!-- partials/footer.html --}}
<footer>
  <div class="legal">
    {{{footerLegal}}}
  </div>
</footer>
```

---

## Related Tasks

- [setGlobalsTask](./setGlobalsTask.md) — For simple values
- [generateItemsTask](./generateItemsTask.md) — For collections of Markdown
