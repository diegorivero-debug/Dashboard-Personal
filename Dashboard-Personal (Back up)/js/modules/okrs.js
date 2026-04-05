/* ═══════════════════════════════════════════════
   OKR & GOALS — Personal objectives tracker
   Quarter-based OKRs with Key Results and progress.
═══════════════════════════════════════════════ */

import { K, FISCAL_QUARTERS } from '../core/constants.js';
import { load, save, esc, showToast } from '../core/utils.js';

// ─── Constants ────────────────────────────────

const CATEGORY_ICONS = {
  negocio:  '💰',
  equipo:   '👥',
  cliente:  '🌟',
  personal: '🧠',
};

const CATEGORY_LABELS = {
  negocio:  'Negocio',
  equipo:   'Equipo',
  cliente:  'Cliente',
  personal: 'Personal',
};

// ─── Data helpers ─────────────────────────────

function loadData() {
  return load(K.okrs, { quarters: {}, activeQuarter: null });
}

function saveData(data) {
  save(K.okrs, data);
}

function getActiveQuarter(data) {
  if (data.activeQuarter && data.quarters[data.activeQuarter]) {
    return data.activeQuarter;
  }
  // Auto-detect from current date
  const now = Date.now();
  let best = null;
  let bestStart = -Infinity;
  for (const fq of FISCAL_QUARTERS) {
    const start = fq.startDate.getTime();
    if (start <= now && start > bestStart) {
      bestStart = start;
      best = fq.label;
    }
  }
  if (!best && FISCAL_QUARTERS.length) best = FISCAL_QUARTERS[0].label;
  return best;
}

function ensureQuarter(data, quarter) {
  if (!data.quarters[quarter]) {
    data.quarters[quarter] = { objectives: [] };
  }
}

function getObjectives(data, quarter) {
  return (data.quarters[quarter] || {}).objectives || [];
}

// ─── Score calculation ────────────────────────

export function getOKRScore() {
  const data = loadData();
  const quarter = getActiveQuarter(data);
  return _calcScore(getObjectives(data, quarter));
}

function _calcScore(objectives) {
  if (!objectives.length) return 0;
  const objScores = objectives.map(obj => _calcObjScore(obj));
  return objScores.reduce((s, v) => s + v, 0) / objScores.length;
}

function _calcObjScore(obj) {
  const krs = obj.keyResults || [];
  if (!krs.length) return 0;
  const krScores = krs.map(kr => {
    if (kr.done) return 1.0;
    if (!kr.target || kr.target === 0) return 0;
    return Math.min(kr.current / kr.target, 1.0);
  });
  return krScores.reduce((s, v) => s + v, 0) / krScores.length;
}

function _scoreColor(score) {
  if (score < 0.3) return '#ff3b30';
  if (score < 0.7) return '#ff9f0a';
  return 'var(--success)';
}

function _progressBar(pct, color, height = 6, width = '100%') {
  return `<div style="background:var(--border);border-radius:99px;overflow:hidden;height:${height}px;width:${width}">
    <div style="height:100%;width:${Math.round(pct * 100)}%;background:${color};border-radius:99px;transition:width 0.3s"></div>
  </div>`;
}

// ─── Quarter selector ─────────────────────────

function _populateQuarterSelect(activeQuarter) {
  const sel = document.getElementById('okr-quarter-select');
  if (!sel) return;
  sel.innerHTML = FISCAL_QUARTERS.map(fq =>
    `<option value="${esc(fq.label)}" ${fq.label === activeQuarter ? 'selected' : ''}>${esc(fq.label)}</option>`
  ).join('');
}

// ─── Render ───────────────────────────────────

export function renderOKRs() {
  const data = loadData();
  const quarter = getActiveQuarter(data);
  data.activeQuarter = quarter;
  saveData(data);

  _populateQuarterSelect(quarter);
  _renderGlobalScore(data, quarter);
  _renderObjectivesList(data, quarter);
}

