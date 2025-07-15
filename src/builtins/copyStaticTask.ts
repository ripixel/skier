import { TaskDef } from '../types';
import fs from 'fs-extra';


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
        await fs.ensureDir(cfg.to);
        await fs.copy(cfg.from, cfg.to, {
          overwrite: true,
          errorOnExist: false,
          filter: (src) => {
            // Optionally skip dotfiles or certain patterns here
            return true;
          },
        });
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
    }
  };
}
