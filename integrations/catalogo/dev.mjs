import {build} from "esbuild";
import {createReadStream, readFileSync, statSync} from "node:fs";
import {createServer} from "node:http";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {presentation} from "./apresentacao.mjs";
import {technicalPreview} from "../ui-sdk/live-preview.mjs";

const folder = fileURLToPath(new URL(".", import.meta.url));
const files = path.resolve(process.env.PRANCHAS_CATALOGO_DIR || path.join(folder, "public/catalogo"));
const snapshot = path.join(files, "supernova");
const typeface = path.resolve(folder, "../../skills/pranchas-de-fluxo/assets/node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2");
let port = Number(process.argv[2] || 57128);
const workspace = path.resolve(folder, "../..");
const create = presentation(workspace);
const viewer = await technicalPreview(path.join(folder,"demo/drawing.json"));
const watcher = new Set();
const paths = ["index.html","design.css","catalogo.js"].map(file => path.join(folder,file));
paths.push(path.join(files,"manifest.json"));
const types = {".avif":"image/avif",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp",".svg":"image/svg+xml",
  ".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".woff2":"font/woff2",
  ".html":"text/html; charset=utf-8",".json":"application/json; charset=utf-8",".txt":"text/plain; charset=utf-8",".ico":"image/x-icon"};
let marks, bundle, rebuilding = false, revision = 0;

async function rebuild() {
  if (rebuilding) return;
  const next = paths.map(file => {
    try {return statSync(file).mtimeMs;} catch {return 0;}
  });
  if (marks?.every((mark,i) => next[i] === mark)) return;
  rebuilding = true;
  try {
    if (!bundle || marks[2] !== next[2]) {
      const result = await build({absWorkingDir:folder,entryPoints:["catalogo.js"],outdir:folder,
        entryNames:"bundle",bundle:true,write:false,format:"esm",minify:true,target:"es2022",
        legalComments:"inline"});
      bundle = new Map(result.outputFiles.map(file => [path.basename(file.path),file.contents]));
    }
    revision++;
    if (marks) {
      const styleOnly = marks.every((mark,i) => i === 1 || mark === next[i]);
      for (const stream of watcher) stream.write("data: " + JSON.stringify({revision,styleOnly}) + "\n\n");
    }
    marks = next;
  } catch(error) {process.stderr.write(error.message + "\n");}
  finally {rebuilding = false;}
}

function home() {
  const client = "let current=" + revision + ";const stream=new EventSource('/catalogo/alteracoes');stream.onmessage=({data})=>{const e=JSON.parse(data);if(e.revision===current)return;current=e.revision;if(e.styleOnly){document.querySelector('link[href^=\"/catalogo/design.css\"]').href='/catalogo/design.css?v='+current;}else{stream.close();location.reload();}};";
  return readFileSync(paths[0],"utf8").replace("</body>","<script>"+client+"</script></body>");
}

function staticFile(response, base, request, head) {
  const full = path.resolve(base, "." + (request.startsWith("/") ? request : "/" + request));
  const relative = path.relative(base,full);
  if (relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative)) return false;
  const exportData = full.replace(/[/\\]__next\.c\.([\w.-]+)\.txt$/, (_,slug) => path.sep + "__next.c" + path.sep + slug.replaceAll(".",path.sep) + ".txt");
  for (const candidate of [...new Set([full, full.replace(/[\\/]$/, "") + ".html", path.join(full,"index.html"), exportData])]) {
    let stat;
    try {stat = statSync(candidate);} catch {continue;}
    if (!stat.isFile()) continue;
    const ext = path.extname(candidate);
    const immutable = /-[a-f0-9]{8,}\.avif$/.test(candidate) || request.startsWith("/_next/static/");
    response.writeHead(200,{"Content-Type":types[ext] || "application/octet-stream","Content-Length":stat.size,
      "Cache-Control":immutable ? "public, max-age=31536000, immutable" : "no-cache"});
    if (head) response.end();
    else createReadStream(candidate).pipe(response);
    return true;
  }
  return false;
}

await rebuild();
if (!bundle) throw Error("O catálogo precisa das dependências instaladas com npm ci.");
const server = createServer((request,response) => {
  const head = request.method === "HEAD";
  let url;
  try {url = decodeURIComponent(new URL(request.url,"http://127.0.0.1").pathname);} catch {response.writeHead(400).end();return;}
  if (request.headers.host !== "127.0.0.1:" + port && request.headers.host !== "localhost:" + port) {response.writeHead(404).end();return;}
  if (!head && request.method !== "GET") {response.writeHead(405).end();return;}
  if (url === "/" || url === "/explorar" || url === "/explorar/") {
    response.writeHead(200,{"Content-Type":types[".html"],"Cache-Control":"no-store"}).end(head ? undefined : home());
  } else if (url === "/index.txt" || /^\/__next\.[\w.]+\.txt$/.test(url)) {
    // The imported Next.js demos request an RSC payload when they return to the index.
    // An HTML response triggers a full navigation to this project's home.
    response.writeHead(200,{"Content-Type":types[".html"],"Cache-Control":"no-store"}).end(head ? undefined : home());
  } else if (url === "/visor") {
    response.writeHead(302,{Location:"/visor/"}).end();
  } else if (url.startsWith("/visor/")) {
    viewer(url.slice("/visor".length),response,head);
  } else if (url === "/criar/" || url === "/criar") {
    if (head) response.writeHead(200).end();
    else void create(response);
  } else if (url === "/catalogo/alteracoes" && !head) {
    response.writeHead(200,{"Content-Type":"text/event-stream","Cache-Control":"no-store","X-Accel-Buffering":"no"});
    response.write("retry: 1000\n");
    response.write("data: " + JSON.stringify({revision}) + "\n\n");
    watcher.add(response);response.on("close",() => watcher.delete(response));
  } else if (url === "/catalogo/design.css") {
    response.writeHead(200,{"Content-Type":types[".css"],"Cache-Control":"no-store"}).end(head ? undefined : readFileSync(paths[1]));
  } else if (url === "/catalogo/inter.woff2" && staticFile(response,path.dirname(typeface),path.basename(typeface),head)) {
    return;
  } else if (/^\/catalogo\/bundle\.(js|css)$/.test(url)) {
    response.writeHead(200,{"Content-Type":types[path.extname(url)],"Cache-Control":"no-store"})
      .end(head ? undefined : bundle.get(path.basename(url)));
  } else if (url.startsWith("/catalogo/") && staticFile(response,files,url.slice("/catalogo".length),head)) {
    return;
  } else if (/^\/(?:_next|c|r|thumbs|devl)(\/|$)/.test(url) && staticFile(response,snapshot,url,head)) {
    return;
  } else response.writeHead(404).end("Arquivo não encontrado.");
});
server.listen(port,"127.0.0.1",() => {
  port = server.address().port;
  process.stdout.write("Catálogo aberto em http://127.0.0.1:" + port + "/\n");
});
setInterval(rebuild,600).unref();
setInterval(() => {
  for (const stream of watcher) if (!stream.write(": ligado\n\n")) stream.end();
},12000).unref();
