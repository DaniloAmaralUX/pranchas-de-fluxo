import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdtemp, mkdir, writeFile, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "../ui-sdk/node_modules/playwright/index.mjs";

const directory = await mkdtemp(path.join(tmpdir(),"pranchas-catalogo-ci-"));
const category = {id:"revisao",title:"Revisão",description:"Telas sintéticas de revisão."};
const screen = n => ({
  id:"revisao/tela-"+n,category:category.id,title:"Tela "+n,description:"Revisar solicitação.",
  preview:"/catalogo/escuro.svg",previewLight:"/catalogo/claro.svg",
  previewWidth:960,previewHeight:600,href:"/catalogo/supernova/c/revisao/tela-"+n+".html",status:"pronto",
});
const entries = [screen(1),screen(2),screen(3)];
const fixture = JSON.stringify({categories:[category],entries});
const image = fill => '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600"><rect width="960" height="600" fill="'+fill+'"/></svg>';
const html = '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Demonstração sintética</title><button type="button" onclick="this.textContent=\'Concluído\'">Confirmar</button></html>';

let child, browser;
try {
  const demos = path.join(directory,"supernova/c/revisao");
  await mkdir(demos,{recursive:true});
  await Promise.all([
    writeFile(path.join(directory,"manifest.json"),fixture),
    writeFile(path.join(directory,"escuro.svg"),image("#181624")),
    writeFile(path.join(directory,"claro.svg"),image("#edf1f5")),
    ...entries.map((_,i) => writeFile(path.join(demos,"tela-"+(i+1)+".html"),html)),
  ]);
  child = spawn(process.execPath,[fileURLToPath(new URL("dev.mjs",import.meta.url)),"0"],{
    env:{...process.env,PRANCHAS_CATALOGO_DIR:directory},stdio:["ignore","pipe","inherit"],windowsHide:true,
  });
  const origin = await new Promise((resolve,reject) => {
    const timeout = setTimeout(() => reject(Error("O servidor não respondeu.")),30000);
    const finish = callback => (...args) => {clearTimeout(timeout);callback(...args);};
    let log = "";
    child.stdout.on("data", chunk => {
      log += chunk;
      const ready = /Catálogo aberto em (http:\/\/127\.0\.0\.1:\d+)\//.exec(log);
      if (ready) finish(resolve)(ready[1]);
    });
    child.on("error",finish(reject));
    child.on("exit",finish(code => reject(Error("Servidor encerrou com " + code))));
  });

  browser = await chromium.launch({channel:"chrome",headless:true});
  for (const width of [1132,320]) {
    const page = await browser.newPage({viewport:{width,height:800},reducedMotion:"reduce"});
    const errors = [];
    page.on("pageerror",error => errors.push(error.message));
    page.on("response",response => {if (response.status() >= 400) errors.push(response.url());});
    page.on("request",request => {if (new URL(request.url()).origin !== origin) errors.push(request.url());});
    await page.goto(origin);
    assert.match(await page.getByRole("heading",{level:1}).innerText(),/Supernova/);
    await page.getByRole("link",{name:/^Explorar/}).click();
    await page.getByRole("status").getByText("3 telas").waitFor();
    await page.getByRole("searchbox").fill("solicitacao");
    await page.getByRole("button",{name:/Tela 1/}).click();
    const preview = page.getByRole("dialog");
    await preview.getByRole("button",{name:"Ver versão escura"}).click();
    await page.keyboard.press("ArrowRight");
    await preview.getByRole("heading",{name:"Tela 2"}).waitFor();
    await preview.getByRole("link",{name:/Abrir interativa/}).click();
    await page.getByRole("button",{name:"Confirmar"}).click();
    await page.getByRole("button",{name:"Concluído"}).waitFor();
    await page.goto(origin+"/visor/");
    await page.getByRole("button",{name:/Ver regras/}).click();
    await page.getByRole("button",{name:/Devolver pedido/}).click();
    await page.waitForURL("**/visor/#devolucao");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors,[]);
    await page.close();
  }
  console.log("OK · home, catálogo sintético, prévia e percurso no visor em desktop e celular.");
} finally {
  if (browser) await browser.close();
  if (child) child.kill();
  await rm(directory,{recursive:true,force:true,maxRetries:3});
}
