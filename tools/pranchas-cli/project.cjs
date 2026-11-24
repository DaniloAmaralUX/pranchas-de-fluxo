// Atalho da edição experimental. A versão é preenchida durante o empacotamento.
const {homedir} = require('node:os');
const path = require('node:path');
const entry = path.join(homedir(), '.agents', 'pranchas-runtime', '__PRANCHAS_VERSION__',
  'node_modules', 'pranchas-de-fluxo', 'skills', 'pranchas-de-fluxo', 'scripts', 'entrada.cjs');

async function main() {
  if (!require('node:fs').existsSync(entry)) throw Error('Instale o pacote experimental neste perfil.');
  await require(entry).run(process.argv.slice(2));
}

main().catch(error => {
  process.stderr.write(error.message + '\n');
  process.exitCode = 1;
});
