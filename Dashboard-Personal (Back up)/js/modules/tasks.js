/* ═══════════════════════════════════════════════
   TASKS MODULE — extracted from dashboard.js
   Handles task CRUD, filters, drag-drop, and
   Eisenhower matrix views.
═══════════════════════════════════════════════ */

import { K } from '../core/constants.js';
import { load, save, esc, fmtDate, showToast } from '../core/utils.js';

export let tasks = load(K.tasks, []);
export let curFilter = 'todas';
export const saveTasks = () => { save(K.tasks, tasks); window.updateSummary?.(); };

export function addTask() {
  const txt = document.getElementById('new-task').value.trim();
  if(!txt) return;
  const reminder = document.getElementById('new-task-reminder').value;
  const reunionId = document.getElementById('task-reunion-origin')?.value || null;
  const recurrence = document.getElementById('task-recurrence')?.value || '';
  const today = new Date().toISOString().split('T')[0];
  const t = { id:Date.now(), text:txt, pri:document.getElementById('new-task-pri').value,
               date:document.getElementById('new-task-date').value, done:false, reminder,
               reunionId: reunionId || null, recurrence, createdDate: today,
               order: tasks.length };
  tasks.push(t);
  document.getElementById('new-task').value='';
  document.getElementById('new-task-date').value='';
  document.getElementById('new-task-reminder').value='';
  if(document.getElementById('task-reunion-origin')) document.getElementById('task-reunion-origin').value='';
  if(document.getElementById('task-recurrence')) document.getElementById('task-recurrence').value='';
  window.scheduleNotification?.(t);
  saveTasks(); renderTasks();
}

export const toggleTask = id => {
  const t=tasks.find(t=>t.id===id);
  if(!t) return;
  t.done=!t.done;
  if(t.done) {
    t.completedDate = new Date().toISOString().split('T')[0];
    if(t.recurrence) {
      const now = new Date();
      const nextDateObj = new Date(now);
      if(t.recurrence==='daily') nextDateObj.setDate(now.getDate()+1);
      else if(t.recurrence==='weekly') nextDateObj.setDate(now.getDate()+7);
      else { nextDateObj.setMonth(now.getMonth()+1); }
      const nextDate = nextDateObj.toISOString().split('T')[0];
      const copy = { id:Date.now()+Math.floor(Math.random()*1000)+100, text:t.text, pri:t.pri, date:nextDate, done:false,
                     reminder:t.reminder||'', reunionId:t.reunionId||null, recurrence:t.recurrence,
                     createdDate: new Date().toISOString().split('T')[0], order:tasks.length };
      tasks.push(copy);
      showToast('🔁 Tarea recurrente recreada para '+fmtDate(nextDate));
    }
  } else {
    delete t.completedDate;
  }
  saveTasks(); renderTasks(); renderResTasks();
};

export const deleteTask = id => { tasks=tasks.filter(t=>t.id!==id); saveTasks(); renderTasks(); renderResTasks(); };

export function setFilter(f,btn) {
  curFilter=f;
  document.querySelectorAll('.filter-pill').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderTasks();
}

export function clearFilter() {
  curFilter='todas';
  document.querySelectorAll('.filter-pill').forEach(b=>b.classList.remove('active'));
  const fp=document.getElementById('fp-todas'); if(fp) fp.classList.add('active');
  renderTasks();
}

