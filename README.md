# skier

**Skier** is an opinionated static site generator CLI framework. It provides a simple, extensible, and scriptable way to build static websites using a task-based approach.

## Features
- Task registry for extensible site generation steps (user-supplied)
- CLI interface for running and filtering tasks
- TypeScript-first codebase

## Usage

### Install (local development)
```
npm install --save-dev skier
```

### Or install globally
```
npm install -g skier
```

### Run the generator
```
npx skier [--only task1,task2] [--skip task3]
```

## Configuration
- Projects must supply a `skier.tasks.js` or `skier.tasks.ts` in the project root, exporting an array of tasks.
- Each task should have a `name`, `title`, and `run()` function.

## Developing Skier
- Clone this repo and run `npm install`
- Source code is in `src/`, CLI entrypoint in `bin/`
- Build with `npm run build`

## License
MIT
