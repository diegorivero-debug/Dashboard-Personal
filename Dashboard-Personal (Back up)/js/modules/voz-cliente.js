/* ═══════════════════════════════════════════════
   VOZ CLIENTE MODULE — extracted from dashboard.js
   Handles verbatim feedback CRUD, VC stats/charts,
   Pareto root-cause analysis, Insights & Recommendations,
   Trend analysis, Area distribution, Keywords cloud,
   Medallia PDF import, and Wow Moments library.
═══════════════════════════════════════════════ */

import { K } from '../core/constants.js';
import { load, save, esc, num, fmtDate, showToast } from '../core/utils.js';

export const K_VC = 'apg_verbatims';
export let _vcType = 'positivo';
export let _vcFilter = 'todos';

export const VC_AREA_ICONS = { shopping: '🛍️', genius: '🔧', business: '💼', taa: '🎓', general: '🏪' };
export const VC_AREA_LABELS = { shopping: 'Shopping', genius: 'Genius/APU', business: 'Business', taa: 'T@A', general: 'General' };

export const VC_ROOT_CAUSES = {
  espera:          { label: 'Tiempo de espera',                    emoji: '⏱️' },
  disponibilidad:  { label: 'Disponibilidad de producto',          emoji: '📦' },
  conocimiento:    { label: 'Conocimiento del Specialist',         emoji: '🧑‍💼' },
  genius:          { label: 'Experiencia Genius Bar / Soporte',    emoji: '🔧' },
  compra:          { label: 'Proceso de compra / pago',            emoji: '💳' },
  postventa:       { label: 'Experiencia postventa / devolución',  emoji: '🔄' },
  ambiente:        { label: 'Ambiente de tienda',                  emoji: '🏪' },
  producto:        { label: 'Problema de producto / hardware',     emoji: '📱' },
  otra:            { label: 'Otra causa',                          emoji: '🌐' },
};

export const WOW_CATEGORIES = {
  servicio:    { label: 'Servicio excepcional', emoji: '🌟' },
  sorpresa:    { label: 'Sorpresa al cliente',  emoji: '🎁' },
  conexion:    { label: 'Conexión humana',       emoji: '🤝' },
  creatividad: { label: 'Creatividad',           emoji: '💡' },
  resultado:   { label: 'Resultado increíble',   emoji: '🏆' },
};

/* NOTE: All functions are defined in dashboard.js inline.
   This module mirrors the exports for potential future modular usage.
   Current active implementation is in dashboard.js. */