export function renderTasks() {
  const PO={alta:0,media:1,baja:2};
  let f=[...tasks];
  if(curFilter==='pendientes')  f=f.filter(t=>!t.done);
  else if(curFilter==='completadas') f=f.filter(t=>t.done);
  else if(['alta','media','baja'].includes(curFilter)) f=f.filter(t=>t.pri===curFilter);
  f.sort((a,b)=>{
    if(a.done!==b.done) return a.done?1:-1;
    const ao=a.order!=null?a.order:9999, bo=b.order!=null?b.order:9999;
    if(ao!==bo) return ao-bo;
    return (PO[a.pri]||2)-(PO[b.pri]||2);
  });
  const list=document.getElementById('task-list'), empty=document.getElementById('task-empty');
  if(!f.length){ list.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';
  list.innerHTML=f.map(t=>{
    const reunion=t.reunionId ? (window.reuniones||[]).find(r=>r.id===t.reunionId) : null;
    const reunionBadge=reunion ? `<span class="task-meta" style="background:rgba(0,113,227,0.1);border-radius:6px;padding:2px 7px;">🗒️ ${esc(reunion.title)}</span>` : '';
    const recBadge=t.recurrence ? `<span class="recurrence-badge">🔁 ${t.recurrence==='daily'?'diaria':t.recurrence==='weekly'?'semanal':'mensual'}</span>` : '';
    return `<div class="task-item priority-${t.pri} ${t.done?'done':''}" draggable="true"
      ondragstart="taskDragStart(event,${t.id})"
      ondragover="taskDragOver(event)"
      ondragleave="taskDragLeave(event)"
      ondrop="taskDrop(event,${t.id})">
      <span class="task-drag-handle">⠿</span>
      <input type="checkbox" class="task-checkbox" ${t.done?'checked':''} onchange="toggleTask(${t.id})">
      <span class="task-text" ondblclick="startInlineEditTask(${t.id},this)">${esc(t.text)}</span>
      <select class="priority-select-inline priority-${t.pri}" onchange="changeTaskPriority(${t.id},this.value)" title="Cambiar prioridad">
        <option value="alta" ${t.pri==='alta'?'selected':''}>🔴 Alta</option>
        <option value="media" ${t.pri==='media'?'selected':''}>🟡 Media</option>
        <option value="baja" ${t.pri==='baja'?'selected':''}>🟢 Baja</option>
      </select>
      ${recBadge}${reunionBadge}
      ${t.date?`<span class="task-meta">📅 ${fmtDate(t.date)}</span>`:''}${t.reminder?`<span class="task-meta">⏰ ${t.reminder}</span>`:''}
      <button class="btn-icon" onclick="deleteTask(${t.id})" title="Eliminar">×</button>
    </div>`;
  }).join('');
}

export let _dragTaskId = null;
export function taskDragStart(e, id) { _dragTaskId=id; e.dataTransfer.effectAllowed='move'; }
export function taskDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }
export function taskDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }
export function taskDrop(e, targetId) {
  e.preventDefault(); e.currentTarget.classList.remove('drag-over');
  if(_dragTaskId===targetId) return;
  const fromIdx=tasks.findIndex(t=>t.id===_dragTaskId);
  const toIdx=tasks.findIndex(t=>t.id===targetId);
  if(fromIdx<0||toIdx<0) return;
  const [moved]=tasks.splice(fromIdx,1);
  tasks.splice(toIdx,0,moved);
  tasks.forEach((t,i)=>t.order=i);
  saveTasks(); renderTasks();
}

export function changeTaskPriority(taskId, newPri) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  task.pri = newPri;
  saveTasks();
  renderTasks();
}

export function startInlineEditTask(taskId, el) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  const oldText = task.text;
  const input = document.createElement('input');
  input.className = 'task-input';
  input.style.cssText = 'flex:1;font-size:14px;padding:4px 8px;';
  input.value = oldText;
  el.replaceWith(input);
  input.focus(); input.select();
  const saveFn = () => { task.text = input.value.trim() || oldText; saveTasks(); renderTasks(); };
  input.onblur = saveFn;
  input.onkeydown = e => { if(e.key==='Enter') saveFn(); if(e.key==='Escape') { task.text=oldText; renderTasks(); } };
}

