const pendingPreviews = [];
let activePreviews = 0;

function drainPreviews() {
  while (activePreviews < 3 && pendingPreviews.length) {
    const {subject, signal, part, resolve, reject} = pendingPreviews.shift();
    if (signal.aborted) {
      reject(new DOMException('Closed', 'AbortError'));
      continue;
    }
    activePreviews++;
    renderGallerySnapshot(subject, signal, part).then(resolve, reject).finally(() => {
      activePreviews--;
      drainPreviews();
    });
  }
}

function gallerySnapshot(subject, signal, part) {
  return new Promise((resolve, reject) => {
    pendingPreviews.push({subject, signal, part, resolve, reject});
    drainPreviews();
  });
}

// Render with the same geometry, line weights and theme used by the canvas.
async function renderGallerySnapshot(subject, signal, part) {
  const target = structuredClone(states.get(subject.id));
  if (part) target.isolated = null;
  const ink = {...defaultInk(subject), ...preferences[subject.id]};
  const code = JSON.parse($('drawing-worker').textContent);
  const scriptUrl = URL.createObjectURL(new Blob([code], {type:'text/javascript'}));
  const worker = new Worker(scriptUrl);
  URL.revokeObjectURL(scriptUrl);
  return new Promise((resolve, reject) => {
    const cancel = () => finish(() => reject(new DOMException('Closed', 'AbortError')));
    function finish(callback) {
      worker.terminate();
      signal.removeEventListener('abort', cancel);
      callback();
    }
    if (signal.aborted) return cancel();
    signal.addEventListener('abort', cancel, {once:true});
    worker.onerror = event => finish(() => reject(Error(event.message)));
    worker.onmessage = ({data}) => finish(() => {
      try {
        if (data.error) throw Error(data.error);
        const {node, group} = mountGeometry(data.result, subject, target);
        styleGeometry(group, target.preset, resolveInk(ink), ink);
        if (part) {
          for (const layer of group.querySelectorAll('[data-item]')) {
            if (layer.dataset.item !== part.id) layer.setAttribute('opacity', '.28');
          }
        }
        // Reuse the canvas palette and selectors without inserting duplicate live SVG IDs.
        const theme = document.documentElement.dataset.theme;
        const page = getComputedStyle(document.documentElement).getPropertyValue('--page');
        const css = [...document.styleSheets].flatMap(sheet => [...sheet.cssRules])
          .filter(rule => /^(?:#drawing |:root\[data-theme=["']?dark["']?\] #drawing )/.test(rule.selectorText))
          .map(rule => rule.cssText.replace(/:root\[data-theme=["']?dark["']?\] #drawing/g, 'svg[data-theme="dark"]').replaceAll('#drawing ', 'svg '));
        const style = createSvg('style');
        style.textContent = css.join('\n');
        node.prepend(style);
        node.dataset.theme = theme;
        node.style.setProperty('--page', page);
        const image = new XMLSerializer().serializeToString(node);
        resolve(URL.createObjectURL(new Blob([image], {type:'image/svg+xml'})));
      } catch (error) {
        reject(error);
      }
    });
    worker.postMessage({request:1, id:subject.id, parameters:target.params, explosion:target.explosion,
      fitExplosion:previewFit(target.explosion), isolated:target.isolated, fill:hasFill(ink), annotate:target.annotate});
  });
}

if (hasScreenNav) {
  globalThis.mountFlowAtlas($('flow-tools'), {
    drawings, current: () => selected.id, snapshot: gallerySnapshot,
    evidence: new Map(JSON.parse($('flow-evidence').textContent).map(source => [source.id, source.excerpt])),
    select(id, part) {
      if (id !== selected.id) selectDrawing(id, 'pushState');
      if (part) choosePart(part);
    },
    focus(part) {
      if (part) {
        $('parts-panel').showPopover({source: $('parts-toggle')});
        $('part-target').focus({preventScroll:true});
      } else {
        viewport.focus({preventScroll:true});
      }
    },
    rules() { $('screen-caption').focus(); $('screen-caption').click(); },
    ready() { return drawingStatus === 'ready'; },
  });
}
