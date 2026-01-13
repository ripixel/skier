import type { TaskDef, TaskContext, SkierGlobals } from '../../types';

export interface SetGlobalsConfig {
  values?: SkierGlobals;
  valuesFn?: (globals: SkierGlobals) => SkierGlobals | Promise<SkierGlobals>;
}

/**
 * Adds arbitrary key-value pairs to the Skier globals context for downstream use in templates and tasks.
 * Supports a static `values` object, a dynamic `valuesFn`, or both.
 * Example: setGlobalsTask({ values: { noindex: '<meta name="robots" content="noindex">' } })
 * Example: setGlobalsTask({ valuesFn: globals => ({ latestVersion: extractVersion(globals.changelogHtml) }) })
 */
export function setGlobalsTask(config: SetGlobalsConfig): TaskDef<SetGlobalsConfig, SkierGlobals> {
  return {
    name: 'set-globals',
    title: 'Set global template variables',
    config,
    run: async (cfg, ctx) => {
      let out: SkierGlobals = {};

      if (cfg.values) {
        ctx.logger.debug(`Setting globals: ${Object.keys(cfg.values).join(', ')}`);
        out = { ...cfg.values };
      }

      if (cfg.valuesFn) {
        const fromFn = await cfg.valuesFn(ctx.globals || {});
        ctx.logger.debug(`Setting globals from function: ${Object.keys(fromFn).join(', ')}`);
        out = { ...out, ...fromFn };
      }

      return out;
    },
  };
}
