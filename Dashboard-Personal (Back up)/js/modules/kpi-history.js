/* ═══════════════════════════════════════════════
   KPI HISTORY — extracted from dashboard.js
   KPI history SVG chart, view selection,
   metric selector, and streak alerts.
═══════════════════════════════════════════════ */

import { K, KPI_CHART_MAX_PCT, KPI_CHART_METRICS, DEFAULT_KPI_CHART_METRICS, DEFAULT_COMPARATIVA_METRICS, AC_ALERT_THRESHOLD } from '../core/constants.js';
import { load, save, esc, num, fmtDate, showToast } from '../core/utils.js';

const _g = id => document.getElementById(id)?.value || '';

export function getSelectedKPIMetrics() {
  const saved = load('apg_kpi_chart_metrics', DEFAULT_KPI_CHART_METRICS);
  return Array.isArray(saved) ? saved : DEFAULT_KPI_CHART_METRICS;
}

export function toggleKPIMetric(key, btn) {
  let selected = getSelectedKPIMetrics();
  if (selected.includes(key)) {
    if (selected.length <= 1) { showToast('Al menos una métrica debe estar seleccionada'); return; }
    selected = selected.filter(k => k !== key);
    if (btn) btn.classList.remove('active');
  } else {
    if (selected.length >= 5) { showToast('Máximo 5 métricas simultáneas'); return; }
    selected.push(key);
    if (btn) btn.classList.add('active');
  }
  save('apg_kpi_chart_metrics', selected);
  renderKPIHistory();
}

