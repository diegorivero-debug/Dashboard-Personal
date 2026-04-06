/* ═══════════════════════════════════════════════
   CONSTANTS — extracted from dashboard.js
   All values are pure data; no DOM or side-effects.
═══════════════════════════════════════════════ */

// localStorage keys registry
export const K = {
  theme:                'apg_theme',
  tasks:                'apg_tasks',
  team:                 'apg_team',
  events:               'apg_events',
  notes:                'apg_notes',
  kpis:                 'apg_kpis',
  reuniones:            'apg_reuniones',
  tbs:                  'apg_tbs',
  kpiHistory:           'apg_kpi_history',
  reconocimientos:      'apg_reconocimientos',
  agendaView:           'apg_agenda_view',
  agendaWeekOffset:     'apg_agenda_week_offset',
  briefingDate:         'apg_briefing_date',
  briefingDates:        'apg_briefing_dates',
  customQuotes:         'apg_custom_quotes',
  kanban:               'apg_team_kanban',
  comparativaOpen:      'apg_comparativa_open',
  agendaMonthOffset:    'apg_agenda_month_offset',
  agendaGoals:          'apg_agenda_goals',
  pdis:                 'apg_pdis',
  pulse:                'apg_pulse',
  launch:               'apg_launch',
  focusMetric:          'apg_focus_metric',
  wowMoments:           'apg_wow_moments',
  lastSummary:          'apg_last_summary',
  commitments:          'apg_commitments',
  commitmentsTimeline:  'apg_commitments_timeline',
  routineDate:          'apg_routine_date',
  routineStep:          'apg_routine_step',
  meetingNotes:         'apg_meeting_notes',
  recurringMeetings:    'apg_recurring_meetings',
  managerConnections:   'apg_manager_connections',
  okrs:                 'apg_okrs',
};

// % of AC+ goal below which an alert is shown
export const AC_ALERT_THRESHOLD = 60;

// Equipo Apple Passeig de Gràcia — Q2 FY26
// Roles: "Sr. Manager", "Manager", "Store Leader", "Ops Lead", "Lead", "Lead Genius"
// Los Leads (ids 20-26) tienen manager vacío y solo aparecen en vacaciones/festivos.
export const equipoLiderazgo = [

  // ── Grupo 1: Reportan a Diego Rivero (9 personas) ─────────────────────────
  { id: 1,  nombre: "Cristina Carcel",  rol: "Sr. Manager",  manager: "Diego Rivero",  email: "criscarcel@apple.com" },
  { id: 2,  nombre: "Itziar Cacho",     rol: "Sr. Manager",  manager: "Diego Rivero",  email: "icacholega@apple.com" },
  { id: 3,  nombre: "Meri Alvarez",     rol: "Manager",      manager: "Diego Rivero",  email: "malvarezmart@apple.com" },
  { id: 4,  nombre: "David Carrillo",   rol: "Manager",      manager: "Diego Rivero",  email: "davidcarrillo@apple.com" },
  { id: 5,  nombre: "Ricardo Sosa",     rol: "Manager",      manager: "Diego Rivero",  email: "rsosapole@apple.com" },
  { id: 6,  nombre: "Ana Maria Pazos",  rol: "Manager",      manager: "Diego Rivero",  email: "apazosrevuelt@apple.com" },
  { id: 7,  nombre: "Javi Canfranc",    rol: "Manager",      manager: "Diego Rivero",  email: "jcanfranc@apple.com" },
  { id: 8,  nombre: "Javi Sanchez",     rol: "Manager",      manager: "Diego Rivero",  email: "javisanch@apple.com" },
  { id: 9,  nombre: "Javier Quiros",    rol: "Manager",      manager: "Diego Rivero",  email: "jquirosgomez@apple.com" },

  // ── Grupo 2: Reportan a Jordi Pajares (8 personas) ────────────────────────
  { id: 10, nombre: "Sheila Yubero",    rol: "Sr. Manager",  manager: "Jordi Pajares", email: "syuberoarruga@apple.com" },
  { id: 11, nombre: "Toni Medina",      rol: "Manager",      manager: "Jordi Pajares", email: "toni@apple.com" },
  { id: 12, nombre: "Jorge Gil",        rol: "Sr. Manager",  manager: "Jordi Pajares", email: "jorgegil@apple.com" },
  { id: 13, nombre: "Pedro Borlido",    rol: "Manager",      manager: "Jordi Pajares", email: "pbd@apple.com" },
  { id: 14, nombre: "Jesus Pazos",      rol: "Manager",      manager: "Jordi Pajares", email: "j_pazos@apple.com" },
  { id: 15, nombre: "Deborah Ibañez",   rol: "Manager",      manager: "Jordi Pajares", email: "deborah_ibanezroc@apple.com" },
  { id: 16, nombre: "Cristina Uson",    rol: "Manager",      manager: "Jordi Pajares", email: "c_uson@apple.com" },
  { id: 17, nombre: "Julie Robin",      rol: "Manager",      manager: "Jordi Pajares", email: "jrobin2@apple.com" },

  // ── Grupo 3: Store Leaders (2 personas) ───────────────────────────────────
  { id: 18, nombre: "Diego Rivero",     rol: "Store Leader", manager: "",              email: "driveroabascal@apple.com" },
  { id: 19, nombre: "Jordi Pajares",    rol: "Store Leader", manager: "",              email: "jpajaresfurn@apple.com" },

  // ── Grupo 4: Leads — solo vacaciones/festivos, no en conexiones ni desarrollo ──
  { id: 20, nombre: "Aurora Comesaña",  rol: "Ops Lead",     manager: "",              email: "comesanya@apple.com" },
  { id: 21, nombre: "Rubén Martínez",   rol: "Ops Lead",     manager: "",              email: "rnezmodi@apple.com" },
  { id: 22, nombre: "Clara Gonzalez",   rol: "Lead",         manager: "",              email: "clara@apple.com" },
  { id: 23, nombre: "Elisabet Moreno",  rol: "Lead",         manager: "",              email: "emorenolop@apple.com" },
  { id: 24, nombre: "Eva Famoso",       rol: "Lead Genius",  manager: "",              email: "efamoso@apple.com" },
  { id: 25, nombre: "Eva Hernandez",    rol: "Lead Genius",  manager: "",              email: "hernandez.ev@apple.com" },
  { id: 26, nombre: "Alberto Ortiz",    rol: "Lead Genius",  manager: "",              email: "aortizpastor@apple.com" },
];

