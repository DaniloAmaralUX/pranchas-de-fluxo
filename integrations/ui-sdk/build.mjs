import { build } from "esbuild";
import { copyFile, readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const cwd = fileURLToPath(new URL(".", import.meta.url));
const assets = new URL("../../skills/pranchas-de-fluxo/assets/technical-drawing/assets/", import.meta.url);

const bundle = await build({
  absWorkingDir: cwd,
  entryPoints: ["entry.js"],
  outfile: fileURLToPath(new URL("ui-sdk.js", assets)),
  bundle: true,
  metafile: true,
  minify: true,
  charset: "utf8",
  legalComments: "inline",
  format: "iife",
  platform: "browser",
  target: "es2022",
  define: { "process.env.NODE_ENV": '"production"' },
});

await copyFile(new URL("node_modules/@ui-sdk/web/LICENSE", import.meta.url), new URL("UI-SDK-LICENSE.txt", assets));

const credits = ["Line Nav · Chánh Đại · https://chanhdai.com/components/line-nav",
  await readFile(new URL("LINE-NAV-LICENSE.txt", import.meta.url), "utf8")];
const packages = new Set(Object.keys(bundle.metafile.inputs)
  .map(file => file.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/)?.[1]).filter(Boolean));
for (const name of [...packages].sort()) {
  const folder = new URL("node_modules/" + name + "/", import.meta.url);
  const licenses = (await readdir(folder)).filter(file => /^(?:licen[cs]e|third-party-notices|copyrightnotice)(?:\.|$)/i.test(file)).sort();
  if (!licenses.length) throw Error("Missing third-party license for " + name);
  const {version} = JSON.parse(await readFile(new URL("package.json", folder), "utf8"));
  for (const license of licenses) credits.push(name + "@" + version + " · " + license, await readFile(new URL(license, folder), "utf8"));
}
await writeFile(new URL("FLOW-ATLAS-LICENSES.txt", assets), credits.join("\n\n"));
