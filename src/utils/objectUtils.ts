export function deepMerge<T extends object, U extends object>(target: T, source: U): T & U {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (
        typeof (target as Record<string, any>)[key] === 'object' &&
        typeof source[key] === 'object' &&
        (target as Record<string, any>)[key] !== null &&
        source[key] !== null
      ) {
        // @ts-ignore
        target[key] = deepMerge(target[key], source[key]);
      } else {
        // @ts-ignore
        target[key] = source[key];
      }
    }
  }
  return target as T & U;
}

export function safeGet<T, K extends keyof T>(obj: T, key: K): T[K] | undefined {
  return obj ? obj[key] : undefined;
}
