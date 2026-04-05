import { K } from '../core/constants.js';
import { load, save, esc, num, showToast } from '../core/utils.js';

export function requestNotifPerm() {
  if('Notification' in window && Notification.permission==='default') Notification.requestPermission();
}
export function scheduleNotification(t) {
  if(!t.date || !t.reminder) return;
  if(!('Notification' in window)) return;
  const dt = new Date(t.date+'T'+t.reminder);
  const diff = dt - Date.now();
  const MS_PER_DAY = 86400000;
  if(diff<=0 || diff>MS_PER_DAY) return; // skip past and >24h (rescheduled on next load)
  setTimeout(()=>{
    if(Notification.permission==='granted') {
      new Notification('⏰ Tarea pendiente', { body: `${t.text}\nPrioridad: ${t.pri?.toUpperCase() ?? 'N/A'}`, icon: './icon.svg' });
    }
  }, diff);
}
export function scheduleAllNotifications() {
  const tasks = load(K.tasks, []);
  tasks.filter(t=>!t.done&&t.date&&t.reminder).forEach(scheduleNotification);
}

export function getAlerts() {
  const alerts=[];
  const todayStr=new Date().toISOString().slice(0,10);

  const tasks=load(K.tasks,[]);
  const overdue=tasks.filter(t=>!t.done && t.date && t.date<todayStr);
  if(overdue.length) alerts.push({ icon:'⚠️', text:`${overdue.length} tarea(s) vencida(s)`, tab:'tareas' });

  const tbs=load(K.tbs,{});
  const team=load(K.team,[]);
  Object.entries(tbs).forEach(([mid,sessions])=>{
    const pending=sessions.filter(s=>s.followUp && !s.followUpDone);
    if(pending.length){
      const member=team.find(m=>m.id===parseInt(mid));
      alerts.push({ icon:'⏳', text:`Seguimiento pendiente con ${member?member.name:'un miembro'}`, tab:'equipo' });
    }
  });

  const now=Date.now();
  const reuniones=load(K.reuniones,[]);
  reuniones.filter(r=>r.status==='Completada' && r.datetime).forEach(r=>{
    const dt=new Date(r.datetime).getTime();
    if(now-dt<48*3600*1000 && !r.notes && (!r.agreements||!r.agreements.length)){
      alerts.push({ icon:'📝', text:`${r.title} sin acta`, tab:'reuniones' });
    }
  });

  /* PR3 Feature 1: Per-person 14-day recognition alert */
  const recogs=load(K.reconocimientos,[]);
  const MS_PER_DAY=86400*1000;
  const visibleForRecog=team.filter(m=>!m.hidden);
  if(visibleForRecog.length){
    const overdueMembers=visibleForRecog.filter(m=>{
      const last=recogs.filter(r=>r.personId===m.id).sort((a,b)=>b.date.localeCompare(a.date))[0];
      if(!last) return true;
      return Math.floor((new Date(todayStr)-new Date(last.date))/MS_PER_DAY)>14;
    });
    if(overdueMembers.length) alerts.push({ icon:'🏆', text:`Reconocer: ${overdueMembers.length} persona${overdueMembers.length>1?'s':''} lleva${overdueMembers.length>1?'n':''} +14 días sin reconocimiento`, tab:'equipo' });
  } else if(!recogs.length){
    alerts.push({ icon:'🏆', text:'Aún no hay reconocimientos registrados', tab:'equipo' });
  }

  const ventas=num(document.getElementById('kpi-ventas')?.value||'0');
  const objV=num(document.getElementById('kpi-obj-ventas')?.value||'0');
  if(objV>0 && ventas/objV<0.7) alerts.push({ icon:'📉', text:`Ventas al ${Math.round(ventas/objV*100)}% del objetivo`, tab:'kpis' });

  return alerts;
}
export function updateNotifBadge() {
  const alerts=getAlerts();
  const badge=document.getElementById('notif-badge');
  if(badge){
    if(alerts.length>0){ badge.style.display='flex'; badge.textContent=alerts.length; } else { badge.style.display='none'; }
  }
}
export function toggleNotifications() {
  const panel=document.getElementById('notif-panel'); if(!panel) return;
  const isOpen=panel.classList.toggle('open');
  if(isOpen) renderNotifications();
}
export function renderNotifications() {
  const items=document.getElementById('notif-items'); if(!items) return;
  const alerts=getAlerts();
  updateNotifBadge();
  if(!alerts.length){
    items.innerHTML=`<div class="notif-empty">✅ Todo en orden<br><span style="font-size:12px;margin-top:4px;display:block">No hay alertas pendientes. ¡Buen trabajo!</span></div>`;
    return;
  }
  items.innerHTML=alerts.map(a=>`<div class="notif-item">
    <div class="notif-icon">${a.icon}</div>
    <div class="notif-text">${esc(a.text)}</div>
    <button class="notif-go" onclick="switchTab('${a.tab}');document.getElementById('notif-panel').classList.remove('open')">Ver →</button>
  </div>`).join('');
}
