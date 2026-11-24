const fs = require('node:fs/promises');
const {constants} = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');

const print = line => process.stdout.write(line + '\n');
const demo = path.resolve(__dirname, '../exemplo');

function help() {
  print('Pranchas de fluxo');
  print('  npx --yes ./pranchas-de-fluxo-' + require('../package-version.json').version + '.tgz [arquivo ...]');
  print('  node .pranchas-beta/cli.cjs [arquivo ...] [--stdin] [--ideia "texto"] [--offline] [--gerar] [--sem-abrir]');
  print('  --gerar entrega as fontes ao Codex CLI e ao provedor de IA configurado neste perfil.');
  print('  node .pranchas-beta/cli.cjs exemplo <pasta-nova>');
  print('  node .pranchas-beta/cli.cjs --sessao-web');
  print('  node .pranchas-beta/cli.cjs --reproduzir <pasta-do-prototipo>');
  print('  node .pranchas-beta/cli.cjs orientacao');
  print('No chat do agente, anexe seu material ou abra o HANDOFF.md indicado no terminal.');
}

function parse(args) {
  const files = [];
  let idea;
  let stdin = false;
  let offline = false;
  let generate = false;
  let open = true;
  let session;
  let literal = false;
  for (let index = 0; index < args.length; index++) {
    const value = args[index];
    if (literal) files.push(value);
    else if (value === '--') literal = true;
    else if (value === '--stdin') stdin = true;
    else if (value === '--offline') offline = true;
    else if (value === '--gerar') generate = true;
    else if (value === '--sem-abrir') open = false;
    else if (value === '--sessao') {
      const directory = args[++index];
      if (!directory || directory.startsWith('--')) throw Error('Informe a pasta de sessão do visor.');
      session = path.resolve(directory);
    }
    else if (value === '--ideia') {
      idea = args[++index];
      if (!idea?.trim()) throw Error('Escreva o texto depois de --ideia.');
    } else if (value.startsWith('-')) throw Error('Opção desconhecida: ' + value);
    else files.push(value);
  }
  if (generate && offline) throw Error('Para exigir execução offline, prepare o pedido com --offline. --gerar usa o provedor do Codex.');
  if (generate && !(files.length || stdin || idea)) throw Error('Passe um arquivo, --stdin ou --ideia com --gerar.');
  if (session && !generate) throw Error('--sessao requer um pedido com --gerar.');
  return { files, idea, stdin, offline, generate, open, session };
}

async function readStdin() {
  if (process.stdin.isTTY) throw Error('Passe o texto por um pipe para --stdin ou use --ideia "texto".');
  process.stdin.setEncoding('utf8');
  let text = '';
  for await (const chunk of process.stdin) text += chunk;
  if (!text.trim()) throw Error('A entrada de texto está vazia.');
  return text;
}

async function projectLauncher(project) {
  const source = path.join(__dirname, 'project.cjs');
  const destination = path.join(project, 'cli.cjs');
  const stage = await fs.mkdtemp(path.join(path.dirname(project), '.instalando-pranchas-beta-'));
  try {
    await fs.copyFile(source, path.join(stage, 'cli.cjs'));
    try { await fs.rename(stage, project); }
    catch (error) { if (!['EEXIST', 'ENOTEMPTY', 'EPERM'].includes(error.code)) throw error; }
  } finally {
    await fs.rm(stage, {force: true, recursive: true});
  }
  if (!(await fs.readFile(source)).equals(await fs.readFile(destination))) {
    throw Error('Já existe outro arquivo em ' + destination + '. Escolha uma pasta de trabalho diferente.');
  }
}

