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
  chalk.blue,
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
    hash = ((hash << 5) - hash) + taskName.charCodeAt(i);
    hash |= 0;
  }
  return colorPalette[Math.abs(hash) % colorPalette.length];
}

export class Logger {
  private debug: boolean;
  private taskName?: string;

  constructor(options: LoggerOptions) {
    this.debug = options.debug;
    this.taskName = options.taskName;
  }

  info(msg: string) {
    if (this.debug) {
      console.log(this.prefix() + ' ' + msg);
    }
  }

  warn(msg: string) {
    if (this.debug) {
      console.warn(this.prefix() + ' ' + msg);
    }
  }

  error(msg: string) {
    console.error(this.prefix() + ' ' + msg);
  }

  success(msg: string) {
    if (this.debug) {
      console.log(this.prefix() + ' ' + msg);
    }
  }

  task(msg: string) {
    if (this.debug && this.taskName) {
      console.log(this.prefix() + ' ' + msg);
    }
  }

  always(msg: string) {
    console.log(this.prefix() + ' ' + msg);
  }

  private prefix() {
    if (this.taskName) {
      // Colorize each task prefix consistently
      return getTaskColor(this.taskName)(`[skier/${this.taskName}]`);
    }
    // Runner logs always blue
    return chalk.blue('[skier/runner]');
  }
}

