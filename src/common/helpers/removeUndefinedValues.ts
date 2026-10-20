/** `undefined` değerli alanları özyinelemeli olarak temizler (null korunur). */
export function RemoveUndefinedValues<T>(obj: T): T {
  if (typeof obj !== "object" || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map(RemoveUndefinedValues) as unknown as T;
  }

  return Object.entries(obj as Record<string, unknown>)
    .filter(([, value]) => value !== undefined)
    .reduce((acc, [key, value]) => {
      (acc as Record<string, unknown>)[key] = RemoveUndefinedValues(value);
      return acc;
    }, {} as T);
}
