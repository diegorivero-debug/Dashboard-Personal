/* ═══════════════════════════════════════════════
   AGENDA MODULE — extracted from dashboard.js
   Handles events CRUD, week/month calendar views,
   drag-drop scheduling, ICS export, and recurring
   meetings modal.
═══════════════════════════════════════════════ */

import { K, RECURRING_MEETINGS, equipoLiderazgo } from '../core/constants.js';
import { load, save, esc, num, fmtDate, showToast, localDateStr } from '../core/utils.js';

export let events = load(K.events, []);
export const saveEvents = () => { save(K.events, events); window.updateSummary?.(); };

export const DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
export const DIAS_FULL   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

/** Color labels mapping color value → descriptive label */
const COLOR_LABELS = {
  blue:   '🔵 Comercial',
  green:  '🟢 People',
  orange: '🟠 ER',
  red:    '🔴 Mercado',
  purple: '🟣 One on One'
};

/** Build <option> elements for the manager dropdown */
function _managerOptions(selected) {
  const opts = ['<option value="">— Sin manager —</option>'];
  equipoLiderazgo.forEach(m => {
    const sel = m.nombre === selected ? ' selected' : '';
    opts.push(`<option value="${esc(m.nombre)}"${sel}>${esc(m.nombre)} (${esc(m.rol)})</option>`);
  });
  return opts.join('');
}

/** Build <option> elements for the color dropdown */
function _colorOptions(selected) {
  return Object.entries(COLOR_LABELS).map(([val, lbl]) =>
    `<option value="${val}"${val===selected?' selected':''}>${lbl}</option>`
  ).join('');
}

/** Get editable recurring meetings (localStorage overrides constant) */
export function getRecurringMeetings() {
  return load(K.recurringMeetings, null) || RECURRING_MEETINGS;
}
export function saveRecurringMeetings(list) {
  save(K.recurringMeetings, list);
}

/* ── ICS Calendar Export ── */

