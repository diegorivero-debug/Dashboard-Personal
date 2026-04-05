/* ═══════════════════════════════════════════════
   WEEKLY ROUTINE — extracted from dashboard.js
   Clave localStorage: K.routineDate, K.routineStep
═══════════════════════════════════════════════ */

import { K } from '../core/constants.js';
import { load, save, esc, num, showToast } from '../core/utils.js';

export const ROUTINE_STEPS=[
  {num:1,title:'Estado del equipo',sub:'Confirma quién está disponible esta semana (vacaciones/ausencias)'},
  {num:2,title:'Tareas de la semana',sub:'Repasa las tareas pendientes de esta semana'},
  {num:3,title:'Reuniones de la semana',sub:'Gestiona los eventos y reuniones de la semana'},
  {num:4,title:'Intención de la semana',sub:'¿Cuál es tu intención para esta semana?'},
];

export const PREP_CHECKLIST_ITEMS = [
  { id:'prep-mail',       label:'📧 Leer mail' },
  { id:'prep-horarios',   label:'📋 Revisar horarios de leadership' },
  { id:'prep-slack',      label:'💬 Leer Slack' },
  { id:'prep-hello',      label:'👋 Leer Hello' },
  { id:'prep-calendario', label:'📅 Organizar calendario' },
  { id:'prep-ooo',        label:'🤝 Planificar One on One con los managers' }
];

export let _routineTaskView = load('apg_routine_eis_view', 'lista');
export let _routineEisDragTaskId = null;

export function resetRoutine() {
  save(K.routineDate, null);
  save(K.routineStep, null);
  renderRoutine();
}

export function renderRoutine() {
  const weekStart=window.getWeekStart?.(0).toISOString().split('T')[0];
  const completedWeek=load(K.routineDate, null);
  const container=document.getElementById('routine-content'); if(!container) return;
  if(completedWeek===weekStart) {
    container.innerHTML=`
      <div class="page-title">📅 Weekly Prep</div>
      <div class="routine-completed-banner">
        <div class="routine-completed-icon">✅</div>
        <div class="routine-completed-title">¡Weekly Prep completado!</div>
        <div style="font-size:14px;color:var(--text-secondary);margin-bottom:16px">Ya has hecho tu check-in de la semana. ¡Buen trabajo!</div>
        <button class="btn btn-ghost" onclick="resetRoutine()">🔄 Repetir weekly prep</button>
      </div>`;
    return;
  }
  let step=parseInt(load(K.routineStep, '1'));
  if(step<1||step>ROUTINE_STEPS.length) step=1;
  renderRoutineStep(step, container, weekStart);
}

