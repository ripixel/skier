# humble

**Humble** is an opinionated static site generator CLI framework. It provides a simple, extensible, and scriptable way to build static websites using a task-based approach.

## Features
- Task registry for extensible site generation steps (user-supplied)
- CLI interface for running and filtering tasks
- TypeScript-first codebase

## Usage

### Install (local development)
```
npm install --save-dev humble
```

### Or install globally
```
npm install -g humble
```

### Run the generator
```
npx humble [--only task1,task2] [--skip task3]
```

## Configuration
- Projects must supply a `humble.tasks.js` or `humble.tasks.ts` in the project root, exporting an array of tasks.
- Each task should have a `name`, `title`, and `run()` function.

## Developing Humble
- Clone this repo and run `npm install`
- Source code is in `src/`, CLI entrypoint in `bin/`
- Build with `npm run build`

## License
MIT
