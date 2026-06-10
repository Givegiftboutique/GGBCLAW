import { createHash } from "node:crypto";
import { relative, resolve } from "node:path";

const SECRET_RE = /(api[_ -]?key|token|secret|password|cookie|authorization|bearer|private[_ -]?key)\s*[:=]\s*[^,\s]+/gi;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const WINDOWS_PATH_RE = /[A-Za-z]:\\Users\\[^"'\n\r\t ]+/g;
const POSIX_HOME_RE = /\/home\/[^"'\n\r\t ]+/g;
const PRODUCTION_URL_RE = /https?:\/\/(?:[^"'\s]*(?:prod|production|live|real|api\.openclaw|production\.example\.com)[^"'\s]*)/gi;

export function stableHash(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 16);
}

export function toDisplayPath(filePath, repoRoot) {
  const absolute = resolve(filePath);
  const root = resolve(repoRoot);
  const rel = relative(root, absolute).replaceAll("\\", "/");
  if (!rel.startsWith("..") && !/^[A-Za-z]:/.test(rel)) {
    return rel;
  }
  return `[REDACTED_PATH]/${stableHash(absolute)}`;
}

export function sanitizeText(value) {
  return String(value)
    .replace(WINDOWS_PATH_RE, "[REDACTED_PATH]")
    .replace(POSIX_HOME_RE, "[REDACTED_PATH]")
    .replace(PRODUCTION_URL_RE, "[REDACTED_PRODUCTION_URL]")
    .replace(SECRET_RE, "[REDACTED_SECRET]")
    .replace(EMAIL_RE, "[REDACTED_EMAIL]");
}

export function sanitizeValue(value) {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [sanitizeText(key), sanitizeValue(item)]));
  }
  if (typeof value === "string") return sanitizeText(value);
  return value;
}

export function containsUnsafeValue(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return /[A-Za-z]:\\Users\\|\/home\/|https?:\/\/(?:[^"'\s]*(?:prod|production|live|real|api\.openclaw)[^"'\s]*)|api[_ -]?key\s*[:=]|token\s*[:=]|secret\s*[:=]|password\s*[:=]|cookie\s*[:=]|Authorization\s*:/i.test(text);
}

export function assertNoUnsafeValues(value, label = "payload") {
  const sanitized = sanitizeValue(value);
  if (containsUnsafeValue(sanitized)) {
    throw new Error(`${label} still contains unsafe values after sanitization.`);
  }
  return sanitized;
}
