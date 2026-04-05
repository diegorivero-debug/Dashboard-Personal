/* ═══════════════════════════════════════════════
   TEAM MODULE — extracted from dashboard.js
   Handles team members, Kanban board, PDI modal,
   and 1:1 prep modal.
═══════════════════════════════════════════════ */

import { K, equipoLiderazgo } from '../core/constants.js';
import { load, save, esc, showToast } from '../core/utils.js';

export let team = load(K.team, []);
export const saveTeam = () => { save(K.team, team); window.updateSummary?.(); };
export const COLORS = ['#0071e3','#34c759','#ff9f0a','#ff3b30','#af52de','#5ac8fa','#ff2d55','#30d158'];
export const initials = n => n.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();

if (!team.length) {
  team = equipoLiderazgo.map((m, i) => ({
    id: m.id,
    name: m.nombre,
    role: m.rol,
    email: m.email,
    status: 'activo',
    note: '',
    color: COLORS[i % COLORS.length]
  }));
  save(K.team, team);
}

export function addTeamMember() {
  const name=document.getElementById('new-team-name').value.trim();
  if(!name)return;
  team.push({ id:Date.now(), name, role:document.getElementById('new-team-role').value.trim()||'Specialist', email:document.getElementById('new-team-email').value.trim(), status:'activo', note:'' });
  document.getElementById('new-team-name').value='';
  document.getElementById('new-team-role').value='';
  document.getElementById('new-team-email').value='';
  saveTeam(); renderTeam(); window.toggleForm?.('add-team-form');
}

export const updStatus = (id,v) => { const m=team.find(m=>m.id===id); if(m){m.status=v;saveTeam();renderTeam();} };
export const updNote   = (id,v) => { const m=team.find(m=>m.id===id); if(m){m.note=v;saveTeam();} };
export const rmTeam    = id     => {
  const isLeader = equipoLiderazgo.some(e => e.id === id);
  if (isLeader) {
    const m = team.find(m => m.id === id);
    if (m) { m.hidden = true; saveTeam(); renderTeam(); window.updateRecogDropdown?.(); renderHiddenLeaders(); }
  } else {
    team=team.filter(m=>m.id!==id); saveTeam();
    const kb=load(K.kanban,{}); delete kb[id]; save(K.kanban,kb);
    renderTeam(); window.updateRecogDropdown?.(); renderKanban();
  }
};

export function restoreTeamMember(id) {
  const m = team.find(m => m.id === id);
  if (m) { delete m.hidden; saveTeam(); renderTeam(); window.updateRecogDropdown?.(); renderHiddenLeaders(); }
}

export function renderHiddenLeaders() {
  const container = document.getElementById('hidden-leaders-section');
  if (!container) return;
  const hidden = team.filter(m => m.hidden);
  if (!hidden.length) { container.style.display = 'none'; return; }
  container.style.display = 'block';
  container.innerHTML = `<div style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">Miembros ocultos (haz clic para restaurar)</div>`
    + hidden.map(m => `<button class="btn btn-ghost" style="font-size:12px;margin:4px 4px 0 0" onclick="restoreTeamMember(${m.id})">↩ ${esc(m.name)}</button>`).join('');
}

