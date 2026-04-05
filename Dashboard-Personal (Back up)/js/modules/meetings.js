/* ═══════════════════════════════════════════════
   MEETINGS MODULE — extracted from dashboard.js
   Handles reuniones CRUD, actas, templates,
   and meeting preparation.
═══════════════════════════════════════════════ */

import { K } from '../core/constants.js';
import { load, save, esc, num, fmtDate, flash, showToast } from '../core/utils.js';

// Local keys used for cross-module storage reads
const K_SBI = 'apg_sbi_history';
const K_VC  = 'apg_verbatims';

export let reuniones = load(K.reuniones, []);
export const saveReuniones = () => save(K.reuniones, reuniones);

export function addReunion() {
  const title=document.getElementById('re-title').value.trim();
  const datetime=document.getElementById('re-datetime').value;
  if(!title){ document.getElementById('re-title').focus(); return; }
  reuniones.push({
    id: Date.now(),
    title,
    datetime,
    attendees: document.getElementById('re-attendees').value.trim(),
    status: document.getElementById('re-status').value,
    notes: (document.getElementById('re-template-notes').value||'').trim(),
    agreements: [],
    nextSteps: [],
    collapsed: true
  });
  ['re-title','re-datetime','re-attendees','re-template-notes'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('re-status').value='Programada';
  saveReuniones(); renderReuniones(); window.toggleForm?.('add-reunion-form');
  if(document.getElementById('tab-actas').classList.contains('active')) renderActas();
}
export const rmReunion = id => { reuniones=reuniones.filter(r=>r.id!==id); saveReuniones(); renderReuniones(); };

export function updateReunion(id, field, value) {
  const r=reuniones.find(r=>r.id===id); if(!r) return;
  r[field]=value; saveReuniones();
  if(field==='status') { renderReuniones(); }
  else renderReunionBody(id);
}

export const MEETING_NOTES_TEMPLATE_1ON1 = `[🎯] Objetivo de la semana:\n\n[🚧] Bloqueos actuales:\n\n[✨] Feedback positivo:\n\n[➡️] Siguientes pasos (Next steps):\n`;

export function applyMeetingNotesTemplate(id) {
  const r=reuniones.find(r=>r.id===id); if(!r) return;
  if(r.notes && r.notes.trim() && !confirm('¿Reemplazar las notas actuales con la plantilla 1:1?')) return;
  r.notes = MEETING_NOTES_TEMPLATE_1ON1;
  saveReuniones();
  renderReunionBody(id);
}

export function addAgreement(id) {
  const inp=document.getElementById('re-agr-input-'+id);
  if(!inp||!inp.value.trim()) return;
  const r=reuniones.find(r=>r.id===id); if(!r) return;
  if(!r.agreements) r.agreements=[];
  r.agreements.push(inp.value.trim());
  inp.value='';
  saveReuniones(); renderReunionBody(id);
}
export function rmAgreement(id,idx) {
  const r=reuniones.find(r=>r.id===id); if(!r||!r.agreements) return;
  r.agreements.splice(idx,1); saveReuniones(); renderReunionBody(id);
}
export function addNextStep(id) {
  const person=document.getElementById('re-ns-person-'+id);
  const deadline=document.getElementById('re-ns-deadline-'+id);
  const desc=document.getElementById('re-ns-desc-'+id);
  if(!desc||!desc.value.trim()) return;
  const r=reuniones.find(r=>r.id===id); if(!r) return;
  if(!r.nextSteps) r.nextSteps=[];
  r.nextSteps.push({ person:person?person.value.trim():'', deadline:deadline?deadline.value:'', desc:desc.value.trim() });
  [person,deadline,desc].forEach(el=>{ if(el) el.value=''; });
  saveReuniones(); renderReunionBody(id);
}
export function rmNextStep(id,idx) {
  const r=reuniones.find(r=>r.id===id); if(!r||!r.nextSteps) return;
  r.nextSteps.splice(idx,1); saveReuniones(); renderReunionBody(id);
}
export function addNextStepToTasks(id,idx) {
  const r=reuniones.find(r=>r.id===id); if(!r||!r.nextSteps||!r.nextSteps[idx]) return;
  const ns=r.nextSteps[idx];
  const tasks = window.tasks || [];
  tasks.push({ id:Date.now(), text:`[${r.title}] ${ns.desc}${ns.person?' — '+ns.person:''}`, pri:'media', date:ns.deadline, done:false,
               createdDate:new Date().toISOString().split('T')[0], reunionId:r.id, order:tasks.length });
  window.saveTasks?.(); window.renderTasks?.();
  flash('kpi-saved');
}

/* ═══════════════════════════════════════════════
   EMAIL TEMPLATES (Feature 14)
═══════════════════════════════════════════════ */
export const EMAIL_TEMPLATES = {
  'sm':       { subject: 'Acta SM — Apple Passeig de Gràcia', intro: 'Equipo,\n\nAdjunto el acta del Store Meeting de hoy.' },
  'ppo':      { subject: 'Acta PPO — Apple Passeig de Gràcia', intro: 'Equipo,\n\nAdjunto el resumen de la reunión PPO.' },
  '1:1':      { subject: '1:1 Follow-up — Apple Passeig de Gràcia', intro: 'Hola,\n\nEste es el seguimiento de nuestra sesión 1:1.' },
  'comercial':{ subject: 'Acta Comercial España — Apple Passeig de Gràcia', intro: 'Equipo,\n\nResumen de la reunión comercial semanal con España.' },
  'kpi':      { subject: 'KPI Review — Apple Passeig de Gràcia', intro: 'Equipo,\n\nAdjunto la revisión semanal de KPIs.' },
  'people':   { subject: 'People Review — Apple Passeig de Gràcia', intro: 'Equipo,\n\nResumen del People Review semanal.' },
  'default':  { subject: 'Acta de Reunión — Apple Passeig de Gràcia', intro: 'Equipo,\n\nAdjunto el acta de la reunión.' },
};
export function getEmailTemplate(title) {
  const t = (title||'').toLowerCase();
  for(const [key,tpl] of Object.entries(EMAIL_TEMPLATES)) {
    if(key!=='default' && t.includes(key)) return tpl;
  }
  return EMAIL_TEMPLATES.default;
}
export function generateActaMailto(id) {
  const r=reuniones.find(r=>r.id===id); if(!r) return '#';
  const dt=r.datetime?new Date(r.datetime).toLocaleString('es-ES',{dateStyle:'medium',timeStyle:'short'}):'';
  const tpl=getEmailTemplate(r.title);
  let body=`${tpl.intro}\n\n`;
  body+=`ACTA DE REUNIÓN\n\nTítulo: ${r.title}\nFecha: ${dt}\nAsistentes: ${r.attendees||'—'}\n\n`;
  if(r.notes) body+=`NOTAS:\n${r.notes}\n\n`;
  if(r.agreements&&r.agreements.length){ body+=`ACUERDOS:\n`; r.agreements.forEach((a,i)=>body+=`${i+1}. ${a}\n`); body+='\n'; }
  if(r.nextSteps&&r.nextSteps.length){ body+=`PRÓXIMOS PASOS:\n`; r.nextSteps.forEach((ns,i)=>body+=`${i+1}. ${ns.desc}${ns.person?' ('+ns.person+')':''}${ns.deadline?' — Fecha: '+ns.deadline:''}\n`); }
  return `mailto:${encodeURIComponent(r.attendees||'')}?subject=${encodeURIComponent(tpl.subject)}&body=${encodeURIComponent(body)}`;
}

export function generateICS(id) {
  const r=reuniones.find(r=>r.id===id); if(!r||!r.datetime) return;
  const dt=new Date(r.datetime);
  const pad=n=>String(n).padStart(2,'0');
  const fmt=d=>`${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const MS_PER_HOUR = 3600000;
  const end=new Date(dt.getTime()+MS_PER_HOUR);
  let desc=r.notes||'';
  if(r.agreements&&r.agreements.length) desc+='\nAcuerdos:\n'+r.agreements.map((a,i)=>`${i+1}. ${a}`).join('\n');
  const ics=`BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${r.title}\nDTSTART:${fmt(dt)}\nDTEND:${fmt(end)}\nDESCRIPTION:${desc.replace(/\n/g,'\\n')}\nATTENDEE:${r.attendees}\nEND:VEVENT\nEND:VCALENDAR`;
  const blob=new Blob([ics],{type:'text/calendar'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${r.title.replace(/\s+/g,'_')}.ics`; a.click();
}

export function generateActaText(id) {
  const r=reuniones.find(r=>r.id===id); if(!r) return '';
  const dt=r.datetime?new Date(r.datetime).toLocaleString('es-ES',{dateStyle:'medium',timeStyle:'short'}):'';
  const tpl=getEmailTemplate(r.title);
  let txt=`${tpl.intro}\n\n`;
  txt+=`ACTA DE REUNIÓN — ${r.title}\nFecha: ${dt}\nAsistentes: ${r.attendees||'—'}\n\n`;
  txt+=`NOTAS:\n${r.notes||'—'}\n\n`;
  if(r.agreements&&r.agreements.length){ txt+=`ACUERDOS:\n`; r.agreements.forEach((a,i)=>txt+=`${i+1}. ${a}\n`); txt+='\n'; }
  if(r.nextSteps&&r.nextSteps.length){ txt+=`PRÓXIMOS PASOS:\n`; r.nextSteps.forEach((ns,i)=>txt+=`${i+1}. ${ns.desc}${ns.person?' (Responsable: '+ns.person+')':''}${ns.deadline?' — Fecha: '+new Date(ns.deadline+'T12:00:00').toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit'}):''}` + '\n'); }
  return txt;
}

export function renderReunionBody(id) {
  const r=reuniones.find(r=>r.id===id); if(!r) return;
  const body=document.getElementById('rb-'+id); if(!body) return;
  const tasks = window.tasks || [];
  const actaCard = r.status==='Completada' ? `
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px;margin-top:14px">
      <div class="card-title" style="margin-bottom:10px">📄 Acta lista para enviar</div>
      <textarea id="acta-text-${id}" class="task-input" style="width:100%;min-height:160px;resize:vertical;font-family:monospace;font-size:12px">${esc(generateActaText(id))}</textarea>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
        <button class="btn btn-ghost" style="font-size:12px" id="copy-acta-btn-${id}" onclick="copyActa(${id})">📋 Copiar acta</button>
        <a class="btn btn-ghost" style="font-size:12px;text-decoration:none" href="${generateActaMailto(id)}">📧 Enviar por email</a>
      </div>
    </div>` : '';

  body.innerHTML=`
    <div class="reunion-section-title">📋 Notas de la reunión</div>
    <textarea class="task-input" id="re-notes-${id}" style="width:100%;min-height:80px;resize:vertical" placeholder="Puntos tratados, contexto..." onchange="updateReunion(${id},'notes',this.value)">${esc(r.notes||'')}</textarea>
    <div style="margin-top:6px">
      <button class="btn btn-ghost" style="font-size:12px" onclick="applyMeetingNotesTemplate(${id})">📝 Aplicar plantilla 1:1</button>
    </div>

    <div class="reunion-section-title">✅ Acuerdos</div>
    ${(r.agreements||[]).map((a,i)=>`<div class="dynamic-list-item"><span style="flex:1">${esc(a)}</span><button class="btn-icon" onclick="rmAgreement(${id},${i})">×</button></div>`).join('')}
    <div style="display:flex;gap:8px;margin-top:6px">
      <input class="task-input" id="re-agr-input-${id}" placeholder="Nuevo acuerdo..." style="flex:1" onkeydown="if(event.key==='Enter')addAgreement(${id})">
      <button class="btn btn-ghost" style="font-size:12px" onclick="addAgreement(${id})">➕</button>
    </div>

    <div class="reunion-section-title">🚀 Próximos pasos</div>
    ${(r.nextSteps||[]).map((ns,i)=>`
      <div class="dynamic-list-item">
        <span style="flex:1">${esc(ns.desc)}${ns.person?` <span style="color:var(--accent)">(${esc(ns.person)})</span>`:''}${ns.deadline?` <span style="color:var(--text-secondary)">📅 ${fmtDate(ns.deadline)}</span>`:''}</span>
        <button class="btn btn-ghost" style="font-size:11px;padding:3px 8px" onclick="addNextStepToTasks(${id},${i})">➕ Tarea</button>
        <button class="btn-icon" onclick="rmNextStep(${id},${i})">×</button>
      </div>`).join('')}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
      <input class="task-input" id="re-ns-desc-${id}" placeholder="Descripción..." style="flex:2;min-width:140px">
      <input class="task-input" id="re-ns-person-${id}" placeholder="Responsable..." style="flex:1;min-width:100px">
      <input class="task-input" id="re-ns-deadline-${id}" type="date" style="min-width:auto;flex:none">
      <button class="btn btn-ghost" style="font-size:12px" onclick="addNextStep(${id})">➕</button>
    </div>

    <div class="reunion-section-title">✅ Tareas generadas</div>
    ${(()=>{
      const linked=tasks.filter(t=>t.reunionId===id);
      return linked.length
        ? linked.map(t=>`<div class="dynamic-list-item">
            <input type="checkbox" class="task-checkbox" ${t.done?'checked':''} onchange="toggleTask(${t.id})">
            <span style="flex:1;text-decoration:${t.done?'line-through':''};color:${t.done?'var(--text-secondary)':'inherit'}">${esc(t.text)}</span>
            <span class="priority-badge ${t.pri}" style="font-size:10px">${t.pri.toUpperCase()}</span>
          </div>`).join('')
        : '<div style="font-size:13px;color:var(--text-secondary);padding:4px 0">No hay tareas aún.</div>';
    })()}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
      <input class="task-input" id="rt-task-text-${id}" placeholder="Nueva tarea de esta reunión..." style="flex:2;min-width:140px" onkeydown="if(event.key==='Enter')addTaskFromReunion(${id})">
      <select class="task-select" id="rt-task-pri-${id}">
        <option value="alta">🔴 Alta</option>
        <option value="media" selected>🟡 Media</option>
        <option value="baja">🟢 Baja</option>
      </select>
      <input class="task-input" id="rt-task-date-${id}" type="date" style="min-width:auto;flex:none">
      <button class="btn btn-ghost" style="font-size:12px" onclick="addTaskFromReunion(${id})">➕ Crear tarea</button>
    </div>

    <div class="reunion-section-title">⚙️ Estado</div>
    <select class="task-select" onchange="updateReunion(${id},'status',this.value)">
      <option value="Programada"  ${r.status==='Programada' ?'selected':''}>Programada</option>
      <option value="En curso"    ${r.status==='En curso'   ?'selected':''}>En curso</option>
      <option value="Completada"  ${r.status==='Completada' ?'selected':''}>Completada</option>
    </select>
    ${actaCard}

    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">
      <a class="btn btn-ghost" style="font-size:12px;text-decoration:none" href="${generateActaMailto(id)}">📧 Enviar acta</a>
      <button class="btn btn-ghost" style="font-size:12px" onclick="generateICS(${id})">📅 Añadir a Calendar</button>
      <button class="btn-icon" style="margin-left:auto;color:var(--danger)" onclick="rmReunion(${id})" title="Eliminar reunión">🗑️ Eliminar</button>
    </div>`;
}
export function addTaskFromReunion(reunionId) {
  const textEl=document.getElementById('rt-task-text-'+reunionId);
  const priEl=document.getElementById('rt-task-pri-'+reunionId);
  const dateEl=document.getElementById('rt-task-date-'+reunionId);
  if(!textEl||!textEl.value.trim()) return;
  const tasks = window.tasks || [];
  const t={ id:Date.now(), text:textEl.value.trim(), pri:priEl?priEl.value:'media',
             date:dateEl?dateEl.value:'', done:false, reunionId,
             createdDate:new Date().toISOString().split('T')[0], order:tasks.length };
  tasks.push(t);
  textEl.value=''; if(dateEl) dateEl.value='';
  window.saveTasks?.(); window.renderTasks?.(); renderReunionBody(reunionId);
}

export function renderReuniones() {
  reuniones = load(K.reuniones, []);
  // Sort by datetime descending (most recent first); no-date items go to end
  reuniones.sort((a,b)=>{
    if(!a.datetime && !b.datetime) return 0;
    if(!a.datetime) return 1;
    if(!b.datetime) return -1;
    return (b.datetime > a.datetime ? 1 : b.datetime < a.datetime ? -1 : 0);
  });
  const list=document.getElementById('reuniones-list');
  const empty=document.getElementById('reuniones-empty');
  if(!list) return;
  if(!reuniones.length){ list.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';
  list.innerHTML=reuniones.map(r=>{
    const dt=r.datetime?new Date(r.datetime).toLocaleString('es-ES',{dateStyle:'medium',timeStyle:'short'}):'Sin fecha';
    return `<div class="reunion-card">
      <div class="reunion-header" onclick="toggleReunion(${r.id})">
        <span style="font-size:18px">🗒️</span>
        <div style="flex:1">
          <div class="reunion-title">${esc(r.title)}</div>
          <div class="reunion-meta">${dt} · ${r.attendees?r.attendees.split(',').length+' asistente(s)':'Sin asistentes'}</div>
        </div>
        <button class="btn btn-ghost prep-btn" style="font-size:11px;padding:4px 10px;flex-shrink:0" onclick="event.stopPropagation();prepararReunion(${r.id})">📋 Preparar</button>
        <span class="reunion-status status-${r.status.toLowerCase().replace(' ','-')}">${r.status}</span>
        <span style="color:var(--text-secondary);font-size:12px;margin-left:8px" id="re-toggle-icon-${r.id}">${r.collapsed===false?'▲':'▼'}</span>
      </div>
      <div class="reunion-body ${r.collapsed===false?'open':''}" id="rb-${r.id}"></div>
    </div>`;
  }).join('');
  reuniones.forEach(r=>{ if(r.collapsed===false) renderReunionBody(r.id); });
}

export function toggleReunion(id) {
  const r=reuniones.find(r=>r.id===id); if(!r) return;
  r.collapsed = r.collapsed===false ? true : false;
  saveReuniones();
  const body=document.getElementById('rb-'+id);
  const icon=document.getElementById('re-toggle-icon-'+id);
  if(body) { body.classList.toggle('open', !r.collapsed); if(!r.collapsed) renderReunionBody(id); }
  if(icon) icon.textContent = r.collapsed ? '▼' : '▲';
}

/* ═══════════════════════════════════════════════
   ACTAS (Feature 3)
═══════════════════════════════════════════════ */
export function renderActas() {
  reuniones = load(K.reuniones, []);
  const list=document.getElementById('actas-list');
  const empty=document.getElementById('actas-empty');
  const listView=document.getElementById('actas-list-view');
  const detailView=document.getElementById('actas-detail-view');
  if(!list) return;
  listView.style.display='block'; detailView.style.display='none';
  document.getElementById('actas-back-bar').style.display='none';
  const completed=reuniones.filter(r=>r.status==='Completada');
  if(!completed.length){ list.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';
  list.innerHTML=completed.map(r=>{
    const dt=r.datetime?new Date(r.datetime).toLocaleString('es-ES',{dateStyle:'medium',timeStyle:'short'}):'';
    return `<div class="acta-list-item" onclick="showActaDetail(${r.id})">
      <div style="font-weight:600;font-size:15px">${esc(r.title)}</div>
      <div style="font-size:12px;color:var(--text-secondary);margin-top:4px">${dt} · ${r.attendees||'Sin asistentes'}</div>
      <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${(r.agreements||[]).length} acuerdos · ${(r.nextSteps||[]).length} próximos pasos</div>
    </div>`;
  }).join('');
}

export function showActaDetail(id) {
  const r=reuniones.find(r=>r.id===id); if(!r) return;
  const listView=document.getElementById('actas-list-view');
  const detailView=document.getElementById('actas-detail-view');
  const backBar=document.getElementById('actas-back-bar');
  const reenviarBtn=document.getElementById('acta-reenviar-btn');
  listView.style.display='none'; detailView.style.display='block'; backBar.style.display='flex';
  if(reenviarBtn) reenviarBtn.onclick=()=>{ window.location.href=generateActaMailto(id); };
  const dt=r.datetime?new Date(r.datetime).toLocaleString('es-ES',{dateStyle:'long',timeStyle:'short'}):'';
  detailView.innerHTML=`<div style="max-width:720px;margin:0 auto;padding:24px">
    <div style="text-align:center;margin-bottom:32px">
      <div style="font-size:48px">&#63743;</div>
      <h1 style="font-size:26px;font-weight:700;letter-spacing:-0.02em;margin-top:8px">${esc(r.title)}</h1>
      <div style="color:var(--text-secondary);margin-top:6px">${dt}</div>
    </div>
    <div style="margin-bottom:18px">
      <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);margin-bottom:6px">Asistentes</div>
      <div>${esc(r.attendees||'—')}</div>
    </div>
    ${r.notes?`<div style="margin-bottom:18px">
      <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);margin-bottom:6px">Notas</div>
      <div style="white-space:pre-wrap">${esc(r.notes)}</div>
    </div>`:''}
    ${r.agreements&&r.agreements.length?`<div style="margin-bottom:18px">
      <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);margin-bottom:6px">Acuerdos</div>
      <ol style="padding-left:20px">${r.agreements.map(a=>`<li style="margin-bottom:4px">${esc(a)}</li>`).join('')}</ol>
    </div>`:''}
    ${r.nextSteps&&r.nextSteps.length?`<div style="margin-bottom:18px">
      <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);margin-bottom:6px">Próximos pasos</div>
      <ol style="padding-left:20px">${r.nextSteps.map(ns=>`<li style="margin-bottom:4px">${esc(ns.desc)}${ns.person?` <strong>${esc(ns.person)}</strong>`:''}${ns.deadline?` · ${fmtDate(ns.deadline)}`:''}</li>`).join('')}</ol>
    </div>`:''}
  </div>`;
}