function _renderGlobalScore(data, quarter) {
  const el = document.getElementById('okr-global-score');
  if (!el) return;
  const objectives = getObjectives(data, quarter);
  const score = _calcScore(objectives);
  const color = _scoreColor(score);
  const pct = Math.round(score * 100);
  const nObj = objectives.length;
  const nKR = objectives.reduce((s, o) => s + (o.keyResults || []).length, 0);

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
      <div>
        <div style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Score global del quarter</div>
        <div style="font-size:36px;font-weight:700;color:${color};line-height:1">${pct}%</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${nObj} objetivo${nObj !== 1 ? 's' : ''} · ${nKR} Key Result${nKR !== 1 ? 's' : ''}</div>
      </div>
      <div style="flex:1;min-width:160px">
        ${_progressBar(score, color, 12)}
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-secondary);margin-top:4px">
          <span>0%</span><span style="color:${color};font-weight:600">${(score).toFixed(2)}</span><span>100%</span>
        </div>
      </div>
    </div>`;
}

function _renderObjectivesList(data, quarter) {
  const listEl = document.getElementById('okr-objectives-list');
  const emptyEl = document.getElementById('okr-empty');
  if (!listEl) return;

  const objectives = getObjectives(data, quarter);

  if (!objectives.length) {
    listEl.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  listEl.innerHTML = objectives.map(obj => _renderObjective(obj)).join('');
}

function _renderObjective(obj) {
  const score = _calcObjScore(obj);
  const color = _scoreColor(score);
  const pct = Math.round(score * 100);
  const icon = CATEGORY_ICONS[obj.category] || '🎯';
  const catLabel = CATEGORY_LABELS[obj.category] || obj.category || '';
  const krsHtml = (obj.keyResults || []).map(kr => _renderKR(obj.id, kr)).join('');

  const notesHtml = obj.notes
    ? `<div class="okr-notes">📝 ${esc(obj.notes)}</div>`
    : '';

  return `<div class="okr-objective" id="okr-obj-${obj.id}">
    <div class="okr-obj-header">
      <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">
        <span style="font-size:18px">${icon}</span>
        <span class="okr-obj-title">${esc(obj.title)}</span>
        <span class="okr-obj-category">${esc(catLabel)}</span>
      </div>
      <div class="okr-obj-actions">
        <button onclick="editObjective(${obj.id})" title="Editar objetivo">✏️</button>
        <button onclick="deleteObjective(${obj.id})" title="Eliminar objetivo">🗑️</button>
      </div>
    </div>
    <div class="okr-obj-score" style="color:${color}">${pct}% <span style="font-size:12px;color:var(--text-secondary);font-weight:400">(${score.toFixed(2)})</span></div>
    ${_progressBar(score, color, 6)}
    <div style="margin-top:14px">
      ${krsHtml}
    </div>
    <button class="okr-add-kr" onclick="addKeyResult(${obj.id})">+ Añadir Key Result</button>
    ${notesHtml}
  </div>`;
}

function _renderKR(objId, kr) {
  const score = kr.done ? 1.0 : (kr.target > 0 ? Math.min(kr.current / kr.target, 1.0) : 0);
  const color = _scoreColor(score);
  const pct = Math.round(score * 100);
  const doneClass = kr.done ? ' done' : '';
  const checkedAttr = kr.done ? ' checked' : '';

  return `<div class="okr-kr" id="okr-kr-${objId}-${kr.id}">
    <input type="checkbox" class="okr-kr-checkbox"${checkedAttr} onchange="toggleKRDone(${objId}, ${kr.id})" title="Marcar como completado">
    <span class="okr-kr-text${doneClass}">${esc(kr.text)}</span>
    <div class="okr-kr-progress">
      <input type="number" class="okr-kr-input" value="${esc(String(kr.current))}"
        onchange="updateKRProgress(${objId}, ${kr.id}, this.value)"
        onblur="updateKRProgress(${objId}, ${kr.id}, this.value)"
        title="Progreso actual" ${kr.done ? 'disabled' : ''}>
      <span class="okr-kr-target">/ ${esc(String(kr.target))} ${esc(kr.unit || '')}</span>
      <div class="okr-kr-bar">
        <div class="okr-kr-bar-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <span style="font-size:11px;color:${color};font-weight:600;min-width:32px;text-align:right">${pct}%${kr.done ? ' ✅' : ''}</span>
    </div>
    <button class="okr-kr-delete" onclick="deleteKeyResult(${objId}, ${kr.id})" title="Eliminar KR">×</button>
  </div>`;
}

// ─── Add / edit objective ─────────────────────

export function addObjective() {
  const formEl = document.getElementById('okr-new-form');
  if (!formEl) return;
  formEl.style.display = 'block';
  formEl.innerHTML = `
    <div class="okr-inline-form">
      <input type="text" class="task-input" id="okr-new-title" placeholder="Título del objetivo" style="flex:2;min-width:220px" maxlength="200">
      <select class="task-select" id="okr-new-category">
        <option value="negocio">💰 Negocio</option>
        <option value="equipo">👥 Equipo</option>
        <option value="cliente">🌟 Cliente</option>
        <option value="personal">🧠 Personal</option>
      </select>
      <input type="text" class="task-input" id="okr-new-notes" placeholder="Notas (opcional)" style="flex:2;min-width:180px" maxlength="300">
      <button class="btn btn-primary" onclick="_saveNewObjective()" style="font-size:13px">Guardar</button>
      <button class="btn" onclick="_cancelNewObjective()" style="font-size:13px">Cancelar</button>
    </div>`;
  document.getElementById('okr-new-title')?.focus();
}

window._saveNewObjective = function() {
  const titleEl    = document.getElementById('okr-new-title');
  const catEl      = document.getElementById('okr-new-category');
  const notesEl    = document.getElementById('okr-new-notes');
  const title = (titleEl?.value || '').trim();
  if (!title) { showToast('El título es obligatorio', 'error'); return; }
  const data = loadData();
  const quarter = getActiveQuarter(data);
  ensureQuarter(data, quarter);
  data.quarters[quarter].objectives.push({
    id: Date.now(),
    title,
    category: catEl?.value || 'negocio',
    keyResults: [],
    notes: (notesEl?.value || '').trim(),
    createdAt: new Date().toISOString().slice(0, 10),
  });
  saveData(data);
  _cancelNewObjective();
  renderOKRs();
  showToast('Objetivo creado', 'success');
};

window._cancelNewObjective = function() {
  const formEl = document.getElementById('okr-new-form');
  if (formEl) { formEl.style.display = 'none'; formEl.innerHTML = ''; }
};

export function editObjective(objId) {
  const data = loadData();
  const quarter = getActiveQuarter(data);
  const objectives = getObjectives(data, quarter);
  const obj = objectives.find(o => o.id === objId);
  if (!obj) return;

  const el = document.getElementById(`okr-obj-${objId}`);
  if (!el) return;

  el.innerHTML = `
    <div class="okr-inline-form">
      <input type="text" class="task-input" id="okr-edit-title-${objId}" value="${esc(obj.title)}" style="flex:2;min-width:220px" maxlength="200">
      <select class="task-select" id="okr-edit-cat-${objId}">
        ${['negocio','equipo','cliente','personal'].map(c =>
          `<option value="${c}" ${c === obj.category ? 'selected' : ''}>${CATEGORY_ICONS[c]} ${CATEGORY_LABELS[c]}</option>`
        ).join('')}
      </select>
      <input type="text" class="task-input" id="okr-edit-notes-${objId}" value="${esc(obj.notes || '')}" placeholder="Notas (opcional)" style="flex:2;min-width:180px" maxlength="300">
      <button class="btn btn-primary" onclick="_saveEditObjective(${objId})" style="font-size:13px">Guardar</button>
      <button class="btn" onclick="renderOKRs()" style="font-size:13px">Cancelar</button>
    </div>`;
  document.getElementById(`okr-edit-title-${objId}`)?.focus();
}

window._saveEditObjective = function(objId) {
  const titleEl = document.getElementById(`okr-edit-title-${objId}`);
  const catEl   = document.getElementById(`okr-edit-cat-${objId}`);
  const notesEl = document.getElementById(`okr-edit-notes-${objId}`);
  const title = (titleEl?.value || '').trim();
  if (!title) { showToast('El título es obligatorio', 'error'); return; }
  const data = loadData();
  const quarter = getActiveQuarter(data);
  const objectives = getObjectives(data, quarter);
  const obj = objectives.find(o => o.id === objId);
  if (!obj) return;
  obj.title    = title;
  obj.category = catEl?.value || obj.category;
  obj.notes    = (notesEl?.value || '').trim();
  saveData(data);
  renderOKRs();
  showToast('Objetivo actualizado', 'success');
};

export function deleteObjective(objId) {
  if (!confirm('¿Eliminar este objetivo y todos sus Key Results?')) return;
  const data = loadData();
  const quarter = getActiveQuarter(data);
  if (!data.quarters[quarter]) return;
  data.quarters[quarter].objectives = data.quarters[quarter].objectives.filter(o => o.id !== objId);
  saveData(data);
  renderOKRs();
  showToast('Objetivo eliminado', 'success');
}

// ─── Add / update / delete Key Results ───────

export function addKeyResult(objId) {
  const objEl = document.getElementById(`okr-obj-${objId}`);
  if (!objEl) return;

  // If a KR form is already open for this objective, do nothing
  if (objEl.querySelector('.okr-kr-add-form')) return;

  const addBtn = objEl.querySelector('.okr-add-kr');
  if (!addBtn) return;

  const formId = `okr-kr-form-${objId}`;
  const formHtml = `<div class="okr-inline-form okr-kr-add-form" id="${formId}" style="margin-top:8px">
    <input type="text" class="task-input" id="okr-kr-text-${objId}" placeholder="Descripción del Key Result" style="flex:3;min-width:200px" maxlength="300">
    <input type="number" class="task-input" id="okr-kr-target-${objId}" placeholder="Target" style="width:80px;flex:none" min="0">
    <select class="task-select" id="okr-kr-unit-${objId}" style="min-width:70px;flex:none">
      <option value="%">%</option>
      <option value="pts">pts</option>
      <option value="€">€</option>
      <option value="uds">uds</option>
    </select>
    <button class="btn btn-primary" onclick="_saveNewKR(${objId})" style="font-size:13px">Guardar</button>
    <button class="btn" onclick="_cancelNewKR(${objId})" style="font-size:13px">Cancelar</button>
  </div>`;

  addBtn.insertAdjacentHTML('beforebegin', formHtml);
  document.getElementById(`okr-kr-text-${objId}`)?.focus();
}

window._saveNewKR = function(objId) {
  const textEl   = document.getElementById(`okr-kr-text-${objId}`);
  const targetEl = document.getElementById(`okr-kr-target-${objId}`);
  const unitEl   = document.getElementById(`okr-kr-unit-${objId}`);
  const text   = (textEl?.value || '').trim();
  const target = parseFloat(targetEl?.value || '0') || 0;
  if (!text) { showToast('La descripción es obligatoria', 'error'); return; }
  if (target <= 0) { showToast('El target debe ser mayor que 0', 'error'); return; }
  const data = loadData();
  const quarter = getActiveQuarter(data);
  const objectives = getObjectives(data, quarter);
  const obj = objectives.find(o => o.id === objId);
  if (!obj) return;
  obj.keyResults.push({
    id: Date.now(),
    text,
    target,
    current: 0,
    unit: unitEl?.value || '%',
    done: false,
  });
  saveData(data);
  renderOKRs();
  showToast('Key Result añadido', 'success');
};

window._cancelNewKR = function(objId) {
  document.getElementById(`okr-kr-form-${objId}`)?.remove();
};

export function updateKRProgress(objId, krId, newValue) {
  const val = parseFloat(String(newValue).replace(',', '.'));
  if (isNaN(val)) return;
  const data = loadData();
  const quarter = getActiveQuarter(data);
  const objectives = getObjectives(data, quarter);
  const obj = objectives.find(o => o.id === objId);
  if (!obj) return;
  const kr = (obj.keyResults || []).find(k => k.id === krId);
  if (!kr) return;
  kr.current = val;
  saveData(data);
  // Re-render just this KR row and the progress bars
  _refreshObjDisplay(data, quarter, obj);
}

export function toggleKRDone(objId, krId) {
  const data = loadData();
  const quarter = getActiveQuarter(data);
  const objectives = getObjectives(data, quarter);
  const obj = objectives.find(o => o.id === objId);
  if (!obj) return;
  const kr = (obj.keyResults || []).find(k => k.id === krId);
  if (!kr) return;
  kr.done = !kr.done;
  saveData(data);
  _refreshObjDisplay(data, quarter, obj);
}

export function deleteKeyResult(objId, krId) {
  if (!confirm('¿Eliminar este Key Result?')) return;
  const data = loadData();
  const quarter = getActiveQuarter(data);
  const objectives = getObjectives(data, quarter);
  const obj = objectives.find(o => o.id === objId);
  if (!obj) return;
  obj.keyResults = obj.keyResults.filter(k => k.id !== krId);
  saveData(data);
  renderOKRs();
  showToast('Key Result eliminado', 'success');
}

/** Re-render a single objective card and the global score bar without full re-render */
function _refreshObjDisplay(data, quarter, obj) {
  const el = document.getElementById(`okr-obj-${obj.id}`);
  if (el) {
    const tmp = document.createElement('div');
    tmp.innerHTML = _renderObjective(obj);
    el.replaceWith(tmp.firstElementChild);
  }
  _renderGlobalScore(data, quarter);
}

// ─── Quarter switcher ─────────────────────────

export function setOKRQuarter(quarter) {
  const data = loadData();
  data.activeQuarter = quarter;
  ensureQuarter(data, quarter);
  saveData(data);
  renderOKRs();
}

// ─── Init ─────────────────────────────────────

export function initOKRs() {
  // Expose all public functions on window for HTML onclick handlers
  window.renderOKRs          = renderOKRs;
  window.addObjective         = addObjective;
  window.editObjective        = editObjective;
  window.deleteObjective      = deleteObjective;
  window.addKeyResult         = addKeyResult;
  window.updateKRProgress     = updateKRProgress;
  window.toggleKRDone         = toggleKRDone;
  window.deleteKeyResult      = deleteKeyResult;
  window.setOKRQuarter        = setOKRQuarter;
  window.getOKRScore          = getOKRScore;
}
