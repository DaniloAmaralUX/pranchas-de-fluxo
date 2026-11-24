const fs = require('node:fs');
const path = require('node:path');

function initialize(destination) {
  const target = path.resolve(destination);
  const assets = path.resolve(__dirname, '../assets');
  if (fs.existsSync(target)) throw Error('Escolha uma pasta nova: ' + target);
  fs.mkdirSync(target, {recursive: true});
  fs.cpSync(path.join(assets, 'technical-drawing'), path.join(target, 'tools', 'technical-drawing'), {recursive: true});
  for (const name of ['package.json', 'package-lock.json', 'drawing.json', 'model.js', 'modelo-referencia.js', 'briefing.txt']) {
    fs.copyFileSync(path.join(assets, name), path.join(target, name), fs.constants.COPYFILE_EXCL);
  }
  return target;
}

if (require.main === module) {
  try {
    if (process.argv.length !== 3) throw Error('Uso: node init.cjs <pasta-do-projeto>');
    process.stdout.write(initialize(process.argv[2]) + '\n');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

