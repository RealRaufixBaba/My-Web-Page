/* ==========================================================================
   RaufixBaba — bio sitesi etkileşimleri
   ========================================================================== */
(function () {
  "use strict";

  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer  = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------------------------------------------------------------- yıl / saat */
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

  /* ---------------------------------------------------------------- sayfa yükleme */
  window.addEventListener("load", () => {
    document.body.classList.remove("is-loading");
  });
  setTimeout(() => document.body.classList.remove("is-loading"), 1200);

  /* ---------------------------------------------------------------- hero yazı efekti */
  const roles = [
    "Full-Stack Yazılımcı",
    "Android Geliştirici",
    "Minecraft Modder",
    "Web Mimarı",
    "4 yıldır kod modunda"
  ];
  const typedEl = $("#typed");
  let roleIndex = 0, charIndex = 0, deleting = false;

  function typeLoop() {
    if (!typedEl) return;
    const role = roles[roleIndex];
    if (!deleting) {
      charIndex++;
      typedEl.textContent = role.slice(0, charIndex);
      if (charIndex === role.length) {
        deleting = true;
        setTimeout(typeLoop, 1500);
        return;
      }
      setTimeout(typeLoop, 58 + Math.random() * 50);
    } else {
      charIndex--;
      typedEl.textContent = role.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        setTimeout(typeLoop, 320);
        return;
      }
      setTimeout(typeLoop, 28);
    }
  }
  if (reduceMotion && typedEl) {
    typedEl.textContent = roles[0];
  } else {
    setTimeout(typeLoop, 700);
  }

  /* ---------------------------------------------------------------- terminal */
  const terminal = $("#terminalBody");
  const terminalLines = [
    '<span class="t-cmd">$ whoami</span>',
    '<span class="t-val">raufixbaba</span> <span class="t-dim">// 4 yıldır sahada</span>',
    '<span class="t-cmd">$ skills --list</span>',
    '<span class="t-key">android</span> · <span class="t-key">web</span> · <span class="t-key">minecraft-mod</span>',
    '<span class="t-dim">diller:</span> java kotlin js ts php py c# lua sql',
    '<span class="t-cmd">$ uptime</span>',
    '<span class="t-ok">4 yıl</span> <span class="t-dim">— 7/24 kesintisiz</span>',
    '<span class="t-cmd">$ rivals</span>',
    '<span class="t-val">0 (denk olan yok)</span>',
    '<span class="t-cmd">$ mission</span>',
    '<span class="t-val">ship it. sonra bir daha.</span> <span class="t-dim">█</span>'
  ];

  if (terminal) {
    if (reduceMotion) {
      terminal.innerHTML = terminalLines.join("\n");
    } else {
      let i = 0;
      const writeLine = () => {
        terminal.insertAdjacentHTML("beforeend", terminalLines[i] + "\n");
        i++;
        if (i < terminalLines.length) setTimeout(writeLine, 300 + Math.random() * 220);
      };
      setTimeout(writeLine, 900);
    }
  }

  /* ---------------------------------------------------------------- scroll reveal */
  const revealEls = $$(".reveal");

  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    revealEls.forEach((el, idx) => {
      el.style.transitionDelay = `${Math.min(idx % 4, 3) * 70}ms`;
      revealObs.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------------------------------------------------------------- yetenek barları + sayaçlar */
  const barsWrap = $(".skills__bars");
  function fillBars() {
    $$(".bar", barsWrap).forEach((bar, idx) => {
      const val = Number(bar.dataset.value || 0);
      const fill = $(".bar__track i", bar);
      if (!fill) return;
      setTimeout(() => { fill.style.width = Math.min(val, 100) + "%"; }, reduceMotion ? 0 : idx * 90);
    });
  }

  const heroStats = $(".hero__stats");
  function runCounters() {
    $$("[data-count]", heroStats).forEach((el) => {
      const target = Number(el.dataset.count || 0);
      const suffix = el.dataset.suffix || "";
      if (reduceMotion || target === 0) {
        el.textContent = target + suffix;
        return;
      }
      const dur = 1100;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      };
      requestAnimationFrame(step);
    });
  }

  if ("IntersectionObserver" in window) {
    const once = (el, cb) => {
      if (!el) return;
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { cb(); obs.disconnect(); }
        });
      }, { threshold: 0.2 });
      obs.observe(el);
    };
    once(barsWrap, fillBars);
    once(heroStats, runCounters);
  } else {
    fillBars();
    runCounters();
  }

  /* ---------------------------------------------------------------- nav durumu */
  const nav = $("#nav");
  const navLinks = $$("[data-nav]");
  const sections = navLinks
    .map((a) => ({ link: a, section: $(a.getAttribute("href")) }))
    .filter((x) => x.section);

  function onScroll() {
    if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 24);

    let current = null;
    sections.forEach(({ section }) => {
      const top = section.getBoundingClientRect().top;
      if (top < window.innerHeight * 0.42) current = section.id;
    });
    navLinks.forEach((a) => {
      a.classList.toggle("is-active", a.getAttribute("href") === "#" + current);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------------- müzik */
  const audio = $("#themeAudio");
  const musicBtn = $("#musicBtn");
  const musicIcon = $("#musicIcon");
  const player = $("#player");
  const heroMusicBtn = $("#heroMusicBtn");
  const heroMusicLabel = $("#heroMusicLabel");
  const volRange = $("#volRange");
  const soundHint = $("#soundHint");
  const hintClose = $("#hintClose");

  let musicStarted = false;
  let hintDismissed = false;

  if (audio) {
    audio.volume = 0.45;
    audio.loop = true;
  }

  function setPlayingUI(playing) {
    if (player) player.classList.toggle("is-playing", playing);
    if (musicBtn) musicBtn.setAttribute("aria-pressed", playing ? "true" : "false");
    if (musicIcon) musicIcon.textContent = playing ? "❚❚" : "▶";
    if (heroMusicBtn) heroMusicBtn.classList.toggle("is-playing", playing);
    if (heroMusicLabel) heroMusicLabel.textContent = playing ? "Müzik açık" : "Müziği başlat";
    if (playing) hideHint();
  }

  function hideHint() {
    if (soundHint) soundHint.classList.remove("is-on");
  }

  function showHint() {
    if (!soundHint || hintDismissed || musicStarted) return;
    soundHint.classList.add("is-on");
  }

  function playMusic() {
    if (!audio) return Promise.resolve(false);
    return audio.play()
      .then(() => {
        musicStarted = true;
        setPlayingUI(true);
        return true;
      })
      .catch(() => {
        setPlayingUI(false);
        showHint();
        return false;
      });
  }

  function toggleMusic() {
    if (!audio) return;
    if (audio.paused) playMusic();
    else {
      audio.pause();
      setPlayingUI(false);
    }
  }

  if (musicBtn) musicBtn.addEventListener("click", toggleMusic);
  if (heroMusicBtn) heroMusicBtn.addEventListener("click", toggleMusic);

  if (volRange && audio) {
    volRange.addEventListener("input", () => {
      audio.volume = Math.min(1, Math.max(0, Number(volRange.value) / 100));
      volRange.style.background =
        `linear-gradient(90deg, var(--cyan), rgba(255,255,255,.16) ${volRange.value}%)`;
    });
    volRange.dispatchEvent(new Event("input"));
  }

  if (hintClose) {
    hintClose.addEventListener("click", (e) => {
      e.stopPropagation();
      hintDismissed = true;
      hideHint();
    });
  }

  // tarayıcılar sesli otomatik oynatmayı engeller -> ilk etkileşimde başlat
  setTimeout(() => {
    if (audio && audio.paused && !musicStarted) {
      playMusic().then((ok) => { if (!ok) showHint(); });
    }
  }, 1400);

  const unlockEvents = ["pointerdown", "keydown", "touchstart"];
  function unlockMusic(e) {
    if (musicStarted || hintDismissed) return;
    // müzik kontrolleri kendi tıklama davranışını yönetir
    if (e && e.target && e.target.closest && e.target.closest("#player, #heroMusicBtn, #soundHint")) return;
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

  /* ---------------------------------------------------------------- şimşek */
  const flashEl = $("#lightningFlash");
  const svgEl = $("#lightningSvg");
  const titleEl = $(".glitch");
  let audioCtx = null;

  function thunder() {
    if (reduceMotion || !musicStarted) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === "suspended") audioCtx.resume();

      const dur = 1.1;
      const sr = audioCtx.sampleRate;
      const buf = audioCtx.createBuffer(1, Math.floor(sr * dur), sr);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        last = last * 0.94 + white * 0.06;              // kalın gürültü
        const env = Math.exp(-i / (sr * 0.28));
        data[i] = last * env * 0.9;
      }
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      const lp = audioCtx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 420;
      const g = audioCtx.createGain();
      g.gain.value = 0.55;
      src.connect(lp).connect(g).connect(audioCtx.destination);
      src.start();
    } catch (err) { /* sessiz geç */ }
  }

  function jaggedPath(x1, y1, x2, y2, segments, spread) {
    let d = `M ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    for (let i = 1; i <= segments; i++) {
      const p = i / segments;
      const x = x1 + (x2 - x1) * p + (Math.random() - 0.5) * spread * (1 - p * 0.35);
      const y = y1 + (y2 - y1) * p;
      d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  }

  function strike(force) {
    if (!svgEl || !flashEl) return;
    if (reduceMotion && !force) return;

    // her vuruşta 1 ana + 1-2 dal
    let paths = "";
    const bolts = 1 + (Math.random() < 0.45 ? 1 : 0);
    for (let b = 0; b < bolts; b++) {
      const x1 = 120 + Math.random() * 760;
      const x2 = x1 + (Math.random() - 0.5) * 260;
      const y2 = 420 + Math.random() * 380;
      paths += `<path d="${jaggedPath(x1, -40, x2, y2, 16, 150)}" />`;
      if (Math.random() < 0.8) {
        const by = y2 * (0.35 + Math.random() * 0.3);
        const bx = x1 + (x2 - x1) * (by / y2);
        paths += `<path class="branch" d="${jaggedPath(bx, by, bx + (Math.random() - 0.5) * 320, by + 120 + Math.random() * 180, 9, 110)}" />`;
      }
    }

    svgEl.innerHTML = paths;
    svgEl.classList.add("is-on");
    flashEl.classList.remove("is-on");
    void flashEl.offsetWidth;
    flashEl.classList.add("is-on");

    if (!reduceMotion) {
      document.body.classList.remove("shake");
      void document.body.offsetWidth;
      document.body.classList.add("shake");
      setTimeout(() => document.body.classList.remove("shake"), 300);
    }

    if (titleEl) {
      titleEl.classList.remove("is-glitching");
      void titleEl.offsetWidth;
      titleEl.classList.add("is-glitching");
      setTimeout(() => titleEl.classList.remove("is-glitching"), 400);
    }

    thunder();

    window.setTimeout(() => {
      svgEl.classList.remove("is-on");
      flashEl.classList.remove("is-on");
    }, 950);
  }

  function scheduleStrike() {
    const wait = 6000 + Math.random() * 9000;
    setTimeout(() => {
      strike(false);
      scheduleStrike();
    }, wait);
  }
  if (!reduceMotion) setTimeout(scheduleStrike, 2600);

  const boltBtn = $("#boltBtn");
  if (boltBtn) boltBtn.addEventListener("click", () => strike(true));

  window.addEventListener("keydown", (e) => {
    if (e.key === "l" || e.key === "L") strike(true);
  });

  /* ---------------------------------------------------------------- imleç ışığı + tilt */
  const glow = $("#cursorGlow");
  if (glow && finePointer && !reduceMotion) {
    let gx = window.innerWidth / 2, gy = window.innerHeight / 2;
    let tx = gx, ty = gy;
    window.addEventListener("pointermove", (e) => {
      tx = e.clientX; ty = e.clientY;
      glow.classList.add("is-on");
    }, { passive: true });

    const loop = () => {
      gx += (tx - gx) * 0.14;
      gy += (ty - gy) * 0.14;
      glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  if (finePointer && !reduceMotion) {
    $$("[data-tilt]").forEach((card) => {
      let raf = null;
      const onMove = (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.transform = `perspective(900px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg) translateY(-4px)`;
        });
      };
      const reset = () => {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = "";
      };
      card.addEventListener("pointermove", onMove);
      card.addEventListener("pointerleave", reset);
    });
  }

  /* ---------------------------------------------------------------- iletişim formu */
  const form = $("#contactForm");
  const formStatus = $("#formStatus");
  const submitBtn = $("#formSubmit");

  function setStatus(msg, type) {
    if (!formStatus) return;
    formStatus.textContent = msg;
    formStatus.className = "form__status" + (type ? " is-" + type : "");
  }

  function validate(data) {
    if (data.name.trim().length < 2) return "Adın en az 2 karakter olmalı.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim())) return "Geçerli bir e-posta yaz.";
    if (data.message.trim().length < 10) return "Mesaj biraz kısa — en az 10 karakter.";
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
    setStatus("Statik moddayım: mesajın kopyalandı, GitHub issue formu açıldı.", "ok");
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

      const original = submitBtn ? submitBtn.querySelector("span").textContent : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.querySelector("span").textContent = "Gönderiliyor...";
      }
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
          setStatus("Mesaj ulaştı. En kısa sürede dönüş yapacağım ⚡", "ok");
          form.reset();
        } else if (json && json.error) {
          setStatus(json.error, "error");
        } else {
          throw new Error("php yok");
        }
      } catch (err) {
        // GitHub Pages statik: zarifçe issue'ya yönlendir
        githubFallback(data);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.querySelector("span").textContent = original || "Mesajı gönder";
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

  /* ---------------------------------------------------------------- ufak sürpriz: konsol */
  try {
    console.log("%c> raufixbaba", "color:#2ff0d6;font-weight:700;font-size:14px");
    console.log("%c4 yıl · android · web · minecraft modding · 7/24", "color:#a06cff;font-family:monospace");
    console.log("%cİpucu: 'L' tuşuna bas ⚡", "color:#7dff9b;font-family:monospace");
  } catch (err) { /* yok say */ }
})();
