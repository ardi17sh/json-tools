import { describe, it, expect } from 'vitest';
import { parseJson } from './jsonParser';

describe('parseJson', () => {
  it('should parse valid JSON object', () => {
    const result = parseJson('{"name":"John","age":30}');
    
    expect(result.data).toEqual({ name: 'John', age: 30 });
    expect(result.error).toBe('');
  });

  it('should parse valid JSON array', () => {
    const result = parseJson('[1, 2, 3]');
    
    expect(result.data).toEqual([1, 2, 3]);
    expect(result.error).toBe('');
  });

  it('should return error for invalid JSON', () => {
    const result = parseJson('{invalid}');
    
    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it('should return empty result for empty input', () => {
    const result = parseJson('');
    
    expect(result.data).toBeNull();
    expect(result.error).toBe('');
  });

  it('should return empty result for whitespace-only input', () => {
    const result = parseJson('   \n\t  ');
    
    expect(result.data).toBeNull();
    expect(result.error).toBe('');
  });

  it('should auto-detect and parse stringified JSON', () => {
    const stringified = JSON.stringify({ name: 'John' });
    const doubleStringified = JSON.stringify(stringified);
    const result = parseJson(doubleStringified);
    
    expect(result.data).toEqual({ name: 'John' });
    expect(result.error).toBe('');
  });
});
