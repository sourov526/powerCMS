import type { ReactNode } from "react";
import { cloneElement, isValidElement } from "react";

type Dict = Record<string, unknown>;
type Primitive = string | number | boolean | null | undefined;
type PlainValues = Record<string, Primitive>;
type RichMapper = (chunks: ReactNode) => ReactNode;
type RichValues = Record<string, Primitive | ReactNode | RichMapper>;

function isDict(value: unknown): value is Dict {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolvePath(dict: Dict, path: string): unknown {
  const segments = path.split(".");
  let cursor: unknown = dict;
  for (const segment of segments) {
    if (!isDict(cursor)) return undefined;
    cursor = (cursor as Dict)[segment];
  }
  return cursor;
}

function applyPlainInterpolation(text: string, values?: PlainValues): string {
  if (!values) return text;
  return text.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const value = values[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

function parseRichText(
  input: string,
  values: RichValues | undefined,
  keyPrefix: string
): ReactNode {
  const match = input.match(/<([a-zA-Z][a-zA-Z0-9_]*)>([\s\S]*?)<\/\1>/);
  if (!match || match.index === undefined) {
    return applyPlainInterpolation(input, values as PlainValues | undefined);
  }

  const fullMatch = match[0];
  const tag = match[1];
  const inner = match[2];
  const start = match.index;
  const before = input.slice(0, start);
  const after = input.slice(start + fullMatch.length);

  const nodes: ReactNode[] = [];
  const beforeNode = parseRichText(before, values, `${keyPrefix}-before`);
  if (beforeNode !== "") nodes.push(beforeNode);

  const innerNode = parseRichText(inner, values, `${keyPrefix}-${tag}`);
  const mapper = values?.[tag];
  if (typeof mapper === "function") {
    nodes.push((mapper as RichMapper)(innerNode));
  } else if (isValidElement(mapper)) {
    nodes.push(cloneElement(mapper, undefined, innerNode));
  } else if (mapper !== undefined && mapper !== null && mapper !== false) {
    nodes.push(mapper);
  } else {
    nodes.push(innerNode);
  }

  const afterNode = parseRichText(after, values, `${keyPrefix}-after`);
  if (afterNode !== "") nodes.push(afterNode);

  return nodes.length === 1 ? nodes[0] : <>{nodes}</>;
}

export type Translator = {
  (key: string, values?: PlainValues): string;
  raw: (key: string) => unknown;
  rich: (key: string, values?: RichValues) => ReactNode;
};

export function createTranslator(dict: Dict, namespace?: string): Translator {
  const keyWithNamespace = (key: string) =>
    namespace ? `${namespace}.${key}` : key;

  const translate = ((key: string, values?: PlainValues) => {
    const value = resolvePath(dict, keyWithNamespace(key));
    if (typeof value === "string") return applyPlainInterpolation(value, values);
    if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      return String(value ?? "");
    }
    return keyWithNamespace(key);
  }) as Translator;

  translate.raw = (key: string) =>
    resolvePath(dict, keyWithNamespace(key)) ?? keyWithNamespace(key);

  translate.rich = (key: string, values?: RichValues) => {
    const value = resolvePath(dict, keyWithNamespace(key));
    if (typeof value !== "string") return keyWithNamespace(key);
    return parseRichText(value, values, keyWithNamespace(key));
  };

  return translate;
}
