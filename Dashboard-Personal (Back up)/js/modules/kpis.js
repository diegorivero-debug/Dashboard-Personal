/* ═══════════════════════════════════════════════
   KPIs — extracted from dashboard.js
   KPI input, progress bars, YoY/WoW badges,
   OCR import, and snapshot functions.
═══════════════════════════════════════════════ */

import { K, AC_ALERT_THRESHOLD } from '../core/constants.js';
import { load, save, esc, num, flash, showToast } from '../core/utils.js';

const _g = id => document.getElementById(id)?.value || '';
let _saveKPIsTimer;

export function saveKPIs() {
  // Actualizar barras de progreso inmediatamente (UX responsiva)
  refreshProgressBars();
  // Debounce: solo persistir a localStorage tras 400ms sin cambios
  clearTimeout(_saveKPIsTimer);
  _saveKPIsTimer = setTimeout(() => {
    save(K.kpis, {
      // ── Original compatibility fields ──
      ventas:    _g('kpi-ventas'),    objVentas: _g('kpi-obj-ventas'),
      nps:       _g('kpi-nps'),       objNps:    _g('kpi-obj-nps'),
      conv:      _g('kpi-conv'),      objConv:   _g('kpi-obj-conv'),
      upt:       _g('kpi-upt'),       objUpt:    _g('kpi-obj-upt'),
      acc:       _g('kpi-acc'),       ac:        _g('kpi-ac'),
      clicount:  _g('kpi-clicount'),  notes:     _g('kpi-notes'),
      // ── Critical KPIs — YoY/WoW ──
      yoyVentas: _g('kpi-yoy-ventas'), wowVentas: _g('kpi-wow-ventas'),
      yoyNps:    _g('kpi-yoy-nps'),    wowNps:    _g('kpi-wow-nps'),
      // ── Group 1 — Ventas ──
      ventasBusiness:    _g('kpi-ventas-business'),    objVentasBusiness: _g('kpi-obj-ventas-business'),
      yoyVentasBusiness: _g('kpi-yoy-ventas-business'), wowVentasBusiness: _g('kpi-wow-ventas-business'),
      ventasApu:    _g('kpi-ventas-apu'),    objVentasApu: _g('kpi-obj-ventas-apu'),
      yoyVentasApu: _g('kpi-yoy-ventas-apu'), wowVentasApu: _g('kpi-wow-ventas-apu'),
      ventasSfs:    _g('kpi-ventas-sfs'),    objVentasSfs: _g('kpi-obj-ventas-sfs'),
      yoyVentasSfs: _g('kpi-yoy-ventas-sfs'), wowVentasSfs: _g('kpi-wow-ventas-sfs'),
      // ── Group 2 — NPS ──
      npsShop:    _g('kpi-nps-shopping'),    objNpsShop: _g('kpi-obj-nps-shopping'),
      yoyNpsShop: _g('kpi-yoy-nps-shopping'), wowNpsShop: _g('kpi-wow-nps-shopping'),
      npsApu:    _g('kpi-nps-apu'),    objNpsApu: _g('kpi-obj-nps-apu'),
      yoyNpsApu: _g('kpi-yoy-nps-apu'), wowNpsApu: _g('kpi-wow-nps-apu'),
      npsSupport:    _g('kpi-nps-support'),    objNpsSupport: _g('kpi-obj-nps-support'),
      yoyNpsSupport: _g('kpi-yoy-nps-support'), wowNpsSupport: _g('kpi-wow-nps-support'),
      npsTaa:    _g('kpi-nps-taa'),    objNpsTaa: _g('kpi-obj-nps-taa'),
      yoyNpsTaa: _g('kpi-yoy-nps-taa'), wowNpsTaa: _g('kpi-wow-nps-taa'),
      // ── Group 3 — Tráfico y Conversión ──
      trafico:    _g('kpi-trafico'),    objTrafico: _g('kpi-obj-trafico'),
      yoyTrafico: _g('kpi-yoy-trafico'), wowTrafico: _g('kpi-wow-trafico'),
      yoyConv:    _g('kpi-yoy-conv'),   wowConv:    _g('kpi-wow-conv'),
      // ── Group 4 — Operacionales ──
      dta:    _g('kpi-dta'),    objDta: _g('kpi-obj-dta'),
      intros1k:       _g('kpi-intros-1k'),       objIntros1k:       _g('kpi-obj-intros-1k'),
      timely:         _g('kpi-timely'),           objTimely:         _g('kpi-obj-timely'),
      cpUsage:        _g('kpi-cp-usage'),         objCpUsage:        _g('kpi-obj-cp-usage'),
      gbConv:         _g('kpi-gb-conv'),          objGbConv:         _g('kpi-obj-gb-conv'),
      introsSessions: _g('kpi-intros-sessions'),  objIntrosSessions: _g('kpi-obj-intros-sessions'),
      iphoneTat:      _g('kpi-iphone-tat'),       objIphoneTat:      _g('kpi-obj-iphone-tat'),
    });
    flash('kpi-saved');
    window.updateSummary?.();
    window.renderRadarChart?.();
    window.renderMissionControl?.();
  }, 400);
}

