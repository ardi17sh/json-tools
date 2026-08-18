import { describe, expect, it } from 'vitest';
import { findMatches, highlightParts } from './search';

describe('findMatches', () => {
  it('finds case-insensitive matches', () => {
    expect(findMatches('Alpha beta ALPHA', 'alpha')).toEqual([
      { start: 0, end: 5 },
      { start: 11, end: 16 },
    ]);
  });

  it('returns multiple non-overlapping matches', () => {
    expect(findMatches('aaaa', 'aa')).toEqual([{ start: 0, end: 2 }, { start: 2, end: 4 }]);
  });

  it('handles empty and missing queries', () => {
    expect(findMatches('anything', '')).toEqual([]);
    expect(findMatches('anything', 'missing')).toEqual([]);
  });

  it('treats special characters as literal text', () => {
    expect(findMatches('a+b [x]', '+b [')).toEqual([{ start: 1, end: 5 }]);
  });
});

describe('highlightParts', () => {
  it('splits matching and non-matching text', () => {
    expect(highlightParts('Hello world', 'WORLD')).toEqual([
      { text: 'Hello ', match: false, start: 0 },
      { text: 'world', match: true, start: 6 },
    ]);
  });
});
