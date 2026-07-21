export function parseJson(input: string): { data: unknown | null; error: string } {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return { data: null, error: '' };
  }

  try {
    let parsed: unknown = JSON.parse(trimmed);
    
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
