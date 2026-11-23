(function() {
  "use strict";
  const $ = (sel, root) => (root || document).querySelector(sel);
  const cfg = window.RB_CHAT || null;
  const list = $("#chatList");
  const statusEl = $("#chatStatus");
  const nameEl = $("#chatName");
  const bodyEl = $("#chatBody");
  const sendBtn = $("#chatSend");
  const countEl = $("#chatCount");
  const noteEl = $("#chatNote");
  const captchaWrap = $("#chatCaptcha");
  const captchaQ = $("#chatCaptchaQ");
  const captchaA = $("#chatCaptchaA");
  const trap = $("#chatTrap");
  if (!list) return;

  const store = {
    get(k) {
      try {
        return window.localStorage.getItem(k);
      } catch (err) {
        return null;
      }
    },
    set(k, v) {
      try {
        window.localStorage.setItem(k, v);
      } catch (err) {}
    },
    del(k) {
      try {
        window.localStorage.removeItem(k);
      } catch (err) {}
    }
  };
  const SESSION_KEY = "rb-chat-session";
  const SENT_KEY = "rb-chat-sent";
  const CAPTCHA_KEY = "rb-chat-ok";
  const BODY_MAX = 220;
  const NAME_MAX = 24;
  const COOLDOWN = 9000;
  const PER_MIN = 5;
  const PER_HOUR = 40;
  let session = null;
  let lastSent = 0;
  let sentLog = [];
  let timer = null;
  let busy = false;
  let seen = {};

  try {
    sentLog = JSON.parse(store.get(SENT_KEY) || "[]").filter(t => Date.now() - t < 3600e3);
  } catch (err) {
    sentLog = [];
  }

  const setStatus = (text, kind) => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = "chat__state mono" + (kind ? " is-" + kind : "");
  };
  const setNote = text => {
    if (noteEl) noteEl.textContent = text || "";
  };

  const ready = () => Boolean(cfg && cfg.url && cfg.anonKey && cfg.table);
  if (!ready()) {
    setStatus("kurulum bekliyor", "wait");
    setNote("sohbet motoru henüz bağlanmadı. bağlanana kadar yazma kapalı.");
    [ nameEl, bodyEl, sendBtn ].forEach(el => {
      if (el) el.disabled = true;
    });
    return;
  }

  const headers = (token, extra) => Object.assign({
    apikey: cfg.anonKey,
    Authorization: "Bearer " + (token || cfg.anonKey),
    "Content-Type": "application/json"
  }, extra || {});

  async function call(path, opts) {
    const res = await fetch(cfg.url.replace(/\/$/, "") + path, opts);
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (err) {
      json = null;
    }
    if (!res.ok) {
      const err = new Error((json && (json.message || json.msg || json.error_description)) || "http " + res.status);
      err.status = res.status;
      err.payload = json;
      throw err;
    }
    return json;
  }

  function loadSession() {
    try {
      const raw = store.get(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || !s.access_token) return null;
      return s;
    } catch (err) {
      return null;
    }
  }

  function saveSession(s) {
    if (!s || !s.access_token) return;
    const payload = {
      access_token: s.access_token,
      refresh_token: s.refresh_token || "",
      expires_at: Date.now() + (Number(s.expires_in || 3600) - 60) * 1000,
      user_id: (s.user && s.user.id) || s.user_id || ""
    };
    session = payload;
    store.set(SESSION_KEY, JSON.stringify(payload));
  }

  async function refresh() {
    if (!session || !session.refresh_token) return false;
    try {
      const json = await call("/auth/v1/token?grant_type=refresh_token", {
        method: "POST",
        headers: headers(null),
        body: JSON.stringify({
          refresh_token: session.refresh_token
        })
      });
      saveSession(json);
      return true;
    } catch (err) {
      session = null;
      store.del(SESSION_KEY);
      return false;
    }
  }

  async function signInAnonymous() {
    const json = await call("/auth/v1/signup", {
      method: "POST",
      headers: headers(null),
      body: "{}"
    });
    if (!json || !json.access_token) throw new Error("anonim giriş kapalı");
    saveSession(json);
    return true;
  }

  async function ensureSession() {
    session = loadSession();
    if (session && session.expires_at > Date.now()) return true;
    if (session) {
      const ok = await refresh();
      if (ok) return true;
    }
    return signInAnonymous();
  }

  function render(rows) {
    if (!list) return;
    list.textContent = "";
    if (!rows.length) {
      const empty = document.createElement("li");
      empty.className = "chat__empty mono";
      empty.textContent = "henüz mesaj yok. ilk yazan sen ol.";
      list.appendChild(empty);
      return;
    }
    rows.forEach(row => {
      const li = document.createElement("li");
      li.className = "chat__row";
      if (!seen[row.id]) {
        seen[row.id] = true;
        li.classList.add("is-new");
      }
      const av = document.createElement("span");
      av.className = "chat__av";
      av.textContent = (row.name || "?").trim().charAt(0).toUpperCase();
      const main = document.createElement("div");
      main.className = "chat__main";
      const head = document.createElement("div");
      head.className = "chat__head";
      const nm = document.createElement("b");
      nm.className = "chat__name";
      nm.textContent = row.name || "";
      const tm = document.createElement("span");
      tm.className = "mono chat__time";
      const d = new Date(row.created_at);
      tm.textContent = isNaN(d) ? "" : d.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit"
      });
      head.appendChild(nm);
      head.appendChild(tm);
      const body = document.createElement("p");
      body.className = "chat__body";
      body.textContent = row.body || "";
      main.appendChild(head);
      main.appendChild(body);
      li.appendChild(av);
      li.appendChild(main);
      list.appendChild(li);
    });
    list.scrollTop = list.scrollHeight;
  }

  let fetching = false;
  async function load() {
    if (fetching || busy) return;
    fetching = true;
    try {
      await ensureSession();
      const rows = await call("/rest/v1/" + cfg.table + "?select=id,name,body,created_at&order=created_at.asc&limit=80", {
        headers: headers(session && session.access_token)
      });
      render(rows || []);
      setStatus("bağlı · " + (rows || []).length + " mesaj", "ok");
    } catch (err) {
      setStatus("bağlantı yok", "err");
      setNote(err.status === 401 || err.status === 403 ? "yetki reddedildi, yapılandırmayı kontrol et" : "sunucuya ulaşılamıyor, tekrar denenecek");
    } finally {
      fetching = false;
    }
  }

  function startPolling() {
    if (timer) return;
    load();
    timer = setInterval(() => {
      if (!document.hidden) load();
    }, 5000);
  }
  function stopPolling() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
  if ("IntersectionObserver" in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) startPolling();
        else stopPolling();
      });
    }, {
      threshold: 0.1
    });
    obs.observe(list);
  } else {
    startPolling();
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !timer) startPolling();
  });

  const newCaptcha = () => {
    if (!captchaWrap || !captchaQ) return;
    if (store.get(CAPTCHA_KEY) === "1") {
      captchaWrap.hidden = true;
      return;
    }
    const a = 2 + Math.floor(Math.random() * 8);
    const b = 2 + Math.floor(Math.random() * 8);
    captchaWrap.hidden = false;
    captchaWrap.dataset.sum = String(a + b);
    captchaQ.textContent = a + " + " + b + " = ?";
    if (captchaA) captchaA.value = "";
  };
  newCaptcha();

  const guardText = (text) => {
    if (text.length < 2) return "mesaj çok kısa";
    if (text.length > BODY_MAX) return "mesaj " + BODY_MAX + " karakteri geçiyor";
    if (/(.)\1{9,}/.test(text)) return "aynı harf tekrarı spam sayılıyor";
    if (text.replace(/[^A-ZÇĞİÖŞÜ]/g, "").length > 24 && text.replace(/[^A-ZÇĞİÖŞÜ]/g, "").length / text.length > 0.8) return "hepsi büyük harf, biraz sakin";
    const links = text.match(/https?:\/\//gi);
    if (links && links.length > 1) return "tek mesajda en fazla bir link";
    if (/[<>]{1}/.test(text)) return "açılı parantez kullanma";
    return null;
  };

  const guardRate = () => {
    const now = Date.now();
    if (now - lastSent < COOLDOWN) {
      const wait = Math.ceil((COOLDOWN - (now - lastSent)) / 1000);
      return wait + " saniye bekle, spam sayılmaz";
    }
    sentLog = sentLog.filter(t => now - t < 3600e3);
    if (sentLog.filter(t => now - t < 60e3).length >= PER_MIN) return "dakikada " + PER_MIN + " mesaj sınırı";
    if (sentLog.length >= PER_HOUR) return "saatlik sınırı doldurdun";
    return null;
  };

  if (countEl && bodyEl) {
    const sync = () => {
      countEl.textContent = bodyEl.value.length + "/" + BODY_MAX;
      countEl.classList.toggle("is-warn", bodyEl.value.length > BODY_MAX - 20);
    };
    bodyEl.addEventListener("input", sync);
    sync();
  }

  const friendly = (err) => {
    const msg = ((err && (err.payload && err.payload.message || err.message)) || "").toLowerCase();
    if (msg.includes("cok hizli")) return "çok hızlı yazıyorsun, biraz bekle";
    if (msg.includes("dakika")) return "dakikalık mesaj sınırı doldu";
    if (msg.includes("tekrar")) return "aynı mesajı tekrar göndermeyelim";
    if (msg.includes("link")) return "tek mesajda birden fazla link yok";
    if (msg.includes("spam")) return "spam filtresi takıldı";
    if (msg.includes("row-level") || err.status === 401 || err.status === 403) return "yazma izni yok, anonim giriş açık mı?";
    if (err.status === 429) return "çok istek attın, biraz bekle";
    return "gönderilemedi, sonra tekrar dene";
  };

  async function send() {
    if (busy) return;
    if (trap && trap.value) return;
    const name = (nameEl ? nameEl.value : "").trim().replace(/\s+/g, " ");
    const body = (bodyEl ? bodyEl.value : "").trim();
    if (name.length < 2) return setNote("isim en az 2 karakter");
    if (name.length > NAME_MAX) return setNote("isim en fazla " + NAME_MAX + " karakter");
    if (/https?:\/\//i.test(name)) return setNote("isme link yazmak yok");
    if (guardText(body)) return setNote(guardText(body));
    if (guardRate()) return setNote(guardRate());
    if (captchaWrap && !captchaWrap.hidden) {
      const given = Number((captchaA && captchaA.value) || NaN);
      if (given !== Number(captchaWrap.dataset.sum)) {
        newCaptcha();
        return setNote("kontrol sorusu yanlış, tekrar dene");
      }
      store.set(CAPTCHA_KEY, "1");
      captchaWrap.hidden = true;
    }
    busy = true;
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.textContent = "gönderiliyor";
    }
    setNote("");
    try {
      await ensureSession();
      await call("/rest/v1/" + cfg.table, {
        method: "POST",
        headers: headers(session && session.access_token, {
          Prefer: "return=minimal"
        }),
        body: JSON.stringify([ {
          name,
          body,
          user_id: session && session.user_id
        } ])
      });
      lastSent = Date.now();
      sentLog.push(lastSent);
      store.set(SENT_KEY, JSON.stringify(sentLog));
      if (bodyEl) bodyEl.value = "";
      if (countEl) countEl.textContent = "0/" + BODY_MAX;
      store.set("rb-chat-name", name);
      setNote("gitti");
      await load();
      setTimeout(() => setNote(""), 2500);
    } catch (err) {
      setNote(friendly(err));
    } finally {
      busy = false;
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = "gönder";
      }
    }
  }

  if (sendBtn) sendBtn.addEventListener("click", send);
  if (bodyEl) {
    bodyEl.addEventListener("keydown", e => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        send();
      }
    });
  }
  const savedName = store.get("rb-chat-name");
  if (savedName && nameEl) nameEl.value = savedName;
})();