export function showActaList() {
  document.getElementById('actas-list-view').style.display='block';
  document.getElementById('actas-detail-view').style.display='none';
  document.getElementById('actas-back-bar').style.display='none';
}

/* ═══════════════════════════════════════════════
   TEMPLATE MODAL
═══════════════════════════════════════════════ */
export const MEETING_TEMPLATES = [
  {
    id: 'rsm', emoji: '🗓️',
    title: 'Reunión Semanal Senior Managers',
    defaultTime: '15:30', defaultDuration: 90,
    attendeesSuggestion: 'Senior Managers de área',
    agenda: [
      'Revisión resultados semana anterior (KPIs comerciales y people)',
      'Novedades relevantes',
      'Prioridades comerciales semana en curso',
      'Prioridades people semana en curso',
      'Revisión roadmap del quarter',
      'Otros puntos'
    ],
    sendMinutes: true,
    notes: 'Lunes 15:30–17:00'
  },
  {
    id: 'rsl', emoji: '🤝',
    title: 'Reunión Semanal con el otro Store Leader',
    defaultTime: '10:00', defaultDuration: 60,
    attendeesSuggestion: 'Store Leader',
    agenda: [
      'Prioridades de cada tienda esta semana',
      'Alineamiento de criterios',
      'Compartir best practices',
      'Escalaciones o temas de personas',
      'Otros puntos'
    ],
    sendMinutes: false,
    notes: 'Lunes 10:00–11:00. Acta por mail o nota compartida en Box.'
  },
  {
    id: 'tb', emoji: '🎯',
    title: 'TB Individual Coaching & Follow-up',
    defaultTime: '09:00', defaultDuration: 30,
    attendeesSuggestion: '',
    agenda: [
      'Revisión objetivos semana anterior — ¿Qué fue bien?',
      'Revisión objetivos semana anterior — ¿Qué no fue bien?',
      '¿Qué vas a hacer distinto esta semana?',
      'Objetivos para la semana en curso',
      'Acuerdos y compromisos a revisar la próxima sesión'
    ],
    sendMinutes: true,
    notes: 'Semanal, 30 min. Estilo coaching. Enviar resumen por mail al finalizar.'
  },
  {
    id: 'rct', emoji: '🛍️',
    title: 'Reunión Comercial de Tienda',
    defaultTime: '15:00', defaultDuration: 60,
    attendeesSuggestion: 'Leads, Managers y Senior Managers de tienda',
    agenda: [
      'Repaso de resultados semana anterior',
      'Prioridades comerciales semana en curso',
      'Visión de prioridades próximas semanas',
      'Download call comercial de país — puntos clave',
      'Acciones a implantar esta semana',
      'Sección especial (si aplica)'
    ],
    sendMinutes: true,
    notes: 'Martes 15:00–16:00. Siempre se envía acta.'
  },
  {
    id: 'rpeople', emoji: '🫂',
    title: 'Reunión de People',
    defaultTime: '14:00', defaultDuration: 120,
    attendeesSuggestion: 'Senior Managers y Managers de tienda',
    agenda: [
      'Pulse — estado del equipo',
      'Desarrollo del equipo (Orchard, planes de carrera)',
      'Reconocimientos',
      'Temas de prioridad people de la semana',
      'Otros puntos'
    ],
    sendMinutes: true,
    notes: 'Miércoles 14:00–16:00. Siempre se envía acta.'
  },
  {
    id: 'tbpeople', emoji: '🫶',
    title: 'TB con People Manager',
    defaultTime: '10:00', defaultDuration: 60,
    attendeesSuggestion: 'People Manager',
    agenda: [
      'Revisión puntos semana anterior',
      'Puntos de la semana en curso',
      'Deadlines próximos de people',
      'Casos o temas abiertos',
      'Otros puntos'
    ],
    sendMinutes: true,
    notes: 'Martes 10:00–11:00. La SM propone los puntos. Siempre se envía acta.'
  },
  {
    id: 'rces', emoji: '🇪🇸',
    title: 'Reunión Comercial España',
    defaultTime: '14:00', defaultDuration: 90,
    attendeesSuggestion: 'Equipo comercial España',
    agenda: [
      'Análisis de resultados nacionales',
      'Download prioridades de país',
      'Novedades de producto',
      'Directrices para las tiendas',
      '⭐ Puntos clave a compartir con el equipo de tienda'
    ],
    sendMinutes: false,
    notes: 'Lunes 14:00–15:30. Reunión de escucha. Keynote compartida después. Anotar puntos a trasladar al equipo.'
  },
  {
    id: 'rcns', emoji: '🗺️',
    title: 'Reunión Comercial North Spain',
    defaultTime: '12:00', defaultDuration: 60,
    attendeesSuggestion: 'Store Leaders North Spain, Market Leader',
    agenda: [
      'Puntos propuestos por la Market Leader',
      'Análisis de resultados de la región',
      'Prioridades regionales',
      'Debate y alineamiento',
      '⭐ Puntos clave a trasladar al equipo'
    ],
    sendMinutes: false,
    notes: 'Martes 12:00–13:00. Participación activa.'
  },
  {
    id: 'rpns', emoji: '🫂🗺️',
    title: 'Reunión People North Spain',
    defaultTime: '12:00', defaultDuration: 60,
    attendeesSuggestion: 'Store Leaders North Spain, Market Leader',
    agenda: [
      'Temas people de la región',
      'Prioridades people de la semana',
      'Alineamiento criterios people entre tiendas',
      '⭐ Puntos a compartir con el leadership de tienda'
    ],
    sendMinutes: false,
    notes: 'Jueves 12:00–13:00. Con los otros Store Leaders.'
  },
  {
    id: 'rerlr', emoji: '⚖️',
    title: 'Reunión ER/LR',
    defaultTime: '13:00', defaultDuration: 30,
    attendeesSuggestion: 'ER/LR',
    agenda: [
      'Revisión casos abiertos',
      'Follow-up casos anteriores',
      'Casos nuevos (si los hay)',
      'Next steps y conclusiones'
    ],
    sendMinutes: true,
    notes: 'Lunes 13:00–13:30. Información confidencial — no distribuir el acta fuera del equipo autorizado.',
    confidential: true
  },
  {
    id: 'rppo', emoji: '📅',
    title: 'Reunión Semanal PPO (Horarios)',
    defaultTime: '10:00', defaultDuration: 60,
    attendeesSuggestion: 'Equipo PPO',
    agenda: [
      'Coberturas y necesidades de schedule',
      'Análisis de tendencias de tráfico',
      'Peticiones especiales o eventos',
      'Follow-up de reuniones anteriores',
      '⭐ Puntos a compartir con leadership'
    ],
    sendMinutes: false,
    notes: 'Jueves 10:00–11:00. Posible seguimiento con leadership después.'
  },
  {
    id: 'rcomite', emoji: '🏛️',
    title: 'Reunión Comité de Tienda',
    defaultTime: '11:00', defaultDuration: 60,
    attendeesSuggestion: 'Comité de empresa (representantes de trabajadores)',
    agenda: [
      'Puntos propuestos por el Comité',
      'Seguimiento puntos anteriores',
      'Toma de notas y compromisos',
      '⭐ Follow-up posterior con ER/LR'
    ],
    sendMinutes: true,
    notes: 'Jueves 11:00–12:00. Los puntos los propone el Comité. Hacer follow-up con ER/LR después.',
    confidential: true
  }
];

