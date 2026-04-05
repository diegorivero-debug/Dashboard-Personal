/* ═══════════════════════════════════════════════
   TB-SESSIONS MODULE — extracted from dashboard.js
   Handles TB / 1:1 sessions modal, session CRUD,
   TB suggestions engine, and suggestion rendering.
═══════════════════════════════════════════════ */

import { K } from '../core/constants.js';
import { load, save, esc, fmtDate, showToast } from '../core/utils.js';

export let currentTBMemberId = null;

export function openTBModal(memberId) {
  currentTBMemberId = memberId;
  const team = window.team || [];
  const m = team.find(m => m.id === memberId);
  const overlay = document.getElementById('tb-modal-overlay');
  if (!overlay) return;
  document.getElementById('tb-modal-title').textContent = '🤝 TB / 1:1 — ' + (m ? m.name : '');
  renderTBSuggestions(memberId);
  document.getElementById('tb-modal-sessions').innerHTML = renderTBSessions(memberId);
  const form = document.getElementById('tb-modal-form');
  if (form) form.classList.remove('open');
  overlay.classList.add('open');
}

export function closeTBModal(e) {
  if (e && e.target !== document.getElementById('tb-modal-overlay')) return;
  document.getElementById('tb-modal-overlay').classList.remove('open');
  currentTBMemberId = null;
}

export function closeTBModalBtn() {
  document.getElementById('tb-modal-overlay').classList.remove('open');
  currentTBMemberId = null;
}

export function openTBForm() {
  const form = document.getElementById('tb-modal-form');
  if (form) {
    form.classList.add('open');
    const dateEl = document.getElementById('tb-modal-date');
    if (dateEl) dateEl.value = new Date().toISOString().slice(0,10);
  }
}

export function closeTBForm() {
  const form = document.getElementById('tb-modal-form');
  if (form) form.classList.remove('open');
}

export function saveTBModalSession() {
  const memberId = currentTBMemberId; if (!memberId) return;
  const date = document.getElementById('tb-modal-date')?.value || new Date().toISOString().slice(0,10);
  const points = document.getElementById('tb-modal-points')?.value.trim() || '';
  const agreements = document.getElementById('tb-modal-agreements')?.value.trim() || '';
  const followUp = document.getElementById('tb-modal-followup')?.checked || false;
  const followUpDesc = document.getElementById('tb-modal-followup-desc')?.value.trim() || '';
  const tbs = load(K.tbs, {});
  if (!tbs[memberId]) tbs[memberId] = [];
  tbs[memberId].push({ id: Date.now(), date, points, agreements, followUp, followUpDesc });
  save(K.tbs, tbs);
  document.getElementById('tb-modal-points').value = '';
  document.getElementById('tb-modal-agreements').value = '';
  document.getElementById('tb-modal-followup-desc').value = '';
  document.getElementById('tb-modal-followup').checked = false;
  closeTBForm();
  document.getElementById('tb-modal-sessions').innerHTML = renderTBSessions(memberId);
  window.renderTeam?.();
}

export function renderTBSessions(memberId) {
  const team = window.team || [];
  const equipoLiderazgo = window.equipoLiderazgo || [];
  const tbs = load(K.tbs, {});
  const sessions = (tbs[memberId] || []).slice().reverse().slice(0, 10);
  if (!sessions.length) return '<div style="font-size:12px;color:var(--text-secondary)">Sin sesiones aún.</div>';
  const mb = team.find(m => m.id === memberId) || equipoLiderazgo.find(e => e.id === memberId) || {};
  const mbEmail = mb.email || '';
  const mbName  = mb.name || mb.nombre || '';
  return sessions.map(s => `
    <div class="tb-session-item">
      <div class="tb-session-date">📅 ${fmtDate(s.date)}</div>
      ${s.points ? `<div style="margin:4px 0">${esc(s.points)}</div>` : ''}
      ${s.agreements ? `<div style="color:var(--text-secondary);font-size:12px">Acuerdos: ${esc(s.agreements)}</div>` : ''}
      ${s.followUp ? `<div style="color:var(--warning);font-size:12px;margin-top:4px">⏳ Seguimiento: ${esc(s.followUpDesc || 'Pendiente')}</div>` : ''}
      <a style="font-size:11px;color:var(--accent);text-decoration:none;display:inline-block;margin-top:6px" href="mailto:${encodeURIComponent(mbEmail)}?subject=${encodeURIComponent('Resumen TB — ' + mbName + ' — ' + s.date)}">📧 Enviar resumen TB</a>
    </div>`).join('');
}

