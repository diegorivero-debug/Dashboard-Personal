/**
 * config.js — Configuración personal del dashboard
 * 
 * SETUP (solo la primera vez):
 *   1. Copia este archivo: cp config.example.js config.js
 *   2. Edita config.js con los datos reales de tu equipo
 *   3. Abre dashboard.html — el equipo aparecerá en todos los módulos
 * 
 * IMPORTANTE:
 *   - config.js está en .gitignore y NO se sube al repositorio (datos privados)
 *   - Si no creas config.js, el dashboard funciona con datos de ejemplo genéricos
 *   - Solo necesitas crear config.js una vez; los cambios en el equipo se hacen aquí
 */

// ─────────────────────────────────────────────
// EQUIPO DE LIDERAZGO — Apple Passeig de Gràcia (Q2 FY26)
// 
// Campos:
//   id:      número único (no repetir)
//   nombre:  nombre completo (aparece en dropdowns y listas)
//   rol:     cargo del puesto (Manager, Sr. Manager, Store Leader, Ops Lead, Lead, Lead Genius)
//   manager: nombre del responsable directo (vacío "" para Store Leaders y Leads)
//   email:   email corporativo (para envío de informes — puede dejarse vacío "")
//
// NOTA: Los Leads (ids 20-26) tienen manager vacío y solo aparecen en
//       vacaciones/festivos, no en conexiones semanales ni desarrollo.
// ─────────────────────────────────────────────
const equipoLiderazgo = [

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

// ─────────────────────────────────────────────
// VACACIONES DEL EQUIPO
// Solo para referencia — los datos reales se gestionan en la sección
// de Leadership Schedule del dashboard.
// ─────────────────────────────────────────────
const vacacionesEquipo = [
  // Ejemplo — reemplaza con datos reales:
  // { nombre: "Cristina Carcel", inicio: "2026-07-15", fin: "2026-08-05" },
];

// ─────────────────────────────────────────────
// REUNIONES RECURRENTES
// Se añaden automáticamente a la Agenda cada semana.
// 
// Campos:
//   name:  nombre de la reunión (aparece en la agenda)
//   day:   día de la semana (1=Lunes, 2=Martes, ..., 5=Viernes)
//   time:  hora en formato "HH:MM" (24h)
//   desc:  descripción breve (opcional, aparece en tooltip/detalle)
// ─────────────────────────────────────────────
const RECURRING_MEETINGS = [
  { name: 'Comercial España',    day: 1, time: '09:00', desc: 'Reunión semanal comercial con España' },
  { name: 'SM (Store Meeting)',  day: 1, time: '10:30', desc: 'Reunión semanal de Store Meeting' },
  { name: 'PPO',                 day: 2, time: '09:00', desc: 'Reunión semanal PPO' },
  { name: 'Market Leader 1:1',   day: 3, time: '11:00', desc: 'Check-in semanal con Market Leader' },
  { name: 'People Review',       day: 3, time: '14:00', desc: 'Revisión semanal de equipo' },
  { name: 'KPI Review',          day: 4, time: '09:30', desc: 'Revisión semanal de KPIs' },
  { name: 'Ops Weekly',          day: 4, time: '16:00', desc: 'Operaciones semanales' },
  { name: 'Sales Huddle',        day: 5, time: '08:30', desc: 'Daily/Weekly sales huddle' },
];
