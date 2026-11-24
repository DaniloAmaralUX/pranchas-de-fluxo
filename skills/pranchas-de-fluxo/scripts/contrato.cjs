const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createHash, randomUUID} = require('node:crypto');
const build = require('../assets/technical-drawing/scripts/build-viewer.cjs');
const {generate} = require('../assets/technical-drawing/scripts/spec.cjs');
const {consultar} = require('./conselho.cjs');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const text = s => typeof s === 'string' && !!s.trim();
const fail = msg => { throw Error(msg); };

function inside(root, file) {
  const rel = path.relative(root, file);
  if (rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) fail('Arquivo fora do pedido: ' + file);
  return rel.split(path.sep).join('/');
}

function write(file, content) {
  if (fs.existsSync(file) && !fs.lstatSync(file).isFile()) fail('Destino inválido: ' + file);
  const stage = file + '.' + randomUUID() + '.tmp';
  try {
    fs.writeFileSync(stage, content, {flag:'wx', mode:0o600});
    fs.renameSync(stage, file);
  } finally { fs.rmSync(stage, {force:true}); }
}

function validateDecisions(config, reports, decisions) {
  const drawings = new Map(config.drawings.map(d => [d.id, new Set(d.parts.map(p => String(p.id)))]));
  const applicable = new Set(reports.filter(r => r.status === 'aplicavel').map(r => r.especialista));
  const screens = new Map();
  if (!Array.isArray(decisions.telas) || !Array.isArray(decisions.recomendacoes)) fail('decisoes.json precisa de telas e recomendacoes.');
  for (const d of decisions.telas) {
    if (!drawings.has(d.id) || screens.has(d.id) || !text(d.fundamentacao) || !Array.isArray(d.pareceres) ||
        !d.pareceres.length || new Set(d.pareceres).size !== d.pareceres.length || d.pareceres.some(s => !applicable.has(s))) fail('Fundamentação ou parecer inválido para tela ' + d.id);
    screens.set(d.id, d.pareceres);
  }
  if (screens.size !== drawings.size) fail('Há telas sem fundamentação.');
  const remaining = new Set(reports.flatMap(r => r.recomendacoes.map(rec => JSON.stringify([r.especialista,rec.id]))));
  for (const r of decisions.recomendacoes) {
    if (!remaining.delete(JSON.stringify([r.skill,r.id]))) fail('Recomendação desconhecida ou repetida: ' + r.skill + '/' + r.id);
    if (!['aplicada','adiada','recusada'].includes(r.situacao) || !text(r.justificativa) || !Array.isArray(r.telas)) fail('Decisão sem disposição ou justificativa: ' + r.id);
    if (r.situacao === 'aplicada' && !r.telas.length) fail('Recomendação aplicada sem tela: ' + r.id);
    for (const t of r.telas) {
      if (!screens.has(t.id) || !Array.isArray(t.pecas) || !t.pecas.length || t.pecas.some(p => !drawings.get(t.id).has(p))) fail('Destino ou peça desconhecida: ' + r.id);
      if (r.situacao === 'aplicada' && !screens.get(t.id).includes(r.skill)) fail('Parecer ausente na tela ' + t.id + ': ' + r.skill);
    }
  }
  if (remaining.size) fail('Faltam decisões sobre recomendações: ' + [...remaining].join(', '));
}

async function rebuild(project, replay) {
  project = fs.realpathSync(project);
  const job = path.dirname(project);
  const capture = new Map();
  function input(file) {
    const absolute = path.resolve(file);
    inside(job, absolute);
    const relative = inside(job, fs.realpathSync(absolute));
    if (!fs.statSync(absolute).isFile()) fail('Fonte inválida: ' + file);
    capture.set(relative, sha(fs.readFileSync(absolute)));
    return absolute;
  }
  const manifestRoot = [path.join(__dirname,'../upstream/jakub'), path.join(__dirname,'../../../vendor/jakub')].find(dir => fs.existsSync(path.join(dir,'manifest.json')));
  if (!manifestRoot) fail('Falta o manifesto das skills.');
  const manifestFile = path.join(manifestRoot,'manifest.json');
  const indexFile = input(path.join(job,'conselho/indice.json'));
  const index = json(indexFile);
  input(path.join(job,'briefing.md'));
  // This validates the stored reports and original inputs. Never start a new agent during replay.
  await consultar({job, directory:manifestRoot, run:() => fail('Parecer ausente do arquivo de trabalho.')});
  const reports = index.pareceres.map(p => json(input(path.join(job,'conselho',p.arquivo))));
  const configFile = input(path.join(project,'drawing.json'));
  const config = json(configFile);
  const decisions = json(input(path.join(project,'decisoes.json')));
  input(path.join(project,'briefing.md'));
  for (const file of [...config.modelScripts, ...config.evidence.map(e => e.file)]) input(path.resolve(project,file));
  if (config.dependencies !== 'bibliotecas') fail('As bibliotecas precisam estar no projeto.');
  for (const file of ['@fontsource-variable/inter/LICENSE','@fontsource-variable/inter/files/inter-latin-wght-normal.woff2','jspdf/dist/jspdf.umd.min.js','svg2pdf.js/dist/svg2pdf.umd.min.js']) input(path.join(project,'bibliotecas',file));
  validateDecisions(config, reports, decisions);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(),'pranchas-contrato-'));
  const output = path.join(project,'dist/index.html');
  try {
    const html = fs.readFileSync(build(configFile,path.join(temp,'index.html')));
    generate(configFile,temp);
    for (const doc of ['SPEC.md','evidence.md']) {
      if (!fs.readFileSync(input(path.join(project,doc))).equals(fs.readFileSync(path.join(temp,doc)))) fail('Documento desatualizado: ' + doc);
    }
    const lock = {versao:1,manifesto:sha(fs.readFileSync(manifestFile)),insumos:index.insumosSha256,arquivos:Object.fromEntries([...capture].sort(([a],[b])=>a<b?-1:a>b?1:0)),html:sha(html)};
    const file = path.join(project,'contrato.lock.json');
    if (replay) {
      if (JSON.stringify(json(input(file))) !== JSON.stringify(lock)) fail('O projeto ou o motor de desenho diverge do contrato.');
    }
    const dist = path.dirname(output);
    if (!fs.existsSync(dist) && replay) fs.mkdirSync(dist);
    if (!fs.lstatSync(dist).isDirectory() || fs.realpathSync(dist) !== dist) fail('Pasta de entrega inválida.');
    if (replay) write(output,html);
    else {
      if (!fs.readFileSync(input(output)).equals(html)) fail('O HTML diverge do desenho reproduzido.');
      write(file,JSON.stringify(lock,null,2)+'\n');
    }
    return output;
  } finally { fs.rmSync(temp,{recursive:true,force:true}); }
}
module.exports = {selar: project => rebuild(project,false), reproduzir: project => rebuild(project,true), validateDecisions};
