export const locales = ["en"] as const;
export type AppLocale = string;

export const defaultLocale: AppLocale = "en";

export function resolveLocale(_input?: string | null): AppLocale {
  return "en";
}
