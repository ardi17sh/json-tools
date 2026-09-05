export type DiffStatus = 'same' | 'added' | 'removed' | 'changed';

export interface DiffNode {
  key: string;
  status: DiffStatus;
  oldValue: unknown;
  newValue: unknown;
  children?: DiffNode[];
  truncated?: boolean;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isEqual(a: unknown, b: unknown): boolean {
  return Object.is(a, b);
}

const MAX_DIFF_NODES = 20_000;

interface DiffContext {
  nodes: number;
}

function diffValue(oldValue: unknown, newValue: unknown, key: string, context: DiffContext): DiffNode {
  if (++context.nodes > MAX_DIFF_NODES) {
    return { key, status: 'changed', oldValue, newValue, truncated: true };
  }

  if (isObject(oldValue) && isObject(newValue)) {
    return diffObject(oldValue, newValue, key, context);
  }

  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    return diffArray(oldValue, newValue, key, context);
  }

  if (isEqual(oldValue, newValue)) {
    return { key, status: 'same', oldValue, newValue };
  }

  return { key, status: 'changed', oldValue, newValue };

}
function diffUnpaired(value: unknown, status: 'added' | 'removed', key: string, context: DiffContext): DiffNode {
  let truncated = ++context.nodes > MAX_DIFF_NODES;
  const children: DiffNode[] = [];

  if (!truncated) {
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (context.nodes >= MAX_DIFF_NODES) {
          truncated = true;
          break;
        }
        children.push(diffUnpaired(value[i], status, String(i), context));
      }
    } else if (isObject(value)) {
      for (const [childKey, childValue] of Object.entries(value)) {
        if (context.nodes >= MAX_DIFF_NODES) {
          truncated = true;
          break;
        }
        children.push(diffUnpaired(childValue, status, childKey, context));
      }
    }
  }

  return {
    key,
    status,
    oldValue: status === 'removed' ? value : undefined,
    newValue: status === 'added' ? value : undefined,
    ...(children.length ? { children } : {}),
    ...(truncated ? { truncated: true } : {}),
  };
}

function diffObject(oldObj: Record<string, unknown>, newObj: Record<string, unknown>, key: string, context: DiffContext): DiffNode {
  const keys = [...new Set([...Object.keys(newObj), ...Object.keys(oldObj)])];
  const children: DiffNode[] = [];
  let truncated = false;

  for (const childKey of keys) {
    if (context.nodes >= MAX_DIFF_NODES) {
      truncated = true;
      break;
    }
    const hasOld = childKey in oldObj;
    const hasNew = childKey in newObj;

    if (!hasOld) {
      children.push(diffUnpaired(newObj[childKey], 'added', childKey, context));
    } else if (!hasNew) {
      children.push(diffUnpaired(oldObj[childKey], 'removed', childKey, context));
    } else {
      children.push(diffValue(oldObj[childKey], newObj[childKey], childKey, context));
    }
  }

  return { key, status: 'changed', oldValue: oldObj, newValue: newObj, children, ...(truncated ? { truncated: true } : {}) };
}

function diffArray(oldArr: unknown[], newArr: unknown[], key: string, context: DiffContext): DiffNode {
  const length = Math.max(oldArr.length, newArr.length);
  const children: DiffNode[] = [];
  let truncated = false;

  for (let i = 0; i < length; i++) {
    if (context.nodes >= MAX_DIFF_NODES) {
      truncated = true;
      break;
    }
    const hasOld = i < oldArr.length;
    const hasNew = i < newArr.length;

    if (!hasOld) {
      children.push(diffUnpaired(newArr[i], 'added', String(i), context));
    } else if (!hasNew) {
      children.push(diffUnpaired(oldArr[i], 'removed', String(i), context));
    } else {
      children.push(diffValue(oldArr[i], newArr[i], String(i), context));
    }
  }

  return { key, status: 'changed', oldValue: oldArr, newValue: newArr, children, ...(truncated ? { truncated: true } : {}) };
}

export function diffJson(oldValue: unknown, newValue: unknown, key = 'root'): DiffNode {
  const context: DiffContext = { nodes: 0 };
  const result = diffValue(oldValue, newValue, key, context);

  if (result.children && !result.truncated && result.children.every((child) => child.status === 'same')) {
    return { key, status: 'same', oldValue, newValue };
  }

  return result;
}