export function renderRoutineStep(step, container, weekStart) {
  const team = window.team || [];
  const events = window.events || [];
  const reuniones = window.reuniones || [];
  const tasks = window.tasks || [];

  if(!container) container=document.getElementById('routine-content');
  if(!container) return;
  weekStart=weekStart||window.getWeekStart?.(0).toISOString().split('T')[0];
  const weekEnd=new Date(weekStart); weekEnd.setDate(weekEnd.getDate()+6);
  const weekEndStr=weekEnd.toISOString().split('T')[0];
  save(K.routineStep, step);
  const progressDots=ROUTINE_STEPS.map((s,i)=>{
    const cls=i+1<step?'done':i+1===step?'active':'';
    const line=i<ROUTINE_STEPS.length-1?`<div class="routine-step-line ${i+1<step?'done':''}"></div>`:'';
    return `<div class="routine-step-dot ${cls}">${i+1<step?'✓':s.num}</div>${line}`;
  }).join('');
  let content='';
  if(step===1) {
    // Estado del equipo — sólo managers/leads con filtro de vacaciones
    const ausKey = 'apg_routine_ausencias_' + weekStart;
    const ausentes = load(ausKey, []);
    const leaders = typeof window.equipoLiderazgo !== 'undefined' ? window.equipoLiderazgo : [];
    const getColor = m => { const tm = team.find(t => t.id === m.id); return tm ? tm.color : 'var(--accent)'; };
    const vacInfo = leaders.map(m => ({
      ...m,
      isVac: isPersonOnVacation(m.nombre, weekStart),
      isAus: ausentes.includes(m.id)
    }));
    const working = vacInfo.filter(m => !m.isVac && !m.isAus);
    const absent  = vacInfo.filter(m => m.isVac || m.isAus);
    const memberRow = (m, grayed) => {
      const badge = m.isVac
        ? '<span style="font-size:10px;background:#ff9f0a22;color:#ff9f0a;border-radius:4px;padding:1px 6px;margin-left:6px">🏖️ Vacaciones</span>'
        : m.isAus ? '<span style="font-size:10px;background:var(--surface2);color:var(--text-secondary);border-radius:4px;padding:1px 6px;margin-left:6px">Ausente</span>' : '';
      const toggleLabel = m.isAus ? '↩ Disponible' : '× Ausente';
      const toggleBtn = `<button class="btn btn-ghost" style="font-size:10px;padding:2px 8px;flex-shrink:0;white-space:nowrap" onclick="toggleRoutineAusente(${m.id},'${weekStart}')">${toggleLabel}</button>`;
      return `<div style="display:flex;align-items:center;gap:12px;padding:8px;background:var(--surface2);border-radius:var(--radius-sm);${grayed?'opacity:0.5;':''}">
        <div style="width:36px;height:36px;border-radius:50%;background:${getColor(m)};display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;flex-shrink:0">${esc(window.initials?.(m.nombre)||'')}</div>
        <div style="flex:1">
          <div style="font-weight:600;font-size:14px">${esc(m.nombre)}${badge}</div>
          <div style="font-size:12px;color:var(--text-secondary)">${esc(m.rol||'')}</div>
        </div>
        ${!m.isVac ? toggleBtn : ''}
      </div>`;
    };
    const workingHtml = working.length
      ? `<div style="font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">✅ Disponibles (${working.length})</div><div style="display:flex;flex-direction:column;gap:6px">${working.map(m => memberRow(m, false)).join('')}</div>`
      : '<div style="font-size:14px;color:var(--text-secondary)">No hay managers/leads disponibles esta semana.</div>';
    const absentHtml = absent.length
      ? `<div style="font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;margin:14px 0 6px">🏖️ Ausentes (${absent.length})</div><div style="display:flex;flex-direction:column;gap:6px">${absent.map(m => memberRow(m, true)).join('')}</div>`
      : '';
    content = workingHtml + absentHtml;
  } else if(step===2) {
    // Checklist de preparación semanal
    const prepKey = 'apg_prep_checklist_' + weekStart;
    const prepDone = load(prepKey, {});
    const prepHtml = `
      <div style="margin-bottom:20px">
        <div style="font-size:12px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">✅ Preparación semanal</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${PREP_CHECKLIST_ITEMS.map(item => `
            <label style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--surface2);border-radius:var(--radius-sm);cursor:pointer;${prepDone[item.id]?'opacity:0.55;text-decoration:line-through;':''}">
              <input type="checkbox" style="accent-color:var(--accent);flex-shrink:0" ${prepDone[item.id]?'checked':''} onchange="togglePrepItem('${item.id}','${weekStart}')">
              <span style="font-size:13px;font-weight:500">${item.label}</span>
            </label>
          `).join('')}
        </div>
      </div>`;

    // Tareas de la semana — vista lista o Eisenhower
    const weekTasks=tasks.filter(t=>!t.done&&t.date>=weekStart&&t.date<=weekEndStr).sort((a,b)=>({alta:0,media:1,baja:2}[a.pri]||2)-({alta:0,media:1,baja:2}[b.pri]||2));
    const tasksHtml = weekTasks.length
      ? `<div style="display:flex;flex-direction:column;gap:6px">${weekTasks.map(t=>`<div class="task-item priority-${t.pri}"><input type="checkbox" class="task-checkbox" onchange="toggleTask(${t.id});renderRoutineStep(2)"><span class="task-text">${esc(t.text)}</span><span class="priority-badge ${t.pri}">${t.pri.toUpperCase()}</span></div>`).join('')}</div>`
      : '<div style="font-size:14px;color:var(--text-secondary)">No hay tareas asignadas para esta semana. ✅</div>';

    const isEis = _routineTaskView === 'eisenhower';
    const viewToggle = `
      <div style="display:flex;gap:6px;margin-bottom:10px">
        <button class="btn-secondary" style="${!isEis?'background:var(--accent);color:#fff':''}" onclick="setRoutineTaskView('lista')">📋 Lista</button>
        <button class="btn-secondary" style="${isEis?'background:var(--accent);color:#fff':''}" onclick="setRoutineTaskView('eisenhower')">🔲 Eisenhower</button>
      </div>`;
    const tasksView = isEis ? renderRoutineEisenhower(weekStart) : tasksHtml;

    // Input de tarea rápida
    const quickAddHtml = `
      <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <input class="task-input" id="routine-quick-task" placeholder="➕ Añadir tarea rápida..." style="flex:1;min-width:180px" onkeydown="if(event.key==='Enter')addRoutineQuickTask('${weekStart}')">
        <label style="display:flex;align-items:center;gap:4px;font-size:13px;white-space:nowrap;cursor:pointer"><input type="checkbox" id="routine-quick-urgente"> ⚡ Urgente</label>
        <label style="display:flex;align-items:center;gap:4px;font-size:13px;white-space:nowrap;cursor:pointer"><input type="checkbox" id="routine-quick-importante"> ⭐ Importante</label>
        <button class="btn btn-primary" style="font-size:13px;white-space:nowrap" onclick="addRoutineQuickTask('${weekStart}')">Añadir</button>
      </div>`;

    content = prepHtml
      + `<div style="font-size:12px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">📋 Tareas de la semana</div>`
      + viewToggle
      + tasksView
      + quickAddHtml;
  } else if(step===3) {
    const weekEvts=events.filter(e=>e.date>=weekStart&&e.date<=weekEndStr).sort((a,b)=>(a.date+' '+(a.time||'')).localeCompare(b.date+' '+(b.time||'')));
    const weekReus=reuniones.filter(r=>{
      if(!r.datetime) return false;
      const d=r.datetime.split('T')[0];
      return d>=weekStart&&d<=weekEndStr;
    });
    const evtHtml=weekEvts.length
      ? weekEvts.map(e=>`<div style="padding:6px 10px;background:var(--surface2);border-radius:var(--radius-sm);font-size:13px;">${e.time?`<strong>${e.time}</strong> · `:''}${esc(e.title)}<span style="font-size:11px;color:var(--text-secondary);margin-left:6px">${window.fmtDate?.(e.date)||e.date}</span></div>`).join('')
      : '<div style="font-size:13px;color:var(--text-secondary)">Sin eventos de agenda esta semana.</div>';
    const reuHtml=weekReus.length
      ? weekReus.map(r=>{
          const timeStr = r.datetime ? new Date(r.datetime).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) : '';
          const editForm = `<div id="routine-edit-form-${r.id}" style="display:none;flex-direction:column;gap:6px;margin-top:6px;padding:8px;background:var(--surface);border-radius:var(--radius-sm);border:1px solid var(--border)">
            <input class="task-input" id="routine-edit-title-${r.id}" value="${esc(r.title)}" placeholder="Título..." style="font-size:13px">
            <input type="datetime-local" class="task-input" id="routine-edit-dt-${r.id}" value="${r.datetime||''}" style="font-size:13px">
            <div style="display:flex;gap:6px">
              <button class="btn btn-primary" style="font-size:12px;padding:4px 10px" onclick="saveEditRoutineReunion(${r.id})">💾 Guardar</button>
              <button class="btn btn-ghost" style="font-size:12px;padding:4px 10px" onclick="openEditRoutineReunion(${r.id})">Cancelar</button>
            </div>
          </div>`;
          return `<div style="padding:8px 10px;background:var(--surface2);border-radius:var(--radius-sm);font-size:13px">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <span style="flex:1;min-width:0">${timeStr?`<strong>${timeStr}</strong> · `:''}${esc(r.title)}</span>
              <select class="task-select" style="font-size:11px" onchange="updateReunion(${r.id},'status',this.value);renderRoutineStep(3)">
                <option ${r.status==='Programada'?'selected':''} value="Programada">Programada</option>
                <option ${r.status==='En curso'?'selected':''} value="En curso">En curso</option>
                <option ${r.status==='Completada'?'selected':''} value="Completada">Completada</option>
              </select>
              <button class="btn btn-ghost" style="font-size:12px;padding:3px 8px;flex-shrink:0" onclick="openEditRoutineReunion(${r.id})" title="Editar">✏️</button>
              <button class="btn btn-ghost" style="font-size:12px;padding:3px 8px;flex-shrink:0;color:var(--danger)" onclick="deleteRoutineReunion(${r.id})" title="Eliminar">🗑️</button>
            </div>
            ${editForm}
          </div>`;
        }).join('')
      : '<div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">Sin reuniones programadas esta semana.</div>';
    // Reuniones tipo (RECURRING_MEETINGS) visibles aunque no estén añadidas
    const recurringThisWeek = [];
    if (typeof window.RECURRING_MEETINGS !== 'undefined') {
      const monDate = new Date(weekStart + 'T12:00:00');
      window.RECURRING_MEETINGS.forEach(m => {
        const d = new Date(monDate);
        d.setDate(monDate.getDate() + (m.day - 1));
        const dateStr = d.toISOString().slice(0, 10);
        if (dateStr >= weekStart && dateStr <= weekEndStr) {
          recurringThisWeek.push({ ...m, dateStr });
        }
      });
    }
    const recHtml = recurringThisWeek.length
      ? recurringThisWeek.map(m => {
          const alreadyAdded = events.some(e => e.title === m.name && e.date === m.dateStr);
          const addBtn = !alreadyAdded
            ? `<button class="btn btn-primary" style="font-size:11px;padding:3px 8px;flex-shrink:0" onclick="addRecurringMeetingToWeek('${esc(m.name)}','${m.dateStr}','${m.time}','${esc(m.desc||'')}','${weekStart}')">➕ Añadir</button>`
            : '<span style="font-size:11px;color:var(--success);flex-shrink:0">✓ Añadida</span>';
          return `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--surface2);border-radius:var(--radius-sm);font-size:13px;opacity:${alreadyAdded ? 1 : 0.85}">
            <span style="flex:1">
              <strong>${new Date(m.dateStr + 'T12:00:00').toLocaleDateString('es-ES',{weekday:'short',day:'numeric'})} ${m.time}</strong> · ${esc(m.name)}
            </span>
            ${addBtn}
          </div>`;
        }).join('')
      : '<div style="font-size:13px;color:var(--text-secondary)">No hay reuniones tipo esta semana.</div>';
    // Formulario para añadir nueva reunión
    const defaultDt = weekStart + 'T09:00';
    const addForm = `
      <div style="margin-top:12px;padding:10px;background:var(--surface);border-radius:var(--radius-sm);border:1px solid var(--border)">
        <div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:8px">➕ Nueva reunión</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <input class="task-input" id="routine-new-meeting-title" placeholder="Título de la reunión..." style="font-size:13px" onkeydown="if(event.key==='Enter')addRoutineNewMeeting('${weekStart}')">
          <input type="datetime-local" class="task-input" id="routine-new-meeting-dt" value="${defaultDt}" style="font-size:13px">
          <button class="btn btn-primary" style="font-size:13px;align-self:flex-start" onclick="addRoutineNewMeeting('${weekStart}')">➕ Añadir reunión</button>
        </div>
      </div>`;
    content=`<div style="margin-bottom:12px"><div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:6px">AGENDA</div>${evtHtml}</div><div style="margin-bottom:12px"><div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:6px">REUNIONES TIPO</div>${recHtml}</div><div><div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:6px">REUNIONES</div>${reuHtml}${addForm}</div>`;
  } else if(step===4) {
    const saved=localStorage.getItem('apg_weekly_intention_'+weekStart)||'';
    content=`<textarea class="task-input" id="routine-intention" style="width:100%;min-height:120px;resize:vertical;font-size:15px" placeholder="¿Cuál es tu intención para esta semana?" oninput="localStorage.setItem('apg_weekly_intention_${weekStart}',this.value)">${esc(saved)}</textarea>`;
  }
  const s=ROUTINE_STEPS[step-1];
  const prevBtn=step>1?`<button class="btn btn-ghost" onclick="renderRoutineStep(${step-1})">← Anterior</button>`:'';
  const nextLabel=step===4?'🚀 Empezar la semana':'✓ '+(step===2?'Revisado':'Confirmado');
  const nextFn=step===4?`completeRoutine()`:`renderRoutineStep(${step+1})`;
  container.innerHTML=`
    <div class="page-title">📅 Weekly Prep</div>
    <div class="routine-progress">${progressDots}</div>
    <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">Paso ${step} de 4</div>
    <div class="routine-step-title">${s.title}</div>
    <div class="routine-step-sub">${s.sub}</div>
    <div class="routine-step-content">${content}</div>
    <div class="routine-actions">
      ${prevBtn}
      <button class="btn btn-primary" onclick="${nextFn}">${nextLabel}</button>
    </div>`;
}