export function loadKPIs() {
  const d = load(K.kpis, {});
  const set = (id, v) => { try { const el=document.getElementById(id); if(el && d[v]!==undefined) el.value=d[v]; } catch(e) {} };
  // Original compatibility fields
  set('kpi-ventas','ventas');      set('kpi-obj-ventas','objVentas');
  set('kpi-nps','nps');            set('kpi-obj-nps','objNps');
  set('kpi-conv','conv');          set('kpi-obj-conv','objConv');
  set('kpi-upt','upt');            set('kpi-obj-upt','objUpt');
  set('kpi-acc','acc');            set('kpi-ac','ac');
  set('kpi-clicount','clicount');  set('kpi-notes','notes');
  // Critical KPIs YoY/WoW
  set('kpi-yoy-ventas','yoyVentas'); set('kpi-wow-ventas','wowVentas');
  set('kpi-yoy-nps','yoyNps');       set('kpi-wow-nps','wowNps');
  // Group 1
  set('kpi-ventas-business','ventasBusiness');    set('kpi-obj-ventas-business','objVentasBusiness');
  set('kpi-yoy-ventas-business','yoyVentasBusiness'); set('kpi-wow-ventas-business','wowVentasBusiness');
  set('kpi-ventas-apu','ventasApu');    set('kpi-obj-ventas-apu','objVentasApu');
  set('kpi-yoy-ventas-apu','yoyVentasApu'); set('kpi-wow-ventas-apu','wowVentasApu');
  set('kpi-ventas-sfs','ventasSfs');    set('kpi-obj-ventas-sfs','objVentasSfs');
  set('kpi-yoy-ventas-sfs','yoyVentasSfs'); set('kpi-wow-ventas-sfs','wowVentasSfs');
  // Group 2
  set('kpi-nps-shopping','npsShop');    set('kpi-obj-nps-shopping','objNpsShop');
  set('kpi-yoy-nps-shopping','yoyNpsShop'); set('kpi-wow-nps-shopping','wowNpsShop');
  set('kpi-nps-apu','npsApu');          set('kpi-obj-nps-apu','objNpsApu');
  set('kpi-yoy-nps-apu','yoyNpsApu');   set('kpi-wow-nps-apu','wowNpsApu');
  set('kpi-nps-support','npsSupport');  set('kpi-obj-nps-support','objNpsSupport');
  set('kpi-yoy-nps-support','yoyNpsSupport'); set('kpi-wow-nps-support','wowNpsSupport');
  set('kpi-nps-taa','npsTaa');          set('kpi-obj-nps-taa','objNpsTaa');
  set('kpi-yoy-nps-taa','yoyNpsTaa');   set('kpi-wow-nps-taa','wowNpsTaa');
  // Group 3
  set('kpi-trafico','trafico');    set('kpi-obj-trafico','objTrafico');
  set('kpi-yoy-trafico','yoyTrafico'); set('kpi-wow-trafico','wowTrafico');
  set('kpi-yoy-conv','yoyConv');   set('kpi-wow-conv','wowConv');
  // Group 4
  set('kpi-dta','dta');            set('kpi-obj-dta','objDta');
  set('kpi-intros-1k','intros1k'); set('kpi-obj-intros-1k','objIntros1k');
  set('kpi-timely','timely');      set('kpi-obj-timely','objTimely');
  set('kpi-cp-usage','cpUsage');   set('kpi-obj-cp-usage','objCpUsage');
  set('kpi-gb-conv','gbConv');     set('kpi-obj-gb-conv','objGbConv');
  set('kpi-intros-sessions','introsSessions'); set('kpi-obj-intros-sessions','objIntrosSessions');
  set('kpi-iphone-tat','iphoneTat'); set('kpi-obj-iphone-tat','objIphoneTat');
  refreshProgressBars();
}