export function renderKPIChart() {
  const wrap = document.getElementById('kpi-chart-wrap');
  if(!wrap) return;
  const view = load('apg_kpi_history_view', '2w');
  let allHistory = load(K.kpiHistory, []);
  let data;
  if (view === '2w') {
    const today = new Date();
    const dow = today.getDay();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
    thisWeekStart.setHours(0, 0, 0, 0);
    const thisWeekStartStr = thisWeekStart.toISOString().slice(0, 10);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekStartStr = lastWeekStart.toISOString().slice(0, 10);
    const thisWeekEntries = allHistory.filter(d => d.date >= thisWeekStartStr);
    const lastWeekEntries = allHistory.filter(d => d.date >= lastWeekStartStr && d.date < thisWeekStartStr);
    /**
     * Calculates mean values across all history entries in a week and returns
     * a single synthetic data point labelled with `label` for chart rendering.
     */
    const aggregate = (entries, label) => {
      if (!entries.length) return null;
      const n = entries.length;
      return {
        _label: label,
        ventas: (entries.reduce((s,d)=>s+num(d.ventas),0)/n).toFixed(0),
        objVentas: (entries.reduce((s,d)=>s+num(d.objVentas),0)/n).toFixed(0),
        nps: (entries.reduce((s,d)=>s+num(d.nps),0)/n).toFixed(1),
        objNps: (entries.reduce((s,d)=>s+num(d.objNps),0)/n).toFixed(0),
        conv: (entries.reduce((s,d)=>s+num(d.conv),0)/n).toFixed(1),
        objConv: (entries.reduce((s,d)=>s+num(d.objConv),0)/n).toFixed(0),
        dta: (entries.reduce((s,d)=>s+num(d.dta),0)/n).toFixed(1),
        objDta: (entries.reduce((s,d)=>s+num(d.objDta),0)/n).toFixed(0),
        trafico: (entries.reduce((s,d)=>s+num(d.trafico),0)/n).toFixed(0),
        date: entries[0].date
      };
    };
    data = [aggregate(lastWeekEntries, 'S. Pasada'), aggregate(thisWeekEntries, 'S. Actual')].filter(Boolean);
  } else {
    let maxPts = view === '4w' ? 28 : 90;
    data = allHistory.slice(-maxPts);
  }
  if(!data.length) { wrap.innerHTML=''; return; }

  const selectedKeys = getSelectedKPIMetrics();
  const metrics = KPI_CHART_METRICS.filter(m => selectedKeys.includes(m.key));

  // Update legend
  const legendEl = document.getElementById('kpi-chart-legend');
  if (legendEl) {
    legendEl.innerHTML = metrics.map(m =>
      `<div class="kpi-chart-legend-item"><div class="kpi-chart-legend-dot" style="background:${m.color}"></div><span>${m.label}</span></div>`
    ).join('');
  }

  const W=800, H=220, PAD={top:24,right:16,bottom:36,left:36};
  const cW=W-PAD.left-PAD.right, cH=H-PAD.top-PAD.bottom;
  const n=data.length;

  const xC = i => PAD.left + (i+0.5)*cW/n;
  const yPct = pct => PAD.top + cH - Math.min(Math.max(pct,0),KPI_CHART_MAX_PCT)/100*cH;

  // Grid lines at 25/50/75/100%
  let grid='';
  [25,50,75,100].forEach(pct=>{
    const y=yPct(pct);
    grid+=`<line x1="${PAD.left}" y1="${y.toFixed(1)}" x2="${W-PAD.right}" y2="${y.toFixed(1)}" stroke="var(--border)" stroke-width="1" stroke-dasharray="3,3"/>`;
    grid+=`<text x="${(PAD.left-4).toFixed(1)}" y="${(y+3).toFixed(1)}" text-anchor="end" fill="var(--text-secondary)" font-size="9">${pct}%</text>`;
  });

  // Draw each selected metric as a line + dots
  let lines='';
  metrics.forEach(m => {
    const vals = data.map(d => m.val(d));
    const pts = vals.map((v,i)=>`${xC(i).toFixed(1)},${yPct(v).toFixed(1)}`).join(' ');
    if (n > 1) lines += `<polyline points="${pts}" fill="none" stroke="${m.color}" stroke-width="2" stroke-linejoin="round"/>`;
    lines += vals.map((v,i)=>`<circle cx="${xC(i).toFixed(1)}" cy="${yPct(v).toFixed(1)}" r="3" fill="${m.color}" stroke="var(--surface)" stroke-width="1.5"><title>${data[i]._label||fmtDate(data[i].date)}: ${m.label} ${v.toFixed(1)}</title></circle>`).join('');
  });

  // X-axis labels (max 8)
  const step=Math.max(1,Math.ceil(n/8));
  let xLabels='';
  data.forEach((d,i)=>{
    if(i%step===0||i===n-1)
      xLabels+=`<text x="${xC(i).toFixed(1)}" y="${H-6}" text-anchor="middle" fill="var(--text-secondary)" font-size="9">${d._label||fmtDate(d.date)}</text>`;
  });

  wrap.innerHTML=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">${grid}${lines}${xLabels}</svg>`;
}

export function setKPIHistoryView(view, btn) {
  save('apg_kpi_history_view', view);
  document.querySelectorAll('.kpi-history-pill').forEach(p=>p.classList.remove('active'));
  if(btn) btn.classList.add('active');
  renderKPIHistory();
}

