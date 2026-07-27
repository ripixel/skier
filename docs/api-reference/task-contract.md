---
title: Task Contract
section: API Reference
order: 1
---

# Task Contract

Everything Skier runs — every [built-in](../task-reference/index.md) and every
[custom task](../custom-tasks.md) — is a `TaskDef`. This page is the reference
for that contract: the shape you implement, the context you're handed, and the
config-in / globals-out rule `run()` follows.

The signatures below are transcluded straight from `src/types.ts`, so they are
exactly what the package exports.

---

## TaskDef

A task is a plain object with a `name`, its `config`, and an async `run`
function. It's generic over its config and output types:

@include src/types.ts region="TaskDef"

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `name` | string | ✅ | Unique identifier. Used in logs and by the CLI's `--only` / `--skip` filters. |
| `title` | string | | Human-readable description shown while the task runs. |
| `config` | `Config` | ✅ | Your task's configuration object. Passed back to `run` as its first argument. |
| `run` | function | ✅ | The work. Receives `config` and a [`TaskContext`](#taskcontext); returns a promise of the data to merge into globals. |

Built-in tasks are **factories** that build a `TaskDef` for you from a config
object — you rarely construct one by hand. For example, the whole of
`copyStaticTask` is a real, tested `TaskDef` factory:

@include src/builtins/copyStaticTask/index.ts region="config"

@include src/builtins/copyStaticTask/index.ts region="factory"

---

## The `run()` contract

`run` is where a task does its work. It's called once, with two arguments:

- **`config`** — the config object the task was created with (typed as `Config`).
- **`ctx`** — a [`TaskContext`](#taskcontext): the shared globals, a logger, and
  the debug flag.

**Whatever `run` returns is shallow-merged into the shared globals.** That is the
only channel between tasks — a task reads earlier tasks' output from
`ctx.globals` and contributes its own by returning an object:

```js
const collectPostsTask = {
  name: 'collect-posts',
  config: {},
  run: async (config, ctx) => {
    ctx.logger.info('Collecting posts…');
    return { posts: ['Post 1', 'Post 2'] }; // merged into globals.posts
  },
};

const usePostsTask = {
  name: 'use-posts',
  config: {},
  run: async (config, ctx) => {
    ctx.logger.info(`Found ${ctx.globals.posts.length} posts`);
    // Returning nothing (undefined) contributes nothing to globals — fine.
  },
};
```

Return an object to add to globals; return nothing to contribute nothing. Read
existing data from `ctx.globals`, don't mutate it — return new data instead.
See [Custom Tasks → The Context Object](../custom-tasks.md#the-context-object)
for the full authoring walkthrough.

---

## TaskContext

Every `run` call receives the same shared context:

@include src/types.ts region="TaskContext"

| Field | Type | Purpose |
|-------|------|---------|
| `globals` | [`SkierGlobals`](./core-types.md#skierglobals) | Shared key-value data accumulated from every prior task's return value. |
| `logger` | [`Logger`](#logger) | Structured, level-based logging. Prefer this over `console.log`. |
| `debug` | boolean | `true` when the build was run with `--debug`. Gate verbose logging on it. |

---

## Logger

The logger is a small, level-based interface. `debug` output is only surfaced
when the build runs with `--debug`:

@include src/types.ts region="Logger"

```js
run: async (config, ctx) => {
  ctx.logger.debug('Verbose detail, only shown with --debug');
  ctx.logger.info('Normal progress');
  ctx.logger.warn('Something looks off, continuing anyway');
  ctx.logger.error('Something failed');
};
```

---

## Typing a custom task

In TypeScript, import the contract from the package root and let the generics
carry your config and output shapes:

```ts
import type { TaskDef, TaskContext, SkierGlobals } from 'skier';

interface GreetConfig {
  name: string;
}

export const greetTask = (config: GreetConfig): TaskDef<GreetConfig, SkierGlobals> => ({
  name: 'greet',
  title: `Greet ${config.name}`,
  config,
  run: async (cfg, ctx: TaskContext) => {
    ctx.logger.info(`Hello, ${cfg.name}!`);
    return { greeted: cfg.name };
  },
});
```

In plain JavaScript you don't import anything — a task is just an object with
`name`, `config`, and `run`.

---

## Related

- [Core Types](./core-types.md) — `SkierItem`, `SkierGlobals`, and the data
  built-in tasks produce.
- [Config Interfaces](./config-interfaces.md) — the `*Config` type for each
  built-in.
- [Custom Tasks](../custom-tasks.md) — the how-to guide, with patterns and
  testing.