export function _generateEventICS(ev) {
  const pad = n => String(n).padStart(2,'0');
  const fmtDt = (dateStr, timeStr) => {
    const d = new Date(dateStr + 'T' + (timeStr || '00:00') + ':00');
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  };
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const dtStart = fmtDt(ev.date, ev.time || '09:00');
  const startMs = new Date(ev.date + 'T' + (ev.time || '09:00') + ':00').getTime();
  const endDate = new Date(startMs + 3600000);
  const dtEnd = `${endDate.getFullYear()}${pad(endDate.getMonth()+1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;
  const uid = `${ev.id || Date.now()}@apg-dashboard`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//APG Dashboard//ES',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${(ev.title || '').replace(/\n/g,' ')}`,
    `DESCRIPTION:${(ev.desc || '').replace(/\n/g,'\\n')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

export function downloadICS(ev) {
  if (!ev) return;
  const ics = _generateEventICS(ev);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(ev.title||'evento').replace(/[^a-zA-Z0-9]/g,'-')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function addEvent() {
  const title=document.getElementById('ev-title').value.trim();
  const date=document.getElementById('ev-date').value;
  if(!title||!date){ alert('El título y la fecha son obligatorios.'); return; }
  const color=document.getElementById('ev-color')?.value||'blue';
  const category=document.getElementById('ev-category')?.value||'reunion';
  const manager=document.getElementById('ev-manager')?.value||'';
  const newEv = { id:Date.now(), title, date, time:document.getElementById('ev-time').value, desc:document.getElementById('ev-desc').value.trim(), color, category, manager };
  events.push(newEv);
  if (manager) _recordManagerConnection(manager, date, title);
  ['ev-title','ev-date','ev-time','ev-desc'].forEach(id=>document.getElementById(id).value='');
  const mgrSel = document.getElementById('ev-manager'); if (mgrSel) mgrSel.value = '';
  saveEvents(); renderEvents(); window.toggleForm?.('add-event-form');
  applyAgendaView();
  renderAgendaSidebar();
  _pendingICSEvent = newEv;
  showICSToast(newEv);
}

/** Record a manager connection for tracking purposes */
function _recordManagerConnection(managerName, date, eventTitle) {
  const connections = load(K.managerConnections, []);
  connections.push({ manager: managerName, date, event: eventTitle, timestamp: Date.now() });
  save(K.managerConnections, connections);
}

export let _pendingICSEvent = null;

export function showICSToast(ev) {
  let t = document.getElementById('apg-ics-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'apg-ics-toast';
    t.style.cssText = 'position:fixed;bottom:80px;right:20px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px 16px;z-index:9999;box-shadow:var(--shadow);font-size:13px;display:flex;align-items:center;gap:10px;max-width:320px';
    document.body.appendChild(t);
  }
  t.innerHTML = `<span>📅 ¿Añadir a Calendario de Apple?</span><button class="btn btn-primary" style="font-size:12px;padding:5px 10px;flex-shrink:0" onclick="downloadICS(window._pendingICSEvent);closeICSToast()">Descargar .ics</button><button style="background:none;border:none;cursor:pointer;font-size:16px;color:var(--text-secondary)" onclick="closeICSToast()">×</button>`;
  window._pendingICSEvent = ev;
  t.style.display = 'flex';
  clearTimeout(t._timer);
  t._timer = setTimeout(closeICSToast, 8000);
}

export function closeICSToast() {
  const t = document.getElementById('apg-ics-toast');
  if (t) t.style.display = 'none';
}

export const rmEvent = id => { events=events.filter(e=>e.id!==id); saveEvents(); renderEvents(); renderAgendaSidebar(); applyAgendaView(); };

const AGENDA_CAT_ICONS = { reunion:'📋', formacion:'🎓', recordatorio:'🔔', focus:'🔒', personal:'⭐', otro:'📌' };

export function renderEvents() {
  const list=document.getElementById('event-list'), empty=document.getElementById('event-empty');
  const today=localDateStr();
  const sorted=[...events].sort((a,b)=>new Date(a.date+'T'+(a.time||'00:00'))-new Date(b.date+'T'+(b.time||'00:00')));
  if(!sorted.length){ list.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';

  const evColorMap = { blue:'#0071e3', green:'#28a745', orange:'#fd7e14', red:'#dc3545', purple:'#6f42c1' };
  const grouped = {};
  sorted.forEach(ev => { if (!grouped[ev.date]) grouped[ev.date] = []; grouped[ev.date].push(ev); });

  let html = '';
  Object.keys(grouped).sort().forEach(dateStr => {
    const d = new Date(dateStr + 'T12:00:00');
    const isToday = dateStr === today;
    const isPast = dateStr < today;
    const dayLabel = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const evs = grouped[dateStr];
    const badgeHtml = isToday ? '<span class="agenda-day-group-badge">HOY</span>' : '';
    html += `<div class="agenda-day-group${isPast ? ' past-day' : ''}">
      <div class="agenda-day-group-header">
        <div class="agenda-day-group-date">${dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}</div>
        ${badgeHtml}
        <div class="agenda-day-group-count">${evs.length} evento${evs.length>1?'s':''}</div>
      </div>`;
    evs.forEach(ev => {
      const catIcon = AGENDA_CAT_ICONS[ev.category] || '📅';
      const borderColor = evColorMap[ev.color] || '#0071e3';
      html += `<div class="agenda-event-card" onclick="openEventModal(${ev.id})" style="--ev-color:${borderColor}">
        <div class="agenda-event-card-cat" style="background:${borderColor}15">${catIcon}</div>
        <div class="agenda-event-card-body">
          <div class="agenda-event-card-title">${esc(ev.title)}</div>
          <div class="agenda-event-card-meta">
            <span>${ev.time || 'Todo el día'}</span>
            ${ev.manager ? '<span>· 👤 ' + esc(ev.manager) + '</span>' : ''}
            ${ev.desc ? '<span>· ' + esc(ev.desc) + '</span>' : ''}
          </div>
        </div>
        <div class="agenda-event-card-actions">
          <button class="btn-icon" title="Descargar .ics" onclick="event.stopPropagation();downloadICS(events.find(e=>e.id===${ev.id}))" style="font-size:14px">📅</button>
          <button class="btn-icon" onclick="event.stopPropagation();rmEvent(${ev.id})" title="Eliminar">×</button>
        </div>
      </div>`;
    });
    html += '</div>';
  });
  list.innerHTML = html;
}

/* ═══ AGENDA SIDEBAR ═══ */
export function renderAgendaSidebar() {
  renderAgendaStats();
  renderAgendaToday();
  renderAgendaGoals();
}

function _getAgendaWeekKey() {
  const today = new Date();
  const dow = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() - (dow===0?6:dow-1));
  mon.setHours(0,0,0,0);
  return localDateStr(mon);
}

function renderAgendaStats() {
  const today = new Date();
  const todayStr = localDateStr(today);
  const dow = today.getDay();
  const mon = new Date(today); mon.setDate(today.getDate() - (dow===0?6:dow-1)); mon.setHours(0,0,0,0);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999);

  const todayEvents = events.filter(e => e.date === todayStr);
  const weekEvents = events.filter(e => { const d = new Date(e.date + 'T12:00:00'); return d >= mon && d <= sun; });

  const elToday = document.getElementById('agenda-stat-today');
  const elWeek = document.getElementById('agenda-stat-week');
  const elNext = document.getElementById('agenda-stat-next');
  const elGoals = document.getElementById('agenda-stat-goals');

  if (elToday) elToday.textContent = todayEvents.length;
  if (elWeek) elWeek.textContent = weekEvents.length;

  const nowMs = today.getTime();
  const upcoming = events.filter(e => new Date(e.date + 'T' + (e.time || '23:59') + ':00').getTime() >= nowMs)
    .sort((a,b) => new Date(a.date+'T'+(a.time||'00:00')+':00') - new Date(b.date+'T'+(b.time||'00:00')+':00'));
  if (elNext) {
    if (upcoming.length > 0) {
      const ne = upcoming[0];
      const nd = new Date(ne.date + 'T12:00:00');
      elNext.textContent = ne.date === todayStr ? (ne.time || 'Hoy') : nd.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
    } else { elNext.textContent = '—'; }
  }

  const goals = load(K.agendaGoals, []);
  const weekKey = _getAgendaWeekKey();
  const weekGoals = goals.filter(g => g.week === weekKey);
  if (elGoals) elGoals.textContent = `${weekGoals.filter(g => g.done).length}/${weekGoals.length}`;
}

function renderAgendaToday() {
  const container = document.getElementById('agenda-today-list');
  const emptyEl = document.getElementById('agenda-today-empty');
  const dateEl = document.getElementById('agenda-today-date');
  if (!container) return;
  const today = new Date();
  const todayStr = localDateStr(today);
  if (dateEl) dateEl.textContent = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const todayEvents = events.filter(e => e.date === todayStr).sort((a,b) => (a.time||'').localeCompare(b.time||''));
  const evColorMap = { blue:'#0071e3', green:'#28a745', orange:'#fd7e14', red:'#dc3545', purple:'#6f42c1' };
  if (!todayEvents.length) { container.innerHTML = ''; if (emptyEl) emptyEl.style.display = 'block'; return; }
  if (emptyEl) emptyEl.style.display = 'none';
  container.innerHTML = todayEvents.map(ev => {
    const catIcon = AGENDA_CAT_ICONS[ev.category] || '📅';
    const borderColor = evColorMap[ev.color] || '#0071e3';
    return `<div class="agenda-today-item" onclick="openEventModal(${ev.id})" style="border-left-color:${borderColor}">
      <div class="agenda-today-item-time">${ev.time || '—'}</div>
      <div class="agenda-today-item-title">${esc(ev.title)}</div>
      <div class="agenda-today-item-cat">${catIcon}</div>
    </div>`;
  }).join('');
}

export function renderAgendaGoals() {
  const listEl = document.getElementById('agenda-goals-list');
  if (!listEl) return;
  const goals = load(K.agendaGoals, []);
  const weekKey = _getAgendaWeekKey();
  const weekGoals = goals.filter(g => g.week === weekKey);
  if (!weekGoals.length) { listEl.innerHTML = '<div class="agenda-goals-empty">Añade hasta 5 objetivos para esta semana</div>'; return; }
  const done = weekGoals.filter(g => g.done).length;
  const pct = weekGoals.length > 0 ? Math.round(done / weekGoals.length * 100) : 0;
  let html = weekGoals.map(g => `<div class="agenda-goal-item${g.done ? ' completed' : ''}">
    <button class="agenda-goal-check" onclick="toggleAgendaGoal(${g.id})">${g.done ? '✓' : ''}</button>
    <div class="agenda-goal-text">${esc(g.text)}</div>
    <button class="agenda-goal-delete" onclick="deleteAgendaGoal(${g.id})">×</button>
  </div>`).join('');
  html += `<div class="agenda-goals-progress">
    <div class="agenda-goals-progress-bar"><div class="agenda-goals-progress-fill" style="width:${pct}%"></div></div>
    <div class="agenda-goals-progress-text">${done} de ${weekGoals.length} completados (${pct}%)</div>
  </div>`;
  listEl.innerHTML = html;
}

export function addAgendaGoal() {
  const input = document.getElementById('agenda-goal-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  const goals = load(K.agendaGoals, []);
  const weekKey = _getAgendaWeekKey();
  if (goals.filter(g => g.week === weekKey).length >= 5) { alert('Máximo 5 objetivos por semana.'); return; }
  goals.push({ id: Date.now(), text, week: weekKey, done: false });
  save(K.agendaGoals, goals);
  input.value = '';
  renderAgendaGoals();
  renderAgendaStats();
}

export function toggleAgendaGoal(id) {
  const goals = load(K.agendaGoals, []);
  const g = goals.find(g => g.id === id);
  if (g) g.done = !g.done;
  save(K.agendaGoals, goals);
  renderAgendaGoals();
  renderAgendaStats();
}

export function deleteAgendaGoal(id) {
  let goals = load(K.agendaGoals, []);
  goals = goals.filter(g => g.id !== id);
  save(K.agendaGoals, goals);
  renderAgendaGoals();
  renderAgendaStats();
}

/* ═══ EVENT DETAIL/EDIT MODAL ═══ */
let _editingEventId = null;

export function openEventModal(id) {
  const ev = events.find(e => e.id === id);
  if (!ev) return;
  _editingEventId = id;
  const overlay = document.getElementById('agenda-event-modal');
  const body = document.getElementById('agenda-event-modal-body');
  if (!overlay || !body) return;
  const evColorMap = { blue:'#0071e3', green:'#28a745', orange:'#fd7e14', red:'#dc3545', purple:'#6f42c1' };
  const catIcon = AGENDA_CAT_ICONS[ev.category] || '📅';
  body.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;padding:16px;background:var(--surface2);border-radius:var(--radius-sm);border-left:4px solid ${evColorMap[ev.color]||'#0071e3'}">
      <span style="font-size:28px">${catIcon}</span>
      <div><div style="font-size:16px;font-weight:700">${esc(ev.title)}</div><div style="font-size:13px;color:var(--text-secondary)">${ev.desc ? esc(ev.desc) : 'Sin descripción'}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="agenda-event-modal-field"><label>Título</label><input id="edit-ev-title" value="${esc(ev.title)}"></div>
      <div class="agenda-event-modal-field"><label>Categoría</label><select id="edit-ev-category">
        <option value="reunion"${ev.category==='reunion'?' selected':''}>📋 Reunión</option>
        <option value="formacion"${ev.category==='formacion'?' selected':''}>🎓 Formación</option>
        <option value="recordatorio"${ev.category==='recordatorio'?' selected':''}>🔔 Recordatorio</option>
        <option value="focus"${ev.category==='focus'?' selected':''}>🔒 Focus Time</option>
        <option value="personal"${ev.category==='personal'?' selected':''}>⭐ Personal</option>
        <option value="otro"${ev.category==='otro'?' selected':''}>📌 Otro</option>
      </select></div>
      <div class="agenda-event-modal-field"><label>Fecha</label><input id="edit-ev-date" type="date" value="${ev.date}"></div>
      <div class="agenda-event-modal-field"><label>Hora</label><input id="edit-ev-time" type="time" value="${ev.time || ''}"></div>
      <div class="agenda-event-modal-field" style="grid-column:span 2"><label>Descripción</label><input id="edit-ev-desc" value="${esc(ev.desc || '')}"></div>
      <div class="agenda-event-modal-field"><label>Color</label><select id="edit-ev-color">
        ${_colorOptions(ev.color || 'blue')}
      </select></div>
      <div class="agenda-event-modal-field"><label>Manager</label><select id="edit-ev-manager">
        ${_managerOptions(ev.manager || '')}
      </select></div>
    </div>`;
  overlay.classList.add('open');
}

