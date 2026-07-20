export function generateType(value, options, depth = 0) {
  const indent = ' '.repeat(options.indent * depth);
  const innerIndent = ' '.repeat(options.indent * (depth + 1));
  
  if (value === null) return 'null';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return options.arraySyntax === 'shorthand' ? 'unknown[]' : 'Array<unknown>';
    }
    const elementType = generateType(value[0], options, depth);
    return options.arraySyntax === 'shorthand' 
      ? `${elementType}[]` 
      : `Array<${elementType}>`;
  }
  
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    
    const properties = entries.map(([key, val]) => {
      const type = generateType(val, options, depth + 1);
      return `${innerIndent}${key}: ${type};`;
    });
    
    return `{\n${properties.join('\n')}\n${indent}}`;
  }
  
  throw new Error('Unsupported type');
}
