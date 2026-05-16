import { defaultLocale } from '@/utils/strings/config';

type RedirectMap = Record<string, Record<string, string>>;
type PathModule = {
  default?: { join: (...parts: string[]) => string };
  join: (...parts: string[]) => string;
};
type FsPromises = {
  readFile: (path: string, encoding: string) => Promise<string>;
  writeFile: (path: string, data: string) => Promise<void>;
};

function isNodeRuntime() {
  return process.env.NEXT_RUNTIME === "nodejs";
}

async function importNodeModule<T>(specifier: string): Promise<T> {
  if (!isNodeRuntime()) {
    throw new Error("Node-only module import blocked in edge runtime.");
  }
  const importer = new Function("s", "return import(s)") as (s: string) => Promise<T>;
  return importer(specifier);
}

async function getRedirectsPath() {
  const path = await importNodeModule<PathModule>("path");
  return (path.default ?? path).join(process.cwd(), "data", "redirects.json");
}

function safeParseRedirects(input: string): RedirectMap {
  try {
    const parsed = JSON.parse(input) as RedirectMap | Record<string, string>;
    if (!parsed || typeof parsed !== "object") return {};
    const values = Object.values(parsed);
    if (values.length > 0 && typeof values[0] === "string") {
      return { [defaultLocale]: parsed as Record<string, string> };
    }
    return parsed as RedirectMap;
  } catch {
    return {};
  }
}

export async function readRedirects(): Promise<RedirectMap> {
  if (!isNodeRuntime()) return {};
  const fs = await importNodeModule<FsPromises>("fs/promises");
  const filePath = await getRedirectsPath();
  try {
    const contents = await fs.readFile(filePath, "utf8");
    return safeParseRedirects(contents);
  } catch {
    return {};
  }
}

export async function writeRedirects(redirects: RedirectMap) {
  if (!isNodeRuntime()) return;
  const fs = await importNodeModule<FsPromises>("fs/promises");
  const filePath = await getRedirectsPath();
  await fs.writeFile(filePath, JSON.stringify(redirects, null, 2));
}

export async function addRedirect(fromSlug: string, toSlug: string, locale = defaultLocale) {
  const redirects = await readRedirects();
  redirects[locale] = redirects[locale] ?? {};
  redirects[locale][fromSlug] = toSlug;
  await writeRedirects(redirects);
}