export function closeEventModal(e) {
  if (e && e.target !== document.getElementById('agenda-event-modal')) return;
  const overlay = document.getElementById('agenda-event-modal');
  if (overlay) overlay.classList.remove('open');
  _editingEventId = null;
}

export function saveEventEdit() {
  if (!_editingEventId) return;
  const ev = events.find(e => e.id === _editingEventId);
  if (!ev) return;
  const title = document.getElementById('edit-ev-title')?.value.trim();
  const date = document.getElementById('edit-ev-date')?.value;
  if (!title || !date) { alert('El título y la fecha son obligatorios.'); return; }
  ev.title = title; ev.date = date;
  ev.time = document.getElementById('edit-ev-time')?.value || '';
  ev.desc = document.getElementById('edit-ev-desc')?.value.trim() || '';
  ev.color = document.getElementById('edit-ev-color')?.value || 'blue';
  ev.category = document.getElementById('edit-ev-category')?.value || 'reunion';
  const newManager = document.getElementById('edit-ev-manager')?.value || '';
  if (newManager && newManager !== ev.manager) _recordManagerConnection(newManager, ev.date, ev.title);
  ev.manager = newManager;
  saveEvents(); renderEvents(); applyAgendaView(); renderAgendaSidebar(); closeEventModal();
  showToast('✅ Evento actualizado');
}

