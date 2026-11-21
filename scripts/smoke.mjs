import fs from "node:fs";
import { JSDOM, VirtualConsole } from "jsdom";

const html = fs.readFileSync("dist/index.html", "utf8");
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => console.error("jsdomError:", e.message));

const dom = new JSDOM(html, {
  url: "https://realraufixbaba.github.io/",
  runScripts: "outside-only",
  pretendToBeVisual: true,
  virtualConsole: vc
});
const w = dom.window;

w.matchMedia = () => ({
  matches: false, media: "", onchange: null,
  addListener() {}, removeListener() {},
  addEventListener() {}, removeEventListener() {},
  dispatchEvent() { return false; }
});
w.IntersectionObserver = class {
  constructor(cb) { this.cb = cb; }
  observe(el) { this.cb([{ isIntersecting: true, target: el, intersectionRatio: 1 }], this); }
  unobserve() {}
  disconnect() {}
};
w.HTMLMediaElement.prototype.play = function () { return Promise.reject(new Error("autoplay blocked")); };
w.HTMLMediaElement.prototype.pause = function () {};
w.requestAnimationFrame = (cb) => setTimeout(() => cb(w.performance.now()), 16);
w.cancelAnimationFrame = (id) => clearTimeout(id);

const js = fs.readFileSync("dist/assets/js/main.js", "utf8");
try {
  w.eval(js);
} catch (e) {
  console.error("CALISTIRMA HATASI:", e.message);
  process.exit(1);
}

setTimeout(() => {
  const d = w.document;
  const paras = d.querySelectorAll(".story__text p");
  const typed = d.querySelectorAll(".story__text p.is-typing, .story__text p.is-typed").length;
  console.log("paragraf:", paras.length, "| yazim basladi:", typed);
  console.log("durum:", (d.querySelector("#storyStatusText") || {}).textContent);
  console.log("muzik aria:", d.querySelector("#musicBtn").getAttribute("aria-pressed"));
  console.log("ipucu:", d.querySelector("#soundHint").className);
  console.log("yil:", d.querySelector("#year").textContent, "| saat:", d.querySelector("#clock").textContent);
  console.log("ilk paragraf:", paras[0].textContent.slice(0, 60) + "...");
  if (!typed) { console.error("HATA: hikaye yazimi baslamadi"); process.exit(1); }
  process.exit(0);
}, 1000);
