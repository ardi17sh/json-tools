import { describe, it, expect } from 'vitest';
import { diffJson } from './jsonDiff';

describe('diffJson', () => {
  it('marks identical objects as same (children pruned)', () => {
    const result = diffJson({ a: 1, b: 2 }, { a: 1, b: 2 });
    expect(result.status).toBe('same');
    expect(result.children).toBeUndefined();
  });

  it('marks an added key', () => {
    const result = diffJson({ a: 1 }, { a: 1, b: 2 });
    const b = result.children?.find((c) => c.key === 'b');
    expect(b?.status).toBe('added');
    expect(b?.oldValue).toBeUndefined();
    expect(b?.newValue).toBe(2);
  });

  it('marks a removed key', () => {
    const result = diffJson({ a: 1, b: 2 }, { a: 1 });
    const b = result.children?.find((c) => c.key === 'b');
    expect(b?.status).toBe('removed');
    expect(b?.newValue).toBeUndefined();
    expect(b?.oldValue).toBe(2);
  });

  it('marks a changed primitive with old and new values', () => {
    const result = diffJson({ a: 1 }, { a: 2 });
    const a = result.children?.find((c) => c.key === 'a');
    expect(a?.status).toBe('changed');
    expect(a?.oldValue).toBe(1);
    expect(a?.newValue).toBe(2);
  });

  it('marks a type mismatch as changed with no children', () => {
    const result = diffJson({ a: 'text' }, { a: { x: 1 } });
    const a = result.children?.find((c) => c.key === 'a');
    expect(a?.status).toBe('changed');
    expect(a?.children).toBeUndefined();
  });

  it('marks array tail as added/removed by index', () => {
    const shorter = diffJson([1, 2], [1, 2, 3]);
    expect(shorter.children?.[2].status).toBe('added');

    const longer = diffJson([1, 2, 3], [1, 2]);
    expect(longer?.children?.[2].status).toBe('removed');
  });

  it('propagates a nested change to the parent', () => {
    const result = diffJson({ user: { age: 30 } }, { user: { age: 31 } });
    expect(result.status).toBe('changed');
    const user = result.children?.find((c) => c.key === 'user');
    expect(user?.status).toBe('changed');
  });

  it('truncates diffs that exceed the structural budget', () => {
    const left = Array.from({ length: 20_000 }, (_, index) => index);
    const right = [...left];
    right[0] = -1;

    const result = diffJson(left, right);

    expect(result.status).toBe('changed');
    expect(result.truncated).toBe(true);
  });
});