import Swiper from "swiper";
import { A11y, EffectCoverflow, Keyboard, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";

const $ = id => document.getElementById(id);
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const route = new URL(location.href);
const inCollection = route.pathname.startsWith("/explorar");
const detail = $("detail");
const normalize = text => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const count = n => n + (n === 1 ? " tela" : " telas");
const spotlightIds = [
  "auth/centered-signin", "layouts/canvas-tools", "dashboards/analytics",
  "tables/orders", "auth/glass-signup", "charts/area",
  "layouts/three-pane",
];
let entries, categoryIndex, activeCategory = "", visible = [], sequence = [], position = 0;
let opener, light = false;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function screenshot(entry, options = {}) {
  const img = new Image(entry.previewWidth || 1280, entry.previewHeight || 800);
  img.loading = options.eager ? "eager" : "lazy";
  img.decoding = "async";
  img.alt = "";
  img.src = (options.light && entry.previewLight) || entry.preview;
  return img;
}

function buildHome() {
  const selected = spotlightIds.map(id => entries.find(entry => entry.id === id && entry.preview)).filter(Boolean);
  for (const entry of entries.filter(entry => entry.preview)) {
    if (selected.length >= spotlightIds.length) break;
    if (!selected.includes(entry)) selected.push(entry);
  }
  const viewport = $("featured").querySelector(".swiper");
  const wrapper = viewport.firstElementChild;
  const start = Math.min(2, selected.length - 1);
  if (start < 0) {
    $("featured").hidden = true;
    return;
  }
  for (const [index, entry] of selected.entries()) {
    const slide = element("div", "swiper-slide");
    const link = element("a", "featured-screen");
    link.href = "/explorar/?tela=" + encodeURIComponent(entry.id);
    link.setAttribute("aria-label", "Ver " + entry.title);
    link.append(screenshot(entry, {eager:Math.abs(start - index) <= 1, light:index % 3 !== 0}));
    slide.append(link);
    wrapper.append(slide);
  }
  const swiper = new Swiper(viewport, {
    modules:[A11y, EffectCoverflow, Keyboard, Navigation, Pagination],
    effect:"coverflow", initialSlide:start, centeredSlides:true, slidesPerView:"auto",
    grabCursor:true, speed:reduced.matches ? 0 : 420,
    coverflowEffect:{rotate:40, stretch:0, depth:100, modifier:1, slideShadows:true},
    breakpoints:{0:{spaceBetween:13}, 780:{spaceBetween:24}, 1200:{spaceBetween:31}},
    keyboard:{enabled:true, onlyInViewport:true, pageUpDown:false},
    navigation:{prevEl:$("slide-prev"), nextEl:$("slide-next")},
    pagination:{el:$("slide-dots"), clickable:true},
    a11y:{enabled:true, prevSlideMessage:"Destaque anterior", nextSlideMessage:"Próximo destaque",
      paginationBulletMessage:"Mostrar destaque {{index}}"},
    on:{init:showSpotlight, slideChange:showSpotlight},
  });
  reduced.addEventListener("change", e => {swiper.params.speed = e.matches ? 0 : 420;});
  viewport.addEventListener("click", event => {
    const slide = event.target.closest(".swiper-slide");
    if (!slide || slide.classList.contains("swiper-slide-active") || event.detail === 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    swiper.slideTo(Array.from(wrapper.children).indexOf(slide));
  });
  function showSpotlight(instance) {
    const entry = selected[instance.activeIndex];
    if (!entry) return;
    $("slide-title").textContent = entry.title;
    $("slide-category").textContent = categoryIndex.get(entry.category).title;
  }
}

function buildCategories(categories) {
  const frequencies = new Map(categories.map(category => [category.id, 0]));
  for (const entry of entries) frequencies.set(entry.category, (frequencies.get(entry.category) || 0) + 1);
  for (const category of [{id:"",title:"Todas as telas"}, ...categories]) {
    const button = element("button","category-option");
    const amount = category.id ? frequencies.get(category.id) : entries.length;
    button.type = "button";
    button.dataset.id = category.id;
    button.append(element("span","",category.title),element("span","category-count",String(amount)));
    button.addEventListener("click", () => chooseCategory(category.id));
    $("categories").append(button);
    $("mobile-categories").add(new Option(category.title + " (" + amount + ")", category.id));
  }
}

function chooseCategory(id) {
  activeCategory = id;
  paint();
  window.scrollTo(0,0);
}

function paint() {
  const query = normalize($("search").value.trim());
  visible = entries.filter(entry => {
    const category = categoryIndex.get(entry.category);
    return (!activeCategory || activeCategory === entry.category) &&
      [entry.title, entry.id, category.title, entry.description || ""].some(value => normalize(value).includes(query));
  });
  const category = categoryIndex.get(activeCategory);
  for (const button of $("categories").children) {
    if (button.dataset.id === activeCategory) button.setAttribute("aria-current","true");
    else button.removeAttribute("aria-current");
  }
  $("mobile-categories").value = activeCategory;
  $("category-title").textContent = category?.title || "Todas as telas";
  $("category-description").textContent = category?.description || "";
  $("category-description").hidden = !category?.description;
  $("visible-count").textContent = count(visible.length);
  const grid = $("screens");
  grid.replaceChildren();
  $("empty").hidden = visible.length > 0;
  for (const [i, entry] of visible.entries()) {
    const tile = element("button","tile");
    tile.type = "button";
    tile.dataset.id = entry.id;
    tile.addEventListener("click", () => openDetail(entry, tile));
    const frame = element("span","tile-image");
    if (entry.preview) frame.append(screenshot(entry,{eager:i < 2,light:true}));
    else frame.append(element("span","pending","Em preparação"));
    const title = element("span","tile-title");
    title.append(element("strong","",entry.title),element("span","tile-category",categoryIndex.get(entry.category).title));
    tile.append(frame,title);
    grid.append(tile);
  }
  writeRoute();
}

function writeRoute(entry) {
  if (!inCollection) return;
  const url = new URL(location.href);
  const query = $("search").value.trim();
  for (const [key,value] of [["categoria",activeCategory], ["q",query], ["tela",entry?.id]]) {
    if (value) url.searchParams.set(key,value);
    else url.searchParams.delete(key);
  }
  history.replaceState(null,"",url);
}

function openDetail(entry, trigger) {
  opener = trigger;
  sequence = visible.includes(entry) ? visible : entries;
  position = sequence.indexOf(entry);
  light = !!entry.previewLight;
  detail.showModal();
  paintDetail();
  $("close").focus({preventScroll:true});
}

function paintDetail() {
  const entry = sequence[position];
  const image = $("detail-image");
  const preview = light && entry.previewLight ? entry.previewLight : entry.preview;
  $("detail-title").textContent = entry.title;
  $("detail-category").textContent = categoryIndex.get(entry.category).title;
  $("detail-position").textContent = (position + 1) + " de " + sequence.length;
  if (preview) image.src = preview;
  else image.removeAttribute("src");
  image.alt = entry.title + (light && entry.previewLight ? ", versão clara" : "");
  image.hidden = !preview;
  $("detail-unavailable").hidden = !!preview;
  $("appearance").hidden = !entry.previewLight;
  $("appearance").setAttribute("aria-pressed",String(light));
  $("appearance").setAttribute("aria-label",light ? "Ver versão escura" : "Ver versão clara");
  $("appearance-text").textContent = light ? "Versão escura" : "Versão clara";
  $("open-demo").hidden = !entry.href || entry.status !== "pronto";
  $("open-demo").href = entry.href || "#";
  $("prev").disabled = position === 0;
  $("next").disabled = position === sequence.length - 1;
  writeRoute(entry);
}

function step(delta) {
  const next = position + delta;
  if (next < 0 || next >= sequence.length) return;
  position = next;
  paintDetail();
}

async function init() {
  const response = await fetch("/catalogo/manifest.json");
  if (!response.ok) throw Error("O catálogo local ainda não foi importado.");
  const catalog = await response.json();
  entries = catalog.entries;
  categoryIndex = new Map(catalog.categories.map(category => [category.id, category]));
  if (!inCollection) {
    $("home").hidden = false;
    $("collection-size").textContent = count(entries.length) + " em " + catalog.categories.length + " categorias.";
    buildHome();
    return;
  }
  $("nav-catalog").setAttribute("aria-current","page");
  $("collection").hidden = false;
  buildCategories(catalog.categories);
  activeCategory = categoryIndex.has(route.searchParams.get("categoria")) ? route.searchParams.get("categoria") : "";
  $("search").value = route.searchParams.get("q") || "";
  paint();
  const requested = entries.find(entry => entry.id === route.searchParams.get("tela"));
  if (requested) openDetail(requested, $("screens").querySelector("[data-id=" + CSS.escape(requested.id) + "]"));
}

$("search").addEventListener("input", paint);
$("mobile-categories").addEventListener("change", e => chooseCategory(e.target.value));
$("clear").addEventListener("click", () => {$("search").value = ""; chooseCategory(""); $("search").focus();});
$("close").addEventListener("click", () => detail.close());
$("prev").addEventListener("click", () => step(-1));
$("next").addEventListener("click", () => step(1));
$("appearance").addEventListener("click", () => {light = !light; paintDetail();});
detail.addEventListener("close", () => {
  writeRoute();
  (opener?.isConnected ? opener : $("search")).focus({preventScroll:true});
});
detail.addEventListener("keydown", e => {
  if (e.altKey || e.metaKey || e.ctrlKey || !["ArrowLeft","ArrowRight"].includes(e.key)) return;
  e.preventDefault();
  step(e.key === "ArrowLeft" ? -1 : 1);
});
let finger;
$("detail-media").addEventListener("touchstart", e => {finger = e.touches.length === 1 ? e.touches[0] : null;},{passive:true});
$("detail-media").addEventListener("touchend", e => {
  if (!finger) return;
  const end = e.changedTouches[0], x = end.clientX - finger.clientX, y = end.clientY - finger.clientY;
  finger = null;
  if (Math.abs(x) > 40 && Math.abs(x) > Math.abs(y) * 1.4) step(x > 0 ? -1 : 1);
},{passive:true});

init().catch(error => {
  $("load-error").hidden = false;
  $("load-error").textContent = error.message;
});
