#!/usr/bin/env node
/**
 * Toggle Next.js route segment runtime between "nodejs" and "edge".
 *
 * Why this exists:
 * - Local dev works best with Node.js runtime.
 *
 * Usage:
 *   node scripts/set-runtime.mjs nodejs
 *   node scripts/set-runtime.mjs edge
 */
import fs from "node:fs";
import path from "node:path";

const mode = process.argv[2];
if (mode !== "nodejs" && mode !== "edge") {
  console.error('Usage: node scripts/set-runtime.mjs <nodejs|edge>');
  process.exit(1);
}

const repoRoot = path.resolve(process.cwd());
const targetFiles = [
  // Frontend (Next app mounted at :3000)
  "frontend/app/layout.tsx",
  "frontend/app/page.tsx",
  "frontend/app/not-found.tsx",
  "frontend/app/robots.ts",
  "frontend/app/[slug]/page.tsx",
  "frontend/app/api/[...path]/route.ts",

  // Admin routes (served under /admin)
  "frontend/app/admin/layout.tsx",
  "frontend/app/admin/rss.xml/route.ts",
  "frontend/app/admin/[indexnowKey].txt/route.ts",
  "frontend/app/admin/sitemap.ts",
  "frontend/app/admin/sitemap-images.xml/route.ts",
];

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function upsertRuntimeExport(content) {
  const runtimeLine = `export const runtime = "${mode}";`;
  const runtimeExportRe = /export const runtime\s*=\s*["'](edge|nodejs)["'];?/;

  // Replace any existing runtime export.
  const replaced = content.replace(
    /export const runtime\s*=\s*["'](edge|nodejs)["'];?/g,
    runtimeLine,
  );
  if (runtimeExportRe.test(content)) {
    return dedupeRuntimeExports(replaced);
  }

  // Insert a runtime export near the top.
  const lines = content.split("\n");
  if (lines[0]?.trim() === '"use client";' || lines[0]?.trim() === "'use client';") {
    // Route segment runtime config must live in a server file.
    // If this file is a client component, do not inject runtime here.
    return content;
  }

  // Put it at the very top (before imports) with a blank line after.
  return dedupeRuntimeExports(`${runtimeLine}\n\n${content}`);
}

function dedupeRuntimeExports(content) {
  const lines = content.split("\n");
  const out = [];
  let seen = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^export const runtime\s*=/.test(line.trim())) {
      if (seen) continue;
      seen = true;
      out.push(line.trimEnd());
      continue;
    }
    out.push(line);
  }

  // Remove extra blank lines right after the runtime line
  if (out.length >= 3 && /^export const runtime\s*=/.test(out[0].trim())) {
    while (out[1] === "" && out[2] === "") out.splice(1, 1);
  }

  return out.join("\n");
}

let changedCount = 0;
for (const relPath of targetFiles) {
  const absPath = path.join(repoRoot, relPath);
  if (!fs.existsSync(absPath)) continue;
  const before = readFile(absPath);
  const after = upsertRuntimeExport(before);
  if (after !== before) {
    writeFile(absPath, after);
    changedCount += 1;
  }
}

console.log(`Runtime set to "${mode}" for ${changedCount} file(s).`);
