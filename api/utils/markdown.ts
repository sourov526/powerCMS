import { marked } from "marked";
import { normalizeSlug } from "@/lib/utils/slug";

const renderer = new marked.Renderer();
const headingIds = new Set<string>();

function normalizeTableRow(line: string) {
  const trimmed = line.trim();
  const rawCells = trimmed.split("|");
  const cells = rawCells.map((cell) => cell.trim());
  if (trimmed.startsWith("|")) cells.shift();
  if (trimmed.endsWith("|")) cells.pop();
  return cells;
}

function isAlignmentRow(line: string) {
  return /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(line);
}

function normalizeMarkdownTables(content: string) {
  const lines = content.split("\n");
  const output: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const current = lines[index];
    const next = lines[index + 1];
    if (current && current.includes("|") && next && isAlignmentRow(next)) {
      const rows: string[][] = [];
      const alignment = normalizeTableRow(next).map((cell) => {
        const trimmed = cell.replace(/\s+/g, "");
        if (trimmed.startsWith(":") && trimmed.endsWith(":")) return ":---:";
        if (trimmed.startsWith(":")) return ":---";
        if (trimmed.endsWith(":")) return "---:";
        return "---";
      });

      rows.push(normalizeTableRow(current));
      index += 2;
      while (index < lines.length && lines[index].includes("|")) {
        rows.push(normalizeTableRow(lines[index]));
        index += 1;
      }

      const columnCount = Math.max(alignment.length, ...rows.map((row) => row.length));
      const normalizedAlignment = Array.from({ length: columnCount }, (_, i) => alignment[i] ?? "---");
      const normalizeRow = (row: string[]) => {
        const padded = [...row];
        while (padded.length < columnCount) padded.push("");
        return `| ${padded.join(" | ")} |`;
      };

      output.push(normalizeRow(rows[0] ?? []));
      output.push(`| ${normalizedAlignment.join(" | ")} |`);
      rows.slice(1).forEach((row) => output.push(normalizeRow(row)));
      continue;
    }

    output.push(current);
    index += 1;
  }

  return output.join("\n");
}

function sanitizeMarkdownInput(content: string) {
  return content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function autoLinkBareUrls(content: string) {
  return content
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (/^https?:\/\/\S+$/.test(trimmed)) {
        return line.replace(trimmed, `[${trimmed}](${trimmed})`);
      }
      return line;
    })
    .join("\n");
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function isAffiliateLink(href: string | null) {
  if (!href) return false;
  try {
    const url = new URL(href);
    const params = ["ref", "aff", "affiliate", "partner", "utm_campaign"];
    if (params.some((param) => url.searchParams.has(param))) return true;
    return /affiliate|affiliates?/i.test(url.pathname);
  } catch {
    return false;
  }
}

renderer.image = ({ href, title, text }) => {
  const safeSrc = href ? escapeAttribute(href) : "";
  const safeAlt = text ? escapeAttribute(text) : "";
  const safeTitle = title ? ` title="${escapeAttribute(title)}"` : "";
  return `<img src="${safeSrc}" alt="${safeAlt}" loading="lazy" decoding="async"${safeTitle} />`;
};

renderer.link = ({ href, title, text }) => {
  const safeHref = href ? escapeAttribute(href) : "";
  const isExternal = /^https?:\/\//.test(href || "");
  const safeTitle = title ? ` title="${escapeAttribute(title)}"` : "";
  const rel = isExternal
    ? isAffiliateLink(href)
      ? ` rel="noopener noreferrer sponsored nofollow"`
      : ` rel="noopener noreferrer"`
    : "";
  const target = isExternal ? ` target="_blank"` : "";
  return `<a href="${safeHref}"${safeTitle}${target}${rel}>${text ?? ""}</a>`;
};

renderer.heading = ({ tokens, depth }) => {
  const text = tokens.map((token) => token.raw ?? "").join(" ").trim() || "section";
  const slugBase = normalizeSlug(text);
  let slug = slugBase || `section-${depth}`;
  let counter = 1;
  while (headingIds.has(slug)) {
    counter += 1;
    slug = `${slugBase}-${counter}`;
  }
  headingIds.add(slug);
  return `<h${depth} id="${slug}">${text}</h${depth}>`;
};

marked.setOptions({
  renderer,
  gfm: true,
});

export async function renderMarkdown(content: string) {
  headingIds.clear();
  const normalizedContent = normalizeMarkdownTables(content);
  const linkifiedContent = autoLinkBareUrls(normalizedContent);
  const safeContent = sanitizeMarkdownInput(linkifiedContent);
  return await marked.parse(safeContent);
}