export function renderResTasks() {
  const c=document.getElementById('res-tasks'), e=document.getElementById('res-tasks-empty'); if(!c)return;
  const PO={alta:0,media:1,baja:2};
  const p=tasks.filter(t=>!t.done).sort((a,b)=>(PO[a.pri]||2)-(PO[b.pri]||2)).slice(0,6);
  if(!p.length){ c.innerHTML=''; e.style.display='block'; return; }
  e.style.display='none';
  c.innerHTML=p.map(t=>`
    <div class="task-item priority-${t.pri}">
      <input type="checkbox" class="task-checkbox" onchange="toggleTask(${t.id})">
      <span class="task-text">${esc(t.text)}</span>
      <span class="priority-badge ${t.pri}">${t.pri.toUpperCase()}</span>
    </div>`).join('');
}

/* ── Eisenhower Matrix ── */

export let _taskView = load('apg_eisenhower_view', 'lista');
export let _routineTaskView = load('apg_routine_eis_view', 'lista');

export function setTaskView(mode) {
  _taskView = mode;
  save('apg_eisenhower_view', mode);
  const btnLista = document.getElementById('btn-view-lista');
  const btnEis = document.getElementById('btn-view-eisenhower');
  const eisWrap = document.getElementById('eisenhower-wrap');
  const taskList = document.getElementById('task-list');
  const taskEmpty = document.getElementById('task-empty');
  const filterRow = document.querySelector('#tab-tareas .filter-row');
  if (mode === 'eisenhower') {
    if (btnEis) btnEis.style.background = 'var(--accent)'; if (btnEis) btnEis.style.color = '#fff';
    if (btnLista) { btnLista.style.background = ''; btnLista.style.color = ''; }
    if (eisWrap) eisWrap.style.display = 'block';
    if (taskList) taskList.style.display = 'none';
    if (taskEmpty) taskEmpty.style.display = 'none';
    if (filterRow) filterRow.style.display = 'none';
    renderEisenhower();
  } else {
    if (btnLista) btnLista.style.background = 'var(--accent)'; if (btnLista) btnLista.style.color = '#fff';
    if (btnEis) { btnEis.style.background = ''; btnEis.style.color = ''; }
    if (eisWrap) eisWrap.style.display = 'none';
    if (taskList) taskList.style.display = '';
    if (filterRow) filterRow.style.display = '';
    renderTasks();
  }
}

export function isUrgente(t) {
  if (t.urgente !== undefined) return !!t.urgente;
  if (!t.date) return false;
  const today = new Date().toISOString().split('T')[0];
  return t.date <= today;
}

export function isImportante(t) {
  if (t.importante !== undefined) return !!t.importante;
  return t.pri === 'alta';
}

