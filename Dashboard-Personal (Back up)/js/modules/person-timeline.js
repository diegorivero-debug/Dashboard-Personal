/* ═══════════════════════════════════════════════
   PERSON TIMELINE — Unified chronological history per team member
   Sources: TB/1:1 sessions, SBI feedback, reconocimientos, PDI
═══════════════════════════════════════════════ */

import { K } from '../core/constants.js';
import { load, esc, fmtDate } from '../core/utils.js';

/* ── Helpers ── */
function getTeam() {
  return (window.team && window.team.length ? window.team : load(K.team, []))
    .filter(m => !m.hidden);
}

function personColor(person) {
  const COLORS = ['#0071e3','#34c759','#ff9f0a','#ff3b30','#af52de','#5ac8fa','#ff2d55','#30d158'];
  return person.color || COLORS[(person.id || 0) % COLORS.length];
}

function initials(name) {
  return String(name || '?').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
}

/* ── Build timeline ── */
export function buildPersonTimeline(personId) {
  const events = [];
  const pid = String(personId);

  /* 1. TB / 1:1 sessions */
  const tbs = load(K.tbs, {});
  const sessions = tbs[pid] || tbs[personId] || [];
  sessions.forEach(s => {
    const detail = [];
    if (s.points)      detail.push(esc(s.points));
    if (s.followUp)    detail.push(`Follow-up: ${esc(s.followUp)}`);
    events.push({
      type:   'tb',
      date:   s.date || '',
      icon:   '🤝',
      title:  'Sesión TB / 1:1',
      detail: detail.join(' · '),
      badge:  s.followUpDone ? { text:'Follow-up ✓', cls:'followup' } : null,
    });
  });

  /* 2. Feedback SBI */
  const sbiHistory = load('apg_sbi_history', []);
  sbiHistory.filter(s => String(s.personId) === pid).forEach(s => {
    const typeLabel = s.type === 'positivo' ? 'Positivo' : 'Mejora';
    events.push({
      type:   'feedback',
      date:   s.date || '',
      icon:   '💬',
      title:  `Feedback SBI — ${typeLabel}`,
      detail: s.situation ? esc(s.situation).slice(0, 120) : (s.text ? esc(s.text).slice(0, 120) : ''),
      badge:  { text: typeLabel, cls: s.type === 'positivo' ? 'positivo' : 'mejora' },
    });
  });

  /* 3. Reconocimientos */
  const recogs = load(K.reconocimientos, []);
  recogs.filter(r => String(r.personId) === pid).forEach(r => {
    events.push({
      type:   'recog',
      date:   r.date || '',
      icon:   '🏆',
      title:  `Reconocimiento — ${esc(r.category || '')}`,
      detail: r.desc ? esc(r.desc).slice(0, 120) : '',
      badge:  { text: r.category || 'Reconocimiento', cls: 'positivo' },
    });
  });

  /* 4. PDI update */
  const pdis = load(K.pdis, {});
  const pdi = pdis[pid] || pdis[personId];
  if (pdi && pdi.updatedAt) {
    const parts = [];
    if (pdi.strengths)   parts.push(`Fortalezas: ${esc(pdi.strengths).slice(0, 60)}`);
    if (pdi.weekGoal)    parts.push(`Meta semana: ${esc(pdi.weekGoal).slice(0, 60)}`);
    events.push({
      type:   'pdi',
      date:   pdi.updatedAt,
      icon:   '📈',
      title:  'PDI actualizado',
      detail: parts.join(' · '),
      badge:  null,
    });
  }

  /* Sort descending by date */
  events.sort((a, b) => {
    const da = a.date ? new Date(a.date) : new Date(0);
    const db = b.date ? new Date(b.date) : new Date(0);
    return db - da;
  });

  return events;
}

/* ── State ── */
let _currentPersonId = '';
let _currentFilter   = 'all';

/* ── Render ── */
export function renderPersonTimeline() {
  const team = getTeam();
  const sel  = document.getElementById('tl-person-select');
  if (sel) {
    const prev = sel.value;
    sel.innerHTML = '<option value="">— Selecciona persona —</option>' +
      team.map(m => `<option value="${m.id}" ${String(m.id) === String(_currentPersonId) ? 'selected' : ''}>${esc(m.name)}</option>`).join('');
    if (!_currentPersonId && prev) sel.value = prev;
  }

  if (_currentPersonId) {
    _renderTimelineForPerson(_currentPersonId);
  } else {
    _showEmptySelect();
  }
}

function _showEmptySelect() {
  const header  = document.getElementById('tl-person-header');
  const filters = document.getElementById('tl-filters');
  const list    = document.getElementById('tl-timeline-list');
  const empty   = document.getElementById('tl-empty-select');
  const noEvt   = document.getElementById('tl-empty-events');
  if (header)  { header.style.display  = 'none'; header.innerHTML = ''; }
  if (filters) { filters.style.display = 'none'; }
  if (list)    { list.innerHTML        = ''; }
  if (empty)   { empty.style.display   = ''; }
  if (noEvt)   { noEvt.style.display   = 'none'; }
}