export function changeTeamStatusFromRoutine(memberId, status) {
  const team = window.team || [];
  const m=team.find(m=>m.id===memberId); if(!m) return;
  m.status=status; window.saveTeam?.();
}

export function getVacWeekIndex(weekStart) {
  const d = new Date(weekStart + 'T12:00:00');
  const year = d.getFullYear();
  let refDate, weeks;
  if (year === 2025) {
    refDate = new Date('2025-01-06T12:00:00');
    weeks = window.LS_WEEKS_2025;
  } else if (year === 2026) {
    refDate = new Date('2026-01-05T12:00:00');
    weeks = window.LS_WEEKS_2026;
  } else {
    return -1;
  }
  const idx = Math.round((d - refDate) / (7 * 24 * 3600 * 1000));
  return (idx >= 0 && idx < weeks.length) ? idx : -1;
}

export function isPersonOnVacation(nombre, weekStart) {
  const d = new Date(weekStart + 'T12:00:00');
  const year = d.getFullYear();
  const idx = getVacWeekIndex(weekStart);
  if (idx === -1) return false;
  const nameUpper = nombre.toUpperCase().trim();
  // Use getVacPeopleForYear so overrides from localStorage are respected
  const allVac = (year === 2025 || year === 2026) ? window.getVacPeopleForYear?.(year) || [] : [];
  const p = allVac.find(p => p.name.toUpperCase() === nameUpper || (p.originalName && p.originalName.toUpperCase() === nameUpper));
  if (!p) return false;
  const val = (p.data[idx] || '').trim().toUpperCase();
  return val === 'V' || val === 'LEAVE' || val.includes('PARENTAL') || val.includes('LACTANCIA') || val.includes('UNPAID');
}

