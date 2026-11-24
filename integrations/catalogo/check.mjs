import assert from "node:assert/strict";
import { chromium } from "../ui-sdk/node_modules/playwright/index.mjs";

const origin = process.argv[2] || "http://127.0.0.1:57128";
const viewer = await fetch(origin + "/visor/",{redirect:"manual"});
assert.equal(viewer.status,200,"A demonstração técnica deve abrir no endereço da apresentação.");
const browser = await chromium.launch({channel:"chrome",headless:true});
try {
  const page = await browser.newPage({viewport:{width:1132,height:740},reducedMotion:"reduce"});
  const errors = [];
  page.on("pageerror",error => errors.push(error.message));
  await page.goto(origin + "/");
  await page.getByRole("link",{name:/^Explorar/}).click();
  assert.equal(await page.getByRole("status").innerText(),"158 telas");
  await page.getByRole("button",{name:/^Acesso e onboarding/}).click();
  const search = page.getByRole("searchbox");
  await search.fill("verificacao por codigo");
  assert.equal(await page.getByRole("status").innerText(),"1 tela");
  const screen = page.getByRole("button",{name:/Verificação por código/});
  await screen.click();
  const detail = page.getByRole("dialog");
  await detail.getByRole("button",{name:"Ver versão escura"}).click();
  const demo = await detail.getByRole("link",{name:/Abrir interativa/}).getAttribute("href");
  assert.ok((await fetch(origin + demo)).ok);
  await page.keyboard.press("Escape");
  await page.getByRole("link",{name:/Visor técnico/}).click();
  await page.waitForURL(origin + "/visor/#analise");
  await page.getByRole("button",{name:/Ver regras/}).click();
  await page.getByRole("button",{name:/Devolver pedido/}).click();
  await page.waitForURL(/\/visor\/#devolucao$/);
  await page.goto(origin + "/");
  await page.getByRole("link",{name:"Criar pranchas"}).click();
  await page.getByRole("heading",{name:"O que precisa virar tela?"}).waitFor();
  assert.ok(await page.getByRole("button",{name:/Gerar pranchas/}).isVisible());
  assert.deepEqual(errors,[]);
  console.log("OK · catálogo, busca, demonstração técnica e formulário de criação");
} finally {await browser.close();}
