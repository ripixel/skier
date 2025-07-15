import { TaskDef } from '../../types';
import { ensureDir, copyDir } from '../../utils/fileHelpers';

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
        if (ctx.logger) ctx.logger.debug(`Copying assets from ${cfg.from} to ${cfg.to}`);
        await ensureDir(cfg.to);
        await copyDir(cfg.from, cfg.to);
        if (ctx.logger && ctx.debug) {
          ctx.logger.debug(`Copied assets from ${cfg.from} to ${cfg.to}`);
        }
        return {};
      } catch (err) {
        if (ctx.logger) {
          ctx.logger.error(`Failed to copy assets: ${err}`);
        }
        throw new Error(`[skier] Failed to copy assets: ${err}`);
      }
    },
  };
}
