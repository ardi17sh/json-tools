/**
 * @param {string} str
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * @param {string} key
 */
function toTypeName(key) {
  return capitalize(key.replace(/[^a-zA-Z0-9]/g, ""));
}

/**
 * @typedef {{ arraySyntax: 'shorthand' | 'generic', indent: number }} TypeOptions
 * @typedef {{ typeConstruct?: 'interface' | 'type', rootName?: string } & TypeOptions} ExtractOptions
 */

/**
 * @param {unknown} value
 * @param {TypeOptions} options
 * @param {number} [depth]
 * @returns {string}
 */
function generateInlineType(value, options, depth = 0) {
  const indent = " ".repeat(options.indent * depth);
  const innerIndent = " ".repeat(options.indent * (depth + 1));

  if (value === null) return "null";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return options.arraySyntax === "shorthand"
        ? "unknown[]"
        : "Array<unknown>";
    }
    const elementType = generateInlineType(value[0], options, depth);
    return options.arraySyntax === "shorthand"
      ? `${elementType}[]`
      : `Array<${elementType}>`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(
      /** @type {Record<string, unknown>} */ (value),
    );
    if (entries.length === 0) return "{}";

    const properties = entries.map(([key, val]) => {
      const type = generateInlineType(val, options, depth + 1);
      return `${innerIndent}${key}: ${type};`;
    });

    return `{\n${properties.join("\n")}\n${indent}}`;
  }

  throw new Error("Unsupported type");
}

/**
 * @param {unknown} value
 * @param {TypeOptions} options
 * @param {number} [depth]
 * @returns {string}
 */
export function generateType(value, options, depth = 0) {
  return generateInlineType(value, options, depth);
}

/**
 * @param {unknown} value
 * @param {ExtractOptions} options
 * @returns {string}
 */
export function generateExtractedTypes(value, options) {
  /** @type {string[]} */
  const interfaces = [];
  const construct = options.typeConstruct || "interface";

  /**
   * @param {unknown} val
   * @param {string} name
   * @param {ExtractOptions} opts
   * @returns {string}
   */
  function extract(val, name, opts) {
    if (val === null || typeof val !== "object") {
      return generateInlineType(val, opts);
    }

    if (Array.isArray(val)) {
      if (val.length === 0) {
        return opts.arraySyntax === "shorthand"
          ? "unknown[]"
          : "Array<unknown>";
      }
      const elementType = extract(val[0], name + "Item", opts);
      return opts.arraySyntax === "shorthand"
        ? `${elementType}[]`
        : `Array<${elementType}>`;
    }

    const entries = Object.entries(
      /** @type {Record<string, unknown>} */ (val),
    );
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
        const arrayType =
          opts.arraySyntax === "shorthand"
            ? `${typeName}[]`
            : `Array<${typeName}>`;
        return `${innerIndent}${key}: ${arrayType};`;
      }
      const type = generateInlineType(v, opts, 1);
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
