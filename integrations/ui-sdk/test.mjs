import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import buildViewer from "../../skills/pranchas-de-fluxo/assets/technical-drawing/scripts/build-viewer.cjs";
import commands from "../../skills/pranchas-de-fluxo/assets/technical-drawing/scripts/commands.cjs";

const assets = fileURLToPath(new URL("../../skills/pranchas-de-fluxo/assets/", import.meta.url));
const dir = await mkdtemp(path.join(tmpdir(), "pranchas-ui-sdk-"));
const original = path.join(assets, "drawing.json");
const html = path.join(dir, "viewer.html");
const errors = [];
let browser;

try {
  buildViewer(original, html);
  const chrome = process.env.CHROMIUM_PATH || commands.findChrome();
  const executablePath = chrome && !path.isAbsolute(chrome) ? execFileSync("which", [chrome], { encoding: "utf8" }).trim() : chrome;
  browser = await chromium.launch({ executablePath: executablePath || undefined });
  const page = await browser.newPage({ offline: true, viewport: { width: 930, height: 990 } });
  page.on("request", req => { if (/^https?:/i.test(req.url())) errors.push(req.url()); });
  page.on("pageerror", error => errors.push(error.message));
  const ready = () => page.waitForFunction(() => document.querySelector("#viewport").getAttribute("aria-busy") === "false");
  await page.goto(pathToFileURL(html).href);
  await ready();
  assert.equal(await page.locator("#drawing [data-item]").count(), 4);
  assert.equal(await page.locator("#view").evaluate(el => el.matches(":defined")), true);
  const assembled = page.getByRole("radio", { name: "Assembled" });
  const exploded = page.getByRole("radio", { name: "Exploded" });
  assert.equal(await assembled.isChecked(), true);
  await assembled.focus();
  await page.keyboard.press("ArrowLeft");
  await ready();
  assert.equal(await exploded.isChecked(), true);
  assert.equal(await exploded.evaluate(el => el === document.activeElement), true);
  assert.equal(await page.locator("#subject").inputValue(), "confirmacao");
  await page.locator("#download-toggle").click();
  const saved = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download SVG" }).click();
  const download = await saved;
  assert.match(download.suggestedFilename(), /confirmacao-exploded/);
  const svg = await readFile(await download.path(), "utf8");
  assert.equal(await page.evaluate(svg => {
    const xml = new DOMParser().parseFromString(svg, "image/svg+xml");
    return !xml.querySelector("parsererror") && xml.querySelectorAll("[data-item]").length === 4;
  }, svg), true);
  await page.keyboard.press("Escape");
  await page.locator("#screen-caption").click();
  const buttons = page.locator("ui-accordion-trigger button");
  assert.equal(await buttons.count(), 3);
  assert.equal(await buttons.first().getAttribute("aria-expanded"), "true");
  await buttons.nth(1).focus();
  await page.keyboard.press("Enter");
  assert.equal(await buttons.nth(1).getAttribute("aria-expanded"), "true");
  assert.equal(await buttons.first().getAttribute("aria-expanded"), "true");
  const item = page.locator("ui-accordion-item").nth(1);
  assert.match(await item.locator("ui-accordion-panel").innerText(), /Fonte: Resumo da reunião/);
  await item.locator("button[data-part]").first().click();
  assert.equal(await page.locator("#part-target").inputValue(), "dialog");
  await page.keyboard.press("Escape");
  await page.locator("#screen-caption").focus();
  await page.keyboard.press("ArrowRight");
  await ready();
  assert.equal(await page.locator("#subject").inputValue(), "cancelamento");
  assert.equal(await assembled.isChecked(), true);
  await page.goBack();
  await ready();
  assert.equal(await exploded.isChecked(), true);
  await page.setViewportSize({ width: 390, height: 820 });
  assert.equal(await exploded.isVisible(), true);
  await assembled.click();
  await ready();
  assert.equal(await assembled.isChecked(), true);

  await page.getByRole("button", { name:"Fluxos", exact:true }).click();
  const directory = page.getByRole("dialog", {name:"Explorar fluxos"});
  const search = directory.getByRole("searchbox");
  assert.equal(await search.evaluate(el => document.activeElement === el), true);
  await directory.locator("summary").click();
  assert.match(await directory.innerText(), /Prancha renderizada/);
  await search.fill("xyz");
  assert.equal(await directory.getByRole("status").innerText(), "Nenhuma tela encontrada.");
  await search.fill("arquivado");
  const result = directory.getByRole("link", {name:/Projeto arquivado/});
  await result.click();
  const slides = page.getByRole("dialog", {name:"Apresentação do fluxo"});
  const footer = slides.locator("footer");
  await footer.getByText("4 / 4").waitFor();
  await page.waitForFunction(() => [...document.querySelectorAll('.atlas-lightbox [aria-hidden="false"] img')].some(img => img.naturalWidth > 0));
  const source = await slides.locator('[aria-hidden="false"] img').first().getAttribute("src");
  const shape = await page.evaluate(async url => {
    const xml = new DOMParser().parseFromString(await (await fetch(url)).text(), "image/svg+xml");
    return {layers:xml.querySelectorAll("[data-item]").length, error:!!xml.querySelector("parsererror")};
  }, source);
  assert.equal(shape.error, false);
  assert.ok(shape.layers > 0);
  await slides.getByRole("button", {name:"Prancha anterior"}).click();
  await footer.getByText("3 / 4").waitFor();
  await page.keyboard.press("ArrowRight");
  await footer.getByText("4 / 4").waitFor();
  await slides.getByRole("button", {name:"Aumentar ampliação"}).click();
  await slides.locator("[data-zoom]").waitFor();
  await slides.getByRole("button", {name:"Reduzir ampliação"}).click();
  await page.keyboard.press("Escape");
  await directory.waitFor();
  assert.equal(await result.evaluate(el => document.activeElement === el), true);
  await page.keyboard.press("Escape");
  await page.getByRole("button", {name:"Ampliar prancha"}).click();
  await footer.getByText("2 / 4").waitFor();
  await page.waitForFunction(() => document.querySelector('.atlas-lightbox [aria-hidden="false"] img')?.naturalWidth > 0);
  const identical = await page.evaluate(async () => {
    const frame = document.createElement("iframe");
    frame.hidden = true;
    const url = document.querySelector('.atlas-lightbox [aria-hidden="false"] img').src;
    const xml = new DOMParser().parseFromString(await (await fetch(url)).text(), "image/svg+xml");
    document.body.append(frame);
    frame.contentDocument.body.append(frame.contentDocument.importNode(xml.documentElement, true));
    const geometry = (root, view) => Array.from(
      root.querySelectorAll("[data-item],[data-line-role],[data-fill]"), el => {
        const css = view.getComputedStyle(el);
        return [el.dataset.item, el.getAttribute("d"), el.getAttribute("transform"), css.fill, css.stroke, css.strokeWidth];
      });
    const native = document.querySelector("#drawing svg:not(#selection)");
    const preview = frame.contentDocument.querySelector("svg");
    const same = native.getAttribute("viewBox") === preview.getAttribute("viewBox") &&
      JSON.stringify(geometry(native, window)) === JSON.stringify(geometry(preview, frame.contentWindow));
    frame.remove();
    return same;
  });
  assert.ok(identical, "The lightbox must preserve the canvas geometry and dark-theme ink");
  await slides.getByRole("button", {name:"Próxima prancha"}).click();
  await footer.getByText("3 / 4").waitFor();
  await slides.getByRole("button", {name:"Inspecionar esta tela"}).click();
  await slides.waitFor({state:"hidden"});
  await ready();
  assert.equal(await page.locator("#subject").inputValue(), "cancelamento");

  await page.getByRole("button", {name:"Fluxos", exact:true}).click();
  await directory.getByRole("button", {name:"Elementos", exact:true}).click();
  await search.fill("dialogo");
  await directory.locator("[data-gallery-count]").getByText(/[1-9] elemento/).waitFor();
  const occurrence = directory.locator(".atlas-card").filter({hasText:"Confirmar arquivamento"}).first();
  await occurrence.locator("img").waitFor();
  await occurrence.click();
  await slides.getByRole("button", {name:"Inspecionar este elemento"}).waitFor();
  await page.keyboard.press("Escape");
  await directory.waitFor();
  assert.equal(await search.inputValue(), "dialogo");
  await occurrence.evaluate(el => new Promise((resolve, reject) => {
    if (document.activeElement === el) return resolve();
    const timeout = setTimeout(() => reject(Error("A ocorrência perdeu o foco ao voltar")), 1500);
    el.addEventListener("focus", () => {clearTimeout(timeout); resolve();}, {once:true});
  }));
  await occurrence.click();
  await slides.getByRole("button", {name:"Inspecionar este elemento"}).click();
  await page.locator("#parts-panel:popover-open").waitFor();
  await ready();
  assert.equal(await page.locator("#subject").inputValue(), "confirmacao");
  assert.equal(await page.locator("#part-target").inputValue(), "dialog");

  const grouped = JSON.parse(await readFile(original, "utf8"));
  grouped.dependencies = path.resolve(assets, grouped.dependencies);
  grouped.modelScripts = grouped.modelScripts.map(file => path.resolve(assets, file));
  grouped.evidence.forEach(src => { src.file = path.resolve(assets, src.file); });
  grouped.drawings.slice(2).forEach(d => { d.flow = "Revisão do projeto"; });
  await writeFile(path.join(dir, "grouped.json"), JSON.stringify(grouped));
  buildViewer(path.join(dir, "grouped.json"), path.join(dir, "grouped.html"));
  const mobile = await browser.newPage({offline:true, isMobile:true, hasTouch:true, viewport:{width:390, height:820}});
  mobile.on("pageerror", e => errors.push(e.message));
  mobile.on("request", req => { if (/^https?:/i.test(req.url())) errors.push(req.url()); });
  await mobile.goto(pathToFileURL(path.join(dir, "grouped.html")).href);
  await mobile.getByRole("button", {name:"Fluxos", exact:true}).tap();
  const index = mobile.getByRole("dialog", {name:"Explorar fluxos"});
  assert.equal(await index.getByRole("link").count(), 2);
  await index.getByRole("searchbox").fill("revisao");
  assert.equal(await index.getByRole("link").count(), 2);
  await index.getByRole("searchbox").fill("");
  await index.getByRole("link", {name:/Revisão do projeto/}).tap();
  const preview = mobile.getByRole("dialog", {name:"Apresentação do fluxo"});
  await preview.getByText("1 / 2").waitFor();
  await mobile.waitForFunction(() => document.querySelector('.atlas-lightbox [aria-hidden="false"] img')?.naturalWidth > 0);
  const cdp = await mobile.context().newCDPSession(mobile);
  await cdp.send("Input.dispatchTouchEvent", {type:"touchStart", touchPoints:[{x:310, y:360}]});
  for (const x of [280,250,215,180,145,110,75]) {
    await cdp.send("Input.dispatchTouchEvent", {type:"touchMove", touchPoints:[{x, y:360}]});
  }
  await cdp.send("Input.dispatchTouchEvent", {type:"touchEnd", touchPoints:[]});
  await preview.getByText("2 / 2").waitFor();
  await preview.getByRole("button", {name:"Fechar apresentação"}).tap();
  await index.waitFor();
  await mobile.close();

  // Exercise the upstream single-part mode, where the flow UI is absent.
  const single = { dependencies: path.join(assets, "node_modules"),
    modelScripts: [path.join(dir, "model.js")],
    drawings: [{ id: "placa", title: "Plate", description: "Single plate",
      parts: [{ id: "plate", name: "Plate" }] }] };
  await writeFile(path.join(dir, "model.js"), `self.DrawingModels = { placa: (_params, options) => {
    const p = TechnicalGeometry.part('plate', 'Plate');
    TechnicalGeometry.box(p, [-10, -5, 0], [10, 5, 1]);
    return TechnicalProjection.render([p], options);
  } };`);
  await writeFile(path.join(dir, "drawing.json"), JSON.stringify(single));
  buildViewer(path.join(dir, "drawing.json"), path.join(dir, "physical.html"));
  await page.goto(pathToFileURL(path.join(dir, "physical.html")).href);
  await ready();
  assert.equal(await page.locator("#drawing [data-item]").count(), 1);
  assert.equal(await page.locator("#view").isVisible(), false);
  assert.equal(await page.locator("#screen-nav").isVisible(), false);
  assert.deepEqual(errors, []);
  process.stdout.write("OK · renderização offline, índice, busca, regras, agrupamento, lightbox, teclado, foco, swipe, zoom e SVG.\n");
} finally {
  await browser?.close();
  await rm(dir, { recursive: true, force: true, maxRetries: 4 });
}
