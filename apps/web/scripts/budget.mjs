import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const root = new URL("..", import.meta.url).pathname;
const dist = join(root, "dist");
const publicDir = join(root, "public");
const KB = 1024;
const HOME_BUDGET = 25 * KB;
const PAGE_BUDGET = 40 * KB;

function collectHtml(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collectHtml(full, out);
    else if (entry.endsWith(".html")) out.push(full);
  }
  return out;
}

const gzCache = new Map();
function gzSize(file) {
  if (!gzCache.has(file)) gzCache.set(file, gzipSync(readFileSync(file)).length);
  return gzCache.get(file);
}

function moduleDeps(file) {
  const src = readFileSync(file, "utf8");
  const refs = [];
  for (const match of src.matchAll(/from"\.\/([A-Za-z0-9_.-]+\.js)"/g)) refs.push(match[1]);
  for (const match of src.matchAll(/import\("\.\/([A-Za-z0-9_.-]+\.js)"\)/g)) refs.push(match[1]);
  return refs;
}

function pageJsGz(htmlFile) {
  const html = readFileSync(htmlFile, "utf8");
  const roots = [...html.matchAll(/_astro\/[A-Za-z0-9_.-]+\.js/g)].map((match) => match[0]);
  const seen = new Set();
  const queue = [...roots];
  let total = 0;
  while (queue.length > 0) {
    const rel = queue.pop();
    if (seen.has(rel)) continue;
    seen.add(rel);
    const file = join(dist, rel);
    if (!existsSync(file)) continue;
    total += gzSize(file);
    queue.push(...moduleDeps(file).map((dep) => `_astro/${dep}`));
  }
  return total;
}

const htmlFiles = collectHtml(dist);
let failed = false;
let worst = 0;

for (const htmlFile of htmlFiles) {
  const rel = htmlFile.slice(dist.length + 1);
  const isHome = rel === "index.html";
  const budget = isHome ? HOME_BUDGET : PAGE_BUDGET;
  const js = pageJsGz(htmlFile);
  worst = Math.max(worst, js);
  const ok = js <= budget;
  if (!ok) failed = true;
  console.log(`${ok ? "PASS" : "FAIL"}  ${rel.padEnd(34)} ${js.toFixed(0).padStart(6)} B gz  (budget ${budget}B)`);
}

function findUnreferencedAssets(dir, referenced) {
  const unreferenced = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      unreferenced.push(...findUnreferencedAssets(full, referenced));
    } else {
      const rel = full.slice(publicDir.length + 1);
      if (!referenced.has(rel) && !referenced.has(`/${rel}`)) {
        unreferenced.push(rel);
      }
    }
  }
  return unreferenced;
}

const distHtml = htmlFiles.map((file) => readFileSync(file, "utf8")).join("\n");
const referenced = new Set(distHtml.matchAll(/assets\/[A-Za-z0-9_./-]+/g).map((m) => m[0]));
const unreferenced = findUnreferencedAssets(join(publicDir, "assets"), referenced);
for (const asset of unreferenced) console.log(`WARN  unreferenced asset: ${asset}`);

if (failed) {
  console.error(`\nBudget breached (worst page ${worst} B gz).`);
  process.exit(1);
}
console.log(`\nAll pages within budget (worst ${worst} B gz).`);
