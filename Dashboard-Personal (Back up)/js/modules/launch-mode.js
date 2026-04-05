/* ═══════════════════════════════════════════════
   MODO LANZAMIENTO — extracted from dashboard.js
   Clave localStorage: K.launch
   Estructura: {enabled, title, launchDateTime, checklist:[{id,text,done}], dayKpis:{units,nps,incidents}, postReview:{wentWell,improve,notes}, updatedAt}
═══════════════════════════════════════════════ */

import { K } from '../core/constants.js';
import { load, save, esc, showToast } from '../core/utils.js';

export let _launchCountdownInterval = null;

export function openLaunchModal() {
  const overlay = document.getElementById('launch-modal-overlay');
  if (overlay) overlay.classList.add('open');
  renderLaunchModal();
  startLaunchCountdown();
}

export function closeLaunchModal() {
  const overlay = document.getElementById('launch-modal-overlay');
  if (overlay) overlay.classList.remove('open');
  stopLaunchCountdown();
}

export function renderLaunchModal() {
  const d = load(K.launch, {});
  const set = (id, val) => { const e = document.getElementById(id); if (e) e.value = val ?? ''; };
  const setChecked = (id, val) => { const e = document.getElementById(id); if (e) e.checked = !!val; };
  setChecked('launch-enabled', d.enabled || false);
  set('launch-title',          d.title || '');
  set('launch-datetime',       d.launchDateTime || '');
  set('launch-kpi-units',      (d.dayKpis || {}).units || '');
  set('launch-kpi-nps',        (d.dayKpis || {}).nps   || '');
  set('launch-kpi-incidents',  (d.dayKpis || {}).incidents || '');
  set('launch-review-well',    (d.postReview || {}).wentWell || '');
  set('launch-review-improve', (d.postReview || {}).improve  || '');
  set('launch-review-notes',   (d.postReview || {}).notes    || '');
  renderLaunchChecklist(d.checklist || []);
  updateLaunchCountdownDisplay();
}

export function saveLaunch() {
  const d = load(K.launch, {});
  save(K.launch, {
    enabled:        document.getElementById('launch-enabled')?.checked || false,
    title:          document.getElementById('launch-title')?.value.trim() || '',
    launchDateTime: document.getElementById('launch-datetime')?.value || '',
    checklist:      d.checklist || [],
    dayKpis: {
      units:     parseInt(document.getElementById('launch-kpi-units')?.value     || 0),
      nps:       parseInt(document.getElementById('launch-kpi-nps')?.value       || 0),
      incidents: parseInt(document.getElementById('launch-kpi-incidents')?.value || 0),
    },
    postReview: {
      wentWell: document.getElementById('launch-review-well')?.value.trim()    || '',
      improve:  document.getElementById('launch-review-improve')?.value.trim() || '',
      notes:    document.getElementById('launch-review-notes')?.value.trim()   || '',
    },
    updatedAt: new Date().toISOString(),
  });
  updateLaunchBadge();
  showToast('🚀 Lanzamiento guardado');
}

export function addLaunchChecklist() {
  const inp = document.getElementById('launch-check-new');
  const text = inp?.value.trim();
  if (!text) return;
  const d = load(K.launch, {});
  const checklist = d.checklist || [];
  checklist.push({ id: Date.now(), text, done: false });
  d.checklist = checklist;
  save(K.launch, d);
  inp.value = '';
  renderLaunchChecklist(checklist);
}

export function toggleLaunchChecklistItem(id) {
  const d = load(K.launch, {});
  const item = (d.checklist || []).find(c => c.id === id);
  if (item) { item.done = !item.done; save(K.launch, d); renderLaunchChecklist(d.checklist); }
}

export function removeLaunchChecklistItem(id) {
  const d = load(K.launch, {});
  d.checklist = (d.checklist || []).filter(c => c.id !== id);
  save(K.launch, d);
  renderLaunchChecklist(d.checklist);
}

export function renderLaunchChecklist(items) {
  const wrap = document.getElementById('launch-checklist');
  if (!wrap) return;
  if (!items || !items.length) {
    wrap.innerHTML = '<div style="font-size:13px;color:var(--text-secondary);padding:6px 0">Sin ítems. Añade los pasos pre-lanzamiento.</div>';
    return;
  }
  const done = items.filter(c => c.done).length;
  const pct  = Math.round(done / items.length * 100);
  let html = `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">${done}/${items.length} completados (${pct}%)</div>`;
  html += items.map(c => `<div class="launch-check-item${c.done?' done':''}">
    <input type="checkbox" ${c.done?'checked':''} onchange="toggleLaunchChecklistItem(${c.id})">
    <span style="flex:1">${esc(c.text)}</span>
    <button class="launch-check-rm" onclick="removeLaunchChecklistItem(${c.id})" title="Eliminar">×</button>
  </div>`).join('');
  wrap.innerHTML = html;
}

export function updateLaunchCountdownDisplay() {
  const d = load(K.launch, {});
  const wrap = document.getElementById('launch-countdown-wrap');
  const display = document.getElementById('launch-countdown');
  if (!wrap || !display) return;
  if (!d.launchDateTime) { wrap.style.display = 'none'; return; }
  const diff = new Date(d.launchDateTime) - Date.now();
  wrap.style.display = 'block';
  if (diff <= 0) { display.textContent = '🚀 ¡Lanzamiento en curso!'; return; }
  const totalSecs = Math.floor(diff / 1000);
  const days = Math.floor(totalSecs / 86400);
  const h = Math.floor((totalSecs % 86400) / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  const pad = n => String(n).padStart(2, '0');
  display.textContent = days > 0 ? `${days}d ${pad(h)}h ${pad(m)}m ${pad(s)}s` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function startLaunchCountdown() {
  stopLaunchCountdown();
  _launchCountdownInterval = setInterval(updateLaunchCountdownDisplay, 1000);
  updateLaunchCountdownDisplay();
}

export function stopLaunchCountdown() {
  if (_launchCountdownInterval) { clearInterval(_launchCountdownInterval); _launchCountdownInterval = null; }
}

export function updateLaunchBadge() {
  const badge = document.getElementById('launch-badge');
  if (!badge) return;
  const d = load(K.launch, {});
  if (!d.enabled || !d.launchDateTime) { badge.style.display = 'none'; return; }
  const diff = new Date(d.launchDateTime) - Date.now();
  const MS_48H = 48 * 3600 * 1000; // 48 hours in milliseconds — threshold for showing the urgent badge
  badge.style.display = (diff > 0 && diff < MS_48H) ? 'inline' : 'none';
}
