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
// EQUIPO DE LIDERAZGO
// Todos los miembros que aparecen en Feedback, TB/1:1, Reconocimientos, etc.
// 
// Campos:
//   id:      número único (no repetir)
//   nombre:  nombre completo (aparece en dropdowns y listas)
//   rol:     cargo del puesto (Manager, Sr. Manager, Store Leader, etc.)
//   manager: nombre del responsable directo (para filtros de equipo)
//   email:   email corporativo (para envío de informes — puede dejarse vacío "")
// ─────────────────────────────────────────────
const equipoLiderazgo = [
  { id: 1,  nombre: "Manager A",      rol: "Sr. Manager",  manager: "Store Leader B", email: "manager.a@example.com" },
  { id: 2,  nombre: "Manager B",      rol: "Manager",      manager: "Store Leader A", email: "manager.b@example.com" },
  { id: 3,  nombre: "Manager C",      rol: "Manager",      manager: "Store Leader A", email: "manager.c@example.com" },
  { id: 4,  nombre: "Manager D",      rol: "Manager",      manager: "Store Leader A", email: "manager.d@example.com" },
  { id: 5,  nombre: "Manager E",      rol: "Sr. Manager",  manager: "Store Leader A", email: "manager.e@example.com" },
  { id: 6,  nombre: "Manager F",      rol: "Manager",      manager: "Store Leader A", email: "manager.f@example.com" },
  { id: 7,  nombre: "Manager G",      rol: "Manager",      manager: "Store Leader A", email: "manager.g@example.com" },
  { id: 8,  nombre: "Manager H",      rol: "Manager",      manager: "Store Leader B", email: "manager.h@example.com" },
  { id: 9,  nombre: "Manager I",      rol: "Sr. Manager",  manager: "Store Leader B", email: "manager.i@example.com" },
  { id: 10, nombre: "Manager J",      rol: "Manager",      manager: "Store Leader B", email: "manager.j@example.com" },
  { id: 11, nombre: "Manager K",      rol: "Manager",      manager: "Store Leader A", email: "manager.k@example.com" },
  { id: 12, nombre: "Manager L",      rol: "Manager",      manager: "Store Leader A", email: "manager.l@example.com" },
  { id: 13, nombre: "Manager M",      rol: "Sr. Manager",  manager: "Store Leader A", email: "manager.m@example.com" },
  { id: 14, nombre: "Manager N",      rol: "Manager",      manager: "Store Leader B", email: "manager.n@example.com" },
  { id: 15, nombre: "Manager O",      rol: "Manager",      manager: "Store Leader B", email: "" },
  { id: 16, nombre: "Manager P",      rol: "Manager",      manager: "Store Leader B", email: "manager.p@example.com" },
  { id: 17, nombre: "Manager Q",      rol: "Manager",      manager: "Store Leader B", email: "" },
  { id: 18, nombre: "Store Leader B", rol: "Store Leader", manager: "Market Leader",  email: "sl.b@example.com" },
  { id: 19, nombre: "Store Leader A", rol: "Store Leader", manager: "Market Leader",  email: "sl.a@example.com" }
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
