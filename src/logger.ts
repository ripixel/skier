import chalk from 'chalk';

export type LoggerOptions = {
  debug: boolean;
  taskName?: string;
};

const colorPalette = [
  chalk.cyan,
  chalk.magenta,
  chalk.yellow,
  chalk.green,
  chalk.white,
  chalk.gray,
  chalk.red,
  chalk.cyanBright,
  chalk.magentaBright,
  chalk.yellowBright,
  chalk.greenBright,
  chalk.blueBright,
  chalk.whiteBright,
  chalk.redBright,
];

function getTaskColor(taskName: string) {
  // Simple hash to pick a color for each task
  let hash = 0;
  for (let i = 0; i < taskName.length; i++) {
    hash = (hash << 5) - hash + taskName.charCodeAt(i);
    hash |= 0;
  }
  return colorPalette[Math.abs(hash) % colorPalette.length];
}

export function createTaskLogger(taskName: string, debug: boolean): Logger {
  return new Logger({ debug, taskName });
}

export class Logger {
  private debugFlag: boolean;
  private taskName?: string;

  constructor(options: LoggerOptions) {
    this.debugFlag = options.debug;
    this.taskName = options.taskName;
  }

  info(msg: string) {
    // ℹ️ Info icon
    console.log(`ℹ️ ${this.prefix()} ${msg}`);
  }

  warn(msg: string) {
    // ⚠️ Warning icon
    console.warn(`⚠️ ${this.prefix()} ${msg}`);
  }

  error(msg: string) {
    // ❌ Error icon
    console.error(`❌ ${this.prefix()} ${msg}`);
  }

  debug(msg: string) {
    // 🐞 Debug icon
    if (this.debugFlag) {
      console.log(`🐞 ${this.prefix()} ${msg}`);
    }
  }

  private prefix() {
    if (this.taskName) {
      // Colorize each task prefix consistently
      const color = getTaskColor(this.taskName) ?? chalk.blue;
      return color(`[skier/${this.taskName}]`);
    }
    // Runner logs always blue
    return chalk.blue('[skier/runner]');
  }
}
