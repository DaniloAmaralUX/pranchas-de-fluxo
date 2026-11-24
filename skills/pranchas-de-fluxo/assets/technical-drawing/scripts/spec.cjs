#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const {load} = require('./config.cjs');

function spec(config) {
  const titles = new Map(config.drawings.map(d => [d.id, d.title]));
  const lines = ['# ' + config.title, '', config.summary || '', ''];
  for (const drawing of config.drawings) {
    const parts = new Map(drawing.parts.map(p => [p.id, p.name]));
    lines.push('## ' + drawing.flow + ' · ' + drawing.title, '', '**' + drawing.requirement + '**', '', drawing.description, '');
    for (const rule of drawing.rules) {
      lines.push('### ' + rule.id + ' · ' + rule.statement, '', rule.rationale, '',
        'Peças do desenho — ' + rule.parts.map(id => parts.get(id)).join(', '),
        '', 'Origem — ' + rule.sources.join(', '), '');
    }
    if (drawing.actions?.length) {
      lines.push('**Caminhos a testar**', '', ...drawing.actions.map(a => '- ' + a.label + ' → ' + titles.get(a.to)), '');
    }
  }
  if (config.scopeNotes?.length) lines.push('## Diretrizes do projeto', '',
    ...config.scopeNotes.map(note => '- ' + note.statement + ' (' + note.sources.join(', ') + ')'), '');
  if (config.questions?.length) lines.push('## Decisões em aberto', '', ...config.questions.map(q => '- ' + q), '');
  return lines.join('\n');
}

function sourceNotes(config) {
  const lines = ['# Evidências do desenho', '', 'Desenho conceitual de interface. A geometria ilustra hierarquia e comportamento em folha A3 ajustável ao visor.', ''];
  for (const source of config.evidence) {
    lines.push('## ' + source.id, '', 'Arquivo de trabalho — ' + source.file, '',
      ...source.excerpt.split(/\r?\n/).map(line => '> ' + line), '');
  }
  lines.push('## Reproduzir', '', '```sh', 'npm ci',
    'node tools/technical-drawing/scripts/build-viewer.cjs drawing.json dist/index.html',
    'node tools/technical-drawing/scripts/proof.cjs drawing.json proof/',
    'node tools/technical-drawing/scripts/check-viewer.cjs dist/index.html check/ --dark',
    '```', '');
  return lines.join('\n');
}

function generate(configFile, outDir) {
  const {config} = load(configFile);
  if (!config.evidence?.length) throw Error('Este projeto não contém requisitos.');
  fs.mkdirSync(outDir, {recursive: true});
  fs.writeFileSync(path.join(outDir, 'SPEC.md'), spec(config));
  fs.writeFileSync(path.join(outDir, 'evidence.md'), sourceNotes(config));
}

if (require.main === module) {
  try {
    if (process.argv.length !== 4) throw Error('Uso: node spec.cjs drawing.json pasta-de-documentacao');
    generate(process.argv[2], process.argv[3]);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = {generate};
