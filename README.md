# Skier

**Skier** is a minimal, modular static site generator for modern web projects. It’s designed for developers who want full control over their build pipeline—without bloat, black boxes, or magic.

---

## Why Skier?
- **Minimal & Fast:** No unnecessary dependencies or features. You control every build step.
- **Extensible:** Compose your own pipeline using built-in and custom tasks.
- **TypeScript-first:** Modern, type-safe codebase and config.
- **Scriptable:** All logic is explicit—no hidden conventions.
- **Production-tested:** Powers [ripixel-website](https://github.com/ripixel/ripixel-website) and other real sites.

---

## Key Features
- Task-based pipeline (pages, blog, feeds, static, CSS, and more)
- Markdown & frontmatter support
- Handlebars templates and partials
- CLI for running, filtering, and debugging tasks
- A suite of Built-In tasks that cover common needs to quick-start your site generation

---

## Built With Skier

Skier powers production websites across different domains:

- **[Skier Documentation](https://skier.ripixel.co.uk/)** - This documentation site itself
- **[ripixel.co.uk](https://ripixel.co.uk)** - Personal portfolio and blog
- **[Bingham Sunday Running Club](https://binghamsundayrunningclub.co.uk/)** - Community running club website
- **[FitGlue](https://fitglue.tech/)** - Marketing site for fitness data platform

---

## Get Started
See the [Getting Started guide](./docs/getting-started.md) for quick setup, project structure, and your first build.

---

## Documentation
Full documentation is in the [`/docs`](./docs) folder:
- [Getting Started](./docs/getting-started.md)
- [Configuration](./docs/configuration.md)
- [Tasks](./docs/tasks.md)
- [Task Reference](./docs/task-reference/index.md)
- [Custom Tasks](./docs/custom-tasks.md)
- [Templates & Partials](./docs/templates-partials.md)
- [Markdown & Frontmatter](./docs/markdown-frontmatter.md)
- [Architecture](./docs/architecture.md)
- [Recipes](./docs/recipes.md)
- [Migration Guide](./docs/migration.md)
- [FAQ](./docs/faq.md)
- [Contributing](./docs/contributing.md)

---

## Deploying the docs site

The documentation at [skier.ripixel.co.uk](https://skier.ripixel.co.uk/) is
itself built **by Skier** (dogfooded) and hosted on Firebase. The deploy flow is:

```sh
npm ci                # install deps; the prepare hook compiles the CLI (tsc)
npm run docs:build    # compile the CLI, then run it to render docs/ -> ./public
firebase deploy --only hosting:production --non-interactive
```

`npm run docs:build` is the single command that produces a deployable site. It
runs the compiled Skier CLI against `skier.tasks.cjs`, which renders every page,
bundles the CSS/JS, and writes the client-side `search-index.json` into `./public`
— the exact directory `firebase.json` serves (`hosting.public`). Running `npm run
build` on its own only runs `tsc` (it compiles the CLI **package**, not the site),
so `./public` is never generated and the deploy fails with
`Directory './public' for Hosting does not exist.`

Firebase hosting targets (`.firebaserc`): `production` → `skier-52135`
(skier.ripixel.co.uk), `staging` → `skier-staging`. CI (`.circleci/config.yml`)
runs this same flow automatically on `main`.

---

## License
MIT
