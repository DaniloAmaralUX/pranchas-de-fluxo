import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { identity, skillName, validateSkill, version } from './intent.mjs';

const distribution = fileURLToPath(new URL('.', import.meta.url));

export function prepareIntent() {
  const providerSkill = path.join(distribution, 'skills', skillName);
  validateSkill(providerSkill);
  const stores = path.join(os.homedir(), '.agents', 'pranchas-runtime');
  const target = path.join(stores, version);
  fs.mkdirSync(stores, {recursive: true, mode: 0o700});
  if (fs.existsSync(target)) return target;
  const staging = fs.mkdtempSync(path.join(stores, '.instalando-'));
  try {
    const modules = path.join(staging, 'node_modules');
    const provider = path.join(modules, skillName);
    fs.mkdirSync(provider, {recursive: true});
    for (const file of ['package.json', 'intent.mjs', 'README.md', 'LICENSE']) {
      fs.copyFileSync(path.join(distribution, file), path.join(provider, file));
    }
    // Keep the actual released skill with all of its relative references outside npx's cache.
    fs.cpSync(providerSkill, path.join(provider, 'skills', skillName), {recursive: true});
    fs.cpSync(path.join(distribution, 'upstream/jakub'), path.join(provider, 'skills', skillName, 'upstream/jakub'), {recursive: true});
    const sdk = fileURLToPath(new URL('../', import.meta.resolve('@tanstack/intent/core')));
    fs.cpSync(sdk, path.join(modules, '@tanstack', 'intent'), {recursive: true});
    const consumer = {private: true, dependencies: {[skillName]: version}, intent: {skills: [identity]}};
    fs.writeFileSync(path.join(staging, 'package.json'), JSON.stringify(consumer, null, 2) + '\n');
    try {
      fs.renameSync(staging, target);
    } catch (error) {
      if (!['EEXIST', 'ENOTEMPTY', 'EPERM'].includes(error.code) || !fs.existsSync(target)) throw error;
    }
    return target;
  } finally {
    fs.rmSync(staging, {recursive: true, force: true});
  }
}
