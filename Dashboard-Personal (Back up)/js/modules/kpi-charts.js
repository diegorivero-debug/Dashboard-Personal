/* ═══════════════════════════════════════════════
   KPI CHARTS — Chart.js trend, comparison and
   quarter-progress visualisations.
   Requires Chart.js ≥ 4 loaded via CDN before
   initKPICharts() is called.
═══════════════════════════════════════════════ */

import { K, KPI_CHART_METRICS, FISCAL_QUARTERS } from '../core/constants.js';
import { load } from '../core/utils.js';

// ─── Internal state ───────────────────────────
const STORAGE_KEY_METRICS = 'apg_trend_chart_metrics';
const STORAGE_KEY_VIEW    = 'apg_trend_chart_view';
const DEFAULT_METRICS     = ['ventas', 'nps', 'conv', 'dta'];
const MAX_ACTIVE_METRICS  = 4;

let _trendChart      = null;
let _compChart       = null;
let _quarterChart    = null;

// ─── Helpers ─────────────────────────────────

function loadHistory() {
  return load(K.kpiHistory, []);
}

/** Format a "yyyy-mm-dd" string as "dd/mm" */
function fmtShort(dateStr) {
  if (!dateStr) return '';
  const [, mm, dd] = dateStr.split('-');
  return `${dd}/${mm}`;
}

/** Resolve a CSS custom-property colour string to a real hex/rgb value.
 *  Chart.js needs concrete colours for canvas rendering. */
function resolveColor(colorStr) {
  if (!colorStr || !colorStr.startsWith('var(')) return colorStr;
  const name = colorStr.replace(/^var\(/, '').replace(/\)$/, '').trim();
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';
}

/** Semi-transparent version of a colour for fill areas / bar backgrounds. */
function alpha(color, a) {
  const c = resolveColor(color);
  // Convert hex to rgba when possible
  if (c.startsWith('#')) {
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }
  // For rgb() / rgba() strings adjust or fallback
  if (c.startsWith('rgb')) {
    return c.replace(/rgba?\(([^)]+)\)/, (_, inner) => {
      const parts = inner.split(',').slice(0, 3).join(',');
      return `rgba(${parts},${a})`;
    });
  }
  return c;
}

/** Destroy a Chart instance safely. */
function destroyChart(instance) {
  if (instance) { try { instance.destroy(); } catch (_) {} }
}

/** Filter history to the requested view window. */
function sliceHistory(history, view) {
  if (view === '4w')      return history.slice(-28);
  if (view === 'quarter') return history.slice(-91);
  return history; // 'all'
}

// ─── renderTrendCharts ────────────────────────

export function renderTrendCharts(containerId) {
  if (!window.Chart) return;

  const canvas = document.getElementById('kpi-trend-canvas');
  if (!canvas) return;

  const view    = load(STORAGE_KEY_VIEW, '4w');
  const history = sliceHistory(loadHistory(), view);

  destroyChart(_trendChart);
  _trendChart = null;

  if (!history.length) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const selectedKeys = _getSelectedMetrics();
  const metrics      = KPI_CHART_METRICS.filter(m => selectedKeys.includes(m.key));
  const labels       = history.map(d => d._label || fmtShort(d.date));

  // Build datasets — one per metric + dashed objective lines where applicable
  const datasets = [];
  metrics.forEach(m => {
    const color = resolveColor(m.color);
    datasets.push({
      label:           m.label,
      data:            history.map(d => +m.val(d).toFixed(1)),
      borderColor:     color,
      backgroundColor: alpha(m.color, 0.08),
      borderWidth:     2,
      pointRadius:     history.length > 20 ? 2 : 4,
      pointHoverRadius: 6,
      tension:         0.3,
      fill:            false,
      _metricKey:      m.key,
    });
  });

  _trendChart = new window.Chart(canvas, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend:  { position: 'bottom', labels: { boxWidth: 12, padding: 12 } },
        tooltip: { mode: 'index', intersect: false },
      },
      scales: {
        x: {
          ticks: { maxTicksLimit: 8, maxRotation: 0 },
          grid:  { display: false },
        },
        y: {
          beginAtZero: true,
          max:         110,
          ticks:       { callback: v => v + '%' },
          grid:        { color: 'rgba(128,128,128,0.15)' },
        },
      },
    },
  });
}

