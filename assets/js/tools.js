(function() {
  "use strict";
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const out = msg => {
    const el = $("#toolOut");
    if (el) el.textContent = msg;
  };
  const b64 = buf => {
    let s = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  };
  const unb64 = str => {
    const raw = atob(str.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
  };
  const hex = buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  const subtle = window.crypto && window.crypto.subtle;

  async function deriveKey(pass, salt) {
    const base = await subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
    return subtle.deriveKey({
      name: "PBKDF2",
      salt,
      iterations: 150000,
      hash: "SHA-256"
    }, base, {
      name: "AES-GCM",
      length: 256
    }, false, ["encrypt", "decrypt"]);
  }

  function setTab(name) {
    $$(".tool-tab").forEach(t => t.classList.toggle("is-on", t.dataset.tool === name));
    $$(".tool-panel").forEach(p => p.classList.toggle("is-on", p.dataset.tool === name));
    out("");
  }

  $$(".tool-tab").forEach(tab => tab.addEventListener("click", () => setTab(tab.dataset.tool)));

  const aesRun = async mode => {
    const pass = ($("#aesPass") || {}).value || "";
    const text = ($("#aesText") || {}).value || "";
    if (!subtle) return out("bu tarayıcıda kripto yok");
    if (pass.length < 6) return out("şifre en az 6 karakter olmalı");
    if (!text.trim()) return out("metin boş");
    try {
      if (mode === "enc") {
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const key = await deriveKey(pass, salt);
        const ct = await subtle.encrypt({
          name: "AES-GCM",
          iv
        }, key, new TextEncoder().encode(text));
        out("v1." + b64(salt) + "." + b64(iv) + "." + b64(ct));
      } else {
        const parts = text.trim().split(".");
        if (parts.length !== 4 || parts[0] !== "v1") return out("biçim hatalı, v1.… ile başlamalı");
        const key = await deriveKey(pass, unb64(parts[1]));
        const plain = await subtle.decrypt({
          name: "AES-GCM",
          iv: unb64(parts[2])
        }, key, unb64(parts[3]));
        out(new TextDecoder().decode(plain));
      }
    } catch (err) {
      out("çözülemedi: şifre ya da veri hatalı");
    }
  };

  const hashRun = async () => {
    const text = ($("#hashText") || {}).value || "";
    if (!subtle) return out("bu tarayıcıda kripto yok");
    if (!text) return out("metin boş");
    const data = new TextEncoder().encode(text);
    const algos = [ "SHA-256", "SHA-512", "SHA-1" ];
    const lines = [];
    for (const algo of algos) {
      const digest = await subtle.digest(algo, data);
      lines.push(algo.toLowerCase() + ": " + hex(digest));
    }
    out(lines.join("\n"));
  };

  const hmacRun = async () => {
    const keyText = ($("#hmacKey") || {}).value || "";
    const text = ($("#hmacText") || {}).value || "";
    if (!subtle) return out("bu tarayıcıda kripto yok");
    if (!keyText || !text) return out("anahtar ve metin gerekli");
    const key = await subtle.importKey("raw", new TextEncoder().encode(keyText), {
      name: "HMAC",
      hash: "SHA-256"
    }, false, ["sign"]);
    const sig = await subtle.sign("HMAC", key, new TextEncoder().encode(text));
    out(hex(sig));
  };

  const b64Run = mode => {
    const text = ($("#b64Text") || {}).value || "";
    if (!text) return out("metin boş");
    try {
      if (mode === "enc") {
        out(b64(new TextEncoder().encode(text)));
      } else {
        out(new TextDecoder().decode(unb64(text)));
      }
    } catch (err) {
      out("çözülemedi: geçerli base64 değil");
    }
  };

  const jwtRun = () => {
    const token = ($("#jwtText") || {}).value || "";
    const parts = token.trim().split(".");
    if (parts.length < 2) return out("bu bir JWT değil");
    const dec = seg => {
      const padded = seg.replace(/-/g, "+").replace(/_/g, "/");
      const json = new TextDecoder().decode(unb64(padded));
      return JSON.stringify(JSON.parse(json), null, 2);
    };
    try {
      out("header\n" + dec(parts[0]) + "\n\npayload\n" + dec(parts[1]) + "\n\nnot: imza doğrulanmadı");
    } catch (err) {
      out("çözülemedi: bozuk token");
    }
  };

  const uuidRun = () => {
    const n = Math.max(1, Math.min(20, Number(($("#uuidCount") || {}).value) || 1));
    const list = [];
    for (let i = 0; i < n; i++) {
      if (window.crypto && window.crypto.randomUUID) list.push(window.crypto.randomUUID());
      else {
        const b = window.crypto.getRandomValues(new Uint8Array(16));
        b[6] = b[6] & 15 | 64;
        b[8] = b[8] & 63 | 128;
        const h = Array.from(b).map(x => x.toString(16).padStart(2, "0")).join("");
        list.push(h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20));
      }
    }
    out(list.join("\n"));
  };

  const pwRun = () => {
    const len = Math.max(8, Math.min(64, Number(($("#pwLen") || {}).value) || 20));
    const sets = [];
    if ($("#pwLower") && $("#pwLower").checked) sets.push("abcdefghijklmnopqrstuvwxyz");
    if ($("#pwUpper") && $("#pwUpper").checked) sets.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    if ($("#pwDigit") && $("#pwDigit").checked) sets.push("0123456789");
    if ($("#pwSym") && $("#pwSym").checked) sets.push("!@#$%^&*()-_=+[]{};:,.?/");
    if (!sets.length) return out("en az bir karakter grubu seç");
    const all = sets.join("");
    const bytes = window.crypto.getRandomValues(new Uint8Array(len * 2));
    let pw = "";
    let i = 0;
    while (pw.length < len && i < bytes.length) {
      const v = bytes[i++];
      if (v < 256 - 256 % all.length) {
        pw += all[v % all.length];
        continue;
      }
    }
    while (pw.length < len) pw += all[Math.floor(Math.random() * all.length)];
    const pool = sets.map(s => s.length).reduce((a, b) => a + b, 0);
    const entropy = Math.round(len * Math.log2(pool));
    out(pw + "\n\n" + len + " karakter · ~" + entropy + " bit entropi");
  };

  const bind = (id, fn) => {
    const el = $(id);
    if (el) el.addEventListener("click", fn);
  };
  bind("#aesEnc", () => aesRun("enc"));
  bind("#aesDec", () => aesRun("dec"));
  bind("#hashBtn", hashRun);
  bind("#hmacBtn", hmacRun);
  bind("#b64Enc", () => b64Run("enc"));
  bind("#b64Dec", () => b64Run("dec"));
  bind("#jwtBtn", jwtRun);
  bind("#uuidBtn", uuidRun);
  bind("#pwBtn", pwRun);
  const copyBtn = $("#toolCopy");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const el = $("#toolOut");
      if (!el || !el.textContent) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(el.textContent).then(() => {
          copyBtn.textContent = "kopyalandı";
          setTimeout(() => {
            copyBtn.textContent = "kopyala";
          }, 1400);
        }).catch(() => {});
      }
    });
  }
  const lenInput = $("#pwLen");
  const lenOut = $("#pwLenOut");
  if (lenInput && lenOut) {
    const sync = () => {
      lenOut.textContent = lenInput.value;
    };
    lenInput.addEventListener("input", sync);
    sync();
  }
})();