export function setBar(barId,pctId,val,obj) {
  const v=num(val), o=num(obj), pct=o>0?Math.min(Math.round(v/o*100),100):0;
  const b=document.getElementById(barId), p=document.getElementById(pctId);
  if(b) b.style.width=pct+'%';
  if(p) p.textContent=pct+'%';
  return pct;
}

/* Calculate trend badge HTML: ▲/▼ + % diff */
export function calcTrendBadge(actualStr, anteriorStr) {
  if(!anteriorStr || !anteriorStr.trim()) return '';
  const actual = num(actualStr), anterior = num(anteriorStr);
  if(anterior === 0) return '';
  const diff = ((actual - anterior) / anterior) * 100;
  const isUp = diff > 0;
  return `<span class="yow-badge ${isUp?'up':'down'}">${isUp?'▲':'▼'} ${Math.abs(diff).toFixed(1)}%</span>`;
}

/* Update all YoY/WoW badge spans */
export function updateYoWBadges() {
  // [actualId, yoyInputId, yoyBadgeId, wowInputId, wowBadgeId]
  const pairs = [
    ['kpi-ventas',         'kpi-yoy-ventas',         'badge-yoy-ventas',         'kpi-wow-ventas',         'badge-wow-ventas'],
    ['kpi-nps',            'kpi-yoy-nps',             'badge-yoy-nps',             'kpi-wow-nps',             'badge-wow-nps'],
    ['kpi-ventas-business','kpi-yoy-ventas-business', 'badge-yoy-ventas-business', 'kpi-wow-ventas-business', 'badge-wow-ventas-business'],
    ['kpi-ventas-apu',     'kpi-yoy-ventas-apu',      'badge-yoy-ventas-apu',      'kpi-wow-ventas-apu',      'badge-wow-ventas-apu'],
    ['kpi-ventas-sfs',     'kpi-yoy-ventas-sfs',      'badge-yoy-ventas-sfs',      'kpi-wow-ventas-sfs',      'badge-wow-ventas-sfs'],
    ['kpi-nps-shopping',   'kpi-yoy-nps-shopping',    'badge-yoy-nps-shopping',    'kpi-wow-nps-shopping',    'badge-wow-nps-shopping'],
    ['kpi-nps-apu',        'kpi-yoy-nps-apu',         'badge-yoy-nps-apu',         'kpi-wow-nps-apu',         'badge-wow-nps-apu'],
    ['kpi-nps-support',    'kpi-yoy-nps-support',     'badge-yoy-nps-support',     'kpi-wow-nps-support',     'badge-wow-nps-support'],
    ['kpi-nps-taa',        'kpi-yoy-nps-taa',         'badge-yoy-nps-taa',         'kpi-wow-nps-taa',         'badge-wow-nps-taa'],
    ['kpi-trafico',        'kpi-yoy-trafico',          'badge-yoy-trafico',          'kpi-wow-trafico',          'badge-wow-trafico'],
    ['kpi-conv',           'kpi-yoy-conv',             'badge-yoy-conv',             'kpi-wow-conv',             'badge-wow-conv'],
  ];
  pairs.forEach(([aId, yoyId, yoyBId, wowId, wowBId]) => {
    const aVal = _g(aId);
    const yoyBadge = document.getElementById(yoyBId);
    const wowBadge = document.getElementById(wowBId);
    if(yoyBadge) yoyBadge.innerHTML = calcTrendBadge(aVal, _g(yoyId));
    if(wowBadge) wowBadge.innerHTML = calcTrendBadge(aVal, _g(wowId));
  });
  // Mirror badges for critical KPIs in group cards
  const copyBadge = (srcId, dstId) => {
    const src = document.getElementById(srcId), dst = document.getElementById(dstId);
    if(src && dst) dst.innerHTML = src.innerHTML;
  };
  copyBadge('badge-yoy-ventas', 'mirror-badge-yoy-ventas');
  copyBadge('badge-wow-ventas', 'mirror-badge-wow-ventas');
  copyBadge('badge-yoy-nps',    'mirror-badge-yoy-nps');
  copyBadge('badge-wow-nps',    'mirror-badge-wow-nps');
}