export function toggleRoutineAusente(memberId, weekStart) {
  const ausKey = 'apg_routine_ausencias_' + weekStart;
  const ausentes = load(ausKey, []);
  const idx = ausentes.indexOf(memberId);
  if (idx === -1) ausentes.push(memberId); else ausentes.splice(idx, 1);
  save(ausKey, ausentes);
  renderRoutineStep(1);
}

export function addRoutineNewMeeting(weekStart) {
  const reuniones = window.reuniones || [];
  const titleEl = document.getElementById('routine-new-meeting-title');
  const dtEl = document.getElementById('routine-new-meeting-dt');
  if (!titleEl) return;
  if (!titleEl.value.trim()) { titleEl.focus(); return; }
  reuniones.push({
    id: Date.now(),
    title: titleEl.value.trim(),
    datetime: dtEl ? dtEl.value : '',
    attendees: '',
    status: 'Programada',
    notes: '',
    agreements: [],
    nextSteps: [],
    collapsed: true
  });
  window.saveReuniones?.();
  titleEl.value = '';
  renderRoutineStep(3);
}

export function addRecurringMeetingToWeek(meetingName, meetingDate, meetingTime, meetingDesc, weekStart) {
  const events = window.events || [];
  const alreadyAdded = events.some(e => e.title === meetingName && e.date === meetingDate);
  if (alreadyAdded) return;
  const newEvent = {
    id: Date.now(),
    title: meetingName,
    date: meetingDate,
    time: meetingTime,
    desc: meetingDesc || ''
  };
  events.push(newEvent);
  window.saveEvents?.();
  renderRoutineStep(3, null, weekStart);
}

