import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion, useReducedMotion } from "motion/react";
import * as Lightbox from "@ramka/react/lightbox";

const fold = text => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const spring = {type:"spring", stiffness:200, damping:20};
const views = [["fluxos","Fluxos"], ["telas","Telas"], ["elementos","Elementos"]];
const count = (n, singular, plural) => n + " " + (n === 1 ? singular : plural);
const match = (term, ...values) => values.some(value => fold(value || "").includes(term));

function useArt(drawing, snapshot, visible, part) {
  const [result, setResult] = useState({});
  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    let url;
    snapshot(drawing, controller.signal, part).then(image => {
      if (controller.signal.aborted) { URL.revokeObjectURL(image); return; }
      url = image;
      setResult({drawing, url});
    }).catch(error => {
      if (error.name !== "AbortError") setResult({drawing, failed:true});
    });
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
      setResult({});
    };
  }, [drawing, snapshot, visible, part]);
  return visible && result.drawing === drawing ? result : {};
}

function Tile({drawing, part, snapshot, preview, position}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const {url, failed} = useArt(drawing, snapshot, visible, part);
  return <button type="button" className="atlas-card" ref={ref} onClick={e => preview(drawing, e.currentTarget, part)}>
    <span className="atlas-thumbnail">
      {url ? <img src={url} alt="" draggable="false"/> : failed ? <span>Prévia indisponível</span> : null}
      {position && <span className="atlas-step-number" aria-hidden="true">{position}</span>}
    </span>
    <span className="atlas-card-copy"><strong>{part?.name || drawing.title}</strong>
      <small>{part ? drawing.title + " · " + drawing.flow : drawing.requirement}</small></span>
  </button>;
}