export function renderEisenhower() {
  const wrap = document.getElementById('eisenhower-wrap');
  if (!wrap) return;
  const pending = tasks.filter(t => !t.done);
  const quadrants = [
    { id: 'q1', label: '🔴 Hacer ya',    color: 'var(--danger)',   u: true,  i: true },
    { id: 'q2', label: '🟠 Planificar',  color: '#ff9f0a',         u: false, i: true },
    { id: 'q3', label: '🟡 Delegar',     color: '#ff9f0a',         u: true,  i: false },
    { id: 'q4', label: '⚪ Eliminar',    color: 'var(--text-secondary)', u: false, i: false },
  ];
  const cellStyle = 'background:var(--surface2);border-radius:var(--radius);padding:14px;min-height:140px;';

  const q = quadrants.map(q => {
    const qTasks = pending.filter(t => isUrgente(t) === q.u && isImportante(t) === q.i);
    const items = qTasks.length
      ? qTasks.map(t => `<div draggable="true" ondragstart="eisDragStart(event,${t.id})" style="display:flex;align-items:flex-start;gap:6px;padding:4px 0;border-bottom:1px solid var(--border);font-size:13px;cursor:grab">
          <input type="checkbox" style="margin-top:2px;flex-shrink:0" onchange="toggleTask(${t.id})">
          <span>${esc(t.text)}</span>
        </div>`).join('')
      : `<div style="font-size:12px;color:var(--text-secondary);padding-top:8px">Sin tareas</div>`;
    return `<div style="${cellStyle}border-top:3px solid ${q.color}" ondragover="eisDragOver(event)" ondragleave="eisDragLeave(event)" ondrop="eisDrop(event,${q.u},${q.i})">
      <div style="font-weight:700;font-size:13px;color:${q.color};margin-bottom:8px">${q.label}</div>
      ${items}
    </div>`;
  });

  wrap.innerHTML = `
    <div style="display:grid;grid-template-columns:auto 1fr 1fr;grid-template-rows:auto 1fr 1fr;gap:10px;align-items:center;margin-bottom:8px">
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

export let _eisDragTaskId = null;
export function eisDragStart(e, taskId) {
  _eisDragTaskId = taskId;
  e.dataTransfer.effectAllowed = 'move';
  e.stopPropagation();
}
export function eisDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('eis-drag-over');
}
export function eisDragLeave(e) {
  e.currentTarget.classList.remove('eis-drag-over');
}
export function eisDrop(e, urgente, importante) {
  e.preventDefault();
  e.currentTarget.classList.remove('eis-drag-over');
  if (_eisDragTaskId === null) return;
  const task = tasks.find(t => t.id === _eisDragTaskId);
  if (!task) return;
  task.urgente = urgente;
  task.importante = importante;
  if (urgente && importante) task.pri = 'alta';
  else if (!urgente && importante) task.pri = 'alta';
  else if (urgente && !importante) task.pri = 'media';
  else task.pri = 'baja';
  saveTasks();
  _eisDragTaskId = null;
  renderEisenhower();
}

/* ── Routine Eisenhower (Preparación de Semana) ── */

export function setRoutineTaskView(mode) {
  _routineTaskView = mode;
  save('apg_routine_eis_view', mode);
  window.renderRoutineStep?.(2);
}

export function renderRoutineEisenhower(weekStart) {
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
    const qTasks = pending.filter(t => isUrgente(t) === q.u && isImportante(t) === q.i);
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

export let _routineEisDragTaskId = null;
export function routineEisDragStart(e, taskId) {
  _routineEisDragTaskId = taskId;
  e.dataTransfer.effectAllowed = 'move';
  e.stopPropagation();
}
export function routineEisDrop(e, urgente, importante, weekStart) {
  e.preventDefault();
  e.currentTarget.classList.remove('eis-drag-over');
  if (_routineEisDragTaskId === null) return;
  const task = tasks.find(t => t.id === _routineEisDragTaskId);
  if (!task) return;
  task.urgente = urgente;
  task.importante = importante;
  if (urgente && importante) task.pri = 'alta';
  else if (!urgente && importante) task.pri = 'alta';
  else if (urgente && !importante) task.pri = 'media';
  else task.pri = 'baja';
  saveTasks();
  _routineEisDragTaskId = null;
  window.renderRoutineStep?.(2);
}

/* Hook into existing init flow — extend renderTasks and addTask */
(function patchFeatures() {
  const _origRenderTasks = renderTasks;
  window.renderTasks = function() {
    _origRenderTasks();
    if (typeof _taskView !== 'undefined' && _taskView === 'eisenhower') renderEisenhower();
  };

  const _origAddTask = addTask;
  window.addTask = function() {
    const txt = document.getElementById('new-task').value.trim();
    if (!txt) return;
    const urgente = document.getElementById('new-task-urgente')?.checked || false;
    const importante = document.getElementById('new-task-importante')?.checked || false;
    _origAddTask();
    const last = tasks[tasks.length - 1];
    if (last) { last.urgente = urgente; last.importante = importante; saveTasks(); }
    const uel = document.getElementById('new-task-urgente');
    const iel = document.getElementById('new-task-importante');
    if (uel) uel.checked = false;
    if (iel) iel.checked = false;
  };

  if (document.getElementById('tab-resumen')?.classList.contains('active')) {
    window.renderMissionControl?.();
    window.renderRadarChart?.();
  }
})();
