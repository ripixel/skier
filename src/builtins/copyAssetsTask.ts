import { TaskDef } from '../taskRegistry';
import fs from 'fs-extra';
import path from 'path';

export type CopyAssetsConfig = {
  from: string;
  to: string;
};

export function copyAssetsTask(config: CopyAssetsConfig): TaskDef {
  return {
    name: 'copy-assets',
    title: `Copy static assets from ${config.from} to ${config.to}`,
    run: async () => {
      try {
        await fs.ensureDir(config.to);
        await fs.copy(config.from, config.to, {
          overwrite: true,
          errorOnExist: false,
          filter: (src) => {
            // Optionally skip dotfiles or certain patterns here
            return true;
          },
        });
        console.log(`[skier] Copied assets from ${config.from} to ${config.to}`);
      } catch (err) {
        throw new Error(`[skier] Failed to copy assets: ${err}`);
      }
    }
  };
}
