import fs from "node:fs/promises";
import path from "node:path";
import CleanCSS from "clean-css";
import { minify as minifyJs } from "terser";
import JavaScriptObfuscator from "javascript-obfuscator";
import { minify as minifyHtml } from "html-minifier-terser";

const DIST = "dist";
const SRC = ".";

async function stat(file) {
  return (await fs.stat(file)).size;
}

await fs.rm(DIST, { recursive: true, force: true });
await fs.mkdir(path.join(DIST, "assets/css"), { recursive: true });
await fs.mkdir(path.join(DIST, "assets/js"), { recursive: true });

const css = await fs.readFile("assets/css/style.css", "utf8");
const cssOut = new CleanCSS({ level: 2, rebase: false }).minify(css);
if (cssOut.errors.length) throw new Error(cssOut.errors.join("\n"));
await fs.writeFile(path.join(DIST, "assets/css/style.css"), cssOut.styles);

const lock = process.env.NOLOCK === "1" ? undefined : [ "realraufixbaba.github.io" ];
const jsFiles = [ "main.js", "tools.js", "chat.js", "config.js" ];
for (const file of jsFiles) {
  const source = await fs.readFile(path.join("assets/js", file), "utf8");
  const min = await minifyJs(source, {
    compress: { passes: 2, drop_console: false },
    mangle: true,
    format: { comments: false }
  });
  if (!min.code) throw new Error("Terser JS uretemedi: " + file);
  const options = {
    compact: true,
    target: "browser",
    identifierNamesGenerator: "hexadecimal",
    renameGlobals: false,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.35,
    deadCodeInjection: false,
    debugProtection: true,
    debugProtectionInterval: 2000,
    selfDefending: false,
    disableConsoleOutput: false,
    simplify: true,
    numbersToExpressions: true,
    splitStrings: true,
    splitStringsChunkLength: 7,
    stringArray: true,
    stringArrayThreshold: 0.85,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayEncoding: [ "base64" ],
    stringArrayCallsTransform: true,
    stringArrayCallsTransformThreshold: 0.5,
    transformObjectKeys: false,
    unicodeEscapeSequence: false,
    log: false
  };
  if (lock) options.domainLock = lock;
  const code = JavaScriptObfuscator.obfuscate(min.code, options).getObfuscatedCode();
  await fs.writeFile(path.join(DIST, "assets/js", file), code);
}

const htmlOptions = {
  collapseWhitespace: true,
  conservativeCollapse: false,
  removeComments: true,
  removeRedundantAttributes: true,
  useShortDoctype: true,
  removeEmptyAttributes: false,
  keepClosingSlash: true,
  caseSensitive: true,
  minifyCSS: false,
  minifyJS: false
};
for (const page of ["index.html", "404.html"]) {
  const html = await fs.readFile(page, "utf8");
  await fs.writeFile(path.join(DIST, page), await minifyHtml(html, htmlOptions));
}

for (const extra of ["robots.txt", "sitemap.xml"]) {
  await fs.copyFile(extra, path.join(DIST, extra));
}

await fs.cp("assets/img", path.join(DIST, "assets/img"), { recursive: true });
await fs.cp("assets/audio", path.join(DIST, "assets/audio"), { recursive: true });
await fs.writeFile(path.join(DIST, ".nojekyll"), "");

const files = [];
async function walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else files.push([path.relative(DIST, full), await stat(full)]);
  }
}
await walk(DIST);
const total = files.reduce((sum, [, size]) => sum + size, 0);
for (const [file, size] of files.sort((a, b) => b[1] - a[1])) {
  if (size > 15000) console.log(String(Math.round(size / 1024)).padStart(5) + " KB  " + file);
}
console.log("toplam: " + (total / 1024 / 1024).toFixed(2) + " MB, " + files.length + " dosya");