export function deleteRoutineReunion(id) {
  if (!confirm('¿Eliminar esta reunión?')) return;
  if (window.reuniones) window.reuniones = window.reuniones.filter(r => r.id !== id);
  window.saveReuniones?.();
  renderRoutineStep(3);
}

export function openEditRoutineReunion(id) {
  const formEl = document.getElementById('routine-edit-form-' + id);
  if (!formEl) return;
  formEl.style.display = formEl.style.display === 'none' ? 'flex' : 'none';
}

export function saveEditRoutineReunion(id) {
  const reuniones = window.reuniones || [];
  const r = reuniones.find(r => r.id === id);
  if (!r) return;
  const titleEl = document.getElementById('routine-edit-title-' + id);
  const dtEl = document.getElementById('routine-edit-dt-' + id);
  if (titleEl && titleEl.value.trim()) r.title = titleEl.value.trim();
  if (dtEl) r.datetime = dtEl.value;
  window.saveReuniones?.();
  renderRoutineStep(3);
}

export function togglePrepItem(itemId, weekStart) {
  const key = 'apg_prep_checklist_' + weekStart;
  const done = load(key, {});
  done[itemId] = !done[itemId];
  save(key, done);
  renderRoutineStep(2);
}

export function addRoutineQuickTask(weekStart) {
  const tasks = window.tasks || [];
  const inp = document.getElementById('routine-quick-task');
  if (!inp || !inp.value.trim()) return;
  const urgente = document.getElementById('routine-quick-urgente')?.checked || false;
  const importante = document.getElementById('routine-quick-importante')?.checked || false;
  const hasEisenhower = urgente || importante;
  let pri = 'media';
  if (hasEisenhower) {
    if (urgente && importante) pri = 'alta';
    else if (!urgente && importante) pri = 'alta';
    else if (urgente && !importante) pri = 'media';
    else pri = 'baja';
  }
  const newTask = {
    id: Date.now(),
    text: inp.value.trim(),
    pri,
    date: weekStart,
    done: false,
    createdDate: new Date().toISOString().split('T')[0],
    order: tasks.length
  };
  if (hasEisenhower) { newTask.urgente = urgente; newTask.importante = importante; }
  tasks.push(newTask);
  window.saveTasks?.();
  inp.value = '';
  const uel = document.getElementById('routine-quick-urgente');
  const iel = document.getElementById('routine-quick-importante');
  if (uel) uel.checked = false;
  if (iel) iel.checked = false;
  renderRoutineStep(2);
}

