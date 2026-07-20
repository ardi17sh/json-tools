import { describe, it, expect } from 'vitest';
import { generateType } from './typeGenerator';

describe('TypeScript Type Generator', () => {
  it('should pass initial test', () => {
    expect(true).toBe(true);
  });
});

describe('generateType - primitives', () => {
  it('should generate string type', () => {
    const result = generateType('hello', { arraySyntax: 'shorthand' });
    expect(result).toBe('string');
  });

  it('should generate number type', () => {
    const result = generateType(42, { arraySyntax: 'shorthand' });
    expect(result).toBe('number');
  });

  it('should generate boolean type', () => {
    const result = generateType(true, { arraySyntax: 'shorthand' });
    expect(result).toBe('boolean');
  });

  it('should generate null type', () => {
    const result = generateType(null, { arraySyntax: 'shorthand' });
    expect(result).toBe('null');
  });
});

describe('generateType - arrays', () => {
  it('should generate array with shorthand syntax', () => {
    const result = generateType([1, 2, 3], { arraySyntax: 'shorthand' });
    expect(result).toBe('number[]');
  });

  it('should generate array with generic syntax', () => {
    const result = generateType([1, 2, 3], { arraySyntax: 'generic' });
    expect(result).toBe('Array<number>');
  });

  it('should generate string array', () => {
    const result = generateType(['a', 'b'], { arraySyntax: 'shorthand' });
    expect(result).toBe('string[]');
  });

  it('should handle empty array', () => {
    const result = generateType([], { arraySyntax: 'shorthand' });
    expect(result).toBe('unknown[]');
  });
});
