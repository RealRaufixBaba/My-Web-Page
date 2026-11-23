(function() {
  "use strict";
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const mq = q => window.matchMedia ? window.matchMedia(q).matches : false;
  const reduceMotion = mq("(prefers-reduced-motion: reduce)");
  const finePointer = mq("(hover: hover) and (pointer: fine)");
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = (new Date).getFullYear();
  const clockEl = $("#clock");
  const clockFmt = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  function tickClock() {
    if (clockEl) clockEl.textContent = clockFmt.format(new Date);
  }
  tickClock();
  setInterval(tickClock, 1e3);
  const nav = $(".nav") || $("#nav");
  const scrollBar = $("#scrollBar");
  function updateBar() {
    if (!scrollBar) return;
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    scrollBar.style.width = (pct * 100).toFixed(2) + "%";
  }
  window.addEventListener("scroll", updateBar, {
    passive: true
  });
  updateBar();
  const liveLine = $("#liveLine");
  const liveLines = [ "derleme alıyorum", "bir GIF daha ekledim", "Android build kovalıyorum", "mod config'iyle boğuşuyorum", "deploy bekliyorum", "yeni bir dil deniyorum" ];
  if (liveLine && !reduceMotion) {
    let li = 0;
    const rotate = () => {
      liveLine.classList.add("is-fade");
      setTimeout(() => {
        li = (li + 1) % liveLines.length;
        liveLine.textContent = liveLines[li];
        liveLine.classList.remove("is-fade");
      }, 320);
    };
    setInterval(rotate, 5200);
  } else if (liveLine) {
    liveLine.textContent = liveLines[0];
  }
  const navLinks = $$("[data-nav]");
  const sections = navLinks.map(a => ({
    link: a,
    section: $(a.getAttribute("href"))
  })).filter(x => x.section);
  function onScroll() {
    if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 12);
    let current = null;
    sections.forEach(({section: section}) => {
      if (section.getBoundingClientRect().top < window.innerHeight * .42) current = section.id;
    });
    navLinks.forEach(a => {
      a.classList.toggle("is-active", a.getAttribute("href") === "#" + current);
    });
  }
  window.addEventListener("scroll", onScroll, {
    passive: true
  });
  onScroll();
  const navToggle = $("#navToggle");
  const menu = $("#mobileMenu");
  function setMenu(open) {
    if (!menu || !navToggle) return;
    menu.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Menüyü kapat" : "Menüyü aç");
    menu.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (navToggle) {
    navToggle.addEventListener("click", () => setMenu(!menu.classList.contains("is-open")));
  }
  if (menu) {
    $$("a", menu).forEach(a => a.addEventListener("click", () => setMenu(false)));
  }
  window.addEventListener("keydown", e => {
    if (e.key === "Escape") setMenu(false);
  });
  const revealTargets = [ ".sec-head", ".story__gif", ".story__status", ".quote", ".work__row", ".cap", ".panel", ".note", ".journey__item", ".contact__intro", ".form", ".project", ".projects__head", ".note-row" ];
  if ("IntersectionObserver" in window && !reduceMotion) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: .12,
      rootMargin: "0px 0px -6% 0px"
    });
    revealTargets.forEach(sel => {
      $$(sel).forEach((el, i) => {
        el.classList.add("reveal-init");
        el.style.transitionDelay = `${Math.min(i, 3) * 60}ms`;
        obs.observe(el);
      });
    });
  }
  const storyText = $("#storyText");
  const storyParas = storyText ? $$(".typeable", storyText) : [];
  const storyStatus = $("#storyStatusText");
  const storySkip = $("#storySkip");
  let storyStarted = false;
  let storyCancelled = false;
  let storyDone = false;
  storyParas.forEach(p => {
    p.dataset.full = p.textContent.trim();
  });
  const totalChars = storyParas.reduce((sum, p) => sum + p.dataset.full.length, 0);
  function finishStory() {
    storyCancelled = true;
    storyDone = true;
    storyParas.forEach(p => {
      p.textContent = p.dataset.full;
      p.classList.remove("is-typing");
      p.classList.add("is-typed");
    });
    if (storyStatus) storyStatus.textContent = "metin tamamlandı";
    if (storySkip) {
      storySkip.disabled = true;
      storySkip.textContent = "tamamı görünür";
    }
  }
  function startStory() {
    if (storyStarted || storyCancelled) return;
    storyStarted = true;
    if (reduceMotion || !storyParas.length) {
      storyParas.forEach(p => p.classList.add("is-typed"));
      if (storyStatus) storyStatus.textContent = "metin hazır";
      if (storySkip) storySkip.disabled = true;
      return;
    }
    storyParas.forEach(p => {
      p.textContent = "";
    });
    let index = 0;
    let startedAt = 0;
    let pauseUntil = 0;
    let typedBefore = 0;
    function frame(now) {
      if (storyCancelled) return;
      if (index >= storyParas.length) {
        storyDone = true;
        if (storyStatus) storyStatus.textContent = "metin tamamlandı";
        if (storySkip) {
          storySkip.disabled = true;
          storySkip.textContent = "tamamı görünür";
        }
        return;
      }
      if (!startedAt) {
        startedAt = now;
        storyParas[index].classList.add("is-typing");
      }
      if (now < pauseUntil) {
        requestAnimationFrame(frame);
        return;
      }
      const p = storyParas[index];
      const full = p.dataset.full;
      const dur = Math.min(2200, Math.max(850, full.length * 7.5));
      const t = Math.min(1, (now - startedAt) / dur);
      const chars = Math.ceil(t * full.length);
      p.textContent = full.slice(0, chars);
      if (storyStatus && (chars % 24 === 0 || t === 1)) {
        const pct = Math.round((typedBefore + chars) / totalChars * 100);
        storyStatus.textContent = "yazılıyor · " + Math.min(99, pct) + "%";
      }
      if (t >= 1) {
        p.classList.remove("is-typing");
        p.classList.add("is-typed");
        typedBefore += full.length;
        index++;
        startedAt = 0;
        pauseUntil = now + 260;
        if (index < storyParas.length) storyParas[index].classList.add("is-typing");
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if (storySkip) {
    storySkip.addEventListener("click", finishStory);
  }
  if (storyText) {
    if ("IntersectionObserver" in window) {
      const storyObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            startStory();
            storyObs.disconnect();
          }
        });
      }, {
        threshold: .18
      });
      storyObs.observe(storyText);
    } else {
      finishStory();
    }
  }
  const caps = $$(".cap");
  function fillCaps() {
    caps.forEach((cap, i) => {
      const val = Math.min(100, Number(cap.dataset.value || 0));
      const bar = $(".cap__track i", cap);
      if (!bar) return;
      setTimeout(() => {
        bar.style.width = val + "%";
      }, reduceMotion ? 0 : i * 110);
    });
  }
  if (caps.length) {
    if ("IntersectionObserver" in window) {
      const capObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            fillCaps();
            capObs.disconnect();
          }
        });
      }, {
        threshold: .25
      });
      capObs.observe(caps[0].parentElement || caps[0]);
    } else {
      fillCaps();
    }
  }
  const glow = $("#cursorLight");
  if (glow && finePointer && !reduceMotion) {
    let gx = window.innerWidth / 2, gy = window.innerHeight / 2;
    let tx = gx, ty = gy;
    window.addEventListener("pointermove", e => {
      tx = e.clientX;
      ty = e.clientY;
      glow.classList.add("is-on");
    }, {
      passive: true
    });
    const loop = () => {
      gx += (tx - gx) * .12;
      gy += (ty - gy) * .12;
      glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
  }
  const audio = $("#themeAudio");
  const musicBtn = $("#musicBtn");
  const player = $("#player");
  const volRange = $("#volRange");
  const hint = $("#soundHint");
  const hintClose = $("#hintClose");
  let musicStarted = false;
  let hintDismissed = false;
  let savedVol = .42;
  try {
    const raw = window.localStorage.getItem("rb-vol");
    if (raw !== null) {
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0 && n <= 100) savedVol = n / 100;
    }
  } catch (err) {}
  const coarse = mq("(pointer: coarse)");
  if (audio) {
    audio.volume = savedVol;
    audio.loop = true;
  }
  if (volRange) volRange.value = String(Math.round(savedVol * 100));
  function setPlayingUI(playing) {
    if (player) player.classList.toggle("is-playing", playing);
    if (musicBtn) musicBtn.setAttribute("aria-pressed", playing ? "true" : "false");
    if (playing) hideHint();
  }
  function showHint() {
    if (!hint || hintDismissed || musicStarted) return;
    hint.classList.add("is-on");
  }
  function hideHint() {
    if (hint) hint.classList.remove("is-on");
  }
  function playMusic() {
    if (!audio) return Promise.resolve(false);
    let attempt = null;
    try {
      attempt = audio.play();
    } catch (err) {
      attempt = null;
    }
    if (!attempt || typeof attempt.then !== "function") {
      musicStarted = true;
      setPlayingUI(true);
      return Promise.resolve(true);
    }
    return attempt.then(() => {
      musicStarted = true;
      setPlayingUI(true);
      return true;
    }).catch(() => {
      setPlayingUI(false);
      showHint();
      return false;
    });
  }
  function toggleMusic() {
    if (!audio) return;
    if (audio.paused) playMusic(); else {
      audio.pause();
      setPlayingUI(false);
    }
  }
  if (musicBtn) musicBtn.addEventListener("click", toggleMusic);
  if (volRange && audio) {
    const syncVol = () => {
      const v = Math.max(0, Math.min(100, Number(volRange.value)));
      audio.volume = v / 100;
      volRange.style.background = `linear-gradient(90deg, var(--sage) ${v}%, rgba(255,255,255,.14) ${v}%)`;
      try {
        window.localStorage.setItem("rb-vol", String(Math.round(v)));
      } catch (err) {}
    };
    volRange.addEventListener("input", syncVol);
    syncVol();
  }
  if (hintClose) {
    hintClose.addEventListener("click", e => {
      e.stopPropagation();
      hintDismissed = true;
      hideHint();
    });
  }
  setTimeout(() => {
    if (!audio || musicStarted) return;
    if (coarse) {
      showHint();
      return;
    }
    if (audio.paused) {
      playMusic().then(ok => {
        if (!ok) showHint();
      });
    }
  }, 1200);
  const unlockEvents = [ "pointerdown", "keydown", "touchstart" ];
  function unlockMusic(e) {
    if (musicStarted || hintDismissed) return;
    if (e && e.target && e.target.closest && e.target.closest("#player, #soundHint")) return;
    playMusic().then(ok => {
      if (ok) unlockEvents.forEach(ev => window.removeEventListener(ev, unlockMusic));
    });
  }
  unlockEvents.forEach(ev => window.addEventListener(ev, unlockMusic, {
    passive: true
  }));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && audio && !audio.paused) {
      audio.pause();
      setPlayingUI(false);
    }
  });
  const flashEl = $("#lightningFlash");
  const svgEl = $("#lightningSvg");
  let audioCtx = null;
  function thunder() {
    if (reduceMotion || !musicStarted) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx;
      if (audioCtx.state === "suspended") audioCtx.resume();
      const dur = 1.2;
      const sr = audioCtx.sampleRate;
      const buf = audioCtx.createBuffer(1, Math.floor(sr * dur), sr);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        last = last * .95 + white * .05;
        data[i] = last * Math.exp(-i / (sr * .3)) * .9;
      }
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      const lp = audioCtx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 360;
      const g = audioCtx.createGain();
      g.gain.value = .35;
      src.connect(lp).connect(g).connect(audioCtx.destination);
      src.start();
    } catch (err) {}
  }
  function jaggedPath(x1, y1, x2, y2, segments, spread) {
    let d = `M ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    for (let i = 1; i <= segments; i++) {
      const p = i / segments;
      const x = x1 + (x2 - x1) * p + (Math.random() - .5) * spread * (1 - p * .3);
      const y = y1 + (y2 - y1) * p;
      d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  }
  function strike(force) {
    if (!svgEl || !flashEl) return;
    if (reduceMotion && !force) return;
    let paths = "";
    const bolts = Math.random() < .35 ? 2 : 1;
    for (let b = 0; b < bolts; b++) {
      const x1 = 140 + Math.random() * 720;
      const x2 = x1 + (Math.random() - .5) * 220;
      const y2 = 380 + Math.random() * 400;
      paths += `<path d="${jaggedPath(x1, -40, x2, y2, 18, 150)}" />`;
      if (Math.random() < .7) {
        const by = y2 * (.3 + Math.random() * .35);
        const bx = x1 + (x2 - x1) * (by / y2);
        paths += `<path class="branch" d="${jaggedPath(bx, by, bx + (Math.random() - .5) * 300, by + 120 + Math.random() * 160, 10, 120)}" />`;
      }
    }
    svgEl.innerHTML = paths;
    svgEl.classList.add("is-on");
    flashEl.classList.remove("is-on");
    void flashEl.offsetWidth;
    flashEl.classList.add("is-on");
    thunder();
    window.setTimeout(() => {
      svgEl.classList.remove("is-on");
      flashEl.classList.remove("is-on");
    }, 900);
  }
  function scheduleStrike() {
    const wait = 7500 + Math.random() * 9e3;
    setTimeout(() => {
      strike(false);
      scheduleStrike();
    }, wait);
  }
  if (!reduceMotion) setTimeout(scheduleStrike, 3200);
  const boltBtn = $("#boltBtn");
  if (boltBtn) boltBtn.addEventListener("click", () => strike(true));
  const liveRegion = $("#liveRegion");
  function announce(msg) {
    if (liveRegion) liveRegion.textContent = msg;
  }
  const filters = $$(".filter");
  const projectCards = $$(".project");
  filters.forEach(btn => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset.filter || "all";
      filters.forEach(b => {
        const on = b === btn;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      let shown = 0;
      projectCards.forEach(card => {
        const match = cat === "all" || card.dataset.cat === cat;
        card.classList.toggle("is-hidden", !match);
        if (match) shown++;
      });
      announce(cat === "all" ? "tüm projeler gösteriliyor" : cat + " projeleri gösteriliyor");
      if (shown) {
        const first = projectCards.find(c => !c.classList.contains("is-hidden"));
        if (first) first.classList.add("is-in");
      }
    });
  });
  const palette = $("#palette");
  const paletteInput = $("#paletteInput");
  const paletteList = $("#paletteList");
  const paletteBtn = $("#paletteBtn");
  const goTo = target => {
    setPalette(false);
    const el = target.startsWith("#") ? $(target) : null;
    if (el) {
      el.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start"
      });
      history.replaceState(null, "", target);
    } else if (target.startsWith("http")) {
      window.open(target, "_blank", "noopener");
    }
  };
  const paletteItems = [
    { k: "bölüm", t: "Hikâye", a: "#hikaye" },
    { k: "bölüm", t: "İşler", a: "#isler" },
    { k: "bölüm", t: "Yetenekler", a: "#yetenekler" },
    { k: "bölüm", t: "Yolculuk", a: "#yolculuk" },
    { k: "bölüm", t: "Notlar", a: "#notlar" },
    { k: "bölüm", t: "Araçlar", a: "#araclar" },
    { k: "bölüm", t: "Sohbet", a: "#sohbet" },
    { k: "bölüm", t: "Notlar", a: "#notlar" },
    { k: "bölüm", t: "İletişim", a: "#iletisim" },
    { k: "araç", t: "AES-GCM şifrele / çöz", a: "#araclar" },
    { k: "araç", t: "Hash ve HMAC", a: "#araclar" },
    { k: "araç", t: "Şifre üretici", a: "#araclar" },
    { k: "proje", t: "RaufixTeam Launcher", a: "https://github.com/RealRaufixBaba/RaufixTeam-Launcher" },
    { k: "proje", t: "CPVP Macros", a: "https://github.com/RealRaufixBaba/CPVP-MACROS-PRO" },
    { k: "proje", t: "DepremAlarm", a: "https://github.com/RealRaufixBaba/DepremAlarm-" },
    { k: "proje", t: "Bu sayfa", a: "#notlar" },
    { k: "komut", t: "Müziği aç / kapat", a: "#music" },
    { k: "komut", t: "Şimşek çak", a: "#bolt" },
    { k: "komut", t: "Başa dön", a: "#top" },
    { k: "komut", t: "Klavye kısayolları", a: "#keys" },
    { k: "link", t: "GitHub profili", a: "https://github.com/RealRaufixBaba" }
  ];
  let paletteIndex = 0;
  let paletteShown = paletteItems;
  function runPalette(item) {
    if (!item) return;
    if (item.a === "#music") {
      setPalette(false);
      toggleMusic();
      announce("müzik durumu değişti");
      return;
    }
    if (item.a === "#bolt") {
      setPalette(false);
      strike(true);
      announce("şimşek çaktı");
      return;
    }
    if (item.a === "#keys") {
      setPalette(false);
      setKeys(true);
      return;
    }
    goTo(item.a);
  }
  function renderPalette(query) {
    if (!paletteList) return;
    const q = (query || "").trim().toLowerCase();
    paletteShown = paletteItems.filter(i => !q || i.t.toLowerCase().includes(q) || i.k.includes(q));
    if (paletteIndex >= paletteShown.length) paletteIndex = 0;
    if (!paletteShown.length) {
      paletteList.innerHTML = '<li class="palette__empty">eşleşen bir şey yok</li>';
      return;
    }
    paletteList.innerHTML = paletteShown.map((item, i) => (
      `<li class="palette__item${i === paletteIndex ? " is-sel" : ""}" role="option" aria-selected="${i === paletteIndex}" data-i="${i}">` +
      `<span class="palette__item-k">${item.k}</span>` +
      `<span class="palette__item-t">${item.t}</span>` +
      `<span class="palette__item-a">↵</span></li>`
    )).join("");
  }
  function movePalette(dir) {
    if (!paletteShown.length) return;
    paletteIndex = (paletteIndex + dir + paletteShown.length) % paletteShown.length;
    renderPalette(paletteInput ? paletteInput.value : "");
    const sel = paletteList ? paletteList.querySelector(".is-sel") : null;
    if (sel && sel.scrollIntoView) sel.scrollIntoView({
      block: "nearest"
    });
  }
  function setPalette(open) {
    if (!palette) return;
    palette.classList.toggle("is-open", open);
    palette.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.classList.toggle("palette-open", open);
    if (open) {
      paletteIndex = 0;
      if (paletteInput) {
        paletteInput.value = "";
        renderPalette("");
        setTimeout(() => paletteInput.focus(), 40);
      }
      announce("arama açıldı");
    }
  }
  if (paletteBtn) paletteBtn.addEventListener("click", () => setPalette(true));
  if (paletteInput) {
    paletteInput.addEventListener("input", () => {
      paletteIndex = 0;
      renderPalette(paletteInput.value);
    });
    paletteInput.addEventListener("keydown", e => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        movePalette(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        movePalette(-1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        runPalette(paletteShown[paletteIndex]);
      }
    });
  }
  if (paletteList) {
    paletteList.addEventListener("click", e => {
      const li = e.target.closest(".palette__item");
      if (li) runPalette(paletteShown[Number(li.dataset.i)]);
    });
  }
  if (palette) {
    palette.addEventListener("click", e => {
      if (e.target === palette) setPalette(false);
    });
  }
  const keysPanel = $("#keysPanel");
  const keysBtn = $("#keysBtn");
  const keysClose = $("#keysClose");
  function setKeys(open) {
    if (!keysPanel) return;
    keysPanel.classList.toggle("is-open", open);
    keysPanel.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.classList.toggle("keys-open", open);
    if (keysBtn) keysBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (keysBtn) keysBtn.addEventListener("click", () => setKeys(!keysPanel.classList.contains("is-open")));
  if (keysClose) keysClose.addEventListener("click", () => setKeys(false));
  if (keysPanel) keysPanel.addEventListener("click", e => {
    if (e.target === keysPanel) setKeys(false);
  });
  window.addEventListener("keydown", e => {
    const tag = (e.target && e.target.tagName || "").toLowerCase();
    const typing = tag === "input" || tag === "textarea";
    const key = (e.key || "").toLowerCase();
    if (key === "escape") {
      setKeys(false);
      setPalette(false);
      hideHint();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && key === "k") {
      e.preventDefault();
      setPalette(true);
      return;
    }
    if (key === "/" && !typing) {
      e.preventDefault();
      setPalette(true);
      return;
    }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (key === "l") strike(true);
    if (key === "k") toggleMusic();
    if (key === "t") window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth"
    });
    if (key === "h" || key === "?") setKeys(true);
    if (key === "k" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setPalette(true);
    }
  });
  const form = $("#contactForm");
  const formStatus = $("#formStatus");
  const submitBtn = $("#formSubmit");
  function setStatus(msg, type) {
    if (!formStatus) return;
    formStatus.textContent = msg;
    formStatus.className = "form__status mono" + (type ? " is-" + type : "");
  }
  function validate(data) {
    if (data.name.trim().length < 2) return "Adın en az 2 karakter olmalı.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim())) return "Geçerli bir e-posta yaz.";
    if (data.message.trim().length < 10) return "Mesaj en az 10 karakter olmalı.";
    return null;
  }
  function staticFallback(data) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(`${data.name} <${data.email}>\n\n${data.message}`).catch(() => {});
      }
    } catch (err) {}
    setStatus("Form şu an kapalı. Mesajın panoya kopyalandı; GitHub profilinden yazabilirsin.", "ok");
  }
  if (form) {
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const data = {
        name: ($("#fName") || {}).value || "",
        email: ($("#fEmail") || {}).value || "",
        message: ($("#fMessage") || {}).value || ""
      };
      $$(".field", form).forEach(f => f.classList.remove("has-error"));
      const error = validate(data);
      if (error) {
        setStatus(error, "error");
        const firstEmpty = $$(".field input, .field textarea", form).find(i => !i.value.trim());
        const target = firstEmpty ? firstEmpty.closest(".field") : null;
        if (target) target.classList.add("has-error");
        return;
      }
      const label = submitBtn ? submitBtn.querySelector("span") : null;
      const original = label ? label.textContent : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        if (label) label.textContent = "Gönderiliyor...";
      }
      setStatus("Paket yolda...", "");
      try {
        const res = await fetch(form.getAttribute("action"), {
          method: "POST",
          headers: {
            Accept: "application/json"
          },
          body: new FormData(form)
        });
        let json = null;
        try {
          json = await res.json();
        } catch (err) {
          json = null;
        }
        if (res.ok && json && json.ok) {
          setStatus("Mesaj ulaştı. En kısa sürede dönüş yapacağım.", "ok");
          form.reset();
        } else if (json && json.error) {
          setStatus(json.error, "error");
        } else {
          throw new Error("php yok");
        }
      } catch (err) {
        staticFallback(data);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          if (label) label.textContent = original || "Mesajı gönder";
        }
      }
    });
    $$("#fName, #fEmail, #fMessage").forEach(input => {
      input.addEventListener("input", () => {
        const field = input.closest(".field");
        if (field) field.classList.remove("has-error");
      });
    });
  }
  try {
    console.log("%cRaufixBaba", "color:#d7a97b;font:600 15px/1.4 serif");
    console.log("%c4 yıl · android · web · minecraft modlama", "color:#9db8a8;font-family:monospace");
    console.log("%cİpucu: Ctrl+K ara, L şimşek, K müzik, H kısayollar.", "color:#8a9199;font-family:monospace");
  } catch (err) {}
})();