export function renderKPIHistory() {
  renderKPIChart();
  const wrap = document.getElementById('kpi-history-table-wrap');
  const empty = document.getElementById('kpi-history-empty');
  if(!wrap) return;
  const history = load(K.kpiHistory, []).slice(-14).reverse();
  if(!history.length){ wrap.innerHTML=''; if(empty)empty.style.display='block'; return; }
  if(empty) empty.style.display='none';
  wrap.innerHTML=`<table class="kpi-history-table">
    <thead><tr><th>Fecha</th><th>Contexto</th><th>Ventas</th><th>NPS</th><th>Conversión</th><th>UPT</th></tr></thead>
    <tbody>${history.map((s,i)=>{
      const prev = history[i+1];
      const arrow = (cur,prv)=>{
        if(!prv) return '';
        const c=num(cur), p=num(prv);
        if(c>p) return `<span class="trend-up">▲</span>`;
        if(c<p) return `<span class="trend-down">▼</span>`;
        return '→';
      };
      return `<tr>
        <td>${fmtDate(s.date)}</td>
        <td style="font-size:11px;color:var(--text-secondary);max-width:140px;white-space:normal">${esc(s.context||'—')}</td>
        <td>${esc(s.ventas||'—')} ${prev?arrow(s.ventas,prev.ventas):''}</td>
        <td>${esc(s.nps||'—')} ${prev?arrow(s.nps,prev.nps):''}</td>
        <td>${esc(s.conv||'—')} ${prev?arrow(s.conv,prev.conv):''}</td>
        <td>${esc(s.upt||'—')} ${prev?arrow(s.upt,prev.upt):''}</td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;
}

export function renderKPIMetricSelector() {
  const wrap = document.getElementById('kpi-metric-selector');
  if (!wrap) return;
  const selected = getSelectedKPIMetrics();
  wrap.innerHTML = KPI_CHART_METRICS.map(m =>
    `<button class="kpi-metric-pill${selected.includes(m.key)?' active':''}" data-metric="${m.key}" onclick="toggleKPIMetric('${m.key}',this)" style="--mc:${m.color}">${m.label}</button>`
  ).join('');
}

export function toggleHistorico() {
  const body = document.getElementById('historico-body');
  const icon = document.getElementById('historico-toggle-icon');
  if(body.style.display==='none'){
    body.style.display='block'; if(icon)icon.textContent='▲';
    // Restore active view pill
    const view=load('apg_kpi_history_view','2w');
    document.querySelectorAll('.kpi-history-pill').forEach(p=>p.classList.remove('active'));
    const activePill=document.getElementById('pill-'+view);
    if(activePill) activePill.classList.add('active');
    // Render dynamic metric selector and restore active state
    renderKPIMetricSelector();
    renderKPIHistory();
  } else { body.style.display='none'; if(icon)icon.textContent='▼'; }
}

export function getKPITrend(field) {
  const history = load(K.kpiHistory, []);
  if(history.length<2) return null;
  const last = history[history.length-1];
  const prev = history[history.length-2];
  const cur=num(last[field]), pre=num(prev[field]);
  if(cur>pre) return { arrow:'▲', diff:+(cur-pre).toFixed(1), cls:'trend-up' };
  if(cur<pre) return { arrow:'▼', diff:+(pre-cur).toFixed(1), cls:'trend-down' };
  return null;
}

