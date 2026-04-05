/* ═══════════════════════════════════════════════
   RECONOCIMIENTOS MODULE — extracted from dashboard.js
   Handles recognitions CRUD, scoreboard view,
   and category filtering.
═══════════════════════════════════════════════ */

import { K } from '../core/constants.js';
import { load, save, esc, fmtDate, showToast } from '../core/utils.js';

export const RECOG_CATEGORIES = {
  resultado:    { label: 'Resultado',    emoji: '🎯' },
  innovacion:   { label: 'Innovación',   emoji: '💡' },
  colaboracion: { label: 'Colaboración', emoji: '🤝' },
  cliente:      { label: 'Cliente',      emoji: '🌟' },
};

export let _recogView = 'lista';        // 'lista' | 'scoreboard'
export let _scoreboardPeriod = 'quarter'; // 'month' | 'quarter' | 'year'

export function getMemberName(personId) {
  const team = window.team || [];
  const equipoLiderazgo = window.equipoLiderazgo || [];
  const m = team.find(m => m.id === personId);
  if (m) return m.name;
  const e = equipoLiderazgo.find(e => e.id === personId);
  return e ? e.nombre : 'Desconocido';
}

export function switchRecogView(view) {
  _recogView = view;
  document.getElementById('recog-lista-view').style.display = view === 'lista' ? 'block' : 'none';
  document.getElementById('recog-scoreboard-view').style.display = view === 'scoreboard' ? 'block' : 'none';
  document.getElementById('recog-view-lista').classList.toggle('active', view === 'lista');
  document.getElementById('recog-view-scoreboard').classList.toggle('active', view === 'scoreboard');
  if (view === 'scoreboard') renderScoreboard();
}

export function setScoreboardPeriod(period) {
  _scoreboardPeriod = period;
  renderScoreboard();
}

export function renderScoreboard() {
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

export function updateRecogDropdown() {
  const sel = document.getElementById('recog-person'); if (!sel) return;
  const equipoLiderazgo = window.equipoLiderazgo || [];
  const team = window.team || [];
  // Always include all equipoLiderazgo members so they remain selectable even when hidden/removed
  const leaderIds = new Set(equipoLiderazgo.map(e => e.id));
  const extraMembers = team.filter(m => !leaderIds.has(m.id) && !m.hidden);
  const allMembers = [
    ...equipoLiderazgo.map(e => ({ id: e.id, name: e.nombre })),
    ...extraMembers.map(m => ({ id: m.id, name: m.name }))
  ];
  sel.innerHTML = allMembers.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('');
}

export function addRecog() {
  const personId = parseInt(document.getElementById('recog-person')?.value);
  const desc = document.getElementById('recog-desc')?.value.trim();
  const date = document.getElementById('recog-date')?.value || new Date().toISOString().slice(0,10);
  const cat = document.getElementById('recog-category')?.value || 'resultado';
  if (!personId || !desc) { document.getElementById('recog-desc')?.focus(); return; }
  const recogs = load(K.reconocimientos, []);
  recogs.push({ id: Date.now(), personId, desc, date, cat });
  save(K.reconocimientos, recogs);
  document.getElementById('recog-desc').value = '';
  renderRecogs();
  window.renderTeam?.();
}

export function renderRecogs() {
  const list = document.getElementById('recog-list');
  const empty = document.getElementById('recog-empty');
  if (!list) return;
  const MAX_RECENT_RECOGS = 20; // show last 20 entries (up from 10 to better reflect recent activity)
  const recogs = load(K.reconocimientos, []).slice(-MAX_RECENT_RECOGS).reverse();
  if (!recogs.length) { list.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
  if (empty) empty.style.display = 'none';
  list.innerHTML = recogs.map(r => {
    /* backward compat: records without `cat` default to "resultado" */
    const cat = r.cat || 'resultado';
    const catInfo = RECOG_CATEGORIES[cat] || RECOG_CATEGORIES.resultado;
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
