const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {spawn} = require('node:child_process');
const {randomBytes, randomUUID, createHash} = require('node:crypto');

const stages = ['descobrir','definir','desenvolver','entregar'];
const read = file => JSON.parse(fs.readFileSync(file,'utf8'));
function save(file, data) {
  const stage = file + '.' + randomUUID();
  try {
    fs.writeFileSync(stage,JSON.stringify(data),{flag:'wx',mode:0o600});
    fs.renameSync(stage,file);
  } finally { fs.rmSync(stage,{force:true}); }
}
function conectar(pasta) {
  pasta = fs.realpathSync(pasta);
  const {url} = read(path.join(pasta,'sessao.json'));
  const state = path.join(pasta,'estado.json');
  return {url, atualizar(etapa) {
    if (!stages.includes(etapa)) throw Error('Etapa desconhecida.');
    save(state,{tipo:'carregando',etapa});
  }, concluir(html) {
    const file = fs.realpathSync(html);
    const lock = read(path.resolve(path.dirname(file),'../contrato.lock.json'));
    if (lock.html !== createHash('sha256').update(fs.readFileSync(file)).digest('hex')) throw Error('HTML sem contrato válido.');
    save(state,{tipo:'pronto',file,hash:lock.html});
  }, falhar(message) {
    save(state,{tipo:'erro',mensagem:String(message).slice(0,1600)});
  }};
}
function open(url) {
  const command = process.platform === 'win32' ? ['rundll32.exe','url.dll,FileProtocolHandler'] : [process.platform === 'darwin' ? 'open' : 'xdg-open'];
  const child = spawn(command[0],[...command.slice(1),url],{detached:true,windowsHide:true,stdio:'ignore'});
  child.on('error',() => process.stderr.write('Abra o endereço do visor que aparece no terminal.\n'));
  child.unref();
}
async function iniciar({pasta,abrir=false,entrada=false}) {
  pasta = path.resolve(pasta);
  fs.mkdirSync(pasta,{recursive:true,mode:0o700});
  // Exclusive marker prevents two servers from owning one session.
  fs.writeFileSync(path.join(pasta,'inicio'),'',{flag:'wx',mode:0o600});
  const child = spawn(process.execPath,[__filename,'--servir',pasta,entrada?'entrada':'trabalho'],{detached:true,windowsHide:true,stdio:['ignore','ignore','ignore','ipc']});
  const url = await new Promise((resolve,reject)=>{
    const timer = setTimeout(()=>{ child.kill(); reject(Error('Tempo esgotado abrindo o visor.')); },15000);
    child.once('error',err=>{clearTimeout(timer);reject(err);});
    child.once('exit',code=>{clearTimeout(timer);reject(Error('O servidor local encerrou: '+code));});
    child.once('message',msg=>{clearTimeout(timer); resolve(msg.url);});
  });
  child.disconnect();
  child.unref();
  if (abrir) open(url);
  return conectar(pasta);
}
async function receive(req, pasta) {
  const max = 256*1024*1024;
  if (+req.headers['content-length'] > max) throw Error('Selecione até 256 MB por envio.');
  const chunks = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > max) throw Error('Selecione até 256 MB por envio.');
    chunks.push(chunk);
  }
  const data = await new Response(Buffer.concat(chunks),{headers:{'Content-Type':req.headers['content-type'] || ''}}).formData();
  const files = data.getAll('arquivos').filter(f => typeof f !== 'string' && f.name && f.size);
  const text = data.get('ideia');
  if ((!text || !String(text).trim()) && !files.length) throw Error('Escreva uma ideia ou selecione um arquivo.');
  const dir = fs.mkdtempSync(path.join(pasta,'entrada-'));
  const inputs = [];
  for (const [i,file] of files.entries()) {
    const name = path.basename(file.name.replaceAll('\\','/')).replace(/[^\p{L}\p{N} ._-]/gu,'_').slice(-120);
    const dest = path.join(dir,String(i+1)+'-'+name);
    fs.writeFileSync(dest,Buffer.from(await file.arrayBuffer()),{flag:'wx',mode:0o600});
    inputs.push(dest);
  }
  if (typeof text === 'string' && text.trim()) {
    const dest = path.join(dir,'ideia.md');
    fs.writeFileSync(dest,text,{flag:'wx',mode:0o600});
    inputs.push(dest);
  }
  return inputs;
}

