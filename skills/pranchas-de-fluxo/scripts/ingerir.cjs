#!/usr/bin/env node
'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { runPython } = require('./runtime.cjs');

const formats = {
  text: 'txt md markdown rst adoc log csv tsv json jsonl yaml yml xml toml srt vtt ass',
  rich: 'docx odt html htm rtf',
  pdf: 'pdf',
  image: 'png jpg jpeg webp gif',
  media: 'wav mp3 m4a flac ogg oga opus aac aiff aif mp4 m4v mov mkv webm avi mpeg mpg 3gp flv ts mts m2ts wmv',
};
const kinds = new Map(Object.entries(formats).flatMap(([kind, exts]) => exts.split(' ').map(ext => [ext, kind])));
const help = 'node ingerir.cjs --out PASTA [--stdin] [--model MODELO] [--language pt] [--frames-every SEGUNDOS] [--offline] [--] ARQUIVOS...';

function parse(argv) {
  const opts = { files: [], stdin: false, offline: false, model: 'base', language: 'auto', framesEvery: 10 };
  const values = new Map([['--out', 'out'], ['--model', 'model'], ['--language', 'language'], ['--frames-every', 'framesEvery']]);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--') { opts.files.push(...argv.slice(i + 1)); break; }
    if (arg === '--offline') opts.offline = true;
    else if (arg === '--stdin') opts.stdin = true;
    else if (values.has(arg) && argv[i + 1]) opts[values.get(arg)] = argv[++i];
    else if (arg.startsWith('--')) throw new Error('Opção inválida ou incompleta. ' + help);
    else opts.files.push(arg);
  }
  if (!opts.out || !(opts.stdin || opts.files.length)) throw new Error(help);
  const interval = Number(opts.framesEvery);
  if (!Number.isFinite(interval) || interval < 0.1) throw new Error('--frames-every deve ser pelo menos 0.1 segundo.');
  opts.framesEvery = interval;
  return opts;
}

function decode(buffer) {
  const bom = buffer.subarray(0, 2).toString('hex');
  if (bom === 'fffe' || bom === 'feff') return new TextDecoder(bom === 'fffe' ? 'utf-16le' : 'utf-16be').decode(buffer);
  if (buffer.includes(0)) throw new Error('Documento binário recebido como texto.');
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buffer); }
  catch { return new TextDecoder('windows-1252').decode(buffer); }
}

function numbered(text) {
  if (!text.trim()) throw new Error('A fonte está vazia.');
  return text.replace(/\r\n?/g, '\n').split('\n').map((line, index) => (index + 1) + ' | ' + line).join('\n');
}

function dependencies(entries) {
  const deps = new Set();
  for (const { kind, ext } of entries) {
    if (kind === 'media') {
      deps.add('av==16.0.1');
      deps.add('Pillow==12.1.1');
      deps.add('faster-whisper==1.2.1');
    }
    if (kind === 'pdf') {
      deps.add('pypdfium2==4.30.0');
      deps.add('Pillow==12.1.1');
    }
    if (ext === 'rtf') deps.add('striprtf==0.0.29');
  }
  return [...deps];
}

async function readInputs(opts) {
  const sources = opts.files.map(name => {
    const ext = path.extname(name).slice(1).toLowerCase();
    const kind = kinds.get(ext);
    if (!kind) throw new Error('Formato sem leitor: ' + name + '. Exporte para PDF ou texto.');
    return { name: path.basename(name), file: path.resolve(name), ext, kind };
  });
  if (opts.stdin) {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    sources.push({ name: 'Texto colado', contents: numbered(decode(Buffer.concat(chunks))) });
  }
  for (const source of sources) {
    if (source.file) await fs.access(source.file);
  }
  return sources;
}

async function prepare(sources, directory, opts) {
  const complex = [];
  for (const [index, source] of sources.entries()) {
    source.id = 'F' + String(index + 1).padStart(2, '0');
    if (source.kind === 'text') source.contents = numbered(decode(await fs.readFile(source.file)));
    else if (source.kind === 'image') {
      const name = source.id + '.' + source.ext;
      await fs.copyFile(source.file, path.join(directory, name));
      source.contents = 'Imagem original para inspeção: [' + name + '](' + path.basename(directory) + '/' + name + ')';
    } else if (!source.contents) complex.push(source);
  }
  if (!complex.length) return;
  const job = path.join(directory, 'entrada.json');
  const args = { entries: complex, model: opts.model, language: opts.language, frames_every: opts.framesEvery, offline: opts.offline };
  await fs.writeFile(job, JSON.stringify(args), { mode: 0o600 });
  await runPython([path.join(__dirname, 'extrair.py'), job], dependencies(complex), opts.offline);
  await fs.unlink(job);
  for (const source of complex) {
    const extracted = path.join(directory, source.id + '.md');
    source.contents = await fs.readFile(extracted, 'utf8');
    await fs.unlink(extracted);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) { process.stdout.write(help + '\n'); return; }
  const opts = parse(args);
  const sources = await readInputs(opts);
  const root = path.resolve(opts.out);
  await fs.mkdir(root, { recursive: true, mode: 0o700 });
  const directory = await fs.mkdtemp(path.join(root, 'fontes-'));
  const temp = path.join(root, '.briefing-' + crypto.randomUUID() + '.md');
  try {
    await prepare(sources, directory, opts);
    const sections = sources.map(s => '## ' + s.id + ' · ' + s.name.replace(/[\r\n]/g, ' ') + '\n\n' + s.contents);
    const body = '# Fontes privadas do briefing\n\n' + sections.join('\n\n') + '\n';
    if (!(await fs.readdir(directory)).length) await fs.rmdir(directory);
    await fs.writeFile(temp, body, { mode: 0o600 });
    await fs.rename(temp, path.join(root, 'briefing.md'));
    process.stdout.write(path.join(root, 'briefing.md') + '\n');
  } catch (error) {
    await fs.rm(directory, { force: true, recursive: true });
    await fs.rm(temp, { force: true });
    throw error;
  }
}

main().catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