/* Legacy stubs kept in case any old stored references call them — they now delegate to the modal */
export function toggleTBPanel(memberId) { openTBModal(memberId); }
export function openNewTBForm(memberId) { currentTBMemberId = memberId; openTBForm(); }
export function saveTBSession(memberId) { currentTBMemberId = memberId; saveTBModalSession(); }

export function getTBSuggestions(memberId) {
  const team = window.team || [];
  const equipoLiderazgo = window.equipoLiderazgo || [];
  const suggestions = [];
  const m = team.find(t => t.id === memberId) || equipoLiderazgo.find(e => e.id === memberId);
  const name = m ? (m.name || m.nombre) : 'esta persona';

  // 1. Last TB session date
  const tbs = load(K.tbs, {});
  const sessions = (tbs[memberId] || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  if (!sessions.length) {
    suggestions.push({ text: `Nunca has tenido un 1:1 registrado con ${name}`, color: 'var(--danger)', icon: '🚨' });
  } else {
    const lastDate = new Date(sessions[0].date);
    const daysSince = Math.floor((Date.now() - lastDate) / 86400000);
    if (daysSince > 14) {
      suggestions.push({ text: `Hace ${daysSince} días desde el último 1:1 con ${name}`, color: 'var(--warning)', icon: '⏰' });
    }
  }

  // 2. Recent recognitions (last 14 days)
  const recogs = load(K.reconocimientos, []);
  const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const twaStr = twoWeeksAgo.toISOString().slice(0, 10);
  const recentRecogs = recogs.filter(r => r.personId === memberId && r.date >= twaStr);
  if (!recentRecogs.length) {
    suggestions.push({ text: `${name} no ha recibido reconocimiento en 2 semanas — celebra algo`, color: 'var(--accent)', icon: '🏆' });
  }

  // 3. Pulse Check: low energy/climate this week
  const pulses = load(K.pulse, []);
  const lastPulse = pulses.slice().sort((a, b) => (b.weekStart || '').localeCompare(a.weekStart || ''))[0];
  if (lastPulse && (parseInt(lastPulse.energy) <= 2 || parseInt(lastPulse.climate) <= 2)) {
    suggestions.push({ text: `El equipo reporta baja energía/clima esta semana — pregúntale cómo está`, color: 'var(--warning)', icon: '🔋' });
  }

  // 4. Active PDI
  const pdis = load(K.pdis, {});
  const pdi = pdis[memberId];
  if (pdi && (pdi.strengths || pdi.weekGoal)) {
    suggestions.push({ text: `${name} tiene un PDI activo — haz seguimiento del objetivo de desarrollo`, color: 'var(--success)', icon: '📈' });
  }

  // 5. High-priority pending tasks (person mentioned in task text)
  const taskAll = load(K.tasks, []);
  const personName = (m ? (m.name || m.nombre) : '').split(' ')[0].toLowerCase();
  const criticalTasks = personName ? taskAll.filter(t => !t.done && t.pri === 'alta' && t.text.toLowerCase().includes(personName)) : [];
  if (criticalTasks.length) {
    suggestions.push({ text: `Tiene tareas críticas pendientes relacionadas — revísalas`, color: 'var(--danger)', icon: '🔴' });
  }

  return suggestions.slice(0, 3);
}

export function renderTBSuggestions(memberId) {
  const suggestions = getTBSuggestions(memberId);
  const container = document.getElementById('tb-modal-suggestions');
  if (!container) return;
  if (!suggestions.length) {
    container.innerHTML = `<div style="font-size:12px;padding:8px 12px;background:rgba(52,199,89,0.1);border-radius:8px;color:var(--success);margin-bottom:12px">✅ Sin alertas — buen momento para una conversación de desarrollo</div>`;
    return;
  }
  container.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">` +
    suggestions.map(s => `<span style="display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border-radius:20px;font-size:12px;font-weight:500;background:${s.color}1a;color:${s.color};border:1px solid ${s.color}40">${s.icon} ${esc(s.text)}</span>`).join('') +
    `</div>`;
}
