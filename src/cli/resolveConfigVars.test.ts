import { resolveConfigVars } from './resolveConfigVars';

describe('resolveConfigVars', () => {
  const logger = { debug: jest.fn() };
  it('returns primitive values as-is', () => {
    expect(resolveConfigVars(42, {}, logger as any)).toBe(42);
    expect(resolveConfigVars('hello', {}, logger as any)).toBe('hello');
  });
  it('resolves ${var} string from context', () => {
    expect(resolveConfigVars('${myVar}', { myVar: 123 }, logger as any)).toBe(123);
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining("Resolved variable 'myVar'"));
  });
  it('returns undefined for missing context var', () => {
    expect(resolveConfigVars('${nope}', {}, logger as any)).toBeUndefined();
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining("Variable 'nope' not found"));
  });
  it('recursively resolves arrays and objects', () => {
    const ctx = { foo: 'bar', num: 7 };
    const input = [{ a: '${foo}' }, 1, '${num}'];
    const out = resolveConfigVars(input, ctx, logger as any);
    expect(out).toEqual([{ a: 'bar' }, 1, 7]);
    const obj = { x: '${foo}', y: 2 };
    expect(resolveConfigVars(obj, ctx, logger as any)).toEqual({ x: 'bar', y: 2 });
  });
});
