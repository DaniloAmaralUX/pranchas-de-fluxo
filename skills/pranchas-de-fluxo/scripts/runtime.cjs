'use strict';

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');

const version = '0.9.18';
const releases = {
  'win32-x64': ['x86_64-pc-windows-msvc.zip', '28cbe5d30907a774bfe27a517a39b494ec6f7d3816bda8bbf6f9645490449182'],
  'win32-arm64': ['aarch64-pc-windows-msvc.zip', 'fadb43ba13091f44e1786fc3967e65c7786d86192aa205d718307c649927cfc2'],
  'darwin-x64': ['x86_64-apple-darwin.tar.gz', 'f86836c637333c65bbc7902acc9c49888eef9fbd15dccbc1946b10e30b041073'],
  'darwin-arm64': ['aarch64-apple-darwin.tar.gz', 'dc3bee4abbb3bac267a3985a23ea7617d19d41ff381dbaf560ba415ad65af68f'],
  'linux-x64': ['x86_64-unknown-linux-gnu.tar.gz', 'c2def3db178ade63933fa15ffc96e882c196ce53e06173dcee05b36c5f6f68f5'],
  'linux-arm64': ['aarch64-unknown-linux-gnu.tar.gz', 'f8e23ec786b18660ade6b033b6191b7e9c283c872eeb8c4531d56a873decf160'],
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', windowsHide: true, ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(command + ' encerrou com código ' + result.status);
}

async function executable(file) {
  return fs.access(file).then(() => true, () => false);
}

async function acquireUv(offline) {
  if (spawnSync('uv', ['--version'], { stdio: 'ignore', windowsHide: true }).status === 0) return 'uv';
  const release = releases[process.platform + '-' + process.arch];
  if (!release) throw new Error('Instale uv da Astral para esta plataforma e tente novamente.');
  const [archive, hash] = release;
  const exe = process.platform === 'win32' ? 'uv.exe' : 'uv';
  const cache = path.join(process.env.LOCALAPPDATA || process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache'), 'pranchas-de-fluxo', 'uv-' + version);
  const target = path.join(cache, exe);
  if (await executable(target)) return target;
  if (offline) throw new Error('Prepare o runtime nesta máquina antes de usar --offline.');
  await fs.mkdir(cache, { recursive: true });
  const tmp = await fs.mkdtemp(path.join(cache, 'instalando-'));
  try {
    const url = 'https://github.com/astral-sh/uv/releases/download/' + version + '/uv-' + archive;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download de uv retornou HTTP ' + response.status);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (createHash('sha256').update(bytes).digest('hex') !== hash) throw new Error('SHA-256 do runtime divergente.');
    const download = path.join(tmp, archive);
    await fs.writeFile(download, bytes);
    run('tar', ['-xf', download, '-C', tmp]);
    const binary = archive.endsWith('.zip') ? path.join(tmp, exe) : path.join(tmp, 'uv-' + archive.replace('.tar.gz', ''), exe);
    try { await fs.rename(binary, target); } catch (error) { if (!(await executable(target))) throw error; }
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
  return target;
}

async function runPython(args, dependencies, offline) {
  const uv = await acquireUv(offline);
  const options = ['run', '--no-project', '--python', '3.12', ...dependencies.flatMap(pkg => ['--with', pkg])];
  if (offline) options.push('--offline');
  const env = {
    ...process.env,
    UV_NO_CONFIG: '1',
    PYTHONUTF8: '1',
    PYTHONDONTWRITEBYTECODE: '1',
    PYTHONIOENCODING: 'utf-8',
    HF_HUB_DISABLE_TELEMETRY: '1',
  };
  if (offline) env.HF_HUB_OFFLINE = '1';
  run(uv, [...options, 'python', ...args], { env });
}

module.exports = { acquireUv, runPython };
