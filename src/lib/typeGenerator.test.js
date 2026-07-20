import { describe, it, expect } from 'vitest';
import { generateType, generateExtractedTypes } from './typeGenerator';

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

describe('generateType - inline objects', () => {
  it('should generate inline object type', () => {
    const value = { name: 'John', age: 30 };
    const options = { arraySyntax: 'shorthand', indent: 2 };
    const result = generateType(value, options);
    expect(result).toBe(`{
  name: string;
  age: number;
}`);
  });

  it('should handle nested objects inline', () => {
    const value = { user: { name: 'John' } };
    const options = { arraySyntax: 'shorthand', indent: 2 };
    const result = generateType(value, options);
    expect(result).toBe(`{
  user: {
    name: string;
  };
}`);
  });

  it('should handle empty object', () => {
    const value = {};
    const options = { arraySyntax: 'shorthand', indent: 2 };
    const result = generateType(value, options);
    expect(result).toBe('{}');
  });
});

describe('generateExtractedTypes', () => {
  it('should extract nested objects', () => {
    const value = { user: { name: 'John', age: 30 } };
    const options = { 
      typeConstruct: 'interface', 
      rootName: 'Root',
      arraySyntax: 'shorthand',
      indent: 2
    };
    const result = generateExtractedTypes(value, options);
    expect(result).toContain('interface Root {');
    expect(result).toContain('user: User;');
    expect(result).toContain('interface User {');
    expect(result).toContain('name: string;');
    expect(result).toContain('age: number;');
  });

  it('should use type construct when specified', () => {
    const value = { user: { name: 'John' } };
    const options = { 
      typeConstruct: 'type', 
      rootName: 'Root',
      arraySyntax: 'shorthand',
      indent: 2
    };
    const result = generateExtractedTypes(value, options);
    expect(result).toContain('type Root =');
    expect(result).toContain('type User =');
  });
});
