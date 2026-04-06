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
// EQUIPO DE LIDERAZGO — Q2FY26 · Apple Passeig de Gràcia
// Todos los miembros que aparecen en Feedback, TB/1:1, Reconocimientos, etc.
//
// Grupos:
//   1. Managers / Sr. Managers → reportan a Diego Rivero (ids 1–9)
//   2. Managers / Sr. Managers → reportan a Jordi Pajares (ids 10–17)
//   3. Store Leaders (ids 18–19)
//   4. Leads → solo vacaciones/festivos (sin manager, sin conexiones semanales) (ids 20–27)
//
// Campos:
//   id:      número único (no repetir)
//   nombre:  nombre completo (aparece en dropdowns y listas)
//   rol:     cargo del puesto (Manager, Sr. Manager, Store Leader, Lead, etc.)
//   manager: nombre del responsable directo (para filtros de equipo)
//             → vacío "" para Leads (no tienen reporting directo asignado)
//   email:   email corporativo (para envío de informes — puede dejarse vacío "")
// ─────────────────────────────────────────────
const equipoLiderazgo = [

  // ── 1. Managers / Sr. Managers → Diego Rivero ────────────────────────────
  { id: 1,  nombre: "Cristina Carcel",  rol: "Sr. Manager", manager: "Diego Rivero", email: "criscarcel@apple.com"      },
  { id: 2,  nombre: "Itziar Cacho",     rol: "Sr. Manager", manager: "Diego Rivero", email: "icacholega@apple.com"      },
  { id: 3,  nombre: "Meri Alvarez",     rol: "Manager",     manager: "Diego Rivero", email: "malvarezmart@apple.com"    },
  { id: 4,  nombre: "David Carrillo",   rol: "Manager",     manager: "Diego Rivero", email: "davidcarrillo@apple.com"   },
  { id: 5,  nombre: "Ricardo Sosa",     rol: "Manager",     manager: "Diego Rivero", email: "rsosapole@apple.com"       },
  { id: 6,  nombre: "Ana Maria Pazos",  rol: "Manager",     manager: "Diego Rivero", email: "apazosrevuelt@apple.com"   },
  { id: 7,  nombre: "Javi Canfranc",    rol: "Manager",     manager: "Diego Rivero", email: "jcanfranc@apple.com"       },
  { id: 8,  nombre: "Javi Sanchez",     rol: "Manager",     manager: "Diego Rivero", email: "javisanch@apple.com"       },
  { id: 9,  nombre: "Javier Quiros",    rol: "Manager",     manager: "Diego Rivero", email: "jquirosgomez@apple.com"    },

  // ── 2. Managers / Sr. Managers → Jordi Pajares ───────────────────────────
  { id: 10, nombre: "Sheila Yubero",    rol: "Sr. Manager", manager: "Jordi Pajares", email: "syuberoarruga@apple.com"  },
  { id: 11, nombre: "Toni Medina",      rol: "Manager",     manager: "Jordi Pajares", email: "toni@apple.com"           },
  { id: 12, nombre: "Jorge Gil",        rol: "Sr. Manager", manager: "Jordi Pajares", email: "jorgegilXX@apple.com"     },
  { id: 13, nombre: "Pedro Borlido",    rol: "Manager",     manager: "Jordi Pajares", email: "pbd@apple.com"            },
  { id: 14, nombre: "Jesus Pazos",      rol: "Manager",     manager: "Jordi Pajares", email: "j_pazos@apple.com"        },
  { id: 15, nombre: "Deborah Ibañez",   rol: "Manager",     manager: "Jordi Pajares", email: "deborah_ibanezroc@apple.com" },
  { id: 16, nombre: "Cristina Uson",    rol: "Manager",     manager: "Jordi Pajares", email: "c_uson@apple.com"         },
  { id: 17, nombre: "Julie Robin",      rol: "Manager",     manager: "Jordi Pajares", email: "jrobin2@apple.com"        },

  // ── 3. Store Leaders ─────────────────────────────────────────────────────
  { id: 18, nombre: "Diego Rivero",     rol: "Store Leader", manager: "", email: "driverobasco@apple.com"               },
  { id: 19, nombre: "Jordi Pajares",    rol: "Store Leader", manager: "", email: "jpajaresfurn@apple.com"               },

  // ── 4. Leads — solo vacaciones/festivos (sin manager, sin conexiones semanales) ──
  { id: 20, nombre: "Aurora Comesaña",  rol: "Ops Lead (Backstage)",    manager: "", email: "comesany@apple.com"        },
  { id: 21, nombre: "Rubén Martínez",   rol: "Ops Lead (Backstage)",    manager: "", email: "rnezmodi@apple.com"        },
  { id: 22, nombre: "Clara Gonzalez",   rol: "Lead (F&B)",              manager: "", email: "clara@apple.com"           },
  { id: 23, nombre: "Elisabet Moreno",  rol: "Lead (F&B)",              manager: "", email: "emorenolop@apple.com"      },
  { id: 24, nombre: "Eva Famoso",       rol: "Lead (Genius Bar)",       manager: "", email: "efamoso@apple.com"         },
  { id: 25, nombre: "Eva Hernandez",    rol: "Lead (Genius Bar)",       manager: "", email: "hernandez.ev@apple.com"    },
  { id: 26, nombre: "Alberto Ortiz",    rol: "Lead (Genius Bar)",       manager: "", email: "aortizpastor@apple.com"    },
  { id: 27, nombre: "Bryan",            rol: "Store Leader (El Corte Inglés)", manager: "", email: ""                   },
];

// ─────────────────────────────────────────────
// VACACIONES DEL EQUIPO
// Períodos de vacaciones de cada miembro para la sección Leadership Schedule.
// Formato: array de objetos con nombre, inicio (fecha inicio), fin (fecha fin)
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
