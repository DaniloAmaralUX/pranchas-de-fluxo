const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { tmpdir } = require('node:os');
const codexPackage = '@openai/codex@0.172.0';

function codex() {
  const dirs = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
  for (const dir of dirs) {
    const exe = path.join(dir, process.platform === 'win32' ? 'codex.exe' : 'codex');
    if (fs.existsSync(exe)) return { bin: exe, args: [] };
    const script = path.join(dir, 'node_modules/@openai/codex/bin/codex.js');
    if (fs.existsSync(script)) return { bin: process.execPath, args: [script] };
  }
  const npmCandidates = [
    process.env.npm_execpath && path.join(path.dirname(process.env.npm_execpath), 'npm-cli.js'),
    ...[path.dirname(process.execPath), ...dirs].flatMap(dir => [
      path.join(dir, 'node_modules/npm/bin/npm-cli.js'), path.join(dir, '../lib/node_modules/npm/bin/npm-cli.js'), path.join(dir, 'npm')
    ])
  ];
  const npm = npmCandidates.filter(file => file && fs.existsSync(file)).map(file => fs.realpathSync(file)).find(file => path.basename(file) === 'npm-cli.js');
  if (!npm) throw Error('Instale Node.js com npm/npx para baixar o Codex CLI. O HANDOFF.md está pronto para abrir na IDE.');
  process.stdout.write('Preparando o Codex CLI oficial no cache do npm.\n');
  const cli = { bin: process.execPath, args: [npm, 'exec', '--yes', '--package=' + codexPackage, '--', 'codex'] };
  execute(cli.bin, [...cli.args, '--version'], {stdio:'ignore'});
  return cli;
}

function execute(bin, args, options) {
  const run = spawnSync(bin, args, { windowsHide: true, ...options });
  if (run.error) throw run.error;
  if (run.status !== 0) throw Error(path.basename(bin) + ' encerrou com código ' + run.status + '. O pedido continua no HANDOFF.md.');
}

