const MAX_INPUT_LENGTH = 1_000_000;
const MAX_JSON_DEPTH = 1_000;
const MAX_JSON_NODES = 20_000;
const MAX_STRINGIFIED_DEPTH = 100;

function exceedsDepth(input: string): boolean {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (const char of input) {
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') inString = true;
    else if (char === '{' || char === '[') {
      depth += 1;
      if (depth > MAX_JSON_DEPTH) return true;
    } else if (char === '}' || char === ']') {
      depth -= 1;
    }
  }

  return false;
}

function exceedsNodeLimit(value: unknown): boolean {
  const pending: unknown[] = [value];
  let nodes = 0;

  while (pending.length) {
    const current = pending.pop();
    nodes += 1;
    if (nodes > MAX_JSON_NODES) return true;

    if (Array.isArray(current)) {
      for (const item of current) pending.push(item);
    } else if (current !== null && typeof current === 'object') {
      for (const key of Object.keys(current)) {
        pending.push((current as Record<string, unknown>)[key]);
      }
    }
  }

  return false;
}

export function parseJson(input: string): { data: unknown | null; error: string } {
  const trimmed = input.trim();

  if (!trimmed) {
    return { data: null, error: '' };
  }
  if (trimmed.length > MAX_INPUT_LENGTH) {
    return { data: null, error: 'JSON input is too large (maximum 1 MB).' };
  }
  if (exceedsDepth(trimmed)) {
    return { data: null, error: 'JSON nesting is too deep (maximum 1,000 levels).' };
  }

  // ponytail: trailing-comma fix only; a real JS-object parser (JSON5) is a
  // new dep, add it if unquoted keys / comments / single quotes show up.
  const cleaned = trimmed.replace(/,(\s*[\]}])/g, '$1');

  try {
    let parsed: unknown = JSON.parse(cleaned);
    let unwraps = 0;

    while (typeof parsed === 'string') {
      if (unwraps++ >= MAX_STRINGIFIED_DEPTH) {
        return { data: null, error: 'Stringified JSON is nested too deeply.' };
      }
      if (exceedsDepth(parsed)) {
        return { data: null, error: 'JSON nesting is too deep (maximum 1,000 levels).' };
      }
      try {
        parsed = JSON.parse(parsed);
      } catch {
        break;
      }
    }

    if (exceedsNodeLimit(parsed)) {
      return { data: null, error: 'JSON contains too many values (maximum 20,000).' };
    }

    return { data: parsed, error: '' };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { data: null, error: message };
  }
}