function _renderTimelineForPerson(personId) {
  const team   = getTeam();
  const person = team.find(m => String(m.id) === String(personId));
  if (!person) { _showEmptySelect(); return; }

  const header  = document.getElementById('tl-person-header');
  const filters = document.getElementById('tl-filters');
  const list    = document.getElementById('tl-timeline-list');
  const empty   = document.getElementById('tl-empty-select');
  const noEvt   = document.getElementById('tl-empty-events');

  if (empty) empty.style.display = 'none';

  /* Build all events */
  const allEvents = buildPersonTimeline(personId);

  /* Stats */
  const tbCount   = allEvents.filter(e => e.type === 'tb').length;
  const fbCount   = allEvents.filter(e => e.type === 'feedback').length;
  const recoCount = allEvents.filter(e => e.type === 'recog').length;
  const pdiCount  = allEvents.filter(e => e.type === 'pdi').length;

  /* Last TB date */
  const lastTb = allEvents.find(e => e.type === 'tb');
  let tbStatus = '';
  if (lastTb) {
    const daysDiff = Math.floor((Date.now() - new Date(lastTb.date)) / 86400000);
    if      (daysDiff <= 7)  tbStatus = '<span style="color:#34c759">● Reciente</span>';
    else if (daysDiff <= 14) tbStatus = '<span style="color:#ff9f0a">● Hace ' + daysDiff + ' días</span>';
    else                     tbStatus = '<span style="color:#ff3b30">● Hace ' + daysDiff + ' días</span>';
  }

  /* Header */
  const color = personColor(person);
  if (header) {
    header.style.display = '';
    header.innerHTML = `
      <div class="tl-header-card">
        <div class="tl-avatar" style="background:${color}">${initials(person.name)}</div>
        <div style="flex:1;min-width:0">
          <div class="tl-person-name">${esc(person.name)}</div>
          <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">${esc(person.role || '')}${person.status ? ' · ' + esc(person.status) : ''}${tbStatus ? ' · Último 1:1: ' + tbStatus : ''}</div>
          <div class="tl-stats">
            <div class="tl-stat"><span class="tl-stat-num" style="color:#0071e3">${tbCount}</span><span>1:1s</span></div>
            <div class="tl-stat"><span class="tl-stat-num" style="color:#ff9f0a">${fbCount}</span><span>Feedbacks</span></div>
            <div class="tl-stat"><span class="tl-stat-num" style="color:#34c759">${recoCount}</span><span>Reconocimientos</span></div>
            <div class="tl-stat"><span class="tl-stat-num" style="color:#af52de">${pdiCount}</span><span>PDI</span></div>
          </div>
        </div>
      </div>`;
  }

  /* Filters */
  if (filters) filters.style.display = '';

  /* Filter active events */
  const visible = _currentFilter === 'all'
    ? allEvents
    : allEvents.filter(e => e.type === _currentFilter);

  if (!allEvents.length) {
    if (list)  list.innerHTML = '';
    if (noEvt) noEvt.style.display = '';
    return;
  }

  if (noEvt) noEvt.style.display = 'none';

  if (!list) return;

  if (!visible.length) {
    list.innerHTML = `<div class="empty-state" style="padding:32px 0"><div class="empty-state-icon">🔍</div><p>No hay eventos de este tipo registrados</p></div>`;
    return;
  }

  list.innerHTML = `<div class="tl-timeline">${visible.map(e => _eventHtml(e)).join('')}</div>`;
}

function _eventHtml(e) {
  const typeColors = { tb: '#0071e3', feedback: '#ff9f0a', recog: '#34c759', pdi: '#af52de' };
  const dot = typeColors[e.type] || '#8e8e93';
  const badge = e.badge
    ? `<span class="tl-event-badge ${e.badge.cls}">${esc(e.badge.text)}</span>`
    : '';
  const dateStr = e.date ? fmtDate(e.date) : '';
  return `
    <div class="tl-event" data-type="${e.type}">
      <div class="tl-event-dot" style="background:${dot}"></div>
      <div class="tl-event-body">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="tl-event-title">${e.icon} ${esc(e.title)}</span>
          ${badge}
          ${dateStr ? `<span class="tl-event-date">${dateStr}</span>` : ''}
        </div>
        ${e.detail ? `<div class="tl-event-detail">${e.detail}</div>` : ''}
      </div>
    </div>`;
}

/* ── Public API ── */
export function setTimelinePerson(personId) {
  _currentPersonId = String(personId || '');
  _currentFilter   = 'all';
  /* Reset filter pills */
  document.querySelectorAll('#tl-filters .filter-pill').forEach((btn, i) => {
    btn.classList.toggle('active', i === 0);
  });
  _renderTimelineForPerson(_currentPersonId);
  if (!_currentPersonId) _showEmptySelect();
}

export function filterTimelineByType(type, btn) {
  _currentFilter = type || 'all';
  document.querySelectorAll('#tl-filters .filter-pill').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (_currentPersonId) {
    _renderTimelineForPerson(_currentPersonId);
  }
}

export function initPersonTimeline() {
  window.renderPersonTimeline  = renderPersonTimeline;
  window.setTimelinePerson     = setTimelinePerson;
  window.filterTimelineByType  = filterTimelineByType;
  window.buildPersonTimeline   = buildPersonTimeline;
}