export function refreshProgressBars() {
  // ── Critical KPIs ──
  setBar('bar-ventas','pct-ventas', _g('kpi-ventas'), _g('kpi-obj-ventas'));
  setBar('bar-nps',   'pct-nps',   _g('kpi-nps'),    _g('kpi-obj-nps'));
  setBar('bar-dta',   'pct-dta',   _g('kpi-dta'),    _g('kpi-obj-dta'));
  // ── Group 1 ──
  setBar('bar-ventas-business','pct-ventas-business', _g('kpi-ventas-business'), _g('kpi-obj-ventas-business'));
  setBar('bar-ventas-apu',     'pct-ventas-apu',      _g('kpi-ventas-apu'),      _g('kpi-obj-ventas-apu'));
  setBar('bar-ventas-sfs',     'pct-ventas-sfs',      _g('kpi-ventas-sfs'),      _g('kpi-obj-ventas-sfs'));
  // ── Group 2 ──
  setBar('bar-nps-shopping','pct-nps-shopping', _g('kpi-nps-shopping'), _g('kpi-obj-nps-shopping'));
  setBar('bar-nps-apu',     'pct-nps-apu',      _g('kpi-nps-apu'),      _g('kpi-obj-nps-apu'));
  setBar('bar-nps-support', 'pct-nps-support',  _g('kpi-nps-support'),  _g('kpi-obj-nps-support'));
  setBar('bar-nps-taa',     'pct-nps-taa',      _g('kpi-nps-taa'),      _g('kpi-obj-nps-taa'));
  // ── Group 3 ──
  setBar('bar-trafico','pct-trafico', _g('kpi-trafico'), _g('kpi-obj-trafico'));
  setBar('bar-conv',   'pct-conv',    _g('kpi-conv'),    _g('kpi-obj-conv'));
  // ── Mirror cards (Ventas Totales in Group 1) ──
  const venV = _g('kpi-ventas'), venO = _g('kpi-obj-ventas');
  const mv = document.getElementById('mirror-ventas');
  const mo = document.getElementById('mirror-obj-ventas');
  if(mv) mv.textContent = venV || '—';
  if(mo) mo.textContent = venO || '—';
  setBar('mirror-bar-ventas', 'mirror-pct-ventas', venV, venO);
  // ── Mirror cards (NPS Tienda in Group 2) ──
  const npsV = _g('kpi-nps'), npsO = _g('kpi-obj-nps');
  const mn = document.getElementById('mirror-nps');
  const mno = document.getElementById('mirror-obj-nps');
  if(mn) mn.textContent = npsV || '—';
  if(mno) mno.textContent = npsO || '—';
  setBar('mirror-bar-nps', 'mirror-pct-nps', npsV, npsO);
  // ── Mirror cards (DTA in Group 4) ──
  const dtaV = _g('kpi-dta'), dtaO = _g('kpi-obj-dta');
  const md = document.getElementById('mirror-dta');
  const mdo = document.getElementById('mirror-obj-dta');
  if(md) md.textContent = dtaV || '—';
  if(mdo) mdo.textContent = dtaO || '—';
  // ── YoY/WoW badges ──
  updateYoWBadges();
  // ── Resumen tab mirrors ──
  const venPct = setBar('res-ventas-bar','res-ventas-pct', venV, venO);
  const rv=document.getElementById('res-ventas');    if(rv) rv.textContent=venV||'—';
  const ro=document.getElementById('res-ventas-obj');if(ro) ro.textContent=venO||'—';
  // ── Resumen NPS compact cards ──
  const _npsColor = v => { const n=parseFloat(v); return isNaN(n)?'var(--text-secondary)':n>=50?'var(--success)':n>=0?'var(--warning)':'var(--danger)'; };
  [['kpi-nps-shopping','res-nps-shopping'],['kpi-nps-support','res-nps-support'],
   ['kpi-nps-apu','res-nps-apu'],['kpi-nps-taa','res-nps-taa']].forEach(([src,dst])=>{
    const val=_g(src); const el=document.getElementById(dst);
    if(el){el.textContent=val||'—';el.style.color=_npsColor(val);}
  });
  try { window.checkKPIAlerts?.(); } catch(e) {}
}