// ─── renderComparisonChart ────────────────────

export function renderComparisonChart(containerId) {
  if (!window.Chart) return;

  const canvas = document.getElementById('kpi-comparison-canvas');
  if (!canvas) return;

  destroyChart(_compChart);
  _compChart = null;

  const history = loadHistory();
  if (!history.length) return;

  // Determine week boundaries (ISO weeks, Mon–Sun)
  const today = new Date();
  const dow   = today.getDay(); // 0=Sun
  const msDay = 86400000;

  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  thisWeekStart.setHours(0, 0, 0, 0);

  const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * msDay);
  const yoyWeekStart  = new Date(thisWeekStart);
  yoyWeekStart.setFullYear(yoyWeekStart.getFullYear() - 1);
  const yoyWeekEnd    = new Date(yoyWeekStart.getTime() + 7 * msDay);

  const thisStart = thisWeekStart.toISOString().slice(0, 10);
  const lastStart = lastWeekStart.toISOString().slice(0, 10);
  const yoyStart  = yoyWeekStart.toISOString().slice(0, 10);
  const yoyEnd    = yoyWeekEnd.toISOString().slice(0, 10);

  const thisWeek = history.filter(d => d.date >= thisStart);
  const lastWeek = history.filter(d => d.date >= lastStart && d.date < thisStart);
  const yoyWeek  = history.filter(d => d.date >= yoyStart  && d.date < yoyEnd);

  const compMetrics = KPI_CHART_METRICS.filter(m => ['ventas', 'nps', 'conv'].includes(m.key));

  const mean = (arr, m) => {
    if (!arr.length) return null;
    return +(arr.reduce((s, d) => s + m.val(d), 0) / arr.length).toFixed(1);
  };

  const labels   = compMetrics.map(m => m.label);
  const datasets = [
    {
      label:           'Semana pasada',
      data:            compMetrics.map(m => mean(lastWeek, m)),
      backgroundColor: 'rgba(142,142,147,0.7)',
      borderRadius:    4,
    },
    {
      label:           'Esta semana',
      data:            compMetrics.map(m => mean(thisWeek, m)),
      backgroundColor: compMetrics.map(m => alpha(m.color, 0.8)),
      borderRadius:    4,
    },
    {
      label:           'YoY (mismo periodo año anterior)',
      data:            compMetrics.map(m => mean(yoyWeek, m)),
      backgroundColor: 'rgba(90,200,250,0.6)',
      borderRadius:    4,
    },
  ];

  _compChart = new window.Chart(canvas, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend:  { position: 'bottom', labels: { boxWidth: 12, padding: 10 } },
        tooltip: { mode: 'index', intersect: false },
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          max:         110,
          ticks:       { callback: v => v + '%' },
          grid:        { color: 'rgba(128,128,128,0.15)' },
        },
      },
    },
  });
}

// ─── renderQuarterProgress ────────────────────

