export const MAX_SEARCH_MATCHES = 1_000;

export interface SearchMatch {
  start: number;
  end: number;
}

export interface SearchPart {
  text: string;
  match: boolean;
  start: number;
  truncated?: boolean;
}

function collectMatches(text: string, query: string): { matches: SearchMatch[]; truncated: boolean } {
  if (!query) return { matches: [], truncated: false };

  const pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'giu');
  const matches: SearchMatch[] = [];
  let match: RegExpExecArray | null;

  while (matches.length < MAX_SEARCH_MATCHES && (match = pattern.exec(text)) !== null) {
    const start = match.index;
    matches.push({ start, end: start + match[0].length });
  }

  return { matches, truncated: matches.length === MAX_SEARCH_MATCHES && pattern.exec(text) !== null };
}

export function findMatches(text: string, query: string): SearchMatch[] {
  return collectMatches(text, query).matches;
}

export function highlightParts(text: string, query: string): SearchPart[] {
  const { matches, truncated } = collectMatches(text, query);
  if (!matches.length) return [{ text, match: false, start: 0 }];

  const parts: SearchPart[] = [];
  let cursor = 0;
  for (const { start, end } of matches) {
    if (start > cursor) parts.push({ text: text.slice(cursor, start), match: false, start: cursor });
    parts.push({ text: text.slice(start, end), match: true, start });
    cursor = end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false, start: cursor, truncated });
  return parts;
}

