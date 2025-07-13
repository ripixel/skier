import fs from 'fs-extra';
import type { Logger } from '../logger';
import { TaskDef } from '../types';

export interface CleanAndCreateOutputConfig {
  outDir: string;
}

export function cleanAndCreateOutputTask(config: CleanAndCreateOutputConfig): TaskDef<CleanAndCreateOutputConfig> {
  return {
    name: 'clean-create-output',
    title: `Clean & Create Output Directory (${config.outDir})`,
    config,
    run: async (cfg: CleanAndCreateOutputConfig, ctx) => {
      if (ctx.logger) ctx.logger.debug(`Cleaning output directory: ${cfg.outDir}`);
      let removed = false;
      if (await fs.pathExists(cfg.outDir)) {
        await fs.remove(cfg.outDir);
        removed = true;
        if (ctx.logger && ctx.debug) {
          ctx.logger.debug(`Removed directory "${cfg.outDir}"`);
        }
      }
      await fs.ensureDir(cfg.outDir);
      if (ctx.logger && ctx.debug) {
        ctx.logger.debug(`Ensured directory "${cfg.outDir}" exists`);
      }
      return {};
    }
  };
}
