/* ═══════════════════════════════════════════════
   WEEKLY REPORT — Auto-generated weekly summary
   Reads all localStorage sources and renders a
   complete exportable report (clipboard + print).
═══════════════════════════════════════════════ */

import { K, FISCAL_QUARTERS, MESES, DIAS } from '../core/constants.js';
import { load, esc, showToast, num } from '../core/utils.js';

// ─── Thresholds ───────────────────────────────
const WOW_POSITIVE_THRESHOLD  = 0;
const WOW_WARNING_THRESHOLD   = -5;
const OKR_GOOD_THRESHOLD      = 0.7;
const OKR_MINIMUM_THRESHOLD   = 0.3;
const KPI_GREEN_THRESHOLD     = 90;
const KPI_YELLOW_THRESHOLD    = 70;
const BRIEFING_STREAK_MIN     = 5;

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

// ─── Shared helpers ───────────────────────────

function okrScoreColor(score) {
  return score >= OKR_GOOD_THRESHOLD ? 'var(--success,#34c759)' :
         score >= OKR_MINIMUM_THRESHOLD ? 'var(--warning,#ff9f0a)' : 'var(--danger,#ff3b30)';
}

function kpiPctClass(pct) {
  if (pct === null) return '';
  return pct >= KPI_GREEN_THRESHOLD ? 'wr-kpi-green' :
         pct >= KPI_YELLOW_THRESHOLD ? 'wr-kpi-yellow' : 'wr-kpi-red';
}

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
      if (kpi.wow > WOW_POSITIVE_THRESHOLD) {
        insights.push({ type: 'positive', text: `✅ ${kpi.label} mejoró +${kpi.wow.toFixed(1)}% esta semana` });
      } else if (kpi.wow < WOW_WARNING_THRESHOLD) {
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
    if (data.okrs.globalScore >= OKR_GOOD_THRESHOLD) {
      insights.push({ type: 'positive', text: `🎯 OKRs en buen estado: score global ${data.okrs.globalScore.toFixed(2)}` });
    } else if (data.okrs.globalScore < OKR_MINIMUM_THRESHOLD) {
      insights.push({ type: 'warning', text: `⚠️ OKRs por debajo del mínimo: score ${data.okrs.globalScore.toFixed(2)} — revisar prioridades` });
    } else {
      insights.push({ type: 'info', text: `📊 OKRs en progreso: score global ${data.okrs.globalScore.toFixed(2)}` });
    }
  }

  // 9: Briefing streak
  if (data.briefingStreak >= BRIEFING_STREAK_MIN) {
    insights.push({ type: 'positive', text: `🔥 ${data.briefingStreak} días de racha con briefing diario` });
  }

  // 10: Focus metric
  if (data.focusMetric && data.focusMetric.metric && data.focusMetric.metric !== '—') {
    insights.push({ type: 'info', text: `🔍 Métrica foco activa: ${data.focusMetric.metric}` });
  }

  return insights;
}

// ─── renderWeeklyReport ───────────────────────
// Business recap for Market Leader — 5-zone layout