export function completeRoutine() {
  const weekStart=window.getWeekStart?.(0).toISOString().split('T')[0];
  save(K.routineDate, weekStart);
  save(K.routineStep, null);
  window.switchTab?.('resumen');
}

export function archivePreviousMonth() {
  const tasks = window.tasks || [];
  const reuniones = window.reuniones || [];
  const events = window.events || [];
  const now=new Date();
  const prevMonth=new Date(now.getFullYear(), now.getMonth()-1, 1);
  const year=prevMonth.getFullYear(), month=prevMonth.getMonth();
  const pad=n=>String(n).padStart(2,'0');
  const monthStr=`${year}_${pad(month+1)}`;
  const monthLabel=prevMonth.toLocaleDateString('es-ES',{month:'long',year:'numeric'});
  if(!confirm(`¿Archivar datos de ${monthLabel}? Esto moverá las tareas completadas, reuniones y eventos del mes pasado a un archivo separado.`)) return;
  const inPrevMonth=dateStr=>{
    if(!dateStr) return false;
    const d=new Date(dateStr+'T12:00:00');
    return d.getFullYear()===year && d.getMonth()===month;
  };
  const archiveTasks=tasks.filter(t=>t.done&&inPrevMonth(t.completedDate||t.date));
  const archiveReuniones=reuniones.filter(r=>r.status==='Completada'&&inPrevMonth(r.datetime?r.datetime.split('T')[0]:''));
  const archiveEvents=events.filter(e=>inPrevMonth(e.date));
  const key='apg_archive_'+monthStr;
  const existing=load(key,{tasks:[],reuniones:[],events:[]});
  save(key,{
    tasks:[...(existing.tasks||[]),...archiveTasks],
    reuniones:[...(existing.reuniones||[]),...archiveReuniones],
    events:[...(existing.events||[]),...archiveEvents],
  });
  if (window.tasks) window.tasks = window.tasks.filter(t=>!archiveTasks.some(a=>a.id===t.id));
  if (window.reuniones) window.reuniones = window.reuniones.filter(r=>!archiveReuniones.some(a=>a.id===r.id));
  if (window.events) window.events = window.events.filter(e=>!archiveEvents.some(a=>a.id===e.id));
  window.saveTasks?.(); window.saveReuniones?.(); window.saveEvents?.();
  window.renderTasks?.(); window.renderTeam?.(); window.renderEvents?.(); window.renderReuniones?.();
  const resultEl=document.getElementById('archive-result');
  if(resultEl) resultEl.textContent=`✅ Archivado correctamente. ${archiveTasks.length} tareas, ${archiveReuniones.length} reuniones, ${archiveEvents.length} eventos movidos a archivo.`;
}

