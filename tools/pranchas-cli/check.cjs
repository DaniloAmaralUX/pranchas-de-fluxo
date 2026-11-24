const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const execFile = require('node:util').promisify(require('node:child_process').execFile);

const {version} = require('./package.json');
const tarball = path.resolve(process.argv[2] || path.join(__dirname, 'dist/pranchas-de-fluxo-' + version + '.tgz'));
const npx = path.join(path.dirname(process.env.npm_execpath), 'npx-cli.js');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'pranchas-teste-'));
const env = {};
for (const name of ['PATH', 'SystemRoot', 'ComSpec', 'PATHEXT', 'TMPDIR', 'TMP', 'TEMP', 'LANG', 'PROGRAMFILES', 'PROGRAMFILES(X86)']) {
  if (process.env[name]) env[name] = process.env[name];
}

function generationFixture(cwd, profile) {
  const bin = path.join(cwd, 'test-bin');
  const cli = process.platform === 'win32' ? path.join(bin, 'node_modules/@openai/codex/bin/codex.js') : path.join(bin, 'codex');
  fs.mkdirSync(path.dirname(cli), { recursive: true });
  const consumer = path.join(profile, '.agents/pranchas-runtime', version);
  const intentCli = path.join(consumer, 'node_modules/@tanstack/intent/dist/cli.mjs');
  const expected = JSON.parse(execFileSync(process.execPath, [intentCli, 'load', 'pranchas-de-fluxo#pranchas-de-fluxo', '--json'], {cwd:consumer, encoding:'utf8'}));
  const fixture = `#!/usr/bin/env node
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const prompt = fs.readFileSync(0, 'utf8');
if (process.argv.includes('--output-schema')) {
  const subject = /^ESPECIALISTA: ([a-z0-9-]+)/m.exec(prompt)[1];
  assert.ok(process.argv.includes('read-only'));
  fs.writeFileSync(process.argv[process.argv.indexOf('--output-last-message') + 1], JSON.stringify({
    especialista: subject, status: 'aplicavel', justificativa: 'O pedido precisa de uma decisão de aprovação.',
    fontes: [{trecho:'Aprovar férias.', local:'linha 1'}],
    recomendacoes: [{id:'r1', proposta:'Destacar a ação de aprovar férias.', fontes:[0]}], conflitos:[], pendencias:[]
  }));
  process.exit(0);
}
assert.deepEqual(process.argv.slice(2), ['exec', '--sandbox', 'workspace-write', '--skip-git-repo-check', '-']);
assert.match(prompt, /HANDOFF.md/);
assert.ok(prompt.includes('pranchas-de-fluxo#pranchas-de-fluxo@' + ${JSON.stringify(version)}));
assert.ok(prompt.includes(${JSON.stringify(expected.content)}));
assert.ok(prompt.includes(${JSON.stringify(consumer)}));
const project = path.resolve('prototipo');
const config = JSON.parse(fs.readFileSync(path.join(project, 'drawing.json')));
config.title = 'Revisão de férias';
const text = 'Aprovar férias.';
config.evidence.push({ id: 'Férias', file: '../briefing.md', excerpt: text });
config.scopeNotes = [...(config.scopeNotes || []), { statement: text, sources: ['Férias'] }];
fs.writeFileSync(path.join(project, 'drawing.json'), JSON.stringify(config));
fs.writeFileSync(path.join(project, 'briefing.md'), text);
fs.writeFileSync(path.join(project, 'SPEC.md'), text);
const reports = fs.readdirSync(path.resolve('conselho')).filter(f=>f !== 'indice.json' && f.endsWith('.json')).map(file=>JSON.parse(fs.readFileSync(path.resolve('conselho',file))));
assert.equal(reports.length,16);
const decisions = {
  telas: config.drawings.map(d=>({id:d.id,fundamentacao:'A prancha apresenta a ação para revisar o pedido de férias.',pareceres:reports.map(r=>r.especialista)})),
  recomendacoes: reports.map(r=>({skill:r.especialista,id:'r1',situacao:'aplicada',justificativa:'A ação está vinculada à primeira peça da tela.',telas:config.drawings.map(d=>({id:d.id,pecas:[d.parts[0].id]}))}))
};
fs.writeFileSync(path.join(project, 'decisoes.json'),JSON.stringify(decisions));
const build = require(path.join(project, 'tools/technical-drawing/scripts/build-viewer.cjs'));
build(path.join(project, 'drawing.json'), path.join(project, 'dist/index.html'));
`;
  fs.writeFileSync(cli, fixture, { mode: 0o755 });
  // Use the installed copy in the fixture, with Chrome's normal OS environment.
  // Chromium owns a fresh disposable browser profile created by check-viewer.
  const entry = path.join(consumer, 'node_modules/pranchas-de-fluxo/skills/pranchas-de-fluxo/scripts/entrada.cjs');
  const options = {cwd, encoding:'utf8', windowsHide:true, env:{...process.env,PATH:bin+path.delimiter+process.env.PATH}};
  const invoke = args => execFileSync(process.execPath, ['-e',
    "require(process.argv[1]).run(process.argv.slice(2)).catch(e => { console.error(e); process.exitCode = 1; })",
    entry, ...args
  ], options);
  const output = invoke(['--gerar','--sem-abrir','--ideia','Aprovar férias.']);
  const html = /(?:Visor|HTML) gerado: (.+)/.exec(output)[1].trim();
  assert.ok(fs.statSync(html).isFile());
  const project = path.dirname(path.dirname(html));
  assert.match(fs.readFileSync(path.join(project, 'SPEC.md'), 'utf8'), /Revisão de férias/);
  assert.match(fs.readFileSync(path.join(project, 'evidence.md'), 'utf8'), /Aprovar férias/);
  if (output.includes('Prova visual pendente')) {
    process.stdout.write('Adaptador --gerar com agente simulado: HTML e documentos verificados. Prova visual pendente.\n');
  } else {
    assert.ok(fs.readdirSync(path.join(project, 'check')).some(file => file.endsWith('.png')));
    const before = fs.readFileSync(html);
    invoke(['--reproduzir', project]);
    assert.ok(fs.readFileSync(html).equals(before));
    process.stdout.write('Adaptador --gerar com agente simulado: HTML, documentação e renderização real verificados\n');
  }
}

