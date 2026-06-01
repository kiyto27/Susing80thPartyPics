/* ===========================================================
   Susing 80th Birthday Photobooth — logica
   =========================================================== */

/* -----------------------------------------------------------
   1) ELENCO DELLE FOTO
   Metti le immagini nella cartella "photos/" accanto ai file
   e scrivi qui sotto i nomi. Se un file manca, viene mostrato
   un segnaposto: appena aggiungi la foto vera, compare da sola.
----------------------------------------------------------- */
const PHOTOS = [
  { src: "photos/1.jpg",  caption: "Valorant" },
  { src: "photos/2.jpg",  caption: "Valorant" },
  { src: "photos/3.jpg",  caption: "Valorant" },
  { src: "photos/4.jpg",  caption: "Valorant" },
  { src: "photos/5.jpg",  caption: "Valorant" }
];

/* Segnaposto eleganti con altezze variabili (per il mosaico). */
const RATIOS = [1.25, 1.5, 1.0, 0.85, 1.35, 1.1];
const TONES  = ["#F3E7D6", "#EFDDC9", "#F1E4D2", "#ECDAC4", "#F4EAD9"];

function placeholder(i, caption){
  const ratio = RATIOS[i % RATIOS.length];
  const w = 600, h = Math.round(w * ratio);
  const tone = TONES[i % TONES.length];
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' width='" + w + "' height='" + h + "'>" +
    "<rect width='100%' height='100%' fill='" + tone + "'/>" +
    "<g transform='translate(" + (w/2) + "," + (h/2 - 30) + ")' fill='none' stroke='#C7A876' stroke-width='4'>" +
    "<rect x='-70' y='-46' width='140' height='100' rx='12'/>" +
    "<circle cx='0' cy='6' r='26'/>" +
    "<rect x='-26' y='-62' width='52' height='14' rx='7' fill='#C7A876' stroke='none'/>" +
    "</g>" +
    "<text x='" + (w/2) + "' y='" + (h/2 + 70) + "' font-family='Georgia,serif' font-size='26' font-style='italic' fill='#A88B5E' text-anchor='middle'>" + caption + "</text>" +
    "</svg>";
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

/* -----------------------------------------------------------
   2) GRIGLIA + comparsa progressiva allo scroll
----------------------------------------------------------- */
const gallery = document.getElementById("gallery");

const io = ("IntersectionObserver" in window)
  ? new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" })
  : null;

PHOTOS.forEach((p, i) => {
  p.fallback = placeholder(i, p.caption);

  const tile = document.createElement("button");
  tile.className = "tile";
  tile.style.transitionDelay = ((i % 4) * 0.07) + "s";
  tile.setAttribute("aria-label", "Apri foto: " + p.caption);

  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = p.caption;
  img.src = p.src;
  img.onerror = () => { img.onerror = null; img.src = p.fallback; };

  const cap = document.createElement("figcaption");
  cap.textContent = p.caption;

  tile.appendChild(img);
  tile.appendChild(cap);
  tile.addEventListener("click", () => openLightbox(i));
  gallery.appendChild(tile);

  if (io) io.observe(tile); else tile.classList.add("in");
});

/* -----------------------------------------------------------
   3) FILMSTRIP (anteprime nella lightbox)
----------------------------------------------------------- */
const filmstrip = document.getElementById("filmstrip");

PHOTOS.forEach((p, i) => {
  const t = document.createElement("button");
  t.className = "thumb";
  t.setAttribute("aria-label", "Vai a: " + p.caption);
  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = p.caption;
  img.src = p.src;
  img.onerror = () => { img.onerror = null; img.src = p.fallback; };
  t.appendChild(img);
  t.addEventListener("click", () => show(i));
  filmstrip.appendChild(t);
});
const thumbs = Array.from(filmstrip.children);

/* -----------------------------------------------------------
   4) LIGHTBOX
----------------------------------------------------------- */
const lb        = document.getElementById("lightbox");
const lbImage   = document.getElementById("lbImage");
const lbText    = document.getElementById("lbText");
const lbCounter = document.getElementById("lbCounter");
let current = 0;

function currentSrc(){
  return lbImage.dataset.real === "ok" ? PHOTOS[current].src : PHOTOS[current].fallback;
}

function show(i){
  current = (i + PHOTOS.length) % PHOTOS.length;
  const p = PHOTOS[current];
  lbImage.alt = p.caption;
  lbImage.dataset.real = "pending";
  lbImage.onerror = () => { lbImage.onerror = null; lbImage.dataset.real = "no"; lbImage.src = p.fallback; };
  lbImage.onload  = () => { if (lbImage.dataset.real === "pending") lbImage.dataset.real = "ok"; };
  lbImage.src = p.src;
  lbText.textContent = p.caption;
  lbCounter.textContent = (current + 1) + " / " + PHOTOS.length;

  thumbs.forEach((t, k) => t.classList.toggle("active", k === current));
  thumbs[current].scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
}

function openLightbox(i){
  show(i);
  lb.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeLightbox(){
  lb.classList.remove("open");
  document.body.style.overflow = "";
}

document.getElementById("lbClose").addEventListener("click", closeLightbox);
document.getElementById("lbPrev").addEventListener("click", () => show(current - 1));
document.getElementById("lbNext").addEventListener("click", () => show(current + 1));
lb.addEventListener("click", e => { if (e.target === lb) closeLightbox(); });

document.addEventListener("keydown", e => {
  if (!lb.classList.contains("open")) return;
  if (e.key === "Escape")     closeLightbox();
  if (e.key === "ArrowLeft")  show(current - 1);
  if (e.key === "ArrowRight") show(current + 1);
});

/* -----------------------------------------------------------
   5) SCARICA
----------------------------------------------------------- */
document.getElementById("lbDownload").addEventListener("click", async () => {
  const src  = currentSrc();
  const real = lbImage.dataset.real === "ok";
  const base = "susing-80-" + PHOTOS[current].caption.toLowerCase().replace(/\s+/g, "-");
  const name = base + (real ? ".jpg" : ".svg");
  try {
    const res  = await fetch(src);
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    triggerDownload(url, name);
    URL.revokeObjectURL(url);
  } catch (err) {
    triggerDownload(src, name);
  }
  toast("Download avviato");
});

function triggerDownload(href, filename){
  const a = document.createElement("a");
  a.href = href; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}

/* -----------------------------------------------------------
   6) CONDIVIDI (Web Share API + fallback copia link)
----------------------------------------------------------- */
document.getElementById("lbShare").addEventListener("click", async () => {
  const p = PHOTOS[current];
  const title = "Susing 80th Birthday Photobooth – " + p.caption;
  const src = currentSrc();

  try {
    if (navigator.canShare) {
      const res  = await fetch(src);
      const blob = await res.blob();
      const file = new File([blob], "susing-80.jpg", { type: blob.type || "image/jpeg" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title });
        return;
      }
    }
  } catch (_) {}

  try {
    if (navigator.share) {
      await navigator.share({ title, text: title, url: location.href });
      return;
    }
  } catch (_) { return; }

  try {
    await navigator.clipboard.writeText(location.href);
    toast("Link copiato negli appunti");
  } catch (_) {
    toast("Copia il link dalla barra del browser");
  }
});

/* -----------------------------------------------------------
   7) TOPBAR allo scroll + torna su
----------------------------------------------------------- */
const topbar = document.getElementById("topbar");
window.addEventListener("scroll", () => {
  if (window.scrollY > 360) topbar.classList.add("visible");
  else topbar.classList.remove("visible");
}, { passive: true });
document.getElementById("topUp").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* -----------------------------------------------------------
   8) TOAST
----------------------------------------------------------- */
let toastTimer;
const toastEl = document.getElementById("toast");
function toast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2500);
}