export function saveKPISnapshot() {
  const today = new Date().toISOString().slice(0,10);
  let history = load(K.kpiHistory, []);
  history = history.filter(s=>s.date!==today); // only one snapshot per day
  history.push({
    date: today,
    context: document.getElementById('kpi-week-context')?.value.trim() || '',  /* K1 */
    ventas: _g('kpi-ventas'),      objVentas: _g('kpi-obj-ventas'),
    nps:    _g('kpi-nps'),          objNps:    _g('kpi-obj-nps'),
    conv:   _g('kpi-conv'),         objConv:   _g('kpi-obj-conv'),
    upt:    _g('kpi-upt'),          objUpt:    _g('kpi-obj-upt'),
    ac:     _g('kpi-ac'),           objAc:     String(AC_ALERT_THRESHOLD),
    dta:    _g('kpi-dta'),          objDta:    _g('kpi-obj-dta'),
    trafico:_g('kpi-trafico'),      objTrafico:_g('kpi-obj-trafico'),
    ventasBusiness: _g('kpi-ventas-business'), objVentasBusiness: _g('kpi-obj-ventas-business'),
    ventasApu:      _g('kpi-ventas-apu'),      objVentasApu:      _g('kpi-obj-ventas-apu'),
    ventasSfs:      _g('kpi-ventas-sfs'),      objVentasSfs:      _g('kpi-obj-ventas-sfs'),
    npsShop:        _g('kpi-nps-shopping'),    objNpsShop:        _g('kpi-obj-nps-shopping'),
    npsApu:         _g('kpi-nps-apu'),         objNpsApu:         _g('kpi-obj-nps-apu'),
    npsSupport:     _g('kpi-nps-support'),     objNpsSupport:     _g('kpi-obj-nps-support'),
    npsTaa:         _g('kpi-nps-taa'),         objNpsTaa:         _g('kpi-obj-nps-taa'),
    intros1k:       _g('kpi-intros-1k'),       objIntros1k:       _g('kpi-obj-intros-1k'),
    timely:         _g('kpi-timely'),           objTimely:         _g('kpi-obj-timely'),
    cpUsage:        _g('kpi-cp-usage'),         objCpUsage:        _g('kpi-obj-cp-usage'),
    gbConv:         _g('kpi-gb-conv'),          objGbConv:         _g('kpi-obj-gb-conv'),
    introsSessions: _g('kpi-intros-sessions'),  objIntrosSessions: _g('kpi-obj-intros-sessions'),
    iphoneTat:      _g('kpi-iphone-tat'),       objIphoneTat:      _g('kpi-obj-iphone-tat'),
  });
  save(K.kpiHistory, history);
  window.renderKPIHistory?.();
  flash('kpi-saved');
}