export function viewArchive() {
  const viewEl=document.getElementById('archive-view'); if(!viewEl) return;
  const isOpen=viewEl.style.display!=='none';
  if(isOpen){ viewEl.style.display='none'; return; }
  viewEl.style.display='block';
  const keys=[];
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k&&k.startsWith('apg_archive_')) keys.push(k);
  }
  keys.sort().reverse();
  if(!keys.length){ viewEl.innerHTML='<div style="font-size:13px;color:var(--text-secondary)">No hay archivos todavía.</div>'; return; }
  viewEl.innerHTML=keys.map(k=>{
    const monthPart=k.replace('apg_archive_','').replace('_','/');
    const data=load(k,{tasks:[],reuniones:[],events:[]});
    return `<div class="archive-month-item">
      <div class="archive-month-header" onclick="this.nextElementSibling.classList.toggle('open')">
        <span>📦 ${monthPart}</span>
        <span>${(data.tasks||[]).length}t · ${(data.reuniones||[]).length}r · ${(data.events||[]).length}e ▾</span>
      </div>
      <div class="archive-month-body">
        ${(data.tasks||[]).map(t=>`<div>✅ ${esc(t.text)}</div>`).join('')}
        ${(data.reuniones||[]).map(r=>`<div>🗒️ ${esc(r.title)}</div>`).join('')}
        ${(data.events||[]).map(e=>`<div>📅 ${esc(e.title)}</div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

export function setRoutineTaskView(mode) {
  _routineTaskView = mode;
  save('apg_routine_eis_view', mode);
  renderRoutineStep(2);
}

export function renderRoutineEisenhower(weekStart) {
  const tasks = window.tasks || [];
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split('T')[0];
  const pending = tasks.filter(t => !t.done && t.date >= weekStart && t.date <= weekEndStr);
  const quadrants = [
    { label: '🔴 Hacer ya',   color: 'var(--danger)',          u: true,  i: true  },
    { label: '🟠 Planificar', color: '#ff9f0a',                u: false, i: true  },
    { label: '🟡 Delegar',    color: '#ff9f0a',                u: true,  i: false },
    { label: '⚪ Eliminar',   color: 'var(--text-secondary)',  u: false, i: false },
  ];
  const cellStyle = 'background:var(--surface2);border-radius:var(--radius);padding:14px;min-height:110px;';
  const q = quadrants.map(q => {
    const qTasks = pending.filter(t => window.isUrgente?.(t) === q.u && window.isImportante?.(t) === q.i);
    const items = qTasks.length
      ? qTasks.map(t => `<div draggable="true" ondragstart="routineEisDragStart(event,${t.id})" style="display:flex;align-items:flex-start;gap:6px;padding:4px 0;border-bottom:1px solid var(--border);font-size:13px;cursor:grab">
          <input type="checkbox" style="margin-top:2px;flex-shrink:0;accent-color:var(--accent)" onchange="toggleTask(${t.id});renderRoutineStep(2)">
          <span>${esc(t.text)}</span>
        </div>`).join('')
      : `<div style="font-size:12px;color:var(--text-secondary);padding-top:8px">Sin tareas</div>`;
    return `<div style="${cellStyle}border-top:3px solid ${q.color}" ondragover="eisDragOver(event)" ondragleave="eisDragLeave(event)" ondrop="routineEisDrop(event,${q.u},${q.i},'${weekStart}')">
      <div style="font-weight:700;font-size:13px;color:${q.color};margin-bottom:8px">${q.label}</div>
      ${items}
    </div>`;
  });
  return `<div style="display:grid;grid-template-columns:auto 1fr 1fr;grid-template-rows:auto 1fr 1fr;gap:8px;align-items:center">
    <div></div>
    <div style="text-align:center;font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.06em">⚡ URGENTE</div>
    <div style="text-align:center;font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.06em">🕐 NO URGENTE</div>
    <div style="writing-mode:vertical-rl;transform:rotate(180deg);font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.06em;text-align:center">⭐ IMPORTANTE</div>
    ${q[0]}
    ${q[1]}
    <div style="writing-mode:vertical-rl;transform:rotate(180deg);font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.06em;text-align:center">💤 NO IMPORT.</div>
    ${q[2]}
    ${q[3]}
  </div>`;
}

export function routineEisDragStart(e, taskId) {
  _routineEisDragTaskId = taskId;
  e.dataTransfer.effectAllowed = 'move';
  e.stopPropagation();
}

export function routineEisDrop(e, urgente, importante, weekStart) {
  e.preventDefault();
  e.currentTarget.classList.remove('eis-drag-over');
  if (_routineEisDragTaskId === null) return;
  const tasks = window.tasks || [];
  const task = tasks.find(t => t.id === _routineEisDragTaskId);
  if (!task) return;
  task.urgente = urgente;
  task.importante = importante;
  if (urgente && importante) task.pri = 'alta';
  else if (!urgente && importante) task.pri = 'alta';
  else if (urgente && !importante) task.pri = 'media';
  else task.pri = 'baja';
  window.saveTasks?.();
  _routineEisDragTaskId = null;
  renderRoutineStep(2);
}