export function renderTeam() {
  const g=document.getElementById('team-grid'), e=document.getElementById('team-empty');
  const visibleTeam = team.filter(m => !m.hidden);
  if(!visibleTeam.length){ g.innerHTML=''; e.style.display='block'; renderHiddenLeaders(); return; }
  e.style.display='none';
  const tbs=load(K.tbs,{}), recogs=load(K.reconocimientos,[]), pdis=load(K.pdis,{});
  g.innerHTML=visibleTeam.map((m,i)=>{
    const tbList=tbs[m.id]||[];
    const hasPending=tbList.some(s=>s.followUp);
    const recogCount=recogs.filter(r=>r.personId===m.id).length;
    const tbSessions = (tbs[m.id] || []);
    const lastTB = tbSessions.length ? tbSessions.slice().sort((a,b) => new Date(b.date) - new Date(a.date))[0] : null;
    const daysSinceLastTB = lastTB ? Math.floor((Date.now() - new Date(lastTB.date)) / 86400000) : 999;
    const tbLight = daysSinceLastTB <= 7 ? '🟢' : daysSinceLastTB <= 21 ? '🟡' : '🔴';
    const tbLightLabel = daysSinceLastTB === 999 ? 'Sin 1:1 registrado' : daysSinceLastTB === 0 ? '1:1 hoy' : `Último 1:1 hace ${daysSinceLastTB}d`;
    const pdi = pdis[m.id] || {};
    const hasPDI = !!(pdi.strengths || pdi.weekGoal);
    return `
    <div class="team-card" style="position:relative">
      ${hasPending?'<span class="follow-up-dot" title="Seguimiento pendiente"></span>':''}
      <button class="team-remove" onclick="rmTeam(${m.id})" title="${equipoLiderazgo.some(e=>e.id===m.id)?'Ocultar':'Eliminar'}">×</button>
      ${recogCount>0?`<span class="recog-badge" style="display:inline-block">🏆 ${recogCount}</span>`:''}
      ${hasPDI ? '<span style="position:absolute;top:8px;left:24px;font-size:10px;background:rgba(52,199,89,0.15);color:var(--success);border-radius:6px;padding:1px 6px;font-weight:600">PDI</span>' : ''}
      <div class="team-avatar" style="background:${COLORS[i%COLORS.length]}">${initials(m.name)}</div>
      <div class="team-name">${esc(m.name)}</div>
      <div class="team-role">${esc(m.role)}</div>
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;display:flex;align-items:center;gap:5px">
        <span title="${tbLightLabel}">${tbLight}</span>
        <span>${tbLightLabel}</span>
      </div>
      ${m.email?`<div style="font-size:11px;color:var(--text-secondary);margin-bottom:6px">${esc(m.email)}</div>`:''}
      <div class="status-row">
        <span class="status-dot ${m.status}"></span>
        <select class="team-status-select" onchange="updStatus(${m.id},this.value)">
          <option value="activo"   ${m.status==='activo'  ?'selected':''}>Activo</option>
          <option value="descanso" ${m.status==='descanso'?'selected':''}>Descanso</option>
          <option value="libre"    ${m.status==='libre'   ?'selected':''}>Libre</option>
        </select>
      </div>
      <input class="team-note" placeholder="Nota de la semana..." value="${esc(m.note||'')}" onchange="updNote(${m.id},this.value)">
      <button class="btn btn-ghost" style="width:100%;margin-top:10px;font-size:12px" onclick="openTBModal(${m.id})">🤝 TB / 1:1</button>
      <button class="btn btn-ghost" style="width:100%;margin-top:6px;font-size:12px" onclick="openPDIModal(${m.id})">📈 PDI</button>
      <button class="btn btn-ghost" style="width:100%;margin-top:6px;font-size:12px" onclick="open1on1PrepModal(${m.id})">📋 Prep 1:1</button>
    </div>`;
  }).join('');
  renderHiddenLeaders();
}

/* ── Kanban Board ── */

export const KANBAN_COLS=[
  { id:'volando',     label:'🚀 Volando',           desc:'Por encima de expectativas' },
  { id:'seguimiento', label:'🔄 Seguimiento activo', desc:'Necesitan coaching' },
  { id:'desarrollo',  label:'📈 Plan de desarrollo', desc:'Mejora estructurada' },
];
export const AVATAR_COLORS=['#0071e3','#34c759','#ff9f0a','#af52de','#ff3b30','#5ac8fa','#ff6b35','#4ecdc4'];