function FlowRow({name, list, snapshot, preview, current, id}) {
  const rail = useRef(null);
  const [edges, setEdges] = useState({back:false, next:false});
  useEffect(() => {
    const track = rail.current;
    const update = () => setEdges({
      back: track.scrollLeft > 2,
      next: track.scrollLeft + track.clientWidth < track.scrollWidth - 2,
    });
    const observer = new ResizeObserver(update);
    observer.observe(track);
    track.addEventListener("scroll", update, {passive:true});
    update();
    return () => {observer.disconnect(); track.removeEventListener("scroll", update);};
  }, [list]);
  function shift(direction) {
    const track = rail.current;
    const tile = track.querySelector(".atlas-card");
    const distance = tile.offsetWidth + parseFloat(getComputedStyle(track).columnGap);
    track.scrollBy({left:direction * distance, behavior:matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"});
  }
  return <section className="atlas-row" data-flow-row={id} aria-label={name}>
    <div className="atlas-row-head"><div><h3>{name}</h3><span>{count(list.length, "tela", "telas")}</span></div>
      <div className="atlas-row-controls">
        <button type="button" aria-label={"Recuar em " + name} disabled={!edges.back} onClick={() => shift(-1)}>‹</button>
        <button type="button" aria-label={"Avançar em " + name} disabled={!edges.next} onClick={() => shift(1)}>›</button>
      </div>
    </div>
    <div className="atlas-rail" ref={rail}>{list.map((drawing, i) =>
      <Tile key={drawing.id} drawing={drawing} snapshot={snapshot} preview={preview}
        position={String(i + 1).padStart(2,"0") + (current === drawing.id ? " · Atual" : "")}/>)}</div>
  </section>;
}

// Chánh Đại's Line Nav: 24px resting markers, 40px on active/hover, two intervening ticks.
function LineNav({items, choose}) {
  const reduced = useReducedMotion();
  return <nav className="line-nav" aria-label="Resultados da busca">{items.map((item, index) =>
    <Fragment key={item.drawing.id}>
      <motion.a href={"#" + item.drawing.id} aria-current={item.active ? "page" : undefined}
        initial={false} animate={item.active ? "active" : "normal"} whileHover="hover" whileFocus="hover"
        onClick={event => {event.preventDefault(); choose(item, event.currentTarget);}}>
        <motion.span className="line-marker" aria-hidden="true" variants={{normal:{width:24},active:{width:40},hover:{width:40}}}
          transition={reduced ? {duration:0} : spring}/>
        <span>{item.label}{item.detail && <small>{item.detail}</small>}</span>
      </motion.a>
      {index !== items.length-1 && <div className="line-ticks" aria-hidden="true"><i/><i/></div>}
    </Fragment>)}</nav>;
}

function SlideArt({drawing, snapshot, visible, part}) {
  const {url, failed} = useArt(drawing, snapshot, visible, part);
  return <Lightbox.Zoom><Lightbox.Media width={420} height={297} className="atlas-media">
    {url ? <img src={url} alt={drawing.description} width="420" height="297" draggable="false"/>
      : <span role="status">{visible && (failed ? "Falha ao desenhar a prancha." : "Desenhando a prancha…")}</span>}
  </Lightbox.Media></Lightbox.Zoom>;
}

function Process({drawing, evidence, ready, rules}) {
  const sources = [...new Set(drawing.rules.flatMap(rule => rule.sources))];
  return <details className="atlas-process"><summary>Processo de design</summary>
    <dl><dt>Descobrir</dt>{sources.map(id => <dd key={id}><q>{evidence.get(id)}</q> <cite>{id}</cite></dd>)}
      <dt>Definir</dt><dd>{drawing.requirement}</dd>
      <dt>Desenvolver</dt><dd>{drawing.parts.map(p => p.name).join(" · ")}</dd>
      <dt>Entregar</dt><dd>{ready ? "Prancha renderizada." : "Renderização pendente."} {drawing.actions?.length > 0 &&
        "Percurso para testar: " + drawing.actions.map(a => a.label).join(" · ")}</dd></dl>
    <button type="button" onClick={rules}>Consultar regras da tela</button>
  </details>;
}

function FlowAtlas({api}) {
  const {drawings} = api;
  const groups = useMemo(() => {
    const index = new Map();
    for (const d of drawings) {
      if (!index.has(d.flow)) index.set(d.flow, []);
      index.get(d.flow).push(d);
    }
    return index;
  }, [drawings]);
  const [current, setCurrent] = useState(api.current);
  const [ready, setReady] = useState(api.ready);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("fluxos");
  const [gallery, setGallery] = useState(null);
  const [open, setOpen] = useState(false);
  const focusSource = useRef(null);
  const inDirectory = useRef(false);
  const dialog = useRef(null), search = useRef(null), directoryButton = useRef(null);
  const results = useRef(null), mainScroll = useRef(0), inspect = useRef(null), strip = useRef(null);
  const currentDrawing = drawings.find(d => d.id === current) || drawings[0];
  useEffect(() => {
    const sync = () => setCurrent(api.current());
    const rendered = () => setReady(api.ready());
    document.addEventListener("flow-selection", sync);
    document.addEventListener("flow-render-state", rendered);
    return () => {
      document.removeEventListener("flow-selection", sync);
      document.removeEventListener("flow-render-state", rendered);
    };
  }, [api]);
  function showDirectory() {
    setCurrent(api.current());
    dialog.current.showModal();
    search.current.focus({preventScroll:true});
    results.current.scrollTop = mainScroll.current;
  }
  function preview(drawing, trigger, part) {
    const list = groups.get(drawing.flow);
    inDirectory.current = dialog.current.open;
    if (inDirectory.current) {
      mainScroll.current = results.current.scrollTop;
      dialog.current.close();
    }
    focusSource.current = trigger;
    setGallery({list, index:list.indexOf(drawing), part, origin:drawing.id});
    setOpen(true);
  }
  function finishClose() {
    if (inDirectory.current && !dialog.current.open) {
      dialog.current.showModal();
      results.current.scrollTop = mainScroll.current;
    }
    setGallery(null);
  }
  useEffect(() => {
    if (gallery || !focusSource.current) return;
    const trigger = focusSource.current;
    focusSource.current = null;
    const target = inspect.current;
    inspect.current = null;
    if (target) api.focus(target.part);
    else if (trigger.isConnected) trigger.focus({preventScroll:true});
    else directoryButton.current.focus({preventScroll:true});
  }, [gallery, api]);
  function inspectDrawing(drawing, part) {
    inspect.current = {part:part?.id};
    api.select(drawing.id, part?.id);
    inDirectory.current = false;
  }
  useEffect(() => {
    const selected = strip.current?.querySelector('[aria-current="true"]');
    if (selected) {
      const track = strip.current;
      track.scrollLeft += selected.getBoundingClientRect().left - track.getBoundingClientRect().left - (track.clientWidth - selected.clientWidth) / 2;
    }
  }, [gallery?.index, open]);
  const term = fold(query.trim());
  const found = term ? drawings.filter(d => match(term, d.title, d.flow, d.requirement, ...d.parts.map(part => part.name))) : drawings;
  const foundSet = new Set(found);
  const matchingGroups = [...groups].map(([flow, list], id) => ({flow, id, list:list.filter(d => foundSet.has(d))})).filter(g => g.list.length);
  const elements = mode === "elementos" ? drawings.flatMap(drawing => drawing.parts.filter(part => match(term, part.name))
    .map(part => ({drawing, part}))) : [];
  const entries = term ? found
    .map(d => ({drawing:d, active:d.id === current, label:d.title, detail:d.flow})) :
    [...groups].map(([flow, list]) => ({drawing:list[0], active:flow === currentDrawing.flow, label:flow, detail:list.length + (list.length === 1 ? " tela" : " telas")}));
  const galleryCount = mode === "fluxos" ? count(matchingGroups.length,"fluxo","fluxos")
    : mode === "telas" ? count(found.length,"tela","telas") : count(elements.length,"elemento","elementos");
  const currentSlide = gallery?.list[gallery.index];
  const inspectedPart = currentSlide?.id === gallery?.origin ? gallery?.part : undefined;
  return <>
    <div className="atlas-launchers"><button type="button" className="atlas-menu" aria-haspopup="dialog"
      onClick={showDirectory} ref={directoryButton}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2 5h11M2 10h16M2 15h8"/></svg>Fluxos</button>
      <button type="button" className="atlas-expand" aria-label="Ampliar prancha" title="Ampliar prancha" aria-haspopup="dialog"
        onClick={e => preview(currentDrawing, e.currentTarget)}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8V3h5m4 0h5v5m0 4v5h-5m-4 0H3v-5"/></svg></button></div>
    <dialog className="atlas-sidebar" ref={dialog} aria-label="Explorar fluxos" onClick={e => {
      const rect = dialog.current.getBoundingClientRect();
      if (e.target === dialog.current && (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom)) dialog.current.close();
    }}><div className="atlas-directory">
      <header className="atlas-sidebar-head"><h2>Explorar pranchas</h2>
        <input ref={search} type="search" value={query} aria-label="Buscar telas, fluxos ou elementos" placeholder="Buscar telas, fluxos ou elementos"
          onChange={e => {setQuery(e.target.value); results.current.scrollTop=0;}}/>
        <button type="button" aria-label="Fechar navegação" onClick={() => {mainScroll.current=results.current.scrollTop; dialog.current.close();}}>×</button>
      </header>
      <div className="atlas-modes"><nav aria-label="Visualizações das pranchas">
        {views.map(([id,label]) => <button type="button" key={id} aria-pressed={mode === id}
          onClick={() => {setMode(id); results.current.scrollTop=0;}}>{label}</button>)}
      </nav><span data-gallery-count aria-live="polite">{galleryCount}</span></div>
      <div className="atlas-body" data-mode={mode}>
        <aside className="atlas-index" aria-label="Índice de fluxo" hidden={mode !== "fluxos"}>
          <LineNav items={entries} choose={(item, trigger) => preview(item.drawing, trigger)}/>
          <Process drawing={currentDrawing} evidence={api.evidence} ready={ready} rules={() => {dialog.current.close(); api.rules();}}/>
        </aside>
        <div className="atlas-results" ref={results} onScroll={e => {if (dialog.current.open) mainScroll.current=e.currentTarget.scrollTop;}}>
          {mode === "fluxos" && matchingGroups.map(g => <FlowRow key={g.flow} name={g.flow} id={g.id} list={g.list}
            snapshot={api.snapshot} preview={preview} current={current}/>)}
          {mode === "telas" && <div className="atlas-grid">{found.map(drawing =>
            <Tile key={drawing.id} drawing={drawing} snapshot={api.snapshot} preview={preview}/>)}</div>}
          {mode === "elementos" && <div className="atlas-grid">{elements.map(({drawing,part}) =>
            <Tile key={drawing.id + "/" + part.id} drawing={drawing} part={part} snapshot={api.snapshot} preview={preview}/>)}</div>}
          {(mode === "elementos" ? !elements.length : !found.length) && <p className="atlas-empty" role="status">
            {mode === "elementos" ? "Nenhum elemento encontrado." : "Nenhuma tela encontrada."}
          </p>}
        </div>
      </div>
    </div>
    </dialog>
    {gallery && <Lightbox.Root count={gallery.list.length} open={open} value={gallery.index} viewTransition={false}
      onOpenChange={setOpen} onOpenChangeComplete={isOpen => {if (!isOpen) finishClose();}}
      onValueChange={index => setGallery(g => g && ({...g, index}))}>
      <Lightbox.Portal className="atlas-portal" lang="pt-BR"><Lightbox.Backdrop className="atlas-backdrop"/><Lightbox.Content aria-label="Apresentação do fluxo" className="atlas-lightbox">
        <Lightbox.Slides className="atlas-slides" aria-label={gallery.list[0].flow} aria-roledescription="carrossel">
          {gallery.list.map((drawing, i) => <Lightbox.Slide key={drawing.id} className="atlas-slide">
            <Lightbox.Item index={i} caption={drawing.requirement} aria-roledescription="prancha" aria-label={drawing.title}>
              <SlideArt drawing={drawing} snapshot={api.snapshot} visible={Math.abs(i-gallery.index)<=1}
                part={drawing.id === gallery.origin ? gallery.part : undefined}/>
            </Lightbox.Item>
          </Lightbox.Slide>)}
        </Lightbox.Slides>
        <header className="atlas-head"><span>{gallery.list[gallery.index].flow}</span><div>
          <Lightbox.ZoomOut aria-label="Reduzir ampliação">−</Lightbox.ZoomOut><Lightbox.ZoomIn aria-label="Aumentar ampliação">+</Lightbox.ZoomIn>
          <Lightbox.Close aria-label="Fechar apresentação">×</Lightbox.Close></div></header>
        <Lightbox.Previous className="atlas-prev" aria-label="Prancha anterior">‹</Lightbox.Previous>
        <Lightbox.Next className="atlas-next" aria-label="Próxima prancha">›</Lightbox.Next>
        <footer className="atlas-foot"><div><Lightbox.Counter>{({current,total}) => current + " / " + total}</Lightbox.Counter>
          <strong>{currentSlide.title}</strong></div><Lightbox.Caption/>
          {inspectedPart && <span className="atlas-part-label">Elemento · {inspectedPart.name}</span>}
          <nav className="atlas-strip" aria-label="Telas desta sequência" ref={strip}>
            {gallery.list.map((drawing,index) => <button type="button" key={drawing.id} title={drawing.title} aria-label={drawing.title}
              aria-current={index === gallery.index ? "true" : undefined}
              onClick={() => setGallery(g => ({...g,index}))}>{String(index + 1).padStart(2,"0")}</button>)}
          </nav>
          <Lightbox.Close className="atlas-inspect" onClick={() => inspectDrawing(currentSlide, inspectedPart)}>
            {inspectedPart ? "Inspecionar este elemento" : "Inspecionar esta tela"}
          </Lightbox.Close>
        </footer>
      </Lightbox.Content></Lightbox.Portal>
    </Lightbox.Root>}
  </>;
}

globalThis.mountFlowAtlas = (host, api) => createRoot(host).render(<FlowAtlas api={api}/>);
