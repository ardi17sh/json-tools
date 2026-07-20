export function generateType(value, options) {
  if (value === null) return 'null';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return options.arraySyntax === 'shorthand' ? 'unknown[]' : 'Array<unknown>';
    }
    const elementType = generateType(value[0], options);
    return options.arraySyntax === 'shorthand' 
      ? `${elementType}[]` 
      : `Array<${elementType}>`;
  }
  
  throw new Error('Unsupported type');
}