async function serve(pasta,entrada) {
  const key = randomBytes(24).toString('hex');
  const base = '/'+key+'/';
  const state = path.join(pasta,'estado.json');
  save(state,entrada?{tipo:'entrada'}:{tipo:'carregando',etapa:stages[0]});
  let origin, busy=false, last=Date.now();
  const server = http.createServer(async(req,res)=>{
    function reply(code,content,type='text/plain; charset=utf-8') {
      res.writeHead(code,{'Content-Type':type,'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'});
      res.end(content);
    }
    if ('http://'+req.headers.host !== origin || !req.url.startsWith(base)) return reply(404,'');
    last=Date.now();
    try {
      const route = req.url.slice(base.length);
      const current = read(state);
      if (req.method==='GET') {
        if (!route) return reply(200,fs.readFileSync(path.join(__dirname,'../assets/sessao.html')),'text/html; charset=utf-8');
        if (route==='estado') {
          const {tipo,etapa,mensagem}=current;
          return reply(200,JSON.stringify({tipo,etapa,mensagem}),'application/json');
        }
        if (route==='prancha' && current.tipo==='pronto') {
          const html = fs.readFileSync(current.file);
          if (createHash('sha256').update(html).digest('hex') !== current.hash) throw Error('A prancha mudou desde a validação.');
          return reply(200,html,'text/html; charset=utf-8');
        }
      }
      if (route==='gerar' && req.method==='POST') {
        if (req.headers.origin!==origin) return reply(403,'Origem inválida.');
        if (busy || !['entrada','erro'].includes(current.tipo)) return reply(409,'Já existe uma geração nesta sessão.');
        busy=true;
        try {
          const cli = path.resolve('.pranchas-beta/cli.cjs');
          if (!fs.existsSync(cli)) throw Error('Abra a sessão a partir do projeto com a skill instalada.');
          const inputs = await receive(req,pasta);
          const viewer = conectar(pasta);
          viewer.atualizar(stages[0]);
          const log = fs.openSync(path.join(pasta,'geracao.log'),'a',0o600);
          let child;
          try {
            child = spawn(process.execPath,[cli,'--gerar','--sessao',pasta,'--',...inputs],{windowsHide:true,stdio:['ignore',log,log]});
          } finally { fs.closeSync(log); }
          const finish = message => {
            busy=false;
            if (read(state).tipo === 'carregando') viewer.falhar(message);
          };
          child.once('error',err=>finish(err.message));
          child.once('exit',code=>finish('A geração encerrou ('+code+'). Consulte geracao.log na pasta da sessão.'));
          return reply(202,'');
        } catch(error) { busy=false; throw error; }
      }
      reply(404,'');
    } catch(error) { if (!res.headersSent) reply(400,error.message); }
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  origin='http://127.0.0.1:'+server.address().port;
  const url = origin+base;
  save(path.join(pasta,'sessao.json'),{url,pid:process.pid});
  process.send?.({url});
  const idle = setInterval(()=>{if (!busy && Date.now()-last>2*60*60*1000) server.close();},60000);
  idle.unref();
}
if (require.main === module) {
  const [action,pasta,mode] = process.argv.slice(2);
  (async()=>{
    if (action==='--servir') return serve(pasta,mode==='entrada');
    if (['--aguardar','--entrada'].includes(action) && pasta) {
      const session=await iniciar({pasta,entrada:action==='--entrada',abrir:mode==='--abrir'});
      process.stdout.write(session.url+'\n');
      return;
    }
    throw Error('Uso: node visor.cjs --aguardar|--entrada <nova-pasta-de-sessao> [--abrir]');
  })().catch(error=>{process.stderr.write(error.message+'\n');process.exitCode=1;});
}
module.exports = {iniciar,conectar};