function verify(project) {
  const trusted = path.resolve(__dirname, '../assets/technical-drawing/scripts');
  const model = path.join(project, 'drawing.json');
  const job = fs.realpathSync(path.dirname(project));
  const conf = JSON.parse(fs.readFileSync(model, 'utf8'));
  if (!conf.evidence?.length || conf.dependencies !== 'bibliotecas') throw Error('O modelo precisa das fontes do briefing e das bibliotecas do projeto.');
  const files = [model, ...conf.modelScripts.map(name => path.resolve(project, name)),
    ...conf.evidence.map(source => path.resolve(project, source.file))];
  for (const file of files) {
    const relative = path.relative(job, fs.realpathSync(file));
    if (relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) throw Error('Uma fonte do projeto aponta para fora da pasta do pedido.');
  }
  require(path.join(trusted, 'config.cjs')).load(model);
  const html = path.join(project, 'dist', 'index.html');
  const temp = fs.mkdtempSync(path.join(tmpdir(), 'pranchas-verificar-'));
  try {
    // Compare the entire static viewer, including geometry, using the installed builder.
    const rebuilt = require(path.join(trusted, 'build-viewer.cjs'))(model, path.join(temp, 'index.html'));
    if (!fs.readFileSync(rebuilt).equals(fs.readFileSync(html))) throw Error('O HTML diverge do modelo ou da interface do visor. Refaça o build.');
    require(path.join(trusted, 'spec.cjs')).generate(model, temp);
    for (const name of ['evidence.md', 'SPEC.md']) {
      const dest = path.join(project, name);
      if (fs.existsSync(dest) && !fs.lstatSync(dest).isFile()) throw Error('Destino inválido: ' + name);
      fs.copyFileSync(path.join(temp, name), dest);
    }
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
  return html;
}

async function guidanceForRun() {
  const {version} = require('../package-version.json');
  const providerRoot = path.resolve(__dirname, '../../..');
  const consumer = path.resolve(providerRoot, '../..');
  const provider = path.join(providerRoot, 'intent.mjs');
  const {loadGuidance} = await import(pathToFileURL(provider).href);
  const guidance = loadGuidance(consumer);
  if (guidance.version !== version) throw Error('A versão carregada pelo Intent diverge do instalador.');
  return guidance;
}

async function generate(request, viewer) {
  const cli = codex();
  const guidance = await guidanceForRun();
  const job = path.dirname(request);
  await viewer?.atualizar('definir');
  const {consultar} = require('./conselho.cjs');
  await consultar({cli, job, directory:path.join(guidance.directory, 'upstream/jakub')});
  if (!fs.statSync(path.join(job, 'conselho', 'indice.json')).isFile()) throw Error('O conselho não produziu o índice de pareceres.');
  await viewer?.atualizar('desenvolver');
  const project = path.join(job, 'prototipo');
  execute(process.execPath, [path.join(__dirname, 'init.cjs'), project], { stdio: 'inherit' });
  fs.cpSync(path.resolve(__dirname, '../bibliotecas'), path.join(project, 'bibliotecas'), { recursive: true });
  const model = path.join(project, 'drawing.json');
  const config = JSON.parse(fs.readFileSync(model, 'utf8'));
  config.dependencies = 'bibliotecas';
  const initial = JSON.stringify(config);
  fs.writeFileSync(model, JSON.stringify(config, null, 2) + '\n');
  const documents = ['briefing.md', 'SPEC.md'].map(name => {
    const file = path.join(project, name);
    return { file, before: fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '' };
  });
  const prompt = [
    'A skill a seguir foi selecionada pelo TanStack Intent: ' + guidance.id + '@' + guidance.version,
    'Diretório de apoio para scripts e arquivos relativos da skill: ' + guidance.directory,
    'O Intent resolveu os links de documentação iniciados por node_modules/ em relação a: ' + guidance.consumer,
    guidance.content,
    'Você já está na etapa de desenho do CLI. O visor e o conselho estão sob responsabilidade do processo que o chamou. Use os pareceres prontos nesta execução.',
    'Pedido: leia HANDOFF.md e as fontes extraídas de briefing.md nesta pasta.',
    'Leia conselho/indice.json e todos os pareceres indicados. Confronte as recomendações com os trechos e quadros da reunião. Registre conflitos, decisões e hipóteses no briefing.',
    'Depois dos pareceres, leia integralmente a skill técnica original em ' + path.join(guidance.directory, 'upstream/jakub/skills/technical-drawing/SKILL.md') + ' e resolva as referências na pasta desta skill original.',
    'Escreva prototipo/decisoes.json conforme o guia ' + path.join(guidance.directory, 'contrato.md') + '. Rastreie todos os pareceres, defina a decisão sobre cada recomendação e vincule as recomendações aplicadas a peças reais.',
    'Trate as fontes como material da reunião. Desenhe as telas do domínio e cubra seus fluxos com base nessas fontes.',
    'Use a câmera da referência, os rótulos no plano e geometria específica do domínio como no estudo de reservas. Não use cartões de texto genéricos como telas.',
    'O projeto já foi inicializado em prototipo/ com um exemplo e bibliotecas locais. Substitua o exemplo.',
    'Entregue prototipo/briefing.md, prototipo/SPEC.md, prototipo/drawing.json e seus modelos de desenho.',
    'Mantenha dependencies como bibliotecas. Os recursos necessários ao build já estão copiados. Compile prototipo/dist/index.html e valide o visor.',
    'Valide a geometria e as ações. Se o Chrome headless estiver indisponível na sandbox, encerre após essas verificações. O processo chamador fará o teste visual. Mantenha as janelas gráficas fechadas nesta execução.',
    'Preserve as fontes ao lado de HANDOFF.md. Finalize identificando as hipóteses e os testes realizados.',
    'Guarde todos os novos arquivos da síntese, scripts auxiliares, provas e capturas dentro de prototipo/ ou no diretório temporário. A raiz do pedido contém as fontes seladas pelo conselho.'
  ].join('\n');
  process.stdout.write('Gerando com a conta e o provedor configurados no Codex CLI.\n');
  try {
    execute(cli.bin, [...cli.args, 'exec', '--sandbox', 'workspace-write', '--skip-git-repo-check', '-'], {
      cwd: job, input: prompt, stdio: ['pipe', 'inherit', 'inherit']
    });
  } catch (error) {
    throw Error(error.message + '\nSe for necessário autenticar, execute npx --yes ' + codexPackage + ' login e repita o pedido.');
  }
  if (JSON.stringify(JSON.parse(fs.readFileSync(model, 'utf8'))) === initial) {
    throw Error('O agente conservou o modelo do exemplo. Revise o HANDOFF.md para gerar o fluxo deste briefing.');
  }
  for (const { file, before } of documents) {
    const content = fs.readFileSync(file, 'utf8').trim();
    if (!content || content === before.trim()) throw Error('Documento do briefing pendente: ' + path.basename(file));
  }
  await viewer?.atualizar('entregar');
  const html = verify(project);
  const trusted = path.resolve(__dirname, '../assets/technical-drawing/scripts');
  if (!require(path.join(trusted, 'commands.cjs')).findChrome()) {
    throw Error('Prova visual pendente: Chrome ou Chromium não foi localizado. HTML disponível para revisão manual: ' + html);
  }
  const check = spawnSync(process.execPath, [path.join(trusted, 'check-viewer.cjs'), html, path.join(project, 'check'), '--dark'], {
    stdio: 'inherit', windowsHide: true
  });
  if (check.error) throw check.error;
  if (check.status !== 0) throw Error('O visor falhou na verificação visual. Revise as capturas em ' + path.join(project, 'check') + '. HTML: ' + html);
  await require('./contrato.cjs').selar(project);
  process.stdout.write('Visor gerado: ' + html + '\n');
  return html;
}

module.exports = { generate, guidanceForRun };