export function renderKanban() {
  const board=document.getElementById('kanban-board'); if(!board) return;
  const kb=load(K.kanban,{});
  const kbNotes=load('apg_kanban_notes',{});

  board.innerHTML=KANBAN_COLS.map(col=>{
    const members=team.filter(m=>kb[m.id]===col.id);
    const chips=members.map(m=>{
      const ini=(m.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
      const color=AVATAR_COLORS[m.id%AVATAR_COLORS.length];
      return `<div class="kanban-chip" draggable="true" ondragstart="kanbanDragStart(event,${m.id})" id="kchip-${m.id}">
        <div class="kanban-avatar" style="background:${color}">${esc(ini)}</div>
        <span>${esc(m.name)}</span>
        <button class="kanban-remove" onclick="kanbanRemove(${m.id})" title="Quitar">×</button>
      </div>`;
    }).join('');

    const available=team.filter(m=>!kb[m.id]);
    const addSelect=available.length?`<select class="kanban-add-select" onchange="kanbanAdd(this,'${col.id}')">
      <option value="">+ Añadir persona...</option>
      ${available.map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join('')}
    </select>`:'';

    const noteVal=kbNotes[col.id]||'';
    return `<div class="kanban-col" id="kcol-${col.id}"
        ondragover="kanbanDragOver(event)"
        ondragleave="kanbanDragLeave(event)"
        ondrop="kanbanDrop(event,'${col.id}')">
      <div class="kanban-col-header">${col.label}</div>
      <div class="kanban-chips" id="kchips-${col.id}">${chips}</div>
      <div class="kanban-add-wrap">${addSelect}</div>
      <textarea class="kanban-note" placeholder="Nota de columna..." onchange="kanbanSaveNote('${col.id}',this.value)">${esc(noteVal)}</textarea>
    </div>`;
  }).join('');
}

export function kanbanDragStart(e, memberId) {
  e.dataTransfer.setData('text/plain', String(memberId));
  e.dataTransfer.effectAllowed='move';
}
export function kanbanDragOver(e) {
  e.preventDefault(); e.currentTarget.classList.add('drag-over');
}
export function kanbanDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }
export function kanbanDrop(e, colId) {
  e.preventDefault(); e.currentTarget.classList.remove('drag-over');
  const memberId=parseInt(e.dataTransfer.getData('text/plain'));
  if(!memberId) return;
  const kb=load(K.kanban,{}); kb[memberId]=colId; save(K.kanban,kb);
  renderKanban();
}
export function kanbanRemove(memberId) {
  const kb=load(K.kanban,{}); delete kb[memberId]; save(K.kanban,kb);
  renderKanban();
}
export function kanbanAdd(sel, colId) {
  const memberId=parseInt(sel.value); if(!memberId) return;
  const kb=load(K.kanban,{}); kb[memberId]=colId; save(K.kanban,kb);
  renderKanban();
}
export function kanbanSaveNote(colId, val) {
  const notes=load('apg_kanban_notes',{}); notes[colId]=val; save('apg_kanban_notes',notes);
}

/* ── PDI Modal ── */

const K_SBI = 'apg_sbi_history';

export let _pdiPersonId = null;
export function openPDIModal(personId) {
  _pdiPersonId = personId;
  const m = team.find(t => t.id === personId);
  if (!m) return;
  document.getElementById('pdi-modal-name').textContent = `📈 PDI — ${m.name}`;
  const pdis = load(K.pdis, {});
  const pdi = pdis[personId] || {};
  document.getElementById('pdi-strengths').value = pdi.strengths || '';
  document.getElementById('pdi-dev-areas').value = pdi.devAreas || '';
  document.getElementById('pdi-week-goal').value = pdi.weekGoal || '';
  document.getElementById('pdi-next-role').value = pdi.nextRole || '';
  document.getElementById('pdi-coaching-notes').value = pdi.coachingNotes || '';
  const upd = document.getElementById('pdi-updated-at');
  if (upd) upd.textContent = pdi.updatedAt ? `Última actualización: ${new Date(pdi.updatedAt).toLocaleDateString('es-ES')}` : '';
  document.getElementById('pdi-modal-overlay').classList.add('open');
}
export function closePDIModal() {
  document.getElementById('pdi-modal-overlay').classList.remove('open');
  _pdiPersonId = null;
}
export function savePDI() {
  if (!_pdiPersonId) return;
  const pdis = load(K.pdis, {});
  pdis[_pdiPersonId] = {
    strengths: document.getElementById('pdi-strengths').value,
    devAreas: document.getElementById('pdi-dev-areas').value,
    weekGoal: document.getElementById('pdi-week-goal').value,
    nextRole: document.getElementById('pdi-next-role').value,
    coachingNotes: document.getElementById('pdi-coaching-notes').value,
    updatedAt: new Date().toISOString()
  };
  save(K.pdis, pdis);
  const upd = document.getElementById('pdi-updated-at');
  if (upd) upd.textContent = `Última actualización: ${new Date().toLocaleDateString('es-ES')}`;
}

