import { TaskDef } from '../../types';
import { ensureDir, copyDir } from '../../utils/fileHelpers';
import { throwTaskError } from '../../utils/errors';

export interface CopyStaticConfig {
  from: string;
  to: string;
}

export function copyStaticTask(config: CopyStaticConfig): TaskDef<CopyStaticConfig> {
  return {
    name: 'copy-static',
    title: `Copy static files from ${config.from} to ${config.to}`,
    config,
    run: async (cfg, ctx) => {
      try {
        ctx.logger.debug(`Copying assets from ${cfg.from} to ${cfg.to}`);
        await ensureDir(cfg.to);
        await copyDir(cfg.from, cfg.to);
        ctx.logger.debug(`Copied assets from ${cfg.from} to ${cfg.to}`);
        return {};
      } catch (err) {
        throwTaskError(
          ctx,
          'copy-static',
          `Failed to copy assets from ${cfg.from} to ${cfg.to}`,
          err instanceof Error ? err : undefined,
        );
      }
    },
  };
}