export function deleteEventFromModal() {
  if (!_editingEventId) return;
  if (!confirm('¿Eliminar este evento?')) return;
  rmEvent(_editingEventId);
  closeEventModal();
}

export function duplicateEventNextWeek() {
  if (!_editingEventId) return;
  const ev = events.find(e => e.id === _editingEventId);
  if (!ev) return;
  const newDate = new Date(ev.date + 'T12:00:00');
  newDate.setDate(newDate.getDate() + 7);
  events.push({ id: Date.now(), title: ev.title, date: localDateStr(newDate), time: ev.time, desc: ev.desc, color: ev.color, category: ev.category, manager: ev.manager || '' });
  saveEvents(); renderEvents(); applyAgendaView(); renderAgendaSidebar(); closeEventModal();
  showToast('📋 Evento duplicado a la siguiente semana');
}

/* ── Week View ── */

export function getWeekStart(offset) {
  const today = new Date();
  const dow = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() - (dow===0?6:dow-1) + offset*7);
  mon.setHours(0,0,0,0);
  return mon;
}

export function setAgendaView(view, btn) {
  save(K.agendaView, view);
  document.querySelectorAll('.agenda-view-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  else {
    const b2=document.getElementById('agenda-btn-'+view); if(b2) b2.classList.add('active');
  }
  document.getElementById('agenda-list-view').style.display = view==='lista' ? 'block' : 'none';
  document.getElementById('agenda-week-view').style.display = view==='semana' ? 'block' : 'none';
  document.getElementById('agenda-month-view').style.display = view==='mes' ? 'block' : 'none';
  if(view==='semana') renderWeeklyView();
  if(view==='mes') renderMonthView();
}

export function applyAgendaView() {
  const view = load(K.agendaView, 'semana');
  setAgendaView(view, null);
}

export function shiftWeek(dir) {
  let offset = load(K.agendaWeekOffset, 0);
  if(dir===0) offset=0; else offset+=dir;
  save(K.agendaWeekOffset, offset);
  renderWeeklyView();
}

export let _dragEventId = null;
export let _dragSourceDate = null;
export let _wcNowTimer = null;
export let _wcMultiWeek = false;

export function toggleWeekMultiView(btn) {
  _wcMultiWeek = !_wcMultiWeek;
  if (btn) btn.classList.toggle('active', _wcMultiWeek);
  renderWeeklyView();
}

