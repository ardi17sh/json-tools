function toTypeName(key: string): string {
  const cleaned = key.replace(/[^a-zA-Z0-9]/g, "");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function arrayType(element: string, syntax: TypeOptions["arraySyntax"]): string {
  return syntax === "shorthand" ? `${element}[]` : `Array<${element}>`;
}

export interface TypeOptions {
  arraySyntax: 'shorthand' | 'generic';
  indent: number;
}

export interface ExtractOptions extends TypeOptions {
  typeConstruct?: 'interface' | 'type';
  rootName?: string;
}

export function generateType(
  value: unknown,
  options: TypeOptions,
  depth: number = 0
): string {
  const indent = " ".repeat(options.indent * depth);
  const innerIndent = " ".repeat(options.indent * (depth + 1));

  if (value === null) return "null";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return arrayType("unknown", options.arraySyntax);
    }
    const elementType = generateType(value[0], options, depth);
    return arrayType(elementType, options.arraySyntax);
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "{}";

    const properties = entries.map(([key, val]) => {
      const type = generateType(val, options, depth + 1);
      return `${innerIndent}${key}: ${type};`;
    });

    return `{\n${properties.join("\n")}\n${indent}}`;
  }

  throw new Error("Unsupported type");
}

export function generateExtractedTypes(
  value: unknown,
  options: ExtractOptions
): string {
  const interfaces: string[] = [];
  const construct = options.typeConstruct || "interface";

  function extract(
    val: unknown,
    name: string,
    opts: ExtractOptions
  ): string {
    if (val === null || typeof val !== "object") {
      return generateType(val, opts);
    }

    if (Array.isArray(val)) {
      if (val.length === 0) {
        return arrayType("unknown", opts.arraySyntax);
      }
      const elementType = extract(val[0], name + "Item", opts);
      return arrayType(elementType, opts.arraySyntax);
    }

    const entries = Object.entries(val as Record<string, unknown>);
    if (entries.length === 0) return "{}";

    const innerIndent = " ".repeat(opts.indent);
    const properties = entries.map(([key, v]) => {
      if (
        v !== null &&
        typeof v === "object" &&
        !Array.isArray(v) &&
        Object.keys(v).length > 0
      ) {
        const typeName = toTypeName(key);
        extract(v, typeName, opts);
        return `${innerIndent}${key}: ${typeName};`;
      }
      if (
        Array.isArray(v) &&
        v.length > 0 &&
        typeof v[0] === "object" &&
        v[0] !== null &&
        !Array.isArray(v[0])
      ) {
        const typeName = toTypeName(key) + "Item";
        extract(v[0], typeName, opts);
        return `${innerIndent}${key}: ${arrayType(typeName, opts.arraySyntax)};`;
      }
      const type = generateType(v, opts, 1);
      return `${innerIndent}${key}: ${type};`;
    });

    const body = properties.join("\n");

    if (construct === "type") {
      interfaces.push(`type ${name} = {\n${body}\n}`);
    } else {
      interfaces.push(`interface ${name} {\n${body}\n}`);
    }

    return name;
  }

  const rootName = options.rootName || "Root";
  extract(value, rootName, options);

  return interfaces.join("\n\n");
}