/* ═══════════════════════════════════════════════
   KPI VISUAL ALERTS (Feature 7)
═══════════════════════════════════════════════ */
export function checkKPIAlerts() {
  const ventas=num(_g('kpi-ventas'));
  const objVentas=num(_g('kpi-obj-ventas'));
  const nps=num(_g('kpi-nps'));
  const objNps=num(_g('kpi-obj-nps'));
  const ac=num(_g('kpi-ac'));
  const objAcEl=document.getElementById('kpi-obj-ac'); const objAc=num(objAcEl ? objAcEl.value : String(AC_ALERT_THRESHOLD));
  const conv=num(_g('kpi-conv'));
  const objConv=num(_g('kpi-obj-conv'));
  const upt=num(_g('kpi-upt'));
  const objUpt=num(_g('kpi-obj-upt'));
  const hour = new Date().getHours();

  document.querySelectorAll('.kpi-alert-badge').forEach(b=>b.remove());

  const ventasPct = objVentas>0 ? ventas/objVentas : 0;
  const ventasCard = document.getElementById('bar-ventas')?.closest('.card');
  if(ventasCard) {
    if(ventasPct<0.7 && hour>=15) {
      const badge=document.createElement('div');
      badge.className='kpi-alert-badge danger'; badge.textContent='⚠️ Atención';
      ventasCard.appendChild(badge);
    }
    const trend=getKPITrend('ventas');
    if(trend) {
      const trendEl=document.createElement('span');
      trendEl.className='kpi-trend '+trend.cls;
      trendEl.textContent=` ${trend.arrow}${trend.diff}`;
      const valEl=ventasCard.querySelector('.kpi-editable');
      if(valEl && !ventasCard.querySelector('.kpi-trend')) valEl.insertAdjacentElement('afterend',trendEl);
    }
  }

  const npsCard = document.getElementById('bar-nps')?.closest('.card');
  if(npsCard) {
    npsCard.style.borderColor = (nps < objNps && objNps>0) ? 'var(--danger)' : '';
    const trend=getKPITrend('nps');
    if(trend) {
      const trendEl=document.createElement('span');
      trendEl.className='kpi-trend '+trend.cls;
      trendEl.textContent=` ${trend.arrow}${trend.diff}`;
      const valEl=npsCard.querySelector('.kpi-editable');
      if(valEl && !npsCard.querySelector('.kpi-trend')) valEl.insertAdjacentElement('afterend',trendEl);
    }
  }

  const acCardEl = document.getElementById('kpi-ac')?.closest('.card');
  if(acCardEl && ac<AC_ALERT_THRESHOLD) {
    const badge=document.createElement('div');
    badge.className='kpi-alert-badge warning'; badge.textContent='⚠️ AC+ bajo';
    acCardEl.appendChild(badge);
  }

  const npsPctVal=objNps>0?nps/objNps:0;
  const convPctVal=objConv>0?conv/objConv:0;
  const uptPctVal=objUpt>0?upt/objUpt:0;
  const onTrack=ventasPct>=0.9&&npsPctVal>=0.9&&convPctVal>=0.9&&uptPctVal>=0.9;
  const resNpsGrid=document.getElementById('res-nps-grid');
  if(resNpsGrid) {
    resNpsGrid.querySelectorAll('.kpi-alert-badge').forEach(b=>b.remove());
    if(onTrack) {
      const badge=document.createElement('div');
      badge.className='kpi-alert-badge success'; badge.textContent='🎯 On track';
      resNpsGrid.appendChild(badge);
    }
  }
}

/* ═══════════════════════════════════════════════
   K3 — STREAK TRACKER (Alerta de tendencia negativa)
═══════════════════════════════════════════════ */
export function getKPIStreaks() {
  const history = load(K.kpiHistory, []);
  if (history.length < 2) return [];
  const sorted = history.slice().sort((a, b) => a.date.localeCompare(b.date));
  const checks = [
    { name: 'Ventas',     val: 'ventas', obj: 'objVentas' },
    { name: 'NPS',        val: 'nps',    obj: 'objNps'    },
    { name: 'DTA',        val: 'dta',    obj: 'objDta'    },
    { name: 'Conversión', val: 'conv',   obj: 'objConv'   },
  ];
  const streaks = [];
  checks.forEach(kpi => {
    let streak = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      const s = sorted[i];
      const val = num(s[kpi.val]);
      const obj = num(s[kpi.obj]);
      if (obj > 0 && val < obj) { streak++; } else { break; }
    }
    if (streak >= 2) streaks.push({ name: kpi.name, weeks: streak });
  });
  return streaks;
}

export function renderKPIStreakAlerts() {
  const streaks = getKPIStreaks();
  ['kpi-streak-alerts', 'res-streak-alerts'].forEach(elId => {
    const el = document.getElementById(elId);
    if (!el) return;
    if (!streaks.length) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    el.innerHTML = streaks.map(s =>
      `<div class="streak-alert-item">⚠️ <strong>${esc(s.name)}</strong> — ${s.weeks} semana${s.weeks>1?'s':''} consecutiva${s.weeks>1?'s':''} por debajo del objetivo</div>`
    ).join('');
  });
}
