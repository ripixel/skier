# Built-In Tasks

Skier comes with a suite of built-in tasks to cover the most common needs in static site generation. Each task is modular, configurable, and can be used independently or as part of your pipeline.

Below you'll find a list of all built-in tasks, with a short summary and a link to the full documentation for each.

---

## Task Index

- [prepareOutputTask](./prepareOutputTask.md): Ensures the output directory exists and is ready for site generation. Typically the first task in your pipeline.
- [copyStaticTask](./copyStaticTask.md): Copies static assets (images, fonts, CSS, JS, etc.) from a source directory to your output directory. Use this to include files that don’t require processing (such as favicon, robots.txt, fonts, etc.) in your generated site.
- [bundleCssTask](./bundleCssTask.md): Bundles and minifies CSS files for your site. Use this to optimize your stylesheets for production by combining multiple CSS files into one and reducing file size.
- [setGlobalsTask](./setGlobalsTask.md): Sets global variables for use in templates and tasks. Use this to define site-wide values (site title, author, base URL, etc.) that are available everywhere in your pipeline.
- [setGlobalFromMarkdownTask](./setGlobalFromMarkdownTask.md): Reads a Markdown file, renders it to HTML, and sets the result as a global variable for use in templates and tasks. Ideal for site-wide content like an About section, footer, or legal notices.
- [generatePagesTask](./generatePagesTask.md): Generates static HTML pages from templates and partials. Use this to render your site's main pages (home, about, contact, etc.) with Handlebars or HTML templates.
- [generateItemsTask](./generateItemsTask.md): Generates HTML pages for collections of items (e.g., blog posts, portfolio entries) from Markdown or data files. Supports sorting, excerpts, custom templates, and configurable output structure.
- [generatePaginatedItemsTask](./generatePaginatedItemsTask.md): Generates paginated HTML pages from a data source (JSON or pipeline variable), producing multiple page files with navigation controls. Ideal for timelines, archives, or any collection that needs to be split across pages.
- [generateFeedTask](./generateFeedTask.md): Generates RSS, Atom, and JSON feeds from your site's content (typically blog posts or articles). Use this to provide feed subscriptions for readers and syndication services.
- [generateSitemapTask](./generateSitemapTask.md): Generates a `sitemap.xml` file for your site based on the pages produced by your build. This helps search engines index your site efficiently.

---

For details on configuring and using each task, click the task name above or see the [Getting Started guide](../getting-started.md) for a walkthrough of a typical pipeline.
