/* ═══════════════════════════════════════════════
   UTILS — extracted from dashboard.js
   Pure helper functions; minimal DOM interaction.
═══════════════════════════════════════════════ */

import { K } from './constants.js';

// ── IndexedDB fallback ────────────────────────────────────────────────────────
// Usado cuando localStorage supera el límite de ~5 MB o está bloqueado.
// La API pública save/load permanece síncrona; IDB opera de forma asíncrona.

const IDB_NAME  = 'apg-fallback';
const IDB_STORE = 'kv';
let _idb = null;

function initIDB() {
  if (_idb) return Promise.resolve(_idb);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
    req.onsuccess = e => { _idb = e.target.result; resolve(_idb); };
    req.onerror   = e => reject(e.target.error);
  });
}

function idbSet(k, v) {
  return initIDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(v, k);
    tx.oncomplete = resolve;
    tx.onerror    = e => reject(e.target.error);
  }));
}

function idbDel(k) {
  return initIDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(k);
    tx.oncomplete = resolve;
    tx.onerror    = e => reject(e.target.error);
  }));
}

function idbGetAll() {
  return initIDB().then(db => new Promise((resolve, reject) => {
    const tx      = db.transaction(IDB_STORE, 'readonly');
    const entries = [];
    const req     = tx.objectStore(IDB_STORE).openCursor();
    req.onsuccess = e => {
      const cursor = e.target.result;
      if (cursor) { entries.push([cursor.key, cursor.value]); cursor.continue(); }
      else resolve(entries);
    };
    req.onerror = e => reject(e.target.error);
  }));
}

// Al arrancar: migrar datos de vuelta de IDB a localStorage si hay espacio libre
;(async function recoverFromIDB() {
  try {
    const entries = await idbGetAll();
    for (const [k, v] of entries) {
      try {
        localStorage.setItem(k, v);
        await idbDel(k);
      } catch(_) { /* localStorage sigue lleno, dejar en IDB */ }
    }
  } catch(_) { /* IDB no disponible en este entorno */ }
})();

// ── Persistence helpers ───────────────────────────────────────────────────────

export function load(k, d) {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : d;
  } catch { return d; }
}

export function save(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch(e) {
    const isQuota = e instanceof DOMException &&
      (e.code === 22 || e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    if (isQuota) {
      // Escritura asíncrona en IDB como fallback (fire-and-forget)
      idbSet(k, JSON.stringify(v)).catch(() => {});
    }
    console.error('localStorage error:', e);
    showToast('Error al guardar los datos', 'error');
  }
}

// ── Estadísticas de almacenamiento ───────────────────────────────────────────

export async function getStorageStats() {
  let lsBytes = 0;
  try {
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        lsBytes += (key.length + (localStorage[key] || '').length) * 2;
      }
    }
  } catch(_) {}
  const localStorageKB = Math.round(lsBytes / 1024);
  let idbKeys = 0;
  let idbKB   = 0;
  try {
    const entries = await idbGetAll();
    idbKeys = entries.length;
    idbKB   = Math.round(
      entries.reduce((acc, [k, v]) => acc + (k.length + (v || '').length) * 2, 0) / 1024
    );
  } catch(_) {}
  return { localStorageKB, idbKeys, idbKB };
}

// ── Value helpers ─────────────────────────────────────────────────────────────

/** Return YYYY-MM-DD for a Date using *local* timezone (avoids UTC shift from toISOString). */
export function localDateStr(d) {
  if (!d) d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export const num = s => parseFloat(String(s||'').replace(/[^0-9.,]/g,'').replace(',','.')) || 0;
export const fmtDate = d => {
  if (!d) return '';
  const x = new Date(d + 'T12:00:00');
  return x.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
};

// ── UI helpers ────────────────────────────────────────────────────────────────

export const flash = id => {
  const e = document.getElementById(id);
  if (!e) return;
  e.classList.add('show');
  setTimeout(() => e.classList.remove('show'), 2200);
};

export function toggleForm(id) {
  // Null-check: evita TypeError si el elemento no existe en el DOM actual
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('open');
}

let _toastTimer;
export function showToast(msg, type) {
  let t = document.getElementById('apg-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'apg-toast';
    document.body.appendChild(t);
  }
  t.className = 'apg-toast' + (type ? ' apg-toast--' + type : '');
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.style.opacity = '0', 3000);
}