/* ── 1:1 Prep Modal ── */

export let _1on1PrepPersonId = null;

export function open1on1PrepModal(personId) {
  const overlay = document.getElementById('oneone-prep-overlay');
  if (!overlay) return;
  _1on1PrepPersonId = personId;
  const person = team.find(m => m.id === personId);
  if (!person) return;

  const todayStr = new Date().toISOString().slice(0, 10);
  const noteKey = `apg_1on1_prep_p${personId}_${todayStr}`;

  document.getElementById('oneone-prep-title').textContent = `📋 Prep 1:1 — ${person.name}`;

  const sbiHistory = load(K_SBI, []).filter(s => String(s.personId) === String(personId));
  const lastPos = sbiHistory.filter(s => s.type === 'positivo')[0];
  const lastDev = sbiHistory.filter(s => s.type === 'mejora')[0];

  const pdis = load(K.pdis, {});
  const pdi = pdis[personId] || {};

  const recogs = load(K.reconocimientos, []).filter(r => r.personId === personId)
    .sort((a,b) => (b.date||'').localeCompare(a.date||'')).slice(0, 3);

  const allTasks = load(K.tasks, []).filter(t => !t.done &&
    (t.text && t.text.toLowerCase().includes(person.name.toLowerCase()))
  ).slice(0, 5);

  const tbs = load(K.tbs, {});
  const tbSessions = (tbs[personId] || []).slice().sort((a,b) => (b.date||'').localeCompare(a.date||''));
  const lastTB = tbSessions[0] || null;

  const savedNotes = load(noteKey, '');

  let html = `<div style="font-size:14px;font-weight:700;margin-bottom:4px">${esc(person.name)}</div>`;
  html += `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:14px">${esc(person.role)}</div>`;

  html += `<div style="font-size:13px;font-weight:600;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid var(--border)">💬 Último feedback SBI</div>`;
  if (lastPos) {
    html += `<div style="margin-bottom:8px"><span style="background:rgba(52,199,89,0.15);color:var(--success);font-size:11px;font-weight:600;padding:2px 8px;border-radius:10px">✅ Positivo</span><span style="font-size:11px;color:var(--text-secondary);margin-left:6px">${esc(lastPos.date||'')}</span>`;
    html += `<div style="font-size:12px;margin-top:4px;color:var(--text-primary)">${esc((lastPos.text||'').slice(0,200))}${(lastPos.text||'').length>200?'…':''}</div></div>`;
  } else {
    html += `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">Sin feedback positivo registrado</div>`;
  }
  if (lastDev) {
    html += `<div style="margin-bottom:8px"><span style="background:rgba(255,159,10,0.15);color:var(--warning);font-size:11px;font-weight:600;padding:2px 8px;border-radius:10px">📈 Desarrollo</span><span style="font-size:11px;color:var(--text-secondary);margin-left:6px">${esc(lastDev.date||'')}</span>`;
    html += `<div style="font-size:12px;margin-top:4px;color:var(--text-primary)">${esc((lastDev.text||'').slice(0,200))}${(lastDev.text||'').length>200?'…':''}</div></div>`;
  } else {
    html += `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">Sin feedback de desarrollo registrado</div>`;
  }

  html += `<div style="font-size:13px;font-weight:600;margin-bottom:6px;margin-top:12px;padding-bottom:4px;border-bottom:1px solid var(--border)">📈 PDI / Notas de desarrollo</div>`;
  if (pdi.strengths || pdi.devAreas || pdi.weekGoal || pdi.nextRole) {
    if (pdi.strengths) html += `<div style="font-size:12px;margin-bottom:4px"><strong>Fortalezas:</strong> ${esc(pdi.strengths)}</div>`;
    if (pdi.devAreas)  html += `<div style="font-size:12px;margin-bottom:4px"><strong>Áreas de desarrollo:</strong> ${esc(pdi.devAreas)}</div>`;
    if (pdi.weekGoal)  html += `<div style="font-size:12px;margin-bottom:4px"><strong>Objetivo:</strong> ${esc(pdi.weekGoal)}</div>`;
    if (pdi.nextRole)  html += `<div style="font-size:12px;margin-bottom:4px"><strong>Próximo rol:</strong> ${esc(pdi.nextRole)}</div>`;
  } else {
    html += `<div style="font-size:12px;color:var(--text-secondary)">Sin PDI guardado</div>`;
  }

  html += `<div style="font-size:13px;font-weight:600;margin-bottom:6px;margin-top:12px;padding-bottom:4px;border-bottom:1px solid var(--border)">🏆 Últimos reconocimientos</div>`;
  if (recogs.length) {
    recogs.forEach(r => {
      html += `<div style="font-size:12px;margin-bottom:4px">🏆 ${esc(r.desc)} <span style="color:var(--text-secondary)">(${esc(r.date||'')})</span></div>`;
    });
  } else {
    html += `<div style="font-size:12px;color:var(--text-secondary)">Sin reconocimientos registrados</div>`;
  }

  html += `<div style="font-size:13px;font-weight:600;margin-bottom:6px;margin-top:12px;padding-bottom:4px;border-bottom:1px solid var(--border)">✅ Tareas pendientes relacionadas</div>`;
  if (allTasks.length) {
    allTasks.forEach(t => {
      html += `<div style="font-size:12px;margin-bottom:4px">• ${esc(t.text)}</div>`;
    });
  } else {
    html += `<div style="font-size:12px;color:var(--text-secondary)">Sin tareas pendientes relacionadas</div>`;
  }

  html += `<div style="font-size:13px;font-weight:600;margin-bottom:6px;margin-top:12px;padding-bottom:4px;border-bottom:1px solid var(--border)">🤝 Última sesión TB</div>`;
  if (lastTB) {
    html += `<div style="font-size:12px;margin-bottom:4px"><strong>${esc(lastTB.date||'')}</strong>`;
    if (lastTB.points) html += ` — ${esc(lastTB.points.slice(0,150))}`;
    html += `</div>`;
  } else {
    html += `<div style="font-size:12px;color:var(--text-secondary)">Sin sesión TB registrada</div>`;
  }

  html += `<div style="font-size:13px;font-weight:600;margin-bottom:6px;margin-top:12px;padding-bottom:4px;border-bottom:1px solid var(--border)">📝 Notas para hoy</div>`;
  html += `<textarea id="oneone-prep-notes" placeholder="Anotaciones para esta reunión..." style="width:100%;min-height:90px;padding:10px;font-size:13px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface2);color:var(--text-primary);resize:vertical;box-sizing:border-box">${esc(savedNotes)}</textarea>`;
  html += `<button class="btn btn-primary" style="margin-top:8px;font-size:12px" onclick="save1on1PrepNotes()">💾 Guardar notas</button>`;

  document.getElementById('oneone-prep-content').innerHTML = html;
  overlay.style.display = 'flex';
}

export function close1on1PrepModal() {
  const overlay = document.getElementById('oneone-prep-overlay');
  if (overlay) overlay.style.display = 'none';
  _1on1PrepPersonId = null;
}

export function save1on1PrepNotes() {
  if (!_1on1PrepPersonId) return;
  const todayStr = new Date().toISOString().slice(0, 10);
  const noteKey = `apg_1on1_prep_p${_1on1PrepPersonId}_${todayStr}`;
  const notes = document.getElementById('oneone-prep-notes')?.value || '';
  save(noteKey, notes);
  showToast('Notas guardadas', 'success');
}

export function print1on1Prep() {
  const content = document.getElementById('oneone-prep-content');
  const printEl = document.getElementById('oneone-prep-print');
  if (!content || !printEl) return;
  printEl.innerHTML = content.innerHTML;
  document.body.classList.add('printing-1on1');
  window.print();
  document.body.classList.remove('printing-1on1');
  printEl.innerHTML = '';
}
