// Pranchas de fluxo — atalho do projeto para a skill instalada neste perfil.
const { homedir } = require('node:os');
const { join } = require('node:path');
const entry = join(homedir(), '.agents', 'skills', 'pranchas-de-fluxo', 'scripts', 'entrada.cjs');

async function main() {
  if (!require('node:fs').existsSync(entry)) {
    throw Error('Instale pranchas-de-fluxo neste perfil com o pacote .tgz.');
  }
  await require(entry).run(process.argv.slice(2));
}

main().catch(error => {
  process.stderr.write(error.message + '\n');
  process.exitCode = 1;
});
