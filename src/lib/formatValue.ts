export function formatValue(val: unknown): { text: string; cls: string } {
  if (val === null) return { text: 'null', cls: 'json-null' };
  if (typeof val === 'boolean') return { text: String(val), cls: 'json-bool' };
  if (typeof val === 'number') return { text: String(val), cls: 'json-number' };
  if (typeof val === 'string') return { text: `"${val}"`, cls: 'json-string' };
  return { text: String(val), cls: '' };
}