export function renderWeeklyView() {
  const offset = load(K.agendaWeekOffset, 0);
  const numDays = _wcMultiWeek ? 21 : 7;
  const startOffset = _wcMultiWeek ? offset - 1 : offset;
  const mon = getWeekStart(startOffset);
  const todayStr = localDateStr();
  const wrap = document.getElementById('week-grid');
  const navTitle = document.getElementById('week-nav-title');
  if (!wrap) return;

  if (_wcNowTimer) { clearInterval(_wcNowTimer); _wcNowTimer = null; }

  const days = [];
  for (let i = 0; i < numDays; i++) {
    const d = new Date(mon); d.setDate(mon.getDate() + i);
    days.push(d);
  }

  const fmtN = d => `${DIAS_SEMANA[d.getDay()]} ${d.getDate()} ${d.toLocaleDateString('es-ES',{month:'short'})}`;
  if (_wcMultiWeek) {
    if (navTitle) navTitle.textContent = `${fmtN(days[0])} — ${fmtN(days[20])}`;
  } else {
    if (navTitle) navTitle.textContent = `${fmtN(days[0])} — ${fmtN(days[6])}`;
  }

  const START_HOUR = 7, END_HOUR = 22;
  const HOUR_PX = 60;
  const totalHours = END_HOUR - START_HOUR;

  function layoutDayEvents(dayEvents) {
    const timed = dayEvents.filter(e => e.time);
    const allDay = dayEvents.filter(e => !e.time);

    function toMins(t) {
      const [h,m] = t.split(':').map(Number); return h * 60 + m;
    }
    timed.sort((a,b) => toMins(a.time) - toMins(b.time));

    const columns = [];
    timed.forEach(ev => {
      const start = toMins(ev.time);
      const end = start + 60;
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        const lastEnd = toMins(columns[c][columns[c].length-1].time) + 60;
        if (start >= lastEnd) { columns[c].push(ev); placed = true; break; }
      }
      if (!placed) columns.push([ev]);
    });

    const colCount = Math.max(1, columns.length);
    const evCols = {};
    columns.forEach((col, ci) => col.forEach(ev => { evCols[ev.id] = { col: ci, total: colCount }; }));

    return { timed, allDay, evCols };
  }

  function evColor(e) {
    const map = { blue:'#0071e3', green:'#28a745', orange:'#fd7e14', red:'#dc3545', purple:'#6f42c1' };
    return map[e.color] || '#0071e3';
  }

  const headerCells = days.map((d, i) => {
    const dateStr = localDateStr(d);
    const isToday = dateStr === todayStr;
    const isWeekStart = _wcMultiWeek && i % 7 === 0;
    const weekLabel = isWeekStart ? `<div style="font-size:9px;color:var(--accent);font-weight:600;margin-bottom:1px">Semana ${Math.floor(i/7)+1}</div>` : '';
    return `<div class="week-cal-header-day${isToday?' today-hdr':''}${isWeekStart?' week-col-separator':''}" data-date="${dateStr}">
      ${weekLabel}
      <div class="week-cal-day-name">${DIAS_SEMANA[d.getDay()]}</div>
      <div class="week-cal-day-num">${d.getDate()}</div>
    </div>`;
  }).join('');

  const alldayCells = days.map(d => {
    const dateStr = localDateStr(d);
    const allDayEvs = events.filter(e => e.date === dateStr && !e.time);
    const pills = allDayEvs.map(e =>
      `<div class="week-cal-allday-pill" draggable="true"
        data-event-id="${e.id}"
        ondragstart="onWeekEventDragStart(event,${e.id},'${dateStr}')"
        ondragend="onWeekEventDragEnd(event)"
        title="${esc(e.title)}"
        style="background:${evColor(e)}"
      >${esc(e.title)}</div>`
    ).join('');
    return `<div class="week-cal-allday-cell"
      ondragover="onWeekColDragOver(event)"
      ondragleave="onWeekColDragLeave(event)"
      ondrop="onWeekColDrop(event,'${dateStr}')"
    >${pills}</div>`;
  }).join('');

  const gutterRows = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    gutterRows.push(`<div class="week-cal-time-slot">${String(h).padStart(2,'0')}:00</div>`);
  }

  const dayCols = days.map((d, i) => {
    const dateStr = localDateStr(d);
    const isToday = dateStr === todayStr;
    const isWeekStart = _wcMultiWeek && i % 7 === 0;
    const dayEvents = events.filter(e => e.date === dateStr);
    const { timed, evCols } = layoutDayEvents(dayEvents);

    const lines = [];
    for (let h = 0; h < totalHours; h++) {
      lines.push(`<div class="week-cal-hour-line" style="top:${h*HOUR_PX}px"></div>`);
      lines.push(`<div class="week-cal-hour-line half" style="top:${h*HOUR_PX + 30}px"></div>`);
      lines.push(`<div class="week-cal-hour-line quarter" style="top:${h*HOUR_PX + 15}px"></div>`);
      lines.push(`<div class="week-cal-hour-line quarter" style="top:${h*HOUR_PX + 45}px"></div>`);
    }

    const evDivs = timed.map(e => {
      const [eh, em] = e.time.split(':').map(Number);
      const top = (eh - START_HOUR) * HOUR_PX + (em / 60) * HOUR_PX;
      const height = Math.max(28, HOUR_PX);
      const { col, total } = evCols[e.id] || { col:0, total:1 };
      const w = 100 / total;
      const left = col * w;
      return `<div class="week-cal-event" draggable="true"
        data-event-id="${e.id}"
        style="top:${top}px;height:${height}px;left:calc(${left}% + 2px);width:calc(${w}% - 4px);background:${evColor(e)}"
        ondragstart="onWeekEventDragStart(event,${e.id},'${dateStr}')"
        ondragend="onWeekEventDragEnd(event)"
        title="${esc(e.title)} · ${e.time}"
      >
        <div class="week-cal-event-title">${esc(e.title)}</div>
        <div class="week-cal-event-time">${e.time}</div>
      </div>`;
    }).join('');

    return `<div class="week-cal-day-col${isToday?' today-col':''}${isWeekStart?' week-col-separator':''}" data-date="${dateStr}"
      style="height:${totalHours * HOUR_PX}px;position:relative"
      ondragover="onWeekColDragOver(event)"
      ondragleave="onWeekColDragLeave(event)"
      ondrop="onWeekColDrop(event,'${dateStr}')"
      ondblclick="onWeekColClick(event,'${dateStr}')"
    >${lines.join('')}${evDivs}</div>`;
  }).join('');

  const minColW = _wcMultiWeek ? 120 : 130;
  const gridMinWidth = numDays * minColW;
  const gridColStyle = `grid-template-columns: repeat(${numDays}, minmax(${minColW}px, 1fr)); min-width: ${gridMinWidth}px;`;

  wrap.innerHTML = `<div class="week-calendar-wrap" style="min-width:${gridMinWidth + 52}px">
    <div class="week-cal-header">
      <div class="week-cal-time-gutter-allday"></div>
      <div style="${gridColStyle} display:grid; flex:1">${headerCells}</div>
    </div>
    <div class="week-cal-allday">
      <div class="week-cal-time-gutter-allday" style="font-size:9px;color:var(--text-secondary);padding-right:6px;display:flex;align-items:center;justify-content:flex-end">todo día</div>
      <div class="week-cal-allday-cols" style="${gridColStyle}">${alldayCells}</div>
    </div>
    <div class="week-cal-body-wrap" id="week-cal-body-wrap">
      <div class="week-cal-body">
        <div class="week-cal-time-gutter">${gutterRows.join('')}</div>
        <div class="week-cal-days" id="week-cal-days" style="height:${totalHours*HOUR_PX}px;${gridColStyle}">${dayCols}</div>
      </div>
    </div>
  </div>`;

  _updateWCNowLine();
  _wcNowTimer = setInterval(_updateWCNowLine, 60000);

  const bodyWrap = document.getElementById('week-cal-body-wrap');
  if (bodyWrap) {
    const now = new Date();
    const nowHour = now.getHours() + now.getMinutes()/60;
    const scrollTo = nowHour >= START_HOUR && nowHour <= END_HOUR
      ? (nowHour - START_HOUR) * HOUR_PX - 100
      : (8 - START_HOUR) * HOUR_PX;
    bodyWrap.scrollTop = Math.max(0, scrollTo);
  }
}

