import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '@tanstack/intent';
import { loadIntentSkill } from '@tanstack/intent/core';

const root = fileURLToPath(new URL('.', import.meta.url));
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
export const skillName = 'pranchas-de-fluxo';
export const identity = pkg.name + '#' + skillName;
export const version = pkg.version;

export function validateSkill(directory) {
  const meta = parseFrontmatter(path.join(directory, 'SKILL.md'));
  if (meta?.name !== skillName || meta.metadata?.library !== pkg.name || meta.metadata?.library_version !== version) {
    throw Error('Nome e versão da skill precisam corresponder ao pacote ' + pkg.name + '@' + version + '.');
  }
}

export function loadGuidance(consumer) {
  const skill = loadIntentSkill(identity, {cwd: consumer, audience: 'agent', global: false});
  const directory = path.join(root, 'skills', skillName);
  if (skill.version !== version || realpathSync(path.resolve(consumer, skill.path)) !== realpathSync(path.join(directory, 'SKILL.md'))) {
    throw Error('O TanStack Intent resolveu uma instalação diferente da versão ' + version + '.');
  }
  validateSkill(directory);
  return {id: identity, version, consumer, directory, content: skill.content};
}