export function renderQuarterProgress(containerId) {
  if (!window.Chart) return;

  const canvas = document.getElementById('kpi-quarter-canvas');
  if (!canvas) return;

  destroyChart(_quarterChart);
  _quarterChart = null;

  // Determine current quarter and week number within it
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sorted = [...FISCAL_QUARTERS].sort((a, b) => a.startDate - b.startDate);
  let currentQ = null;
  let nextQ    = null;

  for (let i = 0; i < sorted.length; i++) {
    const q    = sorted[i];
    const next = sorted[i + 1];
    if (today >= q.startDate && (!next || today < next.startDate)) {
      currentQ = q;
      nextQ    = next;
      break;
    }
  }

  // Fallback: use the most recent quarter
  if (!currentQ && sorted.length) currentQ = sorted[sorted.length - 1];

  const msWeek        = 7 * 86400000;
  const quarterWeeks  = nextQ
    ? Math.round((nextQ.startDate - currentQ.startDate) / msWeek)
    : 13; // default quarter length
  const weeksPassed   = Math.max(0, Math.floor((today - currentQ.startDate) / msWeek));
  const currentWeek   = Math.min(weeksPassed + 1, quarterWeeks);
  const pct           = Math.round((weeksPassed / quarterWeeks) * 100);

  const accentColor = resolveColor('var(--accent)');

  // Custom center-text plugin (scoped to this chart instance)
  const centerTextPlugin = {
    id: 'centerText',
    afterDraw(chart) {
      const { ctx, chartArea: { width, height, left, top } } = chart;
      const cx = left + width / 2;
      const cy = top  + height / 2;
      ctx.save();
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = resolveColor('var(--text-primary)') || '#222';
      ctx.font         = `bold ${Math.round(width * 0.13)}px system-ui, sans-serif`;
      ctx.fillText(`${pct}%`, cx, cy - height * 0.07);
      ctx.font      = `${Math.round(width * 0.07)}px system-ui, sans-serif`;
      ctx.fillStyle = resolveColor('var(--text-secondary)') || '#888';
      ctx.fillText(`Sem. ${currentWeek} de ${quarterWeeks}`, cx, cy + height * 0.12);
      ctx.restore();
    },
  };

  _quarterChart = new window.Chart(canvas, {
    type:    'doughnut',
    data:    {
      datasets: [{
        data:            [weeksPassed, Math.max(0, quarterWeeks - weeksPassed)],
        backgroundColor: [accentColor, 'rgba(142,142,147,0.25)'],
        borderWidth:     0,
        hoverOffset:     4,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      cutout:              '72%',
      plugins: {
        legend:  { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ctx.dataIndex === 0
              ? ` ${currentWeek - 1} semana${currentWeek - 1 !== 1 ? 's' : ''} completada${currentWeek - 1 !== 1 ? 's' : ''}`
              : ` ${quarterWeeks - weeksPassed} semana${quarterWeeks - weeksPassed !== 1 ? 's' : ''} restante${quarterWeeks - weeksPassed !== 1 ? 's' : ''}`,
          },
        },
      },
    },
    plugins: [centerTextPlugin],
  });
}

// ─── Metric selector (pills) ─────────────────

function _getSelectedMetrics() {
  const saved = load(STORAGE_KEY_METRICS, DEFAULT_METRICS);
  return Array.isArray(saved) && saved.length ? saved : DEFAULT_METRICS;
}

function _saveSelectedMetrics(keys) {
  try { localStorage.setItem(STORAGE_KEY_METRICS, JSON.stringify(keys)); } catch (_) {}
}

export function renderTrendMetricSelector() {
  const wrap = document.getElementById('kpi-trend-metrics-selector');
  if (!wrap) return;
  const selected = _getSelectedMetrics();
  wrap.innerHTML = KPI_CHART_METRICS.map(m => {
    const isActive = selected.includes(m.key);
    return `<button
      class="kpi-trend-metric-pill${isActive ? ' active' : ''}"
      data-metric="${m.key}"
      style="--metric-color:${m.color}"
      onclick="toggleTrendMetric('${m.key}',this)"
    >${m.label}</button>`;
  }).join('');
}

// ─── Global functions (used by onclick in HTML) ─

window.toggleTrendMetric = function(key, btn) {
  let selected = _getSelectedMetrics();
  if (selected.includes(key)) {
    if (selected.length <= 1) return; // keep at least 1
    selected = selected.filter(k => k !== key);
    if (btn) btn.classList.remove('active');
  } else {
    if (selected.length >= MAX_ACTIVE_METRICS) {
      // Deactivate the first selected one to make room
      const toRemove = selected.shift();
      const oldBtn = document.querySelector(`.kpi-trend-metric-pill[data-metric="${toRemove}"]`);
      if (oldBtn) oldBtn.classList.remove('active');
    }
    selected.push(key);
    if (btn) btn.classList.add('active');
  }
  _saveSelectedMetrics(selected);
  renderTrendCharts('kpi-trend-chart-container');
};

window.setTrendView = function(view, btn) {
  try { localStorage.setItem(STORAGE_KEY_VIEW, view); } catch (_) {}
  document.querySelectorAll('.kpi-trend-pill').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderTrendCharts('kpi-trend-chart-container');
};

// ─── initKPICharts ────────────────────────────

export function initKPICharts() {
  if (!window.Chart) {
    console.warn('kpi-charts: Chart.js not available. Skipping chart initialisation.');
    return;
  }
  renderTrendMetricSelector();
  renderTrendCharts('kpi-trend-chart-container');
  renderComparisonChart('kpi-comparison-chart-container');
  renderQuarterProgress('kpi-quarter-progress-container');
}