export function renderWeeklyReport() {
  const container = document.getElementById('weekly-report-content');
  if (!container) return;

  const kpisRaw = load(K.kpis, {});
  const kpiHistory = load(K.kpiHistory, []);
  const now = new Date();
  const mon = getMondayOfWeek(now);
  const sun = getSundayOfWeek(now);
  const MESES_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const monLabel = `${mon.getDate()} ${MESES_SHORT[mon.getMonth()]}`;
  const sunLabel = `${sun.getDate()} ${MESES_SHORT[sun.getMonth()]} ${sun.getFullYear()}`;
  const weekLabel = `${monLabel} – ${sunLabel}`;

  // Helper: parse numeric value from a KPI field
  function pn(v) {
    if (v === undefined || v === null || v === '') return null;
    const s = String(v).replace(/[^0-9.,\-]/g, '').replace(',', '.');
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  }

  // Helper: format number for display (strip trailing zeros)
  function fmt(v, suffix='') {
    if (v === null || v === undefined || v === '') return '—';
    return String(v) + suffix;
  }

  // Helper: compute % vs objective
  function pct(val, obj) {
    const v = pn(val), o = pn(obj);
    if (v === null || o === null || o === 0) return null;
    return Math.round((v / o) * 100);
  }

  // Helper: build WoW badge HTML
  function wowBadge(val, wow) {
    const v = pn(val), w = pn(wow);
    if (v === null || w === null || w === 0) return '<span style="color:var(--text-secondary)">—</span>';
    const diff = v - w;
    const pctDiff = Math.round((diff / Math.abs(w)) * 100);
    if (diff > 0) return `<span style="color:var(--success,#34c759)">▲ +${pctDiff}%</span>`;
    if (diff < 0) return `<span style="color:var(--danger,#ff3b30)">▼ ${pctDiff}%</span>`;
    return '<span style="color:var(--text-secondary)">— 0%</span>';
  }

  // Helper: build YoY badge HTML
  function yoyBadge(val, yoy) {
    const v = pn(val), y = pn(yoy);
    if (v === null || y === null || y === 0) return '<span style="color:var(--text-secondary)">—</span>';
    const diff = v - y;
    const pctDiff = Math.round((diff / Math.abs(y)) * 100);
    if (diff > 0) return `<span style="color:var(--success,#34c759)">▲ +${pctDiff}%</span>`;
    if (diff < 0) return `<span style="color:var(--danger,#ff3b30)">▼ ${pctDiff}%</span>`;
    return '<span style="color:var(--text-secondary)">— 0%</span>';
  }

  // Helper: % badge
  function pctBadge(p) {
    if (p === null) return '<span style="color:var(--text-secondary)">—</span>';
    const color = p >= 100 ? 'var(--success,#34c759)' : p >= 85 ? 'var(--warning,#ff9f0a)' : 'var(--danger,#ff3b30)';
    return `<span style="color:${color};font-weight:700">${p}%</span>`;
  }

  // Helper: KPI table row
  function row(label, valField, objField, wowField, yoyField) {
    const v = kpisRaw[valField] || '';
    const o = kpisRaw[objField] || '';
    const w = kpisRaw[wowField] || '';
    const y = kpisRaw[yoyField] || '';
    const p = pct(v, o);
    const hasWow = wowField && w;
    const hasYoy = yoyField && y;
    return `<tr>
      <td style="padding:7px 10px;font-size:13px">${label}</td>
      <td style="padding:7px 10px;font-size:13px;font-weight:600;text-align:right">${fmt(v)}</td>
      <td style="padding:7px 10px;font-size:12px;color:var(--text-secondary);text-align:right">${fmt(o)}</td>
      <td style="padding:7px 10px;text-align:right">${pctBadge(p)}</td>
      <td style="padding:7px 10px;text-align:right">${hasWow ? wowBadge(v, w) : '<span style="color:var(--text-secondary)">—</span>'}</td>
      <td style="padding:7px 10px;text-align:right">${hasYoy ? yoyBadge(v, y) : '<span style="color:var(--text-secondary)">—</span>'}</td>
    </tr>`;
  }

  // KPI table
  function table(cols, rows) {
    return `<table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="border-bottom:2px solid var(--border)">
          ${cols.map(c=>`<th style="padding:6px 10px;font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;text-align:${c.align||'left'}">${c.label}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.join('')}
      </tbody>
    </table>`;
  }

  const COLS = [
    {label:'Métrica',   align:'left'},
    {label:'Actual',    align:'right'},
    {label:'Objetivo',  align:'right'},
    {label:'%',         align:'right'},
    {label:'WoW',       align:'right'},
    {label:'YoY',       align:'right'},
  ];

  const SEP = `<div style="border-top:2px solid var(--border);margin:20px 0"></div>`;

  // Context / notes
  const notes = kpisRaw.notes || '';
  const notesHtml = notes
    ? `<div style="background:var(--surface2);border-radius:var(--radius);padding:14px;font-size:14px;line-height:1.6;white-space:pre-wrap">${notes.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`
    : `<div style="font-size:13px;color:var(--text-secondary);font-style:italic">Sin contexto añadido esta semana. Añade notas en la pestaña KPIs.</div>`;

  // Executive summary
  const allKpiFields = [
    { val:'ventas', obj:'objVentas' },
    { val:'ventasBusiness', obj:'objVentasBusiness' },
    { val:'ventasApu', obj:'objVentasApu' },
    { val:'ventasSfs', obj:'objVentasSfs' },
    { val:'conv', obj:'objConv' },
    { val:'trafico', obj:'objTrafico' },
    { val:'dta', obj:'objDta' },
    { val:'iphoneTat', obj:'objIphoneTat' },
    { val:'npsSupport', obj:'objNpsSupport' },
    { val:'npsApu', obj:'objNpsApu' },
    { val:'timely', obj:'objTimely' },
    { val:'cpUsage', obj:'objCpUsage' },
    { val:'gbConv', obj:'objGbConv' },
    { val:'introsSessions', obj:'objIntrosSessions' },
    { val:'nps', obj:'objNps' },
    { val:'npsShop', obj:'objNpsShop' },
    { val:'npsTaa', obj:'objNpsTaa' },
  ];

  const kpiLabels = {
    ventas:'Ventas Totales', ventasBusiness:'Ventas Business', ventasApu:'Ventas APU', ventasSfs:'Ventas SFS',
    conv:'Conversión', trafico:'Tráfico', dta:'DTA Horas', iphoneTat:'iPhone TAT',
    npsSupport:'NPS Support', npsApu:'NPS APU', timely:'Timely', cpUsage:'C&P Usage',
    gbConv:'GB Conv.', introsSessions:'Intros/Sessions', nps:'NPS Tienda', npsShop:'NPS Shopping', npsTaa:'NPS T@A',
  };

  let aboveObj = 0, belowObj = 0;
  let bestKpi = null, bestPct = -Infinity;
  let worstKpi = null, worstPct = Infinity;
  let wowUp = 0, wowDown = 0;

  for (const f of allKpiFields) {
    const v = kpisRaw[f.val], o = kpisRaw[f.obj];
    const w = kpisRaw['wow' + f.val.charAt(0).toUpperCase() + f.val.slice(1)];
    const p = pct(v, o);
    if (p !== null) {
      if (p >= 100) aboveObj++; else belowObj++;
      if (p > bestPct) { bestPct = p; bestKpi = kpiLabels[f.val]; }
      if (p < worstPct) { worstPct = p; worstKpi = kpiLabels[f.val]; }
    }
    const vn = pn(v), wn = pn(w);
    if (vn !== null && wn !== null && wn !== 0) {
      if (vn > wn) wowUp++; else if (vn < wn) wowDown++;
    }
  }

  const totalTracked = aboveObj + belowObj;
  const execSummary = `
    <ul style="margin:0;padding-left:18px;line-height:1.9;font-size:13px">
      <li><strong>${aboveObj} de ${totalTracked}</strong> KPIs por encima del objetivo</li>
      ${bestKpi ? `<li>KPI más fuerte: <strong>${bestKpi}</strong> (${bestPct}% del objetivo)</li>` : ''}
      ${worstKpi && worstKpi !== bestKpi ? `<li>KPI que necesita atención: <strong>${worstKpi}</strong> (${worstPct}% del objetivo)</li>` : ''}
      <li>Tendencia WoW: <strong style="color:var(--success,#34c759)">${wowUp} mejorando</strong>, <strong style="color:var(--danger,#ff3b30)">${wowDown} empeorando</strong></li>
    </ul>`;

  const sectionTitle = (icon, title) =>
    `<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <span style="font-size:18px">${icon}</span>
      <span style="font-size:16px;font-weight:700">${title}</span>
    </div>`;

  container.innerHTML = `<div class="wr-report" style="max-width:900px">

    <!-- Header -->
    <div style="border-bottom:3px solid var(--accent);padding-bottom:16px;margin-bottom:20px">
      <div style="font-size:22px;font-weight:800;letter-spacing:-0.5px">📋 WEEKLY RECAP — APPLE PASSEIG DE GRÀCIA</div>
      <div style="font-size:14px;color:var(--text-secondary);margin-top:4px">Semana del ${weekLabel} · Diego Rivero, Store Leader</div>
    </div>

    <!-- Contexto -->
    <div style="margin-bottom:24px">
      ${sectionTitle('📝','Contexto de la semana')}
      ${notesHtml}
    </div>

    ${SEP}

    <!-- Ventas Globales -->
    <div style="margin-bottom:24px">
      ${sectionTitle('💰','Ventas Globales')}
      ${table(COLS, [
        row('Ventas Totales',   'ventas',        'objVentas',        'wowVentas',        'yoyVentas'),
        row('Ventas Business',  'ventasBusiness','objVentasBusiness','wowVentasBusiness','yoyVentasBusiness'),
        row('Ventas APU',       'ventasApu',     'objVentasApu',     'wowVentasApu',     'yoyVentasApu'),
        row('Ventas SFS',       'ventasSfs',     'objVentasSfs',     'wowVentasSfs',     'yoyVentasSfs'),
      ])}
    </div>

    ${SEP}

    <!-- Product Zone -->
    <div style="margin-bottom:24px">
      ${sectionTitle('📱','Product Zone')}
      ${table(COLS, [
        row('Conversión',   'conv',    'objConv',    'wowConv',    'yoyConv'),
        row('Tráfico',      'trafico', 'objTrafico', 'wowTrafico', 'yoyTrafico'),
        row('UPT',          'upt',     'objUpt',     'wowUpt',     null),
        row('Intros/1K',    'intros1k','objIntros1k','wowIntros1k',null),
      ])}
    </div>

    ${SEP}

    <!-- Genius Bar -->
    <div style="margin-bottom:24px">
      ${sectionTitle('🔧','Genius Bar')}
      ${table(COLS, [
        row('DTA Horas',    'dta',       'objDta',       'wowDta',       null),
        row('iPhone TAT',   'iphoneTat', 'objIphoneTat', 'wowIphoneTat', null),
        row('NPS Support',  'npsSupport','objNpsSupport','wowNpsSupport','yoyNpsSupport'),
        row('NPS APU',      'npsApu',    'objNpsApu',    'wowNpsApu',    'yoyNpsApu'),
      ])}
    </div>

    ${SEP}

    <!-- Operaciones -->
    <div style="margin-bottom:24px">
      ${sectionTitle('🗂️','Operaciones')}
      ${table(COLS, [
        row('Timely',            'timely',         'objTimely',         'wowTimely',         null),
        row('C&P Usage',         'cpUsage',        'objCpUsage',        'wowCpUsage',        null),
        row('GB Conv.',          'gbConv',         'objGbConv',         'wowGbConv',         null),
        row('Intros/Sessions',   'introsSessions', 'objIntrosSessions', 'wowIntrosSessions', null),
      ])}
    </div>

    ${SEP}

    <!-- Experiencia de Cliente -->
    <div style="margin-bottom:24px">
      ${sectionTitle('🌟','Experiencia de Cliente')}
      ${table(COLS, [
        row('NPS Tienda',   'nps',     'objNps',     'wowNps',     'yoyNps'),
        row('NPS Shopping', 'npsShop', 'objNpsShop', 'wowNpsShop', 'yoyNpsShop'),
        row('NPS T@A',      'npsTaa',  'objNpsTaa',  'wowNpsTaa',  'yoyNpsTaa'),
      ])}
    </div>

    ${SEP}

    <!-- Resumen ejecutivo -->
    <div style="margin-bottom:8px">
      ${sectionTitle('📊','Resumen Ejecutivo')}
      ${execSummary}
    </div>

    <div style="font-size:11px;color:var(--text-secondary);margin-top:20px;text-align:right">
      Generado: ${now.toLocaleString('es-ES')}
    </div>
  </div>`;
}

// ─── emailWeeklyReport ────────────────────────

export function emailWeeklyReport() {
  const kpisRaw = load(K.kpis, {});
  const now = new Date();
  const mon = getMondayOfWeek(now);
  const sun = getSundayOfWeek(now);
  const MESES_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const monLabel = `${mon.getDate()} ${MESES_SHORT[mon.getMonth()]}`;
  const sunLabel = `${sun.getDate()} ${MESES_SHORT[sun.getMonth()]} ${sun.getFullYear()}`;
  const weekLabel = `${monLabel} – ${sunLabel}`;

  function pn(v) {
    if (v === undefined || v === null || v === '') return null;
    const s = String(v).replace(/[^0-9.,\-]/g, '').replace(',', '.');
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  }
  function fmt(v) { return (v === undefined || v === null || v === '') ? '—' : String(v); }
  function pct(val, obj) {
    const v = pn(val), o = pn(obj);
    if (v === null || o === null || o === 0) return null;
    return Math.round((v / o) * 100);
  }
  function wowStr(val, wow) {
    const v = pn(val), w = pn(wow);
    if (v === null || w === null || w === 0) return '—';
    const diff = v - w;
    const p = Math.round((diff / Math.abs(w)) * 100);
    return diff > 0 ? `▲ +${p}%` : diff < 0 ? `▼ ${p}%` : '— 0%';
  }
  function yoyStr(val, yoy) {
    const v = pn(val), y = pn(yoy);
    if (v === null || y === null || y === 0) return '—';
    const diff = v - y;
    const p = Math.round((diff / Math.abs(y)) * 100);
    return diff > 0 ? `▲ +${p}%` : diff < 0 ? `▼ ${p}%` : '— 0%';
  }
  function pctStr(val, obj) {
    const p = pct(val, obj);
    return p !== null ? `${p}%` : '—';
  }

  const COL_W = [22, 12, 12, 6, 10, 10];
  function tableRow(cols) {
    return cols.map((c, i) => String(c).padEnd(COL_W[i] || 12)).join('  ');
  }
  function tableHeader() {
    return tableRow(['Métrica','Actual','Objetivo','%','WoW','YoY']);
  }
  function tableSep() {
    return COL_W.map(w => '─'.repeat(w)).join('  ');
  }
  function kpiRow(label, valF, objF, wowF, yoyF) {
    return tableRow([
      label,
      fmt(kpisRaw[valF]),
      fmt(kpisRaw[objF]),
      pctStr(kpisRaw[valF], kpisRaw[objF]),
      wowF ? wowStr(kpisRaw[valF], kpisRaw[wowF]) : '—',
      yoyF ? yoyStr(kpisRaw[valF], kpisRaw[yoyF]) : '—',
    ]);
  }

  const SEP = '━'.repeat(55);
  const lines = [];

  lines.push(`📋 WEEKLY RECAP — APPLE PASSEIG DE GRÀCIA`);
  lines.push(`Semana del ${weekLabel} · Diego Rivero, Store Leader`);
  lines.push(SEP);
  lines.push('');

  const notes = kpisRaw.notes || '';
  lines.push('📝 CONTEXTO DE LA SEMANA');
  lines.push(notes || '(Sin contexto añadido)');
  lines.push('');
  lines.push(SEP);
  lines.push('');

  lines.push('💰 VENTAS GLOBALES');
  lines.push(tableHeader());
  lines.push(tableSep());
  lines.push(kpiRow('Ventas Totales',   'ventas',        'objVentas',        'wowVentas',        'yoyVentas'));
  lines.push(kpiRow('Ventas Business',  'ventasBusiness','objVentasBusiness','wowVentasBusiness','yoyVentasBusiness'));
  lines.push(kpiRow('Ventas APU',       'ventasApu',     'objVentasApu',     'wowVentasApu',     'yoyVentasApu'));
  lines.push(kpiRow('Ventas SFS',       'ventasSfs',     'objVentasSfs',     'wowVentasSfs',     'yoyVentasSfs'));
  lines.push('');

  lines.push('📱 PRODUCT ZONE');
  lines.push(tableHeader());
  lines.push(tableSep());
  lines.push(kpiRow('Conversión',   'conv',    'objConv',    'wowConv',    'yoyConv'));
  lines.push(kpiRow('Tráfico',      'trafico', 'objTrafico', 'wowTrafico', 'yoyTrafico'));
  lines.push(kpiRow('UPT',          'upt',     'objUpt',     'wowUpt',     null));
  lines.push(kpiRow('Intros/1K',    'intros1k','objIntros1k','wowIntros1k',null));
  lines.push('');

  lines.push('🔧 GENIUS BAR');
  lines.push(tableHeader());
  lines.push(tableSep());
  lines.push(kpiRow('DTA Horas',    'dta',       'objDta',       'wowDta',       null));
  lines.push(kpiRow('iPhone TAT',   'iphoneTat', 'objIphoneTat', 'wowIphoneTat', null));
  lines.push(kpiRow('NPS Support',  'npsSupport','objNpsSupport','wowNpsSupport','yoyNpsSupport'));
  lines.push(kpiRow('NPS APU',      'npsApu',    'objNpsApu',    'wowNpsApu',    'yoyNpsApu'));
  lines.push('');

  lines.push('🗂️ OPERACIONES');
  lines.push(tableHeader());
  lines.push(tableSep());
  lines.push(kpiRow('Timely',          'timely',        'objTimely',        'wowTimely',        null));
  lines.push(kpiRow('C&P Usage',       'cpUsage',       'objCpUsage',       'wowCpUsage',       null));
  lines.push(kpiRow('GB Conv.',        'gbConv',        'objGbConv',        'wowGbConv',        null));
  lines.push(kpiRow('Intros/Sessions', 'introsSessions','objIntrosSessions','wowIntrosSessions',null));
  lines.push('');

  lines.push('🌟 EXPERIENCIA DE CLIENTE');
  lines.push(tableHeader());
  lines.push(tableSep());
  lines.push(kpiRow('NPS Tienda',   'nps',     'objNps',     'wowNps',     'yoyNps'));
  lines.push(kpiRow('NPS Shopping', 'npsShop', 'objNpsShop', 'wowNpsShop', 'yoyNpsShop'));
  lines.push(kpiRow('NPS T@A',      'npsTaa',  'objNpsTaa',  'wowNpsTaa',  'yoyNpsTaa'));
  lines.push('');
  lines.push(SEP);
  lines.push('');

  // Executive summary
  const allKpiPairs = [
    ['ventas','objVentas'],['ventasBusiness','objVentasBusiness'],['ventasApu','objVentasApu'],['ventasSfs','objVentasSfs'],
    ['conv','objConv'],['trafico','objTrafico'],['dta','objDta'],['iphoneTat','objIphoneTat'],
    ['npsSupport','objNpsSupport'],['npsApu','objNpsApu'],['timely','objTimely'],['cpUsage','objCpUsage'],
    ['gbConv','objGbConv'],['introsSessions','objIntrosSessions'],['nps','objNps'],['npsShop','objNpsShop'],['npsTaa','objNpsTaa'],
  ];
  const kpiLabels2 = {
    ventas:'Ventas Totales',ventasBusiness:'Ventas Business',ventasApu:'Ventas APU',ventasSfs:'Ventas SFS',
    conv:'Conversión',trafico:'Tráfico',dta:'DTA Horas',iphoneTat:'iPhone TAT',
    npsSupport:'NPS Support',npsApu:'NPS APU',timely:'Timely',cpUsage:'C&P Usage',
    gbConv:'GB Conv.',introsSessions:'Intros/Sessions',nps:'NPS Tienda',npsShop:'NPS Shopping',npsTaa:'NPS T@A',
  };
  let aboveObj = 0, belowObj = 0, bestKpi = null, bestPct = -Infinity, worstKpi = null, worstPct = Infinity;
  let wowUp = 0, wowDown = 0;
  for (const [valF, objF] of allKpiPairs) {
    const p = pct(kpisRaw[valF], kpisRaw[objF]);
    if (p !== null) {
      if (p >= 100) aboveObj++; else belowObj++;
      if (p > bestPct) { bestPct = p; bestKpi = kpiLabels2[valF]; }
      if (p < worstPct) { worstPct = p; worstKpi = kpiLabels2[valF]; }
    }
    const wowKey = 'wow' + valF.charAt(0).toUpperCase() + valF.slice(1);
    const v = pn(kpisRaw[valF]), w = pn(kpisRaw[wowKey]);
    if (v !== null && w !== null && w !== 0) {
      if (v > w) wowUp++; else if (v < w) wowDown++;
    }
  }
  lines.push('📊 RESUMEN EJECUTIVO');
  lines.push(`• ${aboveObj} de ${aboveObj + belowObj} KPIs por encima del objetivo`);
  if (bestKpi) lines.push(`• KPI más fuerte: ${bestKpi} (${bestPct}% del objetivo)`);
  if (worstKpi && worstKpi !== bestKpi) lines.push(`• KPI que necesita atención: ${worstKpi} (${worstPct}% del objetivo)`);
  lines.push(`• Tendencia WoW: ${wowUp} mejorando, ${wowDown} empeorando`);
  lines.push('');
  lines.push(SEP);
  lines.push(`Generado: ${now.toLocaleString('es-ES')}`);

  const body = lines.join('\n');
  const subject = `Weekly Recap — Apple Passeig de Gràcia — Semana del ${weekLabel}`;
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  const mailtoUrl = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;

  // mailto: URLs have a ~2000-char limit in many clients; warn user if exceeded
  if (mailtoUrl.length > 2000) {
    showToast('⚠️ El informe es muy largo para el enlace de correo. Cópialo manualmente desde el Weekly Report.');
    navigator.clipboard.writeText(body).catch(() => {});
    return;
  }

  try {
    window.location.href = mailtoUrl;
  } catch(e) {
    showToast('No se pudo abrir el cliente de correo');
  }
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
  window.emailWeeklyReport = emailWeeklyReport;
  window.printReport = printReport;
}
