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
  if(overdue.length) alerts.push({ icon:'⚠️', text:`${overdue.length} tarea(s) vencida(s)`, tab:'tareas', priority:'high' });

  const tbs=load(K.tbs,{});
  const team=load(K.team,[]);
  Object.entries(tbs).forEach(([mid,sessions])=>{
    const pending=sessions.filter(s=>s.followUp && !s.followUpDone);
    if(pending.length){
      const member=team.find(m=>m.id===parseInt(mid));
      alerts.push({ icon:'⏳', text:`Seguimiento pendiente con ${member?member.name:'un miembro'}`, tab:'equipo', priority:'medium' });
    }
  });

  const now=Date.now();
  const reuniones=load(K.reuniones,[]);
  reuniones.filter(r=>r.status==='Completada' && r.datetime).forEach(r=>{
    const dt=new Date(r.datetime).getTime();
    if(now-dt<48*3600*1000 && !r.notes && (!r.agreements||!r.agreements.length)){
      alerts.push({ icon:'📝', text:`${r.title} sin acta`, tab:'reuniones', priority:'medium' });
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
    if(overdueMembers.length) alerts.push({ icon:'🏆', text:`Reconocer: ${overdueMembers.length} persona${overdueMembers.length>1?'s':''} lleva${overdueMembers.length>1?'n':''} +14 días sin reconocimiento`, tab:'equipo', priority:'low' });
  } else if(!recogs.length){
    alerts.push({ icon:'🏆', text:'Aún no hay reconocimientos registrados', tab:'equipo', priority:'low' });
  }

  const ventas=num(document.getElementById('kpi-ventas')?.value||'0');
  const objV=num(document.getElementById('kpi-obj-ventas')?.value||'0');
  if(objV>0 && ventas/objV<0.7) alerts.push({ icon:'📉', text:`Ventas al ${Math.round(ventas/objV*100)}% del objetivo`, tab:'kpis', priority:'high' });

  return _sortAlerts(alerts);
}

/** Sort alerts by priority: high → medium → low */
function _sortAlerts(alerts) {
  const order = { high:0, medium:1, low:2 };
  return alerts.slice().sort((a,b)=>(order[a.priority]??2)-(order[b.priority]??2));
}

/**
 * Returns alerts reading everything from localStorage (no DOM access).
 * Safe to use in index.html where dashboard.html elements don't exist.
 */
export function getAlertsForHome() {
  const alerts=[];
  const today=new Date();
  const todayStr=(() => {
    const y=today.getFullYear();
    const mo=String(today.getMonth()+1).padStart(2,'0');
    const d=String(today.getDate()).padStart(2,'0');
    return `${y}-${mo}-${d}`;
  })();
  const MS_PER_DAY=86400*1000;

  /* ── Existing rules (DOM-free versions) ── */

  // Tareas vencidas → high
  const tasks=load(K.tasks,[]);
  const overdueTasks=tasks.filter(t=>!t.done && t.date && t.date<todayStr);
  if(overdueTasks.length) alerts.push({ icon:'⚠️', text:`${overdueTasks.length} tarea(s) vencida(s)`, tab:'tareas', priority:'high' });

  // Seguimiento pendiente TB → medium
  const tbs=load(K.tbs,{});
  const team=load(K.team,[]);
  Object.entries(tbs).forEach(([mid,sessions])=>{
    const pending=sessions.filter(s=>s.followUp && !s.followUpDone);
    if(pending.length){
      const member=team.find(m=>m.id===parseInt(mid));
      alerts.push({ icon:'⏳', text:`Seguimiento pendiente con ${member?member.name:'un miembro'}`, tab:'equipo', priority:'medium' });
    }
  });

  // Reunión sin acta → medium
  const now=Date.now();
  const reuniones=load(K.reuniones,[]);
  reuniones.filter(r=>r.status==='Completada' && r.datetime).forEach(r=>{
    const dt=new Date(r.datetime).getTime();
    if(now-dt<48*3600*1000 && !r.notes && (!r.agreements||!r.agreements.length)){
      alerts.push({ icon:'📝', text:`${r.title} sin acta`, tab:'reuniones', priority:'medium' });
    }
  });

  // Reconocimientos +14 días → low
  const recogs=load(K.reconocimientos,[]);
  const visibleForRecog=team.filter(m=>!m.hidden);
  if(visibleForRecog.length){
    const overdueMembers=visibleForRecog.filter(m=>{
      const last=recogs.filter(r=>r.personId===m.id).sort((a,b)=>b.date.localeCompare(a.date))[0];
      if(!last) return true;
      return Math.floor((new Date(todayStr)-new Date(last.date))/MS_PER_DAY)>14;
    });
    if(overdueMembers.length) alerts.push({ icon:'🏆', text:`Reconocer: ${overdueMembers.length} persona${overdueMembers.length>1?'s':''} lleva${overdueMembers.length>1?'n':''} +14 días sin reconocimiento`, tab:'equipo', priority:'low' });
  } else if(!recogs.length){
    alerts.push({ icon:'🏆', text:'Aún no hay reconocimientos registrados', tab:'equipo', priority:'low' });
  }

  // Ventas bajo objetivo (desde localStorage) → high
  const kpis=load(K.kpis,null);
  if(kpis){
    const v=num(kpis.ventas);
    const o=num(kpis.objVentas);
    if(o>0 && v/o<0.7) alerts.push({ icon:'📉', text:`Ventas al ${Math.round(v/o*100)}% del objetivo`, tab:'kpis', priority:'high' });
  }

  /* ── New rules ── */

  // 1. 👥 1:1 sin realizar en +14 días → high
  const visible=team.filter(m=>!m.hidden);
  const pending11=visible.filter(m=>{
    const sessions=tbs[m.id]||[];
    if(!sessions.length) return true;
    const lastDate=sessions.map(s=>s.date).filter(Boolean).sort().pop();
    if(!lastDate) return true;
    return Math.floor((today-new Date(lastDate+'T12:00:00'))/MS_PER_DAY)>14;
  });
  if(pending11.length>3){
    alerts.push({ icon:'👥', text:`${pending11.length} personas sin 1:1 en +14 días`, tab:'equipo', priority:'high' });
  } else {
    pending11.forEach(m=>{
      const sessions=tbs[m.id]||[];
      const lastDate=sessions.map(s=>s.date).filter(Boolean).sort().pop();
      const days=lastDate?Math.floor((today-new Date(lastDate+'T12:00:00'))/MS_PER_DAY):null;
      const suffix=days!=null?` (+${days} días)`:'';
      alerts.push({ icon:'👥', text:`1:1 pendiente con ${m.name}${suffix}`, tab:'equipo', priority:'high' });
    });
  }

  // 2. 📉 KPIs bajaron >5% vs semana anterior → high
  const kpiHistory=load(K.kpiHistory,[]);
  if(kpiHistory.length>=2){
    const sorted=[...kpiHistory].sort((a,b)=>(a.date||'').localeCompare(b.date||''));
    const prev=sorted[sorted.length-2];
    const last=sorted[sorted.length-1];
    const vPrev=num(prev.ventas);
    const vLast=num(last.ventas);
    const oPrev=num(prev.objVentas);
    const oLast=num(last.objVentas);
    const pctPrev=oPrev>0?vPrev/oPrev:null;
    const pctLast=oLast>0?vLast/oLast:null;
    if(pctPrev!=null && pctLast!=null && pctPrev>0){
      const drop=((pctPrev-pctLast)/pctPrev)*100;
      if(drop>5) alerts.push({ icon:'📉', text:`Ventas bajaron un ${Math.round(drop)}% vs semana anterior`, tab:'kpis', priority:'high' });
    }
  }

  // 3. 💾 Backup no realizado en +7 días → low
  const lastBackup=parseInt(localStorage.getItem('apg_last_backup')||'0',10);
  if(!lastBackup){
    alerts.push({ icon:'💾', text:'No has hecho backup nunca', tab:null, priority:'low' });
  } else {
    const backupDays=Math.floor((Date.now()-lastBackup)/MS_PER_DAY);
    if(backupDays>7) alerts.push({ icon:'💾', text:`No has hecho backup en ${backupDays} días`, tab:null, priority:'low' });
  }

  // 4. 📅 Reuniones de hoy sin briefing → medium
  const events=load(K.events,[]);
  const todayEvents=events.filter(ev=>ev.date===todayStr);
  const briefingDate=load(K.briefingDate,null);
  if(todayEvents.length>0 && briefingDate!==todayStr){
    alerts.push({ icon:'📅', text:`Tienes ${todayEvents.length} reunión${todayEvents.length>1?'es':''} hoy y no has hecho el briefing`, tab:'resumen', priority:'medium' });
  }

  // 5. 🎯 Ventas entre 85-99% del objetivo → medium
  if(kpis){
    const v=num(kpis.ventas);
    const o=num(kpis.objVentas);
    if(o>0){
      const p=v/o*100;
      if(p>=85 && p<100) alerts.push({ icon:'🎯', text:`¡Ventas al ${Math.round(p)}% del objetivo — un último empujón!`, tab:'kpis', priority:'medium' });
    }
  }

  // 6. 💬 Sin feedback SBI en +14 días → low
  const sbiHistory=load('apg_sbi_history',[]);
  if(!sbiHistory.length){
    alerts.push({ icon:'💬', text:'Llevas +14 días sin registrar feedback SBI', tab:'feedback', priority:'low' });
  } else {
    const lastSbi=sbiHistory[0];
    if(lastSbi && lastSbi.date){
      const sbiDays=Math.floor((today-new Date(lastSbi.date+'T12:00:00'))/MS_PER_DAY);
      if(sbiDays>14) alerts.push({ icon:'💬', text:'Llevas +14 días sin registrar feedback SBI', tab:'feedback', priority:'low' });
    }
  }

  return _sortAlerts(alerts);
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