// Roles excluidos del equipo de desarrollo/conexiones (solo vacaciones/festivos).
// dashboard.js (script no-módulo) mantiene una copia local sincronizada.
export const LEAD_ROLES = ['Ops Lead', 'Lead', 'Lead Genius'];

// Fallback recurring meetings — used only when config.js is not loaded
export const RECURRING_MEETINGS = [
  { name: 'Comercial España',    day: 1, time: '09:00', desc: 'Reunión semanal comercial con España' },
  { name: 'SM (Store Meeting)',  day: 1, time: '10:30', desc: 'Reunión semanal de Store Meeting' },
  { name: 'PPO',                 day: 2, time: '09:00', desc: 'Reunión semanal PPO' },
  { name: 'Market Leader 1:1',   day: 3, time: '11:00', desc: 'Check-in semanal con Market Leader' },
  { name: 'People Review',       day: 3, time: '14:00', desc: 'Revisión semanal de equipo' },
  { name: 'KPI Review',          day: 4, time: '09:30', desc: 'Revisión semanal de KPIs' },
  { name: 'Ops Weekly',          day: 4, time: '16:00', desc: 'Operaciones semanales' },
  { name: 'Sales Huddle',        day: 5, time: '08:30', desc: 'Daily/Weekly sales huddle' },
];

