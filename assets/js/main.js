/* ==========================================================================
   RaufixBaba — bio etkileşimleri
   ========================================================================== */
(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ------------------------------------------------ yıl + saat */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const clockEl = $("#clock");
  const clockFmt = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  });
  function tickClock() {
    if (clockEl) clockEl.textContent = clockFmt.format(new Date());
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ------------------------------------------------ nav */
  const nav = $("#nav");
  const navLinks = $$("[data-nav]");
  const sections = navLinks
    .map((a) => ({ link: a, section: $(a.getAttribute("href")) }))
    .filter((x) => x.section);

  function onScroll() {
    if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 12);
    let current = null;
    sections.forEach(({ section }) => {
      if (section.getBoundingClientRect().top < window.innerHeight * 0.42) current = section.id;
    });
    navLinks.forEach((a) => {
      a.classList.toggle("is-active", a.getAttribute("href") === "#" + current);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* mobil menü */
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
    $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  }
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenu(false);
  });

  /* ------------------------------------------------ scroll reveal */
  const revealTargets = [
    ".sec-head", ".story__gif", ".story__status", ".quote", ".work__row",
    ".cap", ".panel", ".note", ".journey__item", ".contact__intro", ".form"
  ];

  if ("IntersectionObserver" in window && !reduceMotion) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    revealTargets.forEach((sel) => {
      $$(sel).forEach((el, i) => {
        el.classList.add("reveal-init");
        el.style.transitionDelay = `${Math.min(i, 3) * 60}ms`;
        obs.observe(el);
      });
    });
  }

  /* ------------------------------------------------ hikâye yazımı */
  const storyText = $("#storyText");
  const storyParas = storyText ? $$(".typeable", storyText) : [];
  const storyStatus = $("#storyStatusText");
  const storySkip = $("#storySkip");

  let storyStarted = false;
  let storyCancelled = false;
  let storyDone = false;

  storyParas.forEach((p) => { p.dataset.full = p.textContent.trim(); });
  const totalChars = storyParas.reduce((sum, p) => sum + p.dataset.full.length, 0);

  function finishStory() {
    storyCancelled = true;
    storyDone = true;
    storyParas.forEach((p) => {
      p.textContent = p.dataset.full;
      p.classList.remove("is-typing");
      p.classList.add("is-typed");
    });
    if (storyStatus) storyStatus.textContent = "metin tamamlandı";
    if (storySkip) { storySkip.disabled = true; storySkip.textContent = "tamamı görünür"; }
  }

  function startStory() {
    if (storyStarted || storyCancelled) return;
    storyStarted = true;

    if (reduceMotion || !storyParas.length) {
      storyParas.forEach((p) => p.classList.add("is-typed"));
      if (storyStatus) storyStatus.textContent = "metin hazır";
      if (storySkip) storySkip.disabled = true;
      return;
    }

    storyParas.forEach((p) => { p.textContent = ""; });

    let index = 0;
    let startedAt = 0;
    let pauseUntil = 0;
    let typedBefore = 0;

    function frame(now) {
      if (storyCancelled) return;
      if (index >= storyParas.length) {
        storyDone = true;
        if (storyStatus) storyStatus.textContent = "metin tamamlandı";
        if (storySkip) { storySkip.disabled = true; storySkip.textContent = "tamamı görünür"; }
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
        const pct = Math.round(((typedBefore + chars) / totalChars) * 100);
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
      const storyObs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startStory();
            storyObs.disconnect();
          }
        });
      }, { threshold: 0.18 });
      storyObs.observe(storyText);
    } else {
      finishStory();
    }
  }

  /* ------------------------------------------------ yetenek çizgileri */
  const caps = $$(".cap");
  function fillCaps() {
    caps.forEach((cap, i) => {
      const val = Math.min(100, Number(cap.dataset.value || 0));
      const bar = $(".cap__track i", cap);
      if (!bar) return;
      setTimeout(() => { bar.style.width = val + "%"; }, reduceMotion ? 0 : i * 110);
    });
  }

  if (caps.length) {
    if ("IntersectionObserver" in window) {
      const capObs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { fillCaps(); capObs.disconnect(); }
        });
      }, { threshold: 0.25 });
      capObs.observe(caps[0].parentElement || caps[0]);
    } else {
      fillCaps();
    }
  }

  /* ------------------------------------------------ imleç ışığı */
  const glow = $("#cursorLight");
  if (glow && finePointer && !reduceMotion) {
    let gx = window.innerWidth / 2, gy = window.innerHeight / 2;
    let tx = gx, ty = gy;
    window.addEventListener("pointermove", (e) => {
      tx = e.clientX; ty = e.clientY;
      glow.classList.add("is-on");
    }, { passive: true });

    const loop = () => {
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ------------------------------------------------ müzik */
  const audio = $("#themeAudio");
  const musicBtn = $("#musicBtn");
  const player = $("#player");
  const volRange = $("#volRange");
  const hint = $("#soundHint");
  const hintClose = $("#hintClose");

  let musicStarted = false;
  let hintDismissed = false;

  if (audio) {
    audio.volume = 0.42;
    audio.loop = true;
  }

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
    return audio.play()
      .then(() => { musicStarted = true; setPlayingUI(true); return true; })
      .catch(() => { setPlayingUI(false); showHint(); return false; });
  }

  function toggleMusic() {
    if (!audio) return;
    if (audio.paused) playMusic();
    else { audio.pause(); setPlayingUI(false); }
  }

  if (musicBtn) musicBtn.addEventListener("click", toggleMusic);

  if (volRange && audio) {
    const syncVol = () => {
      const v = Math.max(0, Math.min(100, Number(volRange.value)));
      audio.volume = v / 100;
      volRange.style.background =
        `linear-gradient(90deg, var(--sage) ${v}%, rgba(255,255,255,.14) ${v}%)`;
    };
    volRange.addEventListener("input", syncVol);
    syncVol();
  }

  if (hintClose) {
    hintClose.addEventListener("click", (e) => {
      e.stopPropagation();
      hintDismissed = true;
      hideHint();
    });
  }

  // tarayıcı sesli otomatik oynatmayı engeller: ilk kullanıcı etkileşiminde başlat
  setTimeout(() => {
    if (audio && audio.paused && !musicStarted) {
      playMusic().then((ok) => { if (!ok) showHint(); });
    }
  }, 1200);

  const unlockEvents = ["pointerdown", "keydown", "touchstart"];
  function unlockMusic(e) {
    if (musicStarted || hintDismissed) return;
    if (e && e.target && e.target.closest && e.target.closest("#player, #soundHint")) return;
    playMusic().then((ok) => {
      if (ok) unlockEvents.forEach((ev) => window.removeEventListener(ev, unlockMusic));
    });
  }
  unlockEvents.forEach((ev) => window.addEventListener(ev, unlockMusic, { passive: true }));

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && audio && !audio.paused) {
      audio.pause();
      setPlayingUI(false);
    }
  });

  /* ------------------------------------------------ şimşek */
  const flashEl = $("#lightningFlash");
  const svgEl = $("#lightningSvg");
  let audioCtx = null;

  function thunder() {
    if (reduceMotion || !musicStarted) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === "suspended") audioCtx.resume();

      const dur = 1.2;
      const sr = audioCtx.sampleRate;
      const buf = audioCtx.createBuffer(1, Math.floor(sr * dur), sr);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        last = last * 0.95 + white * 0.05;
        data[i] = last * Math.exp(-i / (sr * 0.30)) * 0.9;
      }
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      const lp = audioCtx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 360;
      const g = audioCtx.createGain();
      g.gain.value = 0.35;
      src.connect(lp).connect(g).connect(audioCtx.destination);
      src.start();
    } catch (err) { /* sessiz geç */ }
  }

  function jaggedPath(x1, y1, x2, y2, segments, spread) {
    let d = `M ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    for (let i = 1; i <= segments; i++) {
      const p = i / segments;
      const x = x1 + (x2 - x1) * p + (Math.random() - 0.5) * spread * (1 - p * 0.3);
      const y = y1 + (y2 - y1) * p;
      d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  }

  function strike(force) {
    if (!svgEl || !flashEl) return;
    if (reduceMotion && !force) return;

    let paths = "";
    const bolts = Math.random() < 0.35 ? 2 : 1;
    for (let b = 0; b < bolts; b++) {
      const x1 = 140 + Math.random() * 720;
      const x2 = x1 + (Math.random() - 0.5) * 220;
      const y2 = 380 + Math.random() * 400;
      paths += `<path d="${jaggedPath(x1, -40, x2, y2, 18, 150)}" />`;
      if (Math.random() < 0.7) {
        const by = y2 * (0.3 + Math.random() * 0.35);
        const bx = x1 + (x2 - x1) * (by / y2);
        paths += `<path class="branch" d="${jaggedPath(bx, by, bx + (Math.random() - 0.5) * 300, by + 120 + Math.random() * 160, 10, 120)}" />`;
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
    const wait = 7500 + Math.random() * 9000;
    setTimeout(() => {
      strike(false);
      scheduleStrike();
    }, wait);
  }
  if (!reduceMotion) setTimeout(scheduleStrike, 3200);

  const boltBtn = $("#boltBtn");
  if (boltBtn) boltBtn.addEventListener("click", () => strike(true));

  window.addEventListener("keydown", (e) => {
    const tag = ((e.target && e.target.tagName) || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;
    if (e.key === "l" || e.key === "L") strike(true);
    if (e.key === "Escape") hideHint();
  });

  /* ------------------------------------------------ iletişim formu */
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

  function githubFallback(data) {
    const title = `Bio sitesinden mesaj: ${data.name}`;
    const body = [
      `**Gönderen:** ${data.name}`,
      `**E-posta:** ${data.email}`,
      "",
      "---",
      "",
      data.message
    ].join("\n");
    const url = "https://github.com/RealRaufixBaba/My-Web-Page/issues/new"
      + "?title=" + encodeURIComponent(title)
      + "&body=" + encodeURIComponent(body);

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(`${data.name} <${data.email}>\n\n${data.message}`).catch(() => {});
      }
    } catch (err) { /* yok say */ }

    window.open(url, "_blank", "noopener");
    setStatus("Statik mod: mesaj kopyalandı, GitHub issue taslağı açıldı.", "ok");
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = {
        name: ($("#fName") || {}).value || "",
        email: ($("#fEmail") || {}).value || "",
        message: ($("#fMessage") || {}).value || ""
      };

      $$(".field", form).forEach((f) => f.classList.remove("has-error"));

      const error = validate(data);
      if (error) {
        setStatus(error, "error");
        const firstEmpty = $$(".field input, .field textarea", form).find((i) => !i.value.trim());
        const target = firstEmpty ? firstEmpty.closest(".field") : null;
        if (target) target.classList.add("has-error");
        return;
      }

      const label = submitBtn ? submitBtn.querySelector("span") : null;
      const original = label ? label.textContent : "";
      if (submitBtn) { submitBtn.disabled = true; if (label) label.textContent = "Gönderiliyor..."; }
      setStatus("Paket yolda...", "");

      try {
        const res = await fetch(form.getAttribute("action"), {
          method: "POST",
          headers: { "Accept": "application/json" },
          body: new FormData(form)
        });

        let json = null;
        try { json = await res.json(); } catch (err) { json = null; }

        if (res.ok && json && json.ok) {
          setStatus("Mesaj ulaştı. En kısa sürede dönüş yapacağım.", "ok");
          form.reset();
        } else if (json && json.error) {
          setStatus(json.error, "error");
        } else {
          throw new Error("php yok");
        }
      } catch (err) {
        githubFallback(data);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          if (label) label.textContent = original || "Mesajı gönder";
        }
      }
    });

    $$("#fName, #fEmail, #fMessage").forEach((input) => {
      input.addEventListener("input", () => {
        const field = input.closest(".field");
        if (field) field.classList.remove("has-error");
      });
    });
  }

  /* ------------------------------------------------ konsol */
  try {
    console.log("%cRaufixBaba", "color:#d7a97b;font:600 15px/1.4 serif");
    console.log("%c4 yıl · android · web · minecraft modlama", "color:#9db8a8;font-family:monospace");
    console.log("%cİpucu: 'L' tuşu şimşek çakar.", "color:#8a9199;font-family:monospace");
  } catch (err) { /* yok say */ }
})();
