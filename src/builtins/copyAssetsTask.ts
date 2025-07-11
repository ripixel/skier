import { TaskDef } from '../taskRegistry';
import fs from 'fs-extra';
import path from 'path';

import type { Logger } from '../logger';

export interface CopyAssetsConfig {
  from: string;
  to: string;
}

export function copyAssetsTask(config: CopyAssetsConfig): TaskDef<CopyAssetsConfig> {
  return {
    name: 'copy-assets',
    title: `Copy static assets from ${config.from} to ${config.to}`,
    config,
    run: async (cfg: CopyAssetsConfig, ctx) => {
      try {
        if (ctx.logger) ctx.logger.info(`Copying assets from ${cfg.from} to ${cfg.to}`);
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
          ctx.logger.task(`Copied assets from ${cfg.from} to ${cfg.to}`);
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
