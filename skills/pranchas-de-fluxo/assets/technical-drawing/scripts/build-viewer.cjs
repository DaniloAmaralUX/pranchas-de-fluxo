#!/usr/bin/env node
const fs = require('node:fs'), path = require('node:path');

const {assets, RUNTIME, referenceCamera, load} = require('./config.cjs');
const read = file => fs.readFileSync(file, 'utf8');
const asset = name => read(path.join(assets, name));
const script = source => source.replace(/<\/script/gi, '<\\/script');
const json = value => JSON.stringify(value).replaceAll('<', '\\u003c');

function build(configPath, outputPath) {
  const {config, resolve, modelScripts} = load(configPath);
  if (typeof config.dependencies !== 'string') throw Error('Set dependencies to the folder holding node_modules packages, such as "node_modules"');
  const dependency = file => path.join(resolve(config.dependencies), file);
  const preset = config.evidence ? `globalThis.TechnicalWireframeCamera = Object.freeze(${json(referenceCamera)});\n` : '';
  const worker = preset + [...RUNTIME, ...modelScripts, path.join(assets, 'worker.js')].map(read).join('\n');
  const replacements = {
    __INTER_LICENSE__: script(read(dependency('@fontsource-variable/inter/LICENSE'))),
    __INTER_FONT__: fs.readFileSync(dependency('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')).toString('base64'),
    __DRAWING_DATA__: json(config.drawings),
    __EVIDENCE_DATA__: json((config.evidence || []).map(({id, excerpt}) => ({id, excerpt}))),
    __JSPDF__: script(read(dependency('jspdf/dist/jspdf.umd.min.js'))),
    __SVG2PDF__: script(read(dependency('svg2pdf.js/dist/svg2pdf.umd.min.js'))),
    __WORKER_SOURCE__: json(worker),
    __THEME_SCRIPT__: script(asset('theme.js')),
    __SHEET_SCRIPT__: script(asset('sheet.js')),
    __EXPORT_SCRIPT__: script(asset('export.js')),
    __RENDER_QUEUE_SCRIPT__: script(asset('render-queue.js')),
    __UI_SDK_SCRIPT__: script(asset('ui-sdk.js')),
    __UI_SDK_LICENSE__: script(asset('UI-SDK-LICENSE.txt')),
    __FLOW_ATLAS_CSS__: asset('flow-atlas.css'),
    __FLOW_ATLAS_SCRIPT__: script(asset('gallery.js')),
    __FLOW_ATLAS_LICENSES__: script(asset('FLOW-ATLAS-LICENSES.txt')),
    __VIEWER_SCRIPT__: script(asset('viewer.js'))
  };
  const html = asset('viewer.html').replace(/__[A-Z0-9_]+__/g, key => {
    if (!(key in replacements)) throw Error('Unknown template token ' + key);
    return replacements[key];
  });
  fs.mkdirSync(path.dirname(path.resolve(outputPath)), {recursive: true});
  fs.writeFileSync(outputPath, html);
  return path.resolve(outputPath);
}

if (require.main === module) {
  try {
    if (process.argv.length !== 4) throw Error('Usage: node build-viewer.cjs drawing.json output/index.html');
    console.log(build(process.argv[2], process.argv[3]));
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
module.exports = build;
