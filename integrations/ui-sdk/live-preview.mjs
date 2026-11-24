import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync, rmdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import buildViewer from "../../skills/pranchas-de-fluxo/assets/technical-drawing/scripts/build-viewer.cjs";

const here = fileURLToPath(new URL(".", import.meta.url));
const assets = path.resolve(here, "../../skills/pranchas-de-fluxo/assets");
const engine = path.join(assets, "technical-drawing");

export async function technicalPreview(configuration) {
  const drawing = path.resolve(configuration || path.join(assets, 'drawing.json'));
  const cssFile = path.join(engine, "assets/flow-atlas.css");
  const scratch = mkdtempSync(path.join(tmpdir(), "pranchas-live-"));
  const output = path.join(scratch, "index.html");
  const run = promisify(execFile);
  const hash = value => createHash("sha256").update(value).digest("hex");
  const streams = new Set();
  let lastUiInputs, lastInputs, current, building = false;

  function stamp(files) {
    return files.map(file => {
      try {
        const {size, mtimeMs} = statSync(file);
        return [file, size, mtimeMs];
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        return [file];
      }
    });
  }

  function inputs(folder, re) {
    return readdirSync(folder, {withFileTypes:true})
      .filter(entry => entry.isFile() && re.test(entry.name))
      .map(entry => path.join(folder,entry.name))
      .sort();
  }

  function buildPage() {
    buildViewer(drawing, output);
    const css = readFileSync(cssFile, "utf8");
    const marker = '<style id="preview-design"></style>';
    const html = readFileSync(output, "utf8").replace("<style>" + css + "</style>", marker);
    if (!html.includes(marker)) throw Error("Não encontrei a folha de estilos do visor.");
    const state = {structure:hash(html), style:hash(css)};
    const listener = `
      const initial = ${JSON.stringify(state)};
      let appliedStyle = initial.style;
      let requestedStyle = initial.style;
      const changes = new EventSource('./alteracoes');
      changes.onmessage = async ({data}) => {
        const next = JSON.parse(data);
        if (next.structure !== initial.structure) {
          changes.close();
          location.reload();
          return;
        }
        requestedStyle = next.style;
        if (next.style === appliedStyle) return;
        try {
          const response = await fetch('./estilo?v=' + next.style, {cache:'no-store'});
          if (!response.ok) return;
          const css = await response.text();
          if (next.style === requestedStyle && response.headers.get('X-Preview-Style') === next.style) {
            document.querySelector('#preview-design').textContent = css;
            appliedStyle = next.style;
          }
        } catch {}
      };
    `;
    return {state, css, html:html.replace(marker, '<style id="preview-design">' + css + '</style>')
      .replace("</body>", "<script>" + listener + "</script></body>")};
  }

  function send(stream) {
    if (current) stream.write("data: " + JSON.stringify(current.state) + "\n\n");
  }

  async function rebuild() {
    if (building) return;
    building = true;
    try {
      const uiFiles = inputs(here, /^(?:entry\.js|build\.mjs|package-lock\.json|.*\.jsx|.*-LICENSE\.txt)$/);
      const uiStamp = JSON.stringify(stamp(uiFiles));
      const config = JSON.parse(readFileSync(drawing,"utf8"));
      const model = path.dirname(drawing);
      const sources = [...(config.modelScripts || []), ...(config.evidence || []).map(source => source.file)]
        .map(file => path.resolve(model,file));
      const files = [drawing, ...sources, ...inputs(path.join(engine,"assets"), /./), ...inputs(path.join(engine,"scripts"), /\.cjs$/)];
      const before = JSON.stringify([uiStamp, stamp(files)]);
      if (before === lastInputs) return;
      lastInputs = before;
      if (uiStamp !== lastUiInputs) {
        await run(process.execPath, [path.join(here,"build.mjs")], {cwd:here, windowsHide:true});
        lastUiInputs = uiStamp;
      }
      const page = buildPage();
      lastInputs = JSON.stringify([uiStamp, stamp(files)]);
      if (JSON.stringify(page.state) === JSON.stringify(current?.state)) return;
      current = page;
      for (const stream of streams) send(stream);
      process.stdout.write("Prévia atualizada.\n");
    } catch (error) {
      const message = error.stderr?.trim() || error.message;
      if (message !== lastError) process.stderr.write(message + "\n");
      lastError = message;
    } finally { building = false; }
  }

  let lastError;
  function handle(route, res, head = false) {
    res.setHeader("Cache-Control","no-store");
    if (route === "/alteracoes" && !head) {
      res.writeHead(200, {"Content-Type":"text/event-stream","X-Accel-Buffering":"no"});
      streams.add(res);
      res.write("retry: 1000\n\n");
      send(res);
      res.on("close", () => streams.delete(res));
    } else if (route === "/estilo" && current) {
      res.writeHead(200, {"Content-Type":"text/css; charset=utf-8","X-Preview-Style":current.state.style}).end(head ? undefined : current.css);
    } else if (route === "/") {
      res.writeHead(current ? 200 : 503, {"Content-Type":"text/html; charset=utf-8"})
        .end(head ? undefined : current?.html || '<meta charset="utf-8"><meta http-equiv="refresh" content="2"><p>Preparando o visor técnico…</p>');
    } else res.writeHead(404).end();
  }

  setInterval(rebuild, 600).unref();
  setInterval(() => {
    for (const stream of streams) {
      if (!stream.write(": conectado\n\n")) stream.end();
      else send(stream);
    }
  }, 10000).unref();
  process.on("exit", () => {
    rmSync(output, {force:true});
    rmdirSync(scratch);
  });
  await rebuild();
  return handle;
}
