import { type AppLocale, defaultLocale } from "@/utils/strings/config";

function makeTranslator(namespace?: string) {
  const prefix = namespace ? `${namespace}.` : "";
  const t = ((key: string, values?: Record<string, string | number | boolean | null | undefined>) => {
    let text = `${prefix}${key}`;
    text = text
      .split(".")
      .pop()
      ?.replace(/([A-Z])/g, " $1")
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim() || text;
    text = text.charAt(0).toUpperCase() + text.slice(1);
    if (values) {
      for (const [k, v] of Object.entries(values)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v ?? ""));
      }
    }
    return text;
  }) as ((key: string, values?: Record<string, string | number | boolean | null | undefined>) => string) & {
    raw: (key: string) => unknown;
    rich: (key: string) => string;
  };

  t.raw = (key: string) => {
    if (key.toLowerCase().includes("steps")) return [];
    return {};
  };
  t.rich = (key: string) => t(key);
  return t;
}

export async function resolveRequestLocale(): Promise<AppLocale> {
  return defaultLocale;
}

export async function getRequestLocale(): Promise<AppLocale> {
  return defaultLocale;
}

export async function getLocale() {
  return defaultLocale;
}

export async function getTranslations(input?: { locale?: string; namespace?: string }) {
  void input;
  return makeTranslator(input?.namespace);
}

export async function getMessages(_input?: { locale?: string }) {
  return {};
}

export function setRequestLocale(_locale: string) {}

export async function getScopedTranslations(namespace: string) {
  return makeTranslator(namespace);
}
