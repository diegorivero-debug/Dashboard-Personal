/* ═══════════════════════════════════════════════
   PULSE CHECK — extracted from dashboard.js
   Clave localStorage: K.pulse
═══════════════════════════════════════════════ */

import { K } from '../core/constants.js';
import { load, save } from '../core/utils.js';

export function getWeekStartISO(date) {
  const d = new Date(date);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow + 6) % 7); // normalize: Mon=0 offset, Sun=6 offset
  return d.toISOString().slice(0, 10);
}

export function loadPulseChecks() {
  return load(K.pulse, []);
}

export function savePulseCheck() {
  const weekStart = getWeekStartISO(new Date());
  const energy   = parseInt(document.getElementById('pulse-energy')?.value   || 3);
  const momentum = parseInt(document.getElementById('pulse-momentum')?.value || 3);
  const climate  = parseInt(document.getElementById('pulse-climate')?.value  || 3);
  const tensions = document.getElementById('pulse-tensions')?.value.trim() || '';

  let checks = loadPulseChecks();
  const existing = checks.findIndex(c => c.weekStart === weekStart);
  const entry = { id: weekStart, weekStart, energy, momentum, climate, tensions, createdAt: Date.now() };
  if (existing >= 0) checks[existing] = entry;
  else checks.push(entry);
  save(K.pulse, checks);

  const flash = document.getElementById('pulse-saved');
  if (flash) { flash.style.opacity = 1; setTimeout(() => { flash.style.opacity = 0; }, 2000); }
  renderPulseChart();
}

export function initPulse() {
  const weekStart = getWeekStartISO(new Date());
  const label = document.getElementById('pulse-week-label');
  if (label) {
    const d = new Date(weekStart + 'T12:00:00');
    label.textContent = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  const checks = loadPulseChecks();
  const thisWeek = checks.find(c => c.weekStart === weekStart);
  if (thisWeek) {
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setVal('pulse-energy',   thisWeek.energy);
    setVal('pulse-momentum', thisWeek.momentum);
    setVal('pulse-climate',  thisWeek.climate);
    const t = document.getElementById('pulse-tensions');
    if (t) t.value = thisWeek.tensions || '';
  }
  renderPulseChart();
}

export function renderPulseChart() {
  const wrap = document.getElementById('pulse-chart-wrap');
  if (!wrap) return;
  const checks = loadPulseChecks().slice(-8); // últimas 8 semanas
  if (!checks.length) { wrap.innerHTML = ''; return; }

  const barWidth = 24;
  const gap = 10;
  const maxH = 60;
  const metrics = ['energy', 'momentum', 'climate'];
  const colors  = { energy: 'var(--accent)', momentum: '#ff9f0a', climate: '#30d158' };
  const labels  = { energy: 'Energía', momentum: 'Momentum', climate: 'Clima' };

  const bars = checks.map(c => {
    const weekLabel = new Date(c.weekStart + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    return `<div style="display:inline-flex;flex-direction:column;align-items:center;gap:2px;margin-right:${gap}px">
      <div style="display:flex;align-items:flex-end;gap:2px;height:${maxH}px">
        ${metrics.map(m => {
          const h = Math.round((c[m] / 5) * maxH);
          return `<div title="${labels[m]}: ${c[m]}" style="width:${barWidth}px;height:${h}px;background:${colors[m]};border-radius:3px 3px 0 0;opacity:0.85"></div>`;
        }).join('')}
      </div>
      <div style="font-size:10px;color:var(--text-secondary);white-space:nowrap">${weekLabel}</div>
    </div>`;
  }).join('');

  wrap.innerHTML = `
    <div style="margin-top:14px">
      <div style="display:flex;gap:12px;margin-bottom:8px;flex-wrap:wrap">
        ${metrics.map(m => `<span style="font-size:11px;color:var(--text-secondary)"><span style="display:inline-block;width:10px;height:10px;background:${colors[m]};border-radius:2px;margin-right:4px"></span>${labels[m]}</span>`).join('')}
      </div>
      <div style="display:flex;align-items:flex-end;overflow-x:auto;padding-bottom:4px">${bars}</div>
    </div>`;
}
