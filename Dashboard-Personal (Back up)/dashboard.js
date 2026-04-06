/* ═══════════════════════════════════════════════
   DATA LAYER
═══════════════════════════════════════════════ */
const K = { theme:'apg_theme', tasks:'apg_tasks', team:'apg_team', events:'apg_events', notes:'apg_notes', kpis:'apg_kpis', reuniones:'apg_reuniones', tbs:'apg_tbs', kpiHistory:'apg_kpi_history', reconocimientos:'apg_reconocimientos', agendaView:'apg_agenda_view', agendaWeekOffset:'apg_agenda_week_offset', briefingDate:'apg_briefing_date', briefingDates:'apg_briefing_dates', customQuotes:'apg_custom_quotes', kanban:'apg_team_kanban', comparativaOpen:'apg_comparativa_open', agendaMonthOffset:'apg_agenda_month_offset', pdis:'apg_pdis', agendaGoals:'apg_agenda_goals',
  pulse:'apg_pulse',   /* PR3 Feature 2: Pulse Check semanal — array de {id,weekStart,energy,momentum,climate,tensions,createdAt} */
  launch:'apg_launch', /* PR3 Feature 3: Modo Lanzamiento — {enabled,title,launchDateTime,checklist,dayKpis,postReview,updatedAt} */
  focusMetric:'apg_focus_metric',  /* K4 · Focus Metric de la Semana — {metric,hypothesis,reflection,updatedAt} */
  wowMoments:'apg_wow_moments',    /* V3 · Biblioteca de Wow Moments — array de {id,title,story,personId,date,category} */
  lastSummary:'apg_last_summary',  /* I1 · Resumen Semanal Auto-Generado — fecha del último resumen */
  commitments:'apg_commitments',   /* Commitments Q — datos de KPIs y acciones por quarter */
  commitmentsTimeline:'apg_commitments_timeline', /* Commitments Timeline — array de eventos del calendario Q3 FY26 */
  routineDate:'apg_routine_date',  /* Weekly Prep — fecha ISO de la semana completada */
  routineStep:'apg_routine_step',  /* Weekly Prep — paso actual (1-5) */
  meetingNotes:'apg_meeting_notes', /* Meeting Notes — array de notas de reunión con editor RTE */
  recurringMeetings:'apg_recurring_meetings', /* Editable recurring meetings (semana tipo) */
  managerConnections:'apg_manager_connections' /* Manager connection tracking from events */
};
const K_SBI = 'apg_sbi_history'; /* Feedback SBI history — defined early to prevent TDZ crash in renderTeam/renderTeamHealth */
// ── PERSISTENCE LAYER ──────────────────────────────────────────────────────
// Uses localStorage as the sole persistence mechanism
function load(k, d) {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : d;
  } catch { return d; }
}

/* ── IndexedDB fallback — used by save() when localStorage quota is exceeded ── */
const _IDB_NAME = 'apg-fallback', _IDB_STORE = 'kv';
let _idb = null;
function _initIDB() {
  if (_idb) return Promise.resolve(_idb);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(_IDB_NAME, 1);
    req.onupgradeneeded = e => {
      try { e.target.result.createObjectStore(_IDB_STORE); }
      catch(err) { reject(err); }
    };
    req.onsuccess = e => { _idb = e.target.result; resolve(_idb); };
    req.onerror = e => reject(e.target.error);
  });
}
function _idbSet(k, v) {
  return _initIDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(_IDB_STORE, 'readwrite');
    tx.objectStore(_IDB_STORE).put(v, k);
    tx.oncomplete = resolve;
    tx.onerror = e => reject(e.target.error);
  }));
}

function save(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch(e) {
    const isQuota = e instanceof DOMException &&
      (e.code === 22 || e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    if (isQuota) {
      _idbSet(k, JSON.stringify(v)).catch(idbErr => {
        console.error('IDB fallback also failed:', idbErr);
        showToast('⚠️ Almacenamiento lleno — algunos datos no pudieron guardarse', 'error');
      });
    } else {
      console.error('localStorage error:', e);
      showToast('Error al guardar los datos', 'error');
    }
  }
}

const AC_ALERT_THRESHOLD = 60; // % of AC+ goal below which an alert is shown

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */

/* Fallback used only when config.js is not loaded — no real personal data */
if (typeof equipoLiderazgo === 'undefined') {
  window.equipoLiderazgo = [
    { id: 1,  nombre: "Sheila Yubero",    rol: "Sr. Manager",  manager: "Jordi Pajares", email: "" },
    { id: 2,  nombre: "David Carrillo",   rol: "Manager",      manager: "Diego Rivero",  email: "" },
    { id: 3,  nombre: "Javier Quiros",    rol: "Manager",      manager: "Diego Rivero",  email: "" },
    { id: 4,  nombre: "Javi Canfranc",    rol: "Manager",      manager: "Diego Rivero",  email: "" },
    { id: 5,  nombre: "Cristina Carcel",  rol: "Sr. Manager",  manager: "Diego Rivero",  email: "" },
    { id: 6,  nombre: "Javi Sanchez",     rol: "Manager",      manager: "Diego Rivero",  email: "" },
    { id: 7,  nombre: "Ricardo Sosa",     rol: "Manager",      manager: "Diego Rivero",  email: "" },
    { id: 8,  nombre: "Toni Medina",      rol: "Manager",      manager: "Jordi Pajares", email: "" },
    { id: 9,  nombre: "Jorge Gil",        rol: "Sr. Manager",  manager: "Jordi Pajares", email: "" },
    { id: 10, nombre: "Pedro Borlido",    rol: "Manager",      manager: "Jordi Pajares", email: "" },
    { id: 11, nombre: "Meri Alvarez",     rol: "Manager",      manager: "Diego Rivero",  email: "" },
    { id: 12, nombre: "Ana Maria Pazos",  rol: "Manager",      manager: "Diego Rivero",  email: "" },
    { id: 13, nombre: "Itziar Cacho",     rol: "Sr. Manager",  manager: "Diego Rivero",  email: "" },
    { id: 14, nombre: "Jesus Pazos",      rol: "Manager",      manager: "Jordi Pajares", email: "" },
    { id: 15, nombre: "Deborah Ibañez",   rol: "Manager",      manager: "Jordi Pajares", email: "" },
    { id: 16, nombre: "Cristina Uson",    rol: "Manager",      manager: "Jordi Pajares", email: "" },
    { id: 17, nombre: "Julie Robin",      rol: "Manager",      manager: "Jordi Pajares", email: "" },
    { id: 18, nombre: "Jordi Pajares",    rol: "Store Leader", manager: "Ellie Bryan",   email: "" },
    { id: 19, nombre: "Diego Rivero",     rol: "Store Leader", manager: "Ellie Bryan",   email: "" }
  ];
}
if (typeof RECURRING_MEETINGS === 'undefined') {
  window.RECURRING_MEETINGS = [
    { name: 'Comercial España',    day: 1, time: '09:00', desc: 'Reunión semanal comercial con España' },
    { name: 'SM (Store Meeting)',  day: 1, time: '10:30', desc: 'Reunión semanal de Store Meeting' },
    { name: 'PPO',                 day: 2, time: '09:00', desc: 'Reunión semanal PPO' },
    { name: 'Market Leader 1:1',   day: 3, time: '11:00', desc: 'Check-in semanal con Market Leader' },
    { name: 'People Review',       day: 3, time: '14:00', desc: 'Revisión semanal de equipo' },
    { name: 'KPI Review',          day: 4, time: '09:30', desc: 'Revisión semanal de KPIs' },
    { name: 'Ops Weekly',          day: 4, time: '16:00', desc: 'Operaciones semanales' },
    { name: 'Sales Huddle',        day: 5, time: '08:30', desc: 'Daily/Weekly sales huddle' },
  ];
}

/** Return YYYY-MM-DD for a Date using local timezone (avoids UTC shift from toISOString). */
function localDateStr(d) {
  if (!d) d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Color labels: Azul=Comercial, Verde=People, Naranja=ER, Rojo=Mercado, Morado=One on One */
const COLOR_LABELS = { blue:'🔵 Comercial', green:'🟢 People', orange:'🟠 ER', red:'🔴 Mercado', purple:'🟣 One on One' };

function _managerOptions(selected) {
  const opts = ['<option value="">— Sin manager —</option>'];
  (typeof equipoLiderazgo !== 'undefined' ? equipoLiderazgo : []).forEach(m => {
    const sel = m.nombre === selected ? ' selected' : '';
    opts.push(`<option value="${esc(m.nombre)}"${sel}>${esc(m.nombre)} (${esc(m.rol)})</option>`);
  });
  return opts.join('');
}

function _colorOptions(selected) {
  return Object.entries(COLOR_LABELS).map(([val, lbl]) =>
    `<option value="${val}"${val===selected?' selected':''}>${lbl}</option>`
  ).join('');
}

function _getRecurringMeetings() {
  return load(K.recurringMeetings, null) || (typeof RECURRING_MEETINGS !== 'undefined' ? RECURRING_MEETINGS : []);
}
function _saveRecurringMeetings(list) { save(K.recurringMeetings, list); }

function _recordManagerConnection(managerName, date, eventTitle) {
  const connections = load(K.managerConnections, []);
  connections.push({ manager: managerName, date, event: eventTitle, timestamp: Date.now() });
  save(K.managerConnections, connections);
}

const DEFAULT_QUOTES = [
  { text: "La innovación distingue a los líderes de los seguidores.", author: "Steve Jobs" },
  { text: "El diseño no es solo cómo se ve. El diseño es cómo funciona.", author: "Steve Jobs" },
  { text: "Tu trabajo va a llenar gran parte de tu vida, y la única forma de estar verdaderamente satisfecho es hacer lo que crees que es un gran trabajo.", author: "Steve Jobs" },
  { text: "Sé un espejo que amplifique lo mejor de tu equipo.", author: "Tim Cook" },
  { text: "La calidad es más importante que la cantidad. Un home run es mucho mejor que dos dobles.", author: "Steve Jobs" },
  { text: "Rodéate de personas que desafíen tus pensamientos, que te hagan trabajar más duro y que te hagan mejor.", author: "Tim Cook" },
  { text: "La diferencia entre el líder y sus seguidores es la innovación.", author: "Steve Jobs" },
  { text: "El liderazgo es inspirar a otros a soñar más, aprender más, hacer más y convertirse en más.", author: "John Quincy Adams" },
  { text: "No gestionamos personas, lideramos personas y gestionamos procesos.", author: "H. Ross Perot" },
  { text: "Un gran negocio no es posible sin grandes personas.", author: "Apple Inc." },
  { text: "La excelencia nunca es un accidente. Siempre es el resultado de la alta intención, el esfuerzo sincero y la ejecución inteligente.", author: "Aristóteles" },
  { text: "La función del liderazgo es producir más líderes, no más seguidores.", author: "Ralph Nader" },
  { text: "Las personas que están suficientemente locas como para creer que pueden cambiar el mundo, son las que lo hacen.", author: "Apple - Think Different" },
  { text: "Mantente hambriento, mantente alocado.", author: "Steve Jobs" },
  { text: "El talento gana partidos, pero el trabajo en equipo y la inteligencia ganan campeonatos.", author: "Michael Jordan" },
  { text: "Un equipo alineado puede mover montañas.", author: "Diego Rivero" },
  { text: "El reconocimiento es el combustible del rendimiento.", author: "Diego Rivero" },
  { text: "Cada conversación de coaching es una inversión en el futuro del equipo.", author: "Diego Rivero" },
];

/* ═══════════════════════════════════════════════
   THEME
═══════════════════════════════════════════════ */
let dark = load(K.theme, false);
const applyTheme = () => {
  document.documentElement.setAttribute('data-theme', dark?'dark':'light');
  const btn = document.querySelector('#theme-toggle-btn');
  if (btn) btn.textContent = dark ? '☀️' : '🌙';
};
const toggleTheme = () => { dark=!dark; save(K.theme,dark); applyTheme(); };

/* ═══════════════════════════════════════════════
   CLOCK
═══════════════════════════════════════════════ */
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DIAS  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
function tick() {
  const n = new Date();
  const clockEl = document.getElementById('clock');
  if (clockEl) clockEl.textContent = n.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
  const h = n.getHours();
  const greetEl = document.getElementById('greeting');
  if (greetEl) greetEl.textContent = (h<13?'Buenos días':h<20?'Buenas tardes':'Buenas noches')+', Diego 👋';
  const ds = `${DIAS[n.getDay()].charAt(0).toUpperCase()+DIAS[n.getDay()].slice(1)}, ${n.getDate()} de ${MESES[n.getMonth()]} de ${n.getFullYear()}`;
  const dateEl = document.getElementById('today-date');
  if (dateEl) dateEl.textContent = ds;
}
setInterval(tick,1000);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    tick();
  }, { once: true });
} else {
  applyTheme();
  tick();
}

/* ═══════════════════════════════════════════════
   TABS & GROUPS
═══════════════════════════════════════════════ */
const TABS = ['resumen','routine','kpis','equipo','tareas','agenda','reuniones','actas','notas','feedback','vozcli','convs'];

const TAB_GROUPS = {
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
    { id:'equipo',          label:'👥 Mi Equipo' },
    { id:'person-timeline', label:'📅 Timeline' },
    { id:'profiles',        label:'👤 Perfiles' },
    { id:'feedback',        label:'💬 Feedback SBI' },
    { id:'convs',           label:'📋 Conversaciones' },
    { id:'ls-index',        label:'📊 Leadership Index' }
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

const DEFAULT_GROUP = 'negocio';
let _activeGroup = DEFAULT_GROUP;

function renderGroupTabs(group) {
  const bar = document.getElementById('nav-tabs-bar');
  if (!bar) return;
  const tabs = TAB_GROUPS[group] || [];
  bar.innerHTML = tabs.map(t =>
    `<div class="nav-tab" data-tab="${t.id}" onclick="switchTab('${t.id}')">${t.label}</div>`
  ).join('');
  requestAnimationFrame(() => window.updateNavTabsScrollIndicators?.());
}

function switchGroup(group, tabOverride) {
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

function switchTab(name) {
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
  if(name==='resumen')       { updateSummary(); checkAutoSuggestions(); renderResumenKPIs(); renderFocusMetricDisplay(); renderKPIStreakAlerts(); renderMissionControl(); renderRadarChart(); populateFocusMetricCommitmentsOptions?.(); }
  if(name==='routine')       renderRoutine();
  if(name==='kpis')          { renderKPIStreakAlerts(); renderCommitmentsKPIsMirror(); }
  if(name==='reuniones')     { renderReuniones(); updateReunionOriginSelect(); }
  if(name==='actas')         renderActas();
  if(name==='equipo')        { renderTeam(); renderRecogs(); updateRecogDropdown(); if(_recogView==='scoreboard') renderScoreboard(); }
  if(name==='profiles')      { renderProfilesGrid(); }
  if(name==='agenda')        { renderEvents(); applyAgendaView(); renderAgendaSidebar(); }
  if(name==='tareas')        { updateReunionOriginSelect(); setTaskView(typeof _taskView!=='undefined'?_taskView:load('apg_eisenhower_view','lista')); }
  if(name==='feedback')      { updateSBIPersonSelect(); renderSBIHistory(); }
  if(name==='vozcli')        { renderVerbatims(); renderVCStats(); renderVCInsights(); renderVCTrend(); renderVCAreaChart(); renderVCPareto(); renderVCCorrelation(); renderVCKeywords(); renderWowMoments(); renderImportHistory(); renderFeedbackSummary(); const dateEl = document.getElementById('vc-date'); if(dateEl && !dateEl.value) dateEl.value = new Date().toISOString().slice(0,10); }
  if(name==='convs')         { renderConvsGrid(); }
  if(name==='commitments')   { loadCommitmentsQuarter(getCurrentCommitmentsQuarter()); try { renderCommitmentsProgress(); } catch(e) {} }
  if(name==='qbr')           { renderQBR(); try { renderQBRHealthDashboard(); } catch(e) {} }
  if(name==='commitments-timeline') { renderCommitmentsTimeline(); try { highlightTimelineCurrentWeek(); } catch(e) {} }
  if(name==='kpis')          { try { renderKPIHealthSummary(); renderKPISmartInsights(); } catch(e) {} }
  if(name==='ls-vacaciones')  renderLSVacaciones();
  if(name==='ls-festivos')    renderLSFestivos();
  if(name==='ls-peticiones')  renderLSPeticiones();
  if(name==='ls-index')       { renderLeadershipIndex(); renderLSQOverview(); }
  if(name==='notas')          { renderMeetingNotes(); renderStorageIndicator(); }
  if(name==='weekly-report')  window.renderWeeklyReport?.();
  if(name==='okrs')           window.renderOKRs?.();
  if(name==='person-timeline') window.renderPersonTimeline?.();
}

/* Read ?seccion= URL param and activate the right group on load */
(function initGroupFromURL() {
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
})();

/* Trigger auto-backup reminder once the DOM is ready */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkAutoBackup, { once: true });
} else {
  checkAutoBackup();
}

/* Populate quarter selects from QUARTERS_CONFIG */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initCommitmentsQuarterSelect();
    initTLQuarterSelect();
  }, { once: true });
} else {
  initCommitmentsQuarterSelect();
  initTLQuarterSelect();
}

/* Config missing banner — only shown once; dismissal is remembered */
(function showConfigMissingBanner() {
  if (!window._configMissing) return;
  try { if (localStorage.getItem('apg_config_banner_dismissed') === '1') return; } catch(_) {}
  const show = () => {
    if (document.getElementById('config-missing-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'config-missing-banner';
    banner.style.cssText = 'position:fixed;bottom:16px;right:16px;background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--warning);border-radius:var(--radius);padding:12px 16px;font-size:12px;color:var(--text-secondary);z-index:9999;max-width:320px;box-shadow:var(--shadow)';
    const title = document.createElement('div');
    title.style.cssText = 'font-weight:600;color:var(--text-primary);margin-bottom:4px';
    title.textContent = '⚙️ config.js no encontrado';
    const body = document.createElement('div');
    body.textContent = 'El dashboard usa datos de ejemplo. Para usar datos reales, copia ';
    const code1 = document.createElement('code');
    code1.textContent = 'config.example.js';
    const as = document.createTextNode(' como ');
    const code2 = document.createElement('code');
    code2.textContent = 'config.js';
    const end = document.createTextNode('.');
    body.append(code1, as, code2, end);
    const btn = document.createElement('button');
    btn.style.cssText = 'margin-top:8px;font-size:11px;background:none;border:none;color:var(--accent);cursor:pointer;padding:0';
    btn.textContent = 'Entendido ×';
    btn.addEventListener('click', () => {
      try { localStorage.setItem('apg_config_banner_dismissed', '1'); } catch(_) {}
      banner.remove();
    });
    banner.append(title, body, btn);
    document.body.appendChild(banner);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', show, { once: true });
  } else {
    show();
  }
})();

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const num = s => parseFloat(String(s||'').replace(/[^0-9.,]/g,'').replace(',','.')) || 0;
const fmtDate = d => { if(!d)return''; const x=new Date(d+'T12:00:00'); return x.toLocaleDateString('es-ES',{day:'2-digit',month:'short'}); };
const flash = id => { const e=document.getElementById(id); if(!e)return; e.classList.add('show'); setTimeout(()=>e.classList.remove('show'),2200); };
function toggleForm(id) { const el=document.getElementById(id); if(el) el.classList.toggle('open'); }
let _toastTimer;
function showToast(msg, type) {
  let t=document.getElementById('apg-toast');
  if(!t){
    t=document.createElement('div');
    t.id='apg-toast';
    document.body.appendChild(t);
  }
  t.className='apg-toast'+(type ? ' apg-toast--'+type : '');
  t.textContent=msg; t.style.opacity='1';
  clearTimeout(_toastTimer);
  _toastTimer=setTimeout(()=>t.style.opacity='0',3000);
}

/* ═══════════════════════════════════════════════
   KPIs
═══════════════════════════════════════════════ */
const _g = id => document.getElementById(id)?.value || '';
let _saveKPIsTimer;
function saveKPIs() {
  // Actualizar barras de progreso inmediatamente (UX responsiva)
  refreshProgressBars();
  // Debounce: solo persistir a localStorage tras 400ms sin cambios
  clearTimeout(_saveKPIsTimer);
  _saveKPIsTimer = setTimeout(() => {
    save(K.kpis, {
      // ── Original compatibility fields ──
      ventas:    _g('kpi-ventas'),    objVentas: _g('kpi-obj-ventas'),
      nps:       _g('kpi-nps'),       objNps:    _g('kpi-obj-nps'),
      conv:      _g('kpi-conv'),      objConv:   _g('kpi-obj-conv'),
      upt:       _g('kpi-upt'),       objUpt:    _g('kpi-obj-upt'),
      acc:       _g('kpi-acc'),       ac:        _g('kpi-ac'),
      clicount:  _g('kpi-clicount'),  notes:     _g('kpi-notes'),
      // ── Critical KPIs — YoY/WoW ──
      yoyVentas: _g('kpi-yoy-ventas'), wowVentas: _g('kpi-wow-ventas'),
      yoyNps:    _g('kpi-yoy-nps'),    wowNps:    _g('kpi-wow-nps'),
      // ── Group 1 — Ventas ──
      ventasBusiness:    _g('kpi-ventas-business'),    objVentasBusiness: _g('kpi-obj-ventas-business'),
      yoyVentasBusiness: _g('kpi-yoy-ventas-business'), wowVentasBusiness: _g('kpi-wow-ventas-business'),
      ventasApu:    _g('kpi-ventas-apu'),    objVentasApu: _g('kpi-obj-ventas-apu'),
      yoyVentasApu: _g('kpi-yoy-ventas-apu'), wowVentasApu: _g('kpi-wow-ventas-apu'),
      ventasSfs:    _g('kpi-ventas-sfs'),    objVentasSfs: _g('kpi-obj-ventas-sfs'),
      yoyVentasSfs: _g('kpi-yoy-ventas-sfs'), wowVentasSfs: _g('kpi-wow-ventas-sfs'),
      // ── Group 2 — NPS ──
      npsShop:    _g('kpi-nps-shopping'),    objNpsShop: _g('kpi-obj-nps-shopping'),
      yoyNpsShop: _g('kpi-yoy-nps-shopping'), wowNpsShop: _g('kpi-wow-nps-shopping'),
      npsApu:    _g('kpi-nps-apu'),    objNpsApu: _g('kpi-obj-nps-apu'),
      yoyNpsApu: _g('kpi-yoy-nps-apu'), wowNpsApu: _g('kpi-wow-nps-apu'),
      npsSupport:    _g('kpi-nps-support'),    objNpsSupport: _g('kpi-obj-nps-support'),
      yoyNpsSupport: _g('kpi-yoy-nps-support'), wowNpsSupport: _g('kpi-wow-nps-support'),
      npsTaa:    _g('kpi-nps-taa'),    objNpsTaa: _g('kpi-obj-nps-taa'),
      yoyNpsTaa: _g('kpi-yoy-nps-taa'), wowNpsTaa: _g('kpi-wow-nps-taa'),
      // ── Group 3 — Tráfico y Conversión ──
      trafico:    _g('kpi-trafico'),    objTrafico: _g('kpi-obj-trafico'),
      yoyTrafico: _g('kpi-yoy-trafico'), wowTrafico: _g('kpi-wow-trafico'),
      yoyConv:    _g('kpi-yoy-conv'),   wowConv:    _g('kpi-wow-conv'),
      // ── Group 4 — Operacionales ──
      dta:    _g('kpi-dta'),    objDta: _g('kpi-obj-dta'),
      intros1k:       _g('kpi-intros-1k'),       objIntros1k:       _g('kpi-obj-intros-1k'),
      timely:         _g('kpi-timely'),           objTimely:         _g('kpi-obj-timely'),
      cpUsage:        _g('kpi-cp-usage'),         objCpUsage:        _g('kpi-obj-cp-usage'),
      gbConv:         _g('kpi-gb-conv'),          objGbConv:         _g('kpi-obj-gb-conv'),
      introsSessions: _g('kpi-intros-sessions'),  objIntrosSessions: _g('kpi-obj-intros-sessions'),
      iphoneTat:      _g('kpi-iphone-tat'),       objIphoneTat:      _g('kpi-obj-iphone-tat'),
    });
    flash('kpi-saved');
    updateSummary();
    renderRadarChart();
    renderMissionControl();
    renderResumenKPIs();
  }, 400);
}
function loadKPIs() {
  const d = load(K.kpis, {});
  const set = (id, v) => { try { const el=document.getElementById(id); if(el && d[v]!==undefined) el.value=d[v]; } catch(e) {} };
  // Original compatibility fields
  set('kpi-ventas','ventas');      set('kpi-obj-ventas','objVentas');
  set('kpi-nps','nps');            set('kpi-obj-nps','objNps');
  set('kpi-conv','conv');          set('kpi-obj-conv','objConv');
  set('kpi-upt','upt');            set('kpi-obj-upt','objUpt');
  set('kpi-acc','acc');            set('kpi-ac','ac');
  set('kpi-clicount','clicount');  set('kpi-notes','notes');
  // Critical KPIs YoY/WoW
  set('kpi-yoy-ventas','yoyVentas'); set('kpi-wow-ventas','wowVentas');
  set('kpi-yoy-nps','yoyNps');       set('kpi-wow-nps','wowNps');
  // Group 1
  set('kpi-ventas-business','ventasBusiness');    set('kpi-obj-ventas-business','objVentasBusiness');
  set('kpi-yoy-ventas-business','yoyVentasBusiness'); set('kpi-wow-ventas-business','wowVentasBusiness');
  set('kpi-ventas-apu','ventasApu');    set('kpi-obj-ventas-apu','objVentasApu');
  set('kpi-yoy-ventas-apu','yoyVentasApu'); set('kpi-wow-ventas-apu','wowVentasApu');
  set('kpi-ventas-sfs','ventasSfs');    set('kpi-obj-ventas-sfs','objVentasSfs');
  set('kpi-yoy-ventas-sfs','yoyVentasSfs'); set('kpi-wow-ventas-sfs','wowVentasSfs');
  // Group 2
  set('kpi-nps-shopping','npsShop');    set('kpi-obj-nps-shopping','objNpsShop');
  set('kpi-yoy-nps-shopping','yoyNpsShop'); set('kpi-wow-nps-shopping','wowNpsShop');
  set('kpi-nps-apu','npsApu');          set('kpi-obj-nps-apu','objNpsApu');
  set('kpi-yoy-nps-apu','yoyNpsApu');   set('kpi-wow-nps-apu','wowNpsApu');
  set('kpi-nps-support','npsSupport');  set('kpi-obj-nps-support','objNpsSupport');
  set('kpi-yoy-nps-support','yoyNpsSupport'); set('kpi-wow-nps-support','wowNpsSupport');
  set('kpi-nps-taa','npsTaa');          set('kpi-obj-nps-taa','objNpsTaa');
  set('kpi-yoy-nps-taa','yoyNpsTaa');   set('kpi-wow-nps-taa','wowNpsTaa');
  // Group 3
  set('kpi-trafico','trafico');    set('kpi-obj-trafico','objTrafico');
  set('kpi-yoy-trafico','yoyTrafico'); set('kpi-wow-trafico','wowTrafico');
  set('kpi-yoy-conv','yoyConv');   set('kpi-wow-conv','wowConv');
  // Group 4
  set('kpi-dta','dta');            set('kpi-obj-dta','objDta');
  set('kpi-intros-1k','intros1k'); set('kpi-obj-intros-1k','objIntros1k');
  set('kpi-timely','timely');      set('kpi-obj-timely','objTimely');
  set('kpi-cp-usage','cpUsage');   set('kpi-obj-cp-usage','objCpUsage');
  set('kpi-gb-conv','gbConv');     set('kpi-obj-gb-conv','objGbConv');
  set('kpi-intros-sessions','introsSessions'); set('kpi-obj-intros-sessions','objIntrosSessions');
  set('kpi-iphone-tat','iphoneTat'); set('kpi-obj-iphone-tat','objIphoneTat');
  refreshProgressBars();
}
function setBar(barId,pctId,val,obj) {
  const v=num(val), o=num(obj), pct=o>0?Math.min(Math.round(v/o*100),100):0;
  const b=document.getElementById(barId), p=document.getElementById(pctId);
  if(b) b.style.width=pct+'%';
  if(p) p.textContent=pct+'%';
  return pct;
}

/* Calculate trend badge HTML: ▲/▼ + % diff */
function calcTrendBadge(actualStr, anteriorStr) {
  if(!anteriorStr || !anteriorStr.trim()) return '';
  const actual = num(actualStr), anterior = num(anteriorStr);
  if(anterior === 0) return '';
  const diff = ((actual - anterior) / anterior) * 100;
  const isUp = diff > 0;
  return `<span class="yow-badge ${isUp?'up':'down'}">${isUp?'▲':'▼'} ${Math.abs(diff).toFixed(1)}%</span>`;
}

/* Update all YoY/WoW badge spans */
function updateYoWBadges() {
  // [actualId, yoyInputId, yoyBadgeId, wowInputId, wowBadgeId]
  const pairs = [
    ['kpi-ventas',         'kpi-yoy-ventas',         'badge-yoy-ventas',         'kpi-wow-ventas',         'badge-wow-ventas'],
    ['kpi-nps',            'kpi-yoy-nps',             'badge-yoy-nps',             'kpi-wow-nps',             'badge-wow-nps'],
    ['kpi-ventas-business','kpi-yoy-ventas-business', 'badge-yoy-ventas-business', 'kpi-wow-ventas-business', 'badge-wow-ventas-business'],
    ['kpi-ventas-apu',     'kpi-yoy-ventas-apu',      'badge-yoy-ventas-apu',      'kpi-wow-ventas-apu',      'badge-wow-ventas-apu'],
    ['kpi-ventas-sfs',     'kpi-yoy-ventas-sfs',      'badge-yoy-ventas-sfs',      'kpi-wow-ventas-sfs',      'badge-wow-ventas-sfs'],
    ['kpi-nps-shopping',   'kpi-yoy-nps-shopping',    'badge-yoy-nps-shopping',    'kpi-wow-nps-shopping',    'badge-wow-nps-shopping'],
    ['kpi-nps-apu',        'kpi-yoy-nps-apu',         'badge-yoy-nps-apu',         'kpi-wow-nps-apu',         'badge-wow-nps-apu'],
    ['kpi-nps-support',    'kpi-yoy-nps-support',     'badge-yoy-nps-support',     'kpi-wow-nps-support',     'badge-wow-nps-support'],
    ['kpi-nps-taa',        'kpi-yoy-nps-taa',         'badge-yoy-nps-taa',         'kpi-wow-nps-taa',         'badge-wow-nps-taa'],
    ['kpi-trafico',        'kpi-yoy-trafico',          'badge-yoy-trafico',          'kpi-wow-trafico',          'badge-wow-trafico'],
    ['kpi-conv',           'kpi-yoy-conv',             'badge-yoy-conv',             'kpi-wow-conv',             'badge-wow-conv'],
  ];
  pairs.forEach(([aId, yoyId, yoyBId, wowId, wowBId]) => {
    const aVal = _g(aId);
    const yoyBadge = document.getElementById(yoyBId);
    const wowBadge = document.getElementById(wowBId);
    if(yoyBadge) yoyBadge.innerHTML = calcTrendBadge(aVal, _g(yoyId));
    if(wowBadge) wowBadge.innerHTML = calcTrendBadge(aVal, _g(wowId));
  });
}

function refreshProgressBars() {
  // ── Ventas Globales ──
  setBar('bar-ventas','pct-ventas', _g('kpi-ventas'), _g('kpi-obj-ventas'));
  setBar('bar-ventas-business','pct-ventas-business', _g('kpi-ventas-business'), _g('kpi-obj-ventas-business'));
  setBar('bar-ventas-apu',     'pct-ventas-apu',      _g('kpi-ventas-apu'),      _g('kpi-obj-ventas-apu'));
  setBar('bar-ventas-sfs',     'pct-ventas-sfs',      _g('kpi-ventas-sfs'),      _g('kpi-obj-ventas-sfs'));
  // ── Product Zone ──
  setBar('bar-conv',   'pct-conv',    _g('kpi-conv'),    _g('kpi-obj-conv'));
  setBar('bar-trafico','pct-trafico', _g('kpi-trafico'), _g('kpi-obj-trafico'));
  setBar('bar-upt',    'pct-upt',     _g('kpi-upt'),     _g('kpi-obj-upt'));
  setBar('bar-intros-1k','pct-intros-1k', _g('kpi-intros-1k'), _g('kpi-obj-intros-1k'));
  // ── Genius Bar ──
  setBar('bar-dta',        'pct-dta',        _g('kpi-dta'),        _g('kpi-obj-dta'));
  setBar('bar-iphone-tat', 'pct-iphone-tat', _g('kpi-iphone-tat'), _g('kpi-obj-iphone-tat'));
  setBar('bar-nps-support','pct-nps-support', _g('kpi-nps-support'), _g('kpi-obj-nps-support'));
  setBar('bar-nps-apu',    'pct-nps-apu',     _g('kpi-nps-apu'),     _g('kpi-obj-nps-apu'));
  // ── Experiencia de Cliente ──
  setBar('bar-nps',         'pct-nps',         _g('kpi-nps'),         _g('kpi-obj-nps'));
  setBar('bar-nps-shopping','pct-nps-shopping', _g('kpi-nps-shopping'), _g('kpi-obj-nps-shopping'));
  setBar('bar-nps-taa',     'pct-nps-taa',      _g('kpi-nps-taa'),      _g('kpi-obj-nps-taa'));
  // ── YoY/WoW badges ──
  updateYoWBadges();
  try { checkKPIAlerts(); } catch(e) {}
  try { renderKPIHealthSummary(); renderKPISmartInsights(); } catch(e) {}
}

/* ═══════════════════════════════════════════════
   TASKS
═══════════════════════════════════════════════ */
let tasks = load(K.tasks, []);
let curFilter = 'todas';
const saveTasks = () => { save(K.tasks, tasks); updateSummary(); };

// ── Meeting Notes state (initialized here so they're available before mnInit) ──
let _mnNotes = [];
let _mnCurrentId = null;
let _mnSaveTimer = null;
let _mnActiveTag = null;
let _mnActiveType = null;

function addTask() {
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
  scheduleNotification(t);
  saveTasks(); renderTasks();
}
const toggleTask = id => {
  const t=tasks.find(t=>t.id===id);
  if(!t) return;
  t.done=!t.done;
  if(t.done) {
    t.completedDate = new Date().toISOString().split('T')[0];
    if(t.recurrence) {
      const now = new Date();
      // Calculate precise next date based on recurrence type
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
const deleteTask = id => { tasks=tasks.filter(t=>t.id!==id); saveTasks(); renderTasks(); renderResTasks(); };

function setFilter(f,btn) {
  curFilter=f;
  document.querySelectorAll('.filter-pill').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderTasks();
}
function clearFilter() {
  curFilter='todas';
  document.querySelectorAll('.filter-pill').forEach(b=>b.classList.remove('active'));
  const fp=document.getElementById('fp-todas'); if(fp) fp.classList.add('active');
  renderTasks();
}
function renderTasks() {
  const PO={alta:0,media:1,baja:2};
  let f=[...tasks];
  if(curFilter==='pendientes')  f=f.filter(t=>!t.done);
  else if(curFilter==='completadas') f=f.filter(t=>t.done);
  else if(['alta','media','baja'].includes(curFilter)) f=f.filter(t=>t.pri===curFilter);
  // Sort by order if set, then by done/priority
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
    const reunion=t.reunionId ? reuniones.find(r=>r.id===t.reunionId) : null;
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
let _dragTaskId = null;
function taskDragStart(e, id) { _dragTaskId=id; e.dataTransfer.effectAllowed='move'; }
function taskDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }
function taskDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }
function taskDrop(e, targetId) {
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
function changeTaskPriority(taskId, newPri) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  task.pri = newPri;
  saveTasks();
  renderTasks();
}
function startInlineEditTask(taskId, el) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  const oldText = task.text;
  const input = document.createElement('input');
  input.className = 'task-input';
  input.style.cssText = 'flex:1;font-size:14px;padding:4px 8px;';
  input.value = oldText;
  el.replaceWith(input);
  input.focus(); input.select();
  const save = () => { task.text = input.value.trim() || oldText; saveTasks(); renderTasks(); };
  input.onblur = save;
  input.onkeydown = e => { if(e.key==='Enter') save(); if(e.key==='Escape') { task.text=oldText; renderTasks(); } };
}
function renderResTasks() {
  const c=document.getElementById('res-tasks'), e=document.getElementById('res-tasks-empty'); if(!c)return;
  const PO={alta:0,media:1,baja:2};
  const p=tasks.filter(t=>!t.done).sort((a,b)=>(PO[a.pri]||2)-(PO[b.pri]||2)).slice(0,6);
  if(!p.length){ c.innerHTML=''; if(e) e.style.display='block'; return; }
  if(e) e.style.display='none';
  c.innerHTML=p.map(t=>`
    <div class="task-item priority-${t.pri}">
      <input type="checkbox" class="task-checkbox" onchange="toggleTask(${t.id})">
      <span class="task-text">${esc(t.text)}</span>
      <span class="priority-badge ${t.pri}">${t.pri.toUpperCase()}</span>
    </div>`).join('');
}

/* ═══════════════════════════════════════════════
   TEAM
═══════════════════════════════════════════════ */
let team = load(K.team, []);
const saveTeam = () => { save(K.team, team); updateSummary(); };
const COLORS = ['#0071e3','#34c759','#ff9f0a','#ff3b30','#af52de','#5ac8fa','#ff2d55','#30d158'];
const initials = n => n.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
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

function addTeamMember() {
  const name=document.getElementById('new-team-name').value.trim();
  if(!name)return;
  team.push({ id:Date.now(), name, role:document.getElementById('new-team-role').value.trim()||'Specialist', email:document.getElementById('new-team-email').value.trim(), status:'activo', note:'' });
  document.getElementById('new-team-name').value='';
  document.getElementById('new-team-role').value='';
  document.getElementById('new-team-email').value='';
  saveTeam(); renderTeam(); toggleForm('add-team-form');
}
const updStatus = (id,v) => { const m=team.find(m=>m.id===id); if(m){m.status=v;saveTeam();renderTeam();} };
const updNote   = (id,v) => { const m=team.find(m=>m.id===id); if(m){m.note=v;saveTeam();} };
const rmTeam    = id     => {
  const isLeader = equipoLiderazgo.some(e => e.id === id);
  if (isLeader) {
    // Members from the leadership master list are never fully deleted —
    // just hidden from the grid so they remain available in all selectors.
    const m = team.find(m => m.id === id);
    if (m) { m.hidden = true; saveTeam(); renderTeam(); updateRecogDropdown(); renderHiddenLeaders(); }
  } else {
    team=team.filter(m=>m.id!==id); saveTeam();
    const kb=load(K.kanban,{}); delete kb[id]; save(K.kanban,kb);
    renderTeam(); updateRecogDropdown(); renderKanban();
  }
};

function restoreTeamMember(id) {
  const m = team.find(m => m.id === id);
  if (m) { delete m.hidden; saveTeam(); renderTeam(); updateRecogDropdown(); renderHiddenLeaders(); }
}

function renderHiddenLeaders() {
  const container = document.getElementById('hidden-leaders-section');
  if (!container) return;
  const hidden = team.filter(m => m.hidden);
  if (!hidden.length) { container.style.display = 'none'; return; }
  container.style.display = 'block';
  container.innerHTML = `<div style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">Miembros ocultos (haz clic para restaurar)</div>`
    + hidden.map(m => `<button class="btn btn-ghost" style="font-size:12px;margin:4px 4px 0 0" onclick="restoreTeamMember(${m.id})">↩ ${esc(m.name)}</button>`).join('');
}

function renderTeam() {
  const g=document.getElementById('team-grid'), e=document.getElementById('team-empty');
  const visibleTeam = team.filter(m => !m.hidden);
  if(!visibleTeam.length){ g.innerHTML=''; e.style.display='block'; renderHiddenLeaders(); return; }
  e.style.display='none';
  const tbs=load(K.tbs,{}), recogs=load(K.reconocimientos,[]), pdis=load(K.pdis,{});
  g.innerHTML=visibleTeam.map((m,i)=>{
    const tbList=tbs[m.id]||[];
    const hasPending=tbList.some(s=>s.followUp);
    const recogCount=recogs.filter(r=>r.personId===m.id).length;
    // Semáforo 1:1
    const tbSessions = (tbs[m.id] || []);
    const lastTB = tbSessions.length ? tbSessions.slice().sort((a,b) => new Date(b.date) - new Date(a.date))[0] : null;
    const daysSinceLastTB = lastTB ? Math.floor((Date.now() - new Date(lastTB.date)) / 86400000) : 999;
    const tbLight = daysSinceLastTB <= 7 ? '🟢' : daysSinceLastTB <= 21 ? '🟡' : '🔴';
    const tbLightLabel = daysSinceLastTB === 999 ? 'Sin 1:1 registrado' : daysSinceLastTB === 0 ? '1:1 hoy' : `Último 1:1 hace ${daysSinceLastTB}d`;
    // PDI badge
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
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px">
        <button class="btn btn-ghost" style="font-size:11px;padding:6px 4px" onclick="openTBModal(${m.id})">🤝 TB/1:1</button>
        <button class="btn btn-ghost" style="font-size:11px;padding:6px 4px" onclick="openPDIModal(${m.id})">📈 PDI</button>
        <button class="btn btn-ghost" style="font-size:11px;padding:6px 4px" onclick="open1on1PrepModal(${m.id})">📋 Prep</button>
        <button class="btn btn-ghost" style="font-size:11px;padding:6px 4px" onclick="goToFeedbackFor(${m.id})">💬 SBI</button>
      </div>
      <button class="btn btn-primary" style="width:100%;margin-top:6px;font-size:11px;padding:7px" onclick="goToProfile(${m.id})">👤 Ver perfil completo</button>
    </div>`;
  }).join('');
  renderHiddenLeaders();
  renderTeamHealth();
}

function renderTeamHealth() {
  const wrap = document.getElementById('team-health-wrap');
  if (!wrap) return;
  const visibleTeam = team.filter(m => !m.hidden);
  if (!visibleTeam.length) { wrap.innerHTML = ''; return; }

  const tbs = load(K.tbs, {});
  const recogs = load(K.reconocimientos, []);
  const sbi = load(K_SBI, []);
  const pdis = load(K.pdis, {});
  const kb = load(K.kanban, {});

  let tbGreen = 0, tbYellow = 0, tbRed = 0;
  let totalRecogs = 0, totalSBI = 0, totalPDI = 0;
  let kbVolando = 0, kbSeguimiento = 0, kbDesarrollo = 0;

  visibleTeam.forEach(m => {
    const tbSessions = tbs[m.id] || [];
    const lastTB = tbSessions.length ? tbSessions.slice().sort((a,b) => (b.date||'').localeCompare(a.date||''))[0] : null;
    const days = lastTB ? Math.floor((Date.now() - new Date(lastTB.date)) / 86400000) : 999;
    if (days <= 7) tbGreen++; else if (days <= 21) tbYellow++; else tbRed++;
    totalRecogs += recogs.filter(r => r.personId === m.id).length;
    totalSBI += sbi.filter(s => String(s.personId) === String(m.id)).length;
    const pdi = pdis[m.id] || {};
    if (pdi.strengths || pdi.weekGoal || pdi.devAreas) totalPDI++;
    const kbCol = kb[m.id];
    if (kbCol === 'volando') kbVolando++;
    else if (kbCol === 'seguimiento') kbSeguimiento++;
    else if (kbCol === 'desarrollo') kbDesarrollo++;
  });

  wrap.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px">
    <div class="profile-qs-item">
      <div style="display:flex;gap:4px;justify-content:center;font-size:13px"><span>🟢${tbGreen}</span> <span>🟡${tbYellow}</span> <span>🔴${tbRed}</span></div>
      <div class="profile-qs-lbl">Estado 1:1</div>
    </div>
    <div class="profile-qs-item">
      <div class="profile-qs-val">${totalSBI}</div>
      <div class="profile-qs-lbl">Feedbacks SBI</div>
    </div>
    <div class="profile-qs-item">
      <div class="profile-qs-val">${totalRecogs}</div>
      <div class="profile-qs-lbl">Reconocimientos</div>
    </div>
    <div class="profile-qs-item">
      <div class="profile-qs-val">${totalPDI}/${visibleTeam.length}</div>
      <div class="profile-qs-lbl">Con PDI</div>
    </div>
    <div class="profile-qs-item">
      <div style="display:flex;gap:4px;justify-content:center;font-size:13px"><span>🚀${kbVolando}</span> <span>🔄${kbSeguimiento}</span> <span>📈${kbDesarrollo}</span></div>
      <div class="profile-qs-lbl">Kanban</div>
    </div>
  </div>`;
}

/* ═══════════════════════════════════════════════
   EVENTS
═══════════════════════════════════════════════ */
let events = load(K.events, []);
const saveEvents = () => { save(K.events, events); updateSummary(); };

/* ═══════════════════════════════════════════════
   ICS CALENDAR EXPORT
═══════════════════════════════════════════════ */
function _generateEventICS(ev) {
  const pad = n => String(n).padStart(2,'0');
  const fmtDate = (dateStr, timeStr) => {
    const d = new Date(dateStr + 'T' + (timeStr || '00:00') + ':00');
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  };
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const dtStart = fmtDate(ev.date, ev.time || '09:00');
  // DTEND: 1 hour after start by default
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

function downloadICS(ev) {
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

function addEvent() {
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
  saveEvents(); renderEvents(); toggleForm('add-event-form');
  applyAgendaView();
  renderAgendaSidebar();
  // Offer ICS download via toast
  _pendingICSEvent = newEv;
  showICSToast(newEv);
}

let _pendingICSEvent = null;

function showICSToast(ev) {
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

function closeICSToast() {
  const t = document.getElementById('apg-ics-toast');
  if (t) t.style.display = 'none';
}

const rmEvent = id => { events=events.filter(e=>e.id!==id); saveEvents(); renderEvents(); renderAgendaSidebar(); applyAgendaView(); };

function renderEvents() {
  const list=document.getElementById('event-list'), empty=document.getElementById('event-empty');
  const today=localDateStr();
  const sorted=[...events].sort((a,b)=>new Date(a.date+'T'+(a.time||'00:00'))-new Date(b.date+'T'+(b.time||'00:00')));
  if(!sorted.length){ list.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';

  const catIcons = { reunion:'📋', formacion:'🎓', recordatorio:'🔔', focus:'🔒', personal:'⭐', otro:'📌' };
  const evColorMap = { blue:'#0071e3', green:'#28a745', orange:'#fd7e14', red:'#dc3545', purple:'#6f42c1' };

  // Group events by date
  const grouped = {};
  sorted.forEach(ev => {
    if (!grouped[ev.date]) grouped[ev.date] = [];
    grouped[ev.date].push(ev);
  });

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
      const catIcon = catIcons[ev.category] || '📅';
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

/* ═══ AGENDA SIDEBAR: Stats + Today + Goals ═══ */
const AGENDA_CAT_ICONS = { reunion:'📋', formacion:'🎓', recordatorio:'🔔', focus:'🔒', personal:'⭐', otro:'📌' };

function renderAgendaSidebar() {
  renderAgendaStats();
  renderAgendaToday();
  renderAgendaGoals();
}

function renderAgendaStats() {
  const today = new Date();
  const todayStr = localDateStr(today);
  const dow = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() - (dow===0?6:dow-1));
  mon.setHours(0,0,0,0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23,59,59,999);

  const todayEvents = events.filter(e => e.date === todayStr);
  const weekEvents = events.filter(e => {
    const d = new Date(e.date + 'T12:00:00');
    return d >= mon && d <= sun;
  });

  // Stats
  const elToday = document.getElementById('agenda-stat-today');
  const elWeek = document.getElementById('agenda-stat-week');
  const elNext = document.getElementById('agenda-stat-next');
  const elGoals = document.getElementById('agenda-stat-goals');

  if (elToday) elToday.textContent = todayEvents.length;
  if (elWeek) elWeek.textContent = weekEvents.length;

  // Find next upcoming event
  const nowMs = today.getTime();
  const upcoming = events
    .filter(e => new Date(e.date + 'T' + (e.time || '23:59') + ':00').getTime() >= nowMs)
    .sort((a,b) => new Date(a.date+'T'+(a.time||'00:00')+':00') - new Date(b.date+'T'+(b.time||'00:00')+':00'));
  if (elNext) {
    if (upcoming.length > 0) {
      const ne = upcoming[0];
      const nd = new Date(ne.date + 'T12:00:00');
      const isNextToday = ne.date === todayStr;
      elNext.textContent = isNextToday ? (ne.time || 'Todo el día') : nd.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
      elNext.title = esc(ne.title) + (ne.time ? ' · ' + ne.time : '');
    } else {
      elNext.textContent = '—';
      elNext.title = '';
    }
  }

  // Goals progress
  const goals = load(K.agendaGoals, []);
  const weekKey = _getAgendaWeekKey();
  const weekGoals = goals.filter(g => g.week === weekKey);
  const done = weekGoals.filter(g => g.done).length;
  if (elGoals) elGoals.textContent = `${done}/${weekGoals.length}`;
}

function _getAgendaWeekKey() {
  const today = new Date();
  const dow = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() - (dow===0?6:dow-1));
  mon.setHours(0,0,0,0);
  return localDateStr(mon);
}

function renderAgendaToday() {
  const container = document.getElementById('agenda-today-list');
  const emptyEl = document.getElementById('agenda-today-empty');
  const dateEl = document.getElementById('agenda-today-date');
  if (!container) return;

  const today = new Date();
  const todayStr = localDateStr(today);
  if (dateEl) dateEl.textContent = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  const todayEvents = events
    .filter(e => e.date === todayStr)
    .sort((a,b) => (a.time||'').localeCompare(b.time||''));

  if (!todayEvents.length) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  const evColorMap = { blue:'#0071e3', green:'#28a745', orange:'#fd7e14', red:'#dc3545', purple:'#6f42c1' };

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

/* ═══ WEEKLY GOALS ═══ */
function renderAgendaGoals() {
  const listEl = document.getElementById('agenda-goals-list');
  if (!listEl) return;

  const goals = load(K.agendaGoals, []);
  const weekKey = _getAgendaWeekKey();
  const weekGoals = goals.filter(g => g.week === weekKey);

  if (!weekGoals.length) {
    listEl.innerHTML = '<div class="agenda-goals-empty">Añade hasta 5 objetivos para esta semana</div>';
    return;
  }

  const done = weekGoals.filter(g => g.done).length;
  const pct = weekGoals.length > 0 ? Math.round(done / weekGoals.length * 100) : 0;

  let html = weekGoals.map(g => `<div class="agenda-goal-item${g.done ? ' completed' : ''}">
    <button class="agenda-goal-check" onclick="toggleAgendaGoal(${g.id})" title="Completar">${g.done ? '✓' : ''}</button>
    <div class="agenda-goal-text">${esc(g.text)}</div>
    <button class="agenda-goal-delete" onclick="deleteAgendaGoal(${g.id})" title="Eliminar">×</button>
  </div>`).join('');

  html += `<div class="agenda-goals-progress">
    <div class="agenda-goals-progress-bar"><div class="agenda-goals-progress-fill" style="width:${pct}%"></div></div>
    <div class="agenda-goals-progress-text">${done} de ${weekGoals.length} completados (${pct}%)</div>
  </div>`;

  listEl.innerHTML = html;
}

function addAgendaGoal() {
  const input = document.getElementById('agenda-goal-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  const goals = load(K.agendaGoals, []);
  const weekKey = _getAgendaWeekKey();
  const weekGoals = goals.filter(g => g.week === weekKey);
  if (weekGoals.length >= 5) {
    alert('Máximo 5 objetivos por semana.');
    return;
  }

  goals.push({ id: Date.now(), text, week: weekKey, done: false });
  save(K.agendaGoals, goals);
  input.value = '';
  renderAgendaGoals();
  renderAgendaStats();
}

function toggleAgendaGoal(id) {
  const goals = load(K.agendaGoals, []);
  const g = goals.find(g => g.id === id);
  if (g) g.done = !g.done;
  save(K.agendaGoals, goals);
  renderAgendaGoals();
  renderAgendaStats();
}

function deleteAgendaGoal(id) {
  let goals = load(K.agendaGoals, []);
  goals = goals.filter(g => g.id !== id);
  save(K.agendaGoals, goals);
  renderAgendaGoals();
  renderAgendaStats();
}

/* ═══ EVENT DETAIL/EDIT MODAL ═══ */
let _editingEventId = null;

function openEventModal(id) {
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
      <div>
        <div style="font-size:16px;font-weight:700">${esc(ev.title)}</div>
        <div style="font-size:13px;color:var(--text-secondary)">${ev.desc ? esc(ev.desc) : 'Sin descripción'}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="agenda-event-modal-field">
        <label>Título</label>
        <input id="edit-ev-title" value="${esc(ev.title)}">
      </div>
      <div class="agenda-event-modal-field">
        <label>Categoría</label>
        <select id="edit-ev-category">
          <option value="reunion"${ev.category==='reunion'?' selected':''}>📋 Reunión</option>
          <option value="formacion"${ev.category==='formacion'?' selected':''}>🎓 Formación</option>
          <option value="recordatorio"${ev.category==='recordatorio'?' selected':''}>🔔 Recordatorio</option>
          <option value="focus"${ev.category==='focus'?' selected':''}>🔒 Focus Time</option>
          <option value="personal"${ev.category==='personal'?' selected':''}>⭐ Personal</option>
          <option value="otro"${ev.category==='otro'?' selected':''}>📌 Otro</option>
        </select>
      </div>
      <div class="agenda-event-modal-field">
        <label>Fecha</label>
        <input id="edit-ev-date" type="date" value="${ev.date}">
      </div>
      <div class="agenda-event-modal-field">
        <label>Hora</label>
        <input id="edit-ev-time" type="time" value="${ev.time || ''}">
      </div>
      <div class="agenda-event-modal-field" style="grid-column:span 2">
        <label>Descripción</label>
        <input id="edit-ev-desc" value="${esc(ev.desc || '')}" placeholder="Notas o lugar...">
      </div>
      <div class="agenda-event-modal-field">
        <label>Color</label>
        <select id="edit-ev-color">
          ${_colorOptions(ev.color || 'blue')}
        </select>
      </div>
      <div class="agenda-event-modal-field">
        <label>Manager</label>
        <select id="edit-ev-manager">
          ${_managerOptions(ev.manager || '')}
        </select>
      </div>
    </div>`;

  overlay.classList.add('open');
}

function closeEventModal(e) {
  if (e && e.target !== document.getElementById('agenda-event-modal')) return;
  const overlay = document.getElementById('agenda-event-modal');
  if (overlay) overlay.classList.remove('open');
  _editingEventId = null;
}

function saveEventEdit() {
  if (!_editingEventId) return;
  const ev = events.find(e => e.id === _editingEventId);
  if (!ev) return;

  const title = document.getElementById('edit-ev-title')?.value.trim();
  const date = document.getElementById('edit-ev-date')?.value;
  if (!title || !date) { alert('El título y la fecha son obligatorios.'); return; }

  ev.title = title;
  ev.date = date;
  ev.time = document.getElementById('edit-ev-time')?.value || '';
  ev.desc = document.getElementById('edit-ev-desc')?.value.trim() || '';
  ev.color = document.getElementById('edit-ev-color')?.value || 'blue';
  ev.category = document.getElementById('edit-ev-category')?.value || 'reunion';
  const newManager = document.getElementById('edit-ev-manager')?.value || '';
  if (newManager && newManager !== ev.manager) _recordManagerConnection(newManager, ev.date, ev.title);
  ev.manager = newManager;

  saveEvents();
  renderEvents();
  applyAgendaView();
  renderAgendaSidebar();
  closeEventModal();
  showToast('✅ Evento actualizado');
}

function deleteEventFromModal() {
  if (!_editingEventId) return;
  if (!confirm('¿Eliminar este evento?')) return;
  rmEvent(_editingEventId);
  closeEventModal();
}

function duplicateEventNextWeek() {
  if (!_editingEventId) return;
  const ev = events.find(e => e.id === _editingEventId);
  if (!ev) return;

  const newDate = new Date(ev.date + 'T12:00:00');
  newDate.setDate(newDate.getDate() + 7);
  const newDateStr = localDateStr(newDate);

  const newEv = { id: Date.now(), title: ev.title, date: newDateStr, time: ev.time, desc: ev.desc, color: ev.color, category: ev.category, manager: ev.manager || '' };
  events.push(newEv);
  saveEvents();
  renderEvents();
  applyAgendaView();
  renderAgendaSidebar();
  closeEventModal();
  showToast('📋 Evento duplicado a la siguiente semana');
}

/* ═══════════════════════════════════════════════
   NOTES
═══════════════════════════════════════════════ */
let notesTimer;
function saveNotes() {
  clearTimeout(notesTimer);
  const s=document.getElementById('notes-status'); if(s) s.textContent='💾 Guardando...';
  const el=document.getElementById('main-notes'); if(!el) return;
  notesTimer=setTimeout(()=>{ save(K.notes,el.value); if(s)s.textContent='💾 Guardado automáticamente'; },800);
}
function loadNotes() {
  const el = document.getElementById('main-notes');
  if (el) el.value = load(K.notes, '');
}

/* ═══════════════════════════════════════════════
   SUMMARY
═══════════════════════════════════════════════ */
function updateSummary() {
  const done=tasks.filter(t=>t.done).length;
  const pend=tasks.filter(t=>!t.done).length;
  const today=new Date(); const dow=today.getDay();
  const mon=new Date(today); mon.setDate(today.getDate()-(dow===0?6:dow-1));
  const sun=new Date(mon); sun.setDate(mon.getDate()+6);
  const wEvs=events.filter(e=>{ const d=new Date(e.date+'T12:00:00'); return d>=mon&&d<=sun; }).length;
  const $=id=>document.getElementById(id);
  if($('sum-completadas')) $('sum-completadas').textContent=done;
  if($('sum-pendientes'))  $('sum-pendientes').textContent=pend;
  if($('sum-equipo'))      $('sum-equipo').textContent=team.length;
  if($('sum-eventos'))     $('sum-eventos').textContent=wEvs;
  // Contar personas sin 1:1 reciente (usado en checkAutoSuggestions para alertas en el banner)
  const tbs = load(K.tbs, {});
  const visibleTeam = team.filter(m => !m.hidden);
  const redCount = visibleTeam.filter(m => {
    const sessions = tbs[m.id] || [];
    if (!sessions.length) return true;
    const last = sessions.slice().sort((a,b) => new Date(b.date)-new Date(a.date))[0];
    return Math.floor((Date.now()-new Date(last.date))/86400000) > 21;
  }).length;
  window._tbRedCount = redCount;
  renderResTasks();
  refreshProgressBars();
  renderWeekWidget();
  renderEquipoSemanaWidget();
  renderWeeklyHealthScore();
  renderSmartInsights();
}

/* ═══════════════════════════════════════════════
   EQUIPO ESTA SEMANA WIDGET
═══════════════════════════════════════════════ */
function renderEquipoSemanaWidget() {
  const wrap = document.getElementById('equipo-semana-content');
  if (!wrap) return;
  try { LS_WEEKS_2025; } catch(e) { return; }
  const now = new Date();
  const year = now.getFullYear();
  const weeks = _getWeeksForYear(year);
  const DAY_NAMES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

  // Get Monday of current week
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0,0,0,0);

  const people = (typeof getVacPeopleForYear === 'function') ? getVacPeopleForYear(year) : [];
  if (!people.length) {
    wrap.innerHTML = '<div style="font-size:13px;color:var(--text-secondary)">Sin datos de equipo.</div>';
    return;
  }

  // For each day Mon-Sun find absences
  const days = [];
  let anyAbsence = false;
  for (let d = 0; d < 7; d++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + d);
    const dayMs = day.getTime();
    // Find week index for this day
    let weekIdx = -1;
    for (let i = 0; i < weeks.length; i++) {
      const parts = weeks[i].split(' ');
      const wDay = parseInt(parts[0]);
      const month = LS_MONTH_MAP[parts[1]];
      if (month === undefined) continue;
      let wYear = year;
      if (month <= 1 && i > LS_WEEK_YEAR_WRAP_IDX) wYear = year + 1;
      const wMs = new Date(wYear, month, wDay).getTime();
      const nextWMs = wMs + 7 * 86400000;
      if (dayMs >= wMs && dayMs < nextWMs) { weekIdx = i; break; }
    }
    const absences = weekIdx >= 0
      ? people.filter(p => p.data && p.data[weekIdx] && p.data[weekIdx].trim() !== '')
              .map(p => ({ name: p.name, code: p.data[weekIdx].trim() }))
      : [];
    if (absences.length) anyAbsence = true;
    days.push({ dayName: DAY_NAMES[day.getDay()], date: day.getDate(), absences });
  }

  if (!anyAbsence) {
    wrap.innerHTML = '<div style="font-size:13px;color:var(--success)">✅ Semana completa — todo el equipo disponible</div>';
    return;
  }

  const html = `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px">` +
    days.map(d => {
      const hasAbs = d.absences.length > 0;
      const absTip = d.absences.map(a => `${a.name} (${a.code})`).join('\n');
      return `<div style="text-align:center;padding:8px 4px;border-radius:var(--radius-sm);background:${hasAbs?'rgba(255,59,48,0.08)':'var(--surface2)'};border:1px solid ${hasAbs?'rgba(255,59,48,0.3)':'var(--border)'}">
        <div style="font-size:11px;font-weight:600;color:var(--text-secondary)">${d.dayName}</div>
        <div style="font-size:18px;font-weight:700;margin:2px 0">${d.date}</div>
        ${hasAbs
          ? `<div style="font-size:11px;color:var(--danger);font-weight:600" title="${absTip.replace(/"/g,'&quot;')}">${d.absences.length} ausente${d.absences.length!==1?'s':''}</div>
             <div style="font-size:10px;color:var(--text-secondary);margin-top:2px">${d.absences.map(a=>`${a.name.split(' ')[0]}`).join(', ')}</div>`
          : `<div style="font-size:11px;color:var(--success)">✅</div>`}
      </div>`;
    }).join('') + '</div>';

  wrap.innerHTML = html;
}

/* ═══════════════════════════════════════════════
   NOTIFICATIONS (Feature 5)
═══════════════════════════════════════════════ */
function requestNotifPerm() {
  if('Notification' in window && Notification.permission==='default') Notification.requestPermission();
}
function scheduleNotification(t) {
  if(!t.date || !t.reminder) return;
  if(!('Notification' in window)) return;
  const dt = new Date(t.date+'T'+t.reminder);
  const diff = dt - Date.now();
  const MS_PER_DAY = 86400000;
  if(diff<=0 || diff>MS_PER_DAY) return; // skip past and >24h (rescheduled on next load)
  setTimeout(()=>{
    if(Notification.permission==='granted') {
      new Notification('⏰ Tarea pendiente', { body: `${t.text}\nPrioridad: ${t.pri.toUpperCase()}`, icon: './icon.svg' });
    }
  }, diff);
}
function scheduleAllNotifications() {
  tasks.filter(t=>!t.done&&t.date&&t.reminder).forEach(scheduleNotification);
}

/* ═══════════════════════════════════════════════
   KPI SNAPSHOT HISTORY (Feature 4)
═══════════════════════════════════════════════ */
function saveKPISnapshot() {
  const today = localDateStr();
  let history = load(K.kpiHistory, []);
  history = history.filter(s=>s.date!==today); // only one snapshot per day
  history.push({
    date: today,
    ventas: _g('kpi-ventas'),      objVentas: _g('kpi-obj-ventas'),
    nps:    _g('kpi-nps'),          objNps:    _g('kpi-obj-nps'),
    conv:   _g('kpi-conv'),         objConv:   _g('kpi-obj-conv'),
    upt:    _g('kpi-upt'),          objUpt:    _g('kpi-obj-upt'),
    ac:     _g('kpi-ac'),           objAc:     String(AC_ALERT_THRESHOLD),
    dta:    _g('kpi-dta'),          objDta:    _g('kpi-obj-dta'),
    trafico:_g('kpi-trafico'),      objTrafico:_g('kpi-obj-trafico'),
    ventasBusiness: _g('kpi-ventas-business'), objVentasBusiness: _g('kpi-obj-ventas-business'),
    ventasApu:      _g('kpi-ventas-apu'),      objVentasApu:      _g('kpi-obj-ventas-apu'),
    ventasSfs:      _g('kpi-ventas-sfs'),      objVentasSfs:      _g('kpi-obj-ventas-sfs'),
    npsShop:        _g('kpi-nps-shopping'),    objNpsShop:        _g('kpi-obj-nps-shopping'),
    npsApu:         _g('kpi-nps-apu'),         objNpsApu:         _g('kpi-obj-nps-apu'),
    npsSupport:     _g('kpi-nps-support'),     objNpsSupport:     _g('kpi-obj-nps-support'),
    npsTaa:         _g('kpi-nps-taa'),         objNpsTaa:         _g('kpi-obj-nps-taa'),
    intros1k:       _g('kpi-intros-1k'),       objIntros1k:       _g('kpi-obj-intros-1k'),
    timely:         _g('kpi-timely'),           objTimely:         _g('kpi-obj-timely'),
    cpUsage:        _g('kpi-cp-usage'),         objCpUsage:        _g('kpi-obj-cp-usage'),
    gbConv:         _g('kpi-gb-conv'),          objGbConv:         _g('kpi-obj-gb-conv'),
    introsSessions: _g('kpi-intros-sessions'),  objIntrosSessions: _g('kpi-obj-intros-sessions'),
    iphoneTat:      _g('kpi-iphone-tat'),       objIphoneTat:      _g('kpi-obj-iphone-tat'),
  });
  save(K.kpiHistory, history);
  renderKPIHistory();
  flash('kpi-saved');
}
function autoSaveDailySnapshot() {
  const today = localDateStr();
  const history = load(K.kpiHistory, []);
  if(!history.find(s=>s.date===today)) saveKPISnapshot();
}

/* ── KPI History Chart (SVG) ── */

// Metric definitions for the KPI history chart.
// All metrics are normalized to a 0–100 scale (% of objective where applicable).
// Values are capped at 150 to handle overperformance while keeping the chart readable.
const KPI_CHART_MAX_PCT = 150;
const KPI_CHART_METRICS = [
  { key:'ventas',         label:'💰 Ventas %',         color:'var(--accent)',  val: d=>{ const v=num(d.ventas),o=num(d.objVentas);                 return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
  { key:'ventasBusiness', label:'💼 Ventas Business',  color:'#30d158',        val: d=>{ const v=num(d.ventasBusiness),o=num(d.objVentasBusiness); return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
  { key:'ventasApu',      label:'📱 Ventas APU',       color:'#0a84ff',        val: d=>{ const v=num(d.ventasApu),o=num(d.objVentasApu);           return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
  { key:'ventasSfs',      label:'🚚 Ventas SFS',       color:'#5e5ce6',        val: d=>{ const v=num(d.ventasSfs),o=num(d.objVentasSfs);           return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
  { key:'nps',            label:'⭐ NPS Tienda',        color:'var(--success)', val: d=>Math.min(num(d.nps),100) },
  { key:'npsShop',        label:'🛍️ NPS Shopping',     color:'#ffd60a',        val: d=>Math.min(num(d.npsShop),100) },
  { key:'npsApu',         label:'🔧 NPS APU',           color:'#ff6b35',        val: d=>Math.min(num(d.npsApu),100) },
  { key:'npsSupport',     label:'🎧 NPS Support',       color:'#ff453a',        val: d=>Math.min(num(d.npsSupport),100) },
  { key:'npsTaa',         label:'🎓 NPS T@A',           color:'#bf5af2',        val: d=>Math.min(num(d.npsTaa),100) },
  { key:'conv',           label:'🔄 Conversión',        color:'#ff9f0a',        val: d=>{ const v=num(d.conv),o=num(d.objConv);                     return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
  { key:'trafico',        label:'👣 Tráfico',           color:'#64d2ff',        val: d=>num(d.trafico) },
  { key:'upt',            label:'🛒 UPT',              color:'#34c759',        val: d=>{ const v=num(d.upt),o=num(d.objUpt);                       return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
  { key:'dta',            label:'⏰ DTA %',             color:'#8e8e93',        val: d=>{ const v=num(d.dta),o=num(d.objDta);                       return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
  { key:'intros1k',       label:'🎯 Intros/1K',         color:'#ac8e68',        val: d=>{ const v=num(d.intros1k),o=num(d.objIntros1k);             return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
  { key:'timely',         label:'⏱️ Timely %',          color:'#6ac4dc',        val: d=>{ const v=num(d.timely),o=num(d.objTimely);                 return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
  { key:'cpUsage',        label:'💬 C&P Usage',         color:'#9d6cf0',        val: d=>{ const v=num(d.cpUsage),o=num(d.objCpUsage);               return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
  { key:'gbConv',         label:'🎓 GB Conv.',           color:'#f19a38',        val: d=>{ const v=num(d.gbConv),o=num(d.objGbConv);                 return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
  { key:'introsSessions', label:'🔍 Intros/Sessions',   color:'#5ac8f5',        val: d=>{ const v=num(d.introsSessions),o=num(d.objIntrosSessions); return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
  { key:'iphoneTat',      label:'📱 iPhone TAT',         color:'#e8675a',        val: d=>{ const v=num(d.iphoneTat),o=num(d.objIphoneTat);           return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
];

const DEFAULT_KPI_CHART_METRICS    = ['ventas','nps'];
const DEFAULT_COMPARATIVA_METRICS  = ['ventas','nps','conv','dta'];

function getSelectedKPIMetrics() {
  const saved = load('apg_kpi_chart_metrics', DEFAULT_KPI_CHART_METRICS);
  return Array.isArray(saved) ? saved : DEFAULT_KPI_CHART_METRICS;
}

function toggleKPIMetric(key, btn) {
  let selected = getSelectedKPIMetrics();
  if (selected.includes(key)) {
    if (selected.length <= 1) { showToast('Al menos una métrica debe estar seleccionada'); return; }
    selected = selected.filter(k => k !== key);
    if (btn) btn.classList.remove('active');
  } else {
    if (selected.length >= 5) { showToast('Máximo 5 métricas simultáneas'); return; }
    selected.push(key);
    if (btn) btn.classList.add('active');
  }
  save('apg_kpi_chart_metrics', selected);
  renderKPIHistory();
}

function renderKPIChart() {
  const wrap = document.getElementById('kpi-chart-wrap');
  if(!wrap) return;
  const view = load('apg_kpi_history_view', '2w');
  let allHistory = load(K.kpiHistory, []);
  let data;
  if (view === '2w') {
    const today = new Date();
    const dow = today.getDay();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
    thisWeekStart.setHours(0, 0, 0, 0);
    const thisWeekStartStr = thisWeekStart.toISOString().slice(0, 10);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekStartStr = lastWeekStart.toISOString().slice(0, 10);
    const thisWeekEntries = allHistory.filter(d => d.date >= thisWeekStartStr);
    const lastWeekEntries = allHistory.filter(d => d.date >= lastWeekStartStr && d.date < thisWeekStartStr);
    const aggregate = (entries, label) => {
      if (!entries.length) return null;
      const n = entries.length;
      return {
        _label: label,
        ventas: (entries.reduce((s,d)=>s+num(d.ventas),0)/n).toFixed(0),
        objVentas: (entries.reduce((s,d)=>s+num(d.objVentas),0)/n).toFixed(0),
        nps: (entries.reduce((s,d)=>s+num(d.nps),0)/n).toFixed(1),
        objNps: (entries.reduce((s,d)=>s+num(d.objNps),0)/n).toFixed(0),
        conv: (entries.reduce((s,d)=>s+num(d.conv),0)/n).toFixed(1),
        objConv: (entries.reduce((s,d)=>s+num(d.objConv),0)/n).toFixed(0),
        dta: (entries.reduce((s,d)=>s+num(d.dta),0)/n).toFixed(1),
        objDta: (entries.reduce((s,d)=>s+num(d.objDta),0)/n).toFixed(0),
        trafico: (entries.reduce((s,d)=>s+num(d.trafico),0)/n).toFixed(0),
        date: entries[0].date
      };
    };
    data = [aggregate(lastWeekEntries, 'S. Pasada'), aggregate(thisWeekEntries, 'S. Actual')].filter(Boolean);
  } else {
    let maxPts = view === '4w' ? 28 : 90;
    data = allHistory.slice(-maxPts);
  }
  if(!data.length) { wrap.innerHTML=''; return; }

  const selectedKeys = getSelectedKPIMetrics();
  const metrics = KPI_CHART_METRICS.filter(m => selectedKeys.includes(m.key));

  // Update legend
  const legendEl = document.getElementById('kpi-chart-legend');
  if (legendEl) {
    legendEl.innerHTML = metrics.map(m =>
      `<div class="kpi-chart-legend-item"><div class="kpi-chart-legend-dot" style="background:${m.color}"></div><span>${m.label}</span></div>`
    ).join('');
  }

  const W=800, H=220, PAD={top:24,right:16,bottom:36,left:36};
  const cW=W-PAD.left-PAD.right, cH=H-PAD.top-PAD.bottom;
  const n=data.length;

  const xC = i => PAD.left + (i+0.5)*cW/n;
  const yPct = pct => PAD.top + cH - Math.min(Math.max(pct,0),KPI_CHART_MAX_PCT)/100*cH;

  // Grid lines at 25/50/75/100%
  let grid='';
  [25,50,75,100].forEach(pct=>{
    const y=yPct(pct);
    grid+=`<line x1="${PAD.left}" y1="${y.toFixed(1)}" x2="${W-PAD.right}" y2="${y.toFixed(1)}" stroke="var(--border)" stroke-width="1" stroke-dasharray="3,3"/>`;
    grid+=`<text x="${(PAD.left-4).toFixed(1)}" y="${(y+3).toFixed(1)}" text-anchor="end" fill="var(--text-secondary)" font-size="9">${pct}%</text>`;
  });

  // Draw each selected metric as a line + dots
  let lines='';
  metrics.forEach(m => {
    const vals = data.map(d => m.val(d));
    const pts = vals.map((v,i)=>`${xC(i).toFixed(1)},${yPct(v).toFixed(1)}`).join(' ');
    if (n > 1) lines += `<polyline points="${pts}" fill="none" stroke="${m.color}" stroke-width="2" stroke-linejoin="round"/>`;
    lines += vals.map((v,i)=>`<circle cx="${xC(i).toFixed(1)}" cy="${yPct(v).toFixed(1)}" r="3" fill="${m.color}" stroke="var(--surface)" stroke-width="1.5"><title>${data[i]._label||fmtDate(data[i].date)}: ${m.label} ${v.toFixed(1)}</title></circle>`).join('');
  });

  // X-axis labels (max 8)
  const step=Math.max(1,Math.ceil(n/8));
  let xLabels='';
  data.forEach((d,i)=>{
    if(i%step===0||i===n-1)
      xLabels+=`<text x="${xC(i).toFixed(1)}" y="${H-6}" text-anchor="middle" fill="var(--text-secondary)" font-size="9">${d._label||fmtDate(d.date)}</text>`;
  });

  wrap.innerHTML=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">${grid}${lines}${xLabels}</svg>`;
}

function setKPIHistoryView(view, btn) {
  save('apg_kpi_history_view', view);
  document.querySelectorAll('.kpi-history-pill').forEach(p=>p.classList.remove('active'));
  if(btn) btn.classList.add('active');
  renderKPIHistory();
}

function renderKPIHistory() {
  renderKPIChart();
  const wrap = document.getElementById('kpi-history-table-wrap');
  const empty = document.getElementById('kpi-history-empty');
  if(!wrap) return;
  const history = load(K.kpiHistory, []).slice(-14).reverse();
  if(!history.length){ wrap.innerHTML=''; if(empty)empty.style.display='block'; return; }
  if(empty) empty.style.display='none';
  wrap.innerHTML=`<table class="kpi-history-table">
    <thead><tr><th>Fecha</th><th>Contexto</th><th>Ventas</th><th>NPS</th><th>Conversión</th><th>UPT</th></tr></thead>
    <tbody>${history.map((s,i)=>{
      const prev = history[i+1];
      const arrow = (cur,prv)=>{
        if(!prv) return '';
        const c=num(cur), p=num(prv);
        if(c>p) return `<span class="trend-up">▲</span>`;
        if(c<p) return `<span class="trend-down">▼</span>`;
        return '→';
      };
      return `<tr>
        <td>${fmtDate(s.date)}</td>
        <td style="font-size:11px;color:var(--text-secondary);max-width:140px;white-space:normal">${esc(s.context||'—')}</td>
        <td>${esc(s.ventas||'—')} ${prev?arrow(s.ventas,prev.ventas):''}</td>
        <td>${esc(s.nps||'—')} ${prev?arrow(s.nps,prev.nps):''}</td>
        <td>${esc(s.conv||'—')} ${prev?arrow(s.conv,prev.conv):''}</td>
        <td>${esc(s.upt||'—')} ${prev?arrow(s.upt,prev.upt):''}</td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;
}
function renderKPIMetricSelector() {
  const wrap = document.getElementById('kpi-metric-selector');
  if (!wrap) return;
  const selected = getSelectedKPIMetrics();
  wrap.innerHTML = KPI_CHART_METRICS.map(m =>
    `<button class="kpi-metric-pill${selected.includes(m.key)?' active':''}" data-metric="${m.key}" onclick="toggleKPIMetric('${m.key}',this)" style="--mc:${m.color}">${m.label}</button>`
  ).join('');
}
function toggleHistorico() {
  const body = document.getElementById('historico-body');
  const icon = document.getElementById('historico-toggle-icon');
  if(body.style.display==='none'){
    body.style.display='block'; if(icon)icon.textContent='▲';
    // Restore active view pill
    const view=load('apg_kpi_history_view','2w');
    document.querySelectorAll('.kpi-history-pill').forEach(p=>p.classList.remove('active'));
    const activePill=document.getElementById('pill-'+view);
    if(activePill) activePill.classList.add('active');
    // Render dynamic metric selector and restore active state
    renderKPIMetricSelector();
    renderKPIHistory();
  } else { body.style.display='none'; if(icon)icon.textContent='▼'; }
}
function getKPITrend(field) {
  const history = load(K.kpiHistory, []);
  if(history.length<2) return null;
  const last = history[history.length-1];
  const prev = history[history.length-2];
  const cur=num(last[field]), pre=num(prev[field]);
  if(cur>pre) return { arrow:'▲', diff:+(cur-pre).toFixed(1), cls:'trend-up' };
  if(cur<pre) return { arrow:'▼', diff:+(pre-cur).toFixed(1), cls:'trend-down' };
  return null;
}

/* ═══════════════════════════════════════════════
   KPI VISUAL ALERTS (Feature 7)
═══════════════════════════════════════════════ */
function checkKPIAlerts() {
  const ventas=num(_g('kpi-ventas'));
  const objVentas=num(_g('kpi-obj-ventas'));
  const nps=num(_g('kpi-nps'));
  const objNps=num(_g('kpi-obj-nps'));
  const ac=num(_g('kpi-ac'));
  const objAcEl=document.getElementById('kpi-obj-ac'); const objAc=num(objAcEl ? objAcEl.value : String(AC_ALERT_THRESHOLD));
  const conv=num(_g('kpi-conv'));
  const objConv=num(_g('kpi-obj-conv'));
  const upt=num(_g('kpi-upt'));
  const objUpt=num(_g('kpi-obj-upt'));
  const hour = new Date().getHours();

  document.querySelectorAll('.kpi-alert-badge').forEach(b=>b.remove());

  const ventasPct = objVentas>0 ? ventas/objVentas : 0;
  const ventasCard = document.getElementById('bar-ventas')?.closest('.card');
  if(ventasCard) {
    if(ventasPct<0.7 && hour>=15) {
      const badge=document.createElement('div');
      badge.className='kpi-alert-badge danger'; badge.textContent='⚠️ Atención';
      ventasCard.appendChild(badge);
    }
    const trend=getKPITrend('ventas');
    if(trend) {
      const trendEl=document.createElement('span');
      trendEl.className='kpi-trend '+trend.cls;
      trendEl.textContent=` ${trend.arrow}${trend.diff}`;
      const valEl=ventasCard.querySelector('.kpi-editable');
      if(valEl && !ventasCard.querySelector('.kpi-trend')) valEl.insertAdjacentElement('afterend',trendEl);
    }
  }

  const npsCard = document.getElementById('bar-nps')?.closest('.card');
  if(npsCard) {
    npsCard.style.borderColor = (nps < objNps && objNps>0) ? 'var(--danger)' : '';
    const trend=getKPITrend('nps');
    if(trend) {
      const trendEl=document.createElement('span');
      trendEl.className='kpi-trend '+trend.cls;
      trendEl.textContent=` ${trend.arrow}${trend.diff}`;
      const valEl=npsCard.querySelector('.kpi-editable');
      if(valEl && !npsCard.querySelector('.kpi-trend')) valEl.insertAdjacentElement('afterend',trendEl);
    }
  }

  const acCardEl = document.getElementById('kpi-ac')?.closest('.card');
  if(acCardEl && ac<AC_ALERT_THRESHOLD) {
    const badge=document.createElement('div');
    badge.className='kpi-alert-badge warning'; badge.textContent='⚠️ AC+ bajo';
    acCardEl.appendChild(badge);
  }

  const npsPctVal=objNps>0?nps/objNps:0;
  const convPctVal=objConv>0?conv/objConv:0;
  const uptPctVal=objUpt>0?upt/objUpt:0;
  const onTrack=ventasPct>=0.9&&npsPctVal>=0.9&&convPctVal>=0.9&&uptPctVal>=0.9;
  const resNpsGrid=document.getElementById('res-nps-grid');
  if(resNpsGrid) {
    resNpsGrid.querySelectorAll('.kpi-alert-badge').forEach(b=>b.remove());
    if(onTrack) {
      const badge=document.createElement('div');
      badge.className='kpi-alert-badge success'; badge.textContent='🎯 On track';
      resNpsGrid.appendChild(badge);
    }
  }
}

/* ═══════════════════════════════════════════════
   K3 — STREAK TRACKER (Alerta de tendencia negativa)
═══════════════════════════════════════════════ */
function getKPIStreaks() {
  const history = load(K.kpiHistory, []);
  if (history.length < 2) return [];
  const sorted = history.slice().sort((a, b) => a.date.localeCompare(b.date));
  const checks = [
    { name: 'Ventas',     val: 'ventas', obj: 'objVentas' },
    { name: 'NPS',        val: 'nps',    obj: 'objNps'    },
    { name: 'DTA',        val: 'dta',    obj: 'objDta'    },
    { name: 'Conversión', val: 'conv',   obj: 'objConv'   },
  ];
  const streaks = [];
  checks.forEach(kpi => {
    let streak = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      const s = sorted[i];
      const val = num(s[kpi.val]);
      const obj = num(s[kpi.obj]);
      if (obj > 0 && val < obj) { streak++; } else { break; }
    }
    if (streak >= 2) streaks.push({ name: kpi.name, weeks: streak });
  });
  return streaks;
}

function renderKPIStreakAlerts() {
  const streaks = getKPIStreaks();
  ['kpi-streak-alerts', 'res-streak-alerts'].forEach(elId => {
    const el = document.getElementById(elId);
    if (!el) return;
    if (!streaks.length) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    el.innerHTML = streaks.map(s =>
      `<div class="streak-alert-item">⚠️ <strong>${esc(s.name)}</strong> — ${s.weeks} semana${s.weeks>1?'s':''} consecutiva${s.weeks>1?'s':''} por debajo del objetivo</div>`
    ).join('');
  });
}

function renderCommitmentsKPIsMirror() {
  const wrap = document.getElementById('commitments-kpis-mirror-content');
  if (!wrap) return;

  const data = load(K.commitments, {});
  const activeQ = getCurrentCommitmentsQuarter();
  const kpisData = (data[activeQ] && data[activeQ].kpis) ? data[activeQ].kpis : {};

  const allKpis = [];
  if (typeof COMMITMENTS_DATA !== 'undefined') {
    const q = COMMITMENTS_DATA[activeQ];
    if (q && q.areas) {
      q.areas.forEach(area => {
        (area.kpis || []).forEach(kpi => {
          allKpis.push({ ...kpi, areaTitle: area.titulo });
        });
      });
    }
  }

  if (!allKpis.length) {
    wrap.innerHTML = '<div style="font-size:13px;color:var(--text-secondary)">No hay KPIs de commitments definidos.</div>';
    return;
  }

  wrap.innerHTML = allKpis.map(kpi => {
    const kpiStored = kpisData[kpi.id] || {};
    const anterior = kpiStored.anterior || '—';
    const actual   = kpiStored.actual   || '—';

    const a = parseFloat(String(anterior).replace(',','.'));
    const b = parseFloat(String(actual).replace(',','.'));
    let arrow = '→', arrowColor = 'var(--text-secondary)';
    if (!isNaN(a) && !isNaN(b)) {
      if (b > a) { arrow = '▲'; arrowColor = 'var(--success)'; }
      else if (b < a) { arrow = '▼'; arrowColor = 'var(--danger)'; }
    }

    return `<div class="card" style="padding:12px;background:var(--surface2)">
      <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;font-weight:600;text-transform:uppercase;letter-spacing:0.3px">${esc(kpi.areaTitle)}</div>
      <div style="font-size:13px;font-weight:600;margin-bottom:8px;line-height:1.3">${esc(kpi.nombre)}</div>
      <div style="display:flex;align-items:center;gap:8px">
        <div style="text-align:center">
          <div style="font-size:10px;color:var(--text-secondary)">${esc(kpi.periodoAnterior || '—')}</div>
          <div style="font-size:18px;font-weight:700">${esc(anterior)}</div>
        </div>
        <div style="font-size:18px;color:${arrowColor};font-weight:700">${arrow}</div>
        <div style="text-align:center">
          <div style="font-size:10px;color:var(--text-secondary)">${esc(kpi.periodoActual || '—')}</div>
          <div style="font-size:18px;font-weight:700;color:var(--accent)">${esc(actual)}</div>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════════
   K4 — FOCUS METRIC DE LA SEMANA
═══════════════════════════════════════════════ */
const FOCUS_METRIC_OPTIONS = [
  { value: 'ventas', label: '💰 Ventas Totales' },
  { value: 'nps',    label: '⭐ NPS Tienda'     },
  { value: 'dta',    label: '⏰ DTA Horas'       },
  { value: 'conv',   label: '🔄 Conversión'      },
  { value: 'upt',    label: '🛍️ UPT'             },
  { value: 'customer-impacting',  label: '📊 Customer-Impacting Actual % to Guidance' },
  { value: 'timely-assistance',   label: '⏱️ Timely Assistance' },
  { value: 'dropin-conversion',   label: '🔄 Drop-In Conversion YoY %' },
  { value: 'geniusbar-conversion',label: '🍎 Genius Bar: Conversion %' },
  { value: 'first-account',       label: '💳 First Account Purchase / Day' },
  { value: 'nps-shared-feature',  label: '⭐ NPS: Shared a Feature %' },
  { value: 'mac-instore-repair',  label: '🔧 Mac: In-Store Repair %' },
  { value: 'delivered-dropin',    label: '📦 Delivered % (Drop-In)' },
  { value: 'training-completion', label: '🎓 Training Completion %' },
  { value: 'coach-connections',   label: '🤝 Coach Connections' },
  { value: 'pulse-action-plan',   label: '📋 Pulse Action Plan Completion %' },
];

/**
 * Populates (or refreshes) the Commitments optgroup in the Focus Metric
 * <select> using the KPIs from the active quarter in COMMITMENTS_DATA.
 * Falls back to the static FOCUS_METRIC_OPTIONS list when commitments data
 * is unavailable so the widget always shows something meaningful.
 */
function populateFocusMetricCommitmentsOptions() {
  const sel = document.getElementById('focus-metric-select');
  if (!sel) return;

  // Remove any previously generated Commitments optgroup
  const existing = sel.querySelector('optgroup[data-dynamic-commitments]');
  if (existing) existing.remove();

  // Determine active quarter label and KPIs
  let quarterLabel = 'Commitments';
  let kpiOptions   = [];

  if (typeof QUARTERS_CONFIG !== 'undefined' && typeof COMMITMENTS_DATA !== 'undefined') {
    const activeConfig = QUARTERS_CONFIG.find(q => q.activo);
    if (activeConfig) {
      quarterLabel = activeConfig.label;
      const qData  = COMMITMENTS_DATA[activeConfig.key];
      if (qData && Array.isArray(qData.areas)) {
        qData.areas.forEach(area => {
          if (Array.isArray(area.kpis)) {
            area.kpis.forEach(kpi => {
              // Map kpi id to an emoji label from FOCUS_METRIC_OPTIONS when available
              const known = FOCUS_METRIC_OPTIONS.find(o => o.value === kpi.id);
              kpiOptions.push({
                value: kpi.id,
                label: known ? known.label : kpi.nombre
              });
            });
          }
        });
      }
    }
  }

  // Fallback: use the static commitments entries from FOCUS_METRIC_OPTIONS
  if (kpiOptions.length === 0) {
    const kpiKeys = new Set(['ventas','nps','dta','conv','upt']);
    FOCUS_METRIC_OPTIONS.forEach(o => {
      if (!kpiKeys.has(o.value)) kpiOptions.push(o);
    });
  }

  if (kpiOptions.length === 0) return;

  const optgroup = document.createElement('optgroup');
  optgroup.label = `── Commitments ${quarterLabel} ──`;
  optgroup.dataset.dynamicCommitments = '1';
  kpiOptions.forEach(({ value, label }) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    optgroup.appendChild(opt);
  });
  sel.appendChild(optgroup);
}

function renderFocusMetricWidget() {
  const fm = load(K.focusMetric, {});
  const sel = document.getElementById('focus-metric-select');
  const hyp = document.getElementById('focus-metric-hypothesis');
  const ref = document.getElementById('focus-metric-reflection');
  populateFocusMetricCommitmentsOptions();
  if (sel && fm.metric) sel.value = fm.metric;
  if (hyp) hyp.value = fm.hypothesis || '';
  if (ref) ref.value = fm.reflection || '';
  renderFocusMetricDisplay();
}

function saveFocusMetric() {
  const metric     = document.getElementById('focus-metric-select')?.value || '';
  const hypothesis = document.getElementById('focus-metric-hypothesis')?.value || '';
  const reflection = document.getElementById('focus-metric-reflection')?.value || '';
  save(K.focusMetric, { metric, hypothesis, reflection, updatedAt: new Date().toISOString() });
  flash('focus-metric-saved');
  renderFocusMetricDisplay();
}

function clearFocusMetric() {
  if (!confirm('¿Seguro que quieres limpiar el Focus Metric de la semana?')) return;
  save(K.focusMetric, {});
  const sel = document.getElementById('focus-metric-select');
  const hyp = document.getElementById('focus-metric-hypothesis');
  const ref = document.getElementById('focus-metric-reflection');
  if (sel) sel.value = '';
  if (hyp) hyp.value = '';
  if (ref) ref.value = '';
  flash('focus-metric-saved');
  renderFocusMetricDisplay();
}

function renderFocusMetricDisplay() {
  const fm = load(K.focusMetric, {});
  const display = document.getElementById('focus-metric-display');
  if (!display) return;
  if (!fm.metric) {
    display.innerHTML = '<p style="font-size:13px;color:var(--text-secondary)">Selecciona tu métrica de foco para ver el resumen aquí.</p>';
    return;
  }
  const opt = FOCUS_METRIC_OPTIONS.find(o => o.value === fm.metric);
  display.innerHTML = `
    <div style="text-align:center;padding:8px 0">
      <div style="font-size:22px;font-weight:700;color:var(--accent);margin-bottom:10px">${opt ? opt.label : fm.metric}</div>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:stretch;max-width:600px;margin:0 auto">
        ${fm.hypothesis ? `<div style="font-size:13px;text-align:left;padding:8px 12px;background:var(--surface);border-radius:var(--radius-sm);border-left:3px solid var(--accent)"><strong>💡 Hipótesis:</strong> ${esc(fm.hypothesis)}</div>` : ''}
        ${fm.reflection 
          ? `<div style="font-size:13px;text-align:left;padding:8px 12px;background:var(--surface);border-radius:var(--radius-sm);border-left:3px solid var(--success)"><strong>✅ Reflexión:</strong> ${esc(fm.reflection)}</div>` 
          : '<div style="font-size:12px;color:var(--text-secondary);text-align:center;padding:4px 0">Sin reflexión de resultado aún.</div>'}
      </div>
    </div>
  `;
}

/* ═══════════════════════════════════════════════
   REUNIONES (Feature 1)
═══════════════════════════════════════════════ */
let reuniones = load(K.reuniones, []);
const saveReuniones = () => save(K.reuniones, reuniones);

function addReunion() {
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
  saveReuniones(); renderReuniones(); toggleForm('add-reunion-form');
  if(document.getElementById('tab-actas').classList.contains('active')) renderActas();
}
const rmReunion = id => { reuniones=reuniones.filter(r=>r.id!==id); saveReuniones(); renderReuniones(); };

function updateReunion(id, field, value) {
  const r=reuniones.find(r=>r.id===id); if(!r) return;
  r[field]=value; saveReuniones();
  if(field==='status') { renderReuniones(); }
  else renderReunionBody(id);
}

const MEETING_NOTES_TEMPLATE_1ON1 = `[🎯] Objetivo de la semana:\n\n[🚧] Bloqueos actuales:\n\n[✨] Feedback positivo:\n\n[➡️] Siguientes pasos (Next steps):\n`;

function applyMeetingNotesTemplate(id) {
  const r=reuniones.find(r=>r.id===id); if(!r) return;
  if(r.notes && r.notes.trim() && !confirm('¿Reemplazar las notas actuales con la plantilla 1:1?')) return;
  r.notes = MEETING_NOTES_TEMPLATE_1ON1;
  saveReuniones();
  renderReunionBody(id);
}

function addAgreement(id) {
  const inp=document.getElementById('re-agr-input-'+id);
  if(!inp||!inp.value.trim()) return;
  const r=reuniones.find(r=>r.id===id); if(!r) return;
  if(!r.agreements) r.agreements=[];
  r.agreements.push(inp.value.trim());
  inp.value='';
  saveReuniones(); renderReunionBody(id);
}
function rmAgreement(id,idx) {
  const r=reuniones.find(r=>r.id===id); if(!r||!r.agreements) return;
  r.agreements.splice(idx,1); saveReuniones(); renderReunionBody(id);
}
function addNextStep(id) {
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
function rmNextStep(id,idx) {
  const r=reuniones.find(r=>r.id===id); if(!r||!r.nextSteps) return;
  r.nextSteps.splice(idx,1); saveReuniones(); renderReunionBody(id);
}
function addNextStepToTasks(id,idx) {
  const r=reuniones.find(r=>r.id===id); if(!r||!r.nextSteps||!r.nextSteps[idx]) return;
  const ns=r.nextSteps[idx];
  tasks.push({ id:Date.now(), text:`[${r.title}] ${ns.desc}${ns.person?' — '+ns.person:''}`, pri:'media', date:ns.deadline, done:false,
               createdDate:new Date().toISOString().split('T')[0], reunionId:r.id, order:tasks.length });
  saveTasks(); renderTasks();
  flash('kpi-saved');
}

/* ═══════════════════════════════════════════════
   EMAIL TEMPLATES (Feature 14)
═══════════════════════════════════════════════ */
const EMAIL_TEMPLATES = {
  'sm':       { subject: 'Acta SM — Apple Passeig de Gràcia', intro: 'Equipo,\n\nAdjunto el acta del Store Meeting de hoy.' },
  'ppo':      { subject: 'Acta PPO — Apple Passeig de Gràcia', intro: 'Equipo,\n\nAdjunto el resumen de la reunión PPO.' },
  '1:1':      { subject: '1:1 Follow-up — Apple Passeig de Gràcia', intro: 'Hola,\n\nEste es el seguimiento de nuestra sesión 1:1.' },
  'comercial':{ subject: 'Acta Comercial España — Apple Passeig de Gràcia', intro: 'Equipo,\n\nResumen de la reunión comercial semanal con España.' },
  'kpi':      { subject: 'KPI Review — Apple Passeig de Gràcia', intro: 'Equipo,\n\nAdjunto la revisión semanal de KPIs.' },
  'people':   { subject: 'People Review — Apple Passeig de Gràcia', intro: 'Equipo,\n\nResumen del People Review semanal.' },
  'default':  { subject: 'Acta de Reunión — Apple Passeig de Gràcia', intro: 'Equipo,\n\nAdjunto el acta de la reunión.' },
};
function getEmailTemplate(title) {
  const t = (title||'').toLowerCase();
  for(const [key,tpl] of Object.entries(EMAIL_TEMPLATES)) {
    if(key!=='default' && t.includes(key)) return tpl;
  }
  return EMAIL_TEMPLATES.default;
}
function generateActaMailto(id) {
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

function generateICS(id) {
  const r=reuniones.find(r=>r.id===id); if(!r||!r.datetime) return;
  const dt=new Date(r.datetime);
  const pad=n=>String(n).padStart(2,'0');
  const fmt=d=>`${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  // Escape text properties per RFC 5545: backslash, semicolon, comma, and newlines
  const escICS = s => (s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');
  const MS_PER_HOUR = 3600000;
  const end=new Date(dt.getTime()+MS_PER_HOUR);
  let desc=r.notes||'';
  if(r.agreements&&r.agreements.length) desc+='\nAcuerdos:\n'+r.agreements.map((a,i)=>`${i+1}. ${a}`).join('\n');
  const attendees=(r.attendees||'').split(',').map(a=>a.trim()).filter(Boolean).map(a=>`ATTENDEE:${escICS(a)}`).join('\r\n');
  const lines=[
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//APG Dashboard//ES','BEGIN:VEVENT',
    `SUMMARY:${escICS(r.title)}`,`DTSTART:${fmt(dt)}`,`DTEND:${fmt(end)}`,
    `DESCRIPTION:${escICS(desc)}`,
    ...(attendees ? attendees.split('\r\n') : []),
    'END:VEVENT','END:VCALENDAR'
  ];
  const ics=lines.join('\r\n');
  const blob=new Blob([ics],{type:'text/calendar'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${r.title.replace(/[^\p{L}\p{N}]/gu,'_')}.ics`; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

function generateActaText(id) {
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

function renderReunionBody(id) {
  const r=reuniones.find(r=>r.id===id); if(!r) return;
  const body=document.getElementById('rb-'+id); if(!body) return;
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
function addTaskFromReunion(reunionId) {
  const textEl=document.getElementById('rt-task-text-'+reunionId);
  const priEl=document.getElementById('rt-task-pri-'+reunionId);
  const dateEl=document.getElementById('rt-task-date-'+reunionId);
  if(!textEl||!textEl.value.trim()) return;
  const t={ id:Date.now(), text:textEl.value.trim(), pri:priEl?priEl.value:'media',
             date:dateEl?dateEl.value:'', done:false, reunionId,
             createdDate:new Date().toISOString().split('T')[0], order:tasks.length };
  tasks.push(t);
  textEl.value=''; if(dateEl) dateEl.value='';
  saveTasks(); renderTasks(); renderReunionBody(reunionId);
}

function renderReuniones() {
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

function toggleReunion(id) {
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
function renderActas() {
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

function showActaDetail(id) {
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

function showActaList() {
  document.getElementById('actas-list-view').style.display='block';
  document.getElementById('actas-detail-view').style.display='none';
  document.getElementById('actas-back-bar').style.display='none';
}

/* ═══════════════════════════════════════════════
   TB SESSIONS (Feature 2)
═══════════════════════════════════════════════ */
/* ── TB / 1:1 MODAL (replaces inline tb-panel) ── */
let currentTBMemberId = null;

function openTBModal(memberId) {
  currentTBMemberId = memberId;
  const m = team.find(m => m.id === memberId);
  const overlay = document.getElementById('tb-modal-overlay');
  if (!overlay) return;
  document.getElementById('tb-modal-title').textContent = '🤝 TB / 1:1 — ' + (m ? m.name : '');
  renderTBSuggestions(memberId);
  document.getElementById('tb-modal-sessions').innerHTML = renderTBSessions(memberId);
  const form = document.getElementById('tb-modal-form');
  if (form) form.classList.remove('open');
  overlay.classList.add('open');
}
function closeTBModal(e) {
  if (e && e.target !== document.getElementById('tb-modal-overlay')) return;
  document.getElementById('tb-modal-overlay').classList.remove('open');
  currentTBMemberId = null;
}
function closeTBModalBtn() {
  document.getElementById('tb-modal-overlay').classList.remove('open');
  currentTBMemberId = null;
}
function openTBForm() {
  const form = document.getElementById('tb-modal-form');
  if (form) {
    form.classList.add('open');
    const dateEl = document.getElementById('tb-modal-date');
    if (dateEl) dateEl.value = new Date().toISOString().slice(0,10);
  }
}
function closeTBForm() {
  const form = document.getElementById('tb-modal-form');
  if (form) form.classList.remove('open');
}
function saveTBModalSession() {
  const memberId = currentTBMemberId; if (!memberId) return;
  const date = document.getElementById('tb-modal-date')?.value || new Date().toISOString().slice(0,10);
  const points = document.getElementById('tb-modal-points')?.value.trim() || '';
  const agreements = document.getElementById('tb-modal-agreements')?.value.trim() || '';
  const followUp = document.getElementById('tb-modal-followup')?.checked || false;
  const followUpDesc = document.getElementById('tb-modal-followup-desc')?.value.trim() || '';
  const tbs = load(K.tbs, {});
  if (!tbs[memberId]) tbs[memberId] = [];
  tbs[memberId].push({ id: Date.now(), date, points, agreements, followUp, followUpDesc });
  save(K.tbs, tbs);
  document.getElementById('tb-modal-points').value = '';
  document.getElementById('tb-modal-agreements').value = '';
  document.getElementById('tb-modal-followup-desc').value = '';
  document.getElementById('tb-modal-followup').checked = false;
  closeTBForm();
  document.getElementById('tb-modal-sessions').innerHTML = renderTBSessions(memberId);
  renderTeam();
}
function renderTBSessions(memberId) {
  const tbs=load(K.tbs,{});
  const sessions=(tbs[memberId]||[]).slice().reverse().slice(0,10);
  if(!sessions.length) return '<div style="font-size:12px;color:var(--text-secondary)">Sin sesiones aún.</div>';
  const mb = team.find(m=>m.id===memberId) || equipoLiderazgo.find(e=>e.id===memberId) || {};
  const mbEmail = mb.email || '';
  const mbName  = mb.name || mb.nombre || '';
  return sessions.map(s=>`
    <div class="tb-session-item">
      <div class="tb-session-date">📅 ${fmtDate(s.date)}</div>
      ${s.points?`<div style="margin:4px 0">${esc(s.points)}</div>`:''}
      ${s.agreements?`<div style="color:var(--text-secondary);font-size:12px">Acuerdos: ${esc(s.agreements)}</div>`:''}
      ${s.followUp?`<div style="color:var(--warning);font-size:12px;margin-top:4px">⏳ Seguimiento: ${esc(s.followUpDesc||'Pendiente')}</div>`:''}
      <a style="font-size:11px;color:var(--accent);text-decoration:none;display:inline-block;margin-top:6px" href="mailto:${encodeURIComponent(mbEmail)}?subject=${encodeURIComponent('Resumen TB — '+mbName+' — '+s.date)}">📧 Enviar resumen TB</a>
    </div>`).join('');
}

/* Legacy stubs kept in case any old stored references call them — they now delegate to the modal */
function toggleTBPanel(memberId) { openTBModal(memberId); }
function openNewTBForm(memberId) { currentTBMemberId = memberId; openTBForm(); }
function saveTBSession(memberId) { currentTBMemberId = memberId; saveTBModalSession(); }

/* ═══════════════════════════════════════════════
   PR3 — FEATURE 1: RECONOCIMIENTOS GAMIFICADOS
═══════════════════════════════════════════════ */
/* Nota: reconocimientos sin campo `cat` migran a "resultado" por defecto */
const RECOG_CATEGORIES = {
  resultado:    { label: 'Resultado',    emoji: '🎯' },
  innovacion:   { label: 'Innovación',   emoji: '💡' },
  colaboracion: { label: 'Colaboración', emoji: '🤝' },
  cliente:      { label: 'Cliente',      emoji: '🌟' },
};
let _recogView = 'lista';       // 'lista' | 'scoreboard'
let _scoreboardPeriod = 'quarter'; // 'month' | 'quarter' | 'year'

function getMemberName(personId) {
  const m = team.find(m => m.id === personId);
  if (m) return m.name;
  const e = equipoLiderazgo.find(e => e.id === personId);
  return e ? e.nombre : 'Desconocido';
}

function switchRecogView(view) {
  _recogView = view;
  document.getElementById('recog-lista-view').style.display = view === 'lista' ? 'block' : 'none';
  document.getElementById('recog-scoreboard-view').style.display = view === 'scoreboard' ? 'block' : 'none';
  document.getElementById('recog-view-lista').classList.toggle('active', view === 'lista');
  document.getElementById('recog-view-scoreboard').classList.toggle('active', view === 'scoreboard');
  if (view === 'scoreboard') renderScoreboard();
}

function setScoreboardPeriod(period) {
  _scoreboardPeriod = period;
  renderScoreboard();
}

function renderScoreboard() {
  const wrap = document.getElementById('recog-scoreboard-content');
  if (!wrap) return;
  const recogs = load(K.reconocimientos, []);
  const today = new Date();

  function periodFilter(period) {
    const y = today.getFullYear();
    if (period === 'month') {
      const m = String(today.getMonth() + 1).padStart(2, '0');
      return r => r.date && r.date.startsWith(`${y}-${m}`);
    } else if (period === 'quarter') {
      const q = Math.floor(today.getMonth() / 3);
      const ms = q * 3, me = ms + 2;
      const qs = `${y}-${String(ms + 1).padStart(2, '0')}-01`;
      const qe = `${y}-${String(me + 1).padStart(2, '0')}-${new Date(y, me + 1, 0).getDate()}`;
      return r => r.date >= qs && r.date <= qe;
    }
    return r => r.date && r.date.startsWith(`${y}`);
  }

  const filter = periodFilter(_scoreboardPeriod);
  const filtered = recogs.filter(filter);
  const periodLabels = { month: 'Este mes', quarter: 'Este trimestre', year: 'Este año' };
  const toggleHtml = ['month','quarter','year'].map(p =>
    `<button class="scoreboard-period-btn${_scoreboardPeriod===p?' active':''}" onclick="setScoreboardPeriod('${p}')">${periodLabels[p]}</button>`).join('');

  const ranking = {};
  filtered.forEach(r => {
    if (!ranking[r.personId]) ranking[r.personId] = { total: 0, cats: {} };
    ranking[r.personId].total++;
    const cat = r.cat || 'resultado';
    ranking[r.personId].cats[cat] = (ranking[r.personId].cats[cat] || 0) + 1;
  });
  const sorted = Object.entries(ranking).sort((a, b) => b[1].total - a[1].total).slice(0, 10);
  const medals = ['🥇', '🥈', '🥉'];

  let html = `<div class="scoreboard-period-toggle">${toggleHtml}</div>`;

  if (!sorted.length) {
    html += `<div class="empty-state" style="padding:24px 0"><div class="empty-state-icon">🏆</div><p>Sin reconocimientos en el período seleccionado.</p></div>`;
  } else {
    html += `<div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.04em">Ranking — ${periodLabels[_scoreboardPeriod]}</div>`;
    sorted.forEach(([pid, data], i) => {
      const rankCls = i < 3 ? ['top1','top2','top3'][i] : '';
      const catPills = Object.entries(data.cats).map(([cat, cnt]) => {
        const catInfo = RECOG_CATEGORIES[cat] || RECOG_CATEGORIES.resultado;
        return `<span class="recog-cat-pill recog-cat-${esc(cat)}">${catInfo.emoji} ${cnt}</span>`;
      }).join('');
      html += `<div class="scoreboard-row">
        <div class="scoreboard-rank ${rankCls}">${i < 3 ? medals[i] : `#${i+1}`}</div>
        <div class="scoreboard-name">${esc(getMemberName(parseInt(pid)))}</div>
        <div class="scoreboard-cats">${catPills}</div>
        <div class="scoreboard-count">${data.total}</div>
      </div>`;
    });
  }

  // Per-person counters table
  const allPersonIds = [...new Set(recogs.map(r => r.personId))];
  if (allPersonIds.length) {
    const mf = periodFilter('month'), qf = periodFilter('quarter'), yf = periodFilter('year');
    html += `<div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-top:18px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.04em">Contadores por persona</div>`;
    html += `<div style="overflow-x:auto"><table class="comparativa-table"><thead><tr><th>Persona</th><th>Mes</th><th>Trimestre</th><th>Año</th></tr></thead><tbody>`;
    allPersonIds.forEach(pid => {
      const m = recogs.filter(r => r.personId===pid && mf(r)).length;
      const q = recogs.filter(r => r.personId===pid && qf(r)).length;
      const y = recogs.filter(r => r.personId===pid && yf(r)).length;
      html += `<tr><td>${esc(getMemberName(pid))}</td><td>${m}</td><td>${q}</td><td>${y}</td></tr>`;
    });
    html += '</tbody></table></div>';
  }
  wrap.innerHTML = html;
}

/* ═══════════════════════════════════════════════
   RECONOCIMIENTOS (Feature 8)
═══════════════════════════════════════════════ */
function updateRecogDropdown() {
  const sel=document.getElementById('recog-person'); if(!sel) return;
  // Always include all equipoLiderazgo members so they remain selectable even when hidden/removed
  const leaderIds = new Set(equipoLiderazgo.map(e=>e.id));
  const extraMembers = team.filter(m => !leaderIds.has(m.id) && !m.hidden);
  const allMembers = [
    ...equipoLiderazgo.map(e => ({ id: e.id, name: e.nombre })),
    ...extraMembers.map(m => ({ id: m.id, name: m.name }))
  ];
  sel.innerHTML=allMembers.map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join('');
}
function addRecog() {
  const personId=parseInt(document.getElementById('recog-person')?.value);
  const desc=document.getElementById('recog-desc')?.value.trim();
  const date=document.getElementById('recog-date')?.value||new Date().toISOString().slice(0,10);
  const cat=document.getElementById('recog-category')?.value||'resultado';
  if(!personId||!desc){ document.getElementById('recog-desc')?.focus(); return; }
  const recogs=load(K.reconocimientos,[]);
  recogs.push({ id:Date.now(), personId, desc, date, cat });
  save(K.reconocimientos, recogs);
  document.getElementById('recog-desc').value='';
  renderRecogs(); renderTeam();
}
function renderRecogs() {
  const list=document.getElementById('recog-list');
  const empty=document.getElementById('recog-empty');
  if(!list) return;
  const MAX_RECENT_RECOGS = 20; // show last 20 entries (up from 10 to better reflect recent activity)
  const recogs=load(K.reconocimientos,[]).slice(-MAX_RECENT_RECOGS).reverse();
  if(!recogs.length){ list.innerHTML=''; if(empty) empty.style.display='block'; return; }
  if(empty) empty.style.display='none';
  list.innerHTML=recogs.map(r=>{
    /* backward compat: records without `cat` default to "resultado" */
    const cat=r.cat||'resultado';
    const catInfo=RECOG_CATEGORIES[cat]||RECOG_CATEGORIES.resultado;
    return `<div class="recog-item">
      <span class="recog-trophy">🏆</span>
      <div class="recog-text">
        <div class="recog-person" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          ${esc(getMemberName(r.personId))}
          <span class="recog-cat-pill recog-cat-${esc(cat)}">${catInfo.emoji} ${esc(catInfo.label)}</span>
        </div>
        <div>${esc(r.desc)}</div>
        <div class="recog-date-small">${fmtDate(r.date)}</div>
      </div>
    </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════════
   TEMPLATE MODAL
═══════════════════════════════════════════════ */
const MEETING_TEMPLATES = [
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

let _templateModalCtx = 'notas';
function openTemplateModal(context) {
  _templateModalCtx = context || 'notas';
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
function closeTemplateModal() {
  document.getElementById('template-overlay').classList.remove('open');
}
function closeTemplateModalOnBg(e) {
  if(e.target===document.getElementById('template-overlay')) closeTemplateModal();
}
function applyTemplate(idx) {
  const t = MEETING_TEMPLATES[idx]; if(!t) return;
  closeTemplateModal();

  if (_templateModalCtx === 'reuniones') {
    // Apply template to the new-reunion form
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const titleEl = document.getElementById('re-title');
    const datetimeEl = document.getElementById('re-datetime');
    const attendeesEl = document.getElementById('re-attendees');
    const notesEl = document.getElementById('re-template-notes');
    if (titleEl) titleEl.value = t.title || '';
    if (datetimeEl) datetimeEl.value = `${todayStr}T${t.defaultTime || '09:00'}`;
    if (attendeesEl) attendeesEl.value = t.attendeesSuggestion || '';
    if (notesEl) {
      const agendaText = Array.isArray(t.agenda)
        ? t.agenda.map(item => `• ${item}`).join('\n')
        : (t.notes || '');
      notesEl.value = agendaText;
    }
    const form = document.getElementById('add-reunion-form');
    if (form && !form.classList.contains('open')) toggleForm('add-reunion-form');
    titleEl?.focus();
    return;
  }

  // Default: create a new meeting note in the Notas tab
  switchTab('notas');

  // Build agenda HTML for the rich-text editor
  const agendaHtml = Array.isArray(t.agenda) && t.agenda.length
    ? '<ul>' + t.agenda.map(item => `<li>${esc(item)}</li>`).join('') + '</ul>'
    : '';

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const note = {
    id: mnGenId(),
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
  _mnNotes.unshift(note);
  save(K.meetingNotes, _mnNotes);
  _mnCurrentId = note.id;
  mnShowEditor(note);
  mnRenderList();
  document.getElementById('mn-title')?.focus();
}

/* ═══════════════════════════════════════════════
   SPOTLIGHT (Cmd+K)
═══════════════════════════════════════════════ */
function openSpotlight() {
  const overlay = document.getElementById('spotlight-overlay'); if(!overlay) return;
  overlay.classList.add('open');
  const inp = document.getElementById('spotlight-input');
  if(inp){ inp.value=''; inp.focus(); }
  renderSpotlightResults();
}
function closeSpotlight() {
  document.getElementById('spotlight-overlay').classList.remove('open');
}
function closeSpotlightOnBg(e) {
  if(e.target===document.getElementById('spotlight-overlay')) closeSpotlight();
}
function renderSpotlightResults() {
  const q = (document.getElementById('spotlight-input').value||'').trim().toLowerCase();
  const res = document.getElementById('spotlight-results'); if(!res) return;
  if(!q){ res.innerHTML=''; return; }

  const groups = [];

  // Tasks
  const taskMatches = tasks.filter(t=>t.text.toLowerCase().includes(q)).slice(0,5);
  if(taskMatches.length) {
    groups.push(`<div class="spotlight-group-header">✅ Tareas</div>` +
      taskMatches.map(t=>`<div class="spotlight-result-item" onclick="spotlightGo('tareas','task-${t.id}')">
        <div class="spotlight-result-icon">${t.done?'✅':'⏳'}</div>
        <div class="spotlight-result-text">
          <div class="spotlight-result-main">${esc(t.text)}</div>
          <div class="spotlight-result-sub">${t.pri.toUpperCase()}${t.date?' · '+fmtDate(t.date):''} · ${t.done?'Completada':'Pendiente'}</div>
        </div></div>`).join(''));
  }

  // Events
  const evMatches = events.filter(e=>e.title.toLowerCase().includes(q)||(e.desc&&e.desc.toLowerCase().includes(q))).slice(0,5);
  if(evMatches.length) {
    groups.push(`<div class="spotlight-group-header">📅 Agenda</div>` +
      evMatches.map(e=>`<div class="spotlight-result-item" onclick="spotlightGo('agenda','ev-${e.id}')">
        <div class="spotlight-result-icon">📅</div>
        <div class="spotlight-result-text">
          <div class="spotlight-result-main">${esc(e.title)}</div>
          <div class="spotlight-result-sub">${fmtDate(e.date)}${e.time?' · '+e.time:''}${e.desc?' · '+esc(e.desc):''}</div>
        </div></div>`).join(''));
  }

  // Reuniones
  const reuMatches = reuniones.filter(r=>r.title.toLowerCase().includes(q)||(r.attendees&&r.attendees.toLowerCase().includes(q))).slice(0,5);
  if(reuMatches.length) {
    groups.push(`<div class="spotlight-group-header">🗒️ Reuniones</div>` +
      reuMatches.map(r=>`<div class="spotlight-result-item" onclick="spotlightGo('reuniones','')">
        <div class="spotlight-result-icon">🗒️</div>
        <div class="spotlight-result-text">
          <div class="spotlight-result-main">${esc(r.title)}</div>
          <div class="spotlight-result-sub">${r.datetime?new Date(r.datetime).toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'}):'Sin fecha'} · ${esc(r.status)}</div>
        </div></div>`).join(''));
  }

  // Team
  const teamMatches = team.filter(m=>m.name.toLowerCase().includes(q)||(m.role&&m.role.toLowerCase().includes(q))||(m.email&&m.email.toLowerCase().includes(q))).slice(0,5);
  if(teamMatches.length) {
    groups.push(`<div class="spotlight-group-header">👥 Equipo</div>` +
      teamMatches.map(m=>`<div class="spotlight-result-item" onclick="spotlightGo('equipo','')">
        <div class="spotlight-result-icon">👤</div>
        <div class="spotlight-result-text">
          <div class="spotlight-result-main">${esc(m.name)}</div>
          <div class="spotlight-result-sub">${esc(m.role||'')}${m.email?' · '+esc(m.email):''} · ${m.status}</div>
        </div></div>`).join(''));
  }

  // Meeting Notes
  const mnNotesData = load(K.meetingNotes, []);
  const mnMatches = mnNotesData.filter(n =>
    (n.title||'').toLowerCase().includes(q) ||
    (n.participants||'').toLowerCase().includes(q) ||
    (n.tags||[]).some(t=>t.toLowerCase().includes(q)) ||
    mnStripHtml(n.content||'').toLowerCase().includes(q)
  ).slice(0,5);
  if(mnMatches.length) {
    groups.push(`<div class="spotlight-group-header">📝 Notas de reunión</div>` +
      mnMatches.map(n=>{
        const typeEmoji = MN_TYPES[n.type]||'📝';
        const dateStr = n.datetime ? new Date(n.datetime).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}) : '';
        const plain = mnStripHtml(n.content||'');
        const idx = plain.toLowerCase().indexOf(q);
        let snippet = '';
        if(idx>=0){ const start=Math.max(0,idx-20); snippet='…'+plain.slice(start,start+80)+'…'; }
        else { snippet = plain.slice(0,80); }
        return `<div class="spotlight-result-item" onclick="spotlightGoNote('${n.id}')">
          <div class="spotlight-result-icon">${typeEmoji}</div>
          <div class="spotlight-result-text">
            <div class="spotlight-result-main">${esc(n.title||'Sin título')}</div>
            <div class="spotlight-result-sub">${dateStr}${n.participants?' · '+esc(n.participants.split(',')[0].trim()):''}${snippet?' · '+esc(snippet):''}</div>
          </div></div>`;
      }).join(''));
  }

  if(!groups.length) {
    res.innerHTML=`<div class="spotlight-empty">Sin resultados para «${esc(q)}»</div>`;
  } else {
    res.innerHTML = groups.join('');
  }
}
function spotlightGo(tab, elementId) {
  closeSpotlight();
  switchTab(tab);
  if(elementId) {
    setTimeout(()=>{
      const el=document.getElementById(elementId);
      if(el){ el.scrollIntoView({behavior:'smooth',block:'center'}); el.style.outline='2px solid var(--accent)'; setTimeout(()=>el.style.outline='',1500); }
    }, 120);
  }
}
function spotlightGoNote(noteId) {
  closeSpotlight();
  switchTab('notas');
  setTimeout(() => {
    _mnNotes = load(K.meetingNotes, []);
    mnOpenNote(noteId);
  }, 150);
}
document.addEventListener('keydown', e => {
  if((e.metaKey||e.ctrlKey) && e.key==='k') { e.preventDefault(); openSpotlight(); }
  if(e.key==='Escape') {
    closeSpotlight();
    closeTemplateModal();
    closeRecurringModal();
    exitFocusMode();
    closeLaunchModal();
  }
});
document.addEventListener('click', e => {
  const panel=document.getElementById('notif-panel');
  const btn=document.getElementById('notif-btn');
  if(panel && panel.classList.contains('open') && !panel.contains(e.target) && e.target!==btn && !btn.contains(e.target)) {
    panel.classList.remove('open');
  }
});

/* ═══════════════════════════════════════════════
   AGENDA — WEEKLY VIEW
═══════════════════════════════════════════════ */
const DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const DIAS_FULL   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

function getWeekStart(offset) {
  const today = new Date();
  const dow = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() - (dow===0?6:dow-1) + offset*7);
  mon.setHours(0,0,0,0);
  return mon;
}

function setAgendaView(view, btn) {
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

function applyAgendaView() {
  const view = load(K.agendaView, 'semana');
  setAgendaView(view, null);
}

function shiftWeek(dir) {
  // dir = -1 (prev), 0 (today/reset), 1 (next)
  let offset = load(K.agendaWeekOffset, 0);
  if(dir===0) offset=0; else offset+=dir;
  save(K.agendaWeekOffset, offset);
  renderWeeklyView();
}

// ── Drag & Drop state for week calendar ──
let _dragEventId = null;
let _dragSourceDate = null;
let _wcNowTimer = null;
let _wcMultiWeek = false;

function toggleWeekMultiView(btn) {
  _wcMultiWeek = !_wcMultiWeek;
  if (btn) btn.classList.toggle('active', _wcMultiWeek);
  renderWeeklyView();
}

function renderWeeklyView() {
  const offset = load(K.agendaWeekOffset, 0);
  const numDays = _wcMultiWeek ? 21 : 7;
  // In multi-week mode, start from the previous week so current week is in the center
  const startOffset = _wcMultiWeek ? offset - 1 : offset;
  const mon = getWeekStart(startOffset);
  const todayStr = localDateStr();
  const wrap = document.getElementById('week-grid');
  const navTitle = document.getElementById('week-nav-title');
  if (!wrap) return;

  // Clear any existing now-line interval
  if (_wcNowTimer) { clearInterval(_wcNowTimer); _wcNowTimer = null; }

  // Build days
  const days = [];
  for (let i = 0; i < numDays; i++) {
    const d = new Date(mon); d.setDate(mon.getDate() + i);
    days.push(d);
  }

  // Nav title
  const fmtN = d => `${DIAS_SEMANA[d.getDay()]} ${d.getDate()} ${d.toLocaleDateString('es-ES',{month:'short'})}`;
  if (_wcMultiWeek) {
    if (navTitle) navTitle.textContent = `${fmtN(days[0])} — ${fmtN(days[20])}`;
  } else {
    if (navTitle) navTitle.textContent = `${fmtN(days[0])} — ${fmtN(days[6])}`;
  }

  const START_HOUR = 7, END_HOUR = 22;
  const HOUR_PX = 60;
  const totalHours = END_HOUR - START_HOUR;

  // Detect timed events per day and compute overlapping columns
  function layoutDayEvents(dayEvents) {
    // Split into timed and all-day
    const timed = dayEvents.filter(e => e.time);
    const allDay = dayEvents.filter(e => !e.time);

    // Overlap detection
    function toMins(t) {
      const [h,m] = t.split(':').map(Number); return h * 60 + m;
    }
    // Sort by time
    timed.sort((a,b) => toMins(a.time) - toMins(b.time));

    // Assign columns to overlapping events
    const columns = [];
    timed.forEach(ev => {
      const start = toMins(ev.time);
      const end = start + 60; // assume 60min duration for overlap detection
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

  // Color for event
  function evColor(e) {
    const map = { blue:'#0071e3', green:'#28a745', orange:'#fd7e14', red:'#dc3545', purple:'#6f42c1' };
    return map[e.color] || '#0071e3';
  }

  // Build header row
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

  // Build all-day row
  const alldayCells = days.map(d => {
    const dateStr = localDateStr(d);
    const allDayEvs = events.filter(e => e.date === dateStr && !e.time);
    const pills = allDayEvs.map(e =>
      `<div class="week-cal-allday-pill" draggable="true"
        data-event-id="${e.id}"
        ondragstart="onWeekEventDragStart(event,${e.id},'${dateStr}')"
        ondragend="onWeekEventDragEnd(event)"
        onclick="event.stopPropagation();openEventModal(${e.id})"
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

  // Build time gutter
  const gutterRows = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    gutterRows.push(`<div class="week-cal-time-slot">${String(h).padStart(2,'0')}:00</div>`);
  }

  // Build day columns
  const dayCols = days.map((d, i) => {
    const dateStr = localDateStr(d);
    const isToday = dateStr === todayStr;
    const isWeekStart = _wcMultiWeek && i % 7 === 0;
    const dayEvents = events.filter(e => e.date === dateStr);
    const { timed, evCols } = layoutDayEvents(dayEvents);

    // Hour/half-hour lines
    const lines = [];
    for (let h = 0; h < totalHours; h++) {
      lines.push(`<div class="week-cal-hour-line" style="top:${h*HOUR_PX}px"></div>`);
      lines.push(`<div class="week-cal-hour-line half" style="top:${h*HOUR_PX + 30}px"></div>`);
      lines.push(`<div class="week-cal-hour-line quarter" style="top:${h*HOUR_PX + 15}px"></div>`);
      lines.push(`<div class="week-cal-hour-line quarter" style="top:${h*HOUR_PX + 45}px"></div>`);
    }

    // Timed events
    const evDivs = timed.map(e => {
      const [eh, em] = e.time.split(':').map(Number);
      const top = (eh - START_HOUR) * HOUR_PX + (em / 60) * HOUR_PX;
      const height = Math.max(28, HOUR_PX); // default 60min height
      const { col, total } = evCols[e.id] || { col:0, total:1 };
      const w = 100 / total;
      const left = col * w;
      return `<div class="week-cal-event" draggable="true"
        data-event-id="${e.id}"
        style="top:${top}px;height:${height}px;left:calc(${left}% + 2px);width:calc(${w}% - 4px);background:${evColor(e)}"
        ondragstart="onWeekEventDragStart(event,${e.id},'${dateStr}')"
        ondragend="onWeekEventDragEnd(event)"
        onclick="event.stopPropagation();openEventModal(${e.id})"
        title="${esc(e.title)} · ${e.time}"
      >
        <div class="week-cal-event-title">${(AGENDA_CAT_ICONS[e.category] ? AGENDA_CAT_ICONS[e.category] + ' ' : '') + esc(e.title)}</div>
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

  // Now-line
  _updateWCNowLine();
  _wcNowTimer = setInterval(_updateWCNowLine, 60000);

  // Scroll to current time (or 8am)
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

function _updateWCNowLine() {
  const START_HOUR = 7, END_HOUR = 22, HOUR_PX = 60;
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const startMins = START_HOUR * 60;
  const endMins = END_HOUR * 60;
  const daysEl = document.getElementById('week-cal-days');
  if (!daysEl) return;

  // Remove existing now-lines
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

function onWeekEventDragEnd(evt) {
  evt.currentTarget.classList.remove('dragging');
  // Remove all drop highlights
  document.querySelectorAll('.week-cal-drop-highlight').forEach(el => el.classList.remove('week-cal-drop-highlight'));
}

function onWeekEventDragStart(evt, id, sourceDate) {
  _dragEventId = id;
  _dragSourceDate = sourceDate;
  evt.dataTransfer.effectAllowed = 'move';
  evt.dataTransfer.setData('text/plain', String(id));
  evt.currentTarget.classList.add('dragging');
}

function onWeekColDragOver(evt) {
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'move';
  evt.currentTarget.classList.add('week-cal-drop-highlight');
}

function onWeekColDragLeave(evt) {
  if (!evt.currentTarget.contains(evt.relatedTarget)) {
    evt.currentTarget.classList.remove('week-cal-drop-highlight');
  }
}

function onWeekColDrop(evt, newDate) {
  evt.preventDefault();
  evt.stopPropagation();
  evt.currentTarget.classList.remove('week-cal-drop-highlight');
  if (_dragEventId === null) return;
  const ev = events.find(e => e.id === _dragEventId);
  if (!ev) return;

  ev.date = newDate;

  // If dropping onto the timed grid (not all-day), calculate time from Y position
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

function onWeekColClick(evt, dateStr) {
  // Only fire if clicking on empty space (not on an event)
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

  // Pre-fill the event form
  const dateEl = document.getElementById('ev-date');
  const timeEl = document.getElementById('ev-time');
  if (dateEl) dateEl.value = dateStr;
  if (timeEl) timeEl.value = timeStr;

  // Open the form and scroll to it
  const form = document.getElementById('add-event-form');
  if (form) {
    form.classList.add('open');
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  const titleEl = document.getElementById('ev-title');
  if (titleEl) titleEl.focus();
}

/* ── WEEK WIDGET in Resumen — 2 semanas ── */
function renderWeekWidget() {
  const content = document.getElementById('week-widget-content');
  const empty   = document.getElementById('week-widget-empty');
  if(!content) return;

  const today = new Date();
  const dow = today.getDay();
  const mon1 = new Date(today); mon1.setDate(today.getDate()-(dow===0?6:dow-1)); mon1.setHours(0,0,0,0);
  const mon2 = new Date(mon1); mon2.setDate(mon1.getDate()+7);
  const end2  = new Date(mon2); end2.setDate(mon2.getDate()+6); end2.setHours(23,59,59,999);
  const todayStr = localDateStr(today);

  // Build 14 days
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

  // Render week 1
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

/* ═══════════════════════════════════════════════
   FEATURE 2 — RECURRING AGENDA
═══════════════════════════════════════════════ */
function openRecurringModal() {
  const list=document.getElementById('recurring-list'); if(!list) return;
  const today=new Date(); today.setHours(0,0,0,0);
  const dow=today.getDay();
  const mon=new Date(today);
  if(dow===0){ mon.setDate(today.getDate()+1); } else { mon.setDate(today.getDate()-(dow-1)); }
  mon.setHours(0,0,0,0);

  const meetings = _getRecurringMeetings();
  const DIAS_LABEL=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

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

  // Add "new recurring meeting" form
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
function closeRecurringModal() { document.getElementById('recurring-overlay').classList.remove('open'); }
function closeRecurringModalOnBg(e) { if(e.target===document.getElementById('recurring-overlay')) closeRecurringModal(); }

function addNewRecurringItem() {
  const name = document.getElementById('rm-new-name')?.value.trim();
  const day = parseInt(document.getElementById('rm-new-day')?.value || '1');
  const time = document.getElementById('rm-new-time')?.value || '09:00';
  const desc = document.getElementById('rm-new-desc')?.value.trim() || '';
  if (!name) { alert('El nombre es obligatorio.'); return; }
  const meetings = _getRecurringMeetings();
  meetings.push({ name, day, time, desc });
  _saveRecurringMeetings(meetings);
  showToast('✅ Reunión recurrente añadida');
  openRecurringModal(); // Refresh
}

function editRecurringItem(idx) {
  const meetings = _getRecurringMeetings();
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
  _saveRecurringMeetings(meetings);
  showToast('✅ Reunión recurrente actualizada');
  openRecurringModal(); // Refresh
}

function deleteRecurringItem(idx) {
  const meetings = _getRecurringMeetings();
  if (!confirm(`¿Eliminar "${meetings[idx]?.name}" de la semana tipo?`)) return;
  meetings.splice(idx, 1);
  _saveRecurringMeetings(meetings);
  showToast('🗑️ Reunión recurrente eliminada');
  openRecurringModal(); // Refresh
}

function addRecurringSelected() {
  const today=new Date(); today.setHours(0,0,0,0);
  const dow=today.getDay();
  const mon=new Date(today);
  if(dow===0){ mon.setDate(today.getDate()+1); } else { mon.setDate(today.getDate()-(dow-1)); }
  mon.setHours(0,0,0,0);
  let added=0;
  const meetings = _getRecurringMeetings();
  meetings.forEach((m,i)=>{
    const cb=document.getElementById('rm-cb-'+i);
    if(!cb||!cb.checked||cb.disabled) return;
    const d=new Date(mon); d.setDate(mon.getDate()+(m.day-1));
    const dateStr=localDateStr(d);
    if(events.some(e=>e.title===m.name && e.date===dateStr)) return;
    events.push({ id:Date.now()+added, title:m.name, date:dateStr, time:m.time, desc:m.desc });
    added++;
  });
  if(added>0) { saveEvents(); renderEvents(); applyAgendaView(); renderAgendaSidebar(); }
  closeRecurringModal();
  if(added>0) showToast(`✅ Se añadieron ${added} evento(s) a la semana.`);
  else showToast('No se añadieron eventos (ya existen o ninguno seleccionado).');
}

/* ═══════════════════════════════════════════════
   FEATURE 3 — ACTA COPY
═══════════════════════════════════════════════ */
function copyActa(id) {
  const ta=document.getElementById('acta-text-'+id); if(!ta) return;
  const btn=document.getElementById('copy-acta-btn-'+id);
  const updateBtn=()=>{
    if(btn){ const orig=btn.textContent; btn.textContent='¡Copiado! ✓'; setTimeout(()=>btn.textContent=orig,2000); }
  };
  navigator.clipboard.writeText(ta.value).then(updateBtn).catch(()=>{
    ta.select(); document.execCommand('copy'); updateBtn();
  });
}

/* ═══════════════════════════════════════════════
   FEATURE 4 — FOCUS MODE + POMODORO
═══════════════════════════════════════════════ */
let _pomState='idle', _pomWork=true, _pomSeconds=25*60, _pomInterval=null;

function enterFocusMode() {
  const overlay=document.getElementById('focus-overlay'); if(!overlay) return;
  overlay.classList.add('active');
  try { document.documentElement.requestFullscreen?.(); } catch(e){}
  renderFocusContent();
  pomodoroReset();
}
function exitFocusMode() {
  const overlay=document.getElementById('focus-overlay'); if(!overlay) return;
  overlay.classList.remove('active');
  pomodoroPause();
  try { document.exitFullscreen?.(); } catch(e){}
}
function renderFocusContent() {
  const todayStr=localDateStr();
  const nowTime=new Date().toTimeString().slice(0,5);
  const todayEvents=[...events.filter(e=>e.date===todayStr && (e.time||'00:00')>=nowTime),...reuniones.filter(r=>r.datetime&&r.datetime.slice(0,10)===todayStr && r.datetime.slice(11,16)>=nowTime)];
  todayEvents.sort((a,b)=>(a.time||a.datetime?.slice(11,16)||'00:00').localeCompare(b.time||b.datetime?.slice(11,16)||'00:00'));
  const nm=document.getElementById('focus-next-meeting');
  if(nm) {
    if(todayEvents.length) {
      const ev=todayEvents[0];
      const t=ev.time||ev.datetime?.slice(11,16)||'';
      nm.innerHTML=`<div class="focus-next-meeting"><div>${esc(ev.title||ev.name||'Reunión')}</div><div class="meta">${t?'🕐 '+t:''}${ev.attendees?' · '+esc(ev.attendees):''}</div></div>`;
    } else {
      nm.innerHTML=`<div class="focus-next-meeting" style="color:var(--text-secondary)">No hay más reuniones hoy 🎉</div>`;
    }
  }
  const focusTasks=tasks.filter(t=>!t.done && t.pri==='alta').slice(0,5);
  const ftl=document.getElementById('focus-tasks-list');
  if(ftl) {
    if(focusTasks.length) {
      ftl.innerHTML=focusTasks.map(t=>`<div class="focus-task-item">
        <input type="checkbox" class="focus-task-cb" ${t.done?'checked':''} onchange="toggleTask(${t.id});renderFocusContent()">
        <span style="${t.done?'text-decoration:line-through;color:var(--text-secondary)':''}">${esc(t.text)}</span>
      </div>`).join('');
    } else {
      ftl.innerHTML=`<div style="color:var(--text-secondary);font-size:14px">¡No hay tareas de alta prioridad pendientes! 🎉</div>`;
    }
  }
}
function pomodoroTick() {
  _pomSeconds--;
  updatePomodoroDisplay();
  if(_pomSeconds<=0) {
    pomodoroPause();
    pomodoroBeep();
    _pomWork=!_pomWork;
    _pomSeconds=_pomWork?25*60:5*60;
    updatePomodoroDisplay();
    document.getElementById('pomodoro-label').textContent=_pomWork?'🍅 Tiempo de trabajo':'☕ Descanso (5 min)';
  }
}
function updatePomodoroDisplay() {
  const m=Math.floor(_pomSeconds/60).toString().padStart(2,'0');
  const s=(_pomSeconds%60).toString().padStart(2,'0');
  const el=document.getElementById('pomodoro-display');
  if(el) el.textContent=`${m}:${s}`;
}
function pomodoroPlay() {
  if(_pomState==='running') return;
  _pomState='running';
  _pomInterval=setInterval(pomodoroTick,1000);
  const pl=document.getElementById('pomodoro-play');
  const pa=document.getElementById('pomodoro-pause');
  if(pl) pl.style.display='none'; if(pa) pa.style.display='';
}
function pomodoroPause() {
  _pomState='paused'; clearInterval(_pomInterval);
  const pl=document.getElementById('pomodoro-play');
  const pa=document.getElementById('pomodoro-pause');
  if(pl) pl.style.display=''; if(pa) pa.style.display='none';
}
function pomodoroReset() {
  pomodoroPause(); _pomWork=true; _pomSeconds=25*60; updatePomodoroDisplay();
  const lbl=document.getElementById('pomodoro-label');
  if(lbl) lbl.textContent='🍅 Tiempo de trabajo';
}
function pomodoroBeep() {
  try {
    const ctx=new (window.AudioContext||window.webkitAudioContext)();
    const osc=ctx.createOscillator(); const gain=ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type='sine'; osc.frequency.value=880;
    gain.gain.setValueAtTime(0.3,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+1.5);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime+1.5);
  } catch(e){}
}

/* ═══════════════════════════════════════════════
   FEATURE 5 — BRIEFING
═══════════════════════════════════════════════ */
function showBriefingIfNeeded() {
  const todayStr=localDateStr();
  if(load(K.briefingDate,'')===todayStr) return;
  showBriefing();
}
function showBriefing() {
  const overlay=document.getElementById('briefing-overlay'); if(!overlay) return;
  const n=new Date();
  document.getElementById('briefing-greeting').textContent='Buenos días Diego 👋';
  const ds=`${DIAS[n.getDay()].charAt(0).toUpperCase()+DIAS[n.getDay()].slice(1)}, ${n.getDate()} de ${MESES[n.getMonth()]} de ${n.getFullYear()}`;
  document.getElementById('briefing-date').textContent=ds;

  const todayStr=localDateStr(n);

  // Today's meetings from the reuniones array
  const todayReuniones=reuniones.filter(r=>r.datetime && r.datetime.slice(0,10)===todayStr)
    .sort((a,b)=>(a.datetime||'').localeCompare(b.datetime||''));
  const firstMeeting=todayReuniones[0];

  // High-priority pending tasks
  const highPriTasks=tasks.filter(t=>t.pri==='alta' && !t.done);

  // KPI context — compare ventas vs goal
  const kpis=load(K.kpis,{});
  const ventas=num(kpis.ventas);
  const objVentas=num(kpis.objVentas);

  let html='';

  // Reuniones section
  html+=`<div class="briefing-section"><div class="briefing-section-title">📅 Reuniones de hoy</div>`;
  if(todayReuniones.length){
    const firstTime=firstMeeting.datetime?new Date(firstMeeting.datetime).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}):'—';
    html+=`<div class="briefing-item"><span style="flex:1">Tienes <strong>${todayReuniones.length}</strong> reunión${todayReuniones.length!==1?'es':''} hoy. La primera: <strong>${esc(firstMeeting.title)}</strong> a las ${firstTime}.</span></div>`;
    if(todayReuniones.length>1){
      html+=todayReuniones.slice(1).map(r=>{
        const t=r.datetime?new Date(r.datetime).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}):'—';
        return `<div class="briefing-item"><span>${t}</span><span style="flex:1">${esc(r.title)}</span></div>`;
      }).join('');
    }
  } else {
    html+=`<div class="briefing-empty">Sin reuniones programadas hoy.</div>`;
  }
  html+='</div>';

  // High-priority tasks section
  html+=`<div class="briefing-section"><div class="briefing-section-title">🔴 Tareas de Alta prioridad</div>`;
  if(highPriTasks.length){
    html+=`<div class="briefing-item"><span style="flex:1">Tienes <strong>${highPriTasks.length}</strong> tarea${highPriTasks.length!==1?'s':''} de Alta prioridad pendiente${highPriTasks.length!==1?'s':''}.</span></div>`;
    html+=highPriTasks.slice(0,3).map(t=>`<div class="briefing-item"><span class="priority-badge alta" style="font-size:10px;padding:2px 6px">ALTA</span><span style="flex:1">${esc(t.text)}</span></div>`).join('');
    if(highPriTasks.length>3) html+=`<div class="briefing-empty">…y ${highPriTasks.length-3} más.</div>`;
  } else {
    html+=`<div class="briefing-empty">Sin tareas de Alta prioridad pendientes. ✅</div>`;
  }
  html+='</div>';

  // KPI context section
  if(objVentas>0){
    const pct=Math.round(ventas/objVentas*100);
    let kpiMsg, kpiIcon;
    if(pct>=100){ kpiIcon='🟢'; kpiMsg=`Por encima del objetivo semanal de ventas (${pct}%).`; }
    else if(pct>=90){ kpiIcon='🟡'; kpiMsg=`En camino al objetivo semanal de ventas (${pct}%).`; }
    else { kpiIcon='🔴'; kpiMsg=`Por debajo del objetivo semanal de ventas (${pct}%).`; }
    html+=`<div class="briefing-section"><div class="briefing-section-title">📊 KPIs de la semana</div>`;
    html+=`<div class="briefing-item"><span>${kpiIcon}</span><span style="flex:1">${kpiMsg}</span></div>`;
    html+='</div>';
  }

  // V3 — Random Wow Moment
  const wowAll = load(K.wowMoments, []);
  if (wowAll.length) {
    const w = wowAll[Math.floor(Math.random() * wowAll.length)];
    const cat = (typeof WOW_CATEGORIES !== 'undefined' && WOW_CATEGORIES[w.category]) || { emoji: '⭐', label: 'Wow Moment' };
    html += `<div class="briefing-section"><div class="briefing-section-title">⭐ Wow Moment del día</div>`;
    html += `<div class="briefing-item" style="flex-direction:column;align-items:flex-start;gap:4px">
      <div style="font-weight:600;font-size:14px">${cat.emoji} ${esc(w.title)}</div>
      <div style="font-size:13px;color:var(--text-secondary);font-style:italic">"${esc(w.story.slice(0,160))}${w.story.length>160?'…':''}"</div>
    </div></div>`;
  }

  // ── Sección: Equipo hoy ──
  const briefingYear = n.getFullYear();
  const briefingAbsences = _briefingGetTeamAbsencesToday(briefingYear, n);
  html += `<div class="briefing-section"><div class="briefing-section-title">👥 Equipo hoy</div>`;
  if (briefingAbsences.length) {
    briefingAbsences.forEach(a => {
      html += `<div class="briefing-item"><span style="flex:1"><strong>${esc(a.name)}</strong> — <span style="color:var(--warning)">${esc(a.code)}</span></span></div>`;
    });
  } else {
    html += `<div class="briefing-empty">✅ Todo el equipo disponible</div>`;
  }
  html += '</div>';

  // ── Sección: Eventos del día ──
  const todayEvents = [...events]
    .filter(ev => ev.date === todayStr)
    .sort((a,b) => (a.time||'00:00').localeCompare(b.time||'00:00'));
  html += `<div class="briefing-section"><div class="briefing-section-title">📅 Eventos del día</div>`;
  if (todayEvents.length) {
    todayEvents.forEach(ev => {
      const t = ev.time || 'Todo el día';
      html += `<div class="briefing-item"><span style="min-width:70px;font-weight:600">${esc(t)}</span><span style="flex:1">${esc(ev.title)}</span></div>`;
    });
  } else {
    html += `<div class="briefing-empty">📅 Sin eventos programados</div>`;
  }
  html += '</div>';

  // ── Sección: Métricas clave (NPS) ──
  const npsData = load(K.kpis, {});
  const npsFields = [
    { label: '🛍️ NPS Shopping', val: npsData.npsShop },
    { label: '🎧 NPS Support',  val: npsData.npsSupport },
    { label: '🔧 NPS APU',      val: npsData.npsApu },
    { label: '🎓 NPS T@A',      val: npsData.npsTaa },
  ].filter(f => f.val !== undefined && f.val !== '');
  if (npsFields.length) {
    html += `<div class="briefing-section"><div class="briefing-section-title">📊 Métricas clave</div>`;
    npsFields.forEach(f => {
      html += `<div class="briefing-item"><span style="flex:1">${f.label}</span><span style="font-weight:700">${esc(String(f.val))}</span></div>`;
    });
    html += '</div>';
  }

  document.getElementById('briefing-content').innerHTML=html;
  overlay.classList.add('active');
}

// Helper: get team absences for today from vacation data
function _briefingGetTeamAbsencesToday(year, today) {
  try { _getWeeksForYear(year); } catch(e) { return []; }
  const weeks = _getWeeksForYear(year);
  const todayMs = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  let weekIdx = -1;
  for (let i = 0; i < weeks.length; i++) {
    const parts = weeks[i].split(' ');
    const day = parseInt(parts[0]);
    const month = LS_MONTH_MAP[parts[1]];
    if (month === undefined) continue;
    let wYear = year;
    if (month <= 1 && i > LS_WEEK_YEAR_WRAP_IDX) wYear = year + 1;
    const wMs = new Date(wYear, month, day).getTime();
    const nextWMs = wMs + 7 * 86400000;
    if (todayMs >= wMs && todayMs < nextWMs) { weekIdx = i; break; }
  }
  if (weekIdx < 0) return [];
  const people = (typeof getVacPeopleForYear === 'function') ? getVacPeopleForYear(year) : [];
  return people
    .filter(p => p.data && p.data[weekIdx] && p.data[weekIdx].trim() !== '')
    .map(p => ({ name: p.name, code: p.data[weekIdx].trim() }));
}

function closeBriefing() {
  document.getElementById('briefing-overlay').classList.remove('active');
  const today = new Date().toISOString().slice(0,10);
  save(K.briefingDate, today);
  // Maintain a dates-history array for accurate streak calculation in index.html
  try {
    const dates = load(K.briefingDates, []);
    if (!dates.includes(today)) {
      dates.unshift(today);
      // Keep only last 90 days to avoid unbounded growth
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      const cutoffStr = cutoff.toISOString().slice(0,10);
      save(K.briefingDates, dates.filter(d => d >= cutoffStr));
    }
  } catch(_) {}
}

/* ═══════════════════════════════════════════════
   FEATURE 7 — QUOTES WIDGET
═══════════════════════════════════════════════ */
function renderQuoteWidget() {
  const customQuotes=load(K.customQuotes,[]);
  const allQuotes=[...DEFAULT_QUOTES,...customQuotes];
  const idx=Math.floor(new Date().getDate() % allQuotes.length);
  const q=allQuotes[idx]||DEFAULT_QUOTES[0];
  const el=document.getElementById('quote-text');
  const au=document.getElementById('quote-author');
  if(el) el.textContent=q.text;
  if(au) au.textContent='— '+q.author;
}
function toggleQuoteForm() {
  document.getElementById('quote-add-form').classList.toggle('open');
}
function addCustomQuote() {
  const t=document.getElementById('quote-new-text')?.value.trim();
  const a=document.getElementById('quote-new-author')?.value.trim()||'Anónimo';
  if(!t) return;
  const custom=load(K.customQuotes,[]); custom.push({text:t,author:a}); save(K.customQuotes,custom);
  document.getElementById('quote-new-text').value=''; document.getElementById('quote-new-author').value='';
  renderQuoteWidget(); toggleQuoteForm();
}

/* ═══════════════════════════════════════════════
   I1 — RESUMEN SEMANAL AUTO-GENERADO
═══════════════════════════════════════════════ */
function generateWeeklySummary() {
  const kpis    = load(K.kpis, {});
  const taskAll = load(K.tasks, []);
  const recogs  = load(K.reconocimientos, []);
  const verbs   = load(K_VC || 'apg_verbatims', []);
  const pulses  = load(K.pulse, []);
  const fm      = load(K.focusMetric, {});
  const streaks = getKPIStreaks();
  const wowAll  = load(K.wowMoments, []);

  const today = new Date();
  const dow   = today.getDay();
  const mon   = new Date(today); mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  const monStr = mon.toISOString().slice(0,10);

  const pN = s => parseFloat(String(s||'').replace(/[^0-9.,]/g,'').replace(',','.')) || 0;
  const fmtPct = (v,o) => o > 0 ? `${Math.round(v/o*100)}%` : '—';
  const arrow   = (v,o) => o > 0 ? (v >= o ? '▲' : '▼') : '';

  const ventas   = pN(kpis.ventas);   const objV = pN(kpis.objVentas);
  const nps      = pN(kpis.nps);      const objN = pN(kpis.objNps);
  const dta      = pN(kpis.dta);      const objD = pN(kpis.objDta);
  const conv     = pN(kpis.conv);     const objC = pN(kpis.objConv);

  const done  = taskAll.filter(t => t.done).length;
  const pend  = taskAll.filter(t => !t.done).length;
  const alta  = taskAll.filter(t => !t.done && t.pri === 'alta').length;

  const weekRecogs = recogs.filter(r => r.date >= monStr);

  const negVerbs = verbs.filter(v => v.type === 'negativo');
  const rootCounts = {};
  negVerbs.forEach(v => { if(v.rootCause) rootCounts[v.rootCause] = (rootCounts[v.rootCause]||0)+1; });
  const topRoot = Object.entries(rootCounts).sort((a,b) => b[1]-a[1])[0];

  const lastPulse = pulses.slice().sort((a,b) => (b.weekStart||'').localeCompare(a.weekStart||''))[0];

  const METRIC_NAMES = { ventas:'💰 Ventas', nps:'⭐ NPS', dta:'⏰ DTA', conv:'🔄 Conversión', upt:'🛍️ UPT' };

  let text = `📋 RESUMEN SEMANAL — Semana del ${mon.toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'})}\n`;
  text += `${'═'.repeat(54)}\n\n`;

  text += `📊 KPIs DE LA SEMANA\n`;
  if(objV > 0) text += `  💰 Ventas:     ${kpis.ventas||'—'} / ${kpis.objVentas||'—'} ${arrow(ventas,objV)} ${fmtPct(ventas,objV)}\n`;
  if(objN > 0) text += `  ⭐ NPS:        ${kpis.nps||'—'} / ${kpis.objNps||'—'} ${arrow(nps,objN)} ${fmtPct(nps,objN)}\n`;
  if(objD > 0) text += `  ⏰ DTA:        ${kpis.dta||'—'} / ${kpis.objDta||'—'} ${arrow(dta,objD)} ${fmtPct(dta,objD)}\n`;
  if(objC > 0) text += `  🔄 Conversión: ${kpis.conv||'—'} / ${kpis.objConv||'—'} ${arrow(conv,objC)} ${fmtPct(conv,objC)}\n`;
  text += '\n';

  if(streaks.length) {
    text += `⚠️ ALERTAS ACTIVAS\n`;
    streaks.forEach(s => text += `  • ${s.name} — ${s.weeks} semana${s.weeks>1?'s':''} seguida${s.weeks>1?'s':''} por debajo del objetivo\n`);
    text += '\n';
  }

  if(fm.metric) {
    text += `🎯 FOCUS METRIC DE LA SEMANA\n`;
    text += `  Métrica: ${METRIC_NAMES[fm.metric]||fm.metric}\n`;
    if(fm.hypothesis) text += `  Hipótesis: ${fm.hypothesis}\n`;
    if(fm.reflection) text += `  Reflexión: ${fm.reflection}\n`;
    text += '\n';
  }

  text += `✅ TAREAS\n`;
  text += `  ${done} completadas · ${pend} pendientes · ${alta} de alta prioridad\n\n`;

  if(weekRecogs.length) {
    text += `🏆 RECONOCIMIENTOS ESTA SEMANA (${weekRecogs.length})\n`;
    weekRecogs.slice(0,5).forEach(r => {
      const name = getMemberName ? getMemberName(r.personId) : r.personId;
      text += `  • ${name} — ${r.desc ? r.desc.slice(0,60) : '—'}\n`;
    });
    if(weekRecogs.length > 5) text += `  … y ${weekRecogs.length-5} más\n`;
    text += '\n';
  }

  text += `🗣️ VOZ DEL CLIENTE\n`;
  text += `  ${verbs.length} feedback del cliente totales · ${negVerbs.length} de mejora\n`;
  if(topRoot) {
    const rc = (typeof VC_ROOT_CAUSES !== 'undefined' && VC_ROOT_CAUSES[topRoot[0]]) || { emoji:'', label: topRoot[0] };
    text += `  Top causa detractor: ${rc.emoji} ${rc.label} (${topRoot[1]} menciones)\n`;
  }
  text += `  ${wowAll.length} Wow Moment${wowAll.length!==1?'s':''} registrado${wowAll.length!==1?'s':''}\n\n`;

  if(lastPulse) {
    text += `🧠 PULSE CHECK DEL EQUIPO\n`;
    text += `  ⚡ Energía: ${lastPulse.energy}/5 · 🚀 Momentum: ${lastPulse.momentum}/5 · 🌤️ Clima: ${lastPulse.climate}/5\n`;
    if(lastPulse.tensions) text += `  Observaciones: ${lastPulse.tensions}\n`;
    text += '\n';
  }

  text += `Generado con Apple Passeig de Gràcia Dashboard · ${today.toLocaleDateString('es-ES')}`;

  const modal = document.getElementById('summary-modal-overlay');
  const textarea = document.getElementById('summary-modal-text');
  if (modal && textarea) {
    textarea.value = text;
    modal.classList.add('open');
    save(K.lastSummary, today.toISOString().slice(0,10));
  }
}

function closeSummaryModal() {
  document.getElementById('summary-modal-overlay')?.classList.remove('open');
}

function closeSummaryModalOnBg(e) {
  if (e.target === document.getElementById('summary-modal-overlay')) closeSummaryModal();
}

function copySummaryToClipboard() {
  const textarea = document.getElementById('summary-modal-text');
  if (!textarea) return;
  navigator.clipboard.writeText(textarea.value)
    .then(() => showToast('📋 Resumen copiado al portapapeles'))
    .catch(() => { textarea.select(); document.execCommand('copy'); showToast('📋 Copiado'); });
}

/* ═══════════════════════════════════════════════
   I2 — SUGERENCIAS DE TEMA DE 1:1
═══════════════════════════════════════════════ */
function getTBSuggestions(memberId) {
  const suggestions = [];
  const m = team.find(t => t.id === memberId) || equipoLiderazgo.find(e => e.id === memberId);
  const name = m ? (m.name || m.nombre) : 'esta persona';

  // 1. Last TB session date
  const tbs = load(K.tbs, {});
  const sessions = (tbs[memberId] || []).slice().sort((a,b) => new Date(b.date)-new Date(a.date));
  if (!sessions.length) {
    suggestions.push({ text: `Nunca has tenido un 1:1 registrado con ${name}`, color: 'var(--danger)', icon: '🚨' });
  } else {
    const lastDate = new Date(sessions[0].date);
    const daysSince = Math.floor((Date.now() - lastDate) / 86400000);
    if (daysSince > 14) {
      suggestions.push({ text: `Hace ${daysSince} días desde el último 1:1 con ${name}`, color: 'var(--warning)', icon: '⏰' });
    }
  }

  // 2. Recent recognitions (last 14 days)
  const recogs = load(K.reconocimientos, []);
  const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const twaStr = twoWeeksAgo.toISOString().slice(0,10);
  const recentRecogs = recogs.filter(r => r.personId === memberId && r.date >= twaStr);
  if (!recentRecogs.length) {
    suggestions.push({ text: `${name} no ha recibido reconocimiento en 2 semanas — celebra algo`, color: 'var(--accent)', icon: '🏆' });
  }

  // 3. Pulse Check: low energy/climate this week
  const pulses = load(K.pulse, []);
  const lastPulse = pulses.slice().sort((a,b) => (b.weekStart||'').localeCompare(a.weekStart||''))[0];
  if (lastPulse && (parseInt(lastPulse.energy) <= 2 || parseInt(lastPulse.climate) <= 2)) {
    suggestions.push({ text: `El equipo reporta baja energía/clima esta semana — pregúntale cómo está`, color: 'var(--warning)', icon: '🔋' });
  }

  // 4. Active PDI
  const pdis = load(K.pdis, {});
  const pdi = pdis[memberId];
  if (pdi && (pdi.strengths || pdi.weekGoal)) {
    suggestions.push({ text: `${name} tiene un PDI activo — haz seguimiento del objetivo de desarrollo`, color: 'var(--success)', icon: '📈' });
  }

  // 5. High-priority pending tasks (person mentioned in task text)
  const taskAll = load(K.tasks, []);
  const personName = (m ? (m.name || m.nombre) : '').split(' ')[0].toLowerCase();
  const criticalTasks = personName ? taskAll.filter(t => !t.done && t.pri === 'alta' && t.text.toLowerCase().includes(personName)) : [];
  if (criticalTasks.length) {
    suggestions.push({ text: `Tiene tareas críticas pendientes relacionadas — revísalas`, color: 'var(--danger)', icon: '🔴' });
  }

  return suggestions.slice(0, 3);
}

function renderTBSuggestions(memberId) {
  const suggestions = getTBSuggestions(memberId);
  const container = document.getElementById('tb-modal-suggestions');
  if (!container) return;
  if (!suggestions.length) {
    container.innerHTML = `<div style="font-size:12px;padding:8px 12px;background:rgba(52,199,89,0.1);border-radius:8px;color:var(--success);margin-bottom:12px">✅ Sin alertas — buen momento para una conversación de desarrollo</div>`;
    return;
  }
  container.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">` +
    suggestions.map(s => `<span style="display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border-radius:20px;font-size:12px;font-weight:500;background:${s.color}1a;color:${s.color};border:1px solid ${s.color}40">${s.icon} ${esc(s.text)}</span>`).join('') +
    `</div>`;
}

/* ═══════════════════════════════════════════════
   FEATURE 9 — MONTHLY CALENDAR VIEW
═══════════════════════════════════════════════ */
const MESES_FULL=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function shiftMonth(dir) {
  let off=load(K.agendaMonthOffset,0);
  if(dir===0) off=0; else off+=dir;
  save(K.agendaMonthOffset,off);
  renderMonthView();
}
function renderMonthView() {
  const grid=document.getElementById('month-grid'); if(!grid) return;
  const off=load(K.agendaMonthOffset,0);
  const today=new Date();
  const cur=new Date(today.getFullYear(),today.getMonth()+off,1);
  const year=cur.getFullYear(), month=cur.getMonth();
  const todayStr=localDateStr(today);
  const navTitle=document.getElementById('month-nav-title');
  if(navTitle) navTitle.textContent=`${MESES_FULL[month]} ${year}`;

  const first=new Date(year,month,1);
  // Convert JS Sunday-first (0) to Monday-first week layout
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
    const pills=dayEvs.slice(0,3).map(e=>`<div class="month-event-pill" title="${esc(e.title)}" onclick="event.stopPropagation();openEventModal(${e.id})">${esc(e.time?e.time+' ':'')}${esc(e.title)}</div>`).join('');
    const more=dayEvs.length>3?`<div class="month-more">+${dayEvs.length-3} más</div>`:'';
    cells.push(`<div class="month-day${isOther?' other-month':''}${isToday?' today-day':''}" ondblclick="monthDayClick('${dStr}')">
      <div class="month-day-num">${d.getDate()}</div>
      ${pills}${more}
    </div>`);
    if(i>27 && d.getMonth()!==month && d.getDay()===0) { break; }
  }

  grid.innerHTML=headers+cells.join('');
}
function monthDayClick(dateStr) {
  const dtInput=document.getElementById('ev-date');
  if(dtInput) dtInput.value=dateStr;
  const form=document.getElementById('add-event-form');
  if(form && !form.classList.contains('open')) form.classList.add('open');
  form?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  document.getElementById('ev-title')?.focus();
}

/* ═══════════════════════════════════════════════
   FEATURE 10 — KANBAN
═══════════════════════════════════════════════ */
const KANBAN_COLS=[
  { id:'volando',     label:'🚀 Volando',           desc:'Por encima de expectativas' },
  { id:'seguimiento', label:'🔄 Seguimiento activo', desc:'Necesitan coaching' },
  { id:'desarrollo',  label:'📈 Plan de desarrollo', desc:'Mejora estructurada' },
];
const AVATAR_COLORS=['#0071e3','#34c759','#ff9f0a','#af52de','#ff3b30','#5ac8fa','#ff6b35','#4ecdc4'];

function renderKanban() {
  const board=document.getElementById('kanban-board'); if(!board) return;
  const kb=load(K.kanban,{});
  const kbNotes=load('apg_kanban_notes',{});

  board.innerHTML=KANBAN_COLS.map(col=>{
    const members=team.filter(m=>kb[m.id]===col.id);
    const chips=members.map(m=>{
      const initials=(m.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
      const color=AVATAR_COLORS[m.id%AVATAR_COLORS.length];
      return `<div class="kanban-chip" draggable="true" ondragstart="kanbanDragStart(event,${m.id})" id="kchip-${m.id}">
        <div class="kanban-avatar" style="background:${color}">${esc(initials)}</div>
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
function kanbanDragStart(e, memberId) {
  e.dataTransfer.setData('text/plain', String(memberId));
  e.dataTransfer.effectAllowed='move';
}
function kanbanDragOver(e) {
  e.preventDefault(); e.currentTarget.classList.add('drag-over');
}
function kanbanDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }
function kanbanDrop(e, colId) {
  e.preventDefault(); e.currentTarget.classList.remove('drag-over');
  const memberId=parseInt(e.dataTransfer.getData('text/plain'));
  if(!memberId) return;
  const kb=load(K.kanban,{}); kb[memberId]=colId; save(K.kanban,kb);
  renderKanban();
}
function kanbanRemove(memberId) {
  const kb=load(K.kanban,{}); delete kb[memberId]; save(K.kanban,kb);
  renderKanban();
}
function kanbanAdd(sel, colId) {
  const memberId=parseInt(sel.value); if(!memberId) return;
  const kb=load(K.kanban,{}); kb[memberId]=colId; save(K.kanban,kb);
  renderKanban();
}
function kanbanSaveNote(colId, val) {
  const notes=load('apg_kanban_notes',{}); notes[colId]=val; save('apg_kanban_notes',notes);
}

/* ═══════════════════════════════════════════════
   FEATURE 12 — NOTIFICATIONS
═══════════════════════════════════════════════ */
function getAlerts() {
  const alerts=[];
  const todayStr=localDateStr();

  const overdue=tasks.filter(t=>!t.done && t.date && t.date<todayStr);
  if(overdue.length) alerts.push({ icon:'⚠️', text:`${overdue.length} tarea(s) vencida(s)`, tab:'tareas' });

  const tbs=load(K.tbs,{});
  Object.entries(tbs).forEach(([mid,sessions])=>{
    const pending=sessions.filter(s=>s.followUp && !s.followUpDone);
    if(pending.length){
      const member=team.find(m=>m.id===parseInt(mid));
      alerts.push({ icon:'⏳', text:`Seguimiento pendiente con ${member?member.name:'un miembro'}`, tab:'equipo' });
    }
  });

  const now=Date.now();
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

  const kpisData=load(K.kpis,{});
  const ventas=num(kpisData.ventas||'0');
  const objV=num(kpisData.objVentas||'0');
  if(objV>0 && ventas/objV<0.7) alerts.push({ icon:'📉', text:`Ventas al ${Math.round(ventas/objV*100)}% del objetivo`, tab:'kpis' });

  return alerts;
}
function updateNotifBadge() {
  const alerts=getAlerts();
  const badge=document.getElementById('notif-badge');
  if(badge){
    if(alerts.length>0){ badge.style.display='flex'; badge.textContent=alerts.length; } else { badge.style.display='none'; }
  }
}
function toggleNotifications() {
  const panel=document.getElementById('notif-panel'); if(!panel) return;
  const isOpen=panel.classList.toggle('open');
  if(isOpen) renderNotifications();
}
function renderNotifications() {
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

/* ═══════════════════════════════════════════════
   PR3 — FEATURE 2: PULSE CHECK SEMANAL
   Clave localStorage: apg_pulse
   Estructura: [{id, weekStart:'YYYY-MM-DD', energy:1-5, momentum:1-5, climate:1-5, tensions:'', createdAt}]
═══════════════════════════════════════════════ */

/** Returns the ISO date (YYYY-MM-DD) of the Monday of the given date's week. */
function getWeekStartISO(date) {
  const d = new Date(date);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow + 6) % 7); // normalize: Mon=0 offset, Sun=6 offset
  return d.toISOString().slice(0, 10);
}

// ── PULSE CHECK ─────────────────────────────────────────────────
function loadPulseChecks() {
  return load(K.pulse, []);
}

function savePulseCheck() {
  const weekStart = getWeekStartISO(new Date());
  const energy   = parseInt(document.getElementById('pulse-energy')?.value   || 3);
  const momentum = parseInt(document.getElementById('pulse-momentum')?.value || 3);
  const climate  = parseInt(document.getElementById('pulse-climate')?.value  || 3);
  const tensions = document.getElementById('pulse-tensions')?.value.trim() || '';

  let checks = loadPulseChecks();
  const existing = checks.findIndex(c => c.weekStart === weekStart);
  const entry = { id: weekStart, weekStart, energy, momentum, climate, tensions, createdAt: Date.now() };
  if (existing >= 0) checks[existing] = entry;
  else checks.push(entry);
  save(K.pulse, checks);

  const flash = document.getElementById('pulse-saved');
  if (flash) { flash.style.opacity = 1; setTimeout(() => { flash.style.opacity = 0; }, 2000); }
  renderPulseChart();
}

function initPulse() {
  const weekStart = getWeekStartISO(new Date());
  const label = document.getElementById('pulse-week-label');
  if (label) {
    const d = new Date(weekStart + 'T12:00:00');
    label.textContent = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  const checks = loadPulseChecks();
  const thisWeek = checks.find(c => c.weekStart === weekStart);
  if (thisWeek) {
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setVal('pulse-energy',   thisWeek.energy);
    setVal('pulse-momentum', thisWeek.momentum);
    setVal('pulse-climate',  thisWeek.climate);
    const t = document.getElementById('pulse-tensions');
    if (t) t.value = thisWeek.tensions || '';
  }
  renderPulseChart();
}

function renderPulseChart() {
  const wrap = document.getElementById('pulse-chart-wrap');
  if (!wrap) return;
  const checks = loadPulseChecks().slice(-8); // últimas 8 semanas
  if (!checks.length) { wrap.innerHTML = ''; return; }

  const barWidth = 24;
  const gap = 10;
  const maxH = 60;
  const metrics = ['energy', 'momentum', 'climate'];
  const colors  = { energy: 'var(--accent)', momentum: '#ff9f0a', climate: '#30d158' };
  const labels  = { energy: 'Energía', momentum: 'Momentum', climate: 'Clima' };

  const bars = checks.map(c => {
    const weekLabel = new Date(c.weekStart + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    return `<div style="display:inline-flex;flex-direction:column;align-items:center;gap:2px;margin-right:${gap}px">
      <div style="display:flex;align-items:flex-end;gap:2px;height:${maxH}px">
        ${metrics.map(m => {
          const h = Math.round((c[m] / 5) * maxH);
          return `<div title="${labels[m]}: ${c[m]}" style="width:${barWidth}px;height:${h}px;background:${colors[m]};border-radius:3px 3px 0 0;opacity:0.85"></div>`;
        }).join('')}
      </div>
      <div style="font-size:10px;color:var(--text-secondary);white-space:nowrap">${weekLabel}</div>
    </div>`;
  }).join('');

  wrap.innerHTML = `
    <div style="margin-top:14px">
      <div style="display:flex;gap:12px;margin-bottom:8px;flex-wrap:wrap">
        ${metrics.map(m => `<span style="font-size:11px;color:var(--text-secondary)"><span style="display:inline-block;width:10px;height:10px;background:${colors[m]};border-radius:2px;margin-right:4px"></span>${labels[m]}</span>`).join('')}
      </div>
      <div style="display:flex;align-items:flex-end;overflow-x:auto;padding-bottom:4px">${bars}</div>
    </div>`;
}

/* ═══════════════════════════════════════════════
   PR3 — FEATURE 3: MODO LANZAMIENTO
   Clave localStorage: apg_launch
   Estructura: {enabled, title, launchDateTime, checklist:[{id,text,done}], dayKpis:{units,nps,incidents}, postReview:{wentWell,improve,notes}, updatedAt}
═══════════════════════════════════════════════ */
let _launchCountdownInterval = null;

function openLaunchModal() {
  const overlay = document.getElementById('launch-modal-overlay');
  if (overlay) overlay.classList.add('open');
  renderLaunchModal();
  startLaunchCountdown();
}

function closeLaunchModal() {
  const overlay = document.getElementById('launch-modal-overlay');
  if (overlay) overlay.classList.remove('open');
  stopLaunchCountdown();
}

function renderLaunchModal() {
  const d = load(K.launch, {});
  const set = (id, val) => { const e = document.getElementById(id); if (e) e.value = val ?? ''; };
  const setChecked = (id, val) => { const e = document.getElementById(id); if (e) e.checked = !!val; };
  setChecked('launch-enabled', d.enabled || false);
  set('launch-title',          d.title || '');
  set('launch-datetime',       d.launchDateTime || '');
  set('launch-kpi-units',      (d.dayKpis || {}).units || '');
  set('launch-kpi-nps',        (d.dayKpis || {}).nps   || '');
  set('launch-kpi-incidents',  (d.dayKpis || {}).incidents || '');
  set('launch-review-well',    (d.postReview || {}).wentWell || '');
  set('launch-review-improve', (d.postReview || {}).improve  || '');
  set('launch-review-notes',   (d.postReview || {}).notes    || '');
  renderLaunchChecklist(d.checklist || []);
  updateLaunchCountdownDisplay();
}

function saveLaunch() {
  const d = load(K.launch, {});
  save(K.launch, {
    enabled:        document.getElementById('launch-enabled')?.checked || false,
    title:          document.getElementById('launch-title')?.value.trim() || '',
    launchDateTime: document.getElementById('launch-datetime')?.value || '',
    checklist:      d.checklist || [],
    dayKpis: {
      units:     parseInt(document.getElementById('launch-kpi-units')?.value     || 0),
      nps:       parseInt(document.getElementById('launch-kpi-nps')?.value       || 0),
      incidents: parseInt(document.getElementById('launch-kpi-incidents')?.value || 0),
    },
    postReview: {
      wentWell: document.getElementById('launch-review-well')?.value.trim()    || '',
      improve:  document.getElementById('launch-review-improve')?.value.trim() || '',
      notes:    document.getElementById('launch-review-notes')?.value.trim()   || '',
    },
    updatedAt: new Date().toISOString(),
  });
  updateLaunchBadge();
  showToast('🚀 Lanzamiento guardado');
}

function addLaunchChecklist() {
  const inp = document.getElementById('launch-check-new');
  const text = inp?.value.trim();
  if (!text) return;
  const d = load(K.launch, {});
  const checklist = d.checklist || [];
  checklist.push({ id: Date.now(), text, done: false });
  d.checklist = checklist;
  save(K.launch, d);
  inp.value = '';
  renderLaunchChecklist(checklist);
}

function toggleLaunchChecklistItem(id) {
  const d = load(K.launch, {});
  const item = (d.checklist || []).find(c => c.id === id);
  if (item) { item.done = !item.done; save(K.launch, d); renderLaunchChecklist(d.checklist); }
}

function removeLaunchChecklistItem(id) {
  const d = load(K.launch, {});
  d.checklist = (d.checklist || []).filter(c => c.id !== id);
  save(K.launch, d);
  renderLaunchChecklist(d.checklist);
}

function renderLaunchChecklist(items) {
  const wrap = document.getElementById('launch-checklist');
  if (!wrap) return;
  if (!items || !items.length) {
    wrap.innerHTML = '<div style="font-size:13px;color:var(--text-secondary);padding:6px 0">Sin ítems. Añade los pasos pre-lanzamiento.</div>';
    return;
  }
  const done = items.filter(c => c.done).length;
  const pct  = Math.round(done / items.length * 100);
  let html = `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">${done}/${items.length} completados (${pct}%)</div>`;
  html += items.map(c => `<div class="launch-check-item${c.done?' done':''}">
    <input type="checkbox" ${c.done?'checked':''} onchange="toggleLaunchChecklistItem(${c.id})">
    <span style="flex:1">${esc(c.text)}</span>
    <button class="launch-check-rm" onclick="removeLaunchChecklistItem(${c.id})" title="Eliminar">×</button>
  </div>`).join('');
  wrap.innerHTML = html;
}

function updateLaunchCountdownDisplay() {
  const d = load(K.launch, {});
  const wrap = document.getElementById('launch-countdown-wrap');
  const display = document.getElementById('launch-countdown');
  if (!wrap || !display) return;
  if (!d.launchDateTime) { wrap.style.display = 'none'; return; }
  const diff = new Date(d.launchDateTime) - Date.now();
  wrap.style.display = 'block';
  if (diff <= 0) { display.textContent = '🚀 ¡Lanzamiento en curso!'; return; }
  const totalSecs = Math.floor(diff / 1000);
  const days = Math.floor(totalSecs / 86400);
  const h = Math.floor((totalSecs % 86400) / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  const pad = n => String(n).padStart(2, '0');
  display.textContent = days > 0 ? `${days}d ${pad(h)}h ${pad(m)}m ${pad(s)}s` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function startLaunchCountdown() {
  stopLaunchCountdown();
  _launchCountdownInterval = setInterval(updateLaunchCountdownDisplay, 1000);
  updateLaunchCountdownDisplay();
}

function stopLaunchCountdown() {
  if (_launchCountdownInterval) { clearInterval(_launchCountdownInterval); _launchCountdownInterval = null; }
}

function updateLaunchBadge() {
  const badge = document.getElementById('launch-badge');
  if (!badge) return;
  const d = load(K.launch, {});
  if (!d.enabled || !d.launchDateTime) { badge.style.display = 'none'; return; }
  const diff = new Date(d.launchDateTime) - Date.now();
  const MS_48H = 48 * 3600 * 1000; // 48 hours in milliseconds — threshold for showing the urgent badge
  badge.style.display = (diff > 0 && diff < MS_48H) ? 'inline' : 'none';
}

/* ═══════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════ */

/* ── Feature 8: Accent Color Themes ── */
const ACCENT_THEMES = {
  blue:   { accent:'#0071e3', dark:'#0064cc' },
  green:  { accent:'#28a745', dark:'#1e7e34' },
  purple: { accent:'#6f42c1', dark:'#5a32a0' },
  coral:  { accent:'#e8533a', dark:'#c9422b' },
};
function setAccentTheme(name) {
  const t=ACCENT_THEMES[name]||ACCENT_THEMES.blue;
  document.documentElement.style.setProperty('--accent', t.accent);
  document.documentElement.style.setProperty('--accent-dark', t.dark);
  save('apg_accent_theme', name);
  document.querySelectorAll('.accent-dot').forEach(b=>{
    b.classList.toggle('active', b.dataset.theme===name);
  });
}
(function initAccentTheme(){
  const saved=localStorage.getItem('apg_accent_theme');
  if(saved && ACCENT_THEMES[saved]) setAccentTheme(saved);
})();

function closeSnapshotBanner() {
  const b=document.getElementById('snapshot-banner'); if(b) b.style.display='none';
  const c=document.getElementById('snapshot-card'); if(c) c.style.display='none';
  history.replaceState(null,'',window.location.pathname);
}
(function detectSnapshotHash(){
  const hash=window.location.hash;
  if(!hash.startsWith('#snapshot=')) return;
  try {
    const b64=hash.slice('#snapshot='.length);
    const data=JSON.parse(decodeURIComponent(atob(b64).split('').map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')));
    const banner=document.getElementById('snapshot-banner');
    const dateEl=document.getElementById('snapshot-banner-date');
    if(banner){ banner.style.display='flex'; }
    if(dateEl) dateEl.textContent=data.date||'—';
    const card=document.getElementById('snapshot-card');
    const kpisDiv=document.getElementById('snapshot-kpis-content');
    if(card && kpisDiv) {
      card.style.display='block';
      const pct=(v,o)=>{ const vn=num(v),on=num(o); return on>0?Math.round(vn/on*100)+'%':'—'; };
      kpisDiv.innerHTML=`
        <div class="snapshot-kpi"><strong>💰 Ventas:</strong> ${esc(data.ventas||'—')} <span style="color:var(--text-secondary)">(${pct(data.ventas,data.objVentas)} del obj ${esc(data.objVentas||'—')})</span></div>
        <div class="snapshot-kpi"><strong>⭐ NPS:</strong> ${esc(data.nps||'—')} <span style="color:var(--text-secondary)">(${pct(data.nps,data.objNps)} del obj ${esc(data.objNps||'—')})</span></div>
        <div class="snapshot-kpi"><strong>⏱️ DTA:</strong> ${esc(data.dta||'—')} hrs <span style="color:var(--text-secondary)">(${pct(data.dta,data.objDta)} del obj ${esc(data.objDta||'—')})</span></div>`;
    }
  } catch(e) {}
})();

/* ── Feature 4b: Update reunion origin select ── */
function updateReunionOriginSelect() {
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

/* ── Feature 10 & 12: Task Trend Chart + Resolution Time ── */
function renderTaskTrendChart() {
  const wrap=document.getElementById('trend-chart-wrap');
  const stats=document.getElementById('trend-stats');
  if(!wrap) return;
  const today=new Date();
  const days=[];
  for(let i=6;i>=0;i--){
    const d=new Date(today);
    d.setDate(today.getDate()-i);
    days.push(d.toISOString().split('T')[0]);
  }
  const created=days.map(d=>tasks.filter(t=>t.createdDate===d).length);
  const completed=days.map(d=>tasks.filter(t=>t.done && t.completedDate===d).length);
  const maxVal=Math.max(...created,...completed,1);
  const W=400, H=120, PAD=8, BAR_W=20, GAP=4, GROUP_GAP=10;
  const totalW=(BAR_W*2+GAP+GROUP_GAP)*7-GROUP_GAP+PAD*2;
  const usableH=H-30;
  let bars='', labels='';
  days.forEach((d,i)=>{
    const x=PAD+(BAR_W*2+GAP+GROUP_GAP)*i;
    const bH1=Math.max(1,(created[i]/maxVal)*usableH);
    const bH2=Math.max(1,(completed[i]/maxVal)*usableH);
    bars+=`<rect x="${x}" y="${H-20-bH1}" width="${BAR_W}" height="${bH1}" fill="var(--accent)" rx="2" opacity="0.8"><title>${d}: ${created[i]} creadas</title></rect>`;
    bars+=`<rect x="${x+BAR_W+GAP}" y="${H-20-bH2}" width="${BAR_W}" height="${bH2}" fill="var(--success)" rx="2" opacity="0.8"><title>${d}: ${completed[i]} completadas</title></rect>`;
    const dd=new Date(d+'T12:00:00');
    labels+=`<text x="${x+BAR_W}" y="${H-4}" text-anchor="middle" font-size="10" fill="var(--text-secondary)">${String(dd.getDate()).padStart(2,'0')}/${String(dd.getMonth()+1).padStart(2,'0')}</text>`;
  });
  if(created.every(c=>c===0) && completed.every(c=>c===0)){
    wrap.innerHTML='<div style="font-size:13px;color:var(--text-secondary);padding:12px 0">Sin datos de actividad todavía</div>';
  } else {
    wrap.innerHTML=`<svg viewBox="0 0 ${totalW} ${H}" style="width:100%;height:auto">${bars}${labels}</svg>`;
  }
  // Resolution time stats
  const MS_PER_DAY=86400000;
  const last30=new Date(today.getTime()-30*MS_PER_DAY).toISOString().split('T')[0];
  const lastWeek=days[0]; // 7 days ago
  const prevWeekStart=new Date(today.getTime()-14*MS_PER_DAY).toISOString().split('T')[0];
  const closedLast30=tasks.filter(t=>t.done&&t.completedDate>=last30&&t.createdDate&&t.completedDate);
  const avgDays=closedLast30.length
    ? (closedLast30.reduce((s,t)=>s+(new Date(t.completedDate)-new Date(t.createdDate))/MS_PER_DAY,0)/closedLast30.length).toFixed(1)
    : null;
  const closedThisWeek=tasks.filter(t=>t.done&&t.completedDate>=lastWeek&&t.createdDate&&t.completedDate);
  const avgThis=closedThisWeek.length
    ? closedThisWeek.reduce((s,t)=>s+(new Date(t.completedDate)-new Date(t.createdDate))/MS_PER_DAY,0)/closedThisWeek.length
    : null;
  const closedPrevWeek=tasks.filter(t=>t.done&&t.completedDate>=prevWeekStart&&t.completedDate<lastWeek&&t.createdDate);
  const avgPrev=closedPrevWeek.length
    ? closedPrevWeek.reduce((s,t)=>s+(new Date(t.completedDate)-new Date(t.createdDate))/MS_PER_DAY,0)/closedPrevWeek.length
    : null;
  if(stats) {
    let html='';
    if(avgDays!==null) html+=`⏱️ Tiempo medio de cierre (30d): <strong>${avgDays} días</strong>`;
    if(avgThis!==null && avgPrev!==null){
      const diff=avgThis-avgPrev;
      const sign=diff>0?'▲ +':'▼ ';
      const color=diff>0?'var(--danger)':'var(--success)';
      html+=` &nbsp;<span style="color:${color}">${sign}${Math.abs(diff).toFixed(1)} días vs semana anterior</span>`;
    }
    stats.innerHTML=html;
  }
}

/* ── Feature 17: Auto Suggestions ── */
const AUTO_SUGGESTIONS = [
  { id:'prep-sm', trigger:n=>n.getDay()===5, taskText:'Preparar agenda Store Meeting del lunes', priority:'alta', daysAhead:3,
    condition:()=>!tasks.some(t=>!t.done&&t.text.toLowerCase().includes('store meeting')) },
  { id:'prep-ppo', trigger:n=>n.getDay()===1, taskText:'Preparar materiales PPO', priority:'media', daysAhead:1,
    condition:()=>!tasks.some(t=>!t.done&&t.text.toLowerCase().includes('ppo')) },
  { id:'kpi-snapshot', trigger:n=>n.getHours()>=18, taskText:'Guardar snapshot de KPIs del día', priority:'baja', daysAhead:0,
    condition:()=>{ const today=new Date().toISOString().split('T')[0]; return !load(K.kpiHistory,[]).some(s=>s.date===today); } },
  { id:'weekly-recog', trigger:n=>n.getDay()===4, taskText:'Revisar reconocimientos pendientes del equipo', priority:'media', daysAhead:0,
    condition:()=>!tasks.some(t=>!t.done&&t.text.toLowerCase().includes('reconocimiento')) },
];
function checkAutoSuggestions() {
  const banner=document.getElementById('suggestion-banner'); if(!banner) return;
  const now=new Date();
  const today=now.toISOString().split('T')[0];
  const dismissed=load('apg_dismissed_suggestions_'+today,[]);
  const active=AUTO_SUGGESTIONS.filter(s=>s.trigger(now)&&s.condition()&&!dismissed.includes(s.id));
  if(!active.length){ banner.style.display='none'; return; }
  banner.style.display='block';
  banner.className='suggestion-banner';
  banner.innerHTML=`<div class="suggestion-banner-title">💡 Sugerencias para hoy:</div>`+
    active.map(s=>`<div class="suggestion-item">
      <span class="suggestion-item-text">• ${esc(s.taskText)}</span>
      <button class="btn btn-ghost" style="font-size:11px;padding:3px 10px" data-sug-add="${esc(s.id)}">➕ Añadir</button>
      <button class="btn btn-ghost" style="font-size:11px;padding:3px 8px" data-sug-dismiss="${esc(s.id)}">✕</button>
    </div>`).join('');
  banner.querySelectorAll('[data-sug-add]').forEach(btn=>{
    btn.addEventListener('click',()=>addSuggestionTask(btn.dataset.sugAdd));
  });
  banner.querySelectorAll('[data-sug-dismiss]').forEach(btn=>{
    btn.addEventListener('click',()=>dismissSuggestion(btn.dataset.sugDismiss));
  });
}
function addSuggestionTask(id) {
  const sug=AUTO_SUGGESTIONS.find(s=>s.id===id); if(!sug) return;
  const today=new Date();
  const d=new Date(today.getTime()+sug.daysAhead*86400000).toISOString().split('T')[0];
  tasks.push({ id:Date.now(), text:sug.taskText, pri:sug.priority, date:d, done:false,
               createdDate:today.toISOString().split('T')[0], order:tasks.length });
  saveTasks(); renderTasks();
  dismissSuggestion(id);
}
function dismissSuggestion(id) {
  const today=new Date().toISOString().split('T')[0];
  const dismissed=load('apg_dismissed_suggestions_'+today,[]);
  if(!dismissed.includes(id)) dismissed.push(id);
  save('apg_dismissed_suggestions_'+today, dismissed);
  checkAutoSuggestions();
}

/* ── Feature 1: Weekly Prep Wizard ── */
const ROUTINE_STEPS=[
  {num:0,title:'Cierre de la semana pasada',sub:'Registra los resultados de la semana anterior antes de empezar la nueva'},
  {num:1,title:'Estado del equipo',sub:'Confirma quién está disponible esta semana (vacaciones/ausencias)'},
  {num:2,title:'Tareas de la semana',sub:'Repasa las tareas pendientes de esta semana'},
  {num:3,title:'Reuniones de la semana',sub:'Gestiona los eventos y reuniones de la semana'},
  {num:4,title:'Intención de la semana',sub:'¿Cuál es tu intención para esta semana?'},
];
const PREP_CHECKLIST_ITEMS = [
  { id:'prep-mail',       label:'📧 Leer mail' },
  { id:'prep-horarios',   label:'📋 Revisar horarios de leadership' },
  { id:'prep-slack',      label:'💬 Leer Slack' },
  { id:'prep-hello',      label:'👋 Leer Hello' },
  { id:'prep-calendario', label:'📅 Organizar calendario' },
  { id:'prep-ooo',        label:'🤝 Planificar One on One con los managers' }
];
function resetRoutine() {
  save(K.routineDate, null);
  save(K.routineStep, null);
  renderRoutine();
}
function renderRoutine() {
  const weekStart=getWeekStart(0).toISOString().split('T')[0];
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

// ─── Helpers para el cierre semanal ───────────────────────────────────────────

/** Devuelve el lunes de la semana anterior en formato YYYY-MM-DD */
function getPrevWeekStart() {
  const mon = getWeekStart(-1);
  return localDateStr(mon);
}

/** Formatea una fecha como "31 mar – 6 abr" (etiqueta semana anterior) */
function fmtPrevWeekLabel() {
  const prevMon = getWeekStart(-1);
  const prevSun = new Date(prevMon); prevSun.setDate(prevMon.getDate() + 6);
  const MESES_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const monStr = `${prevMon.getDate()} ${MESES_SHORT[prevMon.getMonth()]}`;
  const sunStr = `${prevSun.getDate()} ${MESES_SHORT[prevSun.getMonth()]}`;
  return `${monStr} – ${sunStr}`;
}

/**
 * Ejecuta el cierre de semana:
 * 1. Escribe los valores del formulario en los inputs de KPIs (si se pasan)
 * 2. Guarda snapshot en el histórico
 * 3. Guarda notas en apg_weekly_notes
 * 4. Copia valores actuales a los campos WoW
 * 5. Limpia los campos de valor actual y notas
 * 6. Registra la fecha de cierre en apg_last_week_closed
 */
function executeWeekClose(formValues) {
  // 1. Si se pasan valores del formulario, escribirlos en los inputs de KPIs
  if (formValues) {
    const fieldMap = {
      's0-ventas':   'kpi-ventas',
      's0-obj-ventas': 'kpi-obj-ventas',
      's0-nps':      'kpi-nps',
      's0-obj-nps':  'kpi-obj-nps',
      's0-conv':     'kpi-conv',
      's0-obj-conv': 'kpi-obj-conv',
      's0-trafico':  'kpi-trafico',
      's0-obj-trafico': 'kpi-obj-trafico',
      's0-dta':      'kpi-dta',
      's0-obj-dta':  'kpi-obj-dta',
    };
    for (const [formId, kpiId] of Object.entries(fieldMap)) {
      const val = formValues[formId];
      if (val !== undefined && val !== '') {
        const el = document.getElementById(kpiId);
        if (el) el.value = val;
      }
    }
    // Notas
    const notesEl = document.getElementById('kpi-notes');
    if (notesEl && formValues['s0-notes']) notesEl.value = formValues['s0-notes'];
  }

  // Guardar KPIs en localStorage antes de snapshot
  clearTimeout(_saveKPIsTimer);
  const kpisData = {
    ventas:    _g('kpi-ventas'),    objVentas: _g('kpi-obj-ventas'),
    nps:       _g('kpi-nps'),       objNps:    _g('kpi-obj-nps'),
    conv:      _g('kpi-conv'),      objConv:   _g('kpi-obj-conv'),
    upt:       _g('kpi-upt'),       objUpt:    _g('kpi-obj-upt'),
    acc:       _g('kpi-acc'),       ac:        _g('kpi-ac'),
    clicount:  _g('kpi-clicount'),  notes:     _g('kpi-notes'),
    yoyVentas: _g('kpi-yoy-ventas'), wowVentas: _g('kpi-wow-ventas'),
    yoyNps:    _g('kpi-yoy-nps'),    wowNps:    _g('kpi-wow-nps'),
    ventasBusiness:    _g('kpi-ventas-business'),    objVentasBusiness: _g('kpi-obj-ventas-business'),
    yoyVentasBusiness: _g('kpi-yoy-ventas-business'), wowVentasBusiness: _g('kpi-wow-ventas-business'),
    ventasApu:    _g('kpi-ventas-apu'),    objVentasApu: _g('kpi-obj-ventas-apu'),
    yoyVentasApu: _g('kpi-yoy-ventas-apu'), wowVentasApu: _g('kpi-wow-ventas-apu'),
    ventasSfs:    _g('kpi-ventas-sfs'),    objVentasSfs: _g('kpi-obj-ventas-sfs'),
    yoyVentasSfs: _g('kpi-yoy-ventas-sfs'), wowVentasSfs: _g('kpi-wow-ventas-sfs'),
    npsShop:    _g('kpi-nps-shopping'),    objNpsShop: _g('kpi-obj-nps-shopping'),
    yoyNpsShop: _g('kpi-yoy-nps-shopping'), wowNpsShop: _g('kpi-wow-nps-shopping'),
    npsApu:    _g('kpi-nps-apu'),    objNpsApu: _g('kpi-obj-nps-apu'),
    yoyNpsApu: _g('kpi-yoy-nps-apu'), wowNpsApu: _g('kpi-wow-nps-apu'),
    npsSupport:    _g('kpi-nps-support'),    objNpsSupport: _g('kpi-obj-nps-support'),
    yoyNpsSupport: _g('kpi-yoy-nps-support'), wowNpsSupport: _g('kpi-wow-nps-support'),
    npsTaa:    _g('kpi-nps-taa'),    objNpsTaa: _g('kpi-obj-nps-taa'),
    yoyNpsTaa: _g('kpi-yoy-nps-taa'), wowNpsTaa: _g('kpi-wow-nps-taa'),
    trafico:    _g('kpi-trafico'),    objTrafico: _g('kpi-obj-trafico'),
    yoyTrafico: _g('kpi-yoy-trafico'), wowTrafico: _g('kpi-wow-trafico'),
    yoyConv:    _g('kpi-yoy-conv'),   wowConv:    _g('kpi-wow-conv'),
    dta:        _g('kpi-dta'),        objDta:     _g('kpi-obj-dta'),
    intros1k:   _g('kpi-intros-1k'), objIntros1k: _g('kpi-obj-intros-1k'),
    timely:     _g('kpi-timely'),     objTimely:   _g('kpi-obj-timely'),
    cpUsage:    _g('kpi-cp-usage'),   objCpUsage:  _g('kpi-obj-cp-usage'),
    gbConv:     _g('kpi-gb-conv'),    objGbConv:   _g('kpi-obj-gb-conv'),
    introsSessions: _g('kpi-intros-sessions'), objIntrosSessions: _g('kpi-obj-intros-sessions'),
    iphoneTat:  _g('kpi-iphone-tat'), objIphoneTat: _g('kpi-obj-iphone-tat'),
  };
  save(K.kpis, kpisData);

  // 2. Snapshot en el histórico
  saveKPISnapshot();

  // 3. Archivar notas en apg_weekly_notes
  const prevWeekOf = getPrevWeekStart();
  const notes = _g('kpi-notes');
  const weeklyNotes = load('apg_weekly_notes', []);
  weeklyNotes.unshift({ weekOf: prevWeekOf, notes: notes, closedAt: new Date().toISOString() });
  // Conservar máx. 52 semanas
  if (weeklyNotes.length > 52) weeklyNotes.length = 52;
  save('apg_weekly_notes', weeklyNotes);

  // 4. Copiar valores actuales a los campos WoW (semana anterior para la nueva semana)
  const wowMap = [
    ['kpi-ventas',          'kpi-wow-ventas'],
    ['kpi-nps',             'kpi-wow-nps'],
    ['kpi-conv',            'kpi-wow-conv'],
    ['kpi-trafico',         'kpi-wow-trafico'],
    ['kpi-ventas-business', 'kpi-wow-ventas-business'],
    ['kpi-ventas-apu',      'kpi-wow-ventas-apu'],
    ['kpi-ventas-sfs',      'kpi-wow-ventas-sfs'],
    ['kpi-nps-shopping',    'kpi-wow-nps-shopping'],
    ['kpi-nps-apu',         'kpi-wow-nps-apu'],
    ['kpi-nps-support',     'kpi-wow-nps-support'],
    ['kpi-nps-taa',         'kpi-wow-nps-taa'],
  ];
  for (const [srcId, dstId] of wowMap) {
    const srcEl = document.getElementById(srcId);
    const dstEl = document.getElementById(dstId);
    if (srcEl && dstEl) dstEl.value = srcEl.value;
  }

  // 5. Limpiar campos de valor actual (NO objetivos, NO YoY, NO WoW)
  const clearIds = [
    'kpi-ventas','kpi-nps','kpi-conv','kpi-trafico',
    'kpi-ventas-business','kpi-ventas-apu','kpi-ventas-sfs',
    'kpi-nps-shopping','kpi-nps-apu','kpi-nps-support','kpi-nps-taa',
    'kpi-dta','kpi-upt','kpi-intros-1k','kpi-timely','kpi-cp-usage',
    'kpi-gb-conv','kpi-intros-sessions','kpi-iphone-tat',
  ];
  for (const id of clearIds) {
    const el = document.getElementById(id);
    if (el) el.value = '';
  }
  // Limpiar notas
  const notesEl2 = document.getElementById('kpi-notes');
  if (notesEl2) notesEl2.value = '';

  // Persistir el estado limpio
  saveKPIs();

  // 6. Registrar fecha de cierre
  save('apg_last_week_closed', getWeekStart(0).toISOString().split('T')[0]);

  showToast('✅ Semana cerrada y archivada correctamente');
}

/** Botón "🔒 Cerrar semana" en la pestaña KPIs — pide confirmación y ejecuta el cierre */
function confirmCloseWeek() {
  const prevWeekLabel = fmtPrevWeekLabel();
  const ok = confirm(`¿Archivar la semana del ${prevWeekLabel}?\n\nLos KPIs y notas se guardarán en el histórico y los campos se limpiarán para la nueva semana.`);
  if (!ok) return;
  // Ejecutar el cierre sin pasar formValues (los campos ya están rellenos en la UI)
  executeWeekClose(null);
  // Refrescar la vista de KPIs
  refreshProgressBars();
}
function renderRoutineStep(step, container, weekStart) {
  if(!container) container=document.getElementById('routine-content');
  if(!container) return;
  weekStart=weekStart||getWeekStart(0).toISOString().split('T')[0];
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
    // ── STEP 0: Cierre de la semana anterior ────────────────────────
    const prevWeekLabel = fmtPrevWeekLabel();
    const lastClosed = load('apg_last_week_closed', null);
    const currentWeekStart = getWeekStart(0).toISOString().split('T')[0];
    if (lastClosed === currentWeekStart) {
      // Semana ya cerrada
      content = `
        <div style="text-align:center;padding:24px 0">
          <div style="font-size:36px;margin-bottom:12px">✅</div>
          <div style="font-size:16px;font-weight:700;margin-bottom:8px">Ya cerraste la semana del ${prevWeekLabel}</div>
          <div style="font-size:13px;color:var(--text-secondary);margin-bottom:20px">Los KPIs y notas están archivados. ¡A por la nueva semana!</div>
          <button class="btn btn-primary" onclick="renderRoutineStep(2)">Continuar a Paso 1 →</button>
        </div>`;
    } else {
      // Formulario de cierre
      const kpisRaw = load(K.kpis, {});
      const fv = (field, def='') => kpisRaw[field] || def;
      content = `
        <div style="display:flex;flex-direction:column;gap:16px">
          <div style="font-size:13px;color:var(--text-secondary)">Registra los resultados de la semana del <strong>${prevWeekLabel}</strong> antes de empezar la nueva.</div>

          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">
            <div class="card" style="padding:12px">
              <div style="font-size:11px;font-weight:700;color:var(--text-secondary);margin-bottom:8px">💰 VENTAS TOTALES</div>
              <div style="display:flex;gap:8px;align-items:center">
                <input class="kpi-editable" id="s0-ventas" placeholder="Valor" value="${esc(fv('ventas'))}" style="flex:1">
                <span style="font-size:12px;color:var(--text-secondary)">Obj:</span>
                <input class="kpi-obj-input" id="s0-obj-ventas" placeholder="Obj" value="${esc(fv('objVentas'))}" style="width:80px">
              </div>
            </div>
            <div class="card" style="padding:12px">
              <div style="font-size:11px;font-weight:700;color:var(--text-secondary);margin-bottom:8px">⭐ NPS TIENDA</div>
              <div style="display:flex;gap:8px;align-items:center">
                <input class="kpi-editable" id="s0-nps" placeholder="Valor" value="${esc(fv('nps'))}" style="flex:1">
                <span style="font-size:12px;color:var(--text-secondary)">Obj:</span>
                <input class="kpi-obj-input" id="s0-obj-nps" placeholder="Obj" value="${esc(fv('objNps'))}" style="width:80px">
              </div>
            </div>
            <div class="card" style="padding:12px">
              <div style="font-size:11px;font-weight:700;color:var(--text-secondary);margin-bottom:8px">🔄 CONVERSIÓN</div>
              <div style="display:flex;gap:8px;align-items:center">
                <input class="kpi-editable" id="s0-conv" placeholder="Valor" value="${esc(fv('conv'))}" style="flex:1">
                <span style="font-size:12px;color:var(--text-secondary)">Obj:</span>
                <input class="kpi-obj-input" id="s0-obj-conv" placeholder="Obj" value="${esc(fv('objConv'))}" style="width:80px">
              </div>
            </div>
            <div class="card" style="padding:12px">
              <div style="font-size:11px;font-weight:700;color:var(--text-secondary);margin-bottom:8px">👣 TRÁFICO</div>
              <div style="display:flex;gap:8px;align-items:center">
                <input class="kpi-editable" id="s0-trafico" placeholder="Valor" value="${esc(fv('trafico'))}" style="flex:1">
                <span style="font-size:12px;color:var(--text-secondary)">Obj:</span>
                <input class="kpi-obj-input" id="s0-obj-trafico" placeholder="Obj" value="${esc(fv('objTrafico'))}" style="width:80px">
              </div>
            </div>
            <div class="card" style="padding:12px">
              <div style="font-size:11px;font-weight:700;color:var(--text-secondary);margin-bottom:8px">⏰ DTA HORAS</div>
              <div style="display:flex;gap:8px;align-items:center">
                <input class="kpi-editable" id="s0-dta" placeholder="Valor" value="${esc(fv('dta'))}" style="flex:1">
                <span style="font-size:12px;color:var(--text-secondary)">Obj:</span>
                <input class="kpi-obj-input" id="s0-obj-dta" placeholder="Obj" value="${esc(fv('objDta'))}" style="width:80px">
              </div>
            </div>
          </div>

          <div>
            <div style="font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">📝 ¿Cómo fue la semana? Contexto y análisis de resultados</div>
            <textarea class="notes-area" id="s0-notes" placeholder="Factores externos, iniciativas, puntos de mejora, highlights..." style="min-height:120px;width:100%">${esc(fv('notes'))}</textarea>
          </div>
        </div>`;
    }
  } else if(step===2) {
    // ── STEP 1: Estado del equipo ────────────────────────────────────
    const ausKey = 'apg_routine_ausencias_' + weekStart;
    const ausentes = load(ausKey, []);
    const leaders = typeof equipoLiderazgo !== 'undefined' ? equipoLiderazgo : [];
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
        <div style="width:36px;height:36px;border-radius:50%;background:${getColor(m)};display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;flex-shrink:0">${esc(initials(m.nombre))}</div>
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
  } else if(step===3) {
    // ── STEP 2: Tareas de la semana ─────────────────────────────────
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
      ? `<div style="display:flex;flex-direction:column;gap:6px">${weekTasks.map(t=>`<div class="task-item priority-${t.pri}"><input type="checkbox" class="task-checkbox" onchange="toggleTask(${t.id});renderRoutineStep(3)"><span class="task-text">${esc(t.text)}</span><span class="priority-badge ${t.pri}">${t.pri.toUpperCase()}</span></div>`).join('')}</div>`
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
  } else if(step===4) {
    // ── STEP 3: Reuniones de la semana ──────────────────────────────
    const weekEvts=events.filter(e=>e.date>=weekStart&&e.date<=weekEndStr).sort((a,b)=>(a.date+' '+(a.time||'')).localeCompare(b.date+' '+(b.time||'')));
    const weekReus=reuniones.filter(r=>{
      if(!r.datetime) return false;
      const d=r.datetime.split('T')[0];
      return d>=weekStart&&d<=weekEndStr;
    });
    const evtHtml=weekEvts.length
      ? weekEvts.map(e=>`<div style="padding:6px 10px;background:var(--surface2);border-radius:var(--radius-sm);font-size:13px;">${e.time?`<strong>${e.time}</strong> · `:''}${esc(e.title)}<span style="font-size:11px;color:var(--text-secondary);margin-left:6px">${fmtDate(e.date)}</span></div>`).join('')
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
              <select class="task-select" style="font-size:11px" onchange="updateReunion(${r.id},'status',this.value);renderRoutineStep(4)">
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
    if (typeof RECURRING_MEETINGS !== 'undefined') {
      const monDate = new Date(weekStart + 'T12:00:00');
      RECURRING_MEETINGS.forEach(m => {
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
  } else if(step===5) {
    // ── STEP 4: Intención de la semana ──────────────────────────────
    const saved=localStorage.getItem('apg_weekly_intention_'+weekStart)||'';
    content=`<textarea class="task-input" id="routine-intention" style="width:100%;min-height:120px;resize:vertical;font-size:15px" placeholder="¿Cuál es tu intención para esta semana?" oninput="localStorage.setItem('apg_weekly_intention_${weekStart}',this.value)">${esc(saved)}</textarea>`;
  }
  const s=ROUTINE_STEPS[step-1];
  const prevBtn=step>1?`<button class="btn btn-ghost" onclick="renderRoutineStep(${step-1})">← Anterior</button>`:'';
  const nextLabel=step===5?'🚀 Empezar la semana':'✓ '+(step===3?'Revisado':'Confirmado');

  // Step 1 (cierre): el botón principal es "Cerrar semana y continuar"
  let nextBtn='';
  if(step===1) {
    const lastClosed2 = load('apg_last_week_closed', null);
    const currentWeekStart2 = getWeekStart(0).toISOString().split('T')[0];
    if(lastClosed2 === currentWeekStart2) {
      nextBtn = `<button class="btn btn-primary" onclick="renderRoutineStep(2)">Continuar →</button>`;
    } else {
      nextBtn = `<button class="btn btn-primary" onclick="closeWeekFromRoutine()">✅ Cerrar semana y continuar →</button>`;
    }
  } else if(step===5) {
    nextBtn = `<button class="btn btn-primary" onclick="completeRoutine()">🚀 Empezar la semana</button>`;
  } else {
    nextBtn = `<button class="btn btn-primary" onclick="renderRoutineStep(${step+1})">${nextLabel}</button>`;
  }

  container.innerHTML=`
    <div class="page-title">📅 Weekly Prep</div>
    <div class="routine-progress">${progressDots}</div>
    <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">Paso ${step} de ${ROUTINE_STEPS.length}</div>
    <div class="routine-step-title">${s.title}</div>
    <div class="routine-step-sub">${s.sub}</div>
    ${step >= 2 ? '<div id="routine-context-kpi"></div>' : ''}
    <div class="routine-step-content">${content}</div>
    <div class="routine-actions">
      ${prevBtn}
      ${nextBtn}
    </div>`;
  if (step >= 2) try { renderRoutineContextCard(); } catch(e) {}
}

/** Recoge los valores del formulario de cierre (Step 0/1) y ejecuta el cierre */
function closeWeekFromRoutine() {
  const formValues = {};
  const ids = ['s0-ventas','s0-obj-ventas','s0-nps','s0-obj-nps','s0-conv','s0-obj-conv','s0-trafico','s0-obj-trafico','s0-dta','s0-obj-dta','s0-notes'];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) formValues[id] = el.value;
  }
  executeWeekClose(formValues);
  renderRoutineStep(2);
}
function changeTeamStatusFromRoutine(memberId, status) {
  const m=team.find(m=>m.id===memberId); if(!m) return;
  m.status=status; saveTeam();
}
function getVacWeekIndex(weekStart) {
  const d = new Date(weekStart + 'T12:00:00');
  const year = d.getFullYear();
  const refDate = _getRefMondayForYear(year);
  const weeks = _getWeeksForYear(year);
  const idx = Math.round((d - refDate) / (7 * 24 * 3600 * 1000));
  return (idx >= 0 && idx < weeks.length) ? idx : -1;
}
function isPersonOnVacation(nombre, weekStart) {
  const d = new Date(weekStart + 'T12:00:00');
  const year = d.getFullYear();
  const idx = getVacWeekIndex(weekStart);
  if (idx === -1) return false;
  const nameUpper = nombre.toUpperCase().trim();
  // Use getVacPeopleForYear so overrides from localStorage are respected
  const allVac = getVacPeopleForYear(year);
  const p = allVac.find(p => p.name.toUpperCase() === nameUpper || (p.originalName && p.originalName.toUpperCase() === nameUpper));
  if (!p) return false;
  const val = (p.data[idx] || '').trim().toUpperCase();
  return val === 'V' || val === 'LEAVE' || val.includes('PARENTAL') || val.includes('LACTANCIA') || val.includes('UNPAID');
}
function toggleRoutineAusente(memberId, weekStart) {
  const ausKey = 'apg_routine_ausencias_' + weekStart;
  const ausentes = load(ausKey, []);
  const idx = ausentes.indexOf(memberId);
  if (idx === -1) ausentes.push(memberId); else ausentes.splice(idx, 1);
  save(ausKey, ausentes);
  renderRoutineStep(2);
}
function addRoutineNewMeeting(weekStart) {
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
  saveReuniones();
  titleEl.value = '';
  renderRoutineStep(4);
}

function addRecurringMeetingToWeek(meetingName, meetingDate, meetingTime, meetingDesc, weekStart) {
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
  saveEvents();
  renderRoutineStep(4, null, weekStart);
}
function deleteRoutineReunion(id) {
  if (!confirm('¿Eliminar esta reunión?')) return;
  reuniones = reuniones.filter(r => r.id !== id);
  saveReuniones();
  renderRoutineStep(4);
}
function openEditRoutineReunion(id) {
  const formEl = document.getElementById('routine-edit-form-' + id);
  if (!formEl) return;
  formEl.style.display = formEl.style.display === 'none' ? 'flex' : 'none';
}
function saveEditRoutineReunion(id) {
  const r = reuniones.find(r => r.id === id);
  if (!r) return;
  const titleEl = document.getElementById('routine-edit-title-' + id);
  const dtEl = document.getElementById('routine-edit-dt-' + id);
  if (titleEl && titleEl.value.trim()) r.title = titleEl.value.trim();
  if (dtEl) r.datetime = dtEl.value;
  saveReuniones();
  renderRoutineStep(4);
}
function togglePrepItem(itemId, weekStart) {
  const key = 'apg_prep_checklist_' + weekStart;
  const done = load(key, {});
  done[itemId] = !done[itemId];
  save(key, done);
  renderRoutineStep(3);
}
function addRoutineQuickTask(weekStart) {
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
  saveTasks();
  inp.value = '';
  const uel = document.getElementById('routine-quick-urgente');
  const iel = document.getElementById('routine-quick-importante');
  if (uel) uel.checked = false;
  if (iel) iel.checked = false;
  renderRoutineStep(3);
}
function completeRoutine() {
  const weekStart=getWeekStart(0).toISOString().split('T')[0];
  save(K.routineDate, weekStart);
  save(K.routineStep, null);
  switchTab('resumen');
}

/* ── Feature 15: Data Archiving ── */
function archivePreviousMonth() {
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
  tasks=tasks.filter(t=>!archiveTasks.some(a=>a.id===t.id));
  reuniones=reuniones.filter(r=>!archiveReuniones.some(a=>a.id===r.id));
  events=events.filter(e=>!archiveEvents.some(a=>a.id===e.id));
  saveTasks(); saveReuniones(); saveEvents();
  renderTasks(); renderTeam(); renderEvents(); renderReuniones();
  const resultEl=document.getElementById('archive-result');
  if(resultEl) resultEl.textContent=`✅ Archivado correctamente. ${archiveTasks.length} tareas, ${archiveReuniones.length} reuniones, ${archiveEvents.length} eventos movidos a archivo.`;
}
function viewArchive() {
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

/* ═══════════════════════════════════════════════
   MIS KPIs — Selectable 5-KPI mini-cards for Resumen
   (declared here so they are available before the init
    sequence calls renderResumenKPIs())
═══════════════════════════════════════════════ */
const RESUMEN_KPI_CATALOG = [
  { key:'ventas',         label:'💰 Ventas Totales',  short:'Ventas',      valKey:'ventas',         objKey:'objVentas' },
  { key:'nps',            label:'⭐ NPS Tienda',       short:'NPS Tienda',  valKey:'nps',            objKey:'objNps' },
  { key:'dta',            label:'⏰ DTA Horas',        short:'DTA',         valKey:'dta',            objKey:'objDta' },
  { key:'conv',           label:'🔄 Conversión',       short:'Conv.',       valKey:'conv',           objKey:'objConv' },
  { key:'trafico',        label:'👣 Tráfico',           short:'Tráfico',     valKey:'trafico',        objKey:'objTrafico' },
  { key:'ventasBusiness', label:'💼 Ventas Business',  short:'Business',    valKey:'ventasBusiness', objKey:'objVentasBusiness' },
  { key:'ventasApu',      label:'📱 Ventas APU',       short:'APU',         valKey:'ventasApu',      objKey:'objVentasApu' },
  { key:'ventasSfs',      label:'🚚 Ventas SFS',       short:'SFS',         valKey:'ventasSfs',      objKey:'objVentasSfs' },
  { key:'npsShop',        label:'🛍️ NPS Shopping',     short:'NPS Shop',    valKey:'npsShop',        objKey:'objNpsShop' },
  { key:'npsApu',         label:'🔧 NPS APU',           short:'NPS APU',     valKey:'npsApu',         objKey:'objNpsApu' },
  { key:'npsSupport',     label:'🎧 NPS Support',      short:'NPS Sup',     valKey:'npsSupport',     objKey:'objNpsSupport' },
  { key:'npsTaa',         label:'🎓 NPS T@A',           short:'NPS T@A',     valKey:'npsTaa',         objKey:'objNpsTaa' },
  { key:'intros1k',       label:'📲 Intros/1K',         short:'Intros/1K',   valKey:'intros1k',       objKey:'objIntros1k' },
  { key:'timely',         label:'⏱️ Timely %',          short:'Timely',      valKey:'timely',         objKey:'objTimely' },
  { key:'cpUsage',        label:'🔗 C&P Usage %',       short:'C&P',         valKey:'cpUsage',        objKey:'objCpUsage' },
  { key:'gbConv',         label:'📊 GB Conv. %',        short:'GB Conv',     valKey:'gbConv',         objKey:'objGbConv' },
  { key:'introsSessions', label:'📲 Intros/1K Ses.',   short:'Intros Ses',  valKey:'introsSessions', objKey:'objIntrosSessions' },
  { key:'iphoneTat',      label:'📱 iPhone TAT',        short:'iPhone TAT',  valKey:'iphoneTat',      objKey:'objIphoneTat' },
  { key:'upt',            label:'🛍️ UPT',               short:'UPT',         valKey:'upt',            objKey:'objUpt' },
];
const RESUMEN_KPIS_KEY = 'apg_resumen_kpis';
const RESUMEN_KPIS_DEFAULT = ['ventas','nps','conv','trafico','dta'];
const MAX_RESUMEN_KPIS = 5;

loadKPIs();
renderTasks(); renderTeam(); renderEvents();
// Populate manager dropdown in event creation form
(function _populateManagerDropdown() {
  const sel = document.getElementById('ev-manager');
  if (sel && typeof equipoLiderazgo !== 'undefined') {
    sel.innerHTML = _managerOptions('');
  }
})();
updateSummary();
// Agenda sidebar init
(function(){
  const gi=document.getElementById('agenda-goal-input');
  if(gi) gi.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addAgendaGoal();}});
})();
checkAutoSuggestions();
renderResumenKPIs();
updateReunionOriginSelect();
requestNotifPerm();
scheduleAllNotifications();
updateRecogDropdown();
renderRecogs();
renderQuoteWidget();
renderKanban();
updateNotifBadge();
updateLaunchBadge();
renderFocusMetricDisplay();
renderKPIStreakAlerts();
initPulse();
populateFocusMetricCommitmentsOptions();
_initRadarCollapseState();
const currentHour = new Date().getHours();
if(currentHour>=7 && currentHour<11) showBriefingIfNeeded();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(e => console.warn('SW registration failed:', e));

/* ═══════════════════════════════════════════════
   OCR — Autocompletar KPIs desde captura
═══════════════════════════════════════════════ */

/**
 * Smart number normalizer: handles both US ("91.9", "45,068") and
 * European ("1.234,56") number formats.
 */
function _ocrNormNum(s) {
  if (!s) return s;
  const hasDot = s.includes('.');
  const hasComma = s.includes(',');
  if (hasDot && hasComma) {
    // Both present: whichever comes last is the decimal separator
    if (s.lastIndexOf('.') > s.lastIndexOf(',')) {
      return s.replace(/,/g, '');            // "1,234.56" → "1234.56"
    }
    return s.replace(/\./g, '').replace(',', '.'); // "1.234,56" → "1234.56"
  }
  if (hasComma) {
    const parts = s.split(',');
    if (parts.length === 2 && parts[1].length === 3) {
      return s.replace(/,/g, '');            // "45,068" → "45068"
    }
    return s.replace(',', '.');              // "91,9" → "91.9"
  }
  if (hasDot) {
    const parts = s.split('.');
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length > 0) {
      return s.replace(/\./g, '');           // "1.000" → "1000"
    }
    return s;                                // "91.9" → "91.9"
  }
  return s;
}

/**
 * Parse OCR text from a React App / retail dashboard screenshot and
 * fill as many KPI fields as possible.  Returns array of human-readable
 * descriptions for every field that was successfully filled.
 */
function _parseOCRKPIs(text) {
  const filled = [];
  const norm = text.replace(/\r\n/g, '\n');

  /* ── helper: set a KPI input value ── */
  const setField = (id, value, label) => {
    const el = document.getElementById(id);
    if (el && value != null && String(value).trim()) {
      el.value = String(value).trim();
      filled.push(label);
      return true;
    }
    return false;
  };

  /* ── helper: extract Sales / YoY / CTG from a text chunk ── */
  const extractSection = (chunk) => {
    const d = {};
    const sm = chunk.match(/(?:Sales|Ventas|Revenue|Facturación)[^\d$€]*([$€]?\s*[\d.,]+)\s*([MmKkBb])?/i);
    if (sm) d.sales = _ocrNormNum(sm[1].replace(/[$€\s]/g, ''));
    const ym = chunk.match(/YoY[:\s]*(-?\d+(?:[.,]\d+)?)\s*%?/i);
    if (ym) d.yoy = _ocrNormNum(ym[1]);
    const cm = chunk.match(/CTG[:\s]*([+-]?\d+(?:[.,]\d+)?)\s*(?:pts?|puntos?)?/i);
    if (cm) d.ctg = _ocrNormNum(cm[1]);
    return d;
  };

  /* ══════════════════════════════════════════════
     1. SECTION-BASED PARSING
     Recognizes "Stores (Total)", "Stores (Retail Business …)", "Retail Web Only"
  ══════════════════════════════════════════════ */
  const headers = [
    { re: /Stores?\s*\(?\s*Total\s*\)?/i,        key: 'total' },
    { re: /Stores?\s*\(?\s*Retail\s+Business/i,   key: 'business' },
    { re: /Retail\s+Web(?:\s+Only)?/i,            key: 'web' },
  ];
  const positions = [];
  for (const h of headers) {
    const m = norm.match(h.re);
    if (m) positions.push({ key: h.key, idx: m.index });
  }
  positions.sort((a, b) => a.idx - b.idx);

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].idx;
    const end = i + 1 < positions.length ? positions[i + 1].idx : norm.length;
    const chunk = norm.substring(start, end);
    const d = extractSection(chunk);
    if (positions[i].key === 'total') {
      if (d.sales) setField('kpi-ventas', d.sales, `Ventas Totales: ${d.sales}`);
      if (d.yoy)   setField('kpi-yoy-ventas', d.yoy, `YoY Ventas: ${d.yoy}%`);
    } else if (positions[i].key === 'business') {
      if (d.sales) setField('kpi-ventas-business', d.sales, `Ventas Business: ${d.sales}`);
      if (d.yoy)   setField('kpi-yoy-ventas-business', d.yoy, `YoY Business: ${d.yoy}%`);
    } else if (positions[i].key === 'web') {
      if (d.sales) setField('kpi-ventas-sfs', d.sales, `Ventas Web/SFS: ${d.sales}`);
      if (d.yoy)   setField('kpi-yoy-ventas-sfs', d.yoy, `YoY Web/SFS: ${d.yoy}%`);
    }
  }

  /* ══════════════════════════════════════════════
     2. TOP-ROW PRODUCT DATA
     "Total Sales $91.9M 8%  iPhone 45,068 9%  Mac 7,893 -19% …"
  ══════════════════════════════════════════════ */
  if (!filled.some(f => f.startsWith('Ventas Totales'))) {
    const tm = norm.match(/Total\s+Sales[^\d$€]*([$€]?\s*[\d.,]+)\s*([MmKkBb])?\s*(-?\d+(?:[.,]\d+)?)\s*%?/i);
    if (tm) {
      setField('kpi-ventas', _ocrNormNum(tm[1].replace(/[$€\s]/g, '')), `Ventas Totales: ${_ocrNormNum(tm[1].replace(/[$€\s]/g, ''))}`);
      if (tm[3]) setField('kpi-yoy-ventas', _ocrNormNum(tm[3]), `YoY Ventas: ${_ocrNormNum(tm[3])}%`);
    }
  }

  // Fallback: any "Sales" or "Ventas" if still not filled
  if (!filled.some(f => f.startsWith('Ventas Totales'))) {
    const fm = norm.match(/(?:Ventas|Sales|Revenue|Facturación)[^\d$€]*([$€]?\s*[\d.,]+)\s*[MmKkBb]?/i);
    if (fm) setField('kpi-ventas', _ocrNormNum(fm[1].replace(/[$€\s]/g, '')), `Ventas Totales: ${_ocrNormNum(fm[1].replace(/[$€\s]/g, ''))}`);
  }

  /* ══════════════════════════════════════════════
     3. GENERIC KPI EXTRACTION (NPS, AC+, Traffic, Conv, …)
  ══════════════════════════════════════════════ */

  // NPS
  const npsM = norm.match(/(?:NPS|Net\s+Promoter)[^\d]*(-?\d+(?:[.,]\d+)?)/i);
  if (npsM) setField('kpi-nps', _ocrNormNum(npsM[1]), `NPS: ${_ocrNormNum(npsM[1])}`);

  // AppleCare / AC+
  const acM = norm.match(/(?:AppleCare|AC\+|Attachment\s*Rate)[^\d]*([\d.,]+)\s*%?/i);
  if (acM) setField('kpi-ac', _ocrNormNum(acM[1]) + '%', `AppleCare: ${_ocrNormNum(acM[1])}%`);

  // Traffic / Tráfico
  const trM = norm.match(/(?:Traffic|Tr[aá]fico)[^\d]*([\d.,]+)/i);
  if (trM) setField('kpi-trafico', _ocrNormNum(trM[1]), `Tráfico: ${_ocrNormNum(trM[1])}`);

  // Conversion / Conversión
  const cvM = norm.match(/(?:Conversion|Conversi[oó]n)[^\d]*([\d.,]+)\s*%?/i);
  if (cvM) setField('kpi-conv', _ocrNormNum(cvM[1]), `Conversión: ${_ocrNormNum(cvM[1])}%`);

  // DTA
  const dtaM = norm.match(/(?:DTA|Days?\s+to\s+Action)[^\d]*([\d.,]+)/i);
  if (dtaM) setField('kpi-dta', _ocrNormNum(dtaM[1]), `DTA: ${_ocrNormNum(dtaM[1])}`);

  // UPT
  const uptM = norm.match(/(?:UPT|Units?\s+(?:Per|por)\s+Trans)[^\d]*([\d.,]+)/i);
  if (uptM) setField('kpi-upt', _ocrNormNum(uptM[1]), `UPT: ${_ocrNormNum(uptM[1])}`);

  // Intros per 1K
  const i1kM = norm.match(/(?:Intros?\s*(?:per|\/)\s*1\s*[Kk]|Intros?\s*1000)[^\d]*([\d.,]+)/i);
  if (i1kM) setField('kpi-intros-1k', _ocrNormNum(i1kM[1]), `Intros/1K: ${_ocrNormNum(i1kM[1])}`);

  // Timely Greet
  const tiM = norm.match(/(?:Timely\s*(?:Greet)?|Saludo\s*oportuno)[^\d]*([\d.,]+)\s*%?/i);
  if (tiM) setField('kpi-timely', _ocrNormNum(tiM[1]), `Timely: ${_ocrNormNum(tiM[1])}%`);

  // Customer Proposals Usage / CP Usage
  const cpM = norm.match(/(?:CP\s*Usage|Customer\s*Proposal)[^\d]*([\d.,]+)\s*%?/i);
  if (cpM) setField('kpi-cp-usage', _ocrNormNum(cpM[1]), `CP Usage: ${_ocrNormNum(cpM[1])}%`);

  // Genius Bar Conversion
  const gbM = norm.match(/(?:GB\s*Conv|Genius\s*(?:Bar\s*)?Conv)[^\d]*([\d.,]+)\s*%?/i);
  if (gbM) setField('kpi-gb-conv', _ocrNormNum(gbM[1]), `GB Conv: ${_ocrNormNum(gbM[1])}%`);

  // iPhone TAT
  const tatM = norm.match(/(?:iPhone\s*TAT|iPhone\s*Turn\s*Around)[^\d]*([\d.,]+)/i);
  if (tatM) setField('kpi-iphone-tat', _ocrNormNum(tatM[1]), `iPhone TAT: ${_ocrNormNum(tatM[1])}`);

  return filled;
}

async function procesarCapturaOCR(event) {
  if (typeof Tesseract === 'undefined') {
    showToast('⚠️ OCR no disponible: Tesseract no está cargado. Comprueba tu conexión.');
    return;
  }

  const file = event.target.files[0];
  if (!file) return;

  const statusDiv = document.getElementById('ocr-status');
  if (!statusDiv) return;
  statusDiv.style.display = 'block';
  statusDiv.style.color = 'var(--accent)';
  statusDiv.textContent = 'Analizando imagen... ⏳';

  try {
    const { data: { text } } = await Tesseract.recognize(file, 'spa+eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          statusDiv.textContent = `Leyendo documento... ${Math.round(m.progress * 100)}%`;
        }
      }
    });

    console.log('[OCR] Texto extraído:', text);

    const filled = _parseOCRKPIs(text);
    saveKPIs();
    flash('kpi-saved');

    if (filled.length > 0) {
      statusDiv.style.color = 'var(--success)';
      statusDiv.innerHTML =
        `<strong>✅ ${filled.length} campo${filled.length > 1 ? 's' : ''} autocompletado${filled.length > 1 ? 's' : ''}:</strong><br>` +
        filled.map(f => `<span style="display:inline-block;margin:2px 6px 2px 0;padding:2px 8px;background:var(--surface);border-radius:var(--radius-sm);font-size:11px;">${esc(f)}</span>`).join('');
    } else {
      statusDiv.style.color = 'var(--warning)';
      statusDiv.textContent = '⚠️ No se detectaron KPIs en la imagen. Prueba con una captura más clara o con más resolución.';
    }

    setTimeout(() => { statusDiv.style.display = 'none'; }, filled.length > 0 ? 8000 : 5000);
  } catch (err) {
    console.error('[OCR] Error:', err);
    statusDiv.style.color = 'var(--danger)';
    statusDiv.textContent = '❌ Error al leer la imagen. Prueba con una captura más clara.';
  } finally {
    // Reset input so the same file can be selected again
    event.target.value = '';
  }
}

/* ═══════════════════════════════════════════════
   EXPORT / IMPORT (Copia de seguridad)
═══════════════════════════════════════════════ */
function exportAllData() {
  const allKeys = Object.values(K);
  const backup = { _version: 1, _date: new Date().toISOString(), _app: 'APG-Dashboard' };
  allKeys.forEach(key => {
    const raw = localStorage.getItem(key);
    if (raw !== null) backup[key] = JSON.parse(raw);
  });
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `apg-dashboard-backup-${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('✅ Datos exportados correctamente');
}

function importAllData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const status = document.getElementById('import-export-status');
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const backup = JSON.parse(e.target.result);
      if (!backup._app || backup._app !== 'APG-Dashboard') {
        if (!confirm('El fichero no parece ser un backup de APG Dashboard. ¿Continuar de todas formas?')) return;
      }
      if (!confirm('⚠️ Esto reemplazará TODOS tus datos actuales con los del fichero. ¿Estás seguro?')) return;
      const allKeys = Object.values(K);
      allKeys.forEach(key => {
        if (backup[key] !== undefined) {
          localStorage.setItem(key, JSON.stringify(backup[key]));
        }
      });
      if (status) status.textContent = `✅ Datos restaurados (${backup._date ? new Date(backup._date).toLocaleDateString('es-ES') : 'fecha desconocida'})`;
      showToast('✅ Importación completada — recargando...');
      setTimeout(() => location.reload(), 1500);
    } catch(err) {
      if (status) status.textContent = '❌ Error al leer el fichero';
      showToast('❌ Error al importar: fichero inválido');
    }
  };
  reader.readAsText(file);
  // Reset input so same file can be re-selected
  event.target.value = '';
}

/* ═══════════════════════════════════════════════
   PDI — Plan de Desarrollo Individual
═══════════════════════════════════════════════ */
let _pdiPersonId = null;
function openPDIModal(personId) {
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
function closePDIModal() {
  document.getElementById('pdi-modal-overlay').classList.remove('open');
  _pdiPersonId = null;
}
function savePDI() {
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

/* ═══════════════════════════════════════════════
   1:1 PREP MODAL
═══════════════════════════════════════════════ */
let _1on1PrepPersonId = null;

function open1on1PrepModal(personId) {
  const overlay = document.getElementById('oneone-prep-overlay');
  if (!overlay) return;
  _1on1PrepPersonId = personId;
  const person = team.find(m => m.id === personId);
  if (!person) return;

  const todayStr = new Date().toISOString().slice(0, 10);
  const noteKey = `apg_1on1_prep_p${personId}_${todayStr}`;

  document.getElementById('oneone-prep-title').textContent = `📋 Prep 1:1 — ${person.name}`;

  // Load SBI history for this person
  const sbiHistory = load(K_SBI, []).filter(s => String(s.personId) === String(personId));
  const lastPos = sbiHistory.filter(s => s.type === 'positivo')[0];
  const lastDev = sbiHistory.filter(s => s.type === 'mejora')[0];

  // Load PDI
  const pdis = load(K.pdis, {});
  const pdi = pdis[personId] || {};

  // Load recognitions
  const recogs = load(K.reconocimientos, []).filter(r => r.personId === personId)
    .sort((a,b) => (b.date||'').localeCompare(a.date||'')).slice(0, 3);

  // Load tasks related to person (tasks with person name in text or assignee)
  const allTasks = load(K.tasks, []).filter(t => !t.done &&
    (t.text && t.text.toLowerCase().includes(person.name.toLowerCase()))
  ).slice(0, 5);

  // Load last TB session
  const tbs = load(K.tbs, {});
  const tbSessions = (tbs[personId] || []).slice().sort((a,b) => (b.date||'').localeCompare(a.date||''));
  const lastTB = tbSessions[0] || null;

  // Load today's prep notes
  const savedNotes = load(noteKey, '');

  let html = `<div style="font-size:14px;font-weight:700;margin-bottom:4px">${esc(person.name)}</div>`;
  html += `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:14px">${esc(person.role)}</div>`;

  // Last SBI Feedback
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

  // PDI
  html += `<div style="font-size:13px;font-weight:600;margin-bottom:6px;margin-top:12px;padding-bottom:4px;border-bottom:1px solid var(--border)">📈 PDI / Notas de desarrollo</div>`;
  if (pdi.strengths || pdi.devAreas || pdi.weekGoal || pdi.nextRole) {
    if (pdi.strengths) html += `<div style="font-size:12px;margin-bottom:4px"><strong>Fortalezas:</strong> ${esc(pdi.strengths)}</div>`;
    if (pdi.devAreas)  html += `<div style="font-size:12px;margin-bottom:4px"><strong>Áreas de desarrollo:</strong> ${esc(pdi.devAreas)}</div>`;
    if (pdi.weekGoal)  html += `<div style="font-size:12px;margin-bottom:4px"><strong>Objetivo:</strong> ${esc(pdi.weekGoal)}</div>`;
    if (pdi.nextRole)  html += `<div style="font-size:12px;margin-bottom:4px"><strong>Próximo rol:</strong> ${esc(pdi.nextRole)}</div>`;
  } else {
    html += `<div style="font-size:12px;color:var(--text-secondary)">Sin PDI guardado</div>`;
  }

  // Recognitions
  html += `<div style="font-size:13px;font-weight:600;margin-bottom:6px;margin-top:12px;padding-bottom:4px;border-bottom:1px solid var(--border)">🏆 Últimos reconocimientos</div>`;
  if (recogs.length) {
    recogs.forEach(r => {
      html += `<div style="font-size:12px;margin-bottom:4px">🏆 ${esc(r.desc)} <span style="color:var(--text-secondary)">(${esc(r.date||'')})</span></div>`;
    });
  } else {
    html += `<div style="font-size:12px;color:var(--text-secondary)">Sin reconocimientos registrados</div>`;
  }

  // Pending tasks
  html += `<div style="font-size:13px;font-weight:600;margin-bottom:6px;margin-top:12px;padding-bottom:4px;border-bottom:1px solid var(--border)">✅ Tareas pendientes relacionadas</div>`;
  if (allTasks.length) {
    allTasks.forEach(t => {
      html += `<div style="font-size:12px;margin-bottom:4px">• ${esc(t.text)}</div>`;
    });
  } else {
    html += `<div style="font-size:12px;color:var(--text-secondary)">Sin tareas pendientes relacionadas</div>`;
  }

  // Last TB session
  html += `<div style="font-size:13px;font-weight:600;margin-bottom:6px;margin-top:12px;padding-bottom:4px;border-bottom:1px solid var(--border)">🤝 Última sesión TB</div>`;
  if (lastTB) {
    html += `<div style="font-size:12px;margin-bottom:4px"><strong>${esc(lastTB.date||'')}</strong>`;
    if (lastTB.points) html += ` — ${esc(lastTB.points.slice(0,150))}`;
    html += `</div>`;
  } else {
    html += `<div style="font-size:12px;color:var(--text-secondary)">Sin sesión TB registrada</div>`;
  }

  // Free notes
  html += `<div style="font-size:13px;font-weight:600;margin-bottom:6px;margin-top:12px;padding-bottom:4px;border-bottom:1px solid var(--border)">📝 Notas para hoy</div>`;
  html += `<textarea id="oneone-prep-notes" placeholder="Anotaciones para esta reunión..." style="width:100%;min-height:90px;padding:10px;font-size:13px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface2);color:var(--text-primary);resize:vertical;box-sizing:border-box">${esc(savedNotes)}</textarea>`;
  html += `<button class="btn btn-primary" style="margin-top:8px;font-size:12px" onclick="save1on1PrepNotes()">💾 Guardar notas</button>`;

  document.getElementById('oneone-prep-content').innerHTML = html;
  overlay.style.display = 'flex';
}

function close1on1PrepModal() {
  const overlay = document.getElementById('oneone-prep-overlay');
  if (overlay) overlay.style.display = 'none';
  _1on1PrepPersonId = null;
}

function save1on1PrepNotes() {
  if (!_1on1PrepPersonId) return;
  const todayStr = new Date().toISOString().slice(0, 10);
  const noteKey = `apg_1on1_prep_p${_1on1PrepPersonId}_${todayStr}`;
  const notes = document.getElementById('oneone-prep-notes')?.value || '';
  save(noteKey, notes);
  showToast('Notas guardadas', 'success');
}

function print1on1Prep() {
  const content = document.getElementById('oneone-prep-content');
  const printEl = document.getElementById('oneone-prep-print');
  if (!content || !printEl) return;
  printEl.innerHTML = content.innerHTML;
  document.body.classList.add('printing-1on1');
  window.print();
  document.body.classList.remove('printing-1on1');
  printEl.innerHTML = '';
}

/* ═══════════════════════════════════════════════
   FEEDBACK SBI
═══════════════════════════════════════════════ */
// K_SBI is defined near the top of the file (after K object) to avoid TDZ errors on early initialization
let _sbiType = 'positivo';

function setSBIType(type, btn) {
  _sbiType = type;
  document.querySelectorAll('#tab-feedback .filter-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  generateSBI();
}

function updateSBIPersonSelect() {
  const sel = document.getElementById('sbi-person');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Selecciona persona —</option>' +
    team.filter(m => !m.hidden).map(m => `<option value="${m.id}">${esc(m.name)} — ${esc(m.role)}</option>`).join('');
  // Also update history filter dropdown
  const filterSel = document.getElementById('sbi-history-filter');
  if (filterSel) {
    filterSel.innerHTML = '<option value="">Todos los managers</option>' +
      team.filter(m => !m.hidden).map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('');
  }
}

function generateSBI() {
  const situation = document.getElementById('sbi-situation')?.value.trim() || '';
  const behavior  = document.getElementById('sbi-behavior')?.value.trim() || '';
  const impact    = document.getElementById('sbi-impact')?.value.trim() || '';
  const closing   = document.getElementById('sbi-closing')?.value.trim() || '';
  const personId  = document.getElementById('sbi-person')?.value;
  const person    = personId ? team.find(m => String(m.id) === String(personId)) : null;
  const personName = person ? person.name.split(' ')[0] : '[Nombre]';

  const preview = document.getElementById('sbi-preview');
  if (!preview) return;

  if (!situation && !behavior && !impact) {
    preview.textContent = 'Completa los campos para ver la vista previa...';
    preview.style.color = 'var(--text-secondary)';
    return;
  }
  preview.style.color = 'var(--text-primary)';

  let text = '';
  if (_sbiType === 'positivo') {
    text += `${personName}, quería compartir contigo algo que observé y que me pareció muy valioso.\n\n`;
  } else {
    text += `${personName}, quería tener esta conversación contigo porque confío en tu capacidad de desarrollo.\n\n`;
  }
  if (situation) text += `📍 SITUACIÓN\n${situation}\n\n`;
  if (behavior)  text += `👁️ COMPORTAMIENTO\n${behavior}\n\n`;
  if (impact)    text += `💥 IMPACTO\n${impact}\n\n`;
  if (closing)   text += `🔮 ${closing}`;

  preview.textContent = text.trim();
}

function copySBI() {
  const text = document.getElementById('sbi-preview')?.textContent || '';
  if (!text || text.includes('Completa los campos')) return;
  navigator.clipboard.writeText(text).then(() => {
    flash('sbi-copy-msg');
    showToast('📋 Feedback copiado al portapapeles');
  }).catch(() => { prompt('Copia el feedback:', text); });
}

function saveSBIToHistory() {
  const situation = document.getElementById('sbi-situation')?.value.trim() || '';
  const behavior  = document.getElementById('sbi-behavior')?.value.trim() || '';
  const impact    = document.getElementById('sbi-impact')?.value.trim() || '';
  if (!situation && !behavior && !impact) { showToast('Completa al menos un campo antes de guardar'); return; }
  const personId = document.getElementById('sbi-person')?.value;
  const person = personId ? team.find(m => String(m.id) === String(personId)) : null;
  const history = load(K_SBI, []);
  history.unshift({
    id: Date.now(),
    date: new Date().toISOString().slice(0,10),
    personId: personId || null,
    personName: person ? person.name : '—',
    type: _sbiType,
    situation, behavior, impact,
    closing: document.getElementById('sbi-closing')?.value.trim() || '',
    text: document.getElementById('sbi-preview')?.textContent || ''
  });
  save(K_SBI, history);
  renderSBIHistory();
  showToast('💾 Feedback guardado en historial');
}

function clearSBIForm() {
  ['sbi-situation','sbi-behavior','sbi-impact','sbi-closing'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const preview = document.getElementById('sbi-preview');
  if (preview) { preview.textContent = 'Completa los campos para ver la vista previa...'; preview.style.color = 'var(--text-secondary)'; }
}

const SBI_TEMPLATES = {
  floor: {
    situation: 'Ayer por la tarde, durante la hora pico en el floor de Shopping,',
    behavior: 'observé que gestionaste simultáneamente a tres clientes con diferentes necesidades, manteniendo la calma y un lenguaje corporal abierto durante toda la interacción.',
    impact: 'Los tres clientes salieron con sus necesidades resueltas y uno de ellos mencionó explícitamente lo bien atendido que se había sentido al despedirse.',
    closing: '¿Cómo crees que podemos replicar esta forma de gestionar la presión con el resto del equipo?'
  },
  cliente: {
    situation: 'Esta mañana, durante el opening del store,',
    behavior: 'tomaste la iniciativa de dar la bienvenida personalmente a los primeros clientes del día y acompañaste a uno que parecía desorientado directamente a la persona que podía ayudarle.',
    impact: 'Ese pequeño gesto marcó el tono del día para todo el equipo y el cliente nos dejó una reseña positiva mencionando tu nombre específicamente.',
    closing: ''
  },
  mejora: {
    situation: 'En la reunión de equipo del lunes por la mañana,',
    behavior: 'cuando surgió una pregunta sobre el proceso de devoluciones, respondiste con información que no estaba actualizada y, cuando alguien lo señaló, la conversación perdió fluidez durante unos minutos.',
    impact: 'El equipo necesitó tiempo extra para aclarar el proceso correcto, y algunos salieron con dudas sobre cuál era el procedimiento definitivo.',
    closing: '¿Qué sistema crees que podría ayudarte a tener siempre la información más actualizada antes de las reuniones?'
  },
  liderazgo: {
    situation: 'Durante el shift del sábado, uno de los momentos de mayor presión de la semana,',
    behavior: 'cuando surgió un conflicto entre dos compañeros del equipo sobre la gestión de una cola de espera, mediaste de forma calmada, escuchaste a ambas partes y propusiste una solución que los dos aceptaron.',
    impact: 'El conflicto se resolvió en menos de tres minutos, el equipo siguió trabajando sin tensión y los clientes en espera no percibieron nada. Demostraste exactamente el tipo de liderazgo situacional que necesitamos.',
    closing: '¿Cómo te sentiste en ese momento? ¿Qué harías igual la próxima vez?'
  }
};

function loadSBITemplate(key) {
  const t = SBI_TEMPLATES[key];
  if (!t) return;
  document.getElementById('sbi-situation').value = t.situation;
  document.getElementById('sbi-behavior').value  = t.behavior;
  document.getElementById('sbi-impact').value    = t.impact;
  document.getElementById('sbi-closing').value   = t.closing;
  generateSBI();
}

function renderSBIHistory() {
  const list = document.getElementById('sbi-history-list');
  const empty = document.getElementById('sbi-history-empty');
  if (!list) return;
  let history = load(K_SBI, []);

  // Apply filters
  const personFilter = document.getElementById('sbi-history-filter')?.value || '';
  const typeFilter = document.getElementById('sbi-history-type-filter')?.value || '';
  if (personFilter) history = history.filter(h => String(h.personId) === personFilter);
  if (typeFilter) history = history.filter(h => h.type === typeFilter);

  if (!history.length) { list.innerHTML = ''; if(empty) empty.style.display='block'; return; }
  if(empty) empty.style.display='none';
  list.innerHTML = history.map(h => `
    <div class="recog-item" style="flex-direction:column;gap:6px">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span style="font-size:12px;font-weight:600;color:var(--accent)">${fmtDate(h.date)}</span>
        <a href="javascript:goToProfile(${h.personId || 0})" style="font-size:12px;font-weight:600;color:var(--text-primary);text-decoration:none">${esc(h.personName)}</a>
        <span class="priority-badge ${h.type==='positivo'?'baja':'media'}" style="font-size:10px">${h.type==='positivo'?'🌟 Positivo':'🌱 Desarrollo'}</span>
        <button class="btn-icon" style="margin-left:auto;font-size:13px" onclick="deleteSBIEntry(${h.id})" title="Eliminar">×</button>
      </div>
      <div style="font-size:13px;color:var(--text-secondary);white-space:pre-wrap">${esc(h.text).slice(0,200)}${h.text.length>200?'…':''}</div>
    </div>`).join('');
}

function goToProfileFromSBI() {
  const personId = document.getElementById('sbi-person')?.value;
  if (personId) goToProfile(parseInt(personId));
}

function deleteSBIEntry(id) {
  const history = load(K_SBI, []).filter(h => h.id !== id);
  save(K_SBI, history);
  renderSBIHistory();
}

/* ═══════════════════════════════════════════════
   VOZ DEL CLIENTE — FEEDBACK DEL CLIENTE
═══════════════════════════════════════════════ */
const K_VC = 'apg_verbatims';
let _vcType = 'positivo';
let _vcFilter = 'todos';

const VC_AREA_ICONS = { shopping:'🛍️', genius:'🔧', business:'💼', taa:'🎓', general:'🏪' };
const VC_AREA_LABELS = { shopping:'Shopping', genius:'Genius/APU', business:'Business', taa:'T@A', general:'General' };

/* V1 — Causas raíz NPS Detractor */
const VC_ROOT_CAUSES = {
  espera:       { label: 'Tiempo de espera',                    emoji: '⏱️' },
  disponibilidad:{ label: 'Disponibilidad de producto',         emoji: '📦' },
  conocimiento: { label: 'Conocimiento del Specialist',         emoji: '🧑‍💼' },
  genius:       { label: 'Experiencia Genius Bar / Soporte',    emoji: '🔧' },
  compra:       { label: 'Proceso de compra / pago',            emoji: '💳' },
  postventa:    { label: 'Experiencia postventa / devolución',  emoji: '🔄' },
  ambiente:     { label: 'Ambiente de tienda',                  emoji: '🏪' },
  producto:     { label: 'Problema de producto / hardware',     emoji: '📱' },
  otra:         { label: 'Otra causa',                          emoji: '🌐' },
};

/* Spanish stop words for keyword extraction */
const VC_STOPWORDS = new Set(['el','la','los','las','de','del','en','un','una','que','y','a','por','con','para','es','al','se','no','lo','le','su','más','muy','me','mi','ya','nos','te','fue','ha','he','pero','como','sin','sobre','este','esta','son','todo','eso','era','hay','ser','tiene','está','han','sus','ir','tan','ni','desde','porque','entre','cuando','durante']);

function onVCTypeChange(type, btn) {
  setVCType(type, btn);
  const rootCauseRow = document.getElementById('vc-root-cause-row');
  if (rootCauseRow) rootCauseRow.style.display = type === 'negativo' ? 'flex' : 'none';
}

function setVCType(type, btn) {
  _vcType = type;
  document.querySelectorAll('#tab-vozcli .filter-pill[id^="vc-type"]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function setVCFilter(filter, btn) {
  _vcFilter = filter;
  document.querySelectorAll('#tab-vozcli .voc-feedback-section .filter-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderVerbatims();
}

function toggleVCForm() {
  const card = document.getElementById('vc-form-card');
  if (card) card.style.display = card.style.display === 'none' ? 'block' : 'none';
}

function toggleWowForm() {
  const wrap = document.getElementById('wow-form-wrap');
  if (wrap) wrap.style.display = wrap.style.display === 'none' ? 'block' : 'none';
}

function addVerbatim() {
  const text = document.getElementById('vc-text')?.value.trim();
  const date = document.getElementById('vc-date')?.value;
  if (!text) { showToast('Escribe el comentario del cliente'); return; }
  const all = load(K_VC, []);
  const rootCause = _vcType === 'negativo' ? (document.getElementById('vc-root-cause')?.value || '') : '';
  all.unshift({
    id: Date.now(),
    text,
    type: _vcType,
    area: document.getElementById('vc-area')?.value || 'general',
    date: date || new Date().toISOString().slice(0,10),
    rootCause
  });
  save(K_VC, all);
  document.getElementById('vc-text').value = '';
  renderVerbatims();
  renderVCStats();
  renderVCInsights();
  renderVCTrend();
  renderVCAreaChart();
  renderVCPareto();
  renderVCCorrelation();
  renderVCKeywords();
  showToast(_vcType === 'positivo' ? '😊 Feedback positivo añadido' : '😞 Feedback de mejora añadido');
}

function renderVerbatims() {
  const list = document.getElementById('vc-list');
  const empty = document.getElementById('vc-empty');
  if (!list) return;
  let all = load(K_VC, []);
  const search = (document.getElementById('vc-search')?.value || '').toLowerCase().trim();
  if (_vcFilter === 'positivo' || _vcFilter === 'negativo') all = all.filter(v => v.type === _vcFilter);
  else if (_vcFilter !== 'todos') all = all.filter(v => v.area === _vcFilter);
  if (search) all = all.filter(v => v.text.toLowerCase().includes(search));
  if (!all.length) { list.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
  if (empty) empty.style.display = 'none';
  list.innerHTML = all.map(v => {
    const rc = v.rootCause && VC_ROOT_CAUSES[v.rootCause];
    return `
    <div class="voc-feedback-card ${v.type}">
      <div class="voc-feedback-avatar ${v.type}">
        ${v.type === 'positivo' ? '😊' : '😞'}
      </div>
      <div class="voc-feedback-body">
        <div class="voc-feedback-meta">
          <span>${fmtDate(v.date)}</span>
          <span class="voc-tag voc-tag-area">${VC_AREA_ICONS[v.area] || '🏪'} ${VC_AREA_LABELS[v.area] || v.area}</span>
          ${rc ? `<span class="voc-tag voc-tag-cause">${rc.emoji} ${esc(rc.label)}</span>` : ''}
        </div>
        <div class="voc-feedback-text">"${esc(v.text)}"</div>
      </div>
      <div class="voc-feedback-actions">
        <button class="btn-icon" onclick="deleteVerbatim(${v.id})" title="Eliminar">×</button>
      </div>
    </div>`;
  }).join('');
}

function deleteVerbatim(id) {
  save(K_VC, load(K_VC, []).filter(v => v.id !== id));
  renderVerbatims();
  renderVCStats();
  renderVCInsights();
  renderVCTrend();
  renderVCAreaChart();
  renderVCPareto();
  renderVCCorrelation();
  renderVCKeywords();
}

/* ═══ ENHANCED KPI STATS ═══ */
function renderVCStats() {
  const grid = document.getElementById('vc-stats-grid');
  if (!grid) return;
  const all = load(K_VC, []);
  const pos = all.filter(v => v.type === 'positivo').length;
  const neg = all.filter(v => v.type === 'negativo').length;
  const total = all.length;
  const ratio = total ? Math.round((pos / total) * 100) : 0;

  const now = new Date();
  const oneWeekAgo = new Date(now); oneWeekAgo.setDate(now.getDate() - 7);
  const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(now.getDate() - 14);
  const thisWeek = all.filter(v => new Date(v.date) >= oneWeekAgo).length;
  const lastWeek = all.filter(v => { const d = new Date(v.date); return d >= twoWeeksAgo && d < oneWeekAgo; }).length;
  const weekTrend = lastWeek ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : (thisWeek > 0 ? 100 : 0);

  const kpis = load(K.kpis, {});
  const npsActual = num(kpis.nps);

  const negByArea = {};
  all.filter(v => v.type === 'negativo').forEach(v => negByArea[v.area] = (negByArea[v.area] || 0) + 1);
  const topNegArea = Object.entries(negByArea).sort((a, b) => b[1] - a[1])[0];

  grid.innerHTML = `
    <div class="voc-kpi-card">
      <div class="voc-kpi-icon">📊</div>
      <div class="voc-kpi-value">${total}</div>
      <div class="voc-kpi-label">Total feedback</div>
      <div class="voc-kpi-trend" style="color:${weekTrend >= 0 ? 'var(--accent)' : 'var(--text-secondary)'}">
        ${weekTrend >= 0 ? '↑' : '↓'} ${Math.abs(weekTrend)}% esta semana
      </div>
      <div class="voc-kpi-bar" style="background:var(--accent)"></div>
    </div>
    <div class="voc-kpi-card">
      <div class="voc-kpi-icon">😊</div>
      <div class="voc-kpi-value" style="color:var(--success)">${pos}</div>
      <div class="voc-kpi-label">Positivos</div>
      <div class="voc-gauge-wrap">
        <div class="voc-gauge-segment" style="width:${ratio}%;background:var(--success)"></div>
        <div class="voc-gauge-segment" style="width:${100-ratio}%;background:var(--danger)"></div>
      </div>
      <div class="voc-kpi-bar" style="background:var(--success)"></div>
    </div>
    <div class="voc-kpi-card">
      <div class="voc-kpi-icon">😞</div>
      <div class="voc-kpi-value" style="color:var(--danger)">${neg}</div>
      <div class="voc-kpi-label">De mejora</div>
      ${topNegArea ? `<div class="voc-kpi-trend" style="color:var(--danger)">Top: ${VC_AREA_ICONS[topNegArea[0]] || '🏪'} ${VC_AREA_LABELS[topNegArea[0]] || topNegArea[0]}</div>` : '<div class="voc-kpi-trend" style="color:var(--text-secondary)">Sin datos</div>'}
      <div class="voc-kpi-bar" style="background:var(--danger)"></div>
    </div>
    <div class="voc-kpi-card">
      <div class="voc-kpi-icon">${ratio >= 70 ? '🟢' : ratio >= 50 ? '🟡' : '🔴'}</div>
      <div class="voc-kpi-value" style="color:${ratio >= 70 ? 'var(--success)' : ratio >= 50 ? 'var(--warning)' : 'var(--danger)'}">${ratio}%</div>
      <div class="voc-kpi-label">Índice positivo</div>
      <div class="voc-kpi-trend" style="color:var(--text-secondary)">${ratio >= 70 ? 'Excelente' : ratio >= 50 ? 'Mejorable' : 'Crítico'}</div>
      <div class="voc-kpi-bar" style="background:${ratio >= 70 ? 'var(--success)' : ratio >= 50 ? 'var(--warning)' : 'var(--danger)'}"></div>
    </div>
    ${npsActual ? `
    <div class="voc-kpi-card">
      <div class="voc-kpi-icon">🎯</div>
      <div class="voc-kpi-value" style="color:var(--accent)">${npsActual}</div>
      <div class="voc-kpi-label">NPS actual</div>
      <div class="voc-kpi-trend" style="color:var(--text-secondary)">${npsActual >= 70 ? 'Excelente' : npsActual >= 50 ? 'Bueno' : npsActual >= 0 ? 'Mejorable' : 'Crítico'}</div>
      <div class="voc-kpi-bar" style="background:var(--accent)"></div>
    </div>` : ''}
  `;
}

/* ═══ INSIGHTS & RECOMMENDATIONS ═══ */
function renderVCInsights() {
  const content = document.getElementById('vc-insights-content');
  if (!content) return;
  const all = load(K_VC, []);
  if (!all.length) {
    content.innerHTML = '<p style="color:var(--text-secondary);font-size:13px">Añade feedback para generar insights automáticos.</p>';
    return;
  }

  const insights = [];
  const pos = all.filter(v => v.type === 'positivo');
  const neg = all.filter(v => v.type === 'negativo');
  const ratio = all.length ? Math.round((pos.length / all.length) * 100) : 0;
  const kpis = load(K.kpis, {});
  const npsActual = num(kpis.nps);

  const negByArea = {};
  const posByArea = {};
  neg.forEach(v => negByArea[v.area] = (negByArea[v.area] || 0) + 1);
  pos.forEach(v => posByArea[v.area] = (posByArea[v.area] || 0) + 1);
  const topNegAreas = Object.entries(negByArea).sort((a, b) => b[1] - a[1]);
  const topPosAreas = Object.entries(posByArea).sort((a, b) => b[1] - a[1]);

  const causeCount = {};
  neg.filter(v => v.rootCause).forEach(v => causeCount[v.rootCause] = (causeCount[v.rootCause] || 0) + 1);
  const topCauses = Object.entries(causeCount).sort((a, b) => b[1] - a[1]);

  const now = new Date();
  const oneWeekAgo = new Date(now); oneWeekAgo.setDate(now.getDate() - 7);
  const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(now.getDate() - 14);
  const recentNeg = neg.filter(v => new Date(v.date) >= oneWeekAgo).length;
  const prevNeg = neg.filter(v => { const d = new Date(v.date); return d >= twoWeeksAgo && d < oneWeekAgo; }).length;

  if (ratio < 50) {
    insights.push({ icon: '🚨', title: 'Índice positivo por debajo del 50%',
      desc: `Solo el ${ratio}% del feedback es positivo. Esto indica un problema sistémico que requiere atención inmediata.`,
      action: 'Revisar procesos operativos' });
  } else if (ratio < 70) {
    insights.push({ icon: '⚠️', title: 'Margen de mejora en satisfacción',
      desc: `El ${ratio}% de positividad está por debajo del objetivo del 70%. Focaliza esfuerzos en las áreas con más feedback negativo.`,
      action: 'Crear plan de acción' });
  } else {
    insights.push({ icon: '✅', title: 'Excelente percepción del cliente',
      desc: `El ${ratio}% de positividad supera el objetivo. Sigue potenciando lo que funciona bien.`,
      action: 'Compartir con el equipo' });
  }

  if (topNegAreas.length > 0) {
    const area = topNegAreas[0];
    const areaLabel = VC_AREA_LABELS[area[0]] || area[0];
    const pct = Math.round((area[1] / neg.length) * 100);
    insights.push({ icon: '🔍',
      title: `${VC_AREA_ICONS[area[0]] || '🏪'} ${areaLabel}: ${pct}% del feedback negativo`,
      desc: `El área de ${areaLabel} concentra ${area[1]} de ${neg.length} comentarios negativos. Es la principal oportunidad de mejora.`,
      action: `Acción en ${areaLabel}` });
  }

  if (topCauses.length > 0) {
    const cause = topCauses[0];
    const info = VC_ROOT_CAUSES[cause[0]] || { emoji: '🌐', label: cause[0] };
    insights.push({ icon: info.emoji,
      title: `Causa raíz #1: ${info.label}`,
      desc: `"${info.label}" es la causa más frecuente con ${cause[1]} menciones. ${
        cause[0] === 'espera' ? 'Revisa los tiempos de espera y la gestión del flujo de clientes.' :
        cause[0] === 'disponibilidad' ? 'Verifica la disponibilidad de stock y displays.' :
        cause[0] === 'conocimiento' ? 'Considera sesiones de formación para el equipo.' :
        cause[0] === 'genius' ? 'Revisa los procesos de Genius Bar y tiempos de reparación.' :
        cause[0] === 'compra' ? 'Optimiza el proceso de compra y métodos de pago.' :
        cause[0] === 'postventa' ? 'Mejora la experiencia postventa y devoluciones.' :
        'Investiga las causas específicas y crea un plan de acción.'
      }`,
      action: 'Crear plan correctivo' });
  }

  if (recentNeg > prevNeg && prevNeg > 0) {
    const increase = Math.round(((recentNeg - prevNeg) / prevNeg) * 100);
    insights.push({ icon: '📈',
      title: `Aumento del ${increase}% en feedback negativo`,
      desc: `Esta semana hay ${recentNeg} comentarios negativos vs ${prevNeg} la semana pasada. Investiga qué ha cambiado.`,
      action: 'Investigar causa' });
  }

  if (topPosAreas.length > 0 && npsActual) {
    const best = topPosAreas[0];
    insights.push({ icon: '💡',
      title: `Fortaleza: ${VC_AREA_ICONS[best[0]] || '🏪'} ${VC_AREA_LABELS[best[0]] || best[0]}`,
      desc: `Con ${best[1]} comentarios positivos, esta área es tu mayor fortaleza. Usa estos casos como ejemplo en reuniones de equipo y comparte las buenas prácticas.`,
      action: 'Reconocer al equipo' });
  }

  content.innerHTML = insights.map(i => `
    <div class="voc-insight-item">
      <div class="voc-insight-icon">${i.icon}</div>
      <div class="voc-insight-text">
        <div class="voc-insight-title">${esc(i.title)}</div>
        <div class="voc-insight-desc">${esc(i.desc)}</div>
        <span class="voc-insight-action">→ ${esc(i.action)}</span>
      </div>
    </div>
  `).join('');
}

/* ═══ WEEKLY TREND CHART ═══ */
function renderVCTrend() {
  const el = document.getElementById('vc-trend-chart');
  if (!el) return;
  const all = load(K_VC, []);
  if (all.length < 2) {
    el.innerHTML = '<p style="color:var(--text-secondary);font-size:13px">Se necesitan más datos para mostrar la tendencia.</p>';
    return;
  }

  const now = new Date();
  const weeks = [];
  for (let w = 7; w >= 0; w--) {
    const start = new Date(now); start.setDate(now.getDate() - (w * 7 + 6));
    const end = new Date(now); end.setDate(now.getDate() - (w * 7));
    const label = `${start.getDate()}/${start.getMonth()+1}`;
    const weekFeedback = all.filter(v => {
      const d = new Date(v.date);
      return d >= start && d <= end;
    });
    weeks.push({
      label,
      pos: weekFeedback.filter(v => v.type === 'positivo').length,
      neg: weekFeedback.filter(v => v.type === 'negativo').length
    });
  }

  const maxVal = Math.max(...weeks.map(w => Math.max(w.pos, w.neg, 1)));

  el.innerHTML = `
    <div class="voc-trend-row">
      ${weeks.map(w => `
        <div class="voc-trend-bar-group">
          <div class="voc-trend-bars">
            <div class="voc-trend-bar" style="height:${Math.max(2, (w.pos / maxVal) * 100)}%;background:var(--success)" title="Positivos: ${w.pos}"></div>
            <div class="voc-trend-bar" style="height:${Math.max(2, (w.neg / maxVal) * 100)}%;background:var(--danger)" title="Negativos: ${w.neg}"></div>
          </div>
          <div class="voc-trend-label">${w.label}</div>
        </div>
      `).join('')}
    </div>
    <div class="voc-trend-legend">
      <span class="leg-pos">Positivos</span>
      <span class="leg-neg">Negativos</span>
    </div>
  `;
}

/* ═══ AREA DISTRIBUTION CHART ═══ */
function renderVCAreaChart() {
  const el = document.getElementById('vc-area-chart');
  if (!el) return;
  const all = load(K_VC, []);
  if (!all.length) {
    el.innerHTML = '<p style="color:var(--text-secondary);font-size:13px">Se necesitan datos para mostrar la distribución.</p>';
    return;
  }

  const areas = ['shopping', 'genius', 'business', 'taa', 'general'];
  const areaData = areas.map(area => {
    const areaFeedback = all.filter(v => v.area === area);
    return {
      key: area,
      total: areaFeedback.length,
      pos: areaFeedback.filter(v => v.type === 'positivo').length,
      neg: areaFeedback.filter(v => v.type === 'negativo').length
    };
  }).sort((a, b) => b.total - a.total);

  const maxTotal = Math.max(...areaData.map(a => a.total), 1);

  el.innerHTML = `
    <div class="voc-area-bars">
      ${areaData.map(a => {
        const pct = Math.round((a.total / maxTotal) * 100);
        const posPct = a.total ? Math.round((a.pos / a.total) * 100) : 0;
        return `
        <div class="voc-area-row">
          <div class="voc-area-icon">${VC_AREA_ICONS[a.key] || '🏪'}</div>
          <div class="voc-area-name">${VC_AREA_LABELS[a.key] || a.key}</div>
          <div class="voc-area-bar-bg">
            <div class="voc-area-bar-fill" style="width:${pct}%">
              <div class="voc-area-bar-pos" style="width:${posPct}%"></div>
              <div class="voc-area-bar-neg" style="width:${100-posPct}%"></div>
            </div>
          </div>
          <div class="voc-area-count">${a.total}</div>
        </div>`;
      }).join('')}
    </div>
    <div class="voc-trend-legend" style="margin-top:12px">
      <span class="leg-pos">Positivo</span>
      <span class="leg-neg">Negativo</span>
    </div>
  `;
}

/* ═══ KEYWORDS CLOUD ═══ */
function renderVCKeywords() {
  const el = document.getElementById('vc-keywords-cloud');
  if (!el) return;
  const all = load(K_VC, []);
  if (!all.length) {
    el.innerHTML = '<p style="color:var(--text-secondary);font-size:13px">Se necesitan comentarios para analizar palabras clave.</p>';
    return;
  }

  const wordCount = {};
  const wordSentiment = {};
  all.forEach(v => {
    const words = v.text.toLowerCase().replace(/[^\p{L}\s]/gu, '').split(/\s+/);
    words.forEach(w => {
      if (w.length > 2 && !VC_STOPWORDS.has(w)) {
        wordCount[w] = (wordCount[w] || 0) + 1;
        if (!wordSentiment[w]) wordSentiment[w] = { pos: 0, neg: 0 };
        if (v.type === 'positivo') wordSentiment[w].pos++;
        else wordSentiment[w].neg++;
      }
    });
  });

  const sorted = Object.entries(wordCount).sort((a, b) => b[1] - a[1]).slice(0, 20);
  if (!sorted.length) {
    el.innerHTML = '<p style="color:var(--text-secondary);font-size:13px">No se encontraron palabras clave significativas.</p>';
    return;
  }

  const maxCount = sorted[0][1];
  el.innerHTML = `<div class="voc-keywords-cloud">${sorted.map(([word, count]) => {
    const s = wordSentiment[word];
    const isPos = s.pos > s.neg;
    const size = 12 + Math.round((count / maxCount) * 8);
    const color = isPos ? 'var(--success)' : s.neg > s.pos ? 'var(--danger)' : 'var(--text-secondary)';
    return `<span class="voc-keyword-tag" style="font-size:${size}px;border-color:${color}">
      ${esc(word)} <span class="voc-keyword-count">${count}</span>
    </span>`;
  }).join('')}</div>`;
}

function renderVCCorrelation() {
  const content = document.getElementById('vc-correlation-content');
  if (!content) return;
  const all = load(K_VC, []);
  const kpis = load(K.kpis, {});
  const npsActual = num(kpis.nps);
  if (!all.length) { content.innerHTML = '<p style="font-size:13px;color:var(--text-secondary)">Añade feedback del cliente para ver la correlación.</p>'; return; }

  const neg = all.filter(v => v.type === 'negativo');
  const pos = all.filter(v => v.type === 'positivo');
  const negByArea = {};
  neg.forEach(v => negByArea[v.area] = (negByArea[v.area] || 0) + 1);
  const topAreas = Object.entries(negByArea).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const medProd = JSON.parse(localStorage.getItem('medallia_nps_product') || 'null');
  const medSupp = JSON.parse(localStorage.getItem('medallia_nps_support') || 'null');
  const medApu  = JSON.parse(localStorage.getItem('medallia_nps_apu') || 'null');
  const medTaa  = JSON.parse(localStorage.getItem('medallia_nps_taa') || 'null');

  const npsCard = (data, label, color) => (data && data.score !== null)
    ? `<div style="flex:1;min-width:80px;text-align:center;padding:12px;background:var(--surface2);border-radius:var(--radius-sm)">
        <div style="font-size:28px;font-weight:800;color:${color}">${data.score}</div>
        <div style="font-size:10px;color:var(--text-secondary);font-weight:600;text-transform:uppercase">${label}</div>
        ${data.source ? `<div style="font-size:9px;color:var(--text-secondary);margin-top:2px">${data.source === 'pdf' ? '📄 PDF' : '✏️ Manual'}</div>` : ''}
      </div>` : '';

  content.innerHTML = `
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px">
      ${npsActual ? `<div style="flex:1;min-width:80px;text-align:center;padding:12px;background:var(--surface2);border-radius:var(--radius-sm)">
        <div style="font-size:28px;font-weight:800;color:${npsActual >= 70 ? 'var(--success)' : npsActual >= 50 ? 'var(--warning)' : 'var(--danger)'}">${npsActual}</div>
        <div style="font-size:10px;color:var(--text-secondary);font-weight:600;text-transform:uppercase">NPS KPI</div>
      </div>` : ''}
      ${npsCard(medProd, 'NPS Shopping', 'var(--accent)')}
      ${npsCard(medSupp, 'NPS Support', 'var(--purple)')}
      ${npsCard(medApu, 'NPS APU', '#ff6b35')}
      ${npsCard(medTaa, 'NPS T@A', '#bf5af2')}
      <div style="flex:1;min-width:80px;text-align:center;padding:12px;background:${neg.length > pos.length ? 'rgba(255,59,48,0.06)' : 'rgba(52,199,89,0.06)'};border-radius:var(--radius-sm)">
        <div style="font-size:28px;font-weight:800;color:${neg.length > pos.length ? 'var(--danger)' : 'var(--success)'}">${pos.length}/${neg.length}</div>
        <div style="font-size:10px;color:var(--text-secondary);font-weight:600;text-transform:uppercase">Pos / Neg</div>
      </div>
    </div>
    ${topAreas.length ? `
    <div style="margin-bottom:10px;font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase">Top áreas con feedback negativo</div>
    ${topAreas.map(([area, count]) => `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;padding:8px;background:rgba(255,59,48,0.04);border-radius:var(--radius-sm)">
        <span style="font-size:18px">${VC_AREA_ICONS[area] || '🏪'}</span>
        <span style="font-size:13px;font-weight:600;flex:1">${VC_AREA_LABELS[area] || area}</span>
        <span style="font-size:12px;font-weight:700;color:var(--danger)">${count}</span>
      </div>
    `).join('')}
    <div style="background:rgba(0,113,227,0.06);border-left:3px solid var(--accent);border-radius:var(--radius-sm);padding:10px 14px;font-size:12px;margin-top:12px">
      💡 <strong>Recomendación:</strong> Prioriza acciones de mejora en <strong>${VC_AREA_LABELS[topAreas[0][0]]}</strong> para impactar el NPS.
    </div>` : '<p style="font-size:13px;color:var(--text-secondary)">No hay feedback negativo registrado.</p>'}
  `;
}

/* ═══ PARETO ROOT CAUSE ANALYSIS ═══ */
function renderVCPareto() {
  const wrap = document.getElementById('vc-pareto-wrap');
  if (!wrap) return;
  const all = load(K_VC, []);
  const negWithCause = all.filter(v => v.type === 'negativo' && v.rootCause);
  if (!negWithCause.length) {
    wrap.innerHTML = '<p style="font-size:13px;color:var(--text-secondary)">Registra feedback negativo con causa raíz para ver el análisis.</p>';
    return;
  }
  const counts = {};
  negWithCause.forEach(v => counts[v.rootCause] = (counts[v.rootCause] || 0) + 1);
  const total = negWithCause.length;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  let cumulative = 0;
  wrap.innerHTML = sorted.map(([cause, cnt]) => {
    const info = VC_ROOT_CAUSES[cause] || { emoji: '🌐', label: cause };
    const pct = Math.round((cnt / total) * 100);
    cumulative += pct;
    const barColor = cumulative <= 80 ? 'var(--danger)' : 'var(--warning)';
    return `
      <div class="voc-pareto-item">
        <div class="voc-pareto-header">
          <span class="voc-pareto-label">${info.emoji} ${esc(info.label)}</span>
          <span class="voc-pareto-value" style="color:${cumulative <= 80 ? 'var(--danger)' : 'var(--warning)'}">${cnt} (${pct}%)</span>
        </div>
        <div class="voc-pareto-bar">
          <div class="voc-pareto-fill" style="width:${pct}%;background:${barColor}"></div>
        </div>
        <div class="voc-pareto-cumulative">Acumulado: ${cumulative}%</div>
      </div>`;
  }).join('') + `
    <div style="background:rgba(255,59,48,0.06);border-left:3px solid var(--danger);border-radius:var(--radius-sm);padding:10px 14px;font-size:12px;margin-top:12px">
      🎯 <strong>Regla 80/20:</strong> Enfócate en las primeras causas que suman ≤80% para mayor impacto.
    </div>`;
}

/* ═══ EXPORT DATA ═══ */
function exportVCData() {
  const all = load(K_VC, []);
  if (!all.length) { showToast('No hay datos para exportar'); return; }
  const header = 'Fecha,Tipo,Área,Causa Raíz,Comentario\n';
  const rows = all.map(v => {
    const rc = v.rootCause && VC_ROOT_CAUSES[v.rootCause] ? VC_ROOT_CAUSES[v.rootCause].label : '';
    return `"${v.date}","${v.type}","${VC_AREA_LABELS[v.area] || v.area}","${rc}","${v.text.replace(/"/g, '""')}"`;
  }).join('\n');
  const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `voz-cliente-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📥 Datos exportados a CSV');
}

/* ═══ MEDALLIA HELPERS ═══ */
function updateMedalliaFileName() {
  const fileInput = document.getElementById('medallia-pdf-file');
  const label = document.getElementById('medallia-file-name');
  if (fileInput && label && fileInput.files[0]) {
    label.textContent = fileInput.files[0].name;
    label.style.color = 'var(--accent)';
  }
}

/* ═══ WOW MOMENTS ═══ */
const WOW_CATEGORIES = {
  servicio:    { label: 'Servicio excepcional', emoji: '🌟' },
  sorpresa:    { label: 'Sorpresa al cliente',  emoji: '🎁' },
  conexion:    { label: 'Conexión humana',       emoji: '🤝' },
  creatividad: { label: 'Creatividad',           emoji: '💡' },
  resultado:   { label: 'Resultado increíble',   emoji: '🏆' },
};

function updateWowPersonSelect() {
  const sel = document.getElementById('wow-person');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Sin protagonista específico —</option>' +
    [...team.filter(m => !m.hidden), ...equipoLiderazgo.filter(e => !team.some(m => m.id === e.id))]
      .map(m => `<option value="${m.id || m.id}">${esc(m.name || m.nombre)}</option>`).join('');
}

function addWowMoment() {
  const title    = document.getElementById('wow-title')?.value.trim();
  const story    = document.getElementById('wow-story')?.value.trim();
  const personId = document.getElementById('wow-person')?.value || '';
  const date     = document.getElementById('wow-date')?.value || new Date().toISOString().slice(0,10);
  const category = document.getElementById('wow-category')?.value || 'servicio';
  if (!title || !story) { showToast('El título y la historia son obligatorios'); return; }
  const all = load(K.wowMoments, []);
  all.unshift({ id: Date.now(), title, story, personId: personId ? parseInt(personId) : null, date, category });
  save(K.wowMoments, all);
  document.getElementById('wow-title').value = '';
  document.getElementById('wow-story').value = '';
  renderWowMoments();
  showToast('⭐ Wow Moment guardado');
}

function deleteWowMoment(id) {
  save(K.wowMoments, load(K.wowMoments, []).filter(w => w.id !== id));
  renderWowMoments();
}

function renderWowMoments() {
  const list  = document.getElementById('wow-list');
  const empty = document.getElementById('wow-empty');
  if (!list) return;
  const all = load(K.wowMoments, []);
  updateWowPersonSelect();
  if (!all.length) { list.innerHTML = ''; if(empty) empty.style.display='block'; return; }
  if(empty) empty.style.display='none';
  list.innerHTML = all.map(w => {
    const cat = WOW_CATEGORIES[w.category] || WOW_CATEGORIES.servicio;
    const personName = w.personId ? getMemberName(w.personId) : null;
    return `
    <div class="event-item" style="border-left:3px solid var(--accent);align-items:flex-start">
      <div class="event-date-box" style="background:var(--accent)">
        <div style="font-size:18px;line-height:1">${cat.emoji}</div>
        <div style="font-size:9px;font-weight:700;letter-spacing:0;margin-top:2px">${fmtDate(w.date)}</div>
      </div>
      <div class="event-content" style="flex:1">
        <div style="font-weight:600;font-size:14px;margin-bottom:3px">${esc(w.title)}</div>
        ${personName ? `<div style="font-size:11px;color:var(--accent);margin-bottom:4px">👤 ${esc(personName)}</div>` : ''}
        <div style="font-size:13px;color:var(--text-secondary);line-height:1.5">${esc(w.story)}</div>
        <div style="margin-top:6px"><span class="recog-cat-pill" style="background:rgba(0,113,227,0.1);color:var(--accent)">${cat.emoji} ${esc(cat.label)}</span></div>
      </div>
      <button class="btn-icon" onclick="deleteWowMoment(${w.id})" title="Eliminar">×</button>
    </div>`;
  }).join('');
}

/* ═══ MEDALLIA PDF IMPORT ═══ */

function openMedalliaModal() {
  const el = document.getElementById('medallia-import-modal');
  if (el) el.style.display = 'flex';
}

function closeMedalliaModal() {
  const el = document.getElementById('medallia-import-modal');
  if (el) el.style.display = 'none';
  const status = document.getElementById('medallia-import-status');
  if (status) status.textContent = '';
}

async function processMedalliaPDF() {
  const fileInput = document.getElementById('medallia-pdf-file');
  const typeSelect = document.getElementById('medallia-pdf-type');
  const status = document.getElementById('medallia-import-status');
  const file = fileInput && fileInput.files[0];
  const type = typeSelect ? typeSelect.value : 'nps-product';

  if (!file) {
    if (status) status.textContent = '⚠️ Selecciona un archivo PDF.';
    return;
  }

  if (typeof pdfjsLib === 'undefined') {
    if (status) status.textContent = '⚠️ pdf.js no está disponible. Comprueba la conexión a internet.';
    return;
  }

  /* Set worker; fall back to no-worker mode if CDN worker is unreachable */
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  } catch (_) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
  }

  if (status) status.textContent = '⏳ Procesando PDF...';

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map(item => item.str).join(' ') + '\n';
    }

    if (type.startsWith('nps-')) {
      parseNPSMedallia(fullText, type);
      /* Don't auto-close — let the user see extracted results */
    } else {
      parseFeedbackMedallia(fullText);
      if (status) status.textContent = '✅ Feedback importado y clasificado correctamente.';
      setTimeout(() => closeMedalliaModal(), 1500);
    }
  } catch (err) {
    if (status) status.textContent = '❌ Error al procesar el PDF: ' + err.message;
  }
}

function parseNPSMedallia(text, type) {
  /* ── Flexible NPS score extraction ──
     Handles many PDF formats: "NPS: 72", "NPS 72", "NPS Score: 72", "NPS Score 72%",
     "Net Promoter Score 72", numeric-only lines near NPS label, negative scores, etc. */
  const npsPatterns = [
    /NPS\s*(?:Score)?[:\s=–—-]+\s*(-?\d+)/i,
    /Net\s+Promoter\s+Score[:\s=–—-]+\s*(-?\d+)/i,
    /(?:Overall|Total|Store|Tienda)\s+NPS[:\s=–—-]+\s*(-?\d+)/i,
    /NPS[:\s]*(-?\d+)\s*(?:%|pts|puntos)?/i,
    /(?:score|puntuación|resultado)[:\s]+(-?\d+)/i,
  ];
  let npsScore = null;
  for (const pat of npsPatterns) {
    const m = text.match(pat);
    if (m) { npsScore = parseInt(m[1]); break; }
  }

  /* ── Promoters / Passives / Detractors ──
     Handles: "Promoters: 65%", "Promotores 65 %", "65% Promoters", "P: 65%", etc. */
  const pctNum = (patterns) => {
    for (const p of patterns) {
      const m = text.match(p);
      if (m) return parseInt(m[1]);
    }
    return null;
  };
  const promoters = pctNum([
    /Promot(?:or)?e(?:r)?s?[:\s=–—-]+\s*(\d+)\s*%?/i,
    /(\d+)\s*%?\s*Promot(?:or)?e(?:r)?s?/i,
  ]);
  const passives = pctNum([
    /(?:Pasiv|Passiv|Neutral)(?:o|e)?s?[:\s=–—-]+\s*(\d+)\s*%?/i,
    /(\d+)\s*%?\s*(?:Pasiv|Passiv|Neutral)(?:o|e)?s?/i,
  ]);
  const detractors = pctNum([
    /Detract(?:or)?e(?:r)?s?[:\s=–—-]+\s*(\d+)\s*%?/i,
    /(\d+)\s*%?\s*Detract(?:or)?e(?:r)?s?/i,
  ]);

  /* ── If no NPS found but we have promoters/detractors, compute NPS ── */
  if (npsScore === null && promoters !== null && detractors !== null) {
    npsScore = promoters - detractors;
  }

  const keyMap = {
    'nps-product': 'medallia_nps_product',
    'nps-support': 'medallia_nps_support',
    'nps-apu':     'medallia_nps_apu',
    'nps-taa':     'medallia_nps_taa',
  };
  const key = keyMap[type] || 'medallia_nps_product';
  const data = {
    score: npsScore,
    promoters: promoters,
    passives: passives,
    detractors: detractors,
    importedAt: new Date().toISOString(),
    source: 'pdf',
    rawTextPreview: text.substring(0, 500)
  };
  localStorage.setItem(key, JSON.stringify(data));

  autoFillNPSFields(data, type);
  addImportHistoryEntry(type, 1, npsScore !== null ? `NPS = ${npsScore}` : 'NPS importado (sin score detectado)');
  renderImportHistory();
  renderVCCorrelation();
  renderNPSImportResults(data, type, text);
}

function autoFillNPSFields(data, type) {
  /* ── Actually fill the KPI input fields so the data appears in the dashboard ── */
  const fieldMap = {
    'nps-product': 'kpi-nps-shopping',   /* Product Zone ≈ Shopping experience */
    'nps-support': 'kpi-nps-support',
    'nps-apu':     'kpi-nps-apu',
    'nps-taa':     'kpi-nps-taa',
  };
  const inputId = fieldMap[type];
  if (data.score !== null && inputId) {
    const el = document.getElementById(inputId);
    if (el) {
      el.value = data.score;
      saveKPIs();   /* persist + refresh all progress bars and mirrors */
    }
  }

  /* Build toast summary */
  const labelMap = { 'nps-product': 'Shopping', 'nps-support': 'Support', 'nps-apu': 'APU', 'nps-taa': 'T@A' };
  const label = labelMap[type] || type;
  const parts = [];
  if (data.score !== null) parts.push(`NPS ${label}: ${data.score}`);
  if (data.promoters !== null) parts.push(`Promotores: ${data.promoters}%`);
  if (data.passives !== null) parts.push(`Pasivos: ${data.passives}%`);
  if (data.detractors !== null) parts.push(`Detractores: ${data.detractors}%`);
  if (parts.length) showToast('📄 ' + parts.join(' · '));
  else showToast('⚠️ No se detectaron valores NPS en el PDF — revisa el texto extraído', 'error');
}

/* ── Show extracted NPS results with raw text preview ── */
function renderNPSImportResults(data, type, rawText) {
  const status = document.getElementById('medallia-import-status');
  if (!status) return;
  const labelMap = { 'nps-product': 'NPS Shopping', 'nps-support': 'NPS Support', 'nps-apu': 'NPS APU', 'nps-taa': 'NPS T@A' };
  const filledMap = { 'nps-product': 'NPS Shopping (KPIs)', 'nps-support': 'NPS Support (KPIs)', 'nps-apu': 'NPS APU (KPIs)', 'nps-taa': 'NPS T@A (KPIs)' };
  const label = labelMap[type] || type;
  const scoreColor = data.score === null ? 'var(--text-secondary)' : data.score >= 50 ? 'var(--success)' : data.score >= 0 ? 'var(--warning)' : 'var(--danger)';
  const filled = filledMap[type] || 'KPIs';
  status.innerHTML = `
    <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:12px;margin-top:8px">
      <div style="font-weight:600;margin-bottom:8px">${data.score !== null ? '✅' : '⚠️'} Resultados del PDF — ${esc(label)}</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:8px">
        <div style="text-align:center;padding:8px 12px;background:var(--surface);border-radius:var(--radius-sm);min-width:60px">
          <div style="font-size:22px;font-weight:800;color:${scoreColor}">${data.score !== null ? data.score : '—'}</div>
          <div style="font-size:10px;color:var(--text-secondary)">NPS Score</div>
        </div>
        ${data.promoters !== null ? `<div style="text-align:center;padding:8px 12px;background:var(--surface);border-radius:var(--radius-sm)"><div style="font-size:18px;font-weight:700;color:var(--success)">${data.promoters}%</div><div style="font-size:10px;color:var(--text-secondary)">Promotores</div></div>` : ''}
        ${data.passives !== null ? `<div style="text-align:center;padding:8px 12px;background:var(--surface);border-radius:var(--radius-sm)"><div style="font-size:18px;font-weight:700;color:var(--warning)">${data.passives}%</div><div style="font-size:10px;color:var(--text-secondary)">Pasivos</div></div>` : ''}
        ${data.detractors !== null ? `<div style="text-align:center;padding:8px 12px;background:var(--surface);border-radius:var(--radius-sm)"><div style="font-size:18px;font-weight:700;color:var(--danger)">${data.detractors}%</div><div style="font-size:10px;color:var(--text-secondary)">Detractores</div></div>` : ''}
      </div>
      ${data.score !== null ? `<div style="font-size:12px;color:var(--success);margin-bottom:6px">✅ Valor autocompletado en <strong>${esc(filled)}</strong></div>` : ''}
      ${data.score === null ? `<div style="font-size:12px;color:var(--warning);margin-bottom:6px">⚠️ No se pudo detectar el NPS Score. Usa la entrada manual o revisa el texto extraído.</div>` : ''}
      <details style="margin-top:6px">
        <summary style="font-size:11px;color:var(--text-secondary);cursor:pointer">📝 Ver texto extraído del PDF</summary>
        <pre style="font-size:11px;color:var(--text-secondary);background:var(--surface);padding:8px;border-radius:var(--radius-sm);margin-top:6px;max-height:150px;overflow:auto;white-space:pre-wrap;word-break:break-all">${esc(rawText.substring(0, 1500))}</pre>
      </details>
    </div>`;
}

/* ── Manual NPS entry and toggle for manual section ── */
function toggleMedalliaManualEntry() {
  const sel = document.getElementById('medallia-pdf-type');
  const manual = document.getElementById('medallia-manual-entry');
  if (manual) manual.style.display = sel && sel.value === 'feedback' ? 'none' : 'block';
}

function processManualNPS() {
  const typeSelect = document.getElementById('medallia-pdf-type');
  const type = typeSelect ? typeSelect.value : 'nps-product';
  if (type === 'feedback') return;

  const npsVal = document.getElementById('medallia-manual-nps')?.value;
  const promVal = document.getElementById('medallia-manual-promoters')?.value;
  const pasVal = document.getElementById('medallia-manual-passives')?.value;
  const detVal = document.getElementById('medallia-manual-detractors')?.value;

  if (!npsVal && !promVal && !detVal) {
    showToast('⚠️ Introduce al menos el NPS Score', 'error');
    return;
  }

  const npsScore = npsVal ? parseInt(npsVal) : (promVal && detVal ? parseInt(promVal) - parseInt(detVal) : null);
  const data = {
    score: npsScore,
    promoters: promVal ? parseInt(promVal) : null,
    passives: pasVal ? parseInt(pasVal) : null,
    detractors: detVal ? parseInt(detVal) : null,
    importedAt: new Date().toISOString(),
    source: 'manual'
  };
  const keyMap = {
    'nps-product': 'medallia_nps_product',
    'nps-support': 'medallia_nps_support',
    'nps-apu':     'medallia_nps_apu',
    'nps-taa':     'medallia_nps_taa',
  };
  localStorage.setItem(keyMap[type] || 'medallia_nps_product', JSON.stringify(data));

  autoFillNPSFields(data, type);
  addImportHistoryEntry(type, 1, `NPS = ${npsScore !== null ? npsScore : '—'} (manual)`);
  renderImportHistory();
  renderVCCorrelation();
  setTimeout(() => closeMedalliaModal(), 800);
}

function parseFeedbackMedallia(text) {
  const lines = text.split(/[\n.!?]+/).map(l => l.trim()).filter(l => l.length > 15);

  const classified = lines.map(comment => ({
    text: comment,
    sentiment: classifyMedalliaSentiment(comment),
    category: classifyMedalliaCategory(comment),
    priority: classifyMedalliaPriority(comment)
  }));

  const existing = JSON.parse(localStorage.getItem('medallia_feedback') || '[]');
  const updated = [...existing, ...classified.map((c, i) => ({
    ...c,
    id: Date.now() + i,
    importedAt: new Date().toISOString()
  }))];
  localStorage.setItem('medallia_feedback', JSON.stringify(updated));

  addImportHistoryEntry('feedback', classified.length, 'Comentarios importados y clasificados');
  renderFeedbackSummary();
  renderImportHistory();
}

function classifyMedalliaSentiment(text) {
  const t = text.toLowerCase();
  const positive = ['excelente','genial','perfecto','encanta','maravilloso','feliz','satisfecho','rápido','fácil','great','excellent','love','amazing','happy','good','nice','fast','easy','bien','bueno','mejor'];
  const negative = ['mal','pésimo','horrible','lento','difícil','problema','error','fallo','tarda','espera','molesta','frustrante','bad','poor','slow','difficult','issue','problem','terrible','awful','worst'];
  const posScore = positive.filter(w => t.includes(w)).length;
  const negScore = negative.filter(w => t.includes(w)).length;
  if (posScore > negScore) return 'positivo';
  if (negScore > posScore) return 'negativo';
  return 'neutro';
}

function classifyMedalliaCategory(text) {
  const t = text.toLowerCase();
  if (['producto','calidad','artículo','item','product','quality'].some(w => t.includes(w))) return 'Producto';
  if (['atención','servicio','empleado','staff','equipo','team','amable','service','attention'].some(w => t.includes(w))) return 'Atención';
  if (['espera','cola','tiempo','rápido','lento','wait','queue','slow','fast'].some(w => t.includes(w))) return 'Tiempo de espera';
  if (['precio','caro','barato','coste','price','expensive','cheap'].some(w => t.includes(w))) return 'Precio';
  if (['proceso','compra','devolución','cambio','process','return','checkout'].some(w => t.includes(w))) return 'Proceso';
  return 'Otros';
}

function classifyMedalliaPriority(text) {
  const sentiment = classifyMedalliaSentiment(text);
  const urgentWords = ['urgente','inmediato','siempre','nunca','jamás','urgent','always','never'];
  const t = text.toLowerCase();
  if (sentiment === 'negativo' && urgentWords.some(w => t.includes(w))) return 'Alta';
  if (sentiment === 'negativo') return 'Media';
  return 'Baja';
}

function addImportHistoryEntry(type, count, note) {
  const history = JSON.parse(localStorage.getItem('medallia_import_history') || '[]');
  history.unshift({ type, count, note, date: new Date().toLocaleString('es-ES') });
  localStorage.setItem('medallia_import_history', JSON.stringify(history.slice(0, 20)));
}

function renderImportHistory() {
  const el = document.getElementById('medallia-import-history');
  if (!el) return;
  const history = JSON.parse(localStorage.getItem('medallia_import_history') || '[]');
  el.innerHTML = history.length === 0
    ? '<p style="color:var(--text-secondary);font-size:13px">No hay importaciones registradas.</p>'
    : history.map(h => `<div class="medallia-history-item">📄 <strong>${esc(h.type)}</strong> — ${esc(h.note)} (${esc(String(h.count))}) — <span style="color:var(--text-secondary)">${esc(h.date)}</span></div>`).join('');
}

function renderFeedbackSummary() {
  const el = document.getElementById('medallia-feedback-summary');
  if (!el) return;
  const feedback = JSON.parse(localStorage.getItem('medallia_feedback') || '[]');
  if (!feedback.length) {
    el.innerHTML = '<p style="color:var(--text-secondary);font-size:13px">No hay feedback importado desde PDF.</p>';
    return;
  }

  const cats = {};
  const sentiments = { positivo: 0, neutro: 0, negativo: 0 };
  feedback.forEach(f => {
    cats[f.category] = (cats[f.category] || 0) + 1;
    if (sentiments[f.sentiment] !== undefined) sentiments[f.sentiment]++;
  });

  const topCats = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 5);

  el.innerHTML = `
    <div class="medallia-sentiment-bar">
      <span class="medallia-chip positivo">🟢 Positivo: ${sentiments.positivo}</span>
      <span class="medallia-chip neutro">🟡 Neutro: ${sentiments.neutro}</span>
      <span class="medallia-chip negativo">🔴 Negativo: ${sentiments.negativo}</span>
    </div>
    <div style="margin:10px 0 6px;font-size:13px">
      <strong>Top temas:</strong>
      ${topCats.map(([cat, count]) => `<span class="medallia-chip cat">${esc(cat)}: ${count}</span>`).join('')}
    </div>
    <div class="medallia-feedback-list">
      ${feedback.slice(0, 10).map(f => `
        <div class="medallia-feedback-item medallia-sentiment-${f.sentiment}">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px">
            <span class="medallia-badge-sentiment">${f.sentiment === 'positivo' ? '🟢' : f.sentiment === 'negativo' ? '🔴' : '🟡'}</span>
            <span class="medallia-badge-cat">${esc(f.category)}</span>
            <span class="medallia-badge-priority medallia-priority-${f.priority.toLowerCase()}">${esc(f.priority)}</span>
          </div>
          <p style="margin:0;font-size:13px;color:var(--text-primary)">${esc(f.text)}</p>
        </div>
      `).join('')}
    </div>
    ${feedback.length > 10 ? `<p style="font-size:12px;color:var(--text-secondary);margin-top:8px">Mostrando 10 de ${feedback.length} comentarios.</p>` : ''}
  `;
}


/* ═══════════════════════════════════════════════
   BIBLIOTECA DE CONVERSACIONES
═══════════════════════════════════════════════ */
const K_CONV_NOTES = 'apg_conv_notes';

const CONVERSATION_TEMPLATES = [
  {
    id: 'bajo-rendimiento',
    icon: '📉',
    title: 'Conversación de bajo rendimiento',
    desc: 'Cuando un miembro del equipo no está alcanzando los estándares esperados.',
    color: '#ff3b30',
    objetivo: 'Establecer expectativas claras, entender las causas y co-crear un plan de mejora.',
    contexto: 'Elige un momento privado, sin interrupciones. Sé directo pero empático. El objetivo es desarrollar, no sancionar.',
    preguntas: [
      '¿Cómo crees que te está yendo en tu rol actualmente?',
      '¿Qué crees que está impidiendo que rindas al nivel que tú mismo/a te exiges?',
      '¿Qué necesitas de mí para tener éxito en este rol?',
      '¿Qué te comprometes a hacer diferente en las próximas dos semanas?',
      '¿Qué obstáculos anticipas y cómo los vamos a gestionar juntos?'
    ],
    claves: [
      'Describe comportamientos observables, no interpretaciones',
      'Usa el modelo SBI para cada ejemplo que pongas',
      'Termina con un acuerdo concreto y una fecha de seguimiento',
      'Documenta los acuerdos por escrito tras la conversación'
    ]
  },
  {
    id: 'promocion',
    icon: '🚀',
    title: 'Conversación de promoción',
    desc: 'Preparar a alguien para dar el siguiente paso en su carrera en Apple.',
    color: '#34c759',
    objetivo: 'Explorar aspiraciones, identificar gaps de desarrollo y crear un roadmap hacia el siguiente rol.',
    contexto: 'Esta conversación debe ser inspiradora. Muéstrate genuinamente interesado en el futuro de esta persona. Conecta sus ambiciones con las necesidades del negocio.',
    preguntas: [
      '¿Dónde te ves en Apple en los próximos 2-3 años?',
      '¿Qué aspectos de un rol de mayor responsabilidad te entusiasman más?',
      '¿En qué áreas crees que necesitas seguir creciendo para dar ese paso?',
      '¿Qué experiencias o proyectos crees que te ayudarían a desarrollarte más rápido?',
      '¿Qué definición de éxito tienes para ti mismo/a en el próximo trimestre?'
    ],
    claves: [
      'Sé honesto sobre los requisitos reales del siguiente nivel',
      'Conecta el desarrollo con oportunidades concretas en el store',
      'Compromete recursos: mentoring, proyectos especiales, visibilidad',
      'Establece checkpoints trimestrales para revisar el progreso'
    ]
  },
  {
    id: 'conflicto',
    icon: '🤝',
    title: 'Conversación de conflicto entre managers',
    desc: 'Mediar y resolver tensiones o conflictos dentro del equipo de liderazgo.',
    color: '#ff9f0a',
    objetivo: 'Restaurar la confianza, entender perspectivas y establecer nuevas formas de trabajar juntos.',
    contexto: 'Habla primero con cada parte por separado. Mantente neutral. Tu rol es facilitar, no juzgar. El equipo te observa.',
    preguntas: [
      '¿Puedes describirme la situación desde tu perspectiva, sin interpretar las intenciones de la otra persona?',
      '¿Qué necesitas que cambie para que esta relación de trabajo funcione bien?',
      '¿Qué estás dispuesto/a a hacer diferente tú?',
      '¿Qué impacto está teniendo este conflicto en tu energía y en el equipo?',
      '¿Cómo sería para ti una resolución satisfactoria de esta situación?'
    ],
    claves: [
      'No tomes partido ni valides narrativas unilaterales',
      'Separa los hechos de las interpretaciones en la conversación',
      'Después de hablar con cada uno, facilita una conversación conjunta',
      'Establece acuerdos de comportamiento concretos y observables'
    ]
  },
  {
    id: 'observacion-floor',
    icon: '🏪',
    title: 'Feedback post-observación de floor',
    desc: 'Dar feedback estructurado tras observar a alguien trabajar con clientes.',
    color: '#0071e3',
    objetivo: 'Reforzar comportamientos positivos y trabajar uno o dos aspectos de desarrollo concretos.',
    contexto: 'Da el feedback lo antes posible después de la observación (máximo 24h). Empieza siempre por lo positivo. Sé específico y observable.',
    preguntas: [
      '¿Cómo crees que fue esa interacción con el cliente?',
      '¿Qué harías exactamente igual si pudieras repetirla?',
      '¿Hay algo que cambiarías?',
      '¿Qué crees que sintió el cliente durante la interacción?',
      '¿Qué puedes practicar esta semana para seguir mejorando en ese punto?'
    ],
    claves: [
      'Describe lo que viste, no lo que interpretaste',
      'Trabaja máximo 1-2 puntos de desarrollo por sesión',
      'Termina siempre con un compromiso de práctica específico',
      'Usa el modelo SBI para el feedback de desarrollo'
    ]
  },
  {
    id: 'energia-burnout',
    icon: '🔋',
    title: 'Conversación de energía y bienestar',
    desc: 'Cuando detectas señales de agotamiento, desmotivación o burnout en alguien del equipo.',
    color: '#af52de',
    objetivo: 'Crear un espacio seguro para hablar de bienestar, entender la causa raíz y acordar apoyos concretos.',
    contexto: 'Esta es una de las conversaciones más importantes que puedes tener. Crea el máximo nivel de seguridad psicológica. Escucha más de lo que hablas.',
    preguntas: [
      '¿Cómo estás, de verdad? No en términos de trabajo, sino como persona.',
      '¿Qué parte de tu trabajo actualmente te da energía y qué parte te la quita?',
      '¿Hay algo fuera del trabajo que esté afectando a cómo estás llegando?',
      '¿Qué podría hacer yo, como tu manager, para ayudarte a estar mejor?',
      '¿Qué necesitas en las próximas semanas para recargar?'
    ],
    claves: [
      'No vayas con soluciones preparadas — escucha primero',
      'Normaliza la vulnerabilidad: compartir que no estás bien requiere valentía',
      'Conecta con recursos de bienestar de Apple si es necesario',
      'Haz seguimiento cercano en los próximos días — no esperes al siguiente 1:1'
    ]
  },
  {
    id: 'alineacion-objetivos',
    icon: '🎯',
    title: 'Conversación de alineación a objetivos',
    desc: 'Asegurarte de que alguien entiende el "por qué" detrás de los objetivos y está comprometido.',
    color: '#5ac8fa',
    objetivo: 'Conectar los objetivos del negocio con el propósito personal de la persona y generar compromiso genuino.',
    contexto: 'La alineación no es convencer — es conectar. Ayuda a la persona a encontrar su propio "por qué" en relación al objetivo.',
    preguntas: [
      '¿Cómo ves la conexión entre este objetivo y el impacto que quieres tener en el equipo?',
      '¿Qué parte de este objetivo te genera más energía y cuál menos?',
      '¿Qué necesitas entender mejor para sentirte totalmente comprometido/a con esto?',
      '¿Cómo medirías tú mismo/a si lo estás consiguiendo?',
      '¿Qué recursos o apoyos necesitas para darlo todo en este objetivo?'
    ],
    claves: [
      'Explica siempre el "por qué" antes del "qué" y el "cómo"',
      'La resistencia es información — explórala con curiosidad',
      'Un compromiso co-creado vale más que uno impuesto',
      'Revisa el progreso y celebra los hitos en cada 1:1'
    ]
  }
];

function renderConvsGrid() {
  const grid = document.getElementById('convs-grid');
  if (!grid) return;
  const notes = load(K_CONV_NOTES, {});

  grid.innerHTML = CONVERSATION_TEMPLATES.map(t => {
    // Count how many people have notes for this template
    const notesCount = Object.keys(notes).filter(k => k.startsWith(t.id + '_') && notes[k].trim()).length;
    return `
    <button class="template-card" onclick="openConvDetail('${t.id}')" style="text-align:left;position:relative">
      <div style="font-size:28px;margin-bottom:8px">${t.icon}</div>
      <div class="template-card-title">${esc(t.title)}</div>
      <div class="template-card-notes">${esc(t.desc)}</div>
      ${notesCount ? `<div style="position:absolute;top:10px;right:10px;font-size:10px;background:var(--accent);color:#fff;border-radius:10px;padding:2px 8px;font-weight:600">${notesCount} notas</div>` : ''}
    </button>`;
  }).join('');

  // Render conversation log summary
  _renderConvsLogSummary();
}

function _renderConvsLogSummary() {
  const wrap = document.getElementById('convs-log-summary');
  if (!wrap) return;
  const notes = load(K_CONV_NOTES, {});
  const visibleTeam = team.filter(m => !m.hidden);

  if (!visibleTeam.length) { wrap.innerHTML = '<div style="color:var(--text-secondary)">Añade miembros en Mi Equipo.</div>'; return; }

  let html = '<div style="overflow-x:auto"><table class="ls-vac-table" style="width:100%;font-size:12px"><thead><tr>';
  html += '<th style="text-align:left;min-width:140px">Persona</th>';
  CONVERSATION_TEMPLATES.forEach(t => {
    html += `<th style="text-align:center;min-width:40px" title="${esc(t.title)}">${t.icon}</th>`;
  });
  html += '<th style="text-align:center;min-width:60px">👤 Perfil</th>';
  html += '</tr></thead><tbody>';

  visibleTeam.forEach(m => {
    html += '<tr>';
    html += `<td style="font-weight:600;padding:4px 8px">${esc(m.name.split(' ')[0])}</td>`;
    CONVERSATION_TEMPLATES.forEach(t => {
      const key = `${t.id}_${m.id}`;
      const hasNotes = notes[key] && notes[key].trim();
      html += `<td style="text-align:center;padding:4px 8px">${hasNotes ? '✅' : '<span style="color:var(--text-secondary)">—</span>'}</td>`;
    });
    html += `<td style="text-align:center;padding:4px 8px"><a href="javascript:goToProfile(${m.id})" style="font-size:11px;color:var(--accent);text-decoration:none">Ver →</a></td>`;
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  wrap.innerHTML = html;
}

function goToProfileFromConvs() {
  const personId = document.getElementById('convs-notes-person')?.value;
  if (personId) goToProfile(parseInt(personId));
}

let _currentConvId = null;
function openConvDetail(id) {
  const t = CONVERSATION_TEMPLATES.find(x => x.id === id);
  if (!t) return;
  _currentConvId = id;
  document.getElementById('convs-grid').style.display = 'none';
  document.getElementById('convs-detail').style.display = 'block';
  document.getElementById('convs-detail-title').textContent = `${t.icon} ${t.title}`;

  const content = document.getElementById('convs-detail-content');
  content.innerHTML = `
    <div class="card" style="margin-bottom:16px;border-left:4px solid ${t.color}">
      <div class="card-title">🎯 Objetivo</div>
      <p style="font-size:14px;line-height:1.6">${esc(t.objetivo)}</p>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card-title">💡 Contexto y enfoque</div>
      <p style="font-size:13px;color:var(--text-secondary);line-height:1.6">${esc(t.contexto)}</p>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card-title">❓ Preguntas guía de coaching</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${t.preguntas.map((p, i) => `
          <button style="display:flex;gap:10px;padding:8px;background:var(--surface2);border-radius:var(--radius-sm);cursor:pointer;border:none;text-align:left;width:100%" onclick="copyConvQuestion(this)" title="Clic para copiar">
            <span style="font-size:13px;font-weight:700;color:var(--accent);flex-shrink:0">${i+1}.</span>
            <span style="font-size:13px;line-height:1.5">${esc(p)}</span>
          </button>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-title">🔑 Claves para esta conversación</div>
      ${t.claves.map((c, i, arr) => `<div style="display:flex;gap:8px;padding:6px 0;${i<arr.length-1?'border-bottom:1px solid var(--border);':''}font-size:13px"><span>✓</span><span>${esc(c)}</span></div>`).join('')}
    </div>`;

  updateConvsPersonSelect();
  loadConvNotes();
}

function copyConvQuestion(el) {
  const text = el.querySelector('span:last-child')?.textContent || '';
  navigator.clipboard.writeText(text).then(() => showToast('📋 Pregunta copiada')).catch(() => prompt('Copia la pregunta:', text));
}

function closeConvDetail() {
  document.getElementById('convs-grid').style.display = 'grid';
  document.getElementById('convs-detail').style.display = 'none';
  _currentConvId = null;
}

function updateConvsPersonSelect() {
  const sel = document.getElementById('convs-notes-person');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Sin persona específica —</option>' +
    team.filter(m => !m.hidden).map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('');
  sel.onchange = loadConvNotes;
}

function loadConvNotes() {
  if (!_currentConvId) return;
  const personId = document.getElementById('convs-notes-person')?.value || '';
  const notes = load(K_CONV_NOTES, {});
  const key = `${_currentConvId}_${personId}`;
  const el = document.getElementById('convs-notes-text');
  if (el) el.value = notes[key] || '';
}

function saveConvNotes() {
  if (!_currentConvId) return;
  const personId = document.getElementById('convs-notes-person')?.value || '';
  const key = `${_currentConvId}_${personId}`;
  const notes = load(K_CONV_NOTES, {});
  notes[key] = document.getElementById('convs-notes-text')?.value || '';
  save(K_CONV_NOTES, notes);
  flash('convs-notes-save-msg');
}

/* ═══════════════════════════════════════════════
   F1 — RADAR CHART KPIs (SVG puro)
═══════════════════════════════════════════════ */

/**
 * Toggles the Radar KPIs card between expanded and collapsed.
 * Persists the preference in localStorage so it survives page reloads.
 */
function toggleRadarChart() {
  const body    = document.getElementById('radar-body');
  const icon    = document.getElementById('radar-toggle-icon');
  const header  = document.querySelector('.radar-toggle-header');
  if (!body) return;
  const isOpen  = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : '';
  if (icon) icon.classList.toggle('collapsed', isOpen);
  if (header) header.setAttribute('aria-expanded', String(!isOpen));
  try { localStorage.setItem('apg_radar_open', isOpen ? '0' : '1'); } catch(e) {}
}

/** Restore collapse state on load */
function _initRadarCollapseState() {
  try {
    const open  = localStorage.getItem('apg_radar_open');
    if (open === '0') {
      const body   = document.getElementById('radar-body');
      const icon   = document.getElementById('radar-toggle-icon');
      const header = document.querySelector('.radar-toggle-header');
      if (body)   body.style.display = 'none';
      if (icon)   icon.classList.add('collapsed');
      if (header) header.setAttribute('aria-expanded', 'false');
    }
  } catch(e) {}
}

function getResumenKPISelection() {
  try {
    const stored = JSON.parse(localStorage.getItem(RESUMEN_KPIS_KEY));
    if (Array.isArray(stored) && stored.length) return stored.slice(0, MAX_RESUMEN_KPIS);
  } catch(e) {}
  return RESUMEN_KPIS_DEFAULT;
}

function renderResumenKPIs() {
  const wrap = document.getElementById('resumen-kpis-wrap');
  if (!wrap) return;
  const kpis = load(K.kpis, {});
  const selection = getResumenKPISelection();
  const cards = selection.map(key => {
    const def = RESUMEN_KPI_CATALOG.find(c => c.key === key);
    if (!def) return '';
    const val = kpis[def.valKey];
    const obj = kpis[def.objKey];
    const v = num(val), o = num(obj);
    const pct = o > 0 ? Math.min(Math.round(v / o * 100), 120) : 0;
    const color = o > 0 ? (pct >= 90 ? 'var(--success)' : pct >= 70 ? 'var(--warning,#ff9f0a)' : 'var(--danger)') : 'var(--text-secondary)';
    const barWidth = Math.min(pct, 100);
    return `<div class="resumen-kpi-card">
      <div class="resumen-kpi-label">${def.label}</div>
      <div class="resumen-kpi-value" style="color:${color}">${val || '—'}</div>
      <div class="resumen-kpi-obj">Obj: ${obj || '—'}</div>
      <div class="resumen-kpi-bar-wrap"><div class="resumen-kpi-bar-fill" style="width:${barWidth}%;background:${color}"></div></div>
      <div class="resumen-kpi-pct" style="color:${color}">${o > 0 ? pct + '%' : '—'}</div>
    </div>`;
  }).join('');
  wrap.innerHTML = cards || `<div style="font-size:13px;color:var(--text-secondary);padding:12px 0">Selecciona KPIs con ⚙️</div>`;
}
window.renderResumenKPIs = renderResumenKPIs;

function toggleResumenKPISelector() {
  const sel = document.getElementById('resumen-kpi-selector');
  if (!sel) return;
  if (sel.style.display !== 'none') { sel.style.display = 'none'; return; }
  const selection = getResumenKPISelection();
  sel.innerHTML = `
    <div class="rks-header">
      <span>Elige hasta ${MAX_RESUMEN_KPIS} KPIs</span>
      <button class="rks-close" onclick="toggleResumenKPISelector()">✕</button>
    </div>
    <div class="rks-list">
      ${RESUMEN_KPI_CATALOG.map(c => `
        <label class="rks-item">
          <input type="checkbox" value="${c.key}" ${selection.includes(c.key) ? 'checked' : ''} onchange="onResumenKPICheck(this)">
          <span>${c.label}</span>
        </label>`).join('')}
    </div>`;
  sel.style.display = 'block';
}
window.toggleResumenKPISelector = toggleResumenKPISelector;

function onResumenKPICheck(checkbox) {
  const sel = document.getElementById('resumen-kpi-selector');
  if (!sel) return;
  const checkboxes = [...sel.querySelectorAll('input[type=checkbox]')];
  const checked = checkboxes.filter(cb => cb.checked);
  if (checked.length > MAX_RESUMEN_KPIS) { checkbox.checked = false; return; }
  const newSelection = checked.map(cb => cb.value);
  localStorage.setItem(RESUMEN_KPIS_KEY, JSON.stringify(newSelection));
  renderResumenKPIs();
  renderRadarChart();
}
window.onResumenKPICheck = onResumenKPICheck;

function renderRadarChart() {
  const wrap = document.getElementById('radar-chart-wrap');
  if (!wrap) return;
  const kpis = load(K.kpis, {});
  const selection = getResumenKPISelection();
  const metrics = selection.map(key => {
    const def = RESUMEN_KPI_CATALOG.find(c => c.key === key);
    if (!def) return null;
    return { label: def.short, val: num(kpis[def.valKey]), obj: num(kpis[def.objKey]) };
  }).filter(Boolean);
  const N = metrics.length;
  const CX = 160, CY = 160, R = 120;
  const angleStep = (2 * Math.PI) / N;
  const angle = i => -Math.PI / 2 + i * angleStep;
  const toXY = (r, i) => ({
    x: CX + r * Math.cos(angle(i)),
    y: CY + r * Math.sin(angle(i))
  });
  // Normalise value as fraction 0..1 (cap at 1.2 for over-achievement)
  const frac = (val, obj) => obj > 0 ? Math.min(val / obj, 1.2) : 0;

  // Grid rings
  let rings = '';
  [0.25, 0.5, 0.75, 1.0].forEach(f => {
    const pts = metrics.map((_, i) => { const p = toXY(R * f, i); return `${p.x},${p.y}`; }).join(' ');
    rings += `<polygon points="${pts}" fill="none" stroke="var(--border)" stroke-width="1" opacity="0.6"/>`;
  });

  // Axes
  let axes = '';
  metrics.forEach((_, i) => {
    const p = toXY(R, i);
    axes += `<line x1="${CX}" y1="${CY}" x2="${p.x}" y2="${p.y}" stroke="var(--border)" stroke-width="1" opacity="0.5"/>`;
  });

  // Objective polygon
  const objPts = metrics.map((m, i) => { const p = toXY(R * frac(m.obj, m.obj), i); return `${p.x},${p.y}`; }).join(' ');

  // Actual polygon
  const actPts = metrics.map((m, i) => { const p = toXY(R * frac(m.val, m.obj), i); return `${p.x},${p.y}`; }).join(' ');

  // Labels
  let labels = '';
  metrics.forEach((m, i) => {
    const lp = toXY(R + 22, i);
    const anchor = lp.x < CX - 5 ? 'end' : lp.x > CX + 5 ? 'start' : 'middle';
    labels += `<text x="${lp.x.toFixed(1)}" y="${lp.y.toFixed(1)}" text-anchor="${anchor}" font-size="11" fill="var(--text-secondary)" dy="4">${esc(m.label)}</text>`;
  });

  // Legend
  const legendItems = metrics.map(m => {
    const pct = m.obj > 0 ? Math.round(m.val / m.obj * 100) : 0;
    const color = pct >= 100 ? 'var(--success)' : pct >= 75 ? 'var(--warning,#ff9f0a)' : 'var(--danger)';
    return `<span style="font-size:12px;color:${color}">● ${esc(m.label)}: ${m.val||'—'} / ${m.obj||'—'}</span>`;
  }).join(' &nbsp; ');

  wrap.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:12px">
      <svg viewBox="0 0 320 320" style="width:100%;max-width:340px;height:auto">
        ${rings}${axes}
        <polygon points="${objPts}" fill="var(--text-secondary)" fill-opacity="0.08" stroke="var(--text-secondary)" stroke-width="1.5" stroke-dasharray="5,3"/>
        <polygon points="${actPts}" fill="var(--accent)" fill-opacity="0.25" stroke="var(--accent)" stroke-width="2"/>
        ${labels}
      </svg>
      <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center">${legendItems}</div>
      <div style="display:flex;gap:16px;font-size:11px;color:var(--text-secondary)">
        <span><span style="display:inline-block;width:24px;height:2px;background:var(--accent);vertical-align:middle;margin-right:4px"></span>Actual</span>
        <span><span style="display:inline-block;width:24px;height:2px;background:var(--text-secondary);border-top:1px dashed;vertical-align:middle;margin-right:4px"></span>Objetivo</span>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════
   REDESIGN — WEEKLY HEALTH SCORE & SMART INSIGHTS
═══════════════════════════════════════════════ */

/* ── Weekly Health Score: 0-100 aggregate of all KPIs vs objectives ── */
function renderWeeklyHealthScore() {
  const wrap = document.getElementById('weekly-health-score');
  if (!wrap) return;
  const kpis = load(K.kpis, {});
  const metrics = [
    { label: '💰 Ventas',    val: num(kpis.ventas),   obj: num(kpis.objVentas),  weight: 3 },
    { label: '⭐ NPS',       val: num(kpis.nps),      obj: num(kpis.objNps),     weight: 2 },
    { label: '⏰ DTA',       val: num(kpis.dta),      obj: num(kpis.objDta),     weight: 1 },
    { label: '🔄 Conversión',val: num(kpis.conv),     obj: num(kpis.objConv),    weight: 2 },
    { label: '👣 Tráfico',   val: num(kpis.trafico),  obj: num(kpis.objTrafico), weight: 1 },
  ];

  let totalWeight = 0, weightedSum = 0, greenCount = 0, yellowCount = 0, redCount = 0;
  const metricHTML = [];
  metrics.forEach(m => {
    if (m.obj <= 0) return;
    const pct = Math.min(Math.round(m.val / m.obj * 100), 120);
    totalWeight += m.weight;
    weightedSum += Math.min(pct, 100) * m.weight;
    if (pct >= 90) greenCount++; else if (pct >= 70) yellowCount++; else redCount++;
    const color = pct >= 90 ? 'var(--success)' : pct >= 70 ? 'var(--warning)' : 'var(--danger)';
    const icon = pct >= 90 ? '🟢' : pct >= 70 ? '🟡' : '🔴';
    metricHTML.push(`<div class="hs-metric">
      <span class="hs-metric-icon">${icon}</span>
      <span class="hs-metric-label">${m.label}</span>
      <div class="hs-metric-bar"><div class="hs-metric-fill" style="width:${Math.min(pct,100)}%;background:${color}"></div></div>
      <span class="hs-metric-pct" style="color:${color}">${pct}%</span>
    </div>`);
  });

  const healthScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  const hasData = totalWeight > 0;
  const scoreColor = healthScore >= 85 ? 'var(--success)' : healthScore >= 65 ? 'var(--warning)' : 'var(--danger)';
  const scoreEmoji = healthScore >= 85 ? '🌟' : healthScore >= 65 ? '⚡' : '🔥';
  const scoreLabel = healthScore >= 85 ? 'Excelente' : healthScore >= 65 ? 'En progreso' : 'Necesita atención';

  /* SVG ring */
  const ringR = 42, ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC - (ringC * (hasData ? healthScore : 0) / 100);

  wrap.innerHTML = hasData ? `
    <div class="hs-grid">
      <div class="hs-ring-wrap">
        <svg viewBox="0 0 100 100" class="hs-ring-svg">
          <circle cx="50" cy="50" r="${ringR}" fill="none" stroke="var(--border)" stroke-width="6" opacity="0.3"/>
          <circle cx="50" cy="50" r="${ringR}" fill="none" stroke="${scoreColor}" stroke-width="6" stroke-linecap="round"
            stroke-dasharray="${ringC}" stroke-dashoffset="${ringOffset}" transform="rotate(-90 50 50)" class="hs-ring-progress"/>
        </svg>
        <div class="hs-ring-center">
          <div class="hs-ring-score" style="color:${scoreColor}">${healthScore}</div>
          <div class="hs-ring-label">${scoreEmoji} ${scoreLabel}</div>
        </div>
      </div>
      <div class="hs-details">
        <div class="hs-title">📊 Salud del Negocio <span class="hs-week-label">esta semana</span></div>
        <div class="hs-summary">
          <span class="hs-pill green">${greenCount} on track</span>
          <span class="hs-pill yellow">${yellowCount} en riesgo</span>
          <span class="hs-pill red">${redCount} crítico${redCount !== 1 ? 's' : ''}</span>
        </div>
        <div class="hs-metrics">${metricHTML.join('')}</div>
      </div>
    </div>` : `<div style="text-align:center;padding:16px;color:var(--text-secondary);font-size:13px">
      📊 Introduce datos en <strong>KPIs de Tienda</strong> para ver la Salud del Negocio</div>`;
}

/* ── Smart Insights: Auto-generated business intelligence ── */
function renderSmartInsights() {
  const wrap = document.getElementById('smart-insights');
  if (!wrap) return;
  const kpis = load(K.kpis, {});
  const history = load(K.kpiHistory, []);
  const insights = [];

  /* Helper to compute streaks */
  const getStreak = (key, objKey) => {
    let count = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      const v = num(history[i][key]), o = num(history[i][objKey]);
      if (o > 0 && v < o) count++; else break;
    }
    return count;
  };

  /* Check KPI trends from history */
  if (history.length >= 2) {
    const prev = history[history.length - 1];
    const compare = (key, label, higher) => {
      const curr = num(kpis[key]), prevVal = num(prev[key]);
      if (prevVal > 0 && curr > 0) {
        const diff = ((curr - prevVal) / prevVal * 100).toFixed(1);
        if (higher && curr > prevVal) insights.push({ type: 'positive', icon: '📈', text: `${label} subió un ${diff}% vs la semana anterior` });
        else if (higher && curr < prevVal) insights.push({ type: 'warning', icon: '📉', text: `${label} bajó un ${Math.abs(diff)}% vs la semana anterior` });
        else if (!higher && curr < prevVal) insights.push({ type: 'positive', icon: '📈', text: `${label} mejoró un ${Math.abs(diff)}% vs la semana anterior` });
      }
    };
    compare('ventas', 'Ventas', true);
    compare('nps', 'NPS', true);
    compare('conv', 'Conversión', true);
  }

  /* KPI streak warnings */
  const ventasStreak = getStreak('ventas', 'objVentas');
  if (ventasStreak >= 3) insights.push({ type: 'critical', icon: '🚨', text: `Ventas por debajo del objetivo ${ventasStreak} semanas consecutivas — requiere plan de acción` });
  const npsStreak = getStreak('nps', 'objNps');
  if (npsStreak >= 2) insights.push({ type: 'warning', icon: '⚠️', text: `NPS por debajo del objetivo ${npsStreak} semanas seguidas` });

  /* Check urgent tasks */
  const urgentTasks = tasks.filter(t => !t.done && t.pri === 'alta');
  if (urgentTasks.length > 5) insights.push({ type: 'warning', icon: '📋', text: `Tienes ${urgentTasks.length} tareas urgentes pendientes — considera priorizar o delegar` });

  /* Check 1:1s */
  if (window._tbRedCount > 3) insights.push({ type: 'warning', icon: '👤', text: `${window._tbRedCount} personas sin 1:1 reciente — agenda sesiones esta semana` });

  /* Check if KPIs are above target */
  const allAbove = ['ventas','nps','conv'].every(k => {
    const v = num(kpis[k]), o = num(kpis['obj' + k.charAt(0).toUpperCase() + k.slice(1)]);
    return o > 0 && v >= o;
  });
  if (allAbove && num(kpis.objVentas) > 0) insights.push({ type: 'positive', icon: '🎯', text: '¡Todos los KPIs principales están por encima del objetivo! Gran semana' });

  if (!insights.length) { wrap.innerHTML = ''; return; }

  wrap.innerHTML = `<div class="smart-insights-container">
    <div class="smart-insights-title">💡 Insights de la semana</div>
    ${insights.slice(0, 5).map(i => `
      <div class="smart-insight smart-insight--${i.type}">
        <span class="smart-insight-icon">${i.icon}</span>
        <span class="smart-insight-text">${esc(i.text)}</span>
      </div>
    `).join('')}
  </div>`;
}

/* ═══════════════════════════════════════════════
   REDESIGN — KPI HEALTH SUMMARY & INSIGHTS
═══════════════════════════════════════════════ */
function renderKPIHealthSummary() {
  const wrap = document.getElementById('kpi-health-summary');
  if (!wrap) return;
  const kpis = load(K.kpis, {});
  const allKPIs = [
    { key: 'ventas', label: 'Ventas',   val: num(kpis.ventas),   obj: num(kpis.objVentas) },
    { key: 'nps',    label: 'NPS',      val: num(kpis.nps),      obj: num(kpis.objNps) },
    { key: 'dta',    label: 'DTA',      val: num(kpis.dta),      obj: num(kpis.objDta) },
    { key: 'conv',   label: 'Conv.',    val: num(kpis.conv),     obj: num(kpis.objConv) },
    { key: 'trafico',label: 'Tráfico',  val: num(kpis.trafico),  obj: num(kpis.objTrafico) },
    { key: 'npsShop',label: 'NPS Shop', val: num(kpis.npsShop),  obj: num(kpis.objNpsShop) },
    { key: 'npsApu', label: 'NPS APU',  val: num(kpis.npsApu),   obj: num(kpis.objNpsApu) },
    { key: 'npsSupport',label:'NPS Sup',val: num(kpis.npsSupport),obj: num(kpis.objNpsSupport) },
  ].filter(k => k.obj > 0);
  if (!allKPIs.length) { wrap.innerHTML = ''; return; }

  let green = 0, yellow = 0, red = 0;
  allKPIs.forEach(k => {
    const pct = k.val / k.obj * 100;
    if (pct >= 90) green++; else if (pct >= 70) yellow++; else red++;
  });
  const total = allKPIs.length;
  const gPct = Math.round(green/total*100), yPct = Math.round(yellow/total*100), rPct = Math.round(red/total*100);

  wrap.innerHTML = `<div class="kpi-health-bar-wrap">
    <div class="kpi-health-bar-title">Estado de KPIs: <strong>${green}</strong> ✅ on track · <strong>${yellow}</strong> ⚠️ en riesgo · <strong>${red}</strong> 🔴 crítico</div>
    <div class="kpi-health-bar">
      ${gPct > 0 ? `<div class="kpi-health-segment green" style="width:${gPct}%" title="${green} on track"></div>` : ''}
      ${yPct > 0 ? `<div class="kpi-health-segment yellow" style="width:${yPct}%" title="${yellow} en riesgo"></div>` : ''}
      ${rPct > 0 ? `<div class="kpi-health-segment red" style="width:${rPct}%" title="${red} crítico"></div>` : ''}
    </div>
  </div>`;
}

function renderKPISmartInsights() {
  const wrap = document.getElementById('kpi-smart-insights');
  if (!wrap) return;
  const kpis = load(K.kpis, {});
  const history = load(K.kpiHistory, []);
  const tips = [];

  /* Best and worst KPI */
  const metrics = [
    { key: 'ventas', label: 'Ventas',    val: num(kpis.ventas),    obj: num(kpis.objVentas) },
    { key: 'nps',    label: 'NPS',       val: num(kpis.nps),       obj: num(kpis.objNps) },
    { key: 'conv',   label: 'Conversión',val: num(kpis.conv),      obj: num(kpis.objConv) },
    { key: 'trafico',label: 'Tráfico',   val: num(kpis.trafico),   obj: num(kpis.objTrafico) },
  ].filter(m => m.obj > 0);

  if (metrics.length) {
    const best = metrics.reduce((a, b) => (a.val/a.obj > b.val/b.obj ? a : b));
    const worst = metrics.reduce((a, b) => (a.val/a.obj < b.val/b.obj ? a : b));
    const bestPct = Math.round(best.val / best.obj * 100);
    const worstPct = Math.round(worst.val / worst.obj * 100);
    if (bestPct >= 90) tips.push({ icon: '🏆', text: `<strong>${esc(best.label)}</strong> lidera al ${bestPct}% del objetivo`, type: 'positive' });
    if (worstPct < 80) tips.push({ icon: '🎯', text: `<strong>${esc(worst.label)}</strong> necesita foco (${worstPct}% del objetivo)`, type: 'warning' });
  }

  /* WoW improvement */
  if (num(kpis.wowVentas) > 0) {
    const diff = ((num(kpis.ventas) - num(kpis.wowVentas)) / num(kpis.wowVentas) * 100).toFixed(1);
    if (diff > 5) tips.push({ icon: '📈', text: `Ventas <strong>+${diff}%</strong> vs semana anterior — ¡buen momentum!`, type: 'positive' });
    else if (diff < -5) tips.push({ icon: '📉', text: `Ventas <strong>${diff}%</strong> vs semana anterior — identifica la causa`, type: 'warning' });
  }

  /* History-based projection */
  if (history.length >= 3) {
    const recent = history.slice(-3);
    const ventasTrend = recent.map(h => num(h.ventas));
    const avgChange = (ventasTrend[2] - ventasTrend[0]) / 2;
    if (avgChange > 0 && num(kpis.objVentas) > 0) {
      const weeksToTarget = num(kpis.objVentas) > num(kpis.ventas) ? Math.ceil((num(kpis.objVentas) - num(kpis.ventas)) / avgChange) : 0;
      if (weeksToTarget > 0 && weeksToTarget <= 4) tips.push({ icon: '🔮', text: `Al ritmo actual, alcanzarás el objetivo de ventas en ~${weeksToTarget} semana${weeksToTarget > 1 ? 's' : ''}`, type: 'info' });
    }
  }

  if (!tips.length) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = `<div class="kpi-insights-wrap">
    ${tips.slice(0, 3).map(t => `<div class="kpi-insight kpi-insight--${t.type}">${t.icon} ${t.text}</div>`).join('')}
  </div>`;
}

/* ═══════════════════════════════════════════════
   REDESIGN — QBR HEALTH DASHBOARD
═══════════════════════════════════════════════ */
function renderQBRHealthDashboard() {
  const wrap = document.getElementById('qbr-health-dashboard');
  if (!wrap) return;
  const data = typeof _qbrLoad === 'function' ? _qbrLoad() : {};
  const selEl = document.getElementById('qbr-quarter-select');
  const currentQ = selEl ? selEl.value : null;
  if (!currentQ || !data[currentQ]) { wrap.innerHTML = ''; return; }
  const entry = data[currentQ];
  const areas = entry.areas || {};
  const areaNames = { general: '🏪 General', shopping: '🛍️ Shopping', business: '💼 Business', support: '🛠️ Support', taa: '📲 T@A', people: '👥 People' };

  /* Count KPIs per area and compute fill rates */
  const areaCards = Object.entries(areaNames).map(([key, label]) => {
    const areaData = areas[key] || {};
    const kpiValues = areaData.kpis || {};
    const filled = Object.values(kpiValues).filter(v => v && num(v) > 0).length;
    const total = Object.keys(kpiValues).length || 1;
    const pct = Math.round(filled / total * 100);
    const hasNotes = (areaData.notas || '').trim().length > 0;
    const hasHighlights = (areaData.highlights || '').trim().length > 0;
    const completeness = [filled > 0, hasNotes, hasHighlights].filter(Boolean).length;
    const compPct = Math.round(completeness / 3 * 100);
    const color = compPct >= 80 ? 'var(--success)' : compPct >= 40 ? 'var(--warning)' : 'var(--danger)';
    return `<div class="qbr-health-area">
      <div class="qbr-health-area-label">${label}</div>
      <div class="qbr-health-area-ring">
        <svg viewBox="0 0 36 36" class="qbr-mini-ring">
          <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border)" stroke-width="3" opacity="0.2"/>
          <circle cx="18" cy="18" r="15" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"
            stroke-dasharray="${94.2}" stroke-dashoffset="${94.2 - 94.2 * compPct / 100}" transform="rotate(-90 18 18)"/>
        </svg>
        <span class="qbr-mini-ring-text" style="color:${color}">${compPct}%</span>
      </div>
      <div class="qbr-health-area-meta">
        ${filled > 0 ? '✅ KPIs' : '❌ KPIs'} · ${hasNotes ? '✅ Notas' : '❌ Notas'} · ${hasHighlights ? '✅ Highlights' : '❌ Highlights'}
      </div>
    </div>`;
  });

  /* Overall completion */
  const totalAreas = Object.keys(areaNames).length;
  const filledAreas = Object.entries(areaNames).filter(([key]) => {
    const a = areas[key] || {};
    return Object.values(a.kpis || {}).some(v => num(v) > 0) || (a.notas || '').trim() || (a.highlights || '').trim();
  }).length;
  const overallPct = Math.round(filledAreas / totalAreas * 100);
  const overallColor = overallPct >= 80 ? 'var(--success)' : overallPct >= 50 ? 'var(--warning)' : 'var(--danger)';

  wrap.innerHTML = `<div class="card" style="border:2px solid ${overallColor};background:linear-gradient(135deg,var(--surface),var(--surface2))">
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;flex-wrap:wrap">
      <div>
        <div class="card-title" style="margin-bottom:2px">🏥 Salud del QBR — ${esc(currentQ)}</div>
        <div style="font-size:13px;color:var(--text-secondary)">${filledAreas}/${totalAreas} áreas con datos · ${entry.estado === 'cerrado' ? '🔒 Cerrado' : '🟢 Activo'}</div>
      </div>
      <div style="margin-left:auto;text-align:center">
        <div style="font-size:32px;font-weight:800;color:${overallColor}">${overallPct}%</div>
        <div style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;font-weight:600">Completado</div>
      </div>
    </div>
    <div class="qbr-health-grid">${areaCards.join('')}</div>
    ${entry.resumenGeneral ? `<div style="margin-top:14px;padding:12px;background:var(--surface2);border-radius:var(--radius-sm);border-left:3px solid var(--accent);font-size:13px;color:var(--text-secondary)">
      <strong>Resumen:</strong> ${esc(entry.resumenGeneral).substring(0, 200)}${entry.resumenGeneral.length > 200 ? '…' : ''}
    </div>` : ''}
  </div>`;
}

/* ═══════════════════════════════════════════════
   REDESIGN — COMMITMENTS PROGRESS OVERVIEW
═══════════════════════════════════════════════ */
function renderCommitmentsProgress() {
  const wrap = document.getElementById('commitments-progress-overview');
  if (!wrap) return;
  const qSel = document.getElementById('commitments-quarter-select');
  const quarter = qSel ? qSel.value : null;
  if (!quarter) { wrap.innerHTML = ''; return; }
  const allData = load(K.commitments, {});
  const qData = allData[quarter];
  if (!qData || !qData.kpis) { wrap.innerHTML = ''; return; }
  const kpis = qData.kpis;

  /* KPI definitions for the 3 areas */
  const areas = [
    { name: '🟢 Crecimiento', color: '#4a9d6f', kpis: ['customer-impacting','timely-assistance','dropin-conversion','geniusbar-conversion','first-account'] },
    { name: '🔵 Experiencia', color: '#0071e3', kpis: ['nps-shared-feature','mac-instore-repair','delivered-dropin'] },
    { name: '🟣 Equipos', color: '#bf5af2', kpis: ['training-completion','coach-connections','pulse-action-plan'] },
  ];

  const ringHTML = areas.map(area => {
    let hasData = 0, improved = 0;
    area.kpis.forEach(k => {
      const d = kpis[k];
      if (d && (d.anterior || d.actual)) {
        hasData++;
        if (num(d.actual) > num(d.anterior)) improved++;
      }
    });
    const pct = hasData > 0 ? Math.round(improved / hasData * 100) : 0;
    const r = 28, c = 2 * Math.PI * r;
    const offset = c - (c * pct / 100);
    const actCount = area.kpis.filter(k => kpis[k] && kpis[k].actual).length;

    return `<div class="cp-area-card" style="border-left:4px solid ${area.color}">
      <div class="cp-area-ring">
        <svg viewBox="0 0 70 70">
          <circle cx="35" cy="35" r="${r}" fill="none" stroke="var(--border)" stroke-width="4" opacity="0.2"/>
          <circle cx="35" cy="35" r="${r}" fill="none" stroke="${area.color}" stroke-width="4" stroke-linecap="round"
            stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}" transform="rotate(-90 35 35)"/>
        </svg>
        <span class="cp-ring-text" style="color:${area.color}">${pct}%</span>
      </div>
      <div class="cp-area-info">
        <div class="cp-area-name">${area.name}</div>
        <div class="cp-area-detail">${improved}/${hasData} KPIs mejorando · ${actCount}/${area.kpis.length} con datos</div>
      </div>
    </div>`;
  });

  /* Overall improvement */
  let totalHas = 0, totalImp = 0;
  areas.forEach(a => a.kpis.forEach(k => {
    const d = kpis[k];
    if (d && (d.anterior || d.actual)) { totalHas++; if (num(d.actual) > num(d.anterior)) totalImp++; }
  }));
  const totalPct = totalHas > 0 ? Math.round(totalImp / totalHas * 100) : 0;
  const tColor = totalPct >= 60 ? 'var(--success)' : totalPct >= 30 ? 'var(--warning)' : 'var(--danger)';

  wrap.innerHTML = `<div class="card" style="background:linear-gradient(135deg,var(--surface),var(--surface2));border:2px solid ${tColor}">
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:14px;flex-wrap:wrap">
      <div>
        <div class="card-title" style="margin-bottom:2px">📊 Progreso Commitments — ${esc(quarter)}</div>
        <div style="font-size:13px;color:var(--text-secondary)">${totalImp}/${totalHas} KPIs mejorando vs periodo anterior</div>
      </div>
      <div style="margin-left:auto;text-align:center">
        <div style="font-size:28px;font-weight:800;color:${tColor}">${totalPct}%</div>
        <div style="font-size:10px;color:var(--text-secondary);text-transform:uppercase;font-weight:600">Mejorando</div>
      </div>
    </div>
    <div class="cp-grid">${ringHTML.join('')}</div>
  </div>`;
}

/* ═══════════════════════════════════════════════
   REDESIGN — TIMELINE CURRENT WEEK HIGHLIGHT
═══════════════════════════════════════════════ */
function highlightTimelineCurrentWeek() {
  /* Find the current week column and add a visual highlight */
  const table = document.querySelector('#commitments-timeline-content table');
  if (!table) return;
  const today = new Date();
  const headerCells = table.querySelectorAll('thead th');
  if (!headerCells.length) return;

  /* Parse week dates from headers — format: "Mar 30", "Apr 6" etc. */
  const monthMap = { 'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5, 'jul': 6,
    'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11,
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6,
    'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11 };
  let currentWeekIdx = -1;
  headerCells.forEach((th, idx) => {
    if (idx < 2) return; /* skip group + category columns */
    const text = th.textContent.trim();
    const match = text.match(/(\w+)\s+(\d+)/);
    if (match) {
      const mon = monthMap[match[1]];
      const day = parseInt(match[2]);
      if (mon !== undefined) {
        const year = today.getFullYear();
        const weekStart = new Date(year, mon, day);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        if (today >= weekStart && today <= weekEnd) currentWeekIdx = idx;
      }
    }
  });

  if (currentWeekIdx >= 0) {
    /* Highlight header */
    headerCells[currentWeekIdx].classList.add('tl-current-week');
    /* Highlight column cells */
    table.querySelectorAll('tbody tr').forEach(tr => {
      let cellIdx = 0;
      tr.querySelectorAll('td').forEach(td => {
        const colspan = parseInt(td.getAttribute('colspan') || '1');
        if (cellIdx === currentWeekIdx || (cellIdx < currentWeekIdx && cellIdx + colspan > currentWeekIdx)) {
          td.classList.add('tl-current-week-cell');
        }
        cellIdx += colspan;
      });
    });
  }
}

/* ═══════════════════════════════════════════════
   REDESIGN — ENHANCED ROUTINE WITH CONTEXT
═══════════════════════════════════════════════ */
function renderRoutineContextCard() {
  /* Add KPI context to the routine when it's on step 2 or higher */
  const el = document.getElementById('routine-context-kpi');
  if (!el) return;
  const kpis = load(K.kpis, {});
  const metrics = [
    { label: 'Ventas', val: kpis.ventas, obj: kpis.objVentas, emoji: '💰' },
    { label: 'NPS', val: kpis.nps, obj: kpis.objNps, emoji: '⭐' },
    { label: 'Conv.', val: kpis.conv, obj: kpis.objConv, emoji: '🔄' },
  ];
  const hasData = metrics.some(m => num(m.obj) > 0);
  if (!hasData) { el.innerHTML = ''; return; }
  el.innerHTML = `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
    ${metrics.filter(m => num(m.obj) > 0).map(m => {
      const pct = Math.round(num(m.val) / num(m.obj) * 100);
      const color = pct >= 90 ? 'var(--success)' : pct >= 70 ? 'var(--warning)' : 'var(--danger)';
      return `<div style="flex:1;min-width:80px;text-align:center;padding:8px;background:var(--surface2);border-radius:var(--radius-sm)">
        <div style="font-size:18px;font-weight:700;color:${color}">${m.val || '—'}</div>
        <div style="font-size:10px;color:var(--text-secondary)">${m.emoji} ${m.label} (${pct}%)</div>
      </div>`;
    }).join('')}
  </div>`;
}

/* ═══════════════════════════════════════════════ */
function prepararReunion(reunionId) {
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

function closePrepReunionModal() {
  const overlay = document.getElementById('prep-reunion-overlay');
  if (overlay) overlay.classList.remove('open');
}

/* ═══════════════════════════════════════════════
   F3 — MISSION CONTROL "ESTA SEMANA"
═══════════════════════════════════════════════ */
function renderMissionControl() {
  const wrap = document.getElementById('mission-control-wrap');
  if (!wrap) return;
  const today = new Date().toISOString().split('T')[0];
  const todayEvents = events.filter(e => e.date === today);
  const highTasks = tasks.filter(t => !t.done && t.pri === 'alta')
    .sort((a, b) => (a.date || '9999') < (b.date || '9999') ? -1 : 1)
    .slice(0, 3);
  const kpis = load(K.kpis, {});
  const kpiList = [
    { label: 'Ventas',   val: kpis.ventas,   obj: kpis.objVentas },
    { label: 'NPS',      val: kpis.nps,      obj: kpis.objNps },
    { label: 'DTA',      val: kpis.dta,      obj: kpis.objDta },
    { label: 'Conv.',    val: kpis.conv,     obj: kpis.objConv },
    { label: 'Tráfico',  val: kpis.trafico,  obj: kpis.objTrafico },
  ];
  let worstKpi = null, worstDev = Infinity;
  kpiList.forEach(k => {
    const v = num(k.val), o = num(k.obj);
    if (o > 0) {
      const dev = v / o;
      if (dev < worstDev) { worstDev = dev; worstKpi = k; }
    }
  });

  const blockStyle = 'background:var(--surface2);border-radius:var(--radius);padding:14px;';
  const blockTitle = t => `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);margin-bottom:8px">${t}</div>`;

  // Block 1: Today events
  const evHTML = todayEvents.length
    ? todayEvents.map(e => `<div style="font-size:13px;padding:3px 0;border-bottom:1px solid var(--border)">${esc(e.time||'')} ${esc(e.title)}</div>`).join('')
    : `<div style="font-size:12px;color:var(--text-secondary)">Sin eventos hoy</div>`;

  // Block 2: High-priority tasks
  const taskHTML = highTasks.length
    ? highTasks.map(t => `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid var(--border)">
        <input type="checkbox" onchange="toggleTask(${t.id})" style="flex-shrink:0">
        <span style="font-size:13px">${esc(t.text)}</span>
      </div>`).join('')
    : `<div style="font-size:12px;color:var(--success)">¡No hay tareas urgentes!</div>`;

  // Block 3: Worst KPI
  const kpiHTML = worstKpi
    ? `<div style="font-size:22px;font-weight:700;color:var(--danger)">${worstKpi.val || '—'}</div>
       <div style="font-size:12px;color:var(--text-secondary)">${esc(worstKpi.label)} · Obj: ${worstKpi.obj || '—'}</div>
       <div style="font-size:12px;color:var(--danger);margin-top:2px">${Math.round(worstDev * 100)}% del objetivo</div>`
    : `<div style="font-size:12px;color:var(--text-secondary)">Sin datos KPI</div>`;

  wrap.innerHTML = `
    <div style="${blockStyle}">${blockTitle('📅 Hoy')}${evHTML}</div>
    <div style="${blockStyle}">${blockTitle('✅ Tareas prioritarias')}${taskHTML}</div>
    <div style="${blockStyle}">${blockTitle('📊 KPI crítico')}${kpiHTML}</div>`;
}

/* ═══════════════════════════════════════════════
   F4 — INFORME SEMANAL EXPORTABLE
═══════════════════════════════════════════════ */
function generarInformeSemanal() {
  const today = new Date();
  const dow = today.getDay();
  const mon = new Date(today); mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const fmtFull = d => d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  const weekStr = `${fmtFull(mon)} – ${fmtFull(sun)}`;
  const genDate = today.toLocaleDateString('es-ES', { dateStyle: 'long' });
  const monStr = mon.toISOString().slice(0, 10);
  const sunStr = sun.toISOString().slice(0, 10);

  // KPIs
  const kpis = load(K.kpis, {});
  const history = load(K.kpiHistory, []);
  const prevWeekMon = new Date(mon); prevWeekMon.setDate(mon.getDate() - 7);
  const prevWeekMonStr = prevWeekMon.toISOString().slice(0, 10);
  const prevEntry = history.find(h => h.date >= prevWeekMonStr && h.date < monStr);
  const kpiMetrics = [
    { name: 'Ventas',   val: kpis.ventas,   obj: kpis.objVentas,  prev: prevEntry?.ventas },
    { name: 'NPS',      val: kpis.nps,      obj: kpis.objNps,     prev: prevEntry?.nps },
    { name: 'DTA',      val: kpis.dta,      obj: kpis.objDta,     prev: prevEntry?.dta },
    { name: 'Conversión', val: kpis.conv,   obj: kpis.objConv,    prev: prevEntry?.conv },
    { name: 'Tráfico',  val: kpis.trafico,  obj: kpis.objTrafico, prev: prevEntry?.trafico },
  ];
  const kpiRows = kpiMetrics.map(k => {
    const v = num(k.val), o = num(k.obj), p = num(k.prev);
    const pct = o > 0 ? Math.round(v / o * 100) : 0;
    const varStr = p > 0 ? ((v - p) / p * 100).toFixed(1) + '%' : '—';
    const varColor = p > 0 && v >= p ? '#28a745' : '#dc3545';
    return `<tr>
      <td style="padding:6px 10px;border-bottom:1px solid #eee">${k.name}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${k.val || '—'}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${k.obj || '—'}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${pct}%</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;color:${varColor}">${varStr}</td>
    </tr>`;
  }).join('');

  // Tasks this week
  const completedThisWeek = tasks.filter(t => t.done && t.completedDate >= monStr && t.completedDate <= sunStr);
  const pendingHigh = tasks.filter(t => !t.done && t.pri === 'alta');
  const taskRows = completedThisWeek.map(t => `<li>${t.text}</li>`).join('') || '<li>Ninguna</li>';
  const pendRows = pendingHigh.slice(0, 10).map(t => `<li>${t.text}</li>`).join('') || '<li>Ninguna</li>';

  // Pulse
  const pulseData = load(K.pulse, []);
  const weekPulse = pulseData.find(p => p.weekStart >= monStr) || pulseData[pulseData.length - 1];
  const pulseSection = weekPulse
    ? `<div style="display:flex;gap:24px;margin-top:8px">
        <div><strong>${weekPulse.energy}/5</strong><div style="font-size:12px;color:#666">⚡ Energía</div></div>
        <div><strong>${weekPulse.momentum}/5</strong><div style="font-size:12px;color:#666">🚀 Momentum</div></div>
        <div><strong>${weekPulse.climate}/5</strong><div style="font-size:12px;color:#666">🌤️ Clima</div></div>
      </div>${weekPulse.tensions ? `<p style="font-size:12px;color:#666;margin-top:8px">Tensiones: ${weekPulse.tensions}</p>` : ''}`
    : '<p style="color:#666">Sin Pulse Check esta semana</p>';

  // Feedback del cliente
  const verbatims = load(K_VC, []).slice(0, 3);
  const verbRows = verbatims.map(v => `<li style="margin-bottom:6px">"${v.text}" <span style="color:#666;font-size:12px">— ${v.date||''}</span></li>`).join('') || '<li>Sin feedback del cliente</li>';

  // Reconocimientos
  const recogs = load(K.reconocimientos, []).filter(r => r.date >= monStr && r.date <= sunStr);
  const recogRows = recogs.map(r => `<li>${r.text || r.message || JSON.stringify(r)}</li>`).join('') || '<li>Sin reconocimientos esta semana</li>';

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Informe Semanal — Apple Passeig de Gràcia</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1d1d1f;max-width:800px;margin:40px auto;padding:0 20px;font-size:14px;line-height:1.6}
  h1{font-size:26px;font-weight:700;margin-bottom:4px}
  h2{font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#666;margin:24px 0 10px;padding-bottom:6px;border-bottom:2px solid #eee}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{padding:6px 10px;background:#f5f5f7;text-align:left;font-size:12px;color:#666}
  .print-btn{display:block;margin:24px auto;padding:10px 28px;background:#0071e3;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-weight:600}
  @media print{.print-btn{display:none}}
</style>
</head>
<body>
  <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
    <div style="font-size:36px">&#63743;</div>
    <div>
      <h1>Apple Passeig de Gràcia</h1>
      <div style="color:#666">Informe semanal · ${weekStr}</div>
      <div style="color:#999;font-size:12px">Generado el ${genDate}</div>
    </div>
  </div>
  <h2>📊 KPIs de la semana</h2>
  <table>
    <thead><tr>
      <th>Métrica</th><th>Actual</th><th>Objetivo</th><th>% Obj.</th><th>Var. s/s</th>
    </tr></thead>
    <tbody>${kpiRows}</tbody>
  </table>
  <h2>✅ Tareas</h2>
  <p style="color:#666;font-size:12px;margin-bottom:4px">Completadas esta semana (${completedThisWeek.length})</p>
  <ul>${taskRows}</ul>
  <p style="color:#666;font-size:12px;margin-bottom:4px">Alta prioridad pendientes (${pendingHigh.length})</p>
  <ul>${pendRows}</ul>
  <h2>💓 Pulse Check del equipo</h2>
  ${pulseSection}
  <h2>🗣️ Top 3 feedback del cliente</h2>
  <ul>${verbRows}</ul>
  <h2>🏆 Reconocimientos de la semana</h2>
  <ul>${recogRows}</ul>
  <button class="print-btn" onclick="window.print()">🖨️ Imprimir</button>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
}

/* ═══════════════════════════════════════════════
   F5 — EISENHOWER MATRIX
═══════════════════════════════════════════════ */
let _taskView = load('apg_eisenhower_view', 'lista');
let _routineTaskView = load('apg_routine_eis_view', 'lista');

function setTaskView(mode) {
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

function isUrgente(t) {
  if (t.urgente !== undefined) return !!t.urgente;
  if (!t.date) return false;
  const today = new Date().toISOString().split('T')[0];
  return t.date <= today;
}

function isImportante(t) {
  if (t.importante !== undefined) return !!t.importante;
  return t.pri === 'alta';
}

function renderEisenhower() {
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

  // Labels
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

let _eisDragTaskId = null;
function eisDragStart(e, taskId) {
  _eisDragTaskId = taskId;
  e.dataTransfer.effectAllowed = 'move';
  e.stopPropagation();
}
function eisDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('eis-drag-over');
}
function eisDragLeave(e) {
  e.currentTarget.classList.remove('eis-drag-over');
}
function eisDrop(e, urgente, importante) {
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

function setRoutineTaskView(mode) {
  _routineTaskView = mode;
  save('apg_routine_eis_view', mode);
  renderRoutineStep(3);
}

function renderRoutineEisenhower(weekStart) {
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
          <input type="checkbox" style="margin-top:2px;flex-shrink:0;accent-color:var(--accent)" onchange="toggleTask(${t.id});renderRoutineStep(3)">
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

let _routineEisDragTaskId = null;
function routineEisDragStart(e, taskId) {
  _routineEisDragTaskId = taskId;
  e.dataTransfer.effectAllowed = 'move';
  e.stopPropagation();
}
function routineEisDrop(e, urgente, importante, weekStart) {
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
  renderRoutineStep(3);
}

/* Hook into existing init flow — extend renderTasks and addTask */
(function patchFeatures() {
  // Patch renderTasks to also update eisenhower if active
  const _origRenderTasks = renderTasks;
  window.renderTasks = function() {
    _origRenderTasks();
    if (typeof _taskView !== 'undefined' && _taskView === 'eisenhower') renderEisenhower();
  };

  // Patch addTask to capture urgente/importante
  const _origAddTask = addTask;
  window.addTask = function() {
    const txt = document.getElementById('new-task').value.trim();
    if (!txt) return;
    const urgente = document.getElementById('new-task-urgente')?.checked || false;
    const importante = document.getElementById('new-task-importante')?.checked || false;
    _origAddTask();
    // Set fields on the just-added task (last one)
    const last = tasks[tasks.length - 1];
    if (last) { last.urgente = urgente; last.importante = importante; saveTasks(); }
    const uel = document.getElementById('new-task-urgente');
    const iel = document.getElementById('new-task-importante');
    if (uel) uel.checked = false;
    if (iel) iel.checked = false;
  };

  // Re-init after all variables are loaded (handles the initGroupFromURL first run)
  if (document.getElementById('tab-resumen')?.classList.contains('active')) {
    renderMissionControl();
    renderRadarChart();
    renderResumenKPIs();
  }
})();

/* ═══════════════════════════════════════════════
   BACKUP — Exportar / Importar / Borrar datos
═══════════════════════════════════════════════ */
function exportData() {
  try {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('apg_')) {
        try { data[key] = JSON.parse(localStorage.getItem(key)); }
        catch(e) { data[key] = localStorage.getItem(key); }
      }
    }
    const payload = { version: 1, exportedAt: new Date().toISOString(), data };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    const fecha = new Date().toISOString().slice(0, 10);
    a.href     = url;
    a.download = `dashboard-backup-${fecha}.json`;
    a.click();
    URL.revokeObjectURL(url);
    localStorage.setItem('apg_last_backup', Date.now());
    showToast('✅ Backup exportado correctamente');
  } catch(e) {
    showToast('❌ Error al exportar el backup');
  }
}

function importData() {
  const input = document.createElement('input');
  input.type   = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.data || typeof parsed.data !== 'object') {
          showToast('❌ Error al importar el backup');
          return;
        }
        if (!confirm('¿Seguro? Esto sobreescribirá todos tus datos actuales.')) return;
        Object.keys(parsed.data).filter(k => k.startsWith('apg_')).forEach(key => {
          try { localStorage.setItem(key, JSON.stringify(parsed.data[key])); }
          catch(err) { console.warn('No se pudo importar clave:', key, err); }
        });
        location.reload();
      } catch(e) {
        showToast('❌ Error al importar el backup');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function clearAllData() {
  if (!confirm('⚠️ ¿Seguro que quieres borrar TODOS los datos del dashboard?')) return;
  if (!confirm('Esta acción es irreversible. ¿Confirmas que quieres eliminar todos los datos?')) return;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('apg_')) keys.push(key);
  }
  keys.forEach(key => localStorage.removeItem(key));
  location.reload();
}

/* ═══════════════════════════════════════════════
   COMMITMENTS Q
═══════════════════════════════════════════════ */
function initCommitmentsQuarterSelect() {
  const sel = document.getElementById('commitments-quarter-select');
  if (!sel || typeof QUARTERS_CONFIG === 'undefined') return;
  sel.innerHTML = QUARTERS_CONFIG.map(q =>
    `<option value="${q.key}"${q.activo ? ' selected' : ''}>${q.label}</option>`
  ).join('');
}

function initTLQuarterSelect() {
  const sel = document.getElementById('tl-quarter-select');
  if (!sel || typeof QUARTERS_CONFIG === 'undefined') return;
  sel.innerHTML = QUARTERS_CONFIG.map(q =>
    `<option value="${q.key}"${q.activo ? ' selected' : ''}>${q.label}</option>`
  ).join('');
}

function getCurrentCommitmentsQuarter() {
  const sel = document.getElementById('commitments-quarter-select');
  if (sel) return sel.value;
  if (typeof QUARTERS_CONFIG !== 'undefined') {
    const active = QUARTERS_CONFIG.find(q => q.activo);
    if (active) return active.key;
  }
  return 'Q3-FY26';
}

function saveCommitmentsKPI(kpiId, period, value) {
  const quarter = getCurrentCommitmentsQuarter();
  const data = load(K.commitments, {});
  if (!data[quarter]) data[quarter] = { kpis: {}, acciones: {} };
  if (!data[quarter].kpis) data[quarter].kpis = {};
  if (!data[quarter].kpis[kpiId]) data[quarter].kpis[kpiId] = {};
  data[quarter].kpis[kpiId][period] = value;
  save(K.commitments, data);
  renderCommitmentsKPITrend(kpiId,
    data[quarter].kpis[kpiId].anterior || '',
    data[quarter].kpis[kpiId].actual   || '');
  flash('commitments-saved');
  renderCommitmentsKPIsMirror();
}

function renderCommitmentsKPITrend(kpiId, anteriorStr, actualStr) {
  const trendEl = document.getElementById('trend-' + kpiId);
  const arrowEl = document.getElementById('arrow-' + kpiId);
  if (!trendEl) return;
  if (!anteriorStr || !actualStr) {
    trendEl.textContent = '';
    if (arrowEl) { arrowEl.textContent = '→'; arrowEl.style.color = ''; }
    return;
  }
  const anterior = num(anteriorStr);
  const actual   = num(actualStr);
  if (anterior === 0) {
    trendEl.textContent = '';
    if (arrowEl) { arrowEl.textContent = '→'; arrowEl.style.color = ''; }
    return;
  }
  const diff = ((actual - anterior) / Math.abs(anterior)) * 100;
  const sign = diff >= 0 ? '+' : '';
  trendEl.textContent = sign + diff.toFixed(1) + '%';
  trendEl.style.color = diff >= 0 ? 'var(--success)' : 'var(--danger)';
  if (arrowEl) {
    arrowEl.textContent = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
    arrowEl.style.color = diff > 0 ? 'var(--success)' : diff < 0 ? 'var(--danger)' : '';
  }
}

function renderCommitmentsAcciones(areaId, accionesList) {
  const listEl = document.getElementById('acciones-' + areaId);
  if (!listEl) return;
  if (!accionesList || !accionesList.length) {
    listEl.innerHTML = '<div style="font-size:12px;color:var(--text-secondary);padding:6px 0">Sin acciones definidas aún.</div>';
    return;
  }
  listEl.innerHTML = accionesList.map(a =>
    `<div class="commitments-accion-item">
      <span class="commitments-accion-text">${esc(a.text)}</span>
      <button class="commitments-accion-delete" onclick="deleteCommitmentsAccion('${esc(areaId)}', ${a.id})" title="Eliminar">✕</button>
    </div>`
  ).join('');
}

function addCommitmentsAccion(areaId) {
  const inputEl = document.getElementById('nueva-accion-' + areaId);
  if (!inputEl) return;
  const text = (inputEl.value || '').trim();
  if (!text) return;
  const quarter = getCurrentCommitmentsQuarter();
  const data = load(K.commitments, {});
  if (!data[quarter]) data[quarter] = { kpis: {}, acciones: {} };
  if (!data[quarter].acciones) data[quarter].acciones = {};
  if (!data[quarter].acciones[areaId]) data[quarter].acciones[areaId] = [];
  data[quarter].acciones[areaId].push({ id: Date.now(), text });
  save(K.commitments, data);
  renderCommitmentsAcciones(areaId, data[quarter].acciones[areaId]);
  inputEl.value = '';
  flash('commitments-saved');
}

function deleteCommitmentsAccion(areaId, id) {
  const quarter = getCurrentCommitmentsQuarter();
  const data = load(K.commitments, {});
  if (!data[quarter] || !data[quarter].acciones || !data[quarter].acciones[areaId]) return;
  data[quarter].acciones[areaId] = data[quarter].acciones[areaId].filter(a => a.id !== id);
  save(K.commitments, data);
  renderCommitmentsAcciones(areaId, data[quarter].acciones[areaId]);
}

function loadCommitmentsQuarter(quarter) {
  if (!quarter) quarter = getCurrentCommitmentsQuarter();
  const data = load(K.commitments, {});
  const qData = data[quarter] || { kpis: {}, acciones: {} };

  // KPIs con anterior + actual
  const kpisDoble = [
    'customer-impacting', 'timely-assistance', 'dropin-conversion',
    'geniusbar-conversion', 'first-account', 'nps-shared-feature',
    'mac-instore-repair', 'delivered-dropin'
  ];
  kpisDoble.forEach(kpiId => {
    const kpi = (qData.kpis && qData.kpis[kpiId]) || {};
    const antEl = document.getElementById('kpi-val-' + kpiId + '-anterior');
    const actEl = document.getElementById('kpi-val-' + kpiId + '-actual');
    if (antEl) antEl.value = kpi.anterior || '';
    if (actEl) actEl.value = kpi.actual   || '';
    renderCommitmentsKPITrend(kpiId, kpi.anterior || '', kpi.actual || '');
  });

  // KPIs solo actual
  const kpisSolo = ['training-completion', 'coach-connections', 'pulse-action-plan'];
  kpisSolo.forEach(kpiId => {
    const kpi = (qData.kpis && qData.kpis[kpiId]) || {};
    const actEl = document.getElementById('kpi-val-' + kpiId + '-actual');
    if (actEl) actEl.value = kpi.actual || '';
    const trendEl = document.getElementById('trend-' + kpiId);
    if (trendEl) trendEl.textContent = '';
  });

  // Acciones por área
  const areas = ['impulsar-crecimiento', 'experiencias-apple', 'equipos-formacion'];
  areas.forEach(areaId => {
    const acciones = (qData.acciones && qData.acciones[areaId]) || [];
    renderCommitmentsAcciones(areaId, acciones);
  });
  try { renderCommitmentsProgress(); } catch(e) {}
}

/* ═══════════════════════════════════════════════
   COMMITMENTS INFO MODAL
═══════════════════════════════════════════════ */
function openCommitmentsInfoModal() {
  const overlay = document.getElementById('commitments-info-modal-overlay');
  const body = document.getElementById('commitments-info-modal-body');
  if (!overlay || !body) return;

  const q = getCurrentCommitmentsQuarter();
  const data = (typeof COMMITMENTS_DATA !== 'undefined' && COMMITMENTS_DATA[q]) ? COMMITMENTS_DATA[q] : null;
  if (!data) {
    body.innerHTML = '<p style="color:var(--text-secondary);font-size:13px;padding:12px 0">Datos no disponibles.</p>';
  } else {
    body.innerHTML = data.areas.map(area => `
      <div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid var(--border)">
        <div style="font-size:16px;font-weight:700;color:${area.color};margin-bottom:6px">${area.titulo}</div>
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:14px">${area.descripcion}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:14px">
          ${area.subcategorias.map(s => `
            <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px">
              <div style="font-size:11px;font-weight:700;color:${area.color};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">${s.nombre}</div>
              <div style="font-size:12px;color:var(--text-secondary);line-height:1.5">${s.descripcion}</div>
            </div>
          `).join('')}
        </div>
        ${area.otrosIndicadores && area.otrosIndicadores.length ? `
          <div style="font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Otros indicadores de seguimiento</div>
          <ul style="margin:0;padding-left:18px;font-size:12px;color:var(--text-secondary);line-height:1.8">
            ${area.otrosIndicadores.map(o => `<li>${o}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `).join('');
  }

  overlay.style.display = 'flex';
}

function closeCommitmentsInfoModal() {
  const overlay = document.getElementById('commitments-info-modal-overlay');
  if (overlay) overlay.style.display = 'none';
}

/* ═══════════════════════════════════════════════
   COMMITMENTS TIMELINE — CALENDAR GRID
═══════════════════════════════════════════════ */

/* ── Week headers (col 0 = index 0 = Mar 30) ── */
const TL_WEEKS = [
  'Mar 30','Abr 6','Abr 13','Abr 20','Abr 27',
  'May 4','May 11','May 18','May 25',
  'Jun 1','Jun 8','Jun 15','Jun 22'
];

/* ── Group + row definitions ── */
const TL_GROUPS = [
  {
    id: 'all-apple', label: 'All Apple', color: '#4a9d6f',
    rows: ['EMEIA Moments','Engagement Calls & Moments','Heritage & Values']
  },
  {
    id: 'drive-growth', label: 'Drive Growth', color: '#3a8a5f',
    rows: ['Product Zone','Operations','Business']
  },
  {
    id: 'deliver-apple', label: 'Deliver Only-at-Apple Experiences', color: '#2d7a52',
    rows: ['Genius Bar','Today at Apple','Apple Vision Pro','Apple Intelligence','Services']
  },
  {
    id: 'enable-teams', label: 'Enable Teams', color: '#226644',
    rows: ['Benefits and Compensation','Performance Enablement','People & Development','Training']
  }
];

/* ── Default events ── */
const TL_DEFAULT_EVENTS = [
  /* EMEIA Moments */
  { id:'d1',  category:'EMEIA Moments', weekIndex:0,  span:1, text:'3, DE, IN, NL, ES, SE, CH, UK · Good Friday', color:'#4a9d6f' },
  { id:'d2',  category:'EMEIA Moments', weekIndex:1,  span:1, text:'6: AT, BE, FR, DE, IT, NL, ES, SE, CH, UK Easter Monday', color:'#4a9d6f' },
  { id:'d3',  category:'EMEIA Moments', weekIndex:3,  span:1, text:'26: UK · London Marathon', color:'#4a9d6f' },
  { id:'d4',  category:'EMEIA Moments', weekIndex:4,  span:1, text:'1, AT, BE, FR, DE, IT, ES, SE, CH, TR, IN, Bank Holidays', color:'#4a9d6f' },
  { id:'d5',  category:'EMEIA Moments', weekIndex:6,  span:1, text:'14, AT, BE, SE, CH · Ascension Day', color:'#4a9d6f' },
  { id:'d6',  category:'EMEIA Moments', weekIndex:8,  span:1, text:'25, AT, BE, FR, DE, NL, CH, UK · Bank Holiday', color:'#4a9d6f' },
  { id:'d7',  category:'EMEIA Moments', weekIndex:10, span:1, text:'8-12: WWDC', color:'#4a9d6f' },
  { id:'d8',  category:'EMEIA Moments', weekIndex:11, span:1, text:'Action Planning for Q4', color:'#4a9d6f' },
  /* Engagement Calls & Moments */
  { id:'e1',  category:'Engagement Calls & Moments', weekIndex:0,  span:2, text:'Apr 1 - 50 years of Apple 🎉', color:'#3a8a5f' },
  { id:'e2',  category:'Engagement Calls & Moments', weekIndex:1,  span:1, text:'9 - Genius Bar Support Insights call', color:'#3a8a5f' },
  { id:'e3',  category:'Engagement Calls & Moments', weekIndex:1,  span:1, text:'8 - Backstage Open Office Hour', color:'#3a8a5f' },
  { id:'e4',  category:'Engagement Calls & Moments', weekIndex:2,  span:1, text:'16 - TAA Insights call', color:'#3a8a5f' },
  { id:'e5',  category:'Engagement Calls & Moments', weekIndex:2,  span:1, text:'16, FR, ES, DE, IN, IT: SFS Engagement Call', color:'#3a8a5f' },
  { id:'e6',  category:'Engagement Calls & Moments', weekIndex:4,  span:1, text:'29: PZ & Backstage Engagement Call', color:'#3a8a5f' },
  { id:'e7',  category:'Engagement Calls & Moments', weekIndex:5,  span:1, text:'6: Wendy\'s All Team Call', color:'#3a8a5f' },
  { id:'e8',  category:'Engagement Calls & Moments', weekIndex:6,  span:1, text:'May 12-16: Eurovision', color:'#3a8a5f' },
  { id:'e9',  category:'Engagement Calls & Moments', weekIndex:6,  span:1, text:'14 - Support Insights call', color:'#3a8a5f' },
  { id:'e10', category:'Engagement Calls & Moments', weekIndex:7,  span:1, text:'21 - TAA Engagement call', color:'#3a8a5f' },
  { id:'e11', category:'Engagement Calls & Moments', weekIndex:8,  span:1, text:'27: Leadership Digest', color:'#3a8a5f' },
  { id:'e12', category:'Engagement Calls & Moments', weekIndex:10, span:1, text:'Jun 11 - Jul 19 · World Cup', color:'#3a8a5f' },
  { id:'e13', category:'Engagement Calls & Moments', weekIndex:10, span:1, text:'11 - Support Insights call', color:'#3a8a5f' },
  { id:'e14', category:'Engagement Calls & Moments', weekIndex:12, span:1, text:'24: Leadership Digest', color:'#3a8a5f' },
  /* Heritage & Values */
  { id:'h1',  category:'Heritage & Values', weekIndex:0,  span:1, text:'Mar 31 - Trans Day of Visibility', color:'#2d7a52' },
  { id:'h2',  category:'Heritage & Values', weekIndex:3,  span:1, text:'22: Earth Day', color:'#2d7a52' },
  { id:'h3',  category:'Heritage & Values', weekIndex:4,  span:1, text:'29: Leadership Digest', color:'#2d7a52' },
  { id:'h4',  category:'Heritage & Values', weekIndex:7,  span:1, text:'21: GAAD', color:'#2d7a52' },
  { id:'h5',  category:'Heritage & Values', weekIndex:9,  span:1, text:'5 - World Environment Day', color:'#2d7a52' },
  { id:'h6',  category:'Heritage & Values', weekIndex:10, span:3, text:'Global Pride Month', color:'#2d7a52' },
  /* Business */
  { id:'b1',  category:'Business', weekIndex:1,  span:1, text:'Date TBC: SMB Team Engagement Survey', color:'#3a8a5f', isTBC:true },
  { id:'b2',  category:'Business', weekIndex:5,  span:1, text:'SMB Mid-Quarter Check in', color:'#3a8a5f' },
  { id:'b3',  category:'Business', weekIndex:12, span:1, text:'22: SMB Quarterly Kick off', color:'#3a8a5f' },
  /* Today at Apple */
  { id:'t1',  category:'Today at Apple', weekIndex:0, span:3, text:'From April 3: BTS (Kpop) Spatial Audio Drop-In session', color:'#2d7a52' },
  /* Benefits and Compensation */
  { id:'bc1', category:'Benefits and Compensation', weekIndex:4, span:5, text:'May 1-31 - Close Your Rings Challenge', color:'#226644' },
  /* Performance Enablement */
  { id:'pe1', category:'Performance Enablement', weekIndex:8, span:5, text:'NEW · Dates TBC - Orchard 2.0: Leadership Programme Update', color:'#226644', isNew:true, isTBC:true },
  /* People & Development */
  { id:'pd1',  category:'People & Development', weekIndex:0, span:1, text:'Mar 29-Apr 4 - Preliminary Ratings on Together', color:'#226644' },
  { id:'pd2',  category:'People & Development', weekIndex:0, span:1, text:'To April 3: Stores Pulse Conversations', color:'#226644' },
  { id:'pd3',  category:'People & Development', weekIndex:0, span:1, text:'To April 14: Battery Safety Repair (45m, Lead Genius, Genius, Technical Expert, Technical Specialist)', color:'#226644' },
  { id:'pd4',  category:'People & Development', weekIndex:0, span:1, text:'To April 4: March Announcements Training', color:'#226644' },
  { id:'pd5',  category:'People & Development', weekIndex:1, span:1, text:'April 6-25 — Calibration Discussions', color:'#226644' },
  { id:'pd6',  category:'People & Development', weekIndex:1, span:1, text:'April 3-17: Pulse Action Plans. Enter in Medallia', color:'#226644', isNew:true },
  { id:'pd7',  category:'People & Development', weekIndex:2, span:1, text:'April 13-May 1: Development Planning (3 x 30m modules, Managers+)', color:'#226644', isNew:true },
  { id:'pd8',  category:'People & Development', weekIndex:3, span:1, text:'25: Calibrated Ratings entered on Together', color:'#226644' },
  { id:'pd9',  category:'People & Development', weekIndex:4, span:8, text:'April 27-June 27 — Scheduled Quarterly Conversations. When completed, mark it in Together, so ratings are visible in Orchard.', color:'#226644' },
  { id:'pd10', category:'People & Development', weekIndex:4, span:4, text:'April 27–May 24 - ES, IT: Mandatory Annual Flexible Finance Training (60m, all roles)', color:'#226644' },
  { id:'pd11', category:'People & Development', weekIndex:6, span:1, text:'May 16, UK - UKG Launch', color:'#226644', isNew:true },
  { id:'pd12', category:'People & Development', weekIndex:9, span:1, text:'Jun 1, ex UK - UKG Launch', color:'#226644', isNew:true },
  { id:'pd13', category:'People & Development', weekIndex:12, span:1, text:'27 - All Quarterly Conversations completed', color:'#226644' },
  /* Training */
  { id:'tr1', category:'Training', weekIndex:0, span:1, text:'To April 2: Business Conduct Training (45m)', color:'#226644' },
  { id:'tr2', category:'Training', weekIndex:0, span:7, text:'NEW · April 1 - May 19: Gen AI Go Further (45m, SL+)', color:'#226644', isNew:true },
  { id:'tr3', category:'Training', weekIndex:6, span:4, text:'May 13 - June 11 - Facilitating at Apple training for Training Operations In Store Experience', color:'#226644' }
];

function getTLEvents() {
  const stored = load(K.commitmentsTimeline, null);
  return stored !== null ? stored : TL_DEFAULT_EVENTS;
}

function saveTLEvents(events) {
  save(K.commitmentsTimeline, events);
}

function getTLQuarter() {
  const defaultQ = (typeof QUARTERS_CONFIG !== 'undefined')
    ? (QUARTERS_CONFIG.find(q => q.activo) || QUARTERS_CONFIG[0] || {key:'Q3-FY26'}).key
    : 'Q3-FY26';
  return load('apg_tl_quarter_selected', defaultQ);
}

function setTLQuarter(q) {
  save('apg_tl_quarter_selected', q);
  if (typeof QUARTERS_CONFIG !== 'undefined') {
    const qConfig = QUARTERS_CONFIG.find(c => c.key === q);
    if (qConfig) {
      const titleEl = document.querySelector('#tab-commitments-timeline .page-title');
      const subtitleEl = document.querySelector('#tab-commitments-timeline .page-subtitle');
      if (titleEl) titleEl.textContent = `🗓️ ${qConfig.titulo}`;
      if (subtitleEl) subtitleEl.textContent = `${qConfig.periodo} · ${qConfig.semanas} semanas · Hitos y compromisos por categoría`;
    }
  }
  renderCommitmentsTimeline();
}

let _tlDragEventId = null;

function tlDragStart(e, eventId) {
  _tlDragEventId = eventId;
  e.dataTransfer.effectAllowed = 'move';
}

function tlDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('tl-drag-over');
}

function tlDragLeave(e) {
  e.currentTarget.classList.remove('tl-drag-over');
}

function tlDrop(e, category, weekIndex) {
  e.preventDefault();
  e.currentTarget.classList.remove('tl-drag-over');
  if (!_tlDragEventId) return;
  const tlEvs = getTLEvents();
  const ev = tlEvs.find(ev => ev.id === _tlDragEventId);
  if (!ev) return;
  ev.weekIndex = weekIndex;
  ev.category = category;
  saveTLEvents(tlEvs);
  _tlDragEventId = null;
  renderCommitmentsTimeline();
}

function renderCommitmentsTimeline() {
  const wrap = document.getElementById('commitments-timeline-content');
  if (!wrap) return;

  /* Sync the quarter selector if it exists */
  const qSel = document.getElementById('tl-quarter-select');
  if (qSel) qSel.value = getTLQuarter();

  const events = getTLEvents();

  /* Build a lookup: category → array of events per weekIndex
     Events with span>1 are "placed" at their start column only (colspan handles the rest) */
  const byCell = {}; // key: `${category}__${weekIndex}`
  events.forEach(ev => {
    const key = `${ev.category}__${ev.weekIndex}`;
    if (!byCell[key]) byCell[key] = [];
    byCell[key].push(ev);
  });

  /* Track which cells are "consumed" by a spanning event so we skip them */
  const consumed = new Set(); // key: `${category}__${weekIndex}`

  function renderCell(category, wi) {
    const key = `${category}__${wi}`;
    if (consumed.has(key)) return null; // skip: covered by a colspan

    const evs = byCell[key] || [];
    let maxSpan = 1;
    let cellContent = '';
    if (evs.length > 0) {
      // Use maximum span across all events at this cell for the colspan
      maxSpan = Math.max(...evs.map(ev => ev.span || 1));
      // Mark consumed cells for the spanning range
      if (maxSpan > 1) {
        for (let s = 1; s < maxSpan; s++) {
          consumed.add(`${category}__${wi + s}`);
        }
      }
      cellContent = evs.map(ev => {
        const classes = ['timeline-event', ev.isNew ? 'new-badge' : '', ev.isTBC ? 'tbc' : ''].filter(Boolean).join(' ');
        const bg = ev.color || '#4a9d6f';
        return `<div class="${classes}" style="background:${esc(bg)}" title="${esc(ev.text)}" data-tl-id="${esc(ev.id)}" draggable="true" ondragstart="tlDragStart(event,'${esc(ev.id)}')">
          <span class="tl-ev-text">${esc(ev.text)}</span>
          <button class="tl-ev-del" data-tl-del="${esc(ev.id)}" title="Eliminar">×</button>
        </div>`;
      }).join('');
    }
    return { html: `<td class="timeline-cell" colspan="${maxSpan}" ondragover="tlDragOver(event)" ondragleave="tlDragLeave(event)" ondrop="tlDrop(event,'${esc(category)}',${wi})">${cellContent}</td>`, span: maxSpan };
  }

  /* Build table HTML */
  let html = '<div class="timeline-wrapper"><table class="timeline-grid">';

  /* Header row */
  html += '<thead><tr>';
  html += '<th class="tl-sticky-group timeline-col-group">Grupo</th>';
  html += '<th class="tl-sticky-row timeline-col-row">Área</th>';
  TL_WEEKS.forEach((w, i) => {
    html += `<th class="timeline-col-week">${w}</th>`;
  });
  html += '</tr></thead><tbody>';

  TL_GROUPS.forEach(group => {
    group.rows.forEach((row, rowIdx) => {
      consumed.clear(); // reset consumed for each row
      html += '<tr>';

      /* Group label cell — only on first row of each group, uses rowspan */
      if (rowIdx === 0) {
        html += `<td class="tl-sticky-group" rowspan="${group.rows.length}" style="text-align:center;vertical-align:middle;background:${group.color}">
          <div class="timeline-group-label">${group.label}</div>
        </td>`;
      }

      html += `<td class="tl-sticky-row" style="font-size:11px;font-weight:600;white-space:normal">${row}</td>`;

      /* Week cells */
      let wi = 0;
      while (wi < TL_WEEKS.length) {
        const cell = renderCell(row, wi);
        if (cell === null) {
          wi++;
          continue;
        }
        html += cell.html;
        wi += cell.span;
      }

      html += '</tr>';
    });
  });

  html += '</tbody></table></div>';
  wrap.innerHTML = html;
  try { highlightTimelineCurrentWeek(); } catch(e) {}

  /* Event delegation for delete buttons — attach once per wrapper element */
  if (!wrap._tlListenerAttached) {
    wrap._tlListenerAttached = true;
    wrap.addEventListener('click', function(e) {
      const delBtn = e.target.closest('[data-tl-del]');
      if (delBtn) {
        e.stopPropagation();
        deleteTLEvent(delBtn.dataset.tlDel);
      }
    });
  }
}

/* ── Modal helpers ── */
let _tlSelectedColor = '#4a9d6f';

function openTLModal(editId) {
  const overlay = document.getElementById('tl-modal-overlay');
  if (!overlay) return;

  /* Populate selects */
  const catSel = document.getElementById('tl-modal-category');
  catSel.innerHTML = TL_GROUPS.flatMap(g => g.rows).map(r => `<option value="${r}">${r}</option>`).join('');

  const weekSel = document.getElementById('tl-modal-week');
  weekSel.innerHTML = TL_WEEKS.map((w, i) => `<option value="${i}">${w}</option>`).join('');

  const idEl = document.getElementById('tl-modal-edit-id');
  const titleEl = document.getElementById('tl-modal-title');

  if (editId) {
    const events = getTLEvents();
    const ev = events.find(e => e.id === editId);
    if (ev) {
      titleEl.textContent = '✏️ Editar evento';
      idEl.value = editId;
      catSel.value = ev.category;
      weekSel.value = ev.weekIndex;
      document.getElementById('tl-modal-span').value = ev.span || 1;
      document.getElementById('tl-modal-text').value = ev.text;
      document.getElementById('tl-modal-isnew').checked = !!ev.isNew;
      document.getElementById('tl-modal-istbc').checked = !!ev.isTBC;
      _tlSelectedColor = ev.color || '#4a9d6f';
    }
  } else {
    titleEl.textContent = '➕ Añadir evento';
    idEl.value = '';
    document.getElementById('tl-modal-text').value = '';
    document.getElementById('tl-modal-isnew').checked = false;
    document.getElementById('tl-modal-istbc').checked = false;
    document.getElementById('tl-modal-span').value = 1;
    _tlSelectedColor = '#4a9d6f';
  }

  /* Sync color palette selection */
  document.querySelectorAll('.tl-color-swatch').forEach(sw => {
    sw.classList.toggle('selected', sw.dataset.color === _tlSelectedColor);
  });

  overlay.classList.add('open');
}

function closeTLModal() {
  const overlay = document.getElementById('tl-modal-overlay');
  if (overlay) overlay.classList.remove('open');
}

function selectTLColor(color, el) {
  _tlSelectedColor = color;
  document.querySelectorAll('.tl-color-swatch').forEach(sw => sw.classList.remove('selected'));
  if (el) el.classList.add('selected');
}

function saveTLEvent() {
  const text = (document.getElementById('tl-modal-text').value || '').trim();
  if (!text) { showToast('⚠️ El texto del evento no puede estar vacío.'); return; }

  const category = document.getElementById('tl-modal-category').value;
  const weekIndex = parseInt(document.getElementById('tl-modal-week').value, 10);
  const span = parseInt(document.getElementById('tl-modal-span').value, 10) || 1;
  const isNew = document.getElementById('tl-modal-isnew').checked;
  const isTBC = document.getElementById('tl-modal-istbc').checked;
  const color = _tlSelectedColor || '#4a9d6f';
  const editId = document.getElementById('tl-modal-edit-id').value;

  let events = getTLEvents();

  if (editId) {
    events = events.map(ev => ev.id === editId ? { ...ev, category, weekIndex, span, text, isNew, isTBC, color } : ev);
  } else {
    const id = 'u' + Date.now();
    events = [...events, { id, category, weekIndex, span, text, isNew, isTBC, color }];
  }

  saveTLEvents(events);
  closeTLModal();
  renderCommitmentsTimeline();
}

function deleteTLEvent(id) {
  if (!confirm('¿Eliminar este evento?')) return;
  const events = getTLEvents().filter(ev => ev.id !== id);
  saveTLEvents(events);
  renderCommitmentsTimeline();
}

/* ═══════════════════════════════════════════════
   LEADERSHIP SCHEDULE
═══════════════════════════════════════════════ */

// ── Vacation data ──
const LS_WEEKS_2025 = ['6 ene','13 ene','20 ene','27 ene','3 feb','10 feb','17 feb','24 feb','3 mar','10 mar','17 mar','24 mar','31 mar','7 abr','14 abr','21 abr','28 abr','5 may','12 may','19 may','26 may','2 jun','9 jun','16 jun','23 jun','30 jun','7 jul','14 jul','21 jul','28 jul','4 ago','11 ago','18 ago','25 ago','1 sept','8 sept','15 sept','22 sept','29 sept','6 oct','13 oct','20 oct','27 oct','3 nov','10 nov','17 nov','24 nov','1 dic','8 dic','15 dic','22 dic','29 dic','5 ene','12 ene'];
const LS_WEEKS_2026 = ['5 ene','12 ene','19 ene','26 ene','2 feb','9 feb','16 feb','23 feb','2 mar','9 mar','16 mar','23 mar','30 mar','6 abr','13 abr','20 abr','27 abr','4 may','11 may','18 may','25 may','1 jun','8 jun','15 jun','22 jun','29 jun','6 jul','13 jul','20 jul','27 jul','3 ago','10 ago','17 ago','24 ago','31 ago','7 sept','14 sept','21 sept','28 sept','5 oct','12 oct','19 oct','26 oct','2 nov','9 nov','16 nov','23 nov','30 nov','7 dic','14 dic','21 dic','28 dic','4 ene','11 ene'];
// Shared month name → 0-based index map for Spanish vacation week strings
const LS_MONTH_MAP = {ene:0,feb:1,mar:2,abr:3,may:4,jun:5,jul:6,ago:7,sept:8,oct:9,nov:10,dic:11};
// Week index threshold: entries above this index with Jan/Feb months belong to the NEXT year
// (the last ~2 entries in each year array wrap into January of the following year)
const LS_WEEK_YEAR_WRAP_IDX = 40;

// Dynamic week generator for any year
const _LS_MONTH_ABBR = ['ene','feb','mar','abr','may','jun','jul','ago','sept','oct','nov','dic'];
const _lsWeeksCache = {};

// Find the first Monday on or after Jan 1 of the given year
function _getFirstMondayOfYear(year) {
  var jan1 = new Date(year, 0, 1);
  var dow = jan1.getDay();
  var offset = dow === 0 ? 1 : dow === 1 ? 0 : 8 - dow;
  return new Date(year, 0, 1 + offset);
}

function _generateWeeksForYear(year) {
  if (_lsWeeksCache[year]) return _lsWeeksCache[year];
  var monday = _getFirstMondayOfYear(year);
  var weeks = [];
  for (var i = 0; i < 54; i++) {
    var d = new Date(monday);
    d.setDate(monday.getDate() + i * 7);
    weeks.push(d.getDate() + ' ' + _LS_MONTH_ABBR[d.getMonth()]);
  }
  _lsWeeksCache[year] = weeks;
  return weeks;
}

// Get weeks array for any year (uses hardcoded for 2025/2026, dynamic for others)
function _getWeeksForYear(year) {
  if (year === 2025) return LS_WEEKS_2025;
  if (year === 2026) return LS_WEEKS_2026;
  return _generateWeeksForYear(year);
}

// Get the reference Monday (first Monday of the year) for any year
function _getRefMondayForYear(year) {
  if (year === 2025) return new Date('2025-01-06T12:00:00');
  if (year === 2026) return new Date('2026-01-05T12:00:00');
  var ref = _getFirstMondayOfYear(year);
  ref.setHours(12, 0, 0, 0);
  return ref;
}

function _parseVacRow(str) {
  return str.split(',');
}

const VACACIONES_2025 = {
  managers: [
    { name:'DIEGO',         data: _parseVacRow(',,,,,,F,,,,,,,TGD,,,,V,,,,,,,V,,,,,,,,V,V,,,,,,,,V,,,,,,,,,,,,') },
    { name:'JORDI',         data: _parseVacRow(',,,,,,,TGD,,,,,,,V,,,,,,,,,V,V,,,,V,,,,,,,,,,,,,,,,V,,,,,,,,,,') },
    { name:'ITZIAR',        data: _parseVacRow(',,,,,,OT,,,,,,,,,,,,,,TGD,V,,,,,,,V,V,V,,,,,,,,,,V,,,,,,,,,,') },
    { name:'CRISTINA',      data: _parseVacRow(',,,,,,,,TGD,,,,,,V,,,,F,,,,,,,,,,,V,V,V,,,,,,,,V,,,,,,,,,') },
    { name:'SHEILA',        data: _parseVacRow(',,,,TGD,,,,,,,,V,,,,,,F,,,,,,V,V,V,,,,,,,,,,,,,V,,,,,,,,,') },
    { name:'JORGE',         data: _parseVacRow(',,,,,,,,,,,,,,V,,V,,,,,,TGD,,,,,,V,V,,,,,,,,,V,,,,,,,,,') },
    { name:'MERI',          data: _parseVacRow(',,,,F,,,,,,,,TGD,,,,,,,,V,,,,,,,V,V,V,,,,,,V,,,,,,,,,') },
    { name:'PEDRO',         data: _parseVacRow(',,,,,,,,,,F,TGD,,,,,,,,,V,,,,,,,,,V,V,V,,,,,,,,V,,,,,,,,,') },
    { name:'DAVID',         data: _parseVacRow(',,,,,,,,,,TGD,LEAVE,LEAVE,LEAVE,LEAVE,LEAVE,F,LEAVE,LEAVE,LEAVE,LEAVE,V,LEAVE,LEAVE,LEAVE,LEAVE,LEAVE,LEAVE,V,LEAVE,LEAVE,LEAVE,LEAVE,LEAVE,LEAVE,LEAVE,LEAVE,LEAVE,LEAVE,V,V,,,,,,V,,,,,,,,') },
    { name:'TONI',          data: _parseVacRow(',,,,V,,,,,F,TGD,,,,,,,V,,,,,,V,,,,,V,,,,,,,,,,,,,,V,,,,,,,,,') },
    { name:'ANE',           data: _parseVacRow(',,LEAVE,LEAVE,LEAVE,TGD,LEAVE,,,,,LEAVE,LEAVE,V,LEAVE,LEAVE,LEAVE,LEAVE,V,LEAVE,LEAVE,LEAVE,LEAVE,LEAVE,V,LEAVE,LEAVE,LEAVE,LEAVE,LEAVE,LEAVE,V,V,LEAVE,LEAVE,LEAVE,LEAVE,,,V,,,,,,,,,,,,') },
    { name:'JAVI CANFRANC', data: _parseVacRow(',,,,V,,,,,,,TGD,,,,,,,F,,,,,,,V,V,,,,V,,,,,,,,,,,,,,,V,,,,,,,,') },
    { name:'JESUS',         data: _parseVacRow(',,,,,,,,,,V,,,,,,,TGD,,,,,,V,,,,V,V,,,,,,,,,,,,,V,,,,,,,,') },
    { name:'JAVI QUIROS',   data: _parseVacRow(',,,,F,TGD,,,,,OT,,,,,,,,,,,,,,,,,,,V,V,V,,,,,,V,V,,,,,,,,,') },
    { name:'JAVI SANCHEZ',  data: _parseVacRow(',,,,,,V,,,,,,,,,V,,,,TGD,V,,,,V,,,,V,V,,,,,,,,,V,V,,,,,,,,') },
    { name:'EYANNE',        data: _parseVacRow(',,,,TGD,,,,,,,V,V,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,') },
    { name:'RICARDO',       data: _parseVacRow(',,,,,,,,,,F,V,V,,,,,,,TGD,,,,,,,,,,,,,V,,,,V,V,,,,,,,,,') },
    { name:'DEBORAH',       data: _parseVacRow(',,,,,,,,,,,,,,,,,,V,,,,,,,,,V,,,,,,,,,,,,,,V,V,,,,,,,,') },
    { name:'CRISTINA USON', data: _parseVacRow(',,,,,,,,,,,,,,,,,,,,,,,,,,V,,,,V,,,,,,,,,,,,V,V,,,,,,,,') },
  ],
  leads: [
    { name:'JUAN',          data: _parseVacRow(',,,,TGD,,,,,,,,,,,,F,,,,,,,,V,,,,,,,V,V,,,,,,,V,,,,,,,,') },
    { name:'CECI',          data: _parseVacRow(',,,,,,V,V,,,,,,,,,F,,,,,TGD,,,,V,,,,,,,,,,,,,,,,,,') },
    { name:'ELI',           data: _parseVacRow(',,,,,,,,,,,,F,V,,,,,,V,,,,TGD,,,,,,V,V,,,,,,,,V,,,,,,,,') },
    { name:'RUBEN',         data: _parseVacRow(',,,,,,,,,,F,V,,,,,,,,,,V,TGD,,,,,,V,V,,,,,,,,,,,V,,,,,,,,') },
    { name:'AURORA',        data: _parseVacRow(',,,,,,,,F,,,OT19,,TGD,,,,,,,V,,,,,V,,,,V,V,,,,,,,,OT,,,V,,,,,,,,') },
    { name:'EVA H',         data: _parseVacRow(',,,,,,,,,,,,TGD,,,F,,,,,,,,,,V,V,V,V,V,V,,,V,V,V,,,,,V,,,,,,,,') },
    { name:'ALBERTO ORTIZ', data: _parseVacRow(',,,,,,,,,,,,TGD,,,,V,V,,,,V,,,,V,,,V,,,,,,,,V,,,,,,,,,') },
    { name:'EVA F',         data: _parseVacRow(',,,,,,F,,,,,TGD,,,,,V,,,,V,,,,,,,,,,,,,,,,,,,V,V,,,,V,,,,,,,,') },
  ]
};

const VACACIONES_2026 = [
  { name:'IDOIA LÁZARO',    rol:'manager', data: _parseVacRow(',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,') },
  { name:'JORDI PAJARES',   rol:'manager', data: _parseVacRow(',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,') },
  { name:'DIEGO RIVERO',    rol:'manager', data: _parseVacRow(',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,') },
  { name:'SHEILA YUBERO',   rol:'manager', data: _parseVacRow(',,,,F,,,,,,,,V,,,,,,,,,,,,TGD,,,V,V,V,,,,,,,,,,,,,V,,,,,,,,') },
  { name:'CRISTINA CARCEL', rol:'manager', data: _parseVacRow(',,,,,,F,,,,,,V,,,,,,,,,,TGD,,,,,,,V,V,V,,,,,,,,V,,,,,,,,,') },
  { name:'ITZIAR CACHO',    rol:'manager', data: _parseVacRow(',,,,,,,,,,,,,TGD,,,,,,,,,,,,,V,V,V,,,,,,V,,,,,,,V,,,,,,,,,') },
  { name:'JORGE GIL',       rol:'manager', data: _parseVacRow(',,,,,,,,,TGD,,V,,,,,,,,,V,,,,,,,V,V,,,V,,,,,,,,,,,,,,,') },
  { name:'ANE PAZOS',       rol:'manager', data: _parseVacRow(',V25,V25,V25,,,,,,,,,,TGD,,,,,,V,V,,,,,,,V25,V,V,,,,,,,,,V,V25,,,,,,,,') },
  { name:'CRISTINA USON',   rol:'manager', data: _parseVacRow(',,,,,,,,TGD,V,,,,,,,,,,,,V,,,V,,,,,,,,,,,,,,V,V,,,,,,,,,') },
  { name:'DAVID CARRILLO',  rol:'manager', data: _parseVacRow(',,,,,,,,,,V,V,,,,,,,F,V,,,,,,,,,V,V,,,,,,,,,,,,,V,,,,,,,,') },
  { name:'DEBORAH IBAÑEZ',  rol:'manager', data: _parseVacRow(',,,,,,,,,,TGD,V,,,,F,,,,,,,,,,,V,V,,,,,,,,,,,,,V,V,,,,,,,,') },
  { name:'JAVI CANFRANC',   rol:'manager', data: _parseVacRow('Parental,Parental,Parental,Parental,Lactancia,Lactancia,,,,,,,,,,,,F,TGD,V,V,V,V,V,Paternidad,Paternidad,Paternidad,Paternidad,Paternidad,Paternidad,Paternidad,Paternidad,Paternidad,Paternidad,Paternidad,,,,,,,,,,,,,,,') },
  { name:'JAVI SANCHEZ',    rol:'manager', data: _parseVacRow(',,F,,,,,,,,,,V,,,,,TGD,,,,,,V,V,V,,,,,,,,,,V,,,,,,,,,,,,') },
  { name:'JAVI QUIROS',     rol:'manager', data: _parseVacRow(',,,,,,,,TGD,F,,,,,,,,,,,V,,,,,,,V,V,V,,,,,,,,,,V,,,,,,,,,') },
  { name:'JESUS PAZOS',     rol:'manager', data: _parseVacRow(',,,,,,,,,,,,V,,,,,TGD,,,,,,,V,,,,V,V,,,,,,,,,,V,,,,,,,,,') },
  { name:'MERI ALVAREZ',    rol:'manager', data: _parseVacRow(',,,,,,,,,,,,TGD,,,,,,,V,,,,,,,,,,V,V,V,,,,,,,V,,,,,,,,') },
  { name:'PEDRO BORLIDO',   rol:'manager', data: _parseVacRow(',,,,F,,,,,,,TGD,V,,,,,,,,,,,,,V,,,,,,,V,V,,,,,,,,V,,,,,,,,,') },
  { name:'RICARDO SOSA',    rol:'manager', data: _parseVacRow(',,,,,,,,,,,,,,F,,,,V,,,V,TGD,,,,,,V,V,,,,,,,,,,,V,,,,,,,,') },
  { name:'JULIE ROBIN',     rol:'manager', data: _parseVacRow(',,,,,,,,,,,,,,,,,,,,,,,,,,V,V,,,,,,,,,V,,,,,,V,,,,,,,,') },
  { name:'TONI MEDINA',     rol:'manager', data: _parseVacRow(',,F,,,,,,,V,V,,,,,,,TGD,,,,,V,,,,,,V,,,,,,,,,,V,,,,,,,,,') },
  { name:'AURORA COMESAÑA', rol:'lead',    data: _parseVacRow(',,,,,,,,,,V,,,,,,,,,TGD,,,,V,,,,,,V,V,,,,V,,,,,,,,,,,') },
  { name:'RUBEN MARTINEZ',  rol:'lead',    data: _parseVacRow(',,,,,,,,,,V,,,,,,,,,F,TGD,V,,,,,,,,V,V,,,,,,,,,,,V,,,,,,,,') },
  { name:'EVA FAMOSO',      rol:'lead',    data: _parseVacRow(',,,,,,,,,,V,,,,,V,,,,,TGD,F,V,,,,,,,,,,,,,,,V,,,,V,,,,,,,,') },
  { name:'ALBERTO ORTIZ',   rol:'lead',    data: _parseVacRow(',,,,,,,,,,,,,,F,,,,,,,TGD,V,V,,,,V,,,,V,,,,,,,,,V,,,,,,,,') },
  { name:'EVA HERNANDEZ',   rol:'lead',    data: _parseVacRow(',,,,,,,,,,,,F,,,,,UNPAID,,,,,,TGD,,V,,V,,,,V,V,,,,,,,V,,,,,,,,') },
  { name:'CLARA GONZALEZ',  rol:'lead',    data: _parseVacRow(',,,,,,,,,,F,TGD,,,,,V,,,,,V,,,,,,,,V,,,,,,,,,,V,V,,,,,,,,') },
  { name:'ELI MORENO',      rol:'lead',    data: _parseVacRow(',,,,,,,,TGD,,,,,V,F,,,,,,,,,V,,,,,,,V,V,,,,,,,,,,V,,,,,,,,') },
];

// ── Festivos data ──
const FESTIVOS_2026 = [
  { nombre:'Rivero Abascal, Diego',          festivo:'6 de enero',     devueltos:['28 de enero','29 de enero'],                                                                                                             total:'2 de 14' },
  { nombre:'Cacho Legaz, Itziar',             festivo:'6 de febrero',   devueltos:['26 de marzo','27 de marzo'],                                                                                                             total:'2 de 14' },
  { nombre:'Carcel Lopez, Cristina',          festivo:'1 de enero',     devueltos:['6 de enero','16 de febrero','17 de febrero','18 de febrero','19 de febrero','20 de febrero'],                                            total:'7 de 10' },
  { nombre:'Gil Sañudo, Jorge',               festivo:'6 de enero',     devueltos:['23 de enero','16 de marzo','17 de marzo','24 de junio'],                                                                                 total:'3 de 12' },
  { nombre:'Yubero Arruga, Sheila',           festivo:'1 de enero',     devueltos:['6 de enero'],                                                                                                                           total:'2 de 15' },
  { nombre:'Alvarez Marti, Meri',             festivo:'1 de enero',     devueltos:['14 de enero','24 de abril','4 de mayo'],                                                                                                 total:'3 de 13' },
  { nombre:'Borlido de Oliveira, Pedro',      festivo:'16 de enero',    devueltos:['28 de enero','2 de febrero','3 de febrero','4 de febrero','5 de febrero','6 de febrero','23 de marzo','24 de marzo'],                   total:'9 de 8' },
  { nombre:'Canfranc Marzal, Javi',           festivo:'1 de enero',     devueltos:['6 de enero'],                                                                                                                           total:'2 de 15' },
  { nombre:'Carrillo Murcia, David',          festivo:'1 de enero',     devueltos:['6 de enero'],                                                                                                                           total:'2 de 15' },
  { nombre:'Ibañez, Deborah',                 festivo:'5 de enero',     devueltos:['30 de enero','9 de marzo','10 de marzo','11 de marzo','12 de marzo','13 de marzo','19 de marzo','20 de marzo'],                         total:'9 de 8' },
  { nombre:'Medina Pena, Toni',               festivo:'1 de enero',     devueltos:['12 de enero','19 de enero','20 de enero','21 de enero','22 de enero','23 de enero'],                                                     total:'5 de 10' },
  { nombre:'Pazos Pata, Jesus',               festivo:'6 de enero',     devueltos:['30 de enero'],                                                                                                                          total:'2 de 15' },
  { nombre:'Pazos Revuelta, Ana Maria',       festivo:'1 de enero',     devueltos:['6 de enero'],                                                                                                                           total:'2 de 15' },
  { nombre:'Quiros Gomez, Javier',            festivo:'1 de enero',     devueltos:['6 de enero','20 de febrero'],                                                                                                           total:'3 de 14' },
  { nombre:'Sanchez Dominguez, Javi',         festivo:'19 de enero',    devueltos:['20 de enero','21 de enero','22 de enero','23 de enero'],                                                                                 total:'5 de 12' },
  { nombre:'Sosa Poleo, Ricardo',             festivo:'16 de enero',    devueltos:['6 de febrero'],                                                                                                                         total:'2 de 15' },
  { nombre:'Uson, Cristina',                  festivo:'6 de enero',     devueltos:['16 de enero','8 de enero'],                                                                                                             total:'3 de 14' },
  { nombre:'Moreno Lopez, Elisabet',          festivo:'2 de marzo',     devueltos:['3 de marzo','26 de febrero','27 de febrero'],                                                                                            total:'4 de 13' },
  { nombre:'Gonzalez Serra, Clara',           festivo:'6 de enero',     devueltos:['9 de marzo','10 de marzo','11 de marzo','12 de marzo','13 de marzo','19 de marzo','20 de marzo'],                                       total:'8 de 9' },
  { nombre:'Famoso Corchuelo, Eva',           festivo:'1 de enero',     devueltos:['23 de enero'],                                                                                                                          total:'2 de 15' },
  { nombre:'Hernandez Illera, Eva',           festivo:'1 de enero',     devueltos:['6 de enero','30 de marzo','31 de marzo','1 de abril','2 de abril','3 de abril'],                                                        total:'7 de 10' },
  { nombre:'Ortiz Pastor, Alberto',           festivo:'5 de enero',     devueltos:['14 de enero'],                                                                                                                          total:'2 de 15' },
  { nombre:'Comesaña Casado, Aurora',         festivo:'1 de enero',     devueltos:['6 de enero','15 de junio','16 de junio'],                                                                                               total:'4 de 13' },
  { nombre:'Martinez Modino, Rubén',          festivo:'1 de enero',     devueltos:['14 de enero','19 de febrero'],                                                                                                          total:'3 de 14' },
];

// ── Cell color mapping — Enhanced ──
function _lsVacCellClass(val) {
  if (!val || val.trim() === '') return '';
  const v = val.trim().toUpperCase();
  if (v === 'V') return 'ls-vac-v';
  if (v === 'V25') return 'ls-vac-v25';
  if (v === 'F') return 'ls-vac-f';
  if (v === 'LEAVE') return 'ls-vac-leave';
  if (v === 'TGD') return 'ls-vac-tgd';
  if (v.startsWith('OT')) return 'ls-vac-ot';
  if (v === 'UNPAID') return 'ls-vac-unpaid';
  if (v === 'PARENTAL' || v === 'LACTANCIA' || v === 'PATERNIDAD') return 'ls-vac-parental';
  return 'ls-vac-other';
}

// Color for SVG/charts based on absence type
function _lsVacTypeColor(val) {
  if (!val) return '#94a3b8';
  const v = val.trim().toUpperCase();
  if (v === 'V' || v === 'V25') return '#3b82f6';
  if (v === 'F') return '#10b981';
  if (v === 'LEAVE') return '#ef4444';
  if (v === 'TGD') return '#f97316';
  if (v.startsWith('OT')) return '#8b5cf6';
  if (v === 'UNPAID') return '#f59e0b';
  if (v === 'PARENTAL' || v === 'LACTANCIA' || v === 'PATERNIDAD') return '#ec4899';
  return '#94a3b8';
}

// Friendly name for absence type
function _lsVacTypeName(val) {
  if (!val) return 'Otros';
  const v = val.trim().toUpperCase();
  if (v === 'V') return 'Vacaciones';
  if (v === 'V25') return 'Vac. 2025';
  if (v === 'F') return 'Festivo';
  if (v === 'LEAVE') return 'Baja';
  if (v === 'TGD') return 'TGD';
  if (v.startsWith('OT')) return 'Overtime';
  if (v === 'UNPAID') return 'No pagado';
  if (v === 'PARENTAL' || v === 'LACTANCIA' || v === 'PATERNIDAD') return 'Parental';
  return val.trim();
}

// ── Get current week index ──
function _lsVacCurrentWeekIdx(year) {
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  const monStr = monday.toISOString().slice(0, 10);
  return getVacWeekIndex(monStr);
}

// ── Compute Statistics ──
function _lsVacComputeStats(allPeople, weeks, year) {
  const totalPeople = allPeople.length;
  let totalAbsences = 0;
  const typeCounts = {};
  const monthCounts = Array(12).fill(0);
  const weekAbsences = Array(weeks.length).fill(0);

  allPeople.forEach(p => {
    p.data.forEach((val, i) => {
      if (_isVacAbsent(val)) {
        totalAbsences++;
        const key = val.trim().toUpperCase();
        const normalized = key.startsWith('OT') ? 'OT' : (key === 'LACTANCIA' || key === 'PATERNIDAD') ? 'PARENTAL' : key;
        typeCounts[normalized] = (typeCounts[normalized] || 0) + 1;
        weekAbsences[i]++;
        const wStr = weeks[i];
        if (wStr) {
          const parts = wStr.split(' ');
          if (parts.length === 2) {
            const mIdx = LS_MONTH_MAP[parts[1]];
            if (mIdx !== undefined) monthCounts[mIdx]++;
          }
        }
      }
    });
  });

  const avgPerPerson = totalPeople > 0 ? (totalAbsences / totalPeople).toFixed(1) : 0;
  const currentWeekIdx = _lsVacCurrentWeekIdx(year);
  const todayAbsent = currentWeekIdx >= 0 ? weekAbsences[currentWeekIdx] : 0;
  const maxWeekAbsences = Math.max(...weekAbsences, 1);
  const peakWeekIdx = weekAbsences.indexOf(maxWeekAbsences);
  const peakWeekLabel = peakWeekIdx >= 0 && weeks[peakWeekIdx] ? weeks[peakWeekIdx] : '—';
  const goodWeeks = weekAbsences.filter(cnt => cnt < totalPeople * 0.3).length;
  const coveragePct = weeks.length > 0 ? Math.round((goodWeeks / weeks.length) * 100) : 100;

  return { totalPeople, totalAbsences, avgPerPerson, todayAbsent, typeCounts, monthCounts, weekAbsences, maxWeekAbsences, peakWeekLabel, coveragePct, currentWeekIdx };
}

// ── Render Stats Dashboard ──
function _renderLSVacStats(stats) {
  return '<div class="vac-stats-grid">' +
    '<div class="vac-stat-card vac-stat-total"><div class="vac-stat-icon">📊</div>' +
    '<div class="vac-stat-value">' + stats.totalAbsences + '</div>' +
    '<div class="vac-stat-label">Total Ausencias</div>' +
    '<div class="vac-stat-detail">' + stats.totalPeople + ' personas · Pico: sem. ' + esc(stats.peakWeekLabel) + '</div></div>' +
    '<div class="vac-stat-card vac-stat-avg"><div class="vac-stat-icon">📈</div>' +
    '<div class="vac-stat-value">' + stats.avgPerPerson + '</div>' +
    '<div class="vac-stat-label">Media por persona</div>' +
    '<div class="vac-stat-detail">semanas de ausencia de media</div></div>' +
    '<div class="vac-stat-card vac-stat-today"><div class="vac-stat-icon">🏠</div>' +
    '<div class="vac-stat-value">' + stats.todayAbsent + '<span style="font-size:14px;font-weight:400;color:var(--text-secondary)">/' + stats.totalPeople + '</span></div>' +
    '<div class="vac-stat-label">Ausentes esta semana</div>' +
    '<div class="vac-stat-detail">' + (stats.totalPeople - stats.todayAbsent) + ' en oficina</div></div>' +
    '<div class="vac-stat-card vac-stat-coverage"><div class="vac-stat-icon">🛡️</div>' +
    '<div class="vac-stat-value">' + stats.coveragePct + '%</div>' +
    '<div class="vac-stat-label">Cobertura equipo</div>' +
    '<div class="vac-stat-detail">Semanas con &gt;70% del equipo</div></div>' +
    '</div>' +
    '<div class="vac-charts-row">' +
    '<div class="vac-chart-card"><div class="vac-chart-title">Distribución por tipo de ausencia</div>' + _renderVacDonutChart(stats.typeCounts) + '</div>' +
    '<div class="vac-chart-card"><div class="vac-chart-title">Ausencias por mes</div>' + _renderVacMonthlyChart(stats.monthCounts) + '</div>' +
    '</div>';
}

// ── SVG Donut Chart ──
function _renderVacDonutChart(typeCounts) {
  const entries = Object.entries(typeCounts).sort(function(a, b) { return b[1] - a[1]; });
  const total = entries.reduce(function(s, e) { return s + e[1]; }, 0);
  if (total === 0) return '<div style="text-align:center;color:var(--text-secondary);padding:20px">Sin datos</div>';

  const size = 120, cx = 60, cy = 60, r = 44, sw = 18;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  var arcs = entries.map(function(entry) {
    var type = entry[0], count = entry[1];
    var pct = count / total;
    var len = pct * circ;
    var color = _lsVacTypeColor(type);
    var arc = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + sw + '" stroke-dasharray="' + len + ' ' + (circ - len) + '" stroke-dashoffset="' + (-offset) + '" />';
    offset += len;
    return arc;
  });

  var legend = entries.map(function(entry) {
    var type = entry[0], count = entry[1];
    var pct = Math.round(count / total * 100);
    return '<div class="vac-donut-legend-item"><span class="vac-donut-legend-dot" style="background:' + _lsVacTypeColor(type) + '"></span>' +
      esc(_lsVacTypeName(type)) + '<span class="vac-donut-legend-val">' + count + ' <span style="color:var(--text-secondary);font-weight:400">(' + pct + '%)</span></span></div>';
  }).join('');

  return '<div class="vac-donut-wrap">' +
    '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" style="transform:rotate(-90deg);flex-shrink:0">' +
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="var(--surface2)" stroke-width="' + sw + '" />' +
    arcs.join('') +
    '<text x="' + cx + '" y="' + (cy + 2) + '" text-anchor="middle" dominant-baseline="middle" fill="var(--text-primary)" font-size="18" font-weight="800" style="transform:rotate(90deg);transform-origin:center">' + total + '</text>' +
    '</svg><div class="vac-donut-legend">' + legend + '</div></div>';
}

// ── Monthly Bar Chart ──
function _renderVacMonthlyChart(monthCounts) {
  var MNAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  var maxVal = Math.max.apply(null, monthCounts.concat([1]));
  var bars = monthCounts.map(function(count, i) {
    var h = Math.round((count / maxVal) * 65);
    var opacity = count > 0 ? 0.6 + (count / maxVal) * 0.4 : 0.15;
    return '<div class="vac-heatmap-col"><div class="vac-heatmap-bar-val">' + (count > 0 ? count : '') + '</div>' +
      '<div class="vac-heatmap-bar-fill" style="height:' + Math.max(h, 2) + 'px;background:var(--accent);opacity:' + opacity + '"></div>' +
      '<div class="vac-heatmap-bar-label">' + MNAMES[i] + '</div></div>';
  }).join('');
  return '<div class="vac-heatmap-bar">' + bars + '</div>';
}

// ── Vacation view mode ──
let _lsVacView = load('apg_ls_vac_view', 'tabla');

function setLSVacView(v) {
  _lsVacView = v;
  save('apg_ls_vac_view', v);
  renderLSVacaciones();
}

// ── Enhanced Monthly calendar view for vacaciones ──
function _renderLSVacCalendarView(year, allPeople) {
  const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                       'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const DAY_LABELS  = ['L','M','X','J','V','S','D'];
  const today = new Date();
  const todayY = today.getFullYear(), todayM = today.getMonth(), todayD = today.getDate();

  const weekPeopleMap = {};
  allPeople.forEach(p => {
    p.data.forEach((val, widx) => {
      if (val && val.trim() !== '') {
        if (!weekPeopleMap[widx]) weekPeopleMap[widx] = [];
        weekPeopleMap[widx].push({ name: p.name, val: val.trim() });
      }
    });
  });

  const months = MONTH_NAMES.map((mName, m) => {
    const firstDayJs = new Date(year, m, 1).getDay();
    const offset     = (firstDayJs === 0) ? 6 : firstDayJs - 1;
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const isCurrentMonth = year === todayY && m === todayM;

    const headers = DAY_LABELS.map(d =>
      '<div class="ls-vac-cal-hdr">' + d + '</div>').join('');

    const empStart = '<div></div>'.repeat(offset);

    let cells = '';
    let monthTotal = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, m, day);
      const dow  = date.getDay();
      const isWeekend = dow === 0 || dow === 6;
      const monday = new Date(date);
      monday.setDate(date.getDate() - (dow === 0 ? 6 : dow - 1));
      const monStr = monday.toISOString().slice(0, 10);
      const widx   = getVacWeekIndex(monStr);

      const isToday = year === todayY && m === todayM && day === todayD;
      const absentPeople = widx >= 0 ? (weekPeopleMap[widx] || []) : [];
      if (absentPeople.length > 0) monthTotal++;

      const totalTeam = allPeople.length;
      const busyClass = absentPeople.length >= totalTeam * 0.4 ? ' ls-vac-cal-busy-critical' :
                        absentPeople.length >= totalTeam * 0.2 ? ' ls-vac-cal-busy-high' :
                        absentPeople.length > 0 ? ' ls-vac-cal-busy' : '';

      const countBadge = absentPeople.length > 0
        ? '<span class="ls-vac-cal-cnt">' + absentPeople.length + '</span>'
        : '';

      const tooltip = absentPeople.map(entry =>
        entry.name + ': ' + entry.val).join('\n');

      cells += '<div class="ls-vac-cal-cell' + (isToday ? ' ls-vac-cal-today' : '') + busyClass + (isWeekend ? ' ls-vac-cal-weekend' : '') + '"' + (tooltip ? ' title="' + esc(tooltip) + '"' : '') + '>' +
               '<span class="ls-vac-cal-dn">' + day + '</span>' + countBadge + '</div>';
    }

    const totalCells = offset + daysInMonth;
    const trailing   = (7 - (totalCells % 7)) % 7;
    const empEnd     = '<div></div>'.repeat(trailing);

    return '<div class="ls-vac-month-card' + (isCurrentMonth ? ' ls-vac-month-current' : '') + '">' +
      '<div class="ls-vac-month-title">' + mName + ' <span class="ls-vac-month-count">' + monthTotal + 'd</span></div>' +
      '<div class="ls-vac-month-grid">' +
        headers + empStart + cells + empEnd +
      '</div></div>';
  });

  return '<div class="ls-vac-cal-wrap">' + months.join('') + '</div>';
}

// ── Vacation overrides (localStorage) ──
const LS_VAC_OVERRIDES_KEY = 'apg_ls_vac_overrides';

function _getLSVacOverrides(year) {
  const all = load(LS_VAC_OVERRIDES_KEY, {});
  return all[String(year)] || {};
}

function _saveLSVacOverrides(year, overrides) {
  const all = load(LS_VAC_OVERRIDES_KEY, {});
  all[String(year)] = overrides;
  save(LS_VAC_OVERRIDES_KEY, all);
}

function _isVacAbsent(v) {
  if (!v || !v.trim()) return false;
  return true; // any non-empty value is an absence
}

function getVacPeopleForYear(year) {
  const weeks = _getWeeksForYear(year);
  let basePeople = [];
  if (year === 2025) {
    basePeople = [
      ...(VACACIONES_2025.managers || []).map(p => ({ ...p, rol: 'manager' })),
      ...(VACACIONES_2025.leads || []).map(p => ({ ...p, rol: 'lead' })),
    ];
  } else if (year === 2026) {
    basePeople = VACACIONES_2026.map(p => ({ ...p }));
  } else {
    // For future years (2027+), use 2026 people list with empty data as template
    basePeople = VACACIONES_2026.map(p => ({ name: p.name, rol: p.rol, data: Array(weeks.length).fill('') }));
  }

  const overrides = _getLSVacOverrides(year);
  const deleted = overrides.__deleted__ || [];
  const added = overrides.__added__ || [];

  // Apply per-person overrides; key = original name
  let people = basePeople
    .filter(p => !deleted.includes(p.name))
    .map(p => {
      const ov = overrides[p.name];
      if (ov) {
        return { ...p, originalName: p.name, name: ov.displayName || p.name, data: ov.data ? [...ov.data] : [...p.data] };
      }
      return { ...p, originalName: p.name, data: [...p.data] };
    });

  // Backward compat: apply old manual entries
  const manualKey = 'apg_ls_vacaciones_manual_' + year;
  const manualEntries = load(manualKey, []);
  manualEntries.forEach(me => {
    const existing = people.find(p => p.originalName === me.name || p.name === me.name);
    if (existing) {
      me.weeks.forEach((val, i) => { if (val && val.trim()) existing.data[i] = val.trim(); });
    }
  });

  // Add new people from overrides
  added.forEach(ap => {
    if (!people.find(p => p.originalName === ap.key)) {
      people.push({ name: ap.displayName, originalName: ap.key, rol: ap.rol || 'manager', data: ap.data ? [...ap.data] : Array(weeks.length).fill(''), manual: true });
    }
  });

  // Add old manual entries not already in list
  manualEntries.forEach(me => {
    if (!people.find(p => p.name === me.name || p.originalName === me.name)) {
      people.push({ name: me.name, originalName: me.name, rol: 'manager', data: [...me.weeks], manual: true });
    }
  });

  // Normalize all data arrays to match weeks length (pad or truncate)
  people.forEach(p => {
    if (p.data.length < weeks.length) {
      while (p.data.length < weeks.length) p.data.push('');
    } else if (p.data.length > weeks.length) {
      p.data = p.data.slice(0, weeks.length);
    }
  });

  return people;
}


// ── Timeline View (Gantt-style) ──
function _renderLSVacTimelineView(year, allPeople, weeks) {
  var MNAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  var currentWeekIdx = _lsVacCurrentWeekIdx(year);

  var monthSpans = [];
  var prevMonth = -1;
  weeks.forEach(function(w, i) {
    var parts = w.split(' ');
    var mIdx = parts.length === 2 ? LS_MONTH_MAP[parts[1]] : -1;
    if (mIdx !== prevMonth && mIdx >= 0) {
      monthSpans.push({ name: MNAMES[mIdx], start: i, count: 1 });
      prevMonth = mIdx;
    } else if (monthSpans.length > 0) {
      monthSpans[monthSpans.length - 1].count++;
    }
  });

  var monthHeaders = monthSpans.map(function(ms) {
    return '<div class="vac-timeline-month-label" style="flex:' + ms.count + '">' + ms.name + '</div>';
  }).join('');

  var managers = allPeople.filter(function(p) { return p.rol === 'manager'; });
  var leads = allPeople.filter(function(p) { return p.rol === 'lead'; });

  var renderGroup = function(label, people) {
    if (!people.length) return '';
    var rows = people.map(function(p) {
      var safeKey = p.originalName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      var weekCells = p.data.map(function(val, i) {
        var v = (val || '').trim();
        if (!v) return '<div class="vac-timeline-week"></div>';
        var color = _lsVacTypeColor(v);
        return '<div class="vac-timeline-week"><div class="vac-timeline-block" style="background:' + color + '" title="' + esc(p.name) + ': ' + esc(v) + ' — ' + esc(weeks[i]) + '"></div></div>';
      }).join('');

      var todayLine = currentWeekIdx >= 0 ? '<div class="vac-timeline-today-line" style="left:' + (currentWeekIdx / weeks.length * 100).toFixed(2) + '%"><div class="vac-timeline-today-dot"></div></div>' : '';

      return '<div class="vac-timeline-row">' +
        '<div class="vac-timeline-row-name" onclick="lsVacShowPersonDetail(' + year + ',\'' + safeKey + '\')" title="Ver detalle">' +
        '<span class="ls-vac-rol-badge ' + (p.rol === 'manager' ? 'ls-vac-rol-manager' : 'ls-vac-rol-lead') + '" style="font-size:7px;padding:1px 3px">' + (p.rol === 'manager' ? 'M' : 'L') + '</span> ' +
        esc(p.name) + '</div>' +
        '<div class="vac-timeline-bar-area" style="position:relative">' + weekCells + todayLine + '</div></div>';
    }).join('');

    return '<div class="vac-timeline-group-label">' + label + '</div>' + rows;
  };

  return '<div class="vac-timeline-wrap">' +
    '<div class="vac-timeline-header">' +
    '<div class="vac-timeline-name-col">Persona</div>' +
    '<div class="vac-timeline-months">' + monthHeaders + '</div></div>' +
    renderGroup('👔 Managers', managers) +
    renderGroup('🟢 Leads', leads) +
    '</div>';
}

// ── Person Detail Modal ──
function lsVacShowPersonDetail(year, originalName) {
  var allPeople = getVacPeopleForYear(year);
  var person = allPeople.find(function(p) { return p.originalName === originalName; });
  if (!person) return;

  var weeks = _getWeeksForYear(year);
  var absences = [];
  var typeCounts = {};
  var monthCounts = Array(12).fill(0);

  person.data.forEach(function(val, i) {
    if (_isVacAbsent(val)) {
      var v = val.trim();
      absences.push({ week: weeks[i] || ('S' + (i + 1)), type: v, idx: i });
      var key = v.toUpperCase().startsWith('OT') ? 'OT' : (v.toUpperCase() === 'LACTANCIA' || v.toUpperCase() === 'PATERNIDAD') ? 'PARENTAL' : v.toUpperCase();
      typeCounts[key] = (typeCounts[key] || 0) + 1;
      var parts = (weeks[i] || '').split(' ');
      if (parts.length === 2) {
        var mIdx = LS_MONTH_MAP[parts[1]];
        if (mIdx !== undefined) monthCounts[mIdx]++;
      }
    }
  });

  var totalAbsences = absences.length;
  var vacOnly = person.data.filter(function(d) { return d && d.trim().toUpperCase() === 'V'; }).length;
  var rolBadge = person.rol === 'manager'
    ? '<span class="ls-vac-rol-badge ls-vac-rol-manager">Manager</span>'
    : '<span class="ls-vac-rol-badge ls-vac-rol-lead">Lead</span>';

  var breakdownChips = Object.entries(typeCounts).sort(function(a, b) { return b[1] - a[1]; }).map(function(entry) {
    var type = entry[0], count = entry[1];
    var cls = _lsVacCellClass(type);
    return '<span class="vac-person-breakdown-chip ' + cls + '">' + _lsVacTypeName(type) + ': ' + count + '</span>';
  }).join('');

  var weeksList = absences.map(function(a) {
    return '<div class="vac-person-week-item">' +
      '<span style="min-width:60px;color:var(--text-secondary)">' + esc(a.week) + '</span>' +
      '<span class="vac-person-week-badge ' + _lsVacCellClass(a.type) + '">' + esc(a.type) + '</span></div>';
  }).join('');

  var MNAMES = ['E','F','M','A','M','J','J','A','S','O','N','D'];
  var maxM = Math.max.apply(null, monthCounts.concat([1]));
  var miniChart = monthCounts.map(function(c, i) {
    var h = Math.round((c / maxM) * 30);
    return '<div style="display:flex;flex-direction:column;align-items:center;flex:1;gap:1px">' +
      '<span style="font-size:9px;font-weight:700;color:var(--text-primary)">' + (c > 0 ? c : '') + '</span>' +
      '<div style="width:100%;height:' + Math.max(h, 2) + 'px;background:var(--accent);border-radius:2px;opacity:' + (c > 0 ? 0.7 : 0.1) + '"></div>' +
      '<span style="font-size:8px;color:var(--text-secondary)">' + MNAMES[i] + '</span></div>';
  }).join('');

  var modal = document.createElement('div');
  modal.className = 'vac-person-modal';
  modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
  modal.innerHTML = '<div class="vac-person-modal-content">' +
    '<div class="vac-person-modal-header"><div>' +
    '<div class="vac-person-modal-name">' + esc(person.name) + ' ' + rolBadge + '</div></div>' +
    '<button class="vac-person-modal-close" onclick="this.closest(\'.vac-person-modal\').remove()">✕</button></div>' +
    '<div class="vac-person-modal-body">' +
    '<div class="vac-person-stats-grid">' +
    '<div class="vac-person-stat"><div class="vac-person-stat-val">' + totalAbsences + '</div><div class="vac-person-stat-label">Total ausencias</div></div>' +
    '<div class="vac-person-stat"><div class="vac-person-stat-val">' + vacOnly + '</div><div class="vac-person-stat-label">Vacaciones</div></div>' +
    '<div class="vac-person-stat"><div class="vac-person-stat-val">' + Object.keys(typeCounts).length + '</div><div class="vac-person-stat-label">Tipos distintos</div></div></div>' +
    '<div class="vac-person-breakdown">' + breakdownChips + '</div>' +
    '<div class="vac-person-month-chart" style="margin-top:16px">' +
    '<div style="font-size:12px;font-weight:600;color:var(--text-primary);margin-bottom:6px">Distribución mensual</div>' +
    '<div style="display:flex;align-items:flex-end;gap:3px;height:50px;padding-top:6px">' + miniChart + '</div></div>' +
    '<div style="margin-top:16px;font-size:12px;font-weight:600;color:var(--text-primary)">Detalle de ausencias</div>' +
    '<div class="vac-person-weeks-list" style="max-height:200px;overflow-y:auto">' + (weeksList || '<div style="color:var(--text-secondary);padding:8px">Sin ausencias registradas</div>') + '</div>' +
    '</div></div>';
  document.body.appendChild(modal);
}

// ── Export CSV ──
function lsVacExportCSV() {
  var yearEl = document.getElementById('ls-vac-year');
  var year = yearEl ? parseInt(yearEl.value) : 2026;
  var weeks = _getWeeksForYear(year);
  var allPeople = getVacPeopleForYear(year);

  var csvRows = [];
  csvRows.push(['Nombre', 'Rol'].concat(weeks).concat(['Total Ausencias']).join(';'));
  allPeople.forEach(function(p) {
    var total = p.data.filter(function(d) { return _isVacAbsent(d); }).length;
    var row = [p.name, p.rol].concat(p.data.map(function(d) { return (d || '').trim(); })).concat([total]);
    csvRows.push(row.join(';'));
  });

  var csvContent = csvRows.join('\n');
  var blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'vacaciones_' + year + '.csv';
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exportado correctamente', 'success');
}


// ── renderLSVacaciones — Main render function (Redesigned) ──
function renderLSVacaciones() {
  var wrap = document.getElementById('ls-vacaciones-wrap');
  var statsWrap = document.getElementById('ls-vac-stats-wrap');
  var legendWrap = document.getElementById('ls-vac-legend-wrap');
  if (!wrap) return;
  var yearEl = document.getElementById('ls-vac-year');
  var year = yearEl ? parseInt(yearEl.value) : 2026;
  var weeks = _getWeeksForYear(year);

  var allPeople = getVacPeopleForYear(year);

  // Apply search filter
  var searchEl = document.getElementById('ls-vac-search');
  var searchTerm = searchEl ? searchEl.value.trim().toLowerCase() : '';
  if (searchTerm) {
    allPeople = allPeople.filter(function(p) { return p.name.toLowerCase().includes(searchTerm); });
  }

  // Apply type filter
  var filterEl = document.getElementById('ls-vac-filter-type');
  var filterType = filterEl ? filterEl.value : '';

  var managers = allPeople.filter(function(p) { return p.rol === 'manager'; });
  var leads = allPeople.filter(function(p) { return p.rol === 'lead'; });

  // Sync toggle button state
  var btnTabla = document.getElementById('ls-vac-btn-tabla');
  var btnCal   = document.getElementById('ls-vac-btn-calendario');
  var btnTime  = document.getElementById('ls-vac-btn-timeline');
  if (btnTabla) btnTabla.classList.toggle('active', _lsVacView === 'tabla');
  if (btnCal)   btnCal.classList.toggle('active', _lsVacView === 'calendario');
  if (btnTime)  btnTime.classList.toggle('active', _lsVacView === 'timeline');

  // Render stats (use unfiltered data for global stats)
  var unfilteredPeople = getVacPeopleForYear(year);
  var stats = _lsVacComputeStats(unfilteredPeople, weeks, year);
  if (statsWrap) statsWrap.innerHTML = _renderLSVacStats(stats);

  // Render legend
  if (legendWrap) {
    legendWrap.innerHTML = '<div class="ls-vac-legend">' +
      '<span class="ls-vac-legend-item ls-vac-v">V Vacaciones</span>' +
      '<span class="ls-vac-legend-item ls-vac-f">F Festivo</span>' +
      '<span class="ls-vac-legend-item ls-vac-leave">LEAVE Baja</span>' +
      '<span class="ls-vac-legend-item ls-vac-tgd">TGD Thanksgiving</span>' +
      '<span class="ls-vac-legend-item ls-vac-ot">OT Overtime</span>' +
      '<span class="ls-vac-legend-item ls-vac-parental">Parental / Lactancia</span>' +
      '<span class="ls-vac-legend-item ls-vac-other">Otros</span>' +
      (_lsVacView === 'tabla' ? '<span class="ls-vac-legend-hint">💡 Doble clic en celda para editar · Clic en nombre para ver detalle</span>' : '') +
      (_lsVacView === 'timeline' ? '<span class="ls-vac-legend-hint">💡 Clic en nombre para ver detalle de ausencias</span>' : '') +
      '</div>';
  }

  if (_lsVacView === 'calendario') {
    wrap.innerHTML = _renderLSVacCalendarView(year, allPeople);
    return;
  }

  if (_lsVacView === 'timeline') {
    wrap.innerHTML = _renderLSVacTimelineView(year, allPeople, weeks);
    return;
  }

  // ── TABLE VIEW ──
  var safeKey = function(k) { return k.replace(/\\/g, '\\\\').replace(/'/g, "\\'"); };
  var currentWeekIdx = _lsVacCurrentWeekIdx(year);

  // Detect month boundaries for separators
  var monthBoundaries = new Set();
  var prevMonthIdx = -1;
  weeks.forEach(function(w, i) {
    var parts = w.split(' ');
    var mIdx = parts.length === 2 ? LS_MONTH_MAP[parts[1]] : -1;
    if (mIdx !== prevMonthIdx && i > 0) monthBoundaries.add(i);
    prevMonthIdx = mIdx;
  });

  var renderGroupTable = function(groupLabel, people, rolGroup) {
    if (!people.length) return '';

    var filteredPeople = people;
    if (filterType) {
      filteredPeople = people.filter(function(p) {
        return p.data.some(function(d) { return d && d.trim().toUpperCase().startsWith(filterType); });
      });
      if (!filteredPeople.length) return '';
    }

    var headerCells = weeks.map(function(w, i) {
      var isSep = monthBoundaries.has(i) ? ' ls-vac-month-sep-header' : '';
      var isCurrent = i === currentWeekIdx ? ' ls-vac-current-week' : '';
      return '<th class="ls-vac-week-header' + isSep + isCurrent + '" title="' + w + '">' + w + '</th>';
    }).join('');

    var maxAbsences = Math.max.apply(null, filteredPeople.map(function(p) { return p.data.filter(function(d) { return _isVacAbsent(d); }).length; }).concat([1]));

    var bodyRows = filteredPeople.map(function(p) {
      var origKey = safeKey(p.originalName);
      var cells = p.data.map(function(val, i) {
        var v = (val || '').trim();
        var cls = _lsVacCellClass(v);
        var safeV = v.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        var dragAttrs = v ? 'draggable="true" ondragstart="lsVacDragStart(event,' + year + ',\'' + origKey + '\',' + i + ',\'' + safeV + '\')" ondragend="lsVacDragEnd(event)"' : '';
        var dropAttrs = 'ondragover="lsVacDragOver(event)" ondragleave="lsVacDragLeave(event)" ondrop="lsVacDrop(event,' + year + ',\'' + origKey + '\',' + i + ')"';
        var isSep = monthBoundaries.has(i) ? ' ls-vac-month-sep' : '';
        var isCurrent = i === currentWeekIdx ? ' ls-vac-current-week-cell' : '';
        return '<td class="ls-vac-cell ' + cls + ' ls-vac-editable' + isSep + isCurrent + '" title="' + weeks[i] + ': ' + (v || '—') + '" ondblclick="lsVacEditCell(' + year + ',\'' + origKey + '\',' + i + ',\'' + safeV + '\')" ' + dragAttrs + ' ' + dropAttrs + '>' + esc(v) + '</td>';
      }).join('');
      var vacCount = p.data.filter(function(d) { return _isVacAbsent(d); }).length;
      var barPct = Math.min(Math.round(vacCount / maxAbsences * 100), 100);
      var barColor = vacCount > 10 ? 'var(--danger)' : vacCount > 6 ? 'var(--warning)' : 'var(--accent)';
      var rolBadge = p.rol === 'manager'
        ? '<span class="ls-vac-rol-badge ls-vac-rol-manager">Mgr</span>'
        : '<span class="ls-vac-rol-badge ls-vac-rol-lead">Lead</span>';
      var manualBadge = p.manual ? ' <span class="ls-vac-manual-badge">+</span>' : '';
      return '<tr>' +
        '<td class="ls-vac-name" onclick="lsVacShowPersonDetail(' + year + ',\'' + origKey + '\')">' + rolBadge + ' <span class="ls-vac-name-text" ondblclick="event.stopPropagation();lsVacEditName(' + year + ',\'' + origKey + '\')" title="Doble clic para editar nombre">' + esc(p.name) + '</span>' + manualBadge + '<button class="ls-vac-del-btn" title="Eliminar" onclick="event.stopPropagation();lsVacDeletePerson(' + year + ',\'' + origKey + '\')">×</button></td>' +
        cells +
        '<td class="ls-vac-total"><div class="vac-total-wrap"><span class="vac-total-num">' + vacCount + '</span><div class="vac-total-bar"><div class="vac-total-bar-fill" style="width:' + barPct + '%;background:' + barColor + '"></div></div></div></td>' +
        '</tr>';
    }).join('');

    var isManager = rolGroup === 'manager';
    var rolBadgeCounter = isManager
      ? '<span class="ls-vac-rol-badge ls-vac-rol-manager">Mgr</span>'
      : '<span class="ls-vac-rol-badge ls-vac-rol-lead">Lead</span>';
    var counterCells = weeks.map(function(_, i) {
      var cnt = filteredPeople.filter(function(p) { return _isVacAbsent(p.data[i]); }).length;
      var isSep = monthBoundaries.has(i) ? ' ls-vac-month-sep' : '';
      var highClass = cnt >= filteredPeople.length * 0.5 ? ' ls-vac-counter-high' : cnt > 0 ? ' ls-vac-counter-nonzero' : '';
      return '<td class="ls-vac-counter-cell' + highClass + isSep + '">' + (cnt > 0 ? cnt : '') + '</td>';
    }).join('');
    var counterRow = '<tr class="ls-vac-counter-row">' +
      '<td class="ls-vac-name ls-vac-counter-label">' + rolBadgeCounter + ' Ausencias</td>' +
      counterCells +
      '<td class="ls-vac-total"></td></tr>';

    return '<div class="card" style="margin-bottom:16px;overflow:hidden">' +
      '<div class="card-title" style="display:flex;align-items:center;gap:8px">' + groupLabel + ' <span style="font-size:12px;font-weight:400;color:var(--text-secondary)">' + filteredPeople.length + ' personas</span></div>' +
      '<div style="overflow-x:auto"><table class="ls-vac-table"><thead><tr>' +
      '<th class="ls-vac-name-header">Persona</th>' +
      headerCells +
      '<th class="ls-vac-total-header">Σ Aus</th>' +
      '</tr></thead><tbody>' +
      bodyRows + counterRow +
      '</tbody></table></div></div>';
  };

  wrap.innerHTML = renderGroupTable('👔 Managers', managers, 'manager')
    + renderGroupTable('🟢 Leads', leads, 'lead');
}


// ── Vacation cell / name / person editing ──
let _lsVacPopoverClose = null;

function lsVacEditCell(year, originalName, weekIdx, currentVal) {
  // Remove any existing popover
  _lsVacClosePopover();

  const options = [
    { val: 'V',        label: '🔵 V — Vacaciones' },
    { val: 'F',        label: '🟢 F — Festivo' },
    { val: 'TGD',      label: '🟠 TGD — Thanksgiving Days' },
    { val: 'LEAVE',    label: '🔴 Leave — Baja' },
    { val: 'OT',       label: '🟣 OT — Overtime / Compensatorio' },
    { val: 'Parental', label: '🩷 Parental — Permiso parental' },
    { val: 'UNPAID',   label: '🟡 UNPAID — No pagado' },
    { val: '',         label: '🗑 Borrar' }
  ];

  // Find the cell element that was double-clicked
  const cells = document.querySelectorAll(`#ls-vacaciones-wrap .ls-vac-editable`);
  let targetCell = null;
  cells.forEach(td => {
    const attr = td.getAttribute('ondblclick') || '';
    if (attr.includes(`'${originalName.replace(/'/g, "\\'")}'`) && attr.includes(`,${weekIdx},`)) {
      targetCell = td;
    }
  });

  const popover = document.createElement('div');
  popover.id = 'ls-vac-cell-popover';
  popover.style.cssText = 'position:fixed;z-index:9999;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);box-shadow:0 4px 20px rgba(0,0,0,0.2);padding:4px 0;min-width:200px;';

  options.forEach(opt => {
    const item = document.createElement('div');
    item.textContent = opt.label;
    item.style.cssText = `padding:8px 16px;cursor:pointer;font-size:13px;${opt.val === currentVal ? 'background:var(--surface2);font-weight:600;' : ''}`;
    item.addEventListener('mouseover', () => item.style.background = 'var(--surface2)');
    item.addEventListener('mouseout', () => item.style.background = opt.val === currentVal ? 'var(--surface2)' : '');
    item.addEventListener('click', () => {
      _lsVacClosePopover();
      const weeks = _getWeeksForYear(year);
      const overrides = _getLSVacOverrides(year);
      const allPeople = getVacPeopleForYear(year);
      const person = allPeople.find(p => p.originalName === originalName);
      if (!person) return;
      if (!overrides[originalName]) overrides[originalName] = { displayName: person.name, data: [...person.data] };
      while (overrides[originalName].data.length < weeks.length) overrides[originalName].data.push('');
      overrides[originalName].data[weekIdx] = opt.val;
      _saveLSVacOverrides(year, overrides);
      renderLSVacaciones();
      showToast('Celda actualizada', 'success');
    });
    popover.appendChild(item);
  });

  document.body.appendChild(popover);

  // Position near target cell
  if (targetCell) {
    const rect = targetCell.getBoundingClientRect();
    let top = rect.bottom + 4;
    let left = rect.left;
    // Ensure popover stays within viewport
    if (top + 240 > window.innerHeight) top = rect.top - 244;
    if (left + 210 > window.innerWidth) left = window.innerWidth - 214;
    popover.style.top = top + 'px';
    popover.style.left = left + 'px';
  } else {
    popover.style.top = '50%';
    popover.style.left = '50%';
    popover.style.transform = 'translate(-50%,-50%)';
  }

  // Close on outside click
  const outsideClick = (e) => {
    if (!popover.contains(e.target)) _lsVacClosePopover();
  };
  setTimeout(() => document.addEventListener('click', outsideClick), 10);
  _lsVacPopoverClose = () => {
    document.removeEventListener('click', outsideClick);
    popover.remove();
    _lsVacPopoverClose = null;
  };
}

function _lsVacClosePopover() {
  if (_lsVacPopoverClose) _lsVacPopoverClose();
  const existing = document.getElementById('ls-vac-cell-popover');
  if (existing) existing.remove();
}

function lsVacEditName(year, originalName) {
  const allPeople = getVacPeopleForYear(year);
  const person = allPeople.find(p => p.originalName === originalName);
  const currentDisplay = person ? person.name : originalName;
  const newName = prompt('Nuevo nombre:', currentDisplay);
  if (!newName || !newName.trim() || newName.trim() === currentDisplay) return;

  const overrides = _getLSVacOverrides(year);
  if (!overrides[originalName]) overrides[originalName] = { data: person ? [...person.data] : [] };
  overrides[originalName].displayName = newName.trim();
  _saveLSVacOverrides(year, overrides);
  renderLSVacaciones();
  showToast('Nombre actualizado', 'success');
}

function lsVacDeletePerson(year, originalName) {
  if (!confirm(`¿Eliminar a "${originalName}" de la tabla?`)) return;
  const overrides = _getLSVacOverrides(year);
  if (!overrides.__deleted__) overrides.__deleted__ = [];
  if (!overrides.__deleted__.includes(originalName)) overrides.__deleted__.push(originalName);
  _saveLSVacOverrides(year, overrides);
  renderLSVacaciones();
  showToast('Persona eliminada', 'success');
}

// ── Drag & Drop for vacation cells ──
let _lsVacDrag = null; // { year, originalName, weekIdx, value }

function lsVacDragStart(event, year, originalName, weekIdx, value) {
  _lsVacDrag = { year, originalName, weekIdx, value };
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', value);
  event.currentTarget.style.opacity = '0.5';
}

function lsVacDragEnd(event) {
  event.currentTarget.style.opacity = '';
  _lsVacDrag = null;
}

function lsVacDragOver(event) {
  if (!_lsVacDrag) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  event.currentTarget.classList.add('ls-vac-drag-over');
}

function lsVacDragLeave(event) {
  event.currentTarget.classList.remove('ls-vac-drag-over');
}

function lsVacDrop(event, year, targetName, targetWeekIdx) {
  event.preventDefault();
  event.currentTarget.classList.remove('ls-vac-drag-over');
  if (!_lsVacDrag) return;
  const src = _lsVacDrag;
  _lsVacDrag = null;

  // No-op if dropping on the same cell
  if (src.year === year && src.originalName === targetName && src.weekIdx === targetWeekIdx) return;

  const allPeople = getVacPeopleForYear(year);

  // Get target's current value for possible swap
  const targetPerson = allPeople.find(p => p.originalName === targetName);
  const targetValue = targetPerson ? ((targetPerson.data[targetWeekIdx] || '').trim()) : '';

  // Apply changes via overrides
  const srcOverrides = _getLSVacOverrides(src.year);
  if (!srcOverrides[src.originalName]) {
    const srcPerson = allPeople.find(p => p.originalName === src.originalName);
    srcOverrides[src.originalName] = { data: srcPerson ? [...srcPerson.data] : [] };
  }
  srcOverrides[src.originalName].data[src.weekIdx] = targetValue; // Swap: put target value at source
  _saveLSVacOverrides(src.year, srcOverrides);

  const dstOverrides = _getLSVacOverrides(year);
  if (!dstOverrides[targetName]) {
    dstOverrides[targetName] = { data: targetPerson ? [...targetPerson.data] : [] };
  }
  dstOverrides[targetName].data[targetWeekIdx] = src.value; // Move: put dragged value at target
  _saveLSVacOverrides(year, dstOverrides);

  renderLSVacaciones();
}

// ── Add new person ──
function openLSVacManualModal() {
  const yearEl = document.getElementById('ls-vac-year');
  const year = yearEl ? parseInt(yearEl.value) : 2026;
  const weeks = _getWeeksForYear(year);
  const name = prompt('Nombre de la persona:');
  if (!name || !name.trim()) return;
  const rolInput = prompt('Rol (manager / lead):', 'manager');
  if (rolInput === null) return;
  const rol = (rolInput.trim().toLowerCase() === 'lead') ? 'lead' : 'manager';

  const overrides = _getLSVacOverrides(year);
  if (!overrides.__added__) overrides.__added__ = [];
  const personKey = name.trim() + '_' + Date.now();
  overrides.__added__.push({ key: personKey, displayName: name.trim(), rol, data: Array(weeks.length).fill('') });
  _saveLSVacOverrides(year, overrides);
  renderLSVacaciones();
  showToast('Persona añadida. Doble clic en sus celdas para editar.', 'success');
}

// ── renderLSFestivos v2 ──
const LS_FEST_KEY_V2 = 'apg_ls_fest_v2';
// Escape a string for safe use inside a single-quoted JS string within a double-quoted HTML attribute
function _festSafeAttr(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
const _FEST_DEFAULT_HOLIDAYS = [
  'Año Nuevo (1 ene)','Reyes (6 ene)','Viernes Santo','Lunes de Pascua',
  'Día del Trabajo (1 may)','San Juan (24 jun)','Asunción (15 ago)',
  'Fiesta Nacional (12 oct)','Todos los Santos (1 nov)','Constitución (6 dic)',
  'Inmaculada (8 dic)','Navidad (25 dic)','San Esteban (26 dic)'
];

function _getFestStore() {
  return load(LS_FEST_KEY_V2, null);
}
function _saveFestStore(store) {
  save(LS_FEST_KEY_V2, store);
}

function _initFestStore() {
  let store = _getFestStore();
  if (store && store.years) return store;
  // Migrate from v1
  store = { currentYear: 'FY26', years: {} };
  const fy26 = { holidays: [..._FEST_DEFAULT_HOLIDAYS], people: {} };
  // Migrate old v1 data
  const oldData = load('apg_ls_fest_devoluciones', null);
  const hasFestivos = typeof FESTIVOS_2026 !== 'undefined' && Array.isArray(FESTIVOS_2026);
  if (oldData) {
    // Parse totals from FESTIVOS_2026
    const totalMap = {};
    if (hasFestivos) {
      FESTIVOS_2026.forEach(p => {
        const parts = (p.total || '').split(' de ');
        totalMap[p.nombre] = parts.length === 2 ? parseInt(parts[1], 10) || 14 : 14;
      });
    }
    const baseNames = hasFestivos ? FESTIVOS_2026.map(p => p.nombre) : [];
    const allNames = [...new Set([...baseNames, ...Object.keys(oldData)])];
    allNames.forEach(nombre => {
      const devs = oldData[nombre] || [];
      fy26.people[nombre] = {
        total: totalMap[nombre] || 14,
        manager: '',
        devoluciones: Array.isArray(devs) ? devs.map(d => ({
          festivo: d.festivo || '',
          fecha: d.fecha || '',
          notas: d.notas || ''
        })) : []
      };
    });
  } else if (hasFestivos) {
    // Initialize from FESTIVOS_2026
    FESTIVOS_2026.forEach(p => {
      const parts = (p.total || '').split(' de ');
      const total = parts.length === 2 ? parseInt(parts[1], 10) || 14 : 14;
      fy26.people[p.nombre] = {
        total,
        manager: '',
        devoluciones: (p.devueltos || []).map(d => ({ festivo: p.festivo || '', fecha: d, notas: '' }))
      };
    });
  }
  store.years['FY26'] = fy26;
  _saveFestStore(store);
  return store;
}

function _getFestYear(store) {
  return store.currentYear || Object.keys(store.years)[0] || 'FY26';
}

function _getFestYearData(store, year) {
  if (!store.years[year]) {
    store.years[year] = { holidays: [..._FEST_DEFAULT_HOLIDAYS], people: {} };
    _saveFestStore(store);
  }
  return store.years[year];
}

// ── Year management ──
function festChangeYear(year) {
  const store = _initFestStore();
  store.currentYear = year;
  _saveFestStore(store);
  renderLSFestivos();
}

function _festPopulateYearSelect() {
  const sel = document.getElementById('fest-year-select');
  if (!sel) return;
  const store = _initFestStore();
  const currentYear = _getFestYear(store);
  const years = Object.keys(store.years).sort();
  sel.innerHTML = years.map(y => `<option value="${y}"${y === currentYear ? ' selected' : ''}>${y}</option>`).join('');
}

// ── Filter state ──
let _lsFestFilter = 'todos';
function setLSFestFilter(f, btn) {
  _lsFestFilter = f;
  document.querySelectorAll('.ls-fest-filter').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderLSFestivos();
}

// ── KPI rendering ──
function _renderFestKPIs(people) {
  const grid = document.getElementById('fest-kpi-grid');
  if (!grid) return;
  const total = people.length;
  const done = people.filter(p => p.devoluciones.length >= p.total).length;
  const prog = people.filter(p => p.devoluciones.length > 0 && p.devoluciones.length < p.total).length;
  const pend = people.filter(p => p.devoluciones.length === 0).length;
  const totalDevs = people.reduce((s, p) => s + p.devoluciones.length, 0);
  const totalNeeded = people.reduce((s, p) => s + p.total, 0);
  const pct = totalNeeded > 0 ? Math.round((totalDevs / totalNeeded) * 100) : 0;

  grid.innerHTML = `
    <div class="fest-kpi fest-kpi--total"><div class="fest-kpi-value">${total}</div><div class="fest-kpi-label">Personas</div></div>
    <div class="fest-kpi fest-kpi--done"><div class="fest-kpi-value">${done}</div><div class="fest-kpi-label">Completados</div></div>
    <div class="fest-kpi fest-kpi--prog"><div class="fest-kpi-value">${prog}</div><div class="fest-kpi-label">En progreso</div></div>
    <div class="fest-kpi fest-kpi--pend"><div class="fest-kpi-value">${pend}</div><div class="fest-kpi-label">Pendientes</div></div>
    <div class="fest-kpi fest-kpi--pct"><div class="fest-kpi-value">${pct}%</div><div class="fest-kpi-label">Avance global</div></div>
  `;
}

// ── Main render ──
function renderLSFestivos() {
  const wrap = document.getElementById('ls-festivos-wrap');
  if (!wrap) return;

  const store = _initFestStore();
  _festPopulateYearSelect();
  const year = _getFestYear(store);
  const yearData = _getFestYearData(store, year);

  // Update subtitle
  const sub = document.getElementById('fest-subtitle');
  if (sub) sub.textContent = `Seguimiento de devolución de festivos ${year} por persona`;

  // Build people list
  const allNames = Object.keys(yearData.people);
  const searchVal = (document.getElementById('fest-search')?.value || '').toLowerCase().trim();
  const grouped = document.getElementById('fest-group-toggle')?.checked || false;

  let people = allNames.map(nombre => ({
    nombre,
    total: yearData.people[nombre].total || 14,
    manager: yearData.people[nombre].manager || '',
    devoluciones: yearData.people[nombre].devoluciones || []
  }));

  // Render KPIs with all people (before filtering)
  _renderFestKPIs(people);

  // Apply filter
  people = people.filter(p => {
    const done = p.devoluciones.length;
    if (_lsFestFilter === 'completado') return done >= p.total;
    if (_lsFestFilter === 'progreso')   return done > 0 && done < p.total;
    if (_lsFestFilter === 'pendiente')  return done === 0;
    return true;
  });

  // Apply search
  if (searchVal) {
    people = people.filter(p => p.nombre.toLowerCase().includes(searchVal));
  }

  if (!people.length) {
    wrap.innerHTML = '<div class="empty-state" style="padding:40px;text-align:center"><p style="font-size:14px;color:var(--text-secondary)">No hay registros que coincidan con los filtros.</p></div>';
    return;
  }

  if (grouped) {
    // Group by manager
    const groups = {};
    people.forEach(p => {
      const mgr = p.manager || 'Sin manager asignado';
      if (!groups[mgr]) groups[mgr] = [];
      groups[mgr].push(p);
    });
    const html = Object.keys(groups).sort().map(mgr => {
      const gPeople = groups[mgr];
      const gDone = gPeople.filter(p => p.devoluciones.length >= p.total).length;
      const gPend = gPeople.filter(p => p.devoluciones.length === 0).length;
      const gProg = gPeople.length - gDone - gPend;
      return `<div class="fest-group">
        <div class="fest-group-header" onclick="this.parentElement.classList.toggle('collapsed')">
          <div class="fest-group-title"><span class="fest-group-chevron">▾</span> ${esc(mgr)} <span style="font-weight:400;font-size:12px;color:var(--text-secondary)">(${gPeople.length})</span></div>
          <div class="fest-group-stats">
            <span>✅ ${gDone}</span>
            <span>🔄 ${gProg}</span>
            <span>⏳ ${gPend}</span>
          </div>
        </div>
        <div class="fest-group-body">${gPeople.map(p => _renderFestPersonRow(p, year)).join('')}</div>
      </div>`;
    }).join('');
    wrap.innerHTML = html;
  } else {
    wrap.innerHTML = `<div class="card" style="overflow:hidden">${people.map(p => _renderFestPersonRow(p, year)).join('')}</div>`;
  }
}

function _renderFestPersonRow(p, year) {
  const done = p.devoluciones.length;
  const total = p.total;
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  let statusCls, statusLabel, barCls;
  if (done >= total) { statusCls = 'ls-fest-done'; statusLabel = '✅ Completado'; barCls = 'bar-done'; }
  else if (done > 0) { statusCls = 'ls-fest-progress'; statusLabel = `🔄 ${done}/${total}`; barCls = 'bar-prog'; }
  else                { statusCls = 'ls-fest-pending'; statusLabel = '⏳ Pendiente'; barCls = 'bar-pend'; }

  const safeNombre = _festSafeAttr(p.nombre);
  const safeYear = _festSafeAttr(year);

  const chips = done > 0
    ? p.devoluciones.map((d, i) => {
        const parts = [];
        if (d.festivo) parts.push(`<span class="ls-fest-chip-festivo">${esc(d.festivo)}</span>`);
        if (d.fecha)   parts.push(`<span class="ls-fest-chip-fecha">${esc(d.fecha)}</span>`);
        if (d.notas)   parts.push(`<span class="ls-fest-chip-nota" title="${esc(d.notas)}">📝</span>`);
        return `<span class="ls-fest-chip">${parts.join(' · ')}
          <button class="ls-fest-chip-edit" onclick="openLSFestivoModal('${safeNombre}',${i},'${safeYear}')" title="Editar">✏️</button>
          <button class="ls-fest-chip-del" onclick="removeLSFestivo('${safeNombre}',${i},'${safeYear}')" title="Eliminar">×</button>
        </span>`;
      }).join('')
    : '<span style="color:var(--text-secondary);font-size:12px;font-style:italic">Sin devoluciones registradas</span>';

  return `<div class="ls-fest-row">
    <div class="ls-fest-row-header">
      <span class="ls-fest-nombre">${esc(p.nombre)}<span class="ls-fest-nombre-total">(${done}/${total} festivos)</span></span>
      <div style="display:flex;gap:8px;align-items:center">
        <span class="ls-fest-status ${statusCls}">${statusLabel}</span>
        <button class="btn btn-ghost" style="font-size:11px;padding:3px 10px" onclick="openLSFestivoModal('${safeNombre}',-1,'${safeYear}')">+ Añadir</button>
      </div>
    </div>
    <div class="ls-fest-bar-wrap">
      <div class="ls-fest-bar ${barCls}" style="width:${pct}%"></div>
      <span class="ls-fest-bar-label">${pct}%</span>
    </div>
    <div class="ls-fest-chips-wrap">${chips}</div>
  </div>`;
}

// ── Festivo modal functions (v2) ──
function openLSFestivoModal(nombre, editIdx, year) {
  const overlay = document.getElementById('ls-fest-modal-overlay');
  if (!overlay) return;
  const store = _initFestStore();
  const yr = year || _getFestYear(store);
  const yearData = _getFestYearData(store, yr);

  document.getElementById('ls-fest-modal-nombre').textContent = nombre;
  document.getElementById('ls-fest-modal-key').value = nombre;
  document.getElementById('ls-fest-modal-edit-idx').value = editIdx != null ? editIdx : -1;

  // Populate holiday select from year catalog
  const sel = document.getElementById('ls-fest-modal-select');
  const holidays = yearData.holidays || _FEST_DEFAULT_HOLIDAYS;
  sel.innerHTML = '<option value="">— Selecciona un festivo —</option>' +
    holidays.map(h => `<option value="${esc(h)}">${esc(h)}</option>`).join('') +
    '<option value="__otro__">Otro (escribir)</option>';

  const customEl = document.getElementById('ls-fest-modal-custom');
  const fechaEl = document.getElementById('ls-fest-modal-fecha');
  const notasEl = document.getElementById('ls-fest-modal-notas');

  if (editIdx >= 0 && yearData.people[nombre]?.devoluciones?.[editIdx]) {
    const d = yearData.people[nombre].devoluciones[editIdx];
    const matchesOption = holidays.includes(d.festivo);
    sel.value = matchesOption ? d.festivo : '__otro__';
    customEl.style.display = matchesOption ? 'none' : '';
    customEl.value = matchesOption ? '' : (d.festivo || '');
    fechaEl.value = d.fecha || '';
    notasEl.value = d.notas || '';
  } else {
    sel.value = '';
    customEl.value = '';
    customEl.style.display = 'none';
    fechaEl.value = localDateStr(new Date());
    notasEl.value = '';
  }
  overlay.style.display = 'flex';
}

function closeLSFestivoModal() {
  const overlay = document.getElementById('ls-fest-modal-overlay');
  if (overlay) overlay.style.display = 'none';
}

function lsFestModalSelectChange(sel) {
  const custom = document.getElementById('ls-fest-modal-custom');
  if (custom) custom.style.display = sel.value === '__otro__' ? '' : 'none';
}

function saveLSFestivo() {
  const nombre = document.getElementById('ls-fest-modal-key')?.value;
  if (!nombre) return;
  const editIdx = parseInt(document.getElementById('ls-fest-modal-edit-idx')?.value || '-1', 10);
  const selVal = document.getElementById('ls-fest-modal-select')?.value || '';
  const customVal = document.getElementById('ls-fest-modal-custom')?.value.trim() || '';
  const festivo = selVal === '__otro__' ? customVal : selVal;
  if (!festivo) { showToast('Selecciona o escribe el nombre del festivo', 'error'); return; }
  const fecha = document.getElementById('ls-fest-modal-fecha')?.value || '';
  const notas = document.getElementById('ls-fest-modal-notas')?.value.trim() || '';

  const store = _initFestStore();
  const year = _getFestYear(store);
  const yearData = _getFestYearData(store, year);
  if (!yearData.people[nombre]) yearData.people[nombre] = { total: 14, manager: '', devoluciones: [] };

  const entry = { festivo, fecha, notas };
  if (editIdx >= 0 && yearData.people[nombre].devoluciones[editIdx]) {
    yearData.people[nombre].devoluciones[editIdx] = entry;
    showToast('Devolución actualizada', 'success');
  } else {
    yearData.people[nombre].devoluciones.push(entry);
    showToast('Festivo registrado', 'success');
  }
  _saveFestStore(store);
  closeLSFestivoModal();
  renderLSFestivos();
}

function removeLSFestivo(nombre, idx, year) {
  if (!confirm('¿Eliminar esta devolución?')) return;
  const store = _initFestStore();
  const yr = year || _getFestYear(store);
  const yearData = _getFestYearData(store, yr);
  if (!yearData.people[nombre]) return;
  yearData.people[nombre].devoluciones.splice(idx, 1);
  _saveFestStore(store);
  renderLSFestivos();
  showToast('Devolución eliminada', 'success');
}

// ── Settings modal ──
let _festSettingsTab = 'holidays';
function openFestSettingsModal() {
  document.getElementById('fest-settings-overlay').style.display = 'flex';
  const store = _initFestStore();
  document.getElementById('fest-settings-year').textContent = _getFestYear(store);
  _festSettingsTab = 'holidays';
  document.querySelectorAll('.fest-stab').forEach((b, i) => b.classList.toggle('active', i === 0));
  _renderFestSettingsContent();
}
function closeFestSettingsModal() {
  document.getElementById('fest-settings-overlay').style.display = 'none';
  renderLSFestivos();
}
function festSettingsTab(tab, btn) {
  _festSettingsTab = tab;
  document.querySelectorAll('.fest-stab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  _renderFestSettingsContent();
}

function _renderFestSettingsContent() {
  const container = document.getElementById('fest-settings-content');
  if (!container) return;
  const store = _initFestStore();
  const year = _getFestYear(store);
  const yearData = _getFestYearData(store, year);

  if (_festSettingsTab === 'holidays') {
    const items = (yearData.holidays || []).map((h, i) => `
      <div class="fest-settings-item">
        <span style="font-size:14px">🗓️</span>
        <input class="task-input" value="${esc(h)}" onchange="festUpdateHoliday(${i},this.value)" style="flex:1;padding:4px 8px">
        <button class="btn-icon" onclick="festRemoveHoliday(${i})" title="Eliminar" style="color:var(--danger)">🗑️</button>
      </div>
    `).join('');
    container.innerHTML = `
      <div class="fest-settings-list">${items}</div>
      <div style="margin-top:12px;display:flex;gap:8px">
        <input class="task-input" id="fest-new-holiday-input" placeholder="Nuevo festivo..." style="flex:1;padding:6px 10px">
        <button class="btn btn-primary" onclick="festAddHoliday()" style="font-size:12px">+ Añadir</button>
      </div>
    `;
  } else if (_festSettingsTab === 'people') {
    const names = Object.keys(yearData.people).sort();
    const rows = names.map((n, i) => {
      const sn = _festSafeAttr(n);
      return `
      <div class="fest-person-row">
        <span>${esc(n)}</span>
        <input class="task-input fest-person-total-input" type="number" min="0" value="${yearData.people[n].total || 14}" onchange="festUpdatePersonTotal('${sn}',this.value)">
        <button class="btn-icon" onclick="festRemovePerson('${sn}')" title="Eliminar persona" style="color:var(--danger);font-size:14px">🗑️</button>
      </div>
    `;}).join('');
    container.innerHTML = `
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;display:grid;grid-template-columns:1fr 80px 40px;gap:8px;padding:0 10px">
        <span>Nombre</span><span style="text-align:center">Total fest.</span><span></span>
      </div>
      <div class="fest-settings-list">${rows}</div>
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
        <input class="task-input" id="fest-new-person-name" placeholder="Nombre completo..." style="flex:2;padding:6px 10px;min-width:180px">
        <input class="task-input fest-person-total-input" id="fest-new-person-total" type="number" min="1" value="14" placeholder="Total" style="width:70px">
        <button class="btn btn-primary" onclick="festAddPerson()" style="font-size:12px">+ Añadir persona</button>
      </div>
    `;
  } else if (_festSettingsTab === 'years') {
    const years = Object.keys(store.years).sort();
    const items = years.map(y => {
      const sy = _festSafeAttr(y);
      return `
      <div class="fest-settings-item">
        <span style="font-size:14px">📆</span>
        <span style="flex:1;font-weight:600">${esc(y)}</span>
        <span style="font-size:12px;color:var(--text-secondary)">${Object.keys(store.years[y].people || {}).length} personas</span>
        ${y === year ? '<span class="ls-fest-done" style="font-size:10px">Activo</span>' : `<button class="btn btn-ghost" style="font-size:11px;padding:2px 8px" onclick="festChangeYear('${sy}');closeFestSettingsModal()">Activar</button>`}
        ${years.length > 1 ? `<button class="btn-icon" onclick="festRemoveYear('${sy}')" title="Eliminar año" style="color:var(--danger)">🗑️</button>` : ''}
      </div>`;
    }).join('');
    container.innerHTML = `
      <div class="fest-settings-list">${items}</div>
      <div style="margin-top:12px;display:flex;gap:8px;align-items:center">
        <input class="task-input" id="fest-new-year-input" placeholder="Ej: FY27" style="width:100px;padding:6px 10px">
        <label style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;gap:4px">
          <input type="checkbox" id="fest-copy-people-chk" checked> Copiar personas del año actual
        </label>
        <button class="btn btn-primary" onclick="festAddYear()" style="font-size:12px">+ Crear año</button>
      </div>
    `;
  }
}

// ── Settings actions ──
function festUpdateHoliday(idx, value) {
  const store = _initFestStore();
  const yearData = _getFestYearData(store, _getFestYear(store));
  if (yearData.holidays[idx] !== undefined) {
    yearData.holidays[idx] = value.trim();
    _saveFestStore(store);
  }
}
function festRemoveHoliday(idx) {
  const store = _initFestStore();
  const yearData = _getFestYearData(store, _getFestYear(store));
  yearData.holidays.splice(idx, 1);
  _saveFestStore(store);
  _renderFestSettingsContent();
}
function festAddHoliday() {
  const input = document.getElementById('fest-new-holiday-input');
  const val = input?.value.trim();
  if (!val) return;
  const store = _initFestStore();
  const yearData = _getFestYearData(store, _getFestYear(store));
  yearData.holidays.push(val);
  _saveFestStore(store);
  input.value = '';
  _renderFestSettingsContent();
  showToast('Festivo añadido al catálogo', 'success');
}
function festUpdatePersonTotal(nombre, value) {
  const store = _initFestStore();
  const yearData = _getFestYearData(store, _getFestYear(store));
  if (yearData.people[nombre]) {
    yearData.people[nombre].total = Math.max(0, parseInt(value, 10) || 0);
    _saveFestStore(store);
  }
}
function festRemovePerson(nombre) {
  if (!confirm(`¿Eliminar a "${nombre}" y todas sus devoluciones de este año?`)) return;
  const store = _initFestStore();
  const yearData = _getFestYearData(store, _getFestYear(store));
  delete yearData.people[nombre];
  _saveFestStore(store);
  _renderFestSettingsContent();
  showToast('Persona eliminada', 'success');
}
function festAddPerson() {
  const nameEl = document.getElementById('fest-new-person-name');
  const totalEl = document.getElementById('fest-new-person-total');
  const name = nameEl?.value.trim();
  if (!name) { showToast('Escribe un nombre', 'error'); return; }
  const total = parseInt(totalEl?.value, 10) || 14;
  const store = _initFestStore();
  const yearData = _getFestYearData(store, _getFestYear(store));
  if (yearData.people[name]) { showToast('Esta persona ya existe', 'error'); return; }
  yearData.people[name] = { total, manager: '', devoluciones: [] };
  _saveFestStore(store);
  nameEl.value = '';
  _renderFestSettingsContent();
  showToast('Persona añadida', 'success');
}
function festAddYear() {
  const input = document.getElementById('fest-new-year-input');
  const val = input?.value.trim().toUpperCase();
  if (!val) { showToast('Escribe un nombre de año (ej: FY27)', 'error'); return; }
  if (!/^FY\d{2,4}$/.test(val)) { showToast('Formato inválido. Usa FYxx (ej: FY27, FY2027)', 'error'); return; }
  const store = _initFestStore();
  if (store.years[val]) { showToast('Este año ya existe', 'error'); return; }
  const copyPeople = document.getElementById('fest-copy-people-chk')?.checked;
  const currentYear = _getFestYear(store);
  const currentData = store.years[currentYear];
  const newYear = { holidays: [..._FEST_DEFAULT_HOLIDAYS], people: {} };
  if (copyPeople && currentData) {
    Object.keys(currentData.people).forEach(n => {
      newYear.people[n] = { total: currentData.people[n].total, manager: currentData.people[n].manager || '', devoluciones: [] };
    });
  }
  store.years[val] = newYear;
  store.currentYear = val;
  _saveFestStore(store);
  input.value = '';
  _renderFestSettingsContent();
  showToast(`Año ${val} creado`, 'success');
}
function festRemoveYear(year) {
  if (!confirm(`¿Eliminar el año ${year} y todos sus datos?`)) return;
  const store = _initFestStore();
  delete store.years[year];
  const remaining = Object.keys(store.years);
  if (remaining.length === 0) {
    store.years['FY26'] = { holidays: [..._FEST_DEFAULT_HOLIDAYS], people: {} };
    store.currentYear = 'FY26';
  } else if (store.currentYear === year) {
    store.currentYear = remaining[0];
  }
  _saveFestStore(store);
  _renderFestSettingsContent();
  renderLSFestivos();
  showToast(`Año ${year} eliminado`, 'success');
}

// ── CSV Export ──
function festExportCSV() {
  const store = _initFestStore();
  const year = _getFestYear(store);
  const yearData = _getFestYearData(store, year);
  const names = Object.keys(yearData.people).sort();
  const rows = [['Nombre', 'Total festivos', 'Devueltos', '% Avance', 'Estado', 'Detalle devoluciones']];
  names.forEach(n => {
    const p = yearData.people[n];
    const done = (p.devoluciones || []).length;
    const pct = p.total > 0 ? Math.round((done / p.total) * 100) : 0;
    let estado = 'Pendiente';
    if (done >= p.total) estado = 'Completado';
    else if (done > 0) estado = 'En progreso';
    const detalle = (p.devoluciones || []).map(d => [d.festivo, d.fecha, d.notas].filter(Boolean).join(' - ')).join(' | ');
    rows.push([n, p.total, done, pct + '%', estado, detalle]);
  });
  const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `festivos_${year}_${localDateStr(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV descargado', 'success');
}

// ── Email modal ──
function openFestEmailModal() {
  const overlay = document.getElementById('fest-email-overlay');
  if (!overlay) return;
  const store = _initFestStore();
  const year = _getFestYear(store);
  const yearData = _getFestYearData(store, year);
  const names = Object.keys(yearData.people).sort();

  // Build per-person email rows
  const rows = names.map(n => {
    const p = yearData.people[n];
    const done = (p.devoluciones || []).length;
    const total = p.total || 14;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    let estado = '⏳ Pendiente';
    if (done >= total) estado = '✅ Completado';
    else if (done > 0) estado = `🔄 ${done}/${total}`;
    return `<div class="fest-email-person">
      <label><input type="checkbox" class="fest-email-chk" data-name="${esc(n)}" ${done < total ? 'checked' : ''}> ${esc(n)}</label>
      <span style="font-size:12px;color:var(--text-secondary)">${estado} (${pct}%)</span>
    </div>`;
  }).join('');

  document.getElementById('fest-email-content').innerHTML = `
    <div style="margin-bottom:10px;display:flex;gap:10px;align-items:center">
      <button class="btn btn-ghost" style="font-size:11px" onclick="document.querySelectorAll('.fest-email-chk').forEach(c=>c.checked=true)">Seleccionar todos</button>
      <button class="btn btn-ghost" style="font-size:11px" onclick="document.querySelectorAll('.fest-email-chk').forEach(c=>c.checked=false)">Deseleccionar</button>
      <button class="btn btn-ghost" style="font-size:11px" onclick="document.querySelectorAll('.fest-email-chk').forEach(c=>c.checked=!c.checked)">Invertir</button>
    </div>
    <div style="border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden">${rows}</div>
  `;
  overlay.style.display = 'flex';
}
function closeFestEmailModal() {
  document.getElementById('fest-email-overlay').style.display = 'none';
}

function festSendAllEmails() {
  const store = _initFestStore();
  const year = _getFestYear(store);
  const yearData = _getFestYearData(store, year);
  const checked = document.querySelectorAll('.fest-email-chk:checked');
  if (!checked.length) { showToast('Selecciona al menos una persona', 'error'); return; }

  // Build combined email body
  let body = `RESUMEN DEVOLUCIÓN DE FESTIVOS — ${year}\n`;
  body += `Fecha del informe: ${new Date().toLocaleDateString('es-ES', { dateStyle: 'long' })}\n\n`;
  body += '═══════════════════════════════════════\n\n';

  checked.forEach(chk => {
    const name = chk.dataset.name;
    const p = yearData.people[name];
    if (!p) return;
    const done = (p.devoluciones || []).length;
    const total = p.total || 14;
    const remaining = Math.max(0, total - done);

    body += `▸ ${name}\n`;
    body += `  Estado: ${done >= total ? 'COMPLETADO' : done > 0 ? 'EN PROGRESO' : 'PENDIENTE'} (${done}/${total})\n`;
    if (p.devoluciones?.length) {
      body += `  Festivos devueltos:\n`;
      p.devoluciones.forEach(d => {
        body += `    • ${d.festivo}`;
        if (d.fecha) body += ` — ${d.fecha}`;
        if (d.notas) body += ` (${d.notas})`;
        body += '\n';
      });
    }
    if (remaining > 0) {
      body += `  ⚠️ Quedan ${remaining} festivos por devolver\n`;
    }
    body += '\n';
  });

  body += '═══════════════════════════════════════\n';
  body += `Total personas: ${checked.length}\n`;
  body += `Generado automáticamente desde Dashboard Personal`;

  const subject = `Resumen Devolución Festivos — ${year} — ${new Date().toLocaleDateString('es-ES')}`;
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  showToast('Email generado', 'success');
  closeFestEmailModal();
}

function festSendIndividualEmail(nombre) {
  const store = _initFestStore();
  const year = _getFestYear(store);
  const yearData = _getFestYearData(store, year);
  const p = yearData.people[nombre];
  if (!p) return;

  const done = (p.devoluciones || []).length;
  const total = p.total || 14;
  const remaining = Math.max(0, total - done);

  let body = `Hola,\n\nTe informo del estado de devolución de festivos ${year} para ${nombre}:\n\n`;
  body += `Estado: ${done >= total ? 'COMPLETADO ✅' : done > 0 ? 'EN PROGRESO 🔄' : 'PENDIENTE ⏳'} (${done}/${total})\n\n`;

  if (p.devoluciones?.length) {
    body += `Festivos devueltos hasta la fecha:\n`;
    p.devoluciones.forEach(d => {
      body += `  • ${d.festivo}`;
      if (d.fecha) body += ` — ${d.fecha}`;
      if (d.notas) body += ` (${d.notas})`;
      body += '\n';
    });
    body += '\n';
  }

  if (remaining > 0) {
    body += `⚠️ Quedan ${remaining} festivos por devolver.\n\n`;
  } else {
    body += `✅ Todos los festivos han sido devueltos.\n\n`;
  }
  body += `Un saludo`;

  const subject = `Devolución Festivos ${year} — ${nombre}`;
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ── renderLSPeticiones ──
let _lsPetFilter = 'todos';

function setLSPetFilter(f, btn) {
  _lsPetFilter = f;
  document.querySelectorAll('.ls-pet-filter').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderLSPeticiones();
}

function openLSPetForm() {
  const wrap = document.getElementById('ls-pet-form-wrap');
  if (wrap) wrap.style.display = '';
  // Populate managers datalist
  const dl = document.getElementById('ls-pet-managers-list');
  if (dl) {
    const names = (typeof equipoLiderazgo !== 'undefined' ? equipoLiderazgo : []).map(m => m.nombre);
    dl.innerHTML = names.map(n => `<option value="${esc(n)}">`).join('');
  }
}

function closeLSPetForm() {
  const wrap = document.getElementById('ls-pet-form-wrap');
  if (wrap) wrap.style.display = 'none';
  ['ls-pet-titulo','ls-pet-solicitante','ls-pet-notas'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const pri = document.getElementById('ls-pet-prioridad'); if (pri) pri.value = 'media';
}

function addLSPeticion() {
  function getVal(id, def) { const el = document.getElementById(id); return el ? (el.value || def) : def; }
  const titulo = getVal('ls-pet-titulo', '');
  if (!titulo.trim()) { showToast('El título es obligatorio', 'error'); return; }
  const peticiones = load('apg_ls_peticiones', []);
  peticiones.push({
    id: Date.now(),
    titulo: titulo.trim(),
    solicitante: getVal('ls-pet-solicitante', ''),
    prioridad: getVal('ls-pet-prioridad', 'media'),
    estado: 'pendiente',
    fecha: new Date().toISOString().slice(0,10),
    notas: getVal('ls-pet-notas', '')
  });
  save('apg_ls_peticiones', peticiones);
  closeLSPetForm();
  renderLSPeticiones();
  showToast('Petición añadida', 'success');
}

function moveLSPeticion(id, dir) {
  const peticiones = load('apg_ls_peticiones', []);
  const p = peticiones.find(x => x.id === id);
  if (!p) return;
  const states = ['pendiente','proceso','completado'];
  const idx = states.indexOf(p.estado);
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= states.length) return;
  p.estado = states[newIdx];
  save('apg_ls_peticiones', peticiones);
  renderLSPeticiones();
}

function deleteLSPeticion(id) {
  if (!confirm('¿Eliminar esta petición?')) return;
  const peticiones = load('apg_ls_peticiones', []).filter(x => x.id !== id);
  save('apg_ls_peticiones', peticiones);
  renderLSPeticiones();
}

function renderLSPeticiones() {
  const list = document.getElementById('ls-peticiones-list');
  const badge = document.getElementById('ls-pet-badge');
  if (!list) return;

  const all = load('apg_ls_peticiones', []);
  const pendCount = all.filter(p => p.estado === 'pendiente').length;
  if (badge) { badge.textContent = pendCount; badge.style.display = pendCount > 0 ? '' : 'none'; }

  const filtered = all.filter(p => {
    if (_lsPetFilter === 'todos') return true;
    return p.estado === _lsPetFilter;
  });

  if (!filtered.length) { list.innerHTML = '<div class="empty-state"><p>No hay peticiones en este estado.</p></div>'; return; }

  const priBadge = { alta:'🔴 Alta', media:'🟡 Media', baja:'🟢 Baja' };
  const estBadge = { pendiente:'⏳ Pendiente', proceso:'🔄 En Proceso', completado:'✅ Completado' };
  const estCls   = { pendiente:'ls-pet-pend', proceso:'ls-pet-proc', completado:'ls-pet-done' };

  const sorted = [...filtered].sort((a,b) => {
    const stateOrder = { pendiente:0, proceso:1, completado:2 };
    const priOrder = { alta:0, media:1, baja:2 };
    if (stateOrder[a.estado] !== stateOrder[b.estado]) return stateOrder[a.estado] - stateOrder[b.estado];
    return priOrder[a.prioridad] - priOrder[b.prioridad];
  });

  list.innerHTML = `<div class="card">${sorted.map(p => `
    <div class="ls-pet-item ${estCls[p.estado]}">
      <div class="ls-pet-item-header">
        <span class="ls-pet-pri-badge ls-pet-pri-${p.prioridad}">${priBadge[p.prioridad]}</span>
        <span class="ls-pet-est-badge ${estCls[p.estado]}">${estBadge[p.estado]}</span>
        <span class="ls-pet-date">${p.fecha}</span>
      </div>
      <div class="ls-pet-titulo-text">${esc(p.titulo)}</div>
      ${p.solicitante ? `<div class="ls-pet-solicitante">👤 ${esc(p.solicitante)}</div>` : ''}
      ${p.notas ? `<div class="ls-pet-notas">${esc(p.notas)}</div>` : ''}
      <div class="ls-pet-actions">
        ${p.estado !== 'pendiente'   ? `<button class="btn btn-ghost" style="font-size:12px;padding:3px 8px" onclick="moveLSPeticion(${p.id},-1)">← Atrás</button>` : ''}
        ${p.estado !== 'completado'  ? `<button class="btn btn-primary" style="font-size:12px;padding:3px 8px" onclick="moveLSPeticion(${p.id},1)">Avanzar →</button>` : ''}
        <button class="btn btn-ghost" style="font-size:12px;padding:3px 8px;color:var(--danger)" onclick="deleteLSPeticion(${p.id})">🗑 Eliminar</button>
      </div>
    </div>`).join('')}</div>`;
}

/* ═══════════════════════════════════════════════
   LEADERSHIP INDEX
═══════════════════════════════════════════════ */

const K_LS_INDEX = 'apg_ls_index';
const LS_INDEX_METRICS = ['Métrica 1', 'Métrica 2', 'Métrica 3', 'Métrica 4'];

function _getLSIndexData() {
  return load(K_LS_INDEX, {});
}

function _getLSIndexKey(year, month) {
  return `${year}-${String(month).padStart(2,'0')}`;
}

function renderLeadershipIndex() {
  const wrap = document.getElementById('ls-index-wrap');
  if (!wrap) return;

  const now = new Date();
  const yearEl  = document.getElementById('ls-index-year');
  const monthEl = document.getElementById('ls-index-month');
  if (!yearEl || !monthEl) return;

  const year  = parseInt(yearEl.value)  || now.getFullYear();
  const month = parseInt(monthEl.value) || (now.getMonth() + 1);
  const key   = _getLSIndexKey(year, month);
  const allData = _getLSIndexData();
  const monthData = allData[key] || {};

  const headerCols = LS_INDEX_METRICS.map(m => `<th style="text-align:center;min-width:100px">${esc(m)}</th>`).join('');
  const rows = equipoLiderazgo.map(p => {
    const rowData = monthData[p.id] || {};
    const metricCells = LS_INDEX_METRICS.map((_, mi) => {
      const val = rowData[`m${mi}`] || '';
      return `<td style="text-align:center"><input class="task-input ls-index-cell" style="width:80px;text-align:center;padding:3px 6px" data-pid="${p.id}" data-mi="${mi}" value="${esc(val)}" placeholder="—" oninput="lsIndexCellChange()"></td>`;
    }).join('');
    return `<tr>
      <td style="font-weight:600;white-space:nowrap;padding:4px 8px"><a href="javascript:goToProfile(${p.id})" style="color:var(--text-primary);text-decoration:none" title="Ver perfil">${esc(p.nombre)}</a></td>
      <td style="color:var(--text-secondary);font-size:12px;padding:4px 8px">${esc(p.rol)}</td>
      ${metricCells}
    </tr>`;
  }).join('');

  const lastSaved = monthData.__savedAt__
    ? `Último guardado: ${new Date(monthData.__savedAt__).toLocaleString('es-ES')}`
    : 'Sin guardar todavía';

  // Build history section
  const historyKeys = Object.keys(allData).filter(k => /^\d{4}-\d{2}$/.test(k)).sort();
  const MESES_ABREV = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  let historyHtml = '';
  if (historyKeys.length > 0) {
    const histRows = historyKeys.map(hk => {
      const hData = allData[hk] || {};
      const [hYear, hMonth] = hk.split('-');
      const monthLabel = `${MESES_ABREV[parseInt(hMonth)] || hMonth} ${hYear}`;
      const isCurrent = hk === key;
      const cells = equipoLiderazgo.map(p => {
        const vals = LS_INDEX_METRICS.map((_, mi) => {
          const v = (hData[p.id] || {})[`m${mi}`];
          return v !== undefined && v !== '' ? String(v) : '—';
        });
        return `<td style="text-align:center;font-size:11px;padding:3px 6px">${vals.join(' / ')}</td>`;
      }).join('');
      // Sparkline per person (using all history)
      return `<tr style="${isCurrent?'background:rgba(0,113,227,0.06)':''}">
        <td style="font-weight:600;padding:4px 8px;white-space:nowrap;font-size:12px">${esc(monthLabel)}</td>
        ${cells}
        <td style="text-align:center;padding:4px 8px">
          <button class="btn btn-ghost" style="font-size:11px;padding:3px 8px;color:var(--danger)" onclick="deleteLSIndexMonth('${hk}')" title="Borrar datos de ${esc(monthLabel)}">🗑️</button>
        </td>
      </tr>`;
    }).join('');
    // Trend row per person (show ▲▼ based on last 2 months)
    const trendCells = equipoLiderazgo.map(p => {
      const vals = historyKeys.map(hk => {
        const d = allData[hk][p.id] || {};
        const nums = LS_INDEX_METRICS.map((_, mi) => parseFloat(d[`m${mi}`])).filter(v => !isNaN(v));
        return nums.length ? nums.reduce((s, v) => s + v, 0) / nums.length : null;
      }).filter(v => v !== null);
      let trend = '';
      if (vals.length >= 2) {
        const diff = vals[vals.length-1] - vals[vals.length-2];
        if (diff > 0) trend = `<span style="color:var(--success)">▲</span>`;
        else if (diff < 0) trend = `<span style="color:var(--danger)">▼</span>`;
        else trend = `<span style="color:var(--text-secondary)">─</span>`;
      }
      // Simple sparkline using inline divs
      let spark = '';
      if (vals.length >= 2) {
        const min = Math.min(...vals), max = Math.max(...vals);
        const range = max - min || 1;
        spark = `<div style="display:flex;align-items:flex-end;gap:1px;height:16px;margin-top:2px">${
          vals.slice(-6).map(v => {
            const h = Math.round(((v - min) / range) * 14) + 2;
            return `<div style="width:4px;height:${h}px;background:var(--accent);border-radius:1px;flex-shrink:0"></div>`;
          }).join('')
        }</div>`;
      }
      return `<td style="text-align:center;padding:4px 6px">${trend}${spark}</td>`;
    }).join('');
    const personHeaderCols = equipoLiderazgo.map(p =>
      `<th style="text-align:center;min-width:90px;font-size:11px;padding:4px 6px">${esc(p.nombre.split(' ')[0])}</th>`
    ).join('');
    historyHtml = `
      <div style="margin-top:20px">
        <button class="btn btn-ghost" style="font-size:13px;width:100%;text-align:left" onclick="toggleLSIndexHistory(this)">
          📈 Histórico <span id="ls-history-arrow">▶</span>
        </button>
        <div id="ls-index-history" style="display:none;margin-top:8px;overflow-x:auto">
          <table class="ls-vac-table" style="width:100%;font-size:12px">
            <thead><tr>
              <th style="text-align:left;min-width:90px;padding:4px 8px">Mes</th>
              ${personHeaderCols}
              <th></th>
            </tr></thead>
            <tbody>${histRows}</tbody>
            <tfoot><tr>
              <td style="font-weight:600;font-size:11px;padding:4px 8px;color:var(--text-secondary)">Tendencia</td>
              ${trendCells}
              <td></td>
            </tr></tfoot>
          </table>
        </div>
      </div>`;
  }

  wrap.innerHTML = `
    <table class="ls-vac-table" style="width:100%;font-size:13px">
      <thead><tr>
        <th style="text-align:left;min-width:160px">Nombre</th>
        <th style="text-align:left;min-width:120px;color:var(--text-secondary)">Rol</th>
        ${headerCols}
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="margin-top:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="saveLeadershipIndex()">💾 Guardar</button>
      <button class="btn btn-ghost" onclick="newLeadershipIndexMonth()">📋 Nuevo mes</button>
      <span style="font-size:12px;color:var(--text-secondary)" id="ls-index-status">${esc(lastSaved)}</span>
    </div>
    ${historyHtml}`;
}

function toggleLSIndexHistory(btn) {
  const panel = document.getElementById('ls-index-history');
  const arrow = document.getElementById('ls-history-arrow');
  if (!panel) return;
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : '';
  if (arrow) arrow.textContent = isOpen ? '▶' : '▼';
}

function deleteLSIndexMonth(monthKey) {
  if (!confirm(`¿Eliminar los datos de ${monthKey}?`)) return;
  const allData = _getLSIndexData();
  delete allData[monthKey];
  save(K_LS_INDEX, allData);
  renderLeadershipIndex();
  showToast('Mes eliminado', 'success');
}

function lsIndexCellChange() {
  const statusEl = document.getElementById('ls-index-status');
  if (statusEl) statusEl.textContent = '✏️ Editando...';
}

function saveLeadershipIndex() {
  const yearEl  = document.getElementById('ls-index-year');
  const monthEl = document.getElementById('ls-index-month');
  if (!yearEl || !monthEl) return;
  const year  = parseInt(yearEl.value);
  const month = parseInt(monthEl.value);
  const key   = _getLSIndexKey(year, month);

  const allData = _getLSIndexData();
  const monthData = allData[key] || {};

  document.querySelectorAll('.ls-index-cell').forEach(inp => {
    const pid = parseInt(inp.dataset.pid);
    const mi  = parseInt(inp.dataset.mi);
    if (!monthData[pid]) monthData[pid] = {};
    monthData[pid][`m${mi}`] = inp.value;
  });
  monthData.__savedAt__ = new Date().toISOString();
  allData[key] = monthData;
  save(K_LS_INDEX, allData);

  const statusEl = document.getElementById('ls-index-status');
  if (statusEl) statusEl.textContent = `Último guardado: ${new Date().toLocaleString('es-ES')}`;
  showToast('Leadership Index guardado', 'success');
}

function newLeadershipIndexMonth() {
  const yearEl  = document.getElementById('ls-index-year');
  const monthEl = document.getElementById('ls-index-month');
  if (!yearEl || !monthEl) return;
  if (!confirm('¿Limpiar los datos del mes actual para empezar uno nuevo?')) return;
  const year  = parseInt(yearEl.value);
  const month = parseInt(monthEl.value);
  const key   = _getLSIndexKey(year, month);
  const allData = _getLSIndexData();
  delete allData[key];
  save(K_LS_INDEX, allData);
  renderLeadershipIndex();
  showToast('Formulario limpiado para nuevo mes', 'success');
}

/* ── Q Ratings Overview in Leadership Index ── */
function renderLSQOverview() {
  const wrap = document.getElementById('ls-q-overview-wrap');
  const selEl = document.getElementById('ls-q-overview-select');
  if (!wrap || !selEl) return;

  const allFQs = _getAllFQOptions();
  const curFQ = _getCurrentFQ();
  const curKey = `${curFQ.fy}-${curFQ.q}`;

  // Populate select if empty
  if (!selEl.options.length || selEl.options.length <= 1) {
    selEl.innerHTML = allFQs.map(fq =>
      `<option value="${fq}" ${fq === curKey ? 'selected' : ''}>${_fqLabel(fq)}</option>`
    ).join('');
  }

  const selectedFQ = selEl.value || curKey;
  const qr = _loadQRatings();
  const scoreMap = { 'EM': 1, 'AE': 2, 'EE': 3 };

  let html = `<div style="overflow-x:auto"><table class="ls-vac-table" style="width:100%;font-size:13px">
    <thead><tr>
      <th style="text-align:left;min-width:160px">Nombre</th>
      <th style="text-align:left;min-width:100px;color:var(--text-secondary)">Rol</th>
      <th style="text-align:center;min-width:100px">🤝 Teamwork</th>
      <th style="text-align:center;min-width:100px">💡 Innovación</th>
      <th style="text-align:center;min-width:100px">🎯 Resultados</th>
      <th style="text-align:center;min-width:70px">Media</th>
      <th style="text-align:center;min-width:60px"></th>
    </tr></thead><tbody>`;

  const visibleTeam = team.filter(m => !m.hidden);
  let teamScores = [];

  visibleTeam.forEach(m => {
    const ratings = (qr[m.id] || {})[selectedFQ] || {};
    const scores = Q_PARAMS.map(p => scoreMap[ratings[p]]).filter(v => v);
    const avg = scores.length ? (scores.reduce((a,b) => a+b, 0) / scores.length) : 0;
    if (avg > 0) teamScores.push(avg);
    const avgLabel = avg >= 2.5 ? '🌟' : avg >= 1.5 ? '✅' : avg > 0 ? '🔻' : '—';

    html += `<tr>
      <td style="font-weight:600;padding:6px 8px"><a href="javascript:goToProfile(${m.id})" style="color:var(--text-primary);text-decoration:none">${esc(m.name)}</a></td>
      <td style="color:var(--text-secondary);font-size:12px;padding:6px 8px">${esc(m.role)}</td>
      <td style="text-align:center;padding:6px 8px">${_getRatingBadge(ratings.teamwork || '')}</td>
      <td style="text-align:center;padding:6px 8px">${_getRatingBadge(ratings.innovation || '')}</td>
      <td style="text-align:center;padding:6px 8px">${_getRatingBadge(ratings.results || '')}</td>
      <td style="text-align:center;padding:6px 8px;font-size:15px">${avgLabel}</td>
      <td style="text-align:center;padding:6px 8px"><a href="javascript:goToProfile(${m.id})" style="font-size:11px;color:var(--accent);text-decoration:none">Editar →</a></td>
    </tr>`;
  });

  html += `</tbody></table></div>`;

  // Team average summary
  if (teamScores.length) {
    const teamAvg = teamScores.reduce((a,b) => a+b, 0) / teamScores.length;
    const teamLabel = teamAvg >= 2.5 ? 'Exceed Expectations' : teamAvg >= 1.5 ? 'Achieve Expectations' : 'Expected More';
    const teamColor = teamAvg >= 2.5 ? 'var(--success)' : teamAvg >= 1.5 ? 'var(--warning)' : 'var(--danger)';
    html += `<div style="margin-top:12px;padding:12px;background:var(--surface2);border-radius:var(--radius-sm);display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <span style="font-size:13px;font-weight:600">📊 Media del equipo:</span>
      <span style="font-size:14px;font-weight:700;color:${teamColor}">${teamAvg.toFixed(1)} — ${teamLabel}</span>
      <span style="font-size:11px;color:var(--text-secondary)">(${teamScores.length} de ${visibleTeam.length} evaluados)</span>
    </div>`;
  }

  wrap.innerHTML = html;
}

/* ═══════════════════════════════════════════════
   MANAGER PROFILES — Fichas completas con ratings Q
═══════════════════════════════════════════════ */
const K_Q_RATINGS  = 'apg_q_ratings';   // { [personId]: { "FY26-Q1": { teamwork, innovation, results, notes, updatedAt }, ... } }
const K_PROFILES   = 'apg_profiles';    // { [personId]: { bio, hireDate, goals, strengths, devFocus, updatedAt } }

const Q_RATING_OPTIONS = [
  { value: '',   label: '—',                       color: 'var(--text-secondary)' },
  { value: 'EM', label: 'EM — Expected More',      color: 'var(--danger)',  bg: 'rgba(255,59,48,0.10)',  icon: '🔻' },
  { value: 'AE', label: 'AE — Achieve Expectations',color: 'var(--warning)', bg: 'rgba(255,159,10,0.10)', icon: '✅' },
  { value: 'EE', label: 'EE — Exceed Expectations', color: 'var(--success)', bg: 'rgba(52,199,89,0.10)',  icon: '🌟' }
];
const Q_PARAMS = ['teamwork', 'innovation', 'results'];
const Q_PARAM_LABELS = { teamwork: '🤝 Teamwork', innovation: '💡 Innovación', results: '🎯 Resultados' };

/* ── Fiscal year / quarter helpers ── */
function _getCurrentFQ() {
  const now = new Date();
  const m = now.getMonth() + 1; // 1-12
  const y = now.getFullYear();
  // Apple FY: Q1=Oct-Dec, Q2=Jan-Mar, Q3=Apr-Jun, Q4=Jul-Sep
  if (m >= 10) return { fy: `FY${(y + 1) % 100}`, q: 'Q1', label: `FY${String((y + 1) % 100).padStart(2,'0')} Q1` };
  if (m >= 7)  return { fy: `FY${y % 100}`, q: 'Q4', label: `FY${String(y % 100).padStart(2,'0')} Q4` };
  if (m >= 4)  return { fy: `FY${y % 100}`, q: 'Q3', label: `FY${String(y % 100).padStart(2,'0')} Q3` };
  return { fy: `FY${y % 100}`, q: 'Q2', label: `FY${String(y % 100).padStart(2,'0')} Q2` };
}

function _getAllFQOptions() {
  // Generate FY25 Q1 through FY28 Q4
  const opts = [];
  for (let fy = 25; fy <= 28; fy++) {
    for (let q = 1; q <= 4; q++) {
      opts.push(`FY${String(fy).padStart(2,'0')}-Q${q}`);
    }
  }
  return opts;
}

function _fqLabel(fqKey) {
  return fqKey.replace('-', ' ');
}

/* ── Profile data accessors ── */
function _loadProfiles()  { return load(K_PROFILES, {}); }
function _loadQRatings()  { return load(K_Q_RATINGS, {}); }
function _saveProfiles(d) { save(K_PROFILES, d); }
function _saveQRatings(d) { save(K_Q_RATINGS, d); }

/* ── Profiles view state ── */
let _profilesView = 'grid';
let _profileDetailId = null;

function setProfilesView(view) {
  _profilesView = view;
  document.getElementById('profiles-view-grid').classList.toggle('active', view === 'grid');
  document.getElementById('profiles-view-detail').classList.toggle('active', view === 'detail');
  if (view === 'grid') {
    document.getElementById('profiles-grid-view').style.display = '';
    document.getElementById('profiles-detail-view').style.display = 'none';
    renderProfilesGrid();
  }
}

function _getRatingBadge(val) {
  const opt = Q_RATING_OPTIONS.find(o => o.value === val);
  if (!opt || !val) return '<span style="color:var(--text-secondary);font-size:11px">—</span>';
  return `<span style="display:inline-block;padding:2px 8px;border-radius:8px;font-size:11px;font-weight:600;background:${opt.bg};color:${opt.color}">${opt.icon} ${val}</span>`;
}

function _getProfileSummary(personId) {
  const tbs = load(K.tbs, {});
  const recogs = load(K.reconocimientos, []);
  const sbi = load(K_SBI, []);
  const pdis = load(K.pdis, {});
  const kb = load(K.kanban, {});
  const qr = _loadQRatings();
  const ratings = qr[personId] || {};

  const tbSessions = tbs[personId] || [];
  const lastTB = tbSessions.length ? tbSessions.slice().sort((a,b) => (b.date||'').localeCompare(a.date||''))[0] : null;
  const daysSinceLastTB = lastTB ? Math.floor((Date.now() - new Date(lastTB.date)) / 86400000) : 999;
  const tbLight = daysSinceLastTB <= 7 ? '🟢' : daysSinceLastTB <= 21 ? '🟡' : '🔴';

  const recogCount = recogs.filter(r => r.personId === personId).length;
  const sbiCount = sbi.filter(s => String(s.personId) === String(personId)).length;
  const pdi = pdis[personId] || {};
  const hasPDI = !!(pdi.strengths || pdi.weekGoal || pdi.devAreas);

  // Kanban position
  const kbCol = kb[personId] || null;
  const kbLabel = kbCol === 'volando' ? '🚀 Volando' : kbCol === 'seguimiento' ? '🔄 Seguimiento' : kbCol === 'desarrollo' ? '📈 Desarrollo' : '';

  // Current Q rating
  const curFQ = _getCurrentFQ();
  const curKey = `${curFQ.fy}-${curFQ.q}`;
  const curRating = ratings[curKey] || {};

  return { tbSessions: tbSessions.length, lastTB, daysSinceLastTB, tbLight, recogCount, sbiCount, hasPDI, pdi, kbCol, kbLabel, curRating, curKey, ratings };
}

/* ── Render the profiles grid ── */
function renderProfilesGrid() {
  const grid = document.getElementById('profiles-grid');
  if (!grid) return;

  const profiles = _loadProfiles();
  const visibleTeam = team.filter(m => !m.hidden);

  if (!visibleTeam.length) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👤</div><p>No hay managers registrados. Añade miembros en Mi Equipo.</p></div>';
    return;
  }

  grid.innerHTML = visibleTeam.map((m, i) => {
    const s = _getProfileSummary(m.id);
    const curFQ = _getCurrentFQ();
    const profile = profiles[m.id] || {};

    // Rating summary for current Q
    const ratingHtml = Q_PARAMS.map(p => {
      const val = s.curRating[p] || '';
      return `<div style="display:flex;align-items:center;gap:4px;font-size:11px">${Q_PARAM_LABELS[p].split(' ')[0]} ${_getRatingBadge(val)}</div>`;
    }).join('');

    // Count total ratings across all Qs
    const totalRatedQs = Object.keys(s.ratings).filter(k => {
      const r = s.ratings[k];
      return r && (r.teamwork || r.innovation || r.results);
    }).length;

    return `
    <div class="profile-card" onclick="openProfileDetail(${m.id})">
      <div class="profile-card-header">
        <div class="profile-avatar" style="background:${COLORS[i%COLORS.length]}">${initials(m.name)}</div>
        <div style="flex:1;min-width:0">
          <div class="profile-card-name">${esc(m.name)}</div>
          <div class="profile-card-role">${esc(m.role)}</div>
          ${m.email ? `<div style="font-size:10px;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(m.email)}</div>` : ''}
        </div>
        <div style="text-align:right">
          <span title="Estado 1:1">${s.tbLight}</span>
          ${s.kbLabel ? `<div style="font-size:10px;margin-top:2px">${s.kbLabel}</div>` : ''}
        </div>
      </div>

      <div class="profile-card-stats">
        <div class="profile-stat"><span class="profile-stat-val">${s.tbSessions}</span><span class="profile-stat-lbl">TB/1:1</span></div>
        <div class="profile-stat"><span class="profile-stat-val">${s.sbiCount}</span><span class="profile-stat-lbl">Feedbacks</span></div>
        <div class="profile-stat"><span class="profile-stat-val">${s.recogCount}</span><span class="profile-stat-lbl">Reconoc.</span></div>
        <div class="profile-stat"><span class="profile-stat-val">${totalRatedQs}</span><span class="profile-stat-lbl">Qs rated</span></div>
      </div>

      <div style="padding:0 14px 12px">
        <div style="font-size:11px;font-weight:600;color:var(--text-secondary);margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">${_fqLabel(s.curKey)}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${ratingHtml}</div>
      </div>

      ${s.hasPDI ? '<div style="padding:0 14px 10px"><span style="font-size:10px;background:rgba(52,199,89,0.15);color:var(--success);border-radius:6px;padding:2px 8px;font-weight:600">📈 PDI activo</span></div>' : ''}
    </div>`;
  }).join('');
}

/* ── Open profile detail view ── */
function openProfileDetail(personId) {
  _profileDetailId = personId;
  const m = team.find(t => t.id === personId);
  if (!m) return;

  document.getElementById('profiles-grid-view').style.display = 'none';
  document.getElementById('profiles-detail-view').style.display = '';
  document.getElementById('profile-detail-name').innerHTML = `${esc(m.name)} <span style="font-size:14px;font-weight:400;color:var(--text-secondary)">— ${esc(m.role)}</span>`;

  _renderProfileDetail(personId);
}

function closeProfileDetail() {
  _profileDetailId = null;
  document.getElementById('profiles-grid-view').style.display = '';
  document.getElementById('profiles-detail-view').style.display = 'none';
  _profilesView = 'grid';
  document.getElementById('profiles-view-grid').classList.add('active');
  document.getElementById('profiles-view-detail').classList.remove('active');
  renderProfilesGrid();
}

function _renderProfileDetail(personId) {
  const wrap = document.getElementById('profile-detail-content');
  if (!wrap) return;

  const m = team.find(t => t.id === personId);
  if (!m) { wrap.innerHTML = ''; return; }

  const idx = team.indexOf(m);
  const s = _getProfileSummary(personId);
  const profiles = _loadProfiles();
  const profile = profiles[personId] || {};
  const pdis = load(K.pdis, {});
  const pdi = pdis[personId] || {};
  const recogs = load(K.reconocimientos, []).filter(r => r.personId === personId).sort((a,b) => (b.date||'').localeCompare(a.date||'')).slice(0, 5);
  const sbi = load(K_SBI, []).filter(s2 => String(s2.personId) === String(personId)).slice(0, 5);

  const curFQ = _getCurrentFQ();
  const allFQs = _getAllFQOptions();
  const qr = _loadQRatings();
  const ratings = qr[personId] || {};

  let html = `<div class="profile-detail-layout">`;

  /* ── LEFT COLUMN: Profile info + quick actions ── */
  html += `<div class="profile-detail-left">`;

  // Profile header card
  html += `<div class="card" style="text-align:center;padding:24px">
    <div class="profile-avatar-lg" style="background:${COLORS[idx%COLORS.length]};margin:0 auto 12px">${initials(m.name)}</div>
    <div style="font-size:18px;font-weight:700">${esc(m.name)}</div>
    <div style="font-size:13px;color:var(--text-secondary)">${esc(m.role)}</div>
    ${m.email ? `<div style="font-size:12px;color:var(--accent);margin-top:4px">${esc(m.email)}</div>` : ''}
    <div style="margin-top:12px;display:flex;gap:6px;justify-content:center;flex-wrap:wrap">
      <span class="profile-stat-pill">${s.tbLight} ${s.daysSinceLastTB === 999 ? 'Sin 1:1' : s.daysSinceLastTB === 0 ? '1:1 hoy' : `1:1 hace ${s.daysSinceLastTB}d`}</span>
      ${s.kbLabel ? `<span class="profile-stat-pill">${s.kbLabel}</span>` : ''}
      ${s.hasPDI ? '<span class="profile-stat-pill">📈 PDI</span>' : ''}
    </div>
  </div>`;

  // Quick stats
  html += `<div class="card">
    <div class="card-title">📊 Resumen</div>
    <div class="profile-quick-stats">
      <div class="profile-qs-item"><div class="profile-qs-val">${s.tbSessions}</div><div class="profile-qs-lbl">Sesiones TB</div></div>
      <div class="profile-qs-item"><div class="profile-qs-val">${s.sbiCount}</div><div class="profile-qs-lbl">Feedbacks SBI</div></div>
      <div class="profile-qs-item"><div class="profile-qs-val">${s.recogCount}</div><div class="profile-qs-lbl">Reconocimientos</div></div>
    </div>
  </div>`;

  // Quick actions
  html += `<div class="card">
    <div class="card-title">⚡ Acciones rápidas</div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <button class="btn btn-ghost" style="text-align:left;font-size:12px" onclick="openTBModal(${personId})">🤝 Nueva sesión TB / 1:1</button>
      <button class="btn btn-ghost" style="text-align:left;font-size:12px" onclick="openPDIModal(${personId})">📈 Editar PDI</button>
      <button class="btn btn-ghost" style="text-align:left;font-size:12px" onclick="goToFeedbackFor(${personId})">💬 Dar Feedback SBI</button>
      <button class="btn btn-ghost" style="text-align:left;font-size:12px" onclick="open1on1PrepModal(${personId})">📋 Preparar 1:1</button>
      <button class="btn btn-ghost" style="text-align:left;font-size:12px" onclick="sendProfileEmail(${personId})">📧 Enviar resumen por email</button>
    </div>
  </div>`;

  // Profile notes (editable)
  html += `<div class="card">
    <div class="card-title">📝 Notas del perfil</div>
    <textarea class="notes-area" id="profile-bio-${personId}" placeholder="Notas generales sobre esta persona (contexto, fortalezas, estilo de trabajo...)" style="min-height:80px;font-size:13px" oninput="saveProfileField(${personId},'bio',this.value)">${esc(profile.bio || '')}</textarea>
    <div style="margin-top:10px">
      <div class="field-label">📅 Fecha de incorporación</div>
      <input class="task-input" id="profile-hiredate-${personId}" type="date" value="${esc(profile.hireDate || '')}" style="width:100%" onchange="saveProfileField(${personId},'hireDate',this.value)">
    </div>
  </div>`;

  html += `</div>`; // end left

  /* ── RIGHT COLUMN: Ratings + history ── */
  html += `<div class="profile-detail-right">`;

  // ─── Q RATINGS ───
  html += `<div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:14px">
      <div class="card-title" style="margin-bottom:0">📊 Ratings Trimestrales</div>
      <select class="task-select" id="profile-q-select-${personId}" onchange="_renderProfileQRating(${personId})" style="min-width:130px">
        ${allFQs.map(fq => `<option value="${fq}" ${fq === `${curFQ.fy}-${curFQ.q}` ? 'selected' : ''}>${_fqLabel(fq)}</option>`).join('')}
      </select>
    </div>
    <div id="profile-q-rating-${personId}"></div>
  </div>`;

  // ─── RATINGS TIMELINE ───
  html += `<div class="card">
    <div class="card-title">📈 Evolución de Ratings</div>
    <div id="profile-ratings-timeline-${personId}"></div>
  </div>`;

  // ─── PDI SUMMARY ───
  html += `<div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px">
      <div class="card-title" style="margin-bottom:0">📈 Plan de Desarrollo (PDI)</div>
      <button class="btn btn-ghost" style="font-size:11px" onclick="openPDIModal(${personId})">✏️ Editar</button>
    </div>`;
  if (pdi.strengths || pdi.devAreas || pdi.weekGoal || pdi.nextRole) {
    if (pdi.strengths) html += `<div style="margin-bottom:8px"><strong style="font-size:12px;color:var(--success)">💪 Fortalezas:</strong><div style="font-size:13px;margin-top:2px">${esc(pdi.strengths)}</div></div>`;
    if (pdi.devAreas) html += `<div style="margin-bottom:8px"><strong style="font-size:12px;color:var(--warning)">🌱 Áreas de desarrollo:</strong><div style="font-size:13px;margin-top:2px">${esc(pdi.devAreas)}</div></div>`;
    if (pdi.weekGoal) html += `<div style="margin-bottom:8px"><strong style="font-size:12px;color:var(--accent)">🎯 Objetivo:</strong><div style="font-size:13px;margin-top:2px">${esc(pdi.weekGoal)}</div></div>`;
    if (pdi.nextRole) html += `<div style="margin-bottom:8px"><strong style="font-size:12px;color:var(--text-primary)">🚀 Próximo rol:</strong><div style="font-size:13px;margin-top:2px">${esc(pdi.nextRole)}</div></div>`;
  } else {
    html += `<div style="font-size:13px;color:var(--text-secondary)">Sin PDI guardado. <a href="javascript:openPDIModal(${personId})" style="color:var(--accent)">Crear uno →</a></div>`;
  }
  html += `</div>`;

  // ─── RECENT FEEDBACK ───
  html += `<div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px">
      <div class="card-title" style="margin-bottom:0">💬 Últimos Feedbacks SBI</div>
      <button class="btn btn-ghost" style="font-size:11px" onclick="goToFeedbackFor(${personId})">Ver todos →</button>
    </div>`;
  if (sbi.length) {
    sbi.forEach(h => {
      html += `<div class="recog-item" style="flex-direction:column;gap:4px;padding:10px;margin-bottom:6px">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="font-size:11px;color:var(--accent)">${fmtDate(h.date)}</span>
          <span class="priority-badge ${h.type==='positivo'?'baja':'media'}" style="font-size:10px">${h.type==='positivo'?'🌟 Positivo':'🌱 Desarrollo'}</span>
        </div>
        <div style="font-size:12px;color:var(--text-secondary)">${esc((h.text||'').slice(0,150))}${(h.text||'').length>150?'…':''}</div>
      </div>`;
    });
  } else {
    html += `<div style="font-size:13px;color:var(--text-secondary)">Sin feedback registrado. <a href="javascript:goToFeedbackFor(${personId})" style="color:var(--accent)">Dar feedback →</a></div>`;
  }
  html += `</div>`;

  // ─── RECENT RECOGNITIONS ───
  html += `<div class="card">
    <div class="card-title">🏆 Últimos Reconocimientos</div>`;
  if (recogs.length) {
    recogs.forEach(r => {
      const catEmoji = r.category === 'resultado' ? '🎯' : r.category === 'innovacion' ? '💡' : r.category === 'colaboracion' ? '🤝' : '🌟';
      html += `<div style="font-size:13px;margin-bottom:6px;padding:6px 0;border-bottom:1px solid var(--border)">${catEmoji} ${esc(r.description || r.desc || '')} <span style="font-size:11px;color:var(--text-secondary)">(${esc(r.date||'')})</span></div>`;
    });
  } else {
    html += `<div style="font-size:13px;color:var(--text-secondary)">Sin reconocimientos registrados.</div>`;
  }
  html += `</div>`;

  html += `</div>`; // end right
  html += `</div>`; // end layout

  wrap.innerHTML = html;

  // Render the Q rating selector and timeline
  _renderProfileQRating(personId);
  _renderRatingsTimeline(personId);
}

/* ── Render Q rating form for a specific quarter ── */
function _renderProfileQRating(personId) {
  const container = document.getElementById(`profile-q-rating-${personId}`);
  if (!container) return;

  const selEl = document.getElementById(`profile-q-select-${personId}`);
  const rawFqKey = selEl ? selEl.value : `${_getCurrentFQ().fy}-${_getCurrentFQ().q}`;
  // Sanitize fqKey to only allow expected format (FYxx-Qx)
  const fqKey = /^FY\d{2}-Q[1-4]$/.test(rawFqKey) ? rawFqKey : `${_getCurrentFQ().fy}-${_getCurrentFQ().q}`;
  const qr = _loadQRatings();
  const ratings = (qr[personId] || {})[fqKey] || {};

  let html = `<div class="q-rating-grid">`;
  Q_PARAMS.forEach(param => {
    const val = ratings[param] || '';
    html += `<div class="q-rating-row">
      <div class="q-rating-label">${Q_PARAM_LABELS[param]}</div>
      <div class="q-rating-options">
        ${Q_RATING_OPTIONS.filter(o => o.value).map(opt => `
          <button class="q-rating-btn ${val === opt.value ? 'active' : ''}" 
            style="${val === opt.value ? `background:${opt.bg};color:${opt.color};border-color:${opt.color}` : ''}"
            onclick="setQRating(${personId},'${fqKey}','${param}','${opt.value}')">
            ${opt.icon} ${opt.value}
          </button>`).join('')}
        ${val ? `<button class="q-rating-btn-clear" onclick="setQRating(${personId},'${fqKey}','${param}','')">✕</button>` : ''}
      </div>
    </div>`;
  });
  html += `</div>`;

  // Q notes
  html += `<div style="margin-top:12px">
    <div class="field-label">📝 Notas del trimestre</div>
    <textarea class="notes-area" id="q-notes-${personId}-${fqKey.replace(/[^a-zA-Z0-9]/g,'_')}" placeholder="Observaciones, contexto, planes de acción..." style="min-height:60px;font-size:13px" oninput="saveQRatingNotes(${personId},'${fqKey}',this.value)">${esc(ratings.notes || '')}</textarea>
  </div>`;

  if (ratings.updatedAt) {
    html += `<div style="font-size:11px;color:var(--text-secondary);margin-top:6px">Último guardado: ${new Date(ratings.updatedAt).toLocaleDateString('es-ES')}</div>`;
  }

  container.innerHTML = html;
}

/* ── Set a Q rating value ── */
function setQRating(personId, fqKey, param, value) {
  const qr = _loadQRatings();
  if (!qr[personId]) qr[personId] = {};
  if (!qr[personId][fqKey]) qr[personId][fqKey] = {};
  qr[personId][fqKey][param] = value;
  qr[personId][fqKey].updatedAt = new Date().toISOString();
  _saveQRatings(qr);
  _renderProfileQRating(personId);
  _renderRatingsTimeline(personId);
  showToast('Rating actualizado', 'success');
}

function saveQRatingNotes(personId, fqKey, val) {
  const qr = _loadQRatings();
  if (!qr[personId]) qr[personId] = {};
  if (!qr[personId][fqKey]) qr[personId][fqKey] = {};
  qr[personId][fqKey].notes = val;
  qr[personId][fqKey].updatedAt = new Date().toISOString();
  _saveQRatings(qr);
}

/* ── Render ratings timeline (table of all Qs) ── */
function _renderRatingsTimeline(personId) {
  const container = document.getElementById(`profile-ratings-timeline-${personId}`);
  if (!container) return;

  const qr = _loadQRatings();
  const ratings = qr[personId] || {};
  const allFQs = _getAllFQOptions();
  const ratedFQs = allFQs.filter(fq => ratings[fq] && (ratings[fq].teamwork || ratings[fq].innovation || ratings[fq].results));

  if (!ratedFQs.length) {
    container.innerHTML = '<div style="font-size:13px;color:var(--text-secondary);padding:8px 0">Sin ratings registrados todavía. Selecciona un trimestre arriba para empezar.</div>';
    return;
  }

  // Build visual timeline
  let html = `<div style="overflow-x:auto"><table class="ls-vac-table" style="width:100%;font-size:12px">
    <thead><tr>
      <th style="text-align:left;min-width:100px">Trimestre</th>
      <th style="text-align:center;min-width:90px">🤝 Teamwork</th>
      <th style="text-align:center;min-width:90px">💡 Innovación</th>
      <th style="text-align:center;min-width:90px">🎯 Resultados</th>
      <th style="text-align:center;min-width:60px">Promedio</th>
    </tr></thead><tbody>`;

  const scoreMap = { 'EM': 1, 'AE': 2, 'EE': 3 };

  ratedFQs.forEach(fq => {
    const r = ratings[fq] || {};
    const scores = Q_PARAMS.map(p => scoreMap[r[p]]).filter(v => v);
    const avg = scores.length ? (scores.reduce((a,b) => a+b, 0) / scores.length) : 0;
    const avgLabel = avg >= 2.5 ? '🌟' : avg >= 1.5 ? '✅' : avg > 0 ? '🔻' : '—';

    html += `<tr>
      <td style="font-weight:600;padding:6px 8px">${_fqLabel(fq)}</td>
      <td style="text-align:center;padding:6px 8px">${_getRatingBadge(r.teamwork || '')}</td>
      <td style="text-align:center;padding:6px 8px">${_getRatingBadge(r.innovation || '')}</td>
      <td style="text-align:center;padding:6px 8px">${_getRatingBadge(r.results || '')}</td>
      <td style="text-align:center;padding:6px 8px;font-size:14px">${avgLabel}</td>
    </tr>`;
    if (r.notes) {
      html += `<tr><td colspan="5" style="padding:2px 8px 8px;font-size:11px;color:var(--text-secondary);font-style:italic">💬 ${esc(r.notes)}</td></tr>`;
    }
  });

  html += `</tbody></table></div>`;

  // Trend visualization (mini bars)
  if (ratedFQs.length >= 2) {
    html += `<div style="margin-top:12px;padding:10px;background:var(--surface2);border-radius:var(--radius-sm)">
      <div style="font-size:11px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;text-transform:uppercase;letter-spacing:.04em">Tendencia</div>
      <div style="display:flex;gap:4px;align-items:flex-end;height:40px">
        ${ratedFQs.map(fq => {
          const r = ratings[fq] || {};
          const scores = Q_PARAMS.map(p => scoreMap[r[p]]).filter(v => v);
          const avg = scores.length ? (scores.reduce((a,b) => a+b, 0) / scores.length) : 0;
          const h = Math.round((avg / 3) * 36) + 4;
          const color = avg >= 2.5 ? 'var(--success)' : avg >= 1.5 ? 'var(--warning)' : 'var(--danger)';
          return `<div title="${_fqLabel(fq)}: ${avg.toFixed(1)}" style="flex:1;height:${h}px;background:${color};border-radius:3px;min-width:12px;max-width:40px;cursor:help"></div>`;
        }).join('')}
      </div>
      <div style="display:flex;gap:4px;margin-top:4px">
        ${ratedFQs.map(fq => `<div style="flex:1;font-size:9px;text-align:center;color:var(--text-secondary);min-width:12px;max-width:40px">${fq.split('-')[1]}</div>`).join('')}
      </div>
    </div>`;
  }

  container.innerHTML = html;
}

/* ── Save profile fields ── */
function saveProfileField(personId, field, value) {
  const profiles = _loadProfiles();
  if (!profiles[personId]) profiles[personId] = {};
  profiles[personId][field] = value;
  profiles[personId].updatedAt = new Date().toISOString();
  _saveProfiles(profiles);
}

/* ── Navigate to Feedback SBI for a specific person ── */
function goToFeedbackFor(personId) {
  switchGroup('equipo', 'feedback');
  setTimeout(() => {
    const sel = document.getElementById('sbi-person');
    if (sel) sel.value = String(personId);
  }, 100);
}

/* ── Navigate to profile from other pages ── */
function goToProfile(personId) {
  switchGroup('equipo', 'profiles');
  setTimeout(() => openProfileDetail(personId), 100);
}

/* ── Email summary ── */
function sendProfileEmail(personId) {
  const m = team.find(t => t.id === personId);
  if (!m) return;

  const s = _getProfileSummary(personId);
  const pdis = load(K.pdis, {});
  const pdi = pdis[personId] || {};
  const curFQ = _getCurrentFQ();
  const curKey = `${curFQ.fy}-${curFQ.q}`;

  let body = `Hola ${m.name.split(' ')[0]},\n\n`;
  body += `Te comparto un resumen de tu desarrollo profesional.\n\n`;
  body += `═══ RESUMEN ${_fqLabel(curKey).toUpperCase()} ═══\n\n`;

  // Current ratings
  if (s.curRating.teamwork || s.curRating.innovation || s.curRating.results) {
    body += `📊 RATINGS TRIMESTRALES:\n`;
    Q_PARAMS.forEach(p => {
      const val = s.curRating[p];
      const label = Q_PARAM_LABELS[p].replace(/[^\w\s]/g, '').trim();
      if (val) {
        const desc = val === 'EE' ? 'Exceed Expectations' : val === 'AE' ? 'Achieve Expectations' : 'Expected More';
        body += `  • ${label}: ${val} (${desc})\n`;
      }
    });
    if (s.curRating.notes) body += `  Notas: ${s.curRating.notes}\n`;
    body += `\n`;
  }

  // PDI
  if (pdi.strengths || pdi.devAreas || pdi.weekGoal) {
    body += `📈 PLAN DE DESARROLLO:\n`;
    if (pdi.strengths) body += `  • Fortalezas: ${pdi.strengths}\n`;
    if (pdi.devAreas) body += `  • Áreas de desarrollo: ${pdi.devAreas}\n`;
    if (pdi.weekGoal) body += `  • Objetivo actual: ${pdi.weekGoal}\n`;
    if (pdi.nextRole) body += `  • Próximo rol: ${pdi.nextRole}\n`;
    body += `\n`;
  }

  // Stats
  body += `📊 ESTADÍSTICAS:\n`;
  body += `  • Sesiones TB/1:1: ${s.tbSessions}\n`;
  body += `  • Feedbacks SBI registrados: ${s.sbiCount}\n`;
  body += `  • Reconocimientos: ${s.recogCount}\n`;
  body += `\n`;

  body += `Seguimos trabajando juntos en tu desarrollo.\n\nUn abrazo`;

  const subject = `Resumen de desarrollo — ${_fqLabel(curKey)} — ${m.name}`;
  const email = m.email || '';

  const mailtoLink = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoLink, '_blank');
  showToast('📧 Abriendo cliente de correo...', 'success');
}

// ── Type metadata ──────────────────────────────
const MN_TYPES = {
  webex:       '🖥️',
  presencial:  '👥',
  '1:1':       '1:1',
  team:        '👨‍👩‍👧',
  stakeholder: '🌐',
  call:        '📞',
  er:          '📋'
};

// ── Init ───────────────────────────────────────
function renderMeetingNotes() { mnInit(); }

function mnInit() {
  _mnNotes = load(K.meetingNotes, []);
  mnRenderList();
}

// ── Helper: strip HTML to plain text ───────────
function mnStripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ── Helper: generate a simple unique ID ────────
function mnGenId() {
  return 'mn_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

// ── Render the left sidebar list ───────────────
function mnRenderList() {
  const q = (document.getElementById('mn-search')?.value || '').toLowerCase().trim();
  const listEl = document.getElementById('mn-list');
  const countEl = document.getElementById('mn-count');
  if (!listEl) return;

  // Build tag chips from all notes
  const allTags = new Set();
  _mnNotes.forEach(n => (n.tags || []).forEach(t => allTags.add(t)));
  const tagsEl = document.getElementById('mn-tags-filter');
  if (tagsEl) {
    tagsEl.innerHTML = [...allTags].sort().map(t =>
      `<span class="tag-chip${_mnActiveTag === t ? ' active' : ''}" data-tag="${esc(t)}">${esc(t)}</span>`
    ).join('');
    tagsEl.onclick = e => {
      const chip = e.target.closest('[data-tag]');
      if (chip) mnFilterTag(chip.dataset.tag);
    };
  }

  // Update type filter active state
  document.querySelectorAll('#mn-type-filter-bar .mn-type-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === (_mnActiveType || ''));
  });

  // Filter notes
  let filtered = [..._mnNotes].sort((a, b) => (b.datetime || b.createdAt || '').localeCompare(a.datetime || a.createdAt || ''));

  if (_mnActiveType) {
    filtered = filtered.filter(n => (n.type || '') === _mnActiveType);
  }
  if (_mnActiveTag) {
    filtered = filtered.filter(n => (n.tags || []).includes(_mnActiveTag));
  }
  if (q) {
    filtered = filtered.filter(n =>
      (n.title || '').toLowerCase().includes(q) ||
      (n.participants || '').toLowerCase().includes(q) ||
      mnStripHtml(n.content || '').toLowerCase().includes(q) ||
      (n.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }

  if (countEl) countEl.textContent = `${filtered.length} nota${filtered.length !== 1 ? 's' : ''}`;

  if (!filtered.length) {
    listEl.innerHTML = `<div style="text-align:center;padding:30px 12px;color:var(--text-secondary);font-size:13px">${q || _mnActiveTag || _mnActiveType ? 'Sin resultados' : 'Aún no hay notas'}</div>`;
    return;
  }

  listEl.innerHTML = filtered.map(n => {
    const typeEmoji = MN_TYPES[n.type] || '📝';
    const dateStr = n.datetime ? new Date(n.datetime).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '';
    const firstParticipant = (n.participants || '').split(',')[0].trim();
    const snippet = mnStripHtml(n.content || '').slice(0, 60);
    return `<div class="note-item${_mnCurrentId === n.id ? ' active' : ''}" onclick="mnOpenNote('${n.id}')">
      <div class="note-item-title">${typeEmoji} ${esc(n.title || 'Sin título')}</div>
      <div class="note-item-meta">${dateStr}${firstParticipant ? ' · ' + esc(firstParticipant) : ''}</div>
      <div class="note-item-snippet">${esc(snippet)}</div>
    </div>`;
  }).join('');
}

// ── Toggle type filter ──────────────────────────
function mnFilterType(type) {
  _mnActiveType = _mnActiveType === type ? null : type;
  mnRenderList();
}

// ── Toggle tag filter ───────────────────────────
function mnFilterTag(tag) {
  _mnActiveTag = _mnActiveTag === tag ? null : tag;
  mnRenderList();
}

// ── Open a note in the editor ──────────────────
function mnOpenNote(id) {
  const note = _mnNotes.find(n => n.id === id);
  if (!note) return;
  _mnCurrentId = id;
  mnShowEditor(note);
  mnRenderList(); // update active state
}

// ── Create a new blank note ────────────────────
function mnNewNote() {
  const now = new Date();
  const note = {
    id: mnGenId(),
    title: '',
    type: 'webex',
    datetime: now.toISOString().slice(0, 16),
    participants: '',
    tags: [],
    content: '',
    privateNotes: '',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
  _mnNotes.unshift(note);
  save(K.meetingNotes, _mnNotes);
  _mnCurrentId = note.id;
  mnShowEditor(note);
  mnRenderList();
  document.getElementById('mn-title')?.focus();
}

// ── Populate editor fields from note object ────
function mnShowEditor(note) {
  const emptyState = document.getElementById('mn-empty-state');
  const editor = document.getElementById('mn-editor');
  if (emptyState) emptyState.style.display = 'none';
  if (editor) editor.style.display = '';

  const titleEl = document.getElementById('mn-title');
  if (titleEl) titleEl.value = note.title || '';

  // Type selector
  document.querySelectorAll('#mn-type-selector .note-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === note.type);
  });

  const dtEl = document.getElementById('mn-datetime');
  if (dtEl) dtEl.value = note.datetime || '';

  const partEl = document.getElementById('mn-participants');
  if (partEl) partEl.value = note.participants || '';

  const tagsEl = document.getElementById('mn-tags');
  if (tagsEl) tagsEl.value = (note.tags || []).join(' ');

  const contentEl = document.getElementById('mn-content');
  if (contentEl) contentEl.innerHTML = note.content || '';

  const privateToggle = document.getElementById('mn-private-toggle');
  const privateSection = document.getElementById('mn-private-section');
  const privateContent = document.getElementById('mn-private-content');
  const hasPrivate = !!(note.privateNotes);
  if (privateToggle) privateToggle.checked = hasPrivate;
  if (privateSection) privateSection.style.display = hasPrivate ? '' : 'none';
  if (privateContent) privateContent.innerHTML = note.privateNotes || '';

  const statusEl = document.getElementById('mn-save-status');
  if (statusEl) statusEl.textContent = '';
  // Enable PDF export button
  const pdfBtn = document.getElementById('mn-pdf-btn');
  if (pdfBtn) { pdfBtn.style.opacity = '1'; pdfBtn.style.pointerEvents = ''; }
}

// ── Set note type ──────────────────────────────
function mnSetType(type, btn) {
  document.querySelectorAll('#mn-type-selector .note-type-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  mnScheduleSave();
}

// ── Toggle private notes section ───────────────
function mnTogglePrivate() {
  const checked = document.getElementById('mn-private-toggle')?.checked;
  const section = document.getElementById('mn-private-section');
  if (section) section.style.display = checked ? '' : 'none';
}

// ── RTE: execute formatting command ───────────
function mnExecCmd(cmd, val) {
  const editor = document.getElementById('mn-content');
  if (!editor) return;
  editor.focus();
  document.execCommand(cmd, false, val || null);
  mnScheduleSave();
}

// ── RTE: insert special block ─────────────────
function mnInsertBlock(type) {
  const editor = document.getElementById('mn-content');
  if (!editor) return;
  editor.focus();
  const cls = type === 'decision' ? 'note-block-decision' : 'note-block-action';
  const icon = type === 'decision' ? '⬜ ' : '⚡ ';
  const blockHtml = `<div class="${cls}" contenteditable="false"><span contenteditable="true">${icon}</span><button class="note-block-task-btn" onclick="mnOpenTaskModalFromBlock(this)">→ Tarea</button></div><p><br></p>`;
  document.execCommand('insertHTML', false, blockHtml);
  mnScheduleSave();
}

// ── Collect current note data from editor ──────
function mnCollectCurrentNote() {
  if (!_mnCurrentId) return null;
  const note = _mnNotes.find(n => n.id === _mnCurrentId);
  if (!note) return null;

  note.title = document.getElementById('mn-title')?.value || '';
  const activeTypeBtn = document.querySelector('#mn-type-selector .note-type-btn.active');
  note.type = activeTypeBtn ? activeTypeBtn.dataset.type : 'webex';
  note.datetime = document.getElementById('mn-datetime')?.value || '';
  note.participants = document.getElementById('mn-participants')?.value || '';
  const rawTags = document.getElementById('mn-tags')?.value || '';
  note.tags = (rawTags.match(/#[\w\u00C0-\u024F\u1E00-\u1EFF]+/g) || []).map(t => t.toLowerCase());
  note.content = document.getElementById('mn-content')?.innerHTML || '';
  const privateToggle = document.getElementById('mn-private-toggle');
  note.privateNotes = privateToggle?.checked ? (document.getElementById('mn-private-content')?.innerHTML || '') : '';
  note.updatedAt = new Date().toISOString();
  return note;
}

// ── Schedule autosave (1s debounce) ────────────
function mnScheduleSave() {
  const statusEl = document.getElementById('mn-save-status');
  if (statusEl) statusEl.textContent = '✏️ Editando...';
  clearTimeout(_mnSaveTimer);
  _mnSaveTimer = setTimeout(() => {
    mnSave(true);
  }, 1000);
}

// ── Save current note ──────────────────────────
function mnSave(silent) {
  const note = mnCollectCurrentNote();
  if (!note) return;
  save(K.meetingNotes, _mnNotes);
  mnRenderList();
  const statusEl = document.getElementById('mn-save-status');
  if (statusEl) statusEl.textContent = '💾 Guardado';
  if (!silent) {
    setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 2000);
  }
}

// ── Delete current note ────────────────────────
function mnDelete() {
  if (!_mnCurrentId) return;
  const note = _mnNotes.find(n => n.id === _mnCurrentId);
  const title = note ? (note.title || 'Sin título') : '';
  if (!confirm(`¿Eliminar la nota "${title}"? Esta acción no se puede deshacer.`)) return;
  _mnNotes = _mnNotes.filter(n => n.id !== _mnCurrentId);
  save(K.meetingNotes, _mnNotes);
  _mnCurrentId = null;
  const emptyState = document.getElementById('mn-empty-state');
  const editor = document.getElementById('mn-editor');
  if (emptyState) emptyState.style.display = '';
  if (editor) editor.style.display = 'none';
  mnRenderList();
}

// ── Convert note HTML to formatted plain text for email ──
function mnHtmlToPlainText(html) {
  if (!html) return '';
  let text = html;
  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, (_, c) => {
    const t = mnStripHtml(c); return `\n${t}\n${'='.repeat(t.length)}\n`;
  });
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, (_, c) => {
    const t = mnStripHtml(c); return `\n${t}\n${'-'.repeat(t.length)}\n`;
  });
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, (_, c) => `• ${mnStripHtml(c)}\n`);
  text = text.replace(/<div[^>]*class="note-block-decision"[^>]*>(.*?)<\/div>/gi, (_, c) => `✅ ${mnStripHtml(c)}\n`);
  text = text.replace(/<div[^>]*class="note-block-action"[^>]*>(.*?)<\/div>/gi, (_, c) => `⚡ ${mnStripHtml(c)}\n`);
  text = text.replace(/<hr[^>]*>/gi, '\n---\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, (_, c) => `${mnStripHtml(c)}\n`);
  text = mnStripHtml(text);
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

// ── Share note via mailto ──────────────────────
function mnShare() {
  const note = mnCollectCurrentNote();
  if (!note) return;

  const typeLabel = { webex:'Webex', presencial:'Presencial', '1:1':'1:1', team:'Team Meeting', stakeholder:'Stakeholder', call:'Call' };
  const dateLabel = note.datetime ? new Date(note.datetime).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' }) : '';
  const subject = encodeURIComponent(`[APG] ${note.title || 'Sin título'} — ${dateLabel}`);
  const bodyLines = [
    `REUNIÓN: ${note.title || 'Sin título'}`,
    `TIPO: ${typeLabel[note.type] || note.type}`,
    note.datetime ? `FECHA: ${dateLabel}` : '',
    note.participants ? `PARTICIPANTES: ${note.participants}` : '',
    note.tags?.length ? `TAGS: ${note.tags.join(' ')}` : '',
    '',
    '─────────────────────────────────────────',
    '',
    mnHtmlToPlainText(note.content)
  ].filter(l => l !== null).join('\n');

  window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(bodyLines)}`;
}

function mnExportPDF() {
  const note = mnCollectCurrentNote();
  if (!note) { showToast('Selecciona una nota primero', 'error'); return; }
  const printEl = document.getElementById('note-print-content');
  if (!printEl) return;
  const typeLabel = { webex:'🖥️ Webex', presencial:'👥 Presencial', '1:1':'1:1', team:'👨‍👩‍👧 Team', stakeholder:'🌐 Stakeholder', call:'📞 Call', er:'📋 ER' };
  const dateLabel = note.datetime ? new Date(note.datetime).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' }) : '';
  const typeTxt = typeLabel[note.type] || note.type || '';
  printEl.innerHTML = `
    <div class="note-print-title">${esc(note.title || 'Sin título')}</div>
    <div class="note-print-meta">${typeTxt}${dateLabel ? ' · ' + dateLabel : ''}${note.participants ? ' · ' + esc(note.participants) : ''}</div>
    ${note.tags?.length ? `<div class="note-print-meta">${note.tags.map(t=>esc(t)).join(' ')}</div>` : ''}
    <div class="note-print-body">${note.content || ''}</div>`;
  document.body.classList.add('printing-note');
  window.print();
  document.body.classList.remove('printing-note');
  printEl.innerHTML = '';
}

// ── Open task creation modal ───────────────────
function mnOpenTaskModal() {
  const note = _mnNotes.find(n => n.id === _mnCurrentId);
  const title = note ? (note.title || 'Sin título') : '';
  const contextEl = document.getElementById('mn-task-context');
  if (contextEl) contextEl.value = `📝 ${title}`;
  const taskTextEl = document.getElementById('mn-task-text');
  if (taskTextEl) { taskTextEl.value = ''; taskTextEl.focus(); }
  const dateEl = document.getElementById('mn-task-date');
  if (dateEl) dateEl.value = '';
  const modal = document.getElementById('mn-task-modal');
  if (modal) { modal.style.display = 'flex'; }
}

// ── Open task modal pre-filled from a block ────
function mnOpenTaskModalFromBlock(btn) {
  const block = btn?.closest('.note-block-decision, .note-block-action');
  const blockText = block ? mnStripHtml(block.querySelector('[contenteditable]')?.innerHTML || '') : '';
  mnOpenTaskModal();
  const taskTextEl = document.getElementById('mn-task-text');
  if (taskTextEl && blockText) taskTextEl.value = blockText.replace(/^[⬜⚡\s]+/, '').trim();
}

// ── Close task modal ───────────────────────────
function mnCloseTaskModal() {
  const modal = document.getElementById('mn-task-modal');
  if (modal) modal.style.display = 'none';
}

// ── Create a task from the modal ───────────────
function mnCreateTask() {
  const text = document.getElementById('mn-task-text')?.value.trim();
  if (!text) { alert('Escribe una descripción para la tarea.'); return; }
  const pri = document.getElementById('mn-task-pri')?.value || 'media';
  const date = document.getElementById('mn-task-date')?.value || '';
  const today = new Date().toISOString().split('T')[0];
  const t = {
    id: Date.now(),
    text,
    pri,
    date,
    done: false,
    reminder: '',
    reunionId: null,
    recurrence: '',
    createdDate: today,
    order: tasks.length
  };
  tasks.push(t);
  saveTasks();
  renderTasks();
  mnCloseTaskModal();
  showToast('✅ Tarea creada correctamente', 'success');
}

// ── Load all notes on app init ─────────────────
function loadMeetingNotes() {
  mnInit();
}

/* ═══════════════════════════════════════════════
   STORAGE USAGE INDICATOR
═══════════════════════════════════════════════ */
function getStorageUsageInfo() {
  let total = 0;
  for (let key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      total += (localStorage[key].length + key.length) * 2;
    }
  }
  const usedKB = Math.round(total / 1024);
  const limitKB = 5120; // ~5 MB
  const pct = Math.min(100, Math.round((usedKB / limitKB) * 100));
  return { usedKB, limitKB, pct };
}

function renderStorageIndicator() {
  const el = document.getElementById('storage-usage-indicator');
  if (!el) return;
  const { usedKB, limitKB, pct } = getStorageUsageInfo();
  let color = 'var(--success)';
  let icon = '🟢';
  if (pct >= 80) { color = 'var(--danger)'; icon = '🔴'; }
  else if (pct >= 60) { color = 'var(--warning, #f59e0b)'; icon = '🟡'; }
  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
      <span style="font-size:13px;color:var(--text-secondary)">${icon} Almacenamiento usado</span>
      <span style="font-size:13px;font-weight:600">${usedKB} KB <span style="font-weight:400;color:var(--text-secondary)">/ ~${limitKB} KB</span></span>
    </div>
    <div style="background:var(--border);border-radius:99px;height:6px;overflow:hidden">
      <div style="width:${pct}%;height:100%;background:${color};border-radius:99px;transition:width 0.4s"></div>
    </div>
    <div style="font-size:11px;color:var(--text-secondary);margin-top:4px;text-align:right">${pct}% utilizado</div>
  `;
}

/* ═══════════════════════════════════════════════
   AUTO BACKUP REMINDER
═══════════════════════════════════════════════ */
function checkAutoBackup() {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const REMINDER_DELAY_MS = 2000;
  const lastBackup = parseInt(localStorage.getItem('apg_last_backup') || '0', 10);
  const now = Date.now();
  if (now - lastBackup > SEVEN_DAYS_MS) {
    setTimeout(() => {
      showBackupReminder();
    }, REMINDER_DELAY_MS);
  }
}

function showBackupReminder() {
  if (document.getElementById('backup-reminder-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'backup-reminder-banner';
  banner.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-left: 4px solid var(--accent);
    border-radius: var(--radius);
    padding: 14px 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    z-index: 9990;
    max-width: 320px;
    font-size: 13px;
    animation: slideInRight 0.3s ease;
  `;
  banner.innerHTML = `
    <div style="font-weight:600;margin-bottom:6px;color:var(--text-primary)">💾 Recordatorio de backup</div>
    <div style="color:var(--text-secondary);margin-bottom:12px;line-height:1.4">Han pasado más de 7 días desde tu último backup. Exporta tus datos para tenerlos a salvo.</div>
    <div style="display:flex;gap:8px">
      <button onclick="exportData(); localStorage.setItem('apg_last_backup', Date.now()); document.getElementById('backup-reminder-banner').remove();"
        style="flex:1;padding:6px 10px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:12px;font-weight:600">
        💾 Exportar ahora
      </button>
      <button onclick="localStorage.setItem('apg_last_backup', Date.now()); document.getElementById('backup-reminder-banner').remove();"
        style="padding:6px 10px;background:var(--surface2);color:var(--text-secondary);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-size:12px">
        Posponer
      </button>
    </div>
  `;
  document.body.appendChild(banner);
}

// ══════════════════════════════════════════════════
// ── QBR — Quarterly Business Review ──
// ══════════════════════════════════════════════════

const QBR_KEY = 'qbr_data';

const QBR_QUARTERS = ['Q3-FY26','Q4-FY26','Q1-FY27','Q2-FY27'];

const QBR_AREAS = [
  { id:'general',  icon:'🏪', label:'General',  color:'#5b8dd9', desc:'Visión global de tienda' },
  { id:'shopping', icon:'🛍️', label:'Shopping', color:'#4a9d6f', desc:'Venta, conversión y crecimiento' },
  { id:'business', icon:'💼', label:'Business', color:'#e67e22', desc:'B2B, cuentas empresa' },
  { id:'support',  icon:'🛠️', label:'Support',  color:'#9b59b6', desc:'Genius Bar, reparaciones, soporte' },
  { id:'taa',      icon:'📲', label:'T@A',      color:'#e74c3c', desc:'Today at Apple, sesiones, delivered %' },
  { id:'people',   icon:'👥', label:'People',   color:'#2d7a52', desc:'Métricas de personas y equipo' }
];

// KPIs from COMMITMENTS_DATA assigned to each area
const QBR_AREA_KPIS = {
  general:  ['customer-impacting','timely-assistance','dropin-conversion','geniusbar-conversion','first-account'],
  shopping: ['nps-shared-feature','nps-interactive-demo','dropin-conversion'],
  business: ['first-account','geniusbar-conversion'],
  support:  ['mac-instore-repair','geniusbar-conversion'],
  taa:      ['delivered-dropin','nps-interactive-demo'],
  people:   ['training-completion','coach-connections','pulse-action-plan']
};

function _qbrLoad() {
  try { return JSON.parse(localStorage.getItem(QBR_KEY) || '{}'); } catch(e) { return {}; }
}

function _qbrSave(data) {
  localStorage.setItem(QBR_KEY, JSON.stringify(data));
}

function _qbrGetAllKpis() {
  // Flatten all KPIs from COMMITMENTS_DATA into a map by id (iterate all quarters)
  const kpiMap = {};
  if (typeof COMMITMENTS_DATA === 'undefined') return kpiMap;
  Object.values(COMMITMENTS_DATA).forEach(qData => {
    (qData.areas || []).forEach(area => {
      (area.kpis || []).forEach(kpi => {
        if (!kpiMap[kpi.id]) kpiMap[kpi.id] = kpi;
      });
    });
  });
  return kpiMap;
}

function _qbrInitEntry(quarter) {
  const areas = {};
  QBR_AREAS.forEach(a => {
    areas[a.id] = { kpis: {}, notas: '', highlights: '' };
  });
  return {
    quarter,
    periodo: '',
    fechaCierre: '',
    estado: 'activo',
    resumenGeneral: '',
    areas
  };
}

function renderQBR() {
  const container = document.getElementById('qbr-content');
  if (!container) return;
  const data = _qbrLoad();
  const quarters = Object.keys(data);
  const selEl = document.getElementById('qbr-quarter-select');
  let currentQ = selEl ? selEl.value : (quarters.length ? quarters[quarters.length - 1] : null);
  if (!currentQ || !data[currentQ]) currentQ = quarters.length ? quarters[quarters.length - 1] : null;

  // Render quarter selector options
  if (selEl) {
    selEl.innerHTML = quarters.map(q =>
      `<option value="${q}" ${q === currentQ ? 'selected' : ''}>${q}</option>`
    ).join('');
  }

  if (!currentQ || !data[currentQ]) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--text-secondary)">
        <div style="font-size:48px;margin-bottom:16px">📊</div>
        <div style="font-size:18px;font-weight:600;color:var(--text-primary);margin-bottom:8px">No hay QBRs creados</div>
        <div style="font-size:14px;margin-bottom:24px">Crea tu primer QBR para empezar a registrar el histórico de quarters.</div>
        <button class="btn btn-primary" onclick="openQBRNewModal()">+ Nuevo QBR</button>
      </div>`;
    _qbrUpdateStatusBadge(null);
    return;
  }

  const entry = data[currentQ];
  const isClosed = entry.estado === 'cerrado';
  const kpiMap = _qbrGetAllKpis();

  _qbrUpdateStatusBadge(entry.estado);

  let html = '';

  // Resumen general collapsible
  html += `
    <div class="card qbr-summary-card" style="margin-bottom:20px">
      <div class="qbr-area-header" onclick="qbrToggleSection('qbr-summary-body')" style="margin-bottom:0">
        <span>📝 Resumen ejecutivo del quarter</span>
        <span class="qbr-chevron" id="chevron-qbr-summary-body">▾</span>
      </div>
      <div id="qbr-summary-body" style="margin-top:14px">
        <textarea class="task-input" style="width:100%;min-height:100px;resize:vertical;font-size:14px"
          placeholder="Contexto, highlights globales, aprendizajes clave..."
          ${isClosed ? 'readonly' : ''}
          oninput="qbrSaveResumen('${currentQ}',this.value)">${esc(entry.resumenGeneral || '')}</textarea>
      </div>
    </div>`;

  // Área cards
  QBR_AREAS.forEach(area => {
    const areaData = entry.areas[area.id] || { kpis: {}, notas: '', highlights: '' };
    const areaKpiIds = QBR_AREA_KPIS[area.id] || [];

    let kpiRows = '';
    areaKpiIds.forEach(kpiId => {
      const kpiDef = kpiMap[kpiId];
      if (!kpiDef) return;
      const val = areaData.kpis[kpiId] !== undefined ? areaData.kpis[kpiId] : '';
      const unit = kpiDef.unidad || '';
      kpiRows += `
        <div class="qbr-kpi-row">
          <div class="qbr-kpi-name">${esc(kpiDef.nombre)}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
            <input type="number" class="qbr-kpi-input task-input" style="width:90px;font-size:13px;padding:4px 8px"
              value="${esc(String(val))}"
              placeholder="—"
              ${isClosed ? 'readonly' : ''}
              oninput="qbrSaveKpi('${currentQ}','${area.id}','${kpiId}',this.value)">
            ${unit ? `<span style="font-size:12px;color:var(--text-secondary)">${esc(unit)}</span>` : ''}
          </div>
        </div>`;
    });

    html += `
      <div class="qbr-area-card" style="border-left-color:${area.color}">
        <div class="qbr-area-header" onclick="qbrToggleSection('qbr-area-body-${area.id}')">
          <span>${area.icon} <strong>${esc(area.label)}</strong> <span style="font-size:12px;color:var(--text-secondary);font-weight:400">— ${esc(area.desc)}</span></span>
          <span class="qbr-chevron" id="chevron-qbr-area-body-${area.id}">▾</span>
        </div>
        <div class="qbr-area-body" id="qbr-area-body-${area.id}">
          <div>
            <div style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">KPIs Commitments</div>
            ${kpiRows || '<div style="color:var(--text-secondary);font-size:13px">—</div>'}
          </div>
          <div>
            <div style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">🌟 Highlights</div>
            <textarea class="task-input" style="width:100%;min-height:120px;resize:vertical;font-size:13px"
              placeholder="Logros destacados, hitos conseguidos, momentos clave..."
              ${isClosed ? 'readonly' : ''}
              oninput="qbrSaveField('${currentQ}','${area.id}','highlights',this.value)">${esc(areaData.highlights || '')}</textarea>
          </div>
          <div>
            <div style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">📝 Notas & Aprendizajes</div>
            <textarea class="task-input" style="width:100%;min-height:120px;resize:vertical;font-size:13px"
              placeholder="Qué funcionó, qué mejorar, contexto relevante..."
              ${isClosed ? 'readonly' : ''}
              oninput="qbrSaveField('${currentQ}','${area.id}','notas',this.value)">${esc(areaData.notas || '')}</textarea>
          </div>
        </div>
      </div>`;
  });

  container.innerHTML = html;
  try { renderQBRHealthDashboard(); } catch(e) {}
}

function _qbrUpdateStatusBadge(estado) {
  const badge = document.getElementById('qbr-status-badge');
  if (!badge) return;
  if (!estado) { badge.textContent = ''; return; }
  if (estado === 'cerrado') {
    badge.textContent = '🔒 Cerrado';
    badge.className = 'qbr-status-badge qbr-status-closed';
  } else {
    badge.textContent = '🟢 Activo';
    badge.className = 'qbr-status-badge qbr-status-active';
  }
}

function qbrToggleSection(id) {
  const el = document.getElementById(id);
  const chevron = document.getElementById('chevron-' + id);
  if (!el) return;
  const hidden = el.style.display === 'none';
  el.style.display = hidden ? '' : 'none';
  if (chevron) chevron.textContent = hidden ? '▾' : '▸';
}

function qbrSaveResumen(quarter, value) {
  const data = _qbrLoad();
  if (!data[quarter]) return;
  data[quarter].resumenGeneral = value;
  _qbrSave(data);
}

function qbrSaveKpi(quarter, areaId, kpiId, value) {
  const data = _qbrLoad();
  if (!data[quarter]) return;
  if (!data[quarter].areas[areaId]) return;
  data[quarter].areas[areaId].kpis[kpiId] = value;
  _qbrSave(data);
}

function qbrSaveField(quarter, areaId, field, value) {
  const data = _qbrLoad();
  if (!data[quarter]) return;
  if (!data[quarter].areas[areaId]) return;
  data[quarter].areas[areaId][field] = value;
  _qbrSave(data);
}

function qbrChangeQuarter(value) {
  renderQBR();
}

function openQBRNewModal() {
  const existing = Object.keys(_qbrLoad());
  const available = QBR_QUARTERS.filter(q => !existing.includes(q));
  const opts = (available.length ? available : QBR_QUARTERS).map(q =>
    `<option value="${q}">${q}</option>`).join('');

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'qbr-new-modal';
  modal.innerHTML = `
    <div class="modal-box" style="max-width:440px;width:100%">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div class="modal-title">+ Nuevo QBR</div>
        <button class="modal-close" onclick="document.getElementById('qbr-new-modal').remove()">✕</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div>
          <label class="field-label">Quarter</label>
          <select class="task-select" id="qbr-new-quarter" style="width:100%">${opts}</select>
        </div>
        <div>
          <label class="field-label">Periodo (ej: Marzo - Junio 2026)</label>
          <input class="task-input" id="qbr-new-periodo" placeholder="Marzo - Junio 2026" style="width:100%">
        </div>
        <div>
          <label class="field-label">Fecha de cierre</label>
          <input type="date" class="task-input" id="qbr-new-fecha" style="width:100%">
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:20px;justify-content:flex-end">
        <button class="btn btn-ghost" onclick="document.getElementById('qbr-new-modal').remove()">Cancelar</button>
        <button class="btn btn-primary" onclick="createQBR()">Crear QBR</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function createQBR() {
  const quarter = document.getElementById('qbr-new-quarter').value;
  const periodo = document.getElementById('qbr-new-periodo').value.trim();
  const fecha = document.getElementById('qbr-new-fecha').value;
  if (!quarter) return;

  const data = _qbrLoad();
  if (!data[quarter]) {
    data[quarter] = _qbrInitEntry(quarter);
  }
  data[quarter].periodo = periodo;
  data[quarter].fechaCierre = fecha;
  _qbrSave(data);

  document.getElementById('qbr-new-modal').remove();

  // Update selector and re-render selecting the new quarter
  const selEl = document.getElementById('qbr-quarter-select');
  if (selEl) selEl.value = quarter;
  renderQBR();
}

function closeQBR() {
  const selEl = document.getElementById('qbr-quarter-select');
  const data = _qbrLoad();
  const quarters = Object.keys(data);
  const currentQ = (selEl && selEl.value && data[selEl.value]) ? selEl.value : (quarters.length ? quarters[quarters.length - 1] : null);
  if (!currentQ) return;
  if (data[currentQ].estado === 'cerrado') {
    alert('Este QBR ya está cerrado.');
    return;
  }
  if (!confirm(`¿Cerrar el QBR de ${currentQ}? Una vez cerrado los datos serán de solo lectura.`)) return;
  data[currentQ].estado = 'cerrado';
  _qbrSave(data);
  renderQBR();
}
