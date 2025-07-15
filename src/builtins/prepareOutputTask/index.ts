import fs from 'fs-extra';
import { TaskDef } from '../../types';

export interface PrepareOutputConfig {
  outDir: string;
}

export function prepareOutputTask(config: PrepareOutputConfig): TaskDef<PrepareOutputConfig> {
  return {
    name: 'prepare-output',
    title: `Prepare output directory: ${config.outDir}`,
    config,
    run: async (cfg, ctx) => {
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
