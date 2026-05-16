"use client";

import type { ReactNode } from "react";

type Primitive = string | number | boolean | null | undefined;

function prettyKey(input: string) {
  const leaf = input.split(".").pop() || input;
  const text = leaf
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : input;
}

export function useLocale() {
  return "en";
}

export function useCurrentLocale() {
  return "en";
}

export function useTranslations(namespace?: string) {
  const prefix = namespace ? `${namespace}.` : "";

  const t = ((key: string, values?: Record<string, Primitive>) => {
    let text = prettyKey(`${prefix}${key}`);
    if (values) {
      for (const [k, v] of Object.entries(values)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v ?? ""));
      }
    }
    return text;
  }) as ((key: string, values?: Record<string, Primitive>) => string) & {
    raw: (key: string) => unknown;
    rich: (key: string) => string;
  };

  t.raw = (key: string) => {
    if (key.toLowerCase().includes("steps")) return [];
    if (key.toLowerCase().includes("options")) return [];
    return {};
  };

  t.rich = (key: string) => t(key);

  return t;
}

export function NextIntlClientProvider({
  children,
}: {
  children: ReactNode;
  locale?: string;
  messages?: unknown;
}) {
  return children;
}