export function openTemplateModal() {
  const grid = document.getElementById('template-grid'); if(!grid) return;
  grid.innerHTML = MEETING_TEMPLATES.map((t,i) => {
    const meta = [t.defaultTime, `${t.defaultDuration}min`, t.attendeesSuggestion].filter(Boolean).join(' · ');
    return `
    <button class="template-card" onclick="applyTemplate(${i})">
      <div class="template-card-title">${esc(`${t.emoji} ${t.title}`)}</div>
      <div class="template-card-notes">${esc(meta)}</div>
    </button>`;
  }).join('');
  document.getElementById('template-overlay').classList.add('open');
}
export function closeTemplateModal() {
  document.getElementById('template-overlay').classList.remove('open');
}
export function closeTemplateModalOnBg(e) {
  if(e.target===document.getElementById('template-overlay')) closeTemplateModal();
}
export function applyTemplate(idx) {
  const t = MEETING_TEMPLATES[idx]; if(!t) return;
  closeTemplateModal();

  // Switch to the Notas & Reuniones tab
  window.switchTab?.('notas');

  // Build agenda HTML for the rich-text editor
  const agendaHtml = Array.isArray(t.agenda) && t.agenda.length
    ? '<ul>' + t.agenda.map(item => `<li>${esc(item)}</li>`).join('') + '</ul>'
    : '';

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const note = {
    id: window.mnGenId?.() || ('mn_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)),
    title: `${t.title} — ${todayStr}`,
    type: t.noteType || 'webex',
    datetime: `${todayStr}T${t.defaultTime || '09:00'}`,
    participants: t.attendeesSuggestion || '',
    tags: [],
    content: agendaHtml,
    privateNotes: '',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
  const mnNotes = window._mnNotes || [];
  mnNotes.unshift(note);
  save(K.meetingNotes, mnNotes);
  if (window._mnNotes) window._mnCurrentId = note.id;
  window.mnShowEditor?.(note);
  window.mnRenderList?.();
  document.getElementById('mn-title')?.focus();
}

export function copyActa(id) {
  const ta=document.getElementById('acta-text-'+id); if(!ta) return;
  const btn=document.getElementById('copy-acta-btn-'+id);
  const updateBtn=()=>{
    if(btn){ const orig=btn.textContent; btn.textContent='¡Copiado! ✓'; setTimeout(()=>btn.textContent=orig,2000); }
  };
  navigator.clipboard.writeText(ta.value).then(updateBtn).catch(()=>{
    ta.select(); document.execCommand('copy'); updateBtn();
  });
}

export function updateReunionOriginSelect() {
  const sel=document.getElementById('task-reunion-origin'); if(!sel) return;
  const cur=sel.value;
  sel.innerHTML='<option value="">Sin reunión asociada</option>';
  reuniones.forEach(r=>{
    const opt=document.createElement('option');
    opt.value=r.id; opt.textContent=r.title+(r.datetime?' ('+new Date(r.datetime).toLocaleDateString('es-ES',{day:'2-digit',month:'short'})+')':'');
    sel.appendChild(opt);
  });
  if(cur) sel.value=cur;
}

export function prepararReunion(reunionId) {
  const r = reuniones.find(x => x.id === reunionId);
  if (!r) return;
  const dt = r.datetime ? new Date(r.datetime).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' }) : 'Sin fecha';
  const kpis = load(K.kpis, {});
  const kpiRows = [
    { name: '💰 Ventas',   val: kpis.ventas,   obj: kpis.objVentas },
    { name: '⭐ NPS',      val: kpis.nps,      obj: kpis.objNps },
    { name: '⏰ DTA',      val: kpis.dta,      obj: kpis.objDta },
    { name: '🔄 Conv.',    val: kpis.conv,     obj: kpis.objConv },
    { name: '👣 Tráfico',  val: kpis.trafico,  obj: kpis.objTrafico },
  ];
  const kpiHTML = kpiRows.map(k => {
    const v = num(k.val), o = num(k.obj);
    const pct = o > 0 ? Math.round(v / o * 100) : 0;
    const icon = pct >= 100 ? '🟢' : pct >= 75 ? '🟡' : '🔴';
    return `<tr><td style="padding:5px 8px">${esc(k.name)}</td><td style="padding:5px 8px;text-align:right">${k.val || '—'}</td><td style="padding:5px 8px;text-align:right">${k.obj || '—'}</td><td style="padding:5px 8px;text-align:center">${icon}</td></tr>`;
  }).join('');

  // Related tasks + high-priority pending (max 5)
  const tasks = window.tasks || [];
  const relTasks = tasks.filter(t => !t.done && t.reunionId === reunionId);
  const highTasks = tasks.filter(t => !t.done && t.pri === 'alta' && t.reunionId !== reunionId);
  const taskList = [...relTasks, ...highTasks].slice(0, 5);
  const tasksHTML = taskList.length
    ? taskList.map(t => `<li style="margin-bottom:4px">${esc(t.text)} <span style="font-size:11px;color:var(--text-secondary)">[${t.pri.toUpperCase()}]</span></li>`).join('')
    : '<li style="color:var(--text-secondary)">Sin tareas pendientes relacionadas</li>';

  // Last 3 SBI feedbacks
  const sbiHistory = load(K_SBI, []).slice(0, 3);
  const sbiHTML = sbiHistory.length
    ? sbiHistory.map(fb => `<li style="margin-bottom:6px"><strong>${esc(fb.personName)}</strong> · ${esc(fb.date)}<br><span style="font-size:12px;color:var(--text-secondary)">${esc((fb.text||'').slice(0,120))}${(fb.text||'').length > 120 ? '…' : ''}</span></li>`).join('')
    : '<li style="color:var(--text-secondary)">Sin feedbacks registrados</li>';

  // Last 3 verbatims
  const verbatims = load(K_VC, []).slice(0, 3);
  const verbHTML = verbatims.length
    ? verbatims.map(v => `<li style="margin-bottom:6px"><span style="font-size:12px">${esc((v.text||'').slice(0,120))}${(v.text||'').length > 120 ? '…' : ''}</span> <span style="font-size:11px;color:var(--text-secondary)">· ${esc(v.date||'')}</span></li>`).join('')
    : '<li style="color:var(--text-secondary)">Sin feedback del cliente registrado</li>';

  const section = (title, content) =>
    `<div style="margin-bottom:18px">
       <div style="font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.04em;color:var(--text-secondary);margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid var(--border)">${title}</div>
       ${content}
     </div>`;

  const html = `
    ${section('📊 KPIs actuales', `<table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="color:var(--text-secondary);font-size:11px">
        <th style="padding:5px 8px;text-align:left">Métrica</th>
        <th style="padding:5px 8px;text-align:right">Actual</th>
        <th style="padding:5px 8px;text-align:right">Objetivo</th>
        <th style="padding:5px 8px;text-align:center">Estado</th>
      </tr></thead>
      <tbody>${kpiHTML}</tbody>
    </table>`)}
    ${section('✅ Tareas relacionadas', `<ul style="margin:0;padding-left:18px;font-size:13px">${tasksHTML}</ul>`)}
    ${section('💬 Últimos feedbacks SBI', `<ul style="margin:0;padding-left:18px;font-size:13px">${sbiHTML}</ul>`)}
    ${section('🗣️ Últimos feedbacks del cliente', `<ul style="margin:0;padding-left:18px;font-size:13px">${verbHTML}</ul>`)}`;

  const titleEl = document.getElementById('prep-reunion-title');
  const contentEl = document.getElementById('prep-reunion-content');
  const overlay = document.getElementById('prep-reunion-overlay');
  if (!titleEl || !contentEl || !overlay) return;
  titleEl.textContent = `📋 ${r.title} — ${dt}`;
  contentEl.innerHTML = html;
  overlay.classList.add('open');
}

export function closePrepReunionModal() {
  const overlay = document.getElementById('prep-reunion-overlay');
  if (overlay) overlay.classList.remove('open');
}
