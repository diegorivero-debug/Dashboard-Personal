import { K, MESES, DIAS } from '../core/constants.js';
import { load, save } from '../core/utils.js';

export let dark = load(K.theme, false);
export const applyTheme = () => {
  document.documentElement.setAttribute('data-theme', dark?'dark':'light');
  const btn = document.querySelector('#theme-toggle-btn');
  if (btn) btn.textContent = dark ? '☀️' : '🌙';
};
export const toggleTheme = () => { dark=!dark; save(K.theme,dark); applyTheme(); };

export function tick() {
  const n = new Date();
  const clockEl = document.getElementById('clock');
  if (clockEl) clockEl.textContent = n.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
  const h = n.getHours();
  document.getElementById('greeting').textContent = (h<13?'Buenos días':h<20?'Buenas tardes':'Buenas noches')+', Diego 👋';
  const ds = `${DIAS[n.getDay()].charAt(0).toUpperCase()+DIAS[n.getDay()].slice(1)}, ${n.getDate()} de ${MESES[n.getMonth()]} de ${n.getFullYear()}`;
  document.getElementById('today-date').textContent = ds;
}
setInterval(tick,1000);

export const ACCENT_THEMES = {
  blue:   { accent:'#0071e3', dark:'#0064cc' },
  green:  { accent:'#28a745', dark:'#1e7e34' },
  purple: { accent:'#6f42c1', dark:'#5a32a0' },
  coral:  { accent:'#e8533a', dark:'#c9422b' },
};
export function setAccentTheme(name) {
  const t=ACCENT_THEMES[name]||ACCENT_THEMES.blue;
  document.documentElement.style.setProperty('--accent', t.accent);
  document.documentElement.style.setProperty('--accent-dark', t.dark);
  save('apg_accent_theme', name);
  document.querySelectorAll('.accent-dot').forEach(b=>{
    b.classList.toggle('active', b.dataset.theme===name);
  });
}
(function initAccentTheme(){
  const saved=localStorage.getItem('apg_accent_theme');
  if(saved && ACCENT_THEMES[saved]) setAccentTheme(saved);
})();
