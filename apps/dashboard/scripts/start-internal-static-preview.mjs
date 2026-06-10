import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const dashboardRoot = resolve(here, "..");

const args = process.argv.slice(2);
const portArg = args.includes("--port") ? args[args.indexOf("--port") + 1] : "5180";
const hostArg = args.includes("--host") ? args[args.indexOf("--host") + 1] : "127.0.0.1";
const port = Number.parseInt(portArg, 10);

const allowedHosts = new Set(["127.0.0.1", "localhost"]);

if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  console.error("Invalid preview port. Use a local non-privileged port such as 5180.");
  process.exit(1);
}

if (!allowedHosts.has(hostArg)) {
  console.error("Blocked unsafe preview host. Use 127.0.0.1 for the internal static preview.");
  process.exit(1);
}

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"]
]);

function setSafetyHeaders(response) {
  response.setHeader("X-OpenClaw-Safety-Mode", "read-only");
  response.setHeader("X-OpenClaw-Production-Wiring", "disabled");
  response.setHeader("X-OpenClaw-Mutation-Enabled", "false");
  response.setHeader("X-OpenClaw-Hosting-Mode", "static-preview-only");
}

function sendJson(response, statusCode, body) {
  setSafetyHeaders(response);
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(`${JSON.stringify(body, null, 2)}\n`);
}

function resolveStaticPath(requestUrl) {
  const url = new URL(requestUrl, `http://${hostArg}:${port}`);
  const decodedPath = decodeURIComponent(url.pathname);
  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
  const target = resolve(dashboardRoot, relativePath);
  const rootWithSeparator = `${dashboardRoot}${sep}`;
  if (target !== dashboardRoot && !target.startsWith(rootWithSeparator)) {
    return null;
  }
  return target;
}

const server = createServer(async (request, response) => {
  if (!["GET", "HEAD"].includes(request.method ?? "")) {
    return sendJson(response, 405, {
      error: "unsupported method",
      safetyMode: "read-only",
      mutationEnabled: false,
      productionWiring: "disabled",
      hostingMode: "static-preview-only"
    });
  }

  const target = resolveStaticPath(request.url ?? "/");
  if (!target) {
    return sendJson(response, 403, {
      error: "path traversal blocked",
      safetyMode: "read-only",
      mutationEnabled: false,
      productionWiring: "disabled"
    });
  }

  try {
    const fileStat = await stat(target);
    if (!fileStat.isFile()) {
      return sendJson(response, 404, {
        error: "static file not found",
        safetyMode: "read-only",
        mutationEnabled: false,
        productionWiring: "disabled"
      });
    }
    setSafetyHeaders(response);
    response.writeHead(200, {
      "content-type": contentTypes.get(extname(target).toLowerCase()) ?? "application/octet-stream",
      "cache-control": "no-store"
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    createReadStream(target).pipe(response);
  } catch {
    sendJson(response, 404, {
      error: "static file not found",
      safetyMode: "read-only",
      mutationEnabled: false,
      productionWiring: "disabled"
    });
  }
});

server.listen(port, hostArg, () => {
  console.log(`OpenClaw internal static preview listening on http://${hostArg}:${port}`);
});