export function autoSaveDailySnapshot() {
  const today = new Date().toISOString().slice(0,10);
  const history = load(K.kpiHistory, []);
  if(!history.find(s=>s.date===today)) saveKPISnapshot();
}

/* ═══════════════════════════════════════════════
   OCR — Autocompletar KPIs desde captura
═══════════════════════════════════════════════ */

/**
 * Smart number normalizer: handles both US ("91.9", "45,068") and
 * European ("1.234,56") number formats.
 */
function _ocrNormNum(s) {
  if (!s) return s;
  const hasDot = s.includes('.');
  const hasComma = s.includes(',');
  if (hasDot && hasComma) {
    if (s.lastIndexOf('.') > s.lastIndexOf(',')) {
      return s.replace(/,/g, '');            // "1,234.56" → "1234.56"
    }
    return s.replace(/\./g, '').replace(',', '.'); // "1.234,56" → "1234.56"
  }
  if (hasComma) {
    const parts = s.split(',');
    if (parts.length === 2 && parts[1].length === 3) {
      return s.replace(/,/g, '');            // "45,068" → "45068"
    }
    return s.replace(',', '.');              // "91,9" → "91.9"
  }
  if (hasDot) {
    const parts = s.split('.');
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length > 0) {
      return s.replace(/\./g, '');           // "1.000" → "1000"
    }
    return s;                                // "91.9" → "91.9"
  }
  return s;
}

/**
 * Parse OCR text from a React App / retail dashboard screenshot and
 * fill as many KPI fields as possible.  Returns array of human-readable
 * descriptions for every field that was successfully filled.
 */
