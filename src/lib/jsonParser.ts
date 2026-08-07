export function parseJson(input: string): { data: unknown | null; error: string } {
  const trimmed = input.trim();

  if (!trimmed) {
    return { data: null, error: '' };
  }

  // ponytail: trailing-comma fix only; a real JS-object parser (JSON5) is a
  // new dep, add it if unquoted keys / comments / single quotes show up.
  const cleaned = trimmed.replace(/,(\s*[\]}])/g, '$1');

  try {
    let parsed: unknown = JSON.parse(cleaned);
    
    // Auto-detect stringified JSON and parse recursively
    while (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        break;
      }
    }
    
    return { data: parsed, error: '' };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { data: null, error: message };
  }
}
