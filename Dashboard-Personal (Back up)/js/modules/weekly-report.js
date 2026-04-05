/* ═══════════════════════════════════════════════
   WEEKLY REPORT — Auto-generated weekly summary
   Reads all localStorage sources and renders a
   complete exportable report (clipboard + print).
═══════════════════════════════════════════════ */

import { K, FISCAL_QUARTERS, MESES, DIAS } from '../core/constants.js';
import { load, esc, showToast, num } from '../core/utils.js';

// ─── Date helpers ─────────────────────────────

function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getSundayOfWeek(date) {
  const mon = getMondayOfWeek(date);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return sun;
}

function fmtShort(date) {
  return `${date.getDate()} ${MESES[date.getMonth()].slice(0,3)}`;
}

function getWeekLabel() {
  const now = new Date();
  const mon = getMondayOfWeek(now);
  const sun = getSundayOfWeek(now);
  return `Semana del ${fmtShort(mon)} – ${fmtShort(sun)} ${sun.getFullYear()}`;
}

function getQuarterInfo() {
  const now = Date.now();
  let label = '—';
  let weekInQuarter = '—';
  let bestStart = -Infinity;
  for (const fq of FISCAL_QUARTERS) {
    const start = fq.startDate.getTime();
    if (start <= now && start > bestStart) {
      bestStart = start;
      label = fq.label;
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      weekInQuarter = 'W' + (Math.floor((now - start) / msPerWeek) + 1);
    }
  }
  return { label, weekInQuarter };
}

function isThisWeek(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const mon = getMondayOfWeek(new Date());
  const sun = getSundayOfWeek(new Date());
  return d >= mon && d <= sun;
}

// ─── KPI helpers ──────────────────────────────

