import { Logger } from '../logger';

export function resolveConfigVars(config: any, context: Record<string, any>, logger: Logger): any {
  if (typeof config === 'string') {
    const varMatch = config.match(/^\$\{(.+?)\}$/);
    if (varMatch) {
      const varName = varMatch[1];
      if (context && Object.prototype.hasOwnProperty.call(context, varName)) {
        logger.debug(`Resolved variable '${varName}' to: ${JSON.stringify(context[varName])}`);
        return context[varName];
      } else {
        logger.debug(`Variable '${varName}' not found in context, leaving as undefined`);
        return undefined;
      }
    }
  } else if (Array.isArray(config)) {
    return config.map(item => resolveConfigVars(item, context, logger));
  } else if (typeof config === 'object' && config !== null) {
    const resolved: any = {};
    for (const key in config) {
      resolved[key] = resolveConfigVars(config[key], context, logger);
    }
    return resolved;
  }
  return config;
}
