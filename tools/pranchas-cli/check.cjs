const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

const tarball = path.resolve(process.argv[2] || path.join(__dirname, 'dist/pranchas-de-fluxo-1.0.0.tgz'));
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
  const fixture = `#!/usr/bin/env node
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
assert.deepEqual(process.argv.slice(2), ['exec', '--sandbox', 'workspace-write', '--skip-git-repo-check', '-']);
assert.match(fs.readFileSync(0, 'utf8'), /HANDOFF.md/);
const project = path.resolve('prototipo');
const config = JSON.parse(fs.readFileSync(path.join(project, 'drawing.json')));
config.title = 'Revisão de férias';
const text = 'Aprovar férias.';
config.evidence.push({ id: 'Férias', file: '../briefing.md', excerpt: text });
config.scopeNotes = [...(config.scopeNotes || []), { statement: text, sources: ['Férias'] }];
fs.writeFileSync(path.join(project, 'drawing.json'), JSON.stringify(config));
fs.writeFileSync(path.join(project, 'briefing.md'), text);
fs.writeFileSync(path.join(project, 'SPEC.md'), text);
const build = require(path.join(project, 'tools/technical-drawing/scripts/build-viewer.cjs'));
build(path.join(project, 'drawing.json'), path.join(project, 'dist/index.html'));
`;
  fs.writeFileSync(cli, fixture, { mode: 0o755 });
  // Use the installed copy in the fixture, with Chrome's normal OS environment.
  // Chromium owns a fresh disposable browser profile created by check-viewer.
  const entry = path.join(profile, '.agents/skills/pranchas-de-fluxo/scripts/entrada.cjs');
  const script = 'require(process.argv[1]).run(process.argv.slice(2)).catch(e => { process.stderr.write(e.message); process.exitCode = 1; })';
  const output = execFileSync(process.execPath, ['-e', script, entry, '--gerar', '--ideia', 'Aprovar férias.'], {
    cwd, encoding: 'utf8', windowsHide: true, env: { ...process.env, PATH: bin + path.delimiter + process.env.PATH }
  });
  const html = /(?:Visor|HTML) gerado: (.+)/.exec(output)[1].trim();
  assert.ok(fs.statSync(html).isFile());
  const project = path.dirname(path.dirname(html));
  assert.match(fs.readFileSync(path.join(project, 'SPEC.md'), 'utf8'), /Revisão de férias/);
  assert.match(fs.readFileSync(path.join(project, 'evidence.md'), 'utf8'), /Aprovar férias/);
  if (output.includes('Prova visual pendente')) {
    process.stdout.write('Adaptador --gerar com agente simulado: HTML e documentos verificados. Prova visual pendente.\n');
  } else {
    assert.ok(fs.readdirSync(path.join(project, 'check')).some(file => file.endsWith('.png')));
    process.stdout.write('Adaptador --gerar com agente simulado: HTML, documentação e renderização real verificados\n');
  }
}

function trial(editors) {
  const root = path.join(temp, editors ? 'múltiplos editores' : 'perfil vazio');
  const profile = path.join(root, 'perfil');
  const cwd = path.join(root, 'meu projeto');
  fs.mkdirSync(profile, { recursive: true });
  fs.mkdirSync(cwd);
  const sandbox = {
    ...env, HOME: profile, USERPROFILE: profile, APPDATA: path.join(profile, 'roaming'),
    LOCALAPPDATA: path.join(profile, 'local'), XDG_CONFIG_HOME: path.join(profile, '.config'),
    npm_config_cache: path.join(profile, 'npm-cache'), npm_config_offline: 'true',
    npm_config_audit: 'false', npm_config_fund: 'false', npm_config_update_notifier: 'false'
  };
  const invoke = (args, input) => execFileSync(process.execPath, args, { cwd, input, env: sandbox, encoding: 'utf8', windowsHide: true });
  assert.equal(invoke(['-p', 'require("os").homedir()']).trim(), profile);
  if (editors) for (const dir of ['.claude', '.cursor', '.codex']) fs.mkdirSync(path.join(profile, dir));
  const file = path.join(cwd, 'reunião & cliente.txt');
  fs.writeFileSync(file, 'O gestor precisa revisar férias pendentes.');
  const name = path.basename(tarball);
  fs.copyFileSync(tarball, path.join(cwd, name));
  const output = invoke([npx, '--yes', './' + name, ...(editors ? [path.basename(file), '--stdin'] : [])], 'A RH recebe o resultado.');
  assert.match(output, /Skill instalada/);
  const canonical = path.join(profile, '.agents/skills/pranchas-de-fluxo');
  assert.ok(fs.existsSync(path.join(canonical, 'assets/package-lock.json')));
  fs.unlinkSync(path.join(cwd, name));
  fs.rmSync(sandbox.npm_config_cache, { recursive: true, force: true });
  if (editors) {
    assert.ok(fs.existsSync(path.join(profile, '.claude/skills/pranchas-de-fluxo/SKILL.md')));
    assert.match(output, /Claude Code/);
    const dir = path.join(cwd, '.pranchas/entradas');
    const job = path.join(dir, fs.readdirSync(dir)[0]);
    const source = fs.readFileSync(path.join(job, 'briefing.md'), 'utf8');
    assert.match(source, /gestor precisa/);
    assert.match(source, /RH recebe/);
    assert.match(fs.readFileSync(path.join(job, 'HANDOFF.md'), 'utf8'), /pranchas-de-fluxo/);
  }
  assert.match(invoke(['.pranchas/cli.cjs', '--ideia', 'Aprovar férias.', '--offline']), /HANDOFF.md/);
  invoke(['.pranchas/cli.cjs', 'exemplo', 'demo']);
  assert.match(fs.readFileSync(path.join(cwd, 'demo/index.html'), 'utf8'), /<!doctype html>/i);
  if (editors) generationFixture(cwd, profile);
  process.stdout.write((editors ? 'Perfis de editores' : 'Perfil vazio') + ': instalação offline e uso persistente OK\n');
}

try {
  trial(false);
  trial(true);
} finally {
  fs.rmSync(temp, { recursive: true, force: true, maxRetries: 5 });
}
