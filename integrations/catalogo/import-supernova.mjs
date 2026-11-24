import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {randomUUID} from "node:crypto";

const source = process.argv[2];
if (!source) throw Error("Uso: node import-supernova.mjs <pasta-do-supernova-catalogo>");
const root = await fs.realpath(source);
const base = path.join(root, "out");
const target = fileURLToPath(new URL("./public/catalogo/", import.meta.url));
const namespace = "/catalogo/supernova";
const destination = path.join(target, "supernova");
const stage = path.join(target, ".import-" + randomUUID());
const backup = path.join(target, ".previous-" + randomUUID());
const manifestPath = path.join(target, "manifest.json");
const nextManifest = path.join(target, ".manifest-" + randomUUID());
const lockfile = path.join(target, ".import-lock");
const allowed = new Map([
  ["_next", new Set([".js",".css",".woff",".woff2"])],
  ["c", new Set([".html",".txt"])],
  ["r", new Set([".json"])],
  ["devl", new Set([".png",".webp",".avif",".jpg",".jpeg",".svg"])],
  ["thumbs", new Set([".webp",".avif",".jpg",".jpeg",".png"])],
]);
const chars = /^[a-z0-9-]+$/;
const json = async name => JSON.parse(await fs.readFile(name, "utf8"));
async function exists(file) {
  try { return (await fs.stat(file)).isFile(); }
  catch (e) { if (e.code === "ENOENT") return false; throw e; }
}

async function copyPublicFolder(name) {
  const from = path.join(base, name);
  const extensions = allowed.get(name);
  await fs.cp(from, path.join(stage, name), {
    recursive:true,
    filter:async file => {
      const stat = await fs.lstat(file);
      if (stat.isSymbolicLink()) throw Error("Link simbólico inesperado no export: " + path.relative(base,file));
      if (path.basename(file).startsWith(".")) return false;
      return stat.isDirectory() || (stat.isFile() && extensions.has(path.extname(file).toLowerCase()));
    }
  });
}
async function previewAsset(file) {
  if (!file) return null;
  if (!/^\/thumbs\/[a-zA-Z0-9_-]+\.(avif|webp|jpe?g|png)$/.test(file) || !await exists(path.join(stage,file.slice(1)))) {
    throw Error("Arquivo de prévia ausente ou inválido em " + file);
  }
  return namespace + file;
}

await fs.mkdir(target, {recursive:true});
const lock = await fs.open(lockfile, "wx");
let previous = false;
let switched = false;
let committed = false;
try {
  await fs.mkdir(stage);
  // Only the public static export, its attribution and the structured inventory are eligible.
  const copies = await Promise.allSettled([...allowed].map(([name]) => copyPublicFolder(name)));
  const failed = copies.find(result=>result.status === "rejected");
  if (failed) throw failed.reason;
  for (const name of await fs.readdir(base)) {
    if (/^(index\.(html|txt)|__next\.[\w.]+\.txt|404\.html|_not-found\.(html|txt))$/.test(name)) {
      await fs.copyFile(path.join(base,name), path.join(stage,name));
    }
  }
  await fs.copyFile(path.join(root,"NOTICE"),path.join(stage,"NOTICE.txt"));
  const {CATALOGO} = await import(pathToFileURL(path.join(root,"src/data/catalogo.ts")).href);
  const previews = await json(path.join(root,"src/data/generated/previews.json"));
  const categories = [], entries = [], ids = new Set(), images = new Set();
  for (const group of CATALOGO) {
    if (!chars.test(group.slug) || categories.some(c=>c.id===group.slug)) throw Error("Categoria inválida: " + group.slug);
    categories.push({id:group.slug,title:group.titulo,description:group.descricao});
    for (const item of group.itens) {
      const id = group.slug + "/" + item.slug;
      if (ids.has(id) || !chars.test(item.slug) || !["pronto","wip"].includes(item.maturidade)) throw Error("Item inválido: " + id);
      ids.add(id);
      const ready = item.maturidade === "pronto";
      const relative = "c/" + id + ".html";
      if (ready && !await exists(path.join(stage,relative))) throw Error("Tela pronta ausente: " + id);
      const meta = previews[group.slug + "__" + item.slug];
      const preview = await previewAsset(meta?.escuro), previewLight = await previewAsset(meta?.claro);
      for (const img of [preview,previewLight]) if (img) images.add(img);
      const registryPath = path.join(stage,"r", id + ".json");
      const registry = await exists(registryPath) ? await json(registryPath) : null;
      entries.push({id,title:item.titulo,category:group.slug,description:registry?.description || group.descricao,
        preview,previewLight,previewWidth:meta?.largura ?? null,previewHeight:meta?.altura ?? null,
        href:ready ? namespace + "/" + relative : null,status:ready ? "pronto" : "pendente"});
    }
  }
  const counts = {categories:categories.length, entries:entries.length,ready:entries.filter(e=>e.status==="pronto").length,
    pending:entries.filter(e=>e.status==="pendente").length,previews:entries.filter(e=>e.preview || e.previewLight).length,previewFiles:images.size};
  await fs.writeFile(nextManifest,JSON.stringify({categories, entries, counts},null,2)+"\n",{encoding:"utf8",flag:"wx"});
  try { await fs.rename(destination,backup); previous=true; }
  catch(e) { if(e.code !== "ENOENT") throw e; }
  await fs.rename(stage,destination);
  switched=true;
  await fs.rename(nextManifest,manifestPath);
  committed=true;
  if (previous) await fs.rm(backup,{recursive:true,force:true});
  console.log(JSON.stringify(counts));
} catch (error) {
  if (!committed) {
    if (switched) await fs.rename(destination,stage);
    if (previous) await fs.rename(backup,destination);
  }
  throw error;
} finally {
  try {
    await fs.rm(stage,{recursive:true,force:true});
    await fs.rm(nextManifest,{force:true});
  } finally {
    await lock.close();
    await fs.rm(lockfile,{force:true});
  }
}
