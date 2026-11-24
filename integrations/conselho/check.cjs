const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const {createHash} = require('node:crypto');
const {consultar} = require('../../skills/pranchas-de-fluxo/scripts/conselho.cjs');

const directory = path.resolve(__dirname, '../../vendor/jakub');
const manifest = require('../../vendor/jakub/manifest.json');
const names = manifest.skills.filter(skill => skill.revision === 'current').map(skill => skill.name);
const quote = 'A gerente devolve o pedido com um motivo.';

async function fixture(t) {
  const job = await fs.mkdtemp(path.join(os.tmpdir(), 'teste-conselho-'));
  t.after(() => fs.rm(job, {recursive: true, force: true, maxRetries: 4}));
  await fs.writeFile(path.join(job, 'briefing.md'), '# F01\n1 | ' + quote + '\n');
  await fs.writeFile(path.join(job, 'HANDOFF.md'), 'Desenhe o fluxo de devolução.');
  return job;
}

const response = name => ({
  especialista: name, status: 'aplicavel', justificativa: 'A devolução exige uma decisão de interface.',
  fontes: [{trecho: quote, local: 'F01 · linha 1'}],
  recomendacoes: [{id: 'r1', proposta: 'Tornar o motivo visível junto da devolução.', fontes: [0]}],
  conflitos: [], pendencias: []
});

test('conselho convoca todos, aguarda, preserva a ordem e só reusa pareceres com hashes válidos', async t => {
  const job = await fixture(t);
  let active = 0, peak = 0;
  const calls = [];
  const run = async ({skill, prompt, output}) => {
    calls.push(skill.name);
    active++;
    peak = Math.max(peak, active);
    assert.ok(prompt.includes(await fs.readFile(path.join(directory, skill.entry), 'utf8')));
    assert.ok(prompt.includes(path.resolve(directory, skill.directory)));
    await new Promise(resolve => setTimeout(resolve, 4));
    const report = response(skill.name);
    if (skill.name === 'afk') {
      Object.assign(report, {status: 'nao_aplicavel', justificativa: 'O escopo se limita à devolução. A ata não descreve trabalho autônomo prolongado.', recomendacoes: []});
    }
    await fs.writeFile(output, JSON.stringify(report)); active--;
  };
  const result = await consultar({job, directory, run});
  assert.deepEqual([...calls].sort(), [...names].sort());
  assert.equal(peak, 4);
  const index = JSON.parse(await fs.readFile(result.indexPath));
  assert.deepEqual(index.pareceres.map(r => r.skill), names);
  for (const row of index.pareceres) {
    const bytes = await fs.readFile(path.join(result.directory, row.arquivo));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), row.sha256);
  }
  const cache = await consultar({job, directory, run: () => { throw Error('cache ignorado'); }});
  assert.deepEqual(cache.reports, result.reports);
  await fs.appendFile(path.join(job, 'conselho', names[0] + '.json'), ' ');
  await assert.rejects(consultar({job, directory, run}), /Parecer alterado/);
});

test('uma fonte inventada bloqueia o lote completo, mesmo depois de repetir o especialista', async t => {
  const job = await fixture(t);
  const calls = [];
  const run = async ({skill, output}) => {
    calls.push(skill.name);
    const report = response(skill.name);
    if (skill.name === 'afk') report.fontes[0].trecho = 'Taxa não presente na ata.';
    await fs.writeFile(output, JSON.stringify(report));
  };
  await assert.rejects(consultar({job, directory, run}), /Consulta incompleta.*afk.*citação/);
  assert.equal(calls.filter(name => name === 'afk').length, 2);
  assert.deepEqual([...new Set(calls)].sort(), [...names].sort());
  await assert.rejects(fs.access(path.join(job,'conselho','indice.json')), {code:'ENOENT'});
});

test('um erro transitório de execução exige uma resposta real na segunda tentativa', async t => {
  const job = await fixture(t);
  let tries = 0;
  const run = async ({skill, output}) => {
    if (skill.name === 'afk' && ++tries === 1) throw Error('Falha do provedor.');
    await fs.writeFile(output, JSON.stringify(response(skill.name)));
  };
  const result = await consultar({job, directory, run});
  assert.equal(tries, 2);
  assert.equal(result.reports.length, names.length);
  await fs.writeFile(path.join(job,'imagem.png'), 'fonte alterada');
  await assert.rejects(consultar({job, directory, run}), /fontes ou a revisão mudaram/);
});

test('processo encerrado sem parecer não libera a orquestração', async t => {
  const job = await fixture(t);
  const run = async ({skill, output}) => {
    if (skill.name !== 'afk') await fs.writeFile(output, JSON.stringify(response(skill.name)));
  };
  await assert.rejects(consultar({job, directory, run}), /Consulta incompleta.*afk/);
  await assert.rejects(fs.access(path.join(job,'conselho','indice.json')), {code:'ENOENT'});
});
