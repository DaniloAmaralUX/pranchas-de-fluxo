#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';
import { detectAgents } from 'skills';
import { prepareIntent } from './prepare-intent.mjs';
import { registerProjectSkill } from './project-skill.mjs';
import { skillName } from './intent.mjs';

const require = createRequire(import.meta.url);
const source = fileURLToPath(new URL('./skills/pranchas-de-fluxo/', import.meta.url));
const options = process.argv.slice(2);

try {
  if (options.includes('--help') || options.includes('-h')) {
    require(path.join(source, 'scripts', 'entrada.cjs')).help();
  } else {
    const store = prepareIntent();
    const provider = path.join(store, 'node_modules', skillName, 'skills', skillName);
    const cli = require(path.join(provider, 'scripts', 'entrada.cjs'));
    const project = process.cwd();
    await cli.projectLauncher(path.join(project, '.pranchas-beta'));
    const { agents } = await detectAgents();
    const directories = new Set(['.agents/skills', ...agents.map(agent => agent.projectSkillsDir).filter(Boolean)]);
    for (const directory of directories) registerProjectSkill(project, directory);
    process.stdout.write('Skill instalada no projeto: pranchas-de-fluxo-beta\n');
    if (agents.length) process.stdout.write('Agentes detectados: ' + agents.map(agent => agent.name).join(', ') + '\n');
    await cli.run(options);
  }
} catch (error) {
  process.stderr.write('Pranchas de fluxo: ' + error.message + '\n');
  process.exitCode = 1;
}
