#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { detectAgents, installSkills } from 'skills';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const skillName = 'pranchas-de-fluxo';
const source = fileURLToPath(new URL('./skills/pranchas-de-fluxo/', import.meta.url));
const options = process.argv.slice(2);

try {
  if (options.includes('--help') || options.includes('-h')) {
    require(join(source, 'scripts', 'entrada.cjs')).help();
  } else {
    const { agents } = await detectAgents();
    const targets = agents.filter(agent => agent.globalSkillsDir).map(agent => agent.id);
    const result = await installSkills(source, {
      skills: [skillName],
      agents: [...new Set(['universal', ...targets])],
      scope: 'global',
      mode: 'copy',
      telemetry: false,
      lockfile: false
    });
    if (result.failed.length) {
      throw Error(result.failed.map(item => item.agent + ' — ' + item.message).join('\n'));
    }
    const base = resolve(homedir(), '.agents', 'skills', skillName);
    process.stdout.write('Skill instalada em ' + base + '\n');
    const labels = agents.filter(agent => targets.includes(agent.id) && agent.id !== 'universal').map(agent => agent.name);
    if (labels.length) process.stdout.write('Agentes detectados: ' + labels.join(', ') + '\n');
    await require(join(base, 'scripts', 'entrada.cjs')).run(options);
  }
} catch (error) {
  process.stderr.write('Pranchas de fluxo: ' + error.message + '\n');
  process.exitCode = 1;
}
