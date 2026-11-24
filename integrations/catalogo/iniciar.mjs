import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..",import.meta.url));
const npm = process.env.npm_execpath;
const [source, port] = process.argv.slice(2);
const launcher = path.join(root,".pranchas-beta/cli.cjs");

function run(args) {
  const result = spawnSync(process.execPath,args,{cwd:root,stdio:"inherit",windowsHide:true});
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error("O comando encerrou com código " + result.status + ".");
}

function requireDependency(folder, marker) {
  if (!existsSync(path.join(root,folder,marker))) run([npm,"ci","--prefix",folder,"--no-audit","--no-fund"]);
}

try {
  if (!npm) throw Error("Inicie com npm run apresentar --prefix integrations/catalogo.");
  const manifest = path.join(root,"integrations/catalogo/public/catalogo/manifest.json");
  if (!source && !existsSync(manifest)) throw Error("Informe o caminho absoluto da pasta que contém o export out/ do Supernova.");
  requireDependency("integrations/catalogo","node_modules/swiper/package.json");
  requireDependency("integrations/ui-sdk","node_modules/esbuild/package.json");
  requireDependency("skills/pranchas-de-fluxo/assets","node_modules/jspdf/package.json");
  if (source) run(["integrations/catalogo/import-supernova.mjs",path.resolve(source)]);
  if (!existsSync(launcher)) {
    const config = path.join(root,"tools/pranchas-cli/package.json");
    const {version} = JSON.parse(readFileSync(config,"utf8"));
    run([npm,"run","bundle","--prefix","tools/pranchas-cli"]);
    const archive = "./tools/pranchas-cli/dist/pranchas-de-fluxo-" + version + ".tgz";
    run([npm,"exec","--yes","--",archive,"--sem-abrir"]);
  }
  run(["integrations/catalogo/dev.mjs",port || "57128"]);
} catch(error) {
  if (error.message !== "O comando encerrou com código null.") process.stderr.write(error.message + "\n");
  process.exitCode = 1;
}