function parseNum(val) {
  if (val === undefined || val === null || val === '') return null;
  const s = String(val).replace(/[^0-9.,\-]/g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

const KPI_FIELD_MAP = [
  { key: 'ventas',          label: 'Ventas',         valField: 'ventas',          objField: 'objVentas' },
  { key: 'ventasBusiness',  label: 'Ventas Business', valField: 'ventasBusiness',  objField: 'objVentasBusiness' },
  { key: 'ventasApu',       label: 'Ventas APU',      valField: 'ventasApu',       objField: 'objVentasApu' },
  { key: 'ventasSfs',       label: 'Ventas SFS',      valField: 'ventasSfs',       objField: 'objVentasSfs' },
  { key: 'nps',             label: 'NPS Tienda',      valField: 'nps',             objField: null },
  { key: 'npsShop',         label: 'NPS Shopping',    valField: 'npsShop',         objField: null },
  { key: 'npsApu',          label: 'NPS APU',         valField: 'npsApu',          objField: null },
  { key: 'npsSupport',      label: 'NPS Support',     valField: 'npsSupport',      objField: null },
  { key: 'npsTaa',          label: 'NPS T@A',         valField: 'npsTaa',          objField: null },
  { key: 'conv',            label: 'Conversión',      valField: 'conv',            objField: 'objConv' },
  { key: 'upt',             label: 'UPT',             valField: 'upt',             objField: 'objUpt' },
  { key: 'dta',             label: 'DTA %',           valField: 'dta',             objField: 'objDta' },
  { key: 'intros1k',        label: 'Intros/1K',       valField: 'intros1k',        objField: 'objIntros1k' },
  { key: 'timely',          label: 'Timely %',        valField: 'timely',          objField: 'objTimely' },
  { key: 'cpUsage',         label: 'C&P Usage',       valField: 'cpUsage',         objField: 'objCpUsage' },
  { key: 'gbConv',          label: 'GB Conv.',         valField: 'gbConv',          objField: 'objGbConv' },
];

// ─── generateReportData ───────────────────────

export function generateReportData() {
  const now = new Date();
  const mon = getMondayOfWeek(now);
  const sun = getSundayOfWeek(now);
  const quarter = getQuarterInfo();

  // ── KPIs ──────────────────────────────────
  const kpisRaw = load(K.kpis, {});
  const kpiHistory = load(K.kpiHistory, []);

  // Find the most recent history entry before this week (for WoW comparison)
  const prevEntries = kpiHistory.filter(e => {
    const d = new Date(e.date);
    return !isNaN(d.getTime()) && d < mon;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
  const prevEntry = prevEntries[0] || null;

  const kpis = KPI_FIELD_MAP
    .map(m => {
      const actual = parseNum(kpisRaw[m.valField]);
      if (actual === null) return null;
      const objetivo = m.objField ? parseNum(kpisRaw[m.objField]) : null;
      const pct = objetivo && objetivo > 0 ? Math.round((actual / objetivo) * 100) : null;

      // WoW from kpiHistory
      let wow = null;
      let trendArrow = '→';
      if (prevEntry) {
        const prevVal = parseNum(prevEntry[m.valField]);
        if (prevVal !== null && prevVal !== 0 && actual !== null) {
          wow = ((actual - prevVal) / Math.abs(prevVal)) * 100;
          trendArrow = wow > 0.5 ? '↑' : wow < -0.5 ? '↓' : '→';
        }
      }
      return { key: m.key, label: m.label, actual, objetivo, pct, wow, trendArrow };
    })
    .filter(Boolean);

  // ── Tasks ────────────────────────────────
  const tasks = load(K.tasks, []);
  const todayStr = now.toISOString().slice(0, 10);
  let completedThisWeek = 0, pending = 0, overdue = 0;
  const topPending = [];
  for (const t of tasks) {
    if (t.done) {
      const doneDate = t.doneAt ? t.doneAt.slice(0, 10) : null;
      if (doneDate && isThisWeek(doneDate)) completedThisWeek++;
    } else {
      pending++;
      if (t.dueDate && t.dueDate < todayStr) overdue++;
      if (topPending.length < 5) topPending.push(t);
    }
  }

  // ── Team ─────────────────────────────────
  const team = load(K.team, []);
  const tbs = load(K.tbs, []);
  const sbiHistory = load('apg_sbi_history', []);
  const reconocimientos = load(K.reconocimientos, []);

  const activeMembers = team.filter(m => !m.inactive && m.visible !== false);
  const totalActive = activeMembers.length;

  const oneOnOnesDone = tbs.filter(tb => isThisWeek(tb.date)).length;
  const feedbackGiven = sbiHistory.filter(f => isThisWeek(f.date)).length;
  const recognitionsThisWeek = reconocimientos.filter(r => isThisWeek(r.date)).length;

  // Members needing attention: no 1:1 in 14+ days
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const membersNeedingAttention = activeMembers.filter(m => {
    const memberTbs = tbs.filter(tb => String(tb.personId) === String(m.id));
    if (!memberTbs.length) return true;
    const lastTb = memberTbs.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    return new Date(lastTb.date) < fourteenDaysAgo;
  }).map(m => m.nombre || m.name || 'Persona');

  // ── Meetings ─────────────────────────────
  const events = load(K.events, []);
  const reuniones = load(K.reuniones, []);
  const meetingNotes = load(K.meetingNotes, []);

  const meetingsThisWeek = events.filter(e => isThisWeek(e.date || e.start));
  const totalThisWeek = meetingsThisWeek.length;
  const completedMeetings = meetingsThisWeek.filter(e => e.done || e.completed).length;

  // Check which meetings have notes
  const noteReunionIds = new Set(meetingNotes.map(n => String(n.reunionId || n.meetingId || '')));
  const noteEventIds = new Set(meetingNotes.map(n => String(n.eventId || '')));
  const withNotes = meetingsThisWeek.filter(e =>
    noteEventIds.has(String(e.id)) || noteReunionIds.has(String(e.id))
  ).length;
  const withoutNotes = totalThisWeek - withNotes;

  // Also count actas/reunion records
  const reunionesThisWeek = reuniones.filter(r => isThisWeek(r.fecha || r.date));

  // ── Focus Metric ──────────────────────────
  const focusMetricRaw = load(K.focusMetric, null);
  const focusMetric = focusMetricRaw ? {
    metric: focusMetricRaw.metric || focusMetricRaw.name || '—',
    hypothesis: focusMetricRaw.hypothesis || focusMetricRaw.hipotesis || '',
    reflection: focusMetricRaw.reflection || focusMetricRaw.reflexion || '',
  } : null;

  // ── Briefing streak ────────────────────────
  const briefingDate = load(K.briefingDate, null);
  let briefingStreak = 0;
  if (briefingDate) {
    // Simple approach: days since first briefing if continuous — use stored streak or date diff
    const bd = new Date(briefingDate);
    if (!isNaN(bd.getTime())) {
      briefingStreak = Math.max(0, Math.floor((now - bd) / (24 * 60 * 60 * 1000)) + 1);
    }
  }

  // ── OKRs ──────────────────────────────────
  const okrsData = load(K.okrs, { quarters: {}, activeQuarter: null });
  let okrGlobalScore = null;
  let okrObjectives = [];
  const activeQ = okrsData.activeQuarter;
  const qData = activeQ ? okrsData.quarters[activeQ] : null;
  if (qData && qData.objectives && qData.objectives.length) {
    okrObjectives = qData.objectives.map(obj => {
      const krs = obj.keyResults || [];
      let score = 0;
      if (krs.length) {
        const sum = krs.reduce((acc, kr) => {
          const target = parseNum(kr.target) || 1;
          const current = parseNum(kr.current) || 0;
          return acc + Math.min(current / target, 1);
        }, 0);
        score = sum / krs.length;
      }
      return { title: obj.title || '—', score: Math.round(score * 100) / 100, krsCount: krs.length };
    });
    if (okrObjectives.length) {
      okrGlobalScore = Math.round(
        (okrObjectives.reduce((a, o) => a + o.score, 0) / okrObjectives.length) * 100
      ) / 100;
    }
  }

  const data = {
    meta: {
      weekLabel: getWeekLabel(),
      quarter: quarter.label,
      weekInQuarter: quarter.weekInQuarter,
      generatedAt: now.toLocaleString('es-ES'),
    },
    kpis,
    tasks: { completedThisWeek, pending, overdue, topPending },
    team: {
      totalActive,
      oneOnOnesDone,
      feedbackGiven,
      recognitionsThisWeek,
      membersNeedingAttention,
    },
    meetings: {
      totalThisWeek,
      completed: completedMeetings,
      withNotes,
      withoutNotes,
      reunionesCount: reunionesThisWeek.length,
    },
    focusMetric,
    okrs: { globalScore: okrGlobalScore, objectives: okrObjectives, activeQuarter: activeQ },
    briefingStreak,
    highlights: [],
  };

  data.highlights = generateHighlights(data);
  return data;
}

// ─── generateHighlights ───────────────────────

export function generateHighlights(data) {
  const insights = [];

  // 1–3: KPI trends
  for (const kpi of (data.kpis || [])) {
    if (kpi.wow !== null) {
      if (kpi.wow > 0) {
        insights.push({ type: 'positive', text: `✅ ${kpi.label} mejoró +${kpi.wow.toFixed(1)}% esta semana` });
      } else if (kpi.wow < -5) {
        insights.push({ type: 'warning', text: `📉 ${kpi.label} cayó ${kpi.wow.toFixed(1)}% esta semana` });
      }
    }
    if (kpi.pct !== null && kpi.pct >= 100) {
      insights.push({ type: 'positive', text: `🎯 ${kpi.label} superó el objetivo (${kpi.pct}%)` });
    }
  }

  // 4: Overdue tasks
  if (data.tasks && data.tasks.overdue > 0) {
    insights.push({ type: 'warning', text: `⚠️ ${data.tasks.overdue} tarea${data.tasks.overdue > 1 ? 's' : ''} vencida${data.tasks.overdue > 1 ? 's' : ''}` });
  }

  // 5: Members needing 1:1
  if (data.team && data.team.membersNeedingAttention && data.team.membersNeedingAttention.length > 0) {
    const n = data.team.membersNeedingAttention.length;
    insights.push({ type: 'warning', text: `👥 ${n} persona${n > 1 ? 's' : ''} sin 1:1 en +14 días` });
  }

  // 6: Recognitions
  if (data.team && data.team.recognitionsThisWeek > 0) {
    insights.push({ type: 'positive', text: `🏆 ${data.team.recognitionsThisWeek} reconocimiento${data.team.recognitionsThisWeek > 1 ? 's' : ''} dado${data.team.recognitionsThisWeek > 1 ? 's' : ''} esta semana` });
  }

  // 7: Meetings without notes
  if (data.meetings && data.meetings.withoutNotes > 0) {
    insights.push({ type: 'info', text: `📝 ${data.meetings.withoutNotes} reunión${data.meetings.withoutNotes > 1 ? 'es' : ''} sin notas esta semana` });
  }

  // 8: OKR score health
  if (data.okrs && data.okrs.globalScore !== null) {
    if (data.okrs.globalScore >= 0.7) {
      insights.push({ type: 'positive', text: `🎯 OKRs en buen estado: score global ${data.okrs.globalScore.toFixed(2)}` });
    } else if (data.okrs.globalScore < 0.3) {
      insights.push({ type: 'warning', text: `⚠️ OKRs por debajo del mínimo: score ${data.okrs.globalScore.toFixed(2)} — revisar prioridades` });
    } else {
      insights.push({ type: 'info', text: `📊 OKRs en progreso: score global ${data.okrs.globalScore.toFixed(2)}` });
    }
  }

  // 9: Briefing streak
  if (data.briefingStreak >= 5) {
    insights.push({ type: 'positive', text: `🔥 ${data.briefingStreak} días de racha con briefing diario` });
  }

  // 10: Focus metric
  if (data.focusMetric && data.focusMetric.metric && data.focusMetric.metric !== '—') {
    insights.push({ type: 'info', text: `🔍 Métrica foco activa: ${data.focusMetric.metric}` });
  }

  return insights;
}

// ─── renderWeeklyReport ───────────────────────

export function renderWeeklyReport() {
  const container = document.getElementById('weekly-report-content');
  if (!container) return;

  const data = generateReportData();

  // ── Header ──────────────────────────────
  const headerHtml = `
    <div class="wr-section wr-header">
      <div class="wr-header-title">📋 Weekly Report</div>
      <div class="wr-header-sub">${esc(data.meta.weekLabel)}</div>
      <div class="wr-header-sub" style="margin-top:4px">${esc(data.meta.quarter)} · ${esc(data.meta.weekInQuarter)} · Generado: ${esc(data.meta.generatedAt)}</div>
    </div>`;

  // ── KPI table ───────────────────────────
  let kpiRows = '';
  if (data.kpis.length) {
    for (const kpi of data.kpis) {
      const pctStr = kpi.pct !== null ? `${kpi.pct}%` : '—';
      const pctClass = kpi.pct === null ? '' :
        kpi.pct >= 90 ? 'wr-kpi-green' :
        kpi.pct >= 70 ? 'wr-kpi-yellow' : 'wr-kpi-red';
      const wowStr = kpi.wow !== null ? (kpi.wow >= 0 ? `+${kpi.wow.toFixed(1)}%` : `${kpi.wow.toFixed(1)}%`) : '—';
      const trendClass = kpi.trendArrow === '↑' ? 'wr-trend-up' : kpi.trendArrow === '↓' ? 'wr-trend-down' : 'wr-trend-flat';
      const objStr = kpi.objetivo !== null ? num(kpi.objetivo) : '—';
      kpiRows += `<tr>
        <td>${esc(kpi.label)}</td>
        <td>${num(kpi.actual)}</td>
        <td>${esc(objStr)}</td>
        <td class="${pctClass}">${esc(pctStr)}</td>
        <td class="${trendClass}">${esc(kpi.trendArrow)} ${esc(wowStr)}</td>
      </tr>`;
    }
  } else {
    kpiRows = `<tr><td colspan="5" class="wr-empty">Sin datos de KPIs disponibles</td></tr>`;
  }
  const kpiHtml = `
    <div class="wr-section">
      <div class="wr-section-title">📊 KPIs de la semana</div>
      <table class="wr-kpi-table">
        <thead><tr>
          <th>Métrica</th><th>Actual</th><th>Objetivo</th><th>%</th><th>WoW</th>
        </tr></thead>
        <tbody>${kpiRows}</tbody>
      </table>
    </div>`;

  // ── Stats grid ──────────────────────────
  const t = data.tasks;
  const tm = data.team;
  const mt = data.meetings;
  const statsHtml = `
    <div class="wr-section">
      <div class="wr-section-title">📋 Resumen de actividad</div>
      <div class="wr-stat-grid">
        <div class="wr-stat">
          <div class="wr-stat-number">${t.completedThisWeek}</div>
          <div class="wr-stat-label">Tareas completadas</div>
        </div>
        <div class="wr-stat">
          <div class="wr-stat-number">${t.pending}</div>
          <div class="wr-stat-label">Tareas pendientes</div>
        </div>
        <div class="wr-stat" style="${t.overdue > 0 ? 'border-color:var(--danger,#ff3b30)' : ''}">
          <div class="wr-stat-number" style="${t.overdue > 0 ? 'color:var(--danger,#ff3b30)' : ''}">${t.overdue}</div>
          <div class="wr-stat-label">Tareas vencidas</div>
        </div>
        <div class="wr-stat">
          <div class="wr-stat-number">${tm.oneOnOnesDone}</div>
          <div class="wr-stat-label">1:1s esta semana</div>
        </div>
        <div class="wr-stat">
          <div class="wr-stat-number">${tm.feedbackGiven}</div>
          <div class="wr-stat-label">Feedbacks dados</div>
        </div>
        <div class="wr-stat">
          <div class="wr-stat-number">${tm.recognitionsThisWeek}</div>
          <div class="wr-stat-label">Reconocimientos</div>
        </div>
        <div class="wr-stat">
          <div class="wr-stat-number">${mt.totalThisWeek}</div>
          <div class="wr-stat-label">Reuniones</div>
        </div>
        <div class="wr-stat">
          <div class="wr-stat-number">${mt.withNotes}</div>
          <div class="wr-stat-label">Con notas</div>
        </div>
      </div>
    </div>`;

  // ── Focus Metric ─────────────────────────
  let focusHtml = '';
  if (data.focusMetric) {
    focusHtml = `
      <div class="wr-section">
        <div class="wr-section-title">🔍 Métrica foco</div>
        <div style="font-size:16px;font-weight:700;margin-bottom:6px">${esc(data.focusMetric.metric)}</div>
        ${data.focusMetric.hypothesis ? `<div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px"><strong>Hipótesis:</strong> ${esc(data.focusMetric.hypothesis)}</div>` : ''}
        ${data.focusMetric.reflection ? `<div style="font-size:13px;color:var(--text-secondary)"><strong>Reflexión:</strong> ${esc(data.focusMetric.reflection)}</div>` : ''}
      </div>`;
  }

  // ── OKRs ─────────────────────────────────
  let okrHtml = '';
  if (data.okrs.objectives.length) {
    const scoreColor = data.okrs.globalScore >= 0.7 ? 'var(--success,#34c759)' :
                       data.okrs.globalScore >= 0.3 ? 'var(--warning,#ff9f0a)' : 'var(--danger,#ff3b30)';
    const objRows = data.okrs.objectives.map(obj => {
      const pct = Math.round(obj.score * 100);
      const barColor = obj.score >= 0.7 ? 'var(--success,#34c759)' :
                       obj.score >= 0.3 ? 'var(--warning,#ff9f0a)' : 'var(--danger,#ff3b30)';
      return `<div class="wr-okr-row">
        <div style="flex:1;min-width:0;font-size:13px">${esc(obj.title)}</div>
        <div class="wr-okr-bar"><div class="wr-okr-bar-fill" style="width:${pct}%;background:${barColor}"></div></div>
        <div style="font-size:13px;font-weight:600;color:${barColor};width:36px;text-align:right">${obj.score.toFixed(2)}</div>
      </div>`;
    }).join('');
    okrHtml = `
      <div class="wr-section">
        <div class="wr-section-title">🎯 OKRs — ${esc(data.okrs.activeQuarter || '')}</div>
        <div style="margin-bottom:12px;font-size:13px">Score global: <strong style="color:${scoreColor}">${data.okrs.globalScore !== null ? data.okrs.globalScore.toFixed(2) : '—'}</strong></div>
        ${objRows}
      </div>`;
  }

  // ── Highlights ───────────────────────────
  let highlightsHtml = '';
  if (data.highlights.length) {
    const items = data.highlights.map(h =>
      `<div class="wr-highlight ${esc(h.type)}">${esc(h.text)}</div>`
    ).join('');
    highlightsHtml = `
      <div class="wr-section">
        <div class="wr-section-title">💡 Highlights de la semana</div>
        ${items}
      </div>`;
  }

  // ── Top pending tasks ────────────────────
  let pendingTasksHtml = '';
  if (t.topPending.length) {
    const items = t.topPending.map(task => {
      const isOverdue = task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10);
      return `<div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;${isOverdue ? 'color:var(--danger,#ff3b30)' : ''}">
        ${isOverdue ? '⚠️ ' : '• '}${esc(task.title || task.texto || 'Sin título')}
        ${task.dueDate ? `<span style="font-size:11px;color:var(--text-secondary);margin-left:8px">${esc(task.dueDate)}</span>` : ''}
      </div>`;
    }).join('');
    pendingTasksHtml = `
      <div class="wr-section">
        <div class="wr-section-title">✅ Top tareas pendientes</div>
        ${items}
      </div>`;
  }

  // ── Personal notes ───────────────────────
  const notesHtml = `
    <div class="wr-section">
      <div class="wr-section-title">📝 Notas personales</div>
      <textarea class="wr-notes-area" placeholder="Añade notas para esta semana (solo esta sesión)…"></textarea>
    </div>`;

  container.innerHTML = `<div class="wr-report">
    ${headerHtml}
    ${kpiHtml}
    ${statsHtml}
    ${focusHtml}
    ${okrHtml}
    ${highlightsHtml}
    ${pendingTasksHtml}
    ${notesHtml}
  </div>`;
}

// ─── copyReportToClipboard ────────────────────

export function copyReportToClipboard() {
  const data = generateReportData();
  const lines = [];
  const SEP = '━'.repeat(51);

  lines.push(`📋 WEEKLY REPORT — ${data.meta.weekLabel}`);
  lines.push(`Apple · Store Leader · Dashboard`);
  lines.push(SEP);
  lines.push('');

  // KPI ASCII table
  if (data.kpis.length) {
    lines.push('📊 KPIs');
    const col1 = Math.max(18, ...data.kpis.map(k => k.label.length + 1));
    const header = `┌${'─'.repeat(col1)}┬──────────┬──────────┬─────┬────────┐`;
    const headRow = `│ ${'Métrica'.padEnd(col1 - 1)}│ Actual   │ Objetivo │  %  │ WoW    │`;
    const sep =     `├${'─'.repeat(col1)}┼──────────┼──────────┼─────┼────────┤`;
    const footer =  `└${'─'.repeat(col1)}┴──────────┴──────────┴─────┴────────┘`;
    lines.push(header);
    lines.push(headRow);
    lines.push(sep);
    for (const kpi of data.kpis) {
      const actualStr = String(num(kpi.actual)).slice(0, 8);
      const objStr = kpi.objetivo !== null ? String(num(kpi.objetivo)).slice(0, 8) : '—';
      const pctStr = kpi.pct !== null ? `${kpi.pct}%` : '—';
      const wowStr = kpi.wow !== null ? (kpi.wow >= 0 ? `+${kpi.wow.toFixed(1)}%` : `${kpi.wow.toFixed(1)}%`) : '—';
      lines.push(
        `│ ${kpi.label.padEnd(col1 - 1)}│ ${actualStr.padEnd(8)} │ ${objStr.padEnd(8)} │ ${pctStr.padStart(3)} │ ${wowStr.padEnd(6)} │`
      );
    }
    lines.push(footer);
    lines.push('');
  }

  // Summary
  const t = data.tasks;
  const tm = data.team;
  const mt = data.meetings;
  lines.push(`✅ TAREAS: ${t.completedThisWeek} completadas · ${t.pending} pendientes · ${t.overdue} vencidas`);
  lines.push(`👥 EQUIPO: ${tm.oneOnOnesDone} 1:1s · ${tm.feedbackGiven} feedbacks · ${tm.recognitionsThisWeek} reconocimientos`);
  lines.push(`🗒️ REUNIONES: ${mt.totalThisWeek} reuniones · ${mt.withNotes} con notas`);
  lines.push('');

  // OKRs
  if (data.okrs.globalScore !== null) {
    lines.push(`🎯 OKRs (${data.okrs.activeQuarter || '—'}): score global ${data.okrs.globalScore.toFixed(2)}`);
    for (const obj of data.okrs.objectives) {
      lines.push(`   • ${obj.title}: ${obj.score.toFixed(2)}`);
    }
    lines.push('');
  }

  // Highlights
  if (data.highlights.length) {
    lines.push('💡 HIGHLIGHTS');
    for (const h of data.highlights) {
      lines.push(`• ${h.text}`);
    }
    lines.push('');
  }

  lines.push(SEP);
  lines.push(`Generado: ${data.meta.generatedAt}`);

  const text = lines.join('\n');
  navigator.clipboard.writeText(text)
    .then(() => showToast('Informe copiado al clipboard'))
    .catch(() => showToast('No se pudo copiar al clipboard'));
}

// ─── printReport ─────────────────────────────

export function printReport() {
  document.body.classList.add('printing-report');
  window.print();
  setTimeout(() => document.body.classList.remove('printing-report'), 1000);
}

// ─── initWeeklyReport ────────────────────────

export function initWeeklyReport() {
  window.renderWeeklyReport = renderWeeklyReport;
  window.copyReportToClipboard = copyReportToClipboard;
  window.printReport = printReport;
}
