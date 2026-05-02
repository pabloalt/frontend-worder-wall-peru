export function toUppercaseDeep<T>(value: T): T {
  if (typeof value === 'string') {
    return value.toUpperCase() as T;
  }

  if (Array.isArray(value)) {
    return value.map(item => toUppercaseDeep(item)) as T;
  }

  if (value !== null && typeof value === 'object') {
    const normalized: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      normalized[key] = toUppercaseDeep(item);
    }
    return normalized as T;
  }

  return value;
}
