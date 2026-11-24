import {execFile} from "node:child_process";
import {existsSync} from "node:fs";
import path from "node:path";
import {promisify} from "node:util";

const run = promisify(execFile);
const media = "text/html; charset=utf-8";
const setup = "<!doctype html><html lang=\"pt-BR\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Criar pranchas</title><link rel=\"stylesheet\" href=\"/catalogo/design.css\"><main class=\"collection\"><h1>Criar pranchas</h1><p>Instale o pacote Pranchas neste projeto para abrir o formulário. A demonstração de aprovação está disponível.</p><p style=\"margin-top:20px\"><a class=\"action\" href=\"/visor/\">Ver demonstração →</a> <a href=\"/\">Voltar ao catálogo</a></p></main></html>";

export function presentation(workspace) {
  let pending, session;
  const launcher = path.join(workspace,".pranchas-beta/cli.cjs");
  const sendHtml = (response,status,body,head) => {
    response.writeHead(status,{"Content-Type":media,"Cache-Control":"no-store"}).end(head ? undefined : body);
  };

  async function findSession() {
    if (session) {
      const state = await fetch(new URL("estado",session),{signal:AbortSignal.timeout(1000)})
        .then(response => response.ok ? response.json() : null).catch(() => null);
      if (state && ["entrada","carregando","erro"].includes(state.tipo)) return session;
    }
    const {stdout} = await run(process.execPath,[launcher,"--sessao-web"],{cwd:workspace,windowsHide:true,timeout:18000});
    session = /^Visor local: (http:\/\/127\.0\.0\.1:\d{1,5}\/[a-f0-9]{48}\/)$/m.exec(stdout.replaceAll("\r",""))?.[1];
    if (!session) throw Error("O instalador não retornou um endereço de sessão.");
    return session;
  }

  async function create(response) {
    if (!existsSync(launcher)) return sendHtml(response,503,setup);
    pending ??= findSession().finally(() => {pending = null;});
    try { response.writeHead(302,{Location:await pending,"Cache-Control":"no-store"}).end(); }
    catch (error) {
      process.stderr.write(error.message + "\n");
      sendHtml(response,503,setup);
    }
  }
  return create;
}
