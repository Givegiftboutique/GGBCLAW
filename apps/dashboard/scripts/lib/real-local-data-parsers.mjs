import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { sanitizeText, sanitizeValue } from "./real-local-data-sanitizer.mjs";

export const MAX_REAL_LOCAL_FILE_BYTES = 2 * 1024 * 1024;

export async function readTextFileLimited(filePath) {
  const buffer = await readFile(filePath);
  if (buffer.byteLength > MAX_REAL_LOCAL_FILE_BYTES) {
    throw new Error(`File exceeds 2MB pilot limit: ${filePath}`);
  }
  return buffer.toString("utf8");
}

export function parseSafeCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted && char === "\"" && next === "\"") {
      cell += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (!quoted && char === ",") {
      row.push(cell);
      cell = "";
    } else if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  const headers = rows.shift()?.map((header) => sanitizeText(header.trim())) ?? [];
  return rows.map((items) => Object.fromEntries(headers.map((header, index) => [header || `column_${index + 1}`, sanitizeText(items[index] ?? "")])));
}

export function parseTaskMarkdown(text, fileId = "task-memory") {
  const clean = sanitizeText(text);
  const title = clean.split(/\r?\n/).find((line) => line.startsWith("# "))?.replace(/^#\s+/, "") || fileId;
  const statusMatch = clean.match(/status:\s*([a-z_ -]+)/i);
  return [{
    id: fileId,
    workflow: "FLOW-task-memory",
    status: (statusMatch?.[1] || "queued").trim().replaceAll(" ", "_"),
    priority: "P3",
    summary: title.slice(0, 160)
  }];
}

export async function parseLocalFile(filePath, kindHint = "local") {
  const text = await readTextFileLimited(filePath);
  const ext = extname(filePath).toLowerCase();
  if (ext === ".csv") {
    return { kind: "crawlerCsv", records: parseSafeCsv(text), warnings: [] };
  }
  if (ext === ".md") {
    return { kind: "taskMemoryMarkdown", records: parseTaskMarkdown(text, kindHint), warnings: [] };
  }
  const parsed = JSON.parse(text);
  return { kind: kindHint, records: sanitizeValue(parsed), warnings: [] };
}

export function summarizeLogLines(lines, maxLines = 20) {
  return lines.slice(-maxLines).map((line, index) => ({
    id: `real-local-log-${index + 1}`,
    timestamp: "2026-06-10T00:00:00Z",
    severity: /error|fail/i.test(line) ? "error" : "info",
    actor: "real-local-data-pilot",
    event: sanitizeText(line).slice(0, 220),
    redacted: true
  }));
}