function checkIntent(profile, sandbox) {
  const consumer = path.join(profile, '.agents', 'pranchas-runtime', version);
  const cli = path.join(consumer, 'node_modules/@tanstack/intent/dist/cli.mjs');
  const use = 'pranchas-de-fluxo#pranchas-de-fluxo';
  const options = {cwd: consumer, env: sandbox, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']};
  const listing = execFileSync(process.execPath, [cli, 'list', '--json'], options);
  assert.deepEqual(JSON.parse(listing).skills.map(s=>s.use), [use]);
  const load = () => JSON.parse(execFileSync(process.execPath, [cli, 'load', use, '--json'], options));
  const loaded = load();
  assert.equal(loaded.version, version);
  assert.equal(loaded.source, 'local');
  assert.match(loaded.content, /Pranchas de fluxo/);
  const file = path.join(consumer, 'package.json');
  const original = fs.readFileSync(file, 'utf8');
  const policy = JSON.parse(original);
  assert.deepEqual(policy.intent.skills, [use]);
  try {
    policy.intent.exclude = [use];
    fs.writeFileSync(file, JSON.stringify(policy));
    assert.throws(load, /excluded/i);
  } finally {
    fs.writeFileSync(file, original);
  }
}

async function trial(editors) {
  const root = path.join(temp, editors ? 'múltiplos editores' : 'perfil vazio');
  const profile = path.join(root, 'perfil');
  const cwd = path.join(root, 'meu projeto');
  fs.mkdirSync(profile, { recursive: true });
  fs.mkdirSync(cwd);
  const sandbox = {
    ...env, CI:'1', HOME: profile, USERPROFILE: profile, APPDATA: path.join(profile, 'roaming'),
    LOCALAPPDATA: path.join(profile, 'local'), XDG_CONFIG_HOME: path.join(profile, '.config'),
    npm_config_cache: path.join(profile, 'npm-cache'), npm_config_offline: 'true',
    npm_config_audit: 'false', npm_config_fund: 'false', npm_config_update_notifier: 'false'
  };
  const invoke = (args, input) => execFileSync(process.execPath, args, { cwd, input, env: sandbox, encoding: 'utf8', windowsHide: true });
  assert.equal(invoke(['-p', 'require("os").homedir()']).trim(), profile);
  if (editors) for (const dir of ['.claude', '.cursor', '.codex']) fs.mkdirSync(path.join(profile, dir));
  const stableFiles = editors ? [
    path.join(cwd, '.pranchas/cli.cjs'),
    path.join(cwd, '.agents/skills/pranchas-de-fluxo/SKILL.md'),
    path.join(profile, '.agents/skills/pranchas-de-fluxo/SKILL.md'),
    path.join(profile, '.claude/skills/pranchas-de-fluxo/SKILL.md')
  ] : [];
  for (const file of stableFiles) {
    fs.mkdirSync(path.dirname(file), {recursive:true});
    fs.writeFileSync(file, 'stable 1.0.0');
  }
  const file = path.join(cwd, 'reunião & cliente.txt');
  fs.writeFileSync(file, 'O gestor precisa revisar férias pendentes.');
  const name = path.basename(tarball);
  fs.copyFileSync(tarball, path.join(cwd, name));
  const trials = editors ? [0,1] : [0];
  const installs = await Promise.all(trials.map(i=>execFile(process.execPath, [npx,'--yes','./'+name,...(editors?[path.basename(file)]:[])], {
    cwd, windowsHide:true, encoding:'utf8', env:{...sandbox,npm_config_cache:sandbox.npm_config_cache+i}
  })));
  const output = installs[0].stdout;
  assert.match(output, /Skill instalada/);
  for (const file of stableFiles) assert.equal(fs.readFileSync(file,'utf8'), 'stable 1.0.0');
  assert.ok(fs.existsSync(path.join(cwd, '.agents/skills/pranchas-de-fluxo-beta/SKILL.md')));
  fs.unlinkSync(path.join(cwd, name));
  for (const i of trials) fs.rmSync(sandbox.npm_config_cache+i, {recursive:true,force:true});
  checkIntent(profile, sandbox);
  assert.match(invoke(['.pranchas-beta/cli.cjs','orientacao']), /pranchas-de-fluxo#pranchas-de-fluxo@/);
  if (editors) {
    assert.ok(fs.existsSync(path.join(cwd, '.claude/skills/pranchas-de-fluxo-beta/SKILL.md')));
    assert.match(output, /Claude Code/);
    const dir = path.join(cwd, '.pranchas-beta/entradas');
    assert.equal(fs.readdirSync(dir).length,2);
    const job = path.join(dir, fs.readdirSync(dir)[0]);
    const source = fs.readFileSync(path.join(job, 'briefing.md'), 'utf8');
    assert.match(source, /gestor precisa/);
    assert.match(invoke(['.pranchas-beta/cli.cjs','--stdin'],'A RH recebe o resultado.'), /HANDOFF.md/);
    assert.match(fs.readFileSync(path.join(job, 'HANDOFF.md'), 'utf8'), /pranchas-de-fluxo/);
  }
  assert.match(invoke(['.pranchas-beta/cli.cjs', '--ideia', 'Aprovar férias.', '--offline']), /HANDOFF.md/);
  invoke(['.pranchas-beta/cli.cjs', 'exemplo', 'demo']);
  assert.match(fs.readFileSync(path.join(cwd, 'demo/index.html'), 'utf8'), /<!doctype html>/i);
  if (editors) generationFixture(cwd, profile);
  process.stdout.write((editors ? 'Perfis de editores' : 'Perfil vazio') + ': instalação offline e uso persistente OK\n');
}

async function run() {
  try { await trial(false); await trial(true); }
  finally { fs.rmSync(temp,{recursive:true,force:true,maxRetries:5}); }
}
run().catch(error=>{console.error(error);process.exitCode=1;});
