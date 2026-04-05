/* ═══════════════════════════════════════════════
   MEETING NOTES MODULE — extracted from dashboard.js
   Handles the rich-text meeting notes editor,
   autosave, PDF export, storage indicator, and
   auto-backup reminder.
═══════════════════════════════════════════════ */

import { K } from '../core/constants.js';
import { load, save, esc, showToast } from '../core/utils.js';

export const MN_TYPES = {
  webex:       '🖥️',
  presencial:  '👥',
  '1:1':       '1:1',
  team:        '👨‍👩‍👧',
  stakeholder: '🌐',
  call:        '📞',
  er:          '📋'
};

export let _mnNotes = [];
export let _mnCurrentId = null;
export let _mnSaveTimer = null;
export let _mnActiveTag = null;
export let _mnActiveType = null;

// ── Init ───────────────────────────────────────
export function mnInit() {
  _mnNotes = load(K.meetingNotes, []);
  mnRenderList();
}

// ── Helper: strip HTML to plain text ───────────
export function mnStripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ── Helper: generate a simple unique ID ────────
export function mnGenId() {
  return 'mn_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

// ── Render the left sidebar list ───────────────
export function mnRenderList() {
  const q = (document.getElementById('mn-search')?.value || '').toLowerCase().trim();
  const listEl = document.getElementById('mn-list');
  const countEl = document.getElementById('mn-count');
  if (!listEl) return;

  // Build tag chips from all notes
  const allTags = new Set();
  _mnNotes.forEach(n => (n.tags || []).forEach(t => allTags.add(t)));
  const tagsEl = document.getElementById('mn-tags-filter');
  if (tagsEl) {
    tagsEl.innerHTML = [...allTags].sort().map(t =>
      `<span class="tag-chip${_mnActiveTag === t ? ' active' : ''}" onclick="mnFilterTag('${esc(t)}')">${esc(t)}</span>`
    ).join('');
  }

  // Update type filter active state
  document.querySelectorAll('#mn-type-filter-bar .mn-type-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === (_mnActiveType || ''));
  });

  // Filter notes
  let filtered = [..._mnNotes].sort((a, b) => (b.datetime || b.createdAt || '').localeCompare(a.datetime || a.createdAt || ''));

  if (_mnActiveType) {
    filtered = filtered.filter(n => (n.type || '') === _mnActiveType);
  }
  if (_mnActiveTag) {
    filtered = filtered.filter(n => (n.tags || []).includes(_mnActiveTag));
  }
  if (q) {
    filtered = filtered.filter(n =>
      (n.title || '').toLowerCase().includes(q) ||
      (n.participants || '').toLowerCase().includes(q) ||
      mnStripHtml(n.content || '').toLowerCase().includes(q) ||
      (n.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }

  if (countEl) countEl.textContent = `${filtered.length} nota${filtered.length !== 1 ? 's' : ''}`;

  if (!filtered.length) {
    listEl.innerHTML = `<div style="text-align:center;padding:30px 12px;color:var(--text-secondary);font-size:13px">${q || _mnActiveTag || _mnActiveType ? 'Sin resultados' : 'Aún no hay notas'}</div>`;
    return;
  }

  listEl.innerHTML = filtered.map(n => {
    const typeEmoji = MN_TYPES[n.type] || '📝';
    const dateStr = n.datetime ? new Date(n.datetime).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '';
    const firstParticipant = (n.participants || '').split(',')[0].trim();
    const snippet = mnStripHtml(n.content || '').slice(0, 60);
    return `<div class="note-item${_mnCurrentId === n.id ? ' active' : ''}" onclick="mnOpenNote('${n.id}')">
      <div class="note-item-title">${typeEmoji} ${esc(n.title || 'Sin título')}</div>
      <div class="note-item-meta">${dateStr}${firstParticipant ? ' · ' + esc(firstParticipant) : ''}</div>
      <div class="note-item-snippet">${esc(snippet)}</div>
    </div>`;
  }).join('');
}

// ── Toggle type filter ──────────────────────────
export function mnFilterType(type) {
  _mnActiveType = _mnActiveType === type ? null : type;
  mnRenderList();
}

// ── Toggle tag filter ───────────────────────────
export function mnFilterTag(tag) {
  _mnActiveTag = _mnActiveTag === tag ? null : tag;
  mnRenderList();
}

// ── Open a note in the editor ──────────────────
export function mnOpenNote(id) {
  const note = _mnNotes.find(n => n.id === id);
  if (!note) return;
  _mnCurrentId = id;
  mnShowEditor(note);
  mnRenderList(); // update active state
}

// ── Create a new blank note ────────────────────
export function mnNewNote() {
  const now = new Date();
  const note = {
    id: mnGenId(),
    title: '',
    type: 'webex',
    datetime: now.toISOString().slice(0, 16),
    participants: '',
    tags: [],
    content: '',
    privateNotes: '',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
  _mnNotes.unshift(note);
  save(K.meetingNotes, _mnNotes);
  _mnCurrentId = note.id;
  mnShowEditor(note);
  mnRenderList();
  document.getElementById('mn-title')?.focus();
}

// ── Populate editor fields from note object ────
export function mnShowEditor(note) {
  const emptyState = document.getElementById('mn-empty-state');
  const editor = document.getElementById('mn-editor');
  if (emptyState) emptyState.style.display = 'none';
  if (editor) editor.style.display = '';

  const titleEl = document.getElementById('mn-title');
  if (titleEl) titleEl.value = note.title || '';

  // Type selector
  document.querySelectorAll('#mn-type-selector .note-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === note.type);
  });

  const dtEl = document.getElementById('mn-datetime');
  if (dtEl) dtEl.value = note.datetime || '';

  const partEl = document.getElementById('mn-participants');
  if (partEl) partEl.value = note.participants || '';

  const tagsEl = document.getElementById('mn-tags');
  if (tagsEl) tagsEl.value = (note.tags || []).join(' ');

  const contentEl = document.getElementById('mn-content');
  if (contentEl) contentEl.innerHTML = note.content || '';

  const privateToggle = document.getElementById('mn-private-toggle');
  const privateSection = document.getElementById('mn-private-section');
  const privateContent = document.getElementById('mn-private-content');
  const hasPrivate = !!(note.privateNotes);
  if (privateToggle) privateToggle.checked = hasPrivate;
  if (privateSection) privateSection.style.display = hasPrivate ? '' : 'none';
  if (privateContent) privateContent.innerHTML = note.privateNotes || '';

  const statusEl = document.getElementById('mn-save-status');
  if (statusEl) statusEl.textContent = '';
  // Enable PDF export button
  const pdfBtn = document.getElementById('mn-pdf-btn');
  if (pdfBtn) { pdfBtn.style.opacity = '1'; pdfBtn.style.pointerEvents = ''; }
}

// ── Set note type ──────────────────────────────
export function mnSetType(type, btn) {
  document.querySelectorAll('#mn-type-selector .note-type-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  mnScheduleSave();
}

// ── Toggle private notes section ───────────────
export function mnTogglePrivate() {
  const checked = document.getElementById('mn-private-toggle')?.checked;
  const section = document.getElementById('mn-private-section');
  if (section) section.style.display = checked ? '' : 'none';
}

// ── RTE: execute formatting command ───────────
export function mnExecCmd(cmd, val) {
  const editor = document.getElementById('mn-content');
  if (!editor) return;
  editor.focus();
  document.execCommand(cmd, false, val || null);
  mnScheduleSave();
}

// ── RTE: insert special block ─────────────────
export function mnInsertBlock(type) {
  const editor = document.getElementById('mn-content');
  if (!editor) return;
  editor.focus();
  const cls = type === 'decision' ? 'note-block-decision' : 'note-block-action';
  const icon = type === 'decision' ? '⬜ ' : '⚡ ';
  const blockHtml = `<div class="${cls}" contenteditable="false"><span contenteditable="true">${icon}</span><button class="note-block-task-btn" onclick="mnOpenTaskModalFromBlock(this)">→ Tarea</button></div><p><br></p>`;
  document.execCommand('insertHTML', false, blockHtml);
  mnScheduleSave();
}

// ── Collect current note data from editor ──────
export function mnCollectCurrentNote() {
  if (!_mnCurrentId) return null;
  const note = _mnNotes.find(n => n.id === _mnCurrentId);
  if (!note) return null;

  note.title = document.getElementById('mn-title')?.value || '';
  const activeTypeBtn = document.querySelector('#mn-type-selector .note-type-btn.active');
  note.type = activeTypeBtn ? activeTypeBtn.dataset.type : 'webex';
  note.datetime = document.getElementById('mn-datetime')?.value || '';
  note.participants = document.getElementById('mn-participants')?.value || '';
  const rawTags = document.getElementById('mn-tags')?.value || '';
  note.tags = (rawTags.match(/#[\w\u00C0-\u024F\u1E00-\u1EFF]+/g) || []).map(t => t.toLowerCase());
  note.content = document.getElementById('mn-content')?.innerHTML || '';
  const privateToggle = document.getElementById('mn-private-toggle');
  note.privateNotes = privateToggle?.checked ? (document.getElementById('mn-private-content')?.innerHTML || '') : '';
  note.updatedAt = new Date().toISOString();
  return note;
}

// ── Schedule autosave (1s debounce) ────────────
export function mnScheduleSave() {
  const statusEl = document.getElementById('mn-save-status');
  if (statusEl) statusEl.textContent = '✏️ Editando...';
  clearTimeout(_mnSaveTimer);
  _mnSaveTimer = setTimeout(() => {
    mnSave(true);
  }, 1000);
}

// ── Save current note ──────────────────────────
export function mnSave(silent) {
  const note = mnCollectCurrentNote();
  if (!note) return;
  save(K.meetingNotes, _mnNotes);
  mnRenderList();
  const statusEl = document.getElementById('mn-save-status');
  if (statusEl) statusEl.textContent = '💾 Guardado';
  if (!silent) {
    setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 2000);
  }
}

// ── Delete current note ────────────────────────
export function mnDelete() {
  if (!_mnCurrentId) return;
  const note = _mnNotes.find(n => n.id === _mnCurrentId);
  const title = note ? (note.title || 'Sin título') : '';
  if (!confirm(`¿Eliminar la nota "${title}"? Esta acción no se puede deshacer.`)) return;
  _mnNotes = _mnNotes.filter(n => n.id !== _mnCurrentId);
  save(K.meetingNotes, _mnNotes);
  _mnCurrentId = null;
  const emptyState = document.getElementById('mn-empty-state');
  const editor = document.getElementById('mn-editor');
  if (emptyState) emptyState.style.display = '';
  if (editor) editor.style.display = 'none';
  mnRenderList();
}

// ── Convert note HTML to formatted plain text for email ──
export function mnHtmlToPlainText(html) {
  if (!html) return '';
  let text = html;
  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, (_, c) => {
    const t = mnStripHtml(c); return `\n${t}\n${'='.repeat(t.length)}\n`;
  });
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, (_, c) => {
    const t = mnStripHtml(c); return `\n${t}\n${'-'.repeat(t.length)}\n`;
  });
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, (_, c) => `• ${mnStripHtml(c)}\n`);
  text = text.replace(/<div[^>]*class="note-block-decision"[^>]*>(.*?)<\/div>/gi, (_, c) => `✅ ${mnStripHtml(c)}\n`);
  text = text.replace(/<div[^>]*class="note-block-action"[^>]*>(.*?)<\/div>/gi, (_, c) => `⚡ ${mnStripHtml(c)}\n`);
  text = text.replace(/<hr[^>]*>/gi, '\n---\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, (_, c) => `${mnStripHtml(c)}\n`);
  text = mnStripHtml(text);
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

// ── Share note via mailto ──────────────────────
export function mnShare() {
  const note = mnCollectCurrentNote();
  if (!note) return;

  const typeLabel = { webex:'Webex', presencial:'Presencial', '1:1':'1:1', team:'Team Meeting', stakeholder:'Stakeholder', call:'Call' };
  const dateLabel = note.datetime ? new Date(note.datetime).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' }) : '';
  const subject = encodeURIComponent(`[APG] ${note.title || 'Sin título'} — ${dateLabel}`);
  const bodyLines = [
    `REUNIÓN: ${note.title || 'Sin título'}`,
    `TIPO: ${typeLabel[note.type] || note.type}`,
    note.datetime ? `FECHA: ${dateLabel}` : '',
    note.participants ? `PARTICIPANTES: ${note.participants}` : '',
    note.tags?.length ? `TAGS: ${note.tags.join(' ')}` : '',
    '',
    '─────────────────────────────────────────',
    '',
    mnHtmlToPlainText(note.content)
  ].filter(l => l !== null).join('\n');

  window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(bodyLines)}`;
}

export function mnExportPDF() {
  const note = mnCollectCurrentNote();
  if (!note) { showToast('Selecciona una nota primero', 'error'); return; }
  const printEl = document.getElementById('note-print-content');
  if (!printEl) return;
  const typeLabel = { webex:'🖥️ Webex', presencial:'👥 Presencial', '1:1':'1:1', team:'👨‍👩‍👧 Team', stakeholder:'🌐 Stakeholder', call:'📞 Call', er:'📋 ER' };
  const dateLabel = note.datetime ? new Date(note.datetime).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' }) : '';
  const typeTxt = typeLabel[note.type] || note.type || '';
  printEl.innerHTML = `
    <div class="note-print-title">${esc(note.title || 'Sin título')}</div>
    <div class="note-print-meta">${typeTxt}${dateLabel ? ' · ' + dateLabel : ''}${note.participants ? ' · ' + esc(note.participants) : ''}</div>
    ${note.tags?.length ? `<div class="note-print-meta">${note.tags.map(t=>esc(t)).join(' ')}</div>` : ''}
    <div class="note-print-body">${note.content || ''}</div>`;
  document.body.classList.add('printing-note');
  window.print();
  document.body.classList.remove('printing-note');
  printEl.innerHTML = '';
}

// ── Open task creation modal ───────────────────
export function mnOpenTaskModal() {
  const note = _mnNotes.find(n => n.id === _mnCurrentId);
  const title = note ? (note.title || 'Sin título') : '';
  const contextEl = document.getElementById('mn-task-context');
  if (contextEl) contextEl.value = `📝 ${title}`;
  const taskTextEl = document.getElementById('mn-task-text');
  if (taskTextEl) { taskTextEl.value = ''; taskTextEl.focus(); }
  const dateEl = document.getElementById('mn-task-date');
  if (dateEl) dateEl.value = '';
  const modal = document.getElementById('mn-task-modal');
  if (modal) { modal.style.display = 'flex'; }
}

// ── Open task modal pre-filled from a block ────
export function mnOpenTaskModalFromBlock(btn) {
  const block = btn?.closest('.note-block-decision, .note-block-action');
  const blockText = block ? mnStripHtml(block.querySelector('[contenteditable]')?.innerHTML || '') : '';
  mnOpenTaskModal();
  const taskTextEl = document.getElementById('mn-task-text');
  if (taskTextEl && blockText) taskTextEl.value = blockText.replace(/^[⬜⚡\s]+/, '').trim();
}

// ── Close task modal ───────────────────────────
export function mnCloseTaskModal() {
  const modal = document.getElementById('mn-task-modal');
  if (modal) modal.style.display = 'none';
}

// ── Create a task from the modal ───────────────
export function mnCreateTask() {
  const text = document.getElementById('mn-task-text')?.value.trim();
  if (!text) { alert('Escribe una descripción para la tarea.'); return; }
  const pri = document.getElementById('mn-task-pri')?.value || 'media';
  const date = document.getElementById('mn-task-date')?.value || '';
  const today = new Date().toISOString().split('T')[0];
  const tasks = window.tasks || load(K.tasks, []);
  const t = {
    id: Date.now(),
    text,
    pri,
    date,
    done: false,
    reminder: '',
    reunionId: null,
    recurrence: '',
    createdDate: today,
    order: tasks.length
  };
  tasks.push(t);
  window.saveTasks?.();
  window.renderTasks?.();
  mnCloseTaskModal();
  showToast('✅ Tarea creada correctamente', 'success');
}

// ── Load all notes on app init ─────────────────
export function loadMeetingNotes() {
  mnInit();
}

/* ═══════════════════════════════════════════════
   STORAGE USAGE INDICATOR
═══════════════════════════════════════════════ */
export function getStorageUsageInfo() {
  let total = 0;
  for (let key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      total += (localStorage[key].length + key.length) * 2;
    }
  }
  const usedKB = Math.round(total / 1024);
  const limitKB = 5120; // ~5 MB
  const pct = Math.min(100, Math.round((usedKB / limitKB) * 100));
  return { usedKB, limitKB, pct };
}

export function renderStorageIndicator() {
  const el = document.getElementById('storage-usage-indicator');
  if (!el) return;
  const { usedKB, limitKB, pct } = getStorageUsageInfo();
  let color = 'var(--success)';
  let icon = '🟢';
  if (pct >= 80) { color = 'var(--danger)'; icon = '🔴'; }
  else if (pct >= 60) { color = 'var(--warning, #f59e0b)'; icon = '🟡'; }
  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
      <span style="font-size:13px;color:var(--text-secondary)">${icon} Almacenamiento usado</span>
      <span style="font-size:13px;font-weight:600">${usedKB} KB <span style="font-weight:400;color:var(--text-secondary)">/ ~${limitKB} KB</span></span>
    </div>
    <div style="background:var(--border);border-radius:99px;height:6px;overflow:hidden">
      <div style="width:${pct}%;height:100%;background:${color};border-radius:99px;transition:width 0.4s"></div>
    </div>
    <div style="font-size:11px;color:var(--text-secondary);margin-top:4px;text-align:right">${pct}% utilizado</div>
  `;
}

/* ═══════════════════════════════════════════════
   AUTO BACKUP REMINDER
═══════════════════════════════════════════════ */
export function checkAutoBackup() {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const REMINDER_DELAY_MS = 2000;
  const lastBackup = parseInt(localStorage.getItem('apg_last_backup') || '0', 10);
  const now = Date.now();
  if (now - lastBackup > SEVEN_DAYS_MS) {
    setTimeout(() => {
      showBackupReminder();
    }, REMINDER_DELAY_MS);
  }
}

export function showBackupReminder() {
  if (document.getElementById('backup-reminder-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'backup-reminder-banner';
  banner.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-left: 4px solid var(--accent);
    border-radius: var(--radius);
    padding: 14px 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    z-index: 9990;
    max-width: 320px;
    font-size: 13px;
    animation: slideInRight 0.3s ease;
  `;
  banner.innerHTML = `
    <div style="font-weight:600;margin-bottom:6px;color:var(--text-primary)">💾 Recordatorio de backup</div>
    <div style="color:var(--text-secondary);margin-bottom:12px;line-height:1.4">Han pasado más de 7 días desde tu último backup. Exporta tus datos para tenerlos a salvo.</div>
    <div style="display:flex;gap:8px">
      <button onclick="exportData(); localStorage.setItem('apg_last_backup', Date.now()); document.getElementById('backup-reminder-banner').remove();"
        style="flex:1;padding:6px 10px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:12px;font-weight:600">
        💾 Exportar ahora
      </button>
      <button onclick="localStorage.setItem('apg_last_backup', Date.now()); document.getElementById('backup-reminder-banner').remove();"
        style="padding:6px 10px;background:var(--surface2);color:var(--text-secondary);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-size:12px">
        Posponer
      </button>
    </div>
  `;
  document.body.appendChild(banner);
}
