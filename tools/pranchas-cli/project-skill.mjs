import fs from 'node:fs';
import path from 'node:path';

const name = 'pranchas-de-fluxo-beta';
const guide = [
  '---',
  'name: ' + name,
  'description: Transforma reuniões, gravações, transcrições e ideias em desenhos técnicos navegáveis com regras por tela. Use neste projeto para criar ou revisar pranchas a partir de um briefing com a integração experimental Intent e UI SDK.',
  '---',
  '',
  '# Pranchas de fluxo experimentais',
  '',
  'Na raiz deste projeto, execute `node .pranchas-beta/cli.cjs orientacao`. Leia o texto completo que o TanStack Intent devolver.',
  'Siga as instruções com os materiais do usuário. Use o diretório de apoio para scripts e a base informada para os links de documentação que o Intent reescreveu.',
  ''
].join('\n');

export function registerProjectSkill(project, directory) {
  const base = path.resolve(project, directory);
  const relative = path.relative(project, base);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw Error('Diretório de skills fora do projeto.');
  fs.mkdirSync(base, {recursive: true});
  const target = path.join(base, name);
  if (!fs.existsSync(target)) {
    const stage = fs.mkdtempSync(path.join(base, '.pranchas-beta-'));
    try {
      fs.writeFileSync(path.join(stage, 'SKILL.md'), guide);
      try { fs.renameSync(stage, target); }
      catch (error) { if (!fs.existsSync(target)) throw error; }
    } finally {
      fs.rmSync(stage, {recursive: true, force: true});
    }
  }
  if (fs.readFileSync(path.join(target, 'SKILL.md'), 'utf8') !== guide) {
    throw Error('Já existe uma skill com conteúdo diferente em ' + target);
  }
}