export function _updateWCNowLine() {
  const START_HOUR = 7, END_HOUR = 22, HOUR_PX = 60;
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const startMins = START_HOUR * 60;
  const endMins = END_HOUR * 60;
  const daysEl = document.getElementById('week-cal-days');
  if (!daysEl) return;

  daysEl.querySelectorAll('.week-cal-now-line').forEach(el => el.remove());

  if (nowMins < startMins || nowMins > endMins) return;

  const top = ((nowMins - startMins) / 60) * HOUR_PX;
  const todayStr = localDateStr(now);
  const todayCol = daysEl.querySelector(`[data-date="${todayStr}"]`);
  if (!todayCol) return;

  const line = document.createElement('div');
  line.className = 'week-cal-now-line';
  line.style.top = top + 'px';
  line.innerHTML = '<div class="week-cal-now-dot"></div>';
  todayCol.appendChild(line);
}

export function onWeekEventDragEnd(evt) {
  evt.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.week-cal-drop-highlight').forEach(el => el.classList.remove('week-cal-drop-highlight'));
}

export function onWeekEventDragStart(evt, id, sourceDate) {
  _dragEventId = id;
  _dragSourceDate = sourceDate;
  evt.dataTransfer.effectAllowed = 'move';
  evt.dataTransfer.setData('text/plain', String(id));
  evt.currentTarget.classList.add('dragging');
}

export function onWeekColDragOver(evt) {
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'move';
  evt.currentTarget.classList.add('week-cal-drop-highlight');
}

export function onWeekColDragLeave(evt) {
  if (!evt.currentTarget.contains(evt.relatedTarget)) {
    evt.currentTarget.classList.remove('week-cal-drop-highlight');
  }
}

