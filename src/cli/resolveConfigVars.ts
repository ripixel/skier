import type { Logger } from '../logger';
import type { SkierGlobals } from '../types';

/**
 * Recursively resolves ${varName} references in config values.
 * Uses the globals context to replace variable references.
 */
export function resolveConfigVars(config: unknown, context: SkierGlobals, logger: Logger): unknown {
  if (typeof config === 'string') {
    const varMatch = config.match(/^\$\{(.+?)\}$/);
    if (varMatch) {
      const varName = varMatch[1];
      if (varName && Object.prototype.hasOwnProperty.call(context, varName)) {
        logger.debug(`Resolved variable '${varName}' to: ${JSON.stringify(context[varName])}`);
        return context[varName];
      } else {
        logger.debug(
          `Variable '${varName ?? 'undefined'}' not found in context, leaving as undefined`,
        );
        return undefined;
      }
    }
  } else if (Array.isArray(config)) {
    return config.map((item) => resolveConfigVars(item, context, logger));
  } else if (typeof config === 'object' && config !== null) {
    const resolved: Record<string, unknown> = {};
    for (const key in config) {
      resolved[key] = resolveConfigVars((config as Record<string, unknown>)[key], context, logger);
    }
    return resolved;
  }
  return config;
}
