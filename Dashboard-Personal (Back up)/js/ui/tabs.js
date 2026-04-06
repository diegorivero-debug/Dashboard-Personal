import { K } from '../core/constants.js';
import { load } from '../core/utils.js';

export const TABS = ['resumen','weekly-report','routine','kpis','equipo','tareas','agenda','reuniones','actas','notas','feedback','vozcli','convs','person-timeline'];

export const TAB_GROUPS = {
  negocio:   [
    { id:'resumen',              label:'📊 Resumen' },
    { id:'weekly-report',        label:'📋 Weekly Report' },
    { id:'kpis',                 label:'📈 KPIs de Tienda' },
    { id:'routine',              label:'📅 Semana' },
    { id:'okrs',                 label:'🎯 OKR & Goals' },
    { id:'qbr',                  label:'📊 QBR' },
    { id:'commitments',          label:'🎯 Commitments Q' },
    { id:'commitments-timeline', label:'🗓️ Timeline' }
  ],
  equipo:    [
    { id:'equipo',           label:'👥 Mi Equipo' },
    { id:'person-timeline',  label:'📅 Timeline' },
    { id:'feedback',         label:'💬 Feedback SBI' },
    { id:'convs',            label:'📋 Conversaciones' },
    { id:'ls-index',         label:'📊 Leadership Index' }
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
  // Update scroll indicators after rendering new tabs
  requestAnimationFrame(updateNavTabsScrollIndicators);
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
  if(name==='weekly-report')  window.renderWeeklyReport?.();
  if(name==='okrs')           window.renderOKRs?.();
  if(name==='ls-vacaciones')  window.renderLSVacaciones?.();
  if(name==='ls-festivos')    window.renderLSFestivos?.();
  if(name==='ls-peticiones')  window.renderLSPeticiones?.();
  if(name==='ls-index')       window.renderLeadershipIndex?.();
  if(name==='person-timeline') window.renderPersonTimeline?.();
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

/* ── NAV TABS SCROLL INDICATORS ── */

/**
 * Updates the gradient fades and arrow button visibility on the
 * nav-tabs-wrapper based on the current scroll position.
 * Called after tab rendering and on every scroll event.
 */
export function updateNavTabsScrollIndicators() {
  const bar     = document.getElementById('nav-tabs-bar');
  const wrapper = document.getElementById('nav-tabs-wrapper');
  const arrowL  = document.getElementById('nav-tabs-arrow-left');
  const arrowR  = document.getElementById('nav-tabs-arrow-right');
  if (!bar || !wrapper) return;

  const hasOverflow = bar.scrollWidth > bar.clientWidth + 2; // +2 for rounding
  const atStart     = bar.scrollLeft <= 2;
  const atEnd       = bar.scrollLeft + bar.clientWidth >= bar.scrollWidth - 2;

  wrapper.classList.toggle('tabs-scrolled', !atStart);
  wrapper.classList.toggle('tabs-at-end',   atEnd || !hasOverflow);

  if (arrowL) arrowL.classList.toggle('visible', hasOverflow && !atStart);
  if (arrowR) arrowR.classList.toggle('visible', hasOverflow && !atEnd);
}

/**
 * Scrolls the nav-tabs bar by a fixed amount.
 * @param {number} direction  +1 to scroll right, -1 to scroll left
 */
export function scrollNavTabs(direction) {
  const bar = document.getElementById('nav-tabs-bar');
  if (!bar) return;
  bar.scrollBy({ left: direction * 160, behavior: 'smooth' });
}

/* Attach scroll listener to the nav-tabs bar once the DOM is ready */
function _initNavTabsScrollListener() {
  const bar = document.getElementById('nav-tabs-bar');
  if (!bar) return;
  bar.addEventListener('scroll', updateNavTabsScrollIndicators, { passive: true });
  window.addEventListener('resize', updateNavTabsScrollIndicators, { passive: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _initNavTabsScrollListener, { once: true });
} else {
  _initNavTabsScrollListener();
}

/* Expose to global scope so inline onclick="scrollNavTabs(...)" works */
window.scrollNavTabs = scrollNavTabs;
