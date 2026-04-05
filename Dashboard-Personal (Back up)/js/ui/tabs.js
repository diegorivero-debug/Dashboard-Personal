import { K } from '../core/constants.js';
import { load } from '../core/utils.js';

export const TABS = ['resumen','routine','kpis','equipo','tareas','agenda','reuniones','actas','notas','feedback','vozcli','convs'];

export const TAB_GROUPS = {
  negocio:   [
    { id:'resumen',              label:'📊 Resumen' },
    { id:'kpis',                 label:'📈 KPIs de Tienda' },
    { id:'routine',              label:'📅 Semana' },
    { id:'qbr',                  label:'📊 QBR' },
    { id:'commitments',          label:'🎯 Commitments Q' },
    { id:'commitments-timeline', label:'🗓️ Timeline' }
  ],
  equipo:    [
    { id:'equipo',    label:'👥 Mi Equipo' },
    { id:'feedback',  label:'💬 Feedback SBI' },
    { id:'convs',     label:'📋 Conversaciones' },
    { id:'ls-index',  label:'📊 Leadership Index' }
  ],
  cliente:   [
    { id:'vozcli',    label:'🗣️ Voz Cliente' }
  ],
  operativa: [
    { id:'tareas',    label:'✅ Tareas' },
    { id:'agenda',    label:'📅 Agenda' },
    { id:'reuniones', label:'🗒️ Reuniones' },
    { id:'actas',     label:'📄 Actas' },
    { id:'notas',     label:'📝 Notas' }
  ],
  leadership: [
    { id: 'ls-vacaciones',  label: '🏖️ Vacaciones' },
    { id: 'ls-festivos',    label: '📅 Devolución Festivos' },
    { id: 'ls-peticiones',  label: '📋 Peticiones & Tareas' },
  ]
};

export const DEFAULT_GROUP = 'negocio';
export let _activeGroup = DEFAULT_GROUP;

export function renderGroupTabs(group) {
  const bar = document.getElementById('nav-tabs-bar');
  if (!bar) return;
  const tabs = TAB_GROUPS[group] || [];
  bar.innerHTML = tabs.map(t =>
    `<div class="nav-tab" data-tab="${t.id}" onclick="switchTab('${t.id}')">${t.label}</div>`
  ).join('');
}

export function switchGroup(group, tabOverride) {
  if (!TAB_GROUPS[group]) return;
  _activeGroup = group;
  document.querySelectorAll('.nav-group-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.group === group);
  });
  renderGroupTabs(group);
  const firstTab = tabOverride && TAB_GROUPS[group].some(t => t.id === tabOverride)
    ? tabOverride
    : TAB_GROUPS[group][0].id;
  switchTab(firstTab);
}

export function switchTab(name) {
  /* If this tab belongs to a different group than the current one, switch the group first */
  const ownerGroup = Object.keys(TAB_GROUPS).find(g => TAB_GROUPS[g].some(t => t.id === name));
  if (ownerGroup && ownerGroup !== _activeGroup) {
    _activeGroup = ownerGroup;
    document.querySelectorAll('.nav-group-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.group === ownerGroup);
    });
    renderGroupTabs(ownerGroup);
  }
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('#nav-tabs-bar .nav-tab').forEach(t=>t.classList.remove('active'));
  const tabEl = document.getElementById('tab-'+name);
  if (tabEl) tabEl.classList.add('active');
  const tabBtn = document.querySelector(`#nav-tabs-bar .nav-tab[data-tab="${name}"]`);
  if (tabBtn) tabBtn.classList.add('active');
  if(name==='resumen')       { window.updateSummary?.(); window.checkAutoSuggestions?.(); window.renderTaskTrendChart?.(); window.renderFocusMetricDisplay?.(); window.renderKPIStreakAlerts?.(); window.renderMissionControl?.(); window.renderRadarChart?.(); }
  if(name==='routine')       window.renderRoutine?.();
  if(name==='kpis')          { window.renderKPIStreakAlerts?.(); window.renderCommitmentsKPIsMirror?.(); }
  if(name==='reuniones')     { window.renderReuniones?.(); window.updateReunionOriginSelect?.(); }
  if(name==='actas')         window.renderActas?.();
  if(name==='equipo')        { window.renderTeam?.(); window.renderRecogs?.(); window.updateRecogDropdown?.(); if(window._recogView==='scoreboard') window.renderScoreboard?.(); }
  if(name==='agenda')        { window.renderEvents?.(); window.applyAgendaView?.(); }
  if(name==='tareas')        { window.updateReunionOriginSelect?.(); window.setTaskView?.(typeof window._taskView!=='undefined'?window._taskView:load('apg_eisenhower_view','lista')); }
  if(name==='feedback')      { window.updateSBIPersonSelect?.(); window.renderSBIHistory?.(); }
  if(name==='vozcli')        { window.renderVerbatims?.(); window.renderVCStats?.(); window.renderVCInsights?.(); window.renderVCTrend?.(); window.renderVCAreaChart?.(); window.renderVCPareto?.(); window.renderVCCorrelation?.(); window.renderVCKeywords?.(); window.renderWowMoments?.(); window.renderImportHistory?.(); window.renderFeedbackSummary?.(); const dateEl = document.getElementById('vc-date'); if(dateEl && !dateEl.value) dateEl.value = new Date().toISOString().slice(0,10); }
  if(name==='convs')         { window.renderConvsGrid?.(); }
  if(name==='commitments')   { window.loadCommitmentsQuarter?.(window.getCurrentCommitmentsQuarter?.()); }
  if(name==='qbr')           { window.renderQBR?.(); }
  if(name==='commitments-timeline') window.renderCommitmentsTimeline?.();
  if(name==='ls-vacaciones')  window.renderLSVacaciones?.();
  if(name==='ls-festivos')    window.renderLSFestivos?.();
  if(name==='ls-peticiones')  window.renderLSPeticiones?.();
  if(name==='ls-index')       window.renderLeadershipIndex?.();
  if(name==='notas')          { window.renderMeetingNotes?.(); window.renderStorageIndicator?.(); }
}

/* Read ?seccion= URL param and activate the right group on load */
export function initGroupFromURL() {
  try {
    const params = new URLSearchParams(window.location.search);
    const seccion = params.get('seccion') || DEFAULT_GROUP;
    const group = TAB_GROUPS[seccion] ? seccion : DEFAULT_GROUP;
    switchGroup(group);
  } catch(e) {
    // Re-init after DOM is ready
    const reinit = () => {
      const params = new URLSearchParams(window.location.search);
      const seccion = params.get('seccion') || DEFAULT_GROUP;
      const group = TAB_GROUPS[seccion] ? seccion : DEFAULT_GROUP;
      switchGroup(group);
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', reinit, { once: true });
    } else {
      reinit();
    }
  }
}

/* Trigger auto-backup reminder once the DOM is ready */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.checkAutoBackup?.(), { once: true });
} else {
  window.checkAutoBackup?.();
}
