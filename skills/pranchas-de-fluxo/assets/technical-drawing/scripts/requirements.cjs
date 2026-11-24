const fs = require('node:fs');
const path = require('node:path');

const characters = new Intl.Segmenter('pt-BR', {granularity: 'grapheme'});
const hasText = value => typeof value === 'string' && Boolean(value.trim());
const normalize = value => value.normalize('NFC').replace(/\s+/gu, ' ').trim();

function checkSources(sources, evidence, used, label) {
  if (!Array.isArray(sources) || !sources.length) throw Error(label + ' precisa de fonte.');
  for (const id of sources) {
    if (!evidence.has(id)) throw Error(label + ' cita uma fonte desconhecida: ' + id);
    used.add(id);
  }
}

function checkRule(rule, partIds, evidence, used, ids, drawingId) {
  if (!rule || !hasText(rule.id) || ids.has(rule.id)) throw Error('Regra sem ID único em ' + drawingId);
  ids.add(rule.id);
  if (![rule.statement, rule.rationale].every(hasText)) throw Error(rule.id + ' precisa de regra e justificativa.');
  if (!Array.isArray(rule.parts) || !rule.parts.length || rule.parts.some(id => !partIds.has(id))) {
    throw Error(rule.id + ' precisa apontar para peças da própria tela.');
  }
  checkSources(rule.sources, evidence, used, rule.id);
}

function validateRequirements(config, base) {
  // Preserve the upstream renderer for standalone illustrations without a user journey.
  if (config.evidence === undefined && !config.drawings.some(d => ['actions', 'flow', 'rules', 'requirement'].some(k => k in d))) return;
  if (!hasText(config.title) || !Array.isArray(config.evidence) || !config.evidence.length) {
    throw Error('Um projeto de requisitos precisa de título e fontes em evidence.');
  }
  const evidence = new Set(), used = new Set(), files = new Map();
  for (const source of config.evidence) {
    if (!source || ![source.id, source.file, source.excerpt].every(hasText) || evidence.has(source.id)) {
      throw Error('Cada evidência precisa de identificação única, arquivo e trecho de origem.');
    }
    evidence.add(source.id);
    const file = path.resolve(base, source.file);
    if (!files.has(file)) files.set(file, normalize(fs.readFileSync(file, 'utf8')));
    if (!files.get(file).includes(normalize(source.excerpt))) throw Error('Trecho não encontrado na fonte: ' + source.id);
  }
  for (const drawing of config.drawings) {
    const req = drawing.requirement;
    if (!hasText(drawing.flow) || !hasText(req) || req !== req.trim() || /[\r\n]/u.test(req) || Array.from(characters.segment(req)).length > 90) {
      throw Error(drawing.id + ' precisa de fluxo e requisito de uma linha com até 90 caracteres.');
    }
    if (!Array.isArray(drawing.rules) || !drawing.rules.length) throw Error('Faltam regras em ' + drawing.id);
    const partIds = new Set(drawing.parts.map(part => part.id)), ids = new Set();
    for (const rule of drawing.rules) checkRule(rule, partIds, evidence, used, ids, drawing.id);
  }
  for (const note of config.scopeNotes || []) {
    if (!hasText(note.statement)) throw Error('A diretriz do projeto precisa de descrição.');
    checkSources(note.sources, evidence, used, 'Diretriz do projeto');
  }
  for (const id of evidence) if (!used.has(id)) throw Error('Fonte sem regra ou diretriz correspondente: ' + id);
  if (config.questions !== undefined && (!Array.isArray(config.questions) || !config.questions.every(hasText))) {
    throw Error('Registre questões em aberto como uma lista de perguntas.');
  }
}

module.exports = {validateRequirements};
