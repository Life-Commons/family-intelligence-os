// Use the same reviewed assets and headers on both hosts. No client data bindings.
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, extname } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const directory = join(root, "public");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
};
const assets = {};
for (const name of (await readdir(directory)).sort()) {
  if (!types[extname(name)]) throw new Error("Unexpected public file: " + name);
  const bytes = await readFile(join(directory, name));
  assets["/" + name] = [types[extname(name)], bytes.toString("base64")];
}
const config = JSON.parse(await readFile(join(root, "vercel.json"), "utf8"));
const headers = Object.fromEntries(
  config.headers[0].headers.map(({ key, value }) => [key, value]),
);
const source = `const assets = ${JSON.stringify(assets)};
const headers = ${JSON.stringify(headers)};
export default {
  fetch(request) {
    if (!['GET','HEAD'].includes(request.method)) return new Response(null,{status:405,headers:{...headers,Allow:'GET, HEAD'}});
    const path = new URL(request.url).pathname;
    const entry = assets[path==='/' ? '/index.html' : path];
    if (!entry) return new Response(null,{status:404,headers});
    const body = request.method==='HEAD' ? null : Uint8Array.from(atob(entry[1]), c=>c.charCodeAt(0));
    return new Response(body,{headers:{...headers,'Content-Type':entry[0]}});
  }
};\n`;
await mkdir(join(root, "dist"), { recursive: true });
await writeFile(join(root, "dist", "worker.mjs"), source);
