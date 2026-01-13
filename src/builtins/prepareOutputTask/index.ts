import { pathExists, removeDir, ensureDir } from '../../utils/fileHelpers.js';
import { TaskDef } from '../../types.js';

export interface PrepareOutputConfig {
  outDir: string;
}

export function prepareOutputTask(config: PrepareOutputConfig): TaskDef<PrepareOutputConfig> {
  return {
    name: 'prepare-output',
    title: `Prepare output directory: ${config.outDir}`,
    config,
    run: async (cfg, ctx) => {
      ctx.logger.debug(`Cleaning output directory: ${cfg.outDir}`);
      let removed = false;
      if (await pathExists(cfg.outDir)) {
        await removeDir(cfg.outDir);
        removed = true;
        ctx.logger.debug(`Removed directory "${cfg.outDir}"`);
      }
      await ensureDir(cfg.outDir);
      ctx.logger.debug(`Ensured directory "${cfg.outDir}" exists`);
      return {};
    },
  };
}