export function onWeekColDrop(evt, newDate) {
  evt.preventDefault();
  evt.stopPropagation();
  evt.currentTarget.classList.remove('week-cal-drop-highlight');
  if (_dragEventId === null) return;
  const ev = events.find(e => e.id === _dragEventId);
  if (!ev) return;

  ev.date = newDate;

  const col = evt.currentTarget;
  if (col.classList.contains('week-cal-day-col') && ev.time !== undefined) {
    const START_HOUR = 7, HOUR_PX = 60, SNAP_MINS = 15;
    const colRect = col.getBoundingClientRect();
    const relY = evt.clientY - colRect.top;
    const totalMins = (22 - START_HOUR) * 60;
    const colH = colRect.height;
    const pct = Math.max(0, Math.min(1, relY / colH));
    const rawMins = pct * totalMins;
    const snapped = Math.round(rawMins / SNAP_MINS) * SNAP_MINS;
    const hour = START_HOUR + Math.floor(snapped / 60);
    const min  = snapped % 60;
    ev.time = `${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
  }

  _dragEventId = null;
  _dragSourceDate = null;
  saveEvents();
  renderWeeklyView();
}

export function onWeekColClick(evt, dateStr) {
  if (evt.target.closest('.week-cal-event') || evt.target.closest('.week-cal-allday-pill')) return;
  const col = evt.currentTarget;
  const START_HOUR = 7, HOUR_PX = 60, SNAP_MINS = 15;
  const colRect = col.getBoundingClientRect();
  const relY = evt.clientY - colRect.top;
  const totalMins = (22 - START_HOUR) * 60;
  const pct = Math.max(0, Math.min(1, relY / colRect.height));
  const rawMins = pct * totalMins;
  const snapped = Math.round(rawMins / SNAP_MINS) * SNAP_MINS;
  const hour = START_HOUR + Math.floor(snapped / 60);
  const min  = snapped % 60;
  const timeStr = `${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`;

  const dateEl = document.getElementById('ev-date');
  const timeEl = document.getElementById('ev-time');
  if (dateEl) dateEl.value = dateStr;
  if (timeEl) timeEl.value = timeStr;

  const form = document.getElementById('add-event-form');
  if (form) {
    form.classList.add('open');
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  const titleEl = document.getElementById('ev-title');
  if (titleEl) titleEl.focus();
}

/* ── Week Widget in Resumen ── */

export function renderWeekWidget() {
  const content = document.getElementById('week-widget-content');
  const empty   = document.getElementById('week-widget-empty');
  if(!content) return;

  const today = new Date();
  const dow = today.getDay();
  const mon1 = new Date(today); mon1.setDate(today.getDate()-(dow===0?6:dow-1)); mon1.setHours(0,0,0,0);
  const mon2 = new Date(mon1); mon2.setDate(mon1.getDate()+7);
  const end2  = new Date(mon2); end2.setDate(mon2.getDate()+6); end2.setHours(23,59,59,999);
  const todayStr = localDateStr(today);

  const allDays = [];
  for(let i=0; i<14; i++){
    const d = new Date(mon1); d.setDate(mon1.getDate()+i);
    allDays.push(localDateStr(d));
  }

  const rangeEvents = events.filter(e=>{
    const d=new Date(e.date+'T12:00:00'); return d>=mon1 && d<=end2;
  });

  const hasAny = rangeEvents.length > 0;
  if(!hasAny){ content.innerHTML=''; if(empty) empty.style.display='block'; return; }
  if(empty) empty.style.display='none';

  const byDay = {};
  rangeEvents.forEach(e=>{ if(!byDay[e.date]) byDay[e.date]=[]; byDay[e.date].push(e); });

  const week1Days = allDays.slice(0,7);
  const week2Days = allDays.slice(7,14);

  const renderWeekRow = (days, label) => {
    const cols = days.map(dateStr => {
      const d = new Date(dateStr+'T12:00:00');
      const isToday = dateStr === todayStr;
      const evs = byDay[dateStr] || [];
      return `<div class="week-widget-day${isToday?' today-day':''}">
        <div class="week-widget-day-name">${DIAS_SEMANA[d.getDay()]}</div>
        <div class="week-widget-day-num">${d.getDate()}</div>
        ${evs.map(e=>`<span class="week-event-pill" title="${esc(e.title)}${e.time?' · '+e.time:''}">${esc(e.title)}</span>`).join('')}
      </div>`;
    }).join('');
    return `<div class="week-widget-week-label">${label}</div><div class="week-widget-days">${cols}</div>`;
  };

  const fmt = d => d.toLocaleDateString('es-ES',{day:'numeric',month:'short'});
  const sun1 = new Date(mon1); sun1.setDate(mon1.getDate()+6);
  const sun2 = new Date(mon2); sun2.setDate(mon2.getDate()+6);

  content.innerHTML =
    renderWeekRow(week1Days, `Semana del ${fmt(mon1)} al ${fmt(sun1)}`) +
    renderWeekRow(week2Days, `Semana del ${fmt(mon2)} al ${fmt(sun2)}`);
}

/* ── Month View ── */

const MESES_FULL=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export function shiftMonth(dir) {
  let off=load(K.agendaMonthOffset,0);
  if(dir===0) off=0; else off+=dir;
  save(K.agendaMonthOffset,off);
  renderMonthView();
}

export function renderMonthView() {
  const grid=document.getElementById('month-grid'); if(!grid) return;
  const off=load(K.agendaMonthOffset,0);
  const today=new Date();
  const cur=new Date(today.getFullYear(),today.getMonth()+off,1);
  const year=cur.getFullYear(), month=cur.getMonth();
  const todayStr=localDateStr(today);
  const navTitle=document.getElementById('month-nav-title');
  if(navTitle) navTitle.textContent=`${MESES_FULL[month]} ${year}`;

  const first=new Date(year,month,1);
  const startDow=first.getDay();
  const startOffset=startDow===0?-6:-(startDow-1);
  const start=new Date(first); start.setDate(1+startOffset);

  const headers=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d=>`<div class="month-day-header">${d}</div>`).join('');

  const cells=[];
  for(let i=0;i<42;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const dStr=localDateStr(d);
    const isOther=d.getMonth()!==month;
    const isToday=dStr===todayStr;
    const dayEvs=events.filter(e=>e.date===dStr).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
    const pills=dayEvs.slice(0,3).map(e=>`<div class="month-event-pill" title="${esc(e.title)}">${esc(e.time?e.time+' ':'')}${esc(e.title)}</div>`).join('');
    const more=dayEvs.length>3?`<div class="month-more">+${dayEvs.length-3} más</div>`:'';
    cells.push(`<div class="month-day${isOther?' other-month':''}${isToday?' today-day':''}" ondblclick="monthDayClick('${dStr}')">
      <div class="month-day-num">${d.getDate()}</div>
      ${pills}${more}
    </div>`);
    if(i>27 && d.getMonth()!==month && d.getDay()===0) { break; }
  }

  grid.innerHTML=headers+cells.join('');
}

export function monthDayClick(dateStr) {
  const dtInput=document.getElementById('ev-date');
  if(dtInput) dtInput.value=dateStr;
  const form=document.getElementById('add-event-form');
  if(form && !form.classList.contains('open')) form.classList.add('open');
  form?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  document.getElementById('ev-title')?.focus();
}

/* ── Recurring Meetings Modal ── */

export function openRecurringModal() {
  const list=document.getElementById('recurring-list'); if(!list) return;
  const today=new Date(); today.setHours(0,0,0,0);
  const dow=today.getDay();
  const mon=new Date(today);
  if(dow===0){ mon.setDate(today.getDate()+1); } else { mon.setDate(today.getDate()-(dow-1)); }
  mon.setHours(0,0,0,0);

  const meetings = getRecurringMeetings();

  list.innerHTML=meetings.map((m,i)=>{
    const d=new Date(mon); d.setDate(mon.getDate()+(m.day-1));
    const dateStr=localDateStr(d);
    const exists=events.some(e=>e.title===m.name && e.date===dateStr);
    const label=d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});
    return `<div class="recurring-item" style="position:relative">
      <input type="checkbox" id="rm-cb-${i}" ${exists?'disabled checked':'checked'} style="width:18px;height:18px;cursor:pointer;flex-shrink:0">
      <div class="recurring-item-info" style="flex:1">
        <div class="recurring-item-name">${esc(m.name)}</div>
        <div class="recurring-item-meta">${label} · ${m.time}${exists?' · <span style="color:var(--success)">Ya existe</span>':''}</div>
      </div>
      <div style="display:flex;gap:4px;align-items:center">
        <button class="btn-icon" title="Editar" onclick="editRecurringItem(${i})" style="font-size:14px">✏️</button>
        <button class="btn-icon" title="Eliminar" onclick="deleteRecurringItem(${i})" style="font-size:14px;color:var(--danger)">🗑️</button>
      </div>
    </div>`;
  }).join('');

  list.innerHTML += `<div class="recurring-item" id="recurring-add-form" style="border-top:1px solid var(--border);padding-top:12px;margin-top:8px;display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap">
    <div><div class="field-label" style="font-size:11px">Nombre</div><input class="task-input" id="rm-new-name" placeholder="Nombre reunión" style="min-width:140px;font-size:12px"></div>
    <div><div class="field-label" style="font-size:11px">Día</div><select class="task-select" id="rm-new-day" style="font-size:12px">
      <option value="1">Lunes</option><option value="2">Martes</option><option value="3">Miércoles</option>
      <option value="4">Jueves</option><option value="5">Viernes</option><option value="6">Sábado</option><option value="7">Domingo</option>
    </select></div>
    <div><div class="field-label" style="font-size:11px">Hora</div><input class="task-input" id="rm-new-time" type="time" value="09:00" style="font-size:12px;min-width:auto"></div>
    <div><div class="field-label" style="font-size:11px">Desc</div><input class="task-input" id="rm-new-desc" placeholder="Descripción..." style="min-width:120px;font-size:12px"></div>
    <button class="btn btn-primary" onclick="addNewRecurringItem()" style="font-size:12px;padding:6px 12px">+ Añadir</button>
  </div>`;

  document.getElementById('recurring-overlay').classList.add('open');
}

export function closeRecurringModal() { document.getElementById('recurring-overlay').classList.remove('open'); }
export function closeRecurringModalOnBg(e) { if(e.target===document.getElementById('recurring-overlay')) closeRecurringModal(); }

export function addNewRecurringItem() {
  const name = document.getElementById('rm-new-name')?.value.trim();
  const day = parseInt(document.getElementById('rm-new-day')?.value || '1');
  const time = document.getElementById('rm-new-time')?.value || '09:00';
  const desc = document.getElementById('rm-new-desc')?.value.trim() || '';
  if (!name) { alert('El nombre es obligatorio.'); return; }
  const meetings = getRecurringMeetings();
  meetings.push({ name, day, time, desc });
  saveRecurringMeetings(meetings);
  showToast('✅ Reunión recurrente añadida');
  openRecurringModal();
}

export function editRecurringItem(idx) {
  const meetings = getRecurringMeetings();
  const m = meetings[idx];
  if (!m) return;
  const name = prompt('Nombre de la reunión:', m.name);
  if (name === null) return;
  const time = prompt('Hora (HH:MM):', m.time);
  if (time === null) return;
  const dayStr = prompt('Día de la semana (1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb, 7=Dom):', String(m.day));
  if (dayStr === null) return;
  const desc = prompt('Descripción:', m.desc || '');
  if (desc === null) return;
  meetings[idx] = { name: name.trim() || m.name, day: parseInt(dayStr) || m.day, time: time.trim() || m.time, desc: desc.trim() };
  saveRecurringMeetings(meetings);
  showToast('✅ Reunión recurrente actualizada');
  openRecurringModal();
}

export function deleteRecurringItem(idx) {
  const meetings = getRecurringMeetings();
  if (!confirm(`¿Eliminar "${meetings[idx]?.name}" de la semana tipo?`)) return;
  meetings.splice(idx, 1);
  saveRecurringMeetings(meetings);
  showToast('🗑️ Reunión recurrente eliminada');
  openRecurringModal();
}

export function addRecurringSelected() {
  const today=new Date(); today.setHours(0,0,0,0);
  const dow=today.getDay();
  const mon=new Date(today);
  if(dow===0){ mon.setDate(today.getDate()+1); } else { mon.setDate(today.getDate()-(dow-1)); }
  mon.setHours(0,0,0,0);
  let added=0;
  const meetings = getRecurringMeetings();
  meetings.forEach((m,i)=>{
    const cb=document.getElementById('rm-cb-'+i);
    if(!cb||!cb.checked||cb.disabled) return;
    const d=new Date(mon); d.setDate(mon.getDate()+(m.day-1));
    const dateStr=localDateStr(d);
    if(events.some(e=>e.title===m.name && e.date===dateStr)) return;
    events.push({ id:Date.now()+added, title:m.name, date:dateStr, time:m.time, desc:m.desc });
    added++;
  });
  if(added>0) { saveEvents(); renderEvents(); applyAgendaView(); }
  closeRecurringModal();
  if(added>0) showToast(`✅ Se añadieron ${added} evento(s) a la semana.`);
  else showToast('No se añadieron eventos (ya existen o ninguno seleccionado).');
}