function _parseOCRKPIs(text) {
  const filled = [];
  const norm = text.replace(/\r\n/g, '\n');

  const setField = (id, value, label) => {
    const el = document.getElementById(id);
    if (el && value != null && String(value).trim()) {
      el.value = String(value).trim();
      filled.push(label);
      return true;
    }
    return false;
  };

  const extractSection = (chunk) => {
    const d = {};
    const sm = chunk.match(/(?:Sales|Ventas|Revenue|Facturación)[^\d$€]*([$€]?\s*[\d.,]+)\s*([MmKkBb])?/i);
    if (sm) d.sales = _ocrNormNum(sm[1].replace(/[$€\s]/g, ''));
    const ym = chunk.match(/YoY[:\s]*(-?\d+(?:[.,]\d+)?)\s*%?/i);
    if (ym) d.yoy = _ocrNormNum(ym[1]);
    const cm = chunk.match(/CTG[:\s]*([+-]?\d+(?:[.,]\d+)?)\s*(?:pts?|puntos?)?/i);
    if (cm) d.ctg = _ocrNormNum(cm[1]);
    return d;
  };

  /* ── 1. Section-based parsing ── */
  const headers = [
    { re: /Stores?\s*\(?\s*Total\s*\)?/i,        key: 'total' },
    { re: /Stores?\s*\(?\s*Retail\s+Business/i,   key: 'business' },
    { re: /Retail\s+Web(?:\s+Only)?/i,            key: 'web' },
  ];
  const positions = [];
  for (const h of headers) {
    const m = norm.match(h.re);
    if (m) positions.push({ key: h.key, idx: m.index });
  }
  positions.sort((a, b) => a.idx - b.idx);

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].idx;
    const end = i + 1 < positions.length ? positions[i + 1].idx : norm.length;
    const chunk = norm.substring(start, end);
    const d = extractSection(chunk);
    if (positions[i].key === 'total') {
      if (d.sales) setField('kpi-ventas', d.sales, `Ventas Totales: ${d.sales}`);
      if (d.yoy)   setField('kpi-yoy-ventas', d.yoy, `YoY Ventas: ${d.yoy}%`);
    } else if (positions[i].key === 'business') {
      if (d.sales) setField('kpi-ventas-business', d.sales, `Ventas Business: ${d.sales}`);
      if (d.yoy)   setField('kpi-yoy-ventas-business', d.yoy, `YoY Business: ${d.yoy}%`);
    } else if (positions[i].key === 'web') {
      if (d.sales) setField('kpi-ventas-sfs', d.sales, `Ventas Web/SFS: ${d.sales}`);
      if (d.yoy)   setField('kpi-yoy-ventas-sfs', d.yoy, `YoY Web/SFS: ${d.yoy}%`);
    }
  }

  /* ── 2. Top-row fallback ── */
  if (!filled.some(f => f.startsWith('Ventas Totales'))) {
    const tm = norm.match(/Total\s+Sales[^\d$€]*([$€]?\s*[\d.,]+)\s*([MmKkBb])?\s*(-?\d+(?:[.,]\d+)?)\s*%?/i);
    if (tm) {
      setField('kpi-ventas', _ocrNormNum(tm[1].replace(/[$€\s]/g, '')), `Ventas Totales: ${_ocrNormNum(tm[1].replace(/[$€\s]/g, ''))}`);
      if (tm[3]) setField('kpi-yoy-ventas', _ocrNormNum(tm[3]), `YoY Ventas: ${_ocrNormNum(tm[3])}%`);
    }
  }
  if (!filled.some(f => f.startsWith('Ventas Totales'))) {
    const fm = norm.match(/(?:Ventas|Sales|Revenue|Facturación)[^\d$€]*([$€]?\s*[\d.,]+)\s*[MmKkBb]?/i);
    if (fm) setField('kpi-ventas', _ocrNormNum(fm[1].replace(/[$€\s]/g, '')), `Ventas Totales: ${_ocrNormNum(fm[1].replace(/[$€\s]/g, ''))}`);
  }

  /* ── 3. Generic KPI extraction ── */
  const npsM = norm.match(/(?:NPS|Net\s+Promoter)[^\d]*(-?\d+(?:[.,]\d+)?)/i);
  if (npsM) setField('kpi-nps', _ocrNormNum(npsM[1]), `NPS: ${_ocrNormNum(npsM[1])}`);

  const acM = norm.match(/(?:AppleCare|AC\+|Attachment\s*Rate)[^\d]*([\d.,]+)\s*%?/i);
  if (acM) setField('kpi-ac', _ocrNormNum(acM[1]) + '%', `AppleCare: ${_ocrNormNum(acM[1])}%`);

  const trM = norm.match(/(?:Traffic|Tr[aá]fico)[^\d]*([\d.,]+)/i);
  if (trM) setField('kpi-trafico', _ocrNormNum(trM[1]), `Tráfico: ${_ocrNormNum(trM[1])}`);

  const cvM = norm.match(/(?:Conversion|Conversi[oó]n)[^\d]*([\d.,]+)\s*%?/i);
  if (cvM) setField('kpi-conv', _ocrNormNum(cvM[1]), `Conversión: ${_ocrNormNum(cvM[1])}%`);

  const dtaM = norm.match(/(?:DTA|Days?\s+to\s+Action)[^\d]*([\d.,]+)/i);
  if (dtaM) setField('kpi-dta', _ocrNormNum(dtaM[1]), `DTA: ${_ocrNormNum(dtaM[1])}`);

  const uptM = norm.match(/(?:UPT|Units?\s+(?:Per|por)\s+Trans)[^\d]*([\d.,]+)/i);
  if (uptM) setField('kpi-upt', _ocrNormNum(uptM[1]), `UPT: ${_ocrNormNum(uptM[1])}`);

  const i1kM = norm.match(/(?:Intros?\s*(?:per|\/)\s*1\s*[Kk]|Intros?\s*1000)[^\d]*([\d.,]+)/i);
  if (i1kM) setField('kpi-intros-1k', _ocrNormNum(i1kM[1]), `Intros/1K: ${_ocrNormNum(i1kM[1])}`);

  const tiM = norm.match(/(?:Timely\s*(?:Greet)?|Saludo\s*oportuno)[^\d]*([\d.,]+)\s*%?/i);
  if (tiM) setField('kpi-timely', _ocrNormNum(tiM[1]), `Timely: ${_ocrNormNum(tiM[1])}%`);

  const cpM = norm.match(/(?:CP\s*Usage|Customer\s*Proposal)[^\d]*([\d.,]+)\s*%?/i);
  if (cpM) setField('kpi-cp-usage', _ocrNormNum(cpM[1]), `CP Usage: ${_ocrNormNum(cpM[1])}%`);

  const gbM = norm.match(/(?:GB\s*Conv|Genius\s*(?:Bar\s*)?Conv)[^\d]*([\d.,]+)\s*%?/i);
  if (gbM) setField('kpi-gb-conv', _ocrNormNum(gbM[1]), `GB Conv: ${_ocrNormNum(gbM[1])}%`);

  const tatM = norm.match(/(?:iPhone\s*TAT|iPhone\s*Turn\s*Around)[^\d]*([\d.,]+)/i);
  if (tatM) setField('kpi-iphone-tat', _ocrNormNum(tatM[1]), `iPhone TAT: ${_ocrNormNum(tatM[1])}`);

  return filled;
}

