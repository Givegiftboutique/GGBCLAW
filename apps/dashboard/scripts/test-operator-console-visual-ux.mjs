import { readFile } from "node:fs/promises";

async function read(path) {
  return readFile(path, "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const app = await read("apps/dashboard/src/app.js");
const styles = await read("apps/dashboard/src/styles.css");
const i18n = await read("apps/dashboard/src/lib/i18n/zh-hant.js");
const design = await read("apps/dashboard/src/lib/operator-ux/operator-design-system.js");

for (const marker of [
  "OpenClaw Operator Console",
  "今日營運總覽",
  "Agent 狀態",
  "今日任務",
  "安全審查",
  "權限檢視",
  "用量與餘額",
  "自動刷新",
  "Production 安全鎖",
  "技術詳情（一般情況不用查看）"
]) {
  assert(app.includes(marker) || i18n.includes(marker), `Missing operator console marker: ${marker}`);
}

for (const marker of [
  "Agents / 代理程式",
  "Operator Home / Operator 首頁",
  "Daily Operator Runbook",
  "<th>Workflow</th>",
  "<th>Owner</th>",
  "<th>Reviewer</th>",
  "Allowed permissions",
  `memory-only; no ${["local", "Storage"].join("")}`
]) {
  assert(!app.includes(marker), `Old engineering UI marker must not be visible in app.js: ${marker}`);
}

for (const marker of ["reviews:approve", "gateway:write", "production:mutate"]) {
  const visibleIndex = app.indexOf(marker);
  if (visibleIndex !== -1) {
    const before = app.slice(Math.max(0, visibleIndex - 320), visibleIndex);
    assert(before.includes("renderTechnicalDetails") || before.includes("technical"), `${marker} must only appear in technical details or scan rules.`);
  }
}

for (const marker of [
  "--oc-bg-app",
  "--oc-bg-shell",
  "--oc-bg-card",
  "--oc-accent",
  "--oc-radius-xl",
  "--oc-shadow-floating",
  ".console-hero",
  ".console-card-grid",
  ".task-card",
  ".modern-provider-card"
]) {
  assert(styles.includes(marker), `Missing modern console CSS marker: ${marker}`);
}

assert(design.includes("OpenClawOperatorDesignSystem"), "Operator design system must be exposed.");
assert(design.includes("buildSafetyLocks"), "Operator design system must define safety lock cards.");
assert(app.includes("provider-balance-center.json"), "Balance center local-only next step must be visible.");
assert(app.includes("只重新讀取本地報告與任務"), "Hourly refresh must state local-only behavior.");

const unsafe = app + styles + i18n + design;
for (const marker of [
  "productionReady: true",
  "adapterEnabled: true",
  "connected: true",
  "endpointConfigured: true",
  "authEnabled: true",
  "dataReturned: true",
  "credentials: \"include\"",
  "Authorization:"
]) {
  assert(!unsafe.includes(marker), `Unsafe production/auth marker found: ${marker}`);
}

console.log("OpenClaw operator console visual UX tests passed.");