export const DEFAULT_QUOTES = [
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

export const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
export const DIAS  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

// KPI history chart — metrics are normalised to 0–100 scale (% of objective).
// Values are capped at KPI_CHART_MAX_PCT to handle overperformance readably.
export const KPI_CHART_MAX_PCT = 150;

export const KPI_CHART_METRICS = [
  { key:'ventas',         label:'💰 Ventas %',         color:'var(--accent)',  val: d=>{ const v=parseFloat(String(d.ventas||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0, o=parseFloat(String(d.objVentas||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0;                 return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
  { key:'ventasBusiness', label:'💼 Ventas Business',  color:'#30d158',        val: d=>{ const v=parseFloat(String(d.ventasBusiness||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0, o=parseFloat(String(d.objVentasBusiness||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0; return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
  { key:'ventasApu',      label:'📱 Ventas APU',       color:'#0a84ff',        val: d=>{ const v=parseFloat(String(d.ventasApu||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0, o=parseFloat(String(d.objVentasApu||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0;           return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
  { key:'ventasSfs',      label:'🚚 Ventas SFS',       color:'#5e5ce6',        val: d=>{ const v=parseFloat(String(d.ventasSfs||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0, o=parseFloat(String(d.objVentasSfs||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0;           return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
  { key:'nps',            label:'⭐ NPS Tienda',        color:'var(--success)', val: d=>Math.min(parseFloat(String(d.nps||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0,100) },
  { key:'npsShop',        label:'🛍️ NPS Shopping',     color:'#ffd60a',        val: d=>Math.min(parseFloat(String(d.npsShop||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0,100) },
  { key:'npsApu',         label:'🔧 NPS APU',           color:'#ff6b35',        val: d=>Math.min(parseFloat(String(d.npsApu||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0,100) },
  { key:'npsSupport',     label:'🎧 NPS Support',       color:'#ff453a',        val: d=>Math.min(parseFloat(String(d.npsSupport||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0,100) },
  { key:'npsTaa',         label:'🎓 NPS T@A',           color:'#bf5af2',        val: d=>Math.min(parseFloat(String(d.npsTaa||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0,100) },
  { key:'conv',           label:'🔄 Conversión',        color:'#ff9f0a',        val: d=>{ const v=parseFloat(String(d.conv||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0, o=parseFloat(String(d.objConv||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0;                     return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
  { key:'trafico',        label:'👣 Tráfico',           color:'#64d2ff',        val: d=>parseFloat(String(d.trafico||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0 },
  { key:'upt',            label:'🛒 UPT',              color:'#34c759',        val: d=>{ const v=parseFloat(String(d.upt||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0, o=parseFloat(String(d.objUpt||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0;                       return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
  { key:'dta',            label:'⏰ DTA %',             color:'#8e8e93',        val: d=>{ const v=parseFloat(String(d.dta||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0, o=parseFloat(String(d.objDta||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0;                       return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
  { key:'intros1k',       label:'🎯 Intros/1K',         color:'#ac8e68',        val: d=>{ const v=parseFloat(String(d.intros1k||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0, o=parseFloat(String(d.objIntros1k||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0;             return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
  { key:'timely',         label:'⏱️ Timely %',          color:'#6ac4dc',        val: d=>{ const v=parseFloat(String(d.timely||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0, o=parseFloat(String(d.objTimely||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0;                 return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
  { key:'cpUsage',        label:'💬 C&P Usage',         color:'#9d6cf0',        val: d=>{ const v=parseFloat(String(d.cpUsage||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0, o=parseFloat(String(d.objCpUsage||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0;               return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
  { key:'gbConv',         label:'🎓 GB Conv.',           color:'#f19a38',        val: d=>{ const v=parseFloat(String(d.gbConv||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0, o=parseFloat(String(d.objGbConv||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0;                 return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
  { key:'introsSessions', label:'🔍 Intros/Sessions',   color:'#5ac8f5',        val: d=>{ const v=parseFloat(String(d.introsSessions||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0, o=parseFloat(String(d.objIntrosSessions||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0; return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
  { key:'iphoneTat',      label:'📱 iPhone TAT',         color:'#e8675a',        val: d=>{ const v=parseFloat(String(d.iphoneTat||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0, o=parseFloat(String(d.objIphoneTat||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0;           return o>0?Math.min(v/o*100,KPI_CHART_MAX_PCT):0; } },
];

export const DEFAULT_KPI_CHART_METRICS   = ['ventas', 'nps'];
export const DEFAULT_COMPARATIVA_METRICS = ['ventas', 'nps', 'conv', 'dta'];

// Fiscal quarter anchors — cada entrada: { label, startDate (domingo de inicio) }
// Actualizar al comienzo de cada nuevo quarter fiscal.
export const FISCAL_QUARTERS = [
  { label: 'Q3 FY26', startDate: new Date(2026, 2, 29) },  // Mar 29 2026
  { label: 'Q4 FY26', startDate: new Date(2026, 5, 28) },  // Jun 28 2026
  { label: 'Q1 FY27', startDate: new Date(2026, 8, 27) },  // Sep 27 2026
  { label: 'Q2 FY27', startDate: new Date(2026, 11, 27) }, // Dec 27 2026
  { label: 'Q3 FY27', startDate: new Date(2027, 2, 28) },  // Mar 28 2027
];