async function handoff(project, { files, idea, stdin, offline }) {
  const transcript = stdin ? await readStdin() : undefined;
  const paths = [...new Set(files.map(file => path.resolve(file)))];
  for (const file of paths) {
    if (!(await fs.stat(file)).isFile()) throw Error('Selecione um arquivo: ' + file);
  }
  const jobs = path.join(project, 'entradas');
  await fs.mkdir(jobs, { recursive: true, mode: 0o700 });
  const staging = await fs.mkdtemp(path.join(jobs, '.preparando-'));
  const inputs = [];
  try {
    for (const [index, file] of paths.entries()) {
      const name = String(index + 1) + '-' + path.basename(file);
      await fs.copyFile(file, path.join(staging, name), constants.COPYFILE_FICLONE);
      inputs.push(name);
    }
    for (const [name, content] of [['ideia.txt', idea], ['transcricao.txt', transcript]]) {
      if (content === undefined) continue;
      await fs.writeFile(path.join(staging, name), content, { mode: 0o600 });
      inputs.push(name);
    }
    const extract = path.join(__dirname, 'ingerir.cjs');
    const extractArgs = [extract, '--out', staging, ...(offline ? ['--offline'] : []), '--', ...inputs];
    const result = spawnSync(process.execPath, extractArgs, { cwd: staging, stdio: ['ignore', 'ignore', 'inherit'], windowsHide: true });
    if (result.error) throw result.error;
    if (result.status !== 0) throw Error('A leitura dos insumos falhou. Consulte a mensagem acima e repita o comando.');
    const brief = [
      '# Pedido de pranchas de fluxo', '',
      'Use a skill do projeto pranchas-de-fluxo-beta. Leia [as fontes extraídas](briefing.md) e os arquivos ao lado deste pedido como material da reunião.',
      'Gere o briefing, a especificação e o visor navegável no projeto. Vincule cada requisito à fonte e marque hipóteses para revisão.',
      'Teste as transições e as setas do teclado e abra o HTML no navegador integrado da IDE quando disponível.',
      '', '## Arquivos de entrada', '', ...inputs.map(name => '- ' + JSON.stringify(name)), ''
    ];
    await fs.writeFile(path.join(staging, 'HANDOFF.md'), brief.join('\n'), { mode: 0o600 });
    const job = path.join(jobs, new Date().toISOString().slice(0, 10) + '-' + randomUUID());
    await fs.rename(staging, job);
    return path.join(job, 'HANDOFF.md');
  } catch (error) {
    await fs.rm(staging, { recursive: true, force: true });
    throw error;
  }
}

async function openSession(project, entrada, abrir = true) {
  const parent = path.join(project, 'sessoes');
  await fs.mkdir(parent, {recursive:true,mode:0o700});
  const pasta = await fs.mkdtemp(path.join(parent, 'sessao-'));
  const viewer = await require('./visor.cjs').iniciar({pasta, abrir, entrada});
  print('Visor local: ' + viewer.url);
  return viewer;
}

async function run(args) {
  if (['-h', '--help'].includes(args[0])) return help();
  if (args[0] === '--reproduzir') {
    if (args.length !== 2) throw Error('Uso: --reproduzir <pasta-do-prototipo>');
    const html = await require('./contrato.cjs').reproduzir(path.resolve(args[1]));
    print('Visor reproduzido: ' + html);
    return;
  }
  if (args[0] === 'orientacao') {
    const guide = await require('./gerar.cjs').guidanceForRun();
    print(guide.id + '@' + guide.version + '\nDiretório de apoio: ' + guide.directory + '\nBase dos links node_modules/: ' + guide.consumer + '\n\n' + guide.content);
    return;
  }
  if (args[0] === 'exemplo') {
    if (args.length !== 2) throw Error('Uso: exemplo <pasta-nova>');
    const destination = path.resolve(args[1]);
    await fs.mkdir(destination);
    await fs.cp(demo, destination, { recursive: true });
    print('Abra no navegador: ' + path.join(destination, 'index.html'));
    return;
  }
  const project = path.resolve('.pranchas-beta');
  if (args[0] === '--sessao-web') {
    if (args.length !== 1) throw Error('Uso: --sessao-web');
    await projectLauncher(project);
    await openSession(project, true, false);
    return;
  }
  const options = parse(args);
  await projectLauncher(project);
  const hasInput = options.files.length > 0 || options.idea || options.stdin;
  const show = options.open && !process.env.CI;
  let viewer;
  if (options.session) viewer = await require('./visor.cjs').conectar(options.session);
  else if (show && (options.generate || !hasInput)) viewer = await openSession(project, !hasInput);
  if (!hasInput) {
    if (!viewer) print('Anexe o briefing no chat do agente ou use --gerar com os arquivos.');
    print('Exemplo pronto para abrir: ' + path.join(demo, 'index.html'));
    return;
  }
  try {
    await viewer?.atualizar('descobrir');
    const request = await handoff(project, options);
    const relative = path.relative(process.cwd(), request).split(path.sep).join('/');
    if (options.generate) {
      print('Pedido local: ' + relative);
      const html = await require('./gerar.cjs').generate(request, viewer);
      await viewer?.concluir(html);
    } else {
      print('Pedido local pronto. No chat do agente da IDE, diga:');
      print('Gere as pranchas deste pedido: ' + relative);
    }
  } catch(error) {
    await viewer?.falhar(error.message);
    throw error;
  }
}

module.exports = { run, help, projectLauncher };
