const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const repo = path.resolve(__dirname, '../..');
const output = path.resolve(process.argv[2] || path.join(__dirname, 'dist'));
const npm = process.env.npm_execpath;
if (!npm) throw Error('Execute npm run bundle a partir do diretório do instalador.');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'pranchas-pacote-'));
const staging = path.join(temp, 'package');
const skill = path.join(staging, 'skills', 'pranchas-de-fluxo');
const example = path.join(temp, 'projeto');
const prepared = path.join(skill, 'exemplo');
const run = (args, cwd) => execFileSync(process.execPath, args, { cwd, stdio: 'inherit', windowsHide: true });
const ci = cwd => run([npm, 'ci', '--ignore-scripts', '--prefer-offline', '--no-audit', '--no-fund'], cwd);

try {
  fs.mkdirSync(output, { recursive: true });
  fs.mkdirSync(staging);
  for (const name of ['install.mjs', 'package.json', 'package-lock.json', 'README.md']) {
    fs.copyFileSync(path.join(__dirname, name), path.join(staging, name));
  }
  fs.copyFileSync(path.join(repo, 'LICENSE'), path.join(staging, 'LICENSE'));
  fs.cpSync(path.join(repo, 'skills/pranchas-de-fluxo'), skill, {
    recursive: true,
    filter: file => !['node_modules', '__pycache__', '.git'].includes(path.basename(file))
  });
  for (const name of ['entrada.cjs', 'project.cjs', 'gerar.cjs']) {
    fs.copyFileSync(path.join(__dirname, name), path.join(skill, 'scripts', name));
  }
  fs.mkdirSync(prepared);
  run([path.join(skill, 'scripts/init.cjs'), example], temp);
  ci(example);
  const licenses = ['@fontsource-variable/inter/LICENSE', 'jspdf/LICENSE', 'svg2pdf.js/LICENSE'];
  const libraries = ['@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', 'jspdf/dist/jspdf.umd.min.js', 'svg2pdf.js/dist/svg2pdf.umd.min.js'];
  for (const file of [...licenses, ...libraries]) {
    const destination = path.join(skill, 'bibliotecas', file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(example, 'node_modules', file), destination);
  }
  run([path.join(example, 'tools/technical-drawing/scripts/build-viewer.cjs'), 'drawing.json', path.join(prepared, 'index.html')], example);
  for (const name of ['briefing.md', 'SPEC.md']) {
    const from = [path.join(example, name), path.join(skill, 'assets', name)].find(file => fs.existsSync(file));
    if (from) fs.copyFileSync(from, path.join(prepared, name));
  }
  ci(staging);
  run([npm, 'pack', '--ignore-scripts', '--silent', '--pack-destination', output], staging);
} finally {
  fs.rmSync(temp, { recursive: true, force: true, maxRetries: 4 });
}
