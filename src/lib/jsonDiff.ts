export type DiffStatus = 'same' | 'added' | 'removed' | 'changed';

export interface DiffNode {
  key: string;
  status: DiffStatus;
  oldValue: unknown;
  newValue: unknown;
  children?: DiffNode[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isEqual(a: unknown, b: unknown): boolean {
  return Object.is(a, b);
}

function diffValue(oldValue: unknown, newValue: unknown, key: string): DiffNode {
  if (isObject(oldValue) && isObject(newValue)) {
    return diffObject(oldValue, newValue, key);
  }

  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    return diffArray(oldValue, newValue, key);
  }

  if (isEqual(oldValue, newValue)) {
    return { key, status: 'same', oldValue, newValue };
  }

  return { key, status: 'changed', oldValue, newValue };
}

function diffUnpaired(value: unknown, status: 'added' | 'removed', key: string): DiffNode {
  const children: DiffNode[] = [];

  if (Array.isArray(value)) {
    value.forEach((item, i) => children.push(diffUnpaired(item, status, String(i))));
  } else if (isObject(value)) {
    Object.entries(value).forEach(([k, v]) => children.push(diffUnpaired(v, status, k)));
  }

  return {
    key,
    status,
    oldValue: status === 'removed' ? value : undefined,
    newValue: status === 'added' ? value : undefined,
    ...(children.length ? { children } : {})
  };
}

function diffObject(oldObj: Record<string, unknown>, newObj: Record<string, unknown>, key: string): DiffNode {
  const keys = [...new Set([...Object.keys(newObj), ...Object.keys(oldObj)])];
  const children: DiffNode[] = [];

  for (const childKey of keys) {
    const hasOld = childKey in oldObj;
    const hasNew = childKey in newObj;

    if (!hasOld) {
      children.push(diffUnpaired(newObj[childKey], 'added', childKey));
    } else if (!hasNew) {
      children.push(diffUnpaired(oldObj[childKey], 'removed', childKey));
    } else {
      children.push(diffValue(oldObj[childKey], newObj[childKey], childKey));
    }
  }

  return { key, status: 'changed', oldValue: oldObj, newValue: newObj, children };
}

function diffArray(oldArr: unknown[], newArr: unknown[], key: string): DiffNode {
  const length = Math.max(oldArr.length, newArr.length);
  const children: DiffNode[] = [];

  for (let i = 0; i < length; i++) {
    const hasOld = i < oldArr.length;
    const hasNew = i < newArr.length;

    if (!hasOld) {
      children.push(diffUnpaired(newArr[i], 'added', String(i)));
    } else if (!hasNew) {
      children.push(diffUnpaired(oldArr[i], 'removed', String(i)));
    } else {
      children.push(diffValue(oldArr[i], newArr[i], String(i)));
    }
  }

  return { key, status: 'changed', oldValue: oldArr, newValue: newArr, children };
}

export function diffJson(oldValue: unknown, newValue: unknown, key = 'root'): DiffNode {
  const result = diffValue(oldValue, newValue, key);

  if (result.children && result.children.every((child) => child.status === 'same')) {
    return { key, status: 'same', oldValue, newValue };
  }

  return result;
}
