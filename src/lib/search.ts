export interface SearchMatch {
  start: number;
  end: number;
}

export interface SearchPart {
  text: string;
  match: boolean;
  start: number;
}

export function findMatches(text: string, query: string): SearchMatch[] {
  if (!query) return [];

  const pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'giu');
  return [...text.matchAll(pattern)].map((match) => ({
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
  }));
}

export function highlightParts(text: string, query: string): SearchPart[] {
  const matches = findMatches(text, query);
  if (!matches.length) return [{ text, match: false, start: 0 }];

  const parts: SearchPart[] = [];
  let cursor = 0;
  for (const { start, end } of matches) {
    if (start > cursor) parts.push({ text: text.slice(cursor, start), match: false, start: cursor });
    parts.push({ text: text.slice(start, end), match: true, start });
    cursor = end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false, start: cursor });
  return parts;
}
 