export async function procesarCapturaOCR(event) {
  if (typeof Tesseract === 'undefined') {
    showToast('⚠️ OCR no disponible: Tesseract no está cargado. Comprueba tu conexión.');
    return;
  }

  const file = event.target.files[0];
  if (!file) return;

  const statusDiv = document.getElementById('ocr-status');
  statusDiv.style.display = 'block';
  statusDiv.style.color = 'var(--accent)';
  statusDiv.textContent = 'Analizando imagen... ⏳';

  try {
    const { data: { text } } = await Tesseract.recognize(file, 'spa+eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          statusDiv.textContent = `Leyendo documento... ${Math.round(m.progress * 100)}%`;
        }
      }
    });

    console.log('[OCR] Texto extraído:', text);

    const filled = _parseOCRKPIs(text);
    saveKPIs();
    flash('kpi-saved');

    if (filled.length > 0) {
      statusDiv.style.color = 'var(--success)';
      statusDiv.innerHTML =
        `<strong>✅ ${filled.length} campo${filled.length > 1 ? 's' : ''} autocompletado${filled.length > 1 ? 's' : ''}:</strong><br>` +
        filled.map(f => `<span style="display:inline-block;margin:2px 6px 2px 0;padding:2px 8px;background:var(--surface);border-radius:var(--radius-sm);font-size:11px;">${esc(f)}</span>`).join('');
    } else {
      statusDiv.style.color = 'var(--warning)';
      statusDiv.textContent = '⚠️ No se detectaron KPIs en la imagen. Prueba con una captura más clara o con más resolución.';
    }

    setTimeout(() => { statusDiv.style.display = 'none'; }, filled.length > 0 ? 8000 : 5000);
  } catch (err) {
    console.error('[OCR] Error:', err);
    statusDiv.style.color = 'var(--danger)';
    statusDiv.textContent = '❌ Error al leer la imagen. Prueba con una captura más clara.';
  } finally {
    // Reset input so the same file can be selected again
    event.target.value = '';
  }
}
