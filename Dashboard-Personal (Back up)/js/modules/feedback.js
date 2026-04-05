/* ═══════════════════════════════════════════════
   FEEDBACK MODULE — extracted from dashboard.js
   Handles SBI (Situation-Behavior-Impact) feedback
   generation, history, and templates.
═══════════════════════════════════════════════ */

import { K } from '../core/constants.js';
import { load, save, esc, fmtDate, flash, showToast } from '../core/utils.js';

export const K_SBI = 'apg_sbi_history';
export let _sbiType = 'positivo';

export function setSBIType(type, btn) {
  _sbiType = type;
  document.querySelectorAll('#tab-feedback .filter-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  generateSBI();
}

export function updateSBIPersonSelect() {
  const sel = document.getElementById('sbi-person');
  if (!sel) return;
  const team = window.team || [];
  sel.innerHTML = '<option value="">— Selecciona persona —</option>' +
    team.filter(m => !m.hidden).map(m => `<option value="${m.id}">${esc(m.name)} — ${esc(m.role)}</option>`).join('');
}

export function generateSBI() {
  const situation = document.getElementById('sbi-situation')?.value.trim() || '';
  const behavior  = document.getElementById('sbi-behavior')?.value.trim() || '';
  const impact    = document.getElementById('sbi-impact')?.value.trim() || '';
  const closing   = document.getElementById('sbi-closing')?.value.trim() || '';
  const personId  = document.getElementById('sbi-person')?.value;
  const team = window.team || [];
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

export function copySBI() {
  const text = document.getElementById('sbi-preview')?.textContent || '';
  if (!text || text.includes('Completa los campos')) return;
  navigator.clipboard.writeText(text).then(() => {
    flash('sbi-copy-msg');
    showToast('📋 Feedback copiado al portapapeles');
  });
}

export function saveSBIToHistory() {
  const situation = document.getElementById('sbi-situation')?.value.trim() || '';
  const behavior  = document.getElementById('sbi-behavior')?.value.trim() || '';
  const impact    = document.getElementById('sbi-impact')?.value.trim() || '';
  if (!situation && !behavior && !impact) { showToast('Completa al menos un campo antes de guardar'); return; }
  const personId = document.getElementById('sbi-person')?.value;
  const team = window.team || [];
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

export function clearSBIForm() {
  ['sbi-situation','sbi-behavior','sbi-impact','sbi-closing'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const preview = document.getElementById('sbi-preview');
  if (preview) { preview.textContent = 'Completa los campos para ver la vista previa...'; preview.style.color = 'var(--text-secondary)'; }
}

export const SBI_TEMPLATES = {
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

export function loadSBITemplate(key) {
  const t = SBI_TEMPLATES[key];
  if (!t) return;
  document.getElementById('sbi-situation').value = t.situation;
  document.getElementById('sbi-behavior').value  = t.behavior;
  document.getElementById('sbi-impact').value    = t.impact;
  document.getElementById('sbi-closing').value   = t.closing;
  generateSBI();
}

export function renderSBIHistory() {
  const list = document.getElementById('sbi-history-list');
  const empty = document.getElementById('sbi-history-empty');
  if (!list) return;
  const history = load(K_SBI, []);
  if (!history.length) { list.innerHTML = ''; if(empty) empty.style.display='block'; return; }
  if(empty) empty.style.display='none';
  list.innerHTML = history.map(h => `
    <div class="recog-item" style="flex-direction:column;gap:6px">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span style="font-size:12px;font-weight:600;color:var(--accent)">${fmtDate(h.date)}</span>
        <span style="font-size:12px;font-weight:600">${esc(h.personName)}</span>
        <span class="priority-badge ${h.type==='positivo'?'baja':'media'}" style="font-size:10px">${h.type==='positivo'?'🌟 Positivo':'🌱 Desarrollo'}</span>
        <button class="btn-icon" style="margin-left:auto;font-size:13px" onclick="deleteSBIEntry(${h.id})" title="Eliminar">×</button>
      </div>
      <div style="font-size:13px;color:var(--text-secondary);white-space:pre-wrap">${esc(h.text).slice(0,200)}${h.text.length>200?'…':''}</div>
    </div>`).join('');
}

export function deleteSBIEntry(id) {
  const history = load(K_SBI, []).filter(h => h.id !== id);
  save(K_SBI, history);
  renderSBIHistory();
}
