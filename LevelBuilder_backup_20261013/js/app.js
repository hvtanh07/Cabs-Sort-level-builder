/* Cap Sort Level Builder: start-up, top bar and keyboard shortcuts */
'use strict';
(function (CS) {
  const $ = CS.$, $$ = CS.$$, A = CS.App, P = CS.Play;

  function init() {
    A.loadConveyors();
    A.loadStore();
    const bundleNote = syncBundle();
    if (!A.store.order.length) {
      // first run: start with the sample level from demo.json if it was bundled, otherwise a blank level
      const sample = window.CS_SAMPLE_LEVEL;
      A.addLevel(sample ? CS.toJSON(CS.fromJSON(sample)) : CS.toJSON(CS.blankLevel('level_0001')));
    }
    A.renderPalette();
    CS.UX.init();
    A.bindList(); A.bindBoard(); A.bindInspector(); P.bind();
    $('#btnNew').onclick = CS.UX.newLevelWizard;

    $('#modeSeg').addEventListener('click', e => {
      const b = e.target.closest('[data-mode]'); if (!b) return;
      if (b.dataset.mode === 'play' && A.mode !== 'play') P.start();
      if (b.dataset.mode === 'edit' && A.mode !== 'edit') P.stop();
    });
    $('#toolSeg').addEventListener('click', e => { const b = e.target.closest('[data-tool]'); if (b) A.setTool(b.dataset.tool); });
    $('#palette').addEventListener('click', e => {
      const b = e.target.closest('[data-c]'); if (!b) return;
      A.setBrush(+b.dataset.c);
    });
    $('#btnUndo').onclick = A.undo;
    $('#btnRedo').onclick = A.redo;
    $('#btnImport').onclick = () => $('#fileLevels').click();
    $('#fileLevels').onchange = async e => {
      const texts = [];
      for (const f of e.target.files) texts.push({ name: f.name, text: await A.readFile(f) });
      e.target.value = '';
      if (A.mode === 'play') P.stop();
      A.importTexts(texts);
    };
    $('#btnExport').onclick = A.exportCurrent;
    $('#btnCopy').onclick = async () => {
      try { await navigator.clipboard.writeText(A.levelText()); A.toast('Level JSON copied'); }
      catch (e) { A.toast('Clipboard is blocked here; use Export instead.'); }
    };
    $('#btnConveyors').onclick = A.dialogConveyors;
    $('#btnHelp').onclick = A.dialogHelp;
    $('#btnExportAll').onclick = A.exportAll;
    $('#btnFolder').onclick = () => A.dir ? A.saveAll() : A.openFolder();
    $('#btnBalance').onclick = () => A.doCmd('fillRows');
    $('#btnRandom').onclick = A.dialogRandom;

    // drop JSON files anywhere to import them
    document.addEventListener('dragover', e => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) e.preventDefault(); });
    document.addEventListener('drop', async e => {
      if (!e.dataTransfer || !e.dataTransfer.files.length) return;
      e.preventDefault();
      const texts = [];
      for (const f of e.dataTransfer.files) if (/\.json$/i.test(f.name)) texts.push({ name: f.name, text: await A.readFile(f) });
      if (texts.length) { if (A.mode === 'play') P.stop(); A.importTexts(texts); }
    });

    document.addEventListener('keydown', onKey);
    let rt = 0;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (A.mode === 'edit') A.drawConveyorPreview(); }, 80); });
    if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (A.mode === 'edit') A.drawConveyorPreview(); });

    A.openLevel(A.store.current && A.store.levels[A.store.current] ? A.store.current : A.store.order[0]);
    if (bundleNote) A.toast(bundleNote, 7000);
  }

  /* Bundled levels (js/levels.js): loaded into the list once per bundle version.
     Levels the designer edited are kept; a different level that already uses a bundled id moves to a free id. */
  const playContent = j => { const o = CS.toJSON(CS.fromJSON(j)); delete o.meta; delete o.$schema; return JSON.stringify(o); };
  function sameContent(a, b) { try { return playContent(a) === playContent(b); } catch (e) { return false; } }

  function syncBundle() {
    const B = window.CS_BUNDLED_LEVELS;
    if (!B || !Array.isArray(B.levels) || !B.levels.length || A.prefs.bundle === B.version) return '';
    const hash = t => { let h = 5381; for (let i = 0; i < t.length; i++) h = (h * 33 ^ t.charCodeAt(i)) >>> 0; return h.toString(36); };
    const sig = A.prefs.bundleSig || {};
    const firstTime = !A.prefs.bundle;
    const bundled = B.levels.map(src => CS.toJSON(CS.fromJSON(src)));
    const taken = new Set(A.store.order.map(k => A.store.levels[k].id).concat(bundled.map(j => j.id)));
    let max = 0;
    taken.forEach(id => { const n = (String(id).match(/(\d+)$/) || [])[1]; if (n) max = Math.max(max, +n); });
    const keyOf = {};
    A.store.order.forEach(k => { keyOf[A.store.levels[k].id] = k; });
    const keys = [], moved = [];
    let added = 0, updated = 0, kept = 0;
    bundled.forEach(j => {
      const text = JSON.stringify(j);
      const k = keyOf[j.id];
      if (k && JSON.stringify(A.store.levels[k]) === text) keys.push(k);
      else if (k && sig[j.id]) {
        // unedited, or only its name / notes differ (the play content matches this version): take the new copy
        if (hash(JSON.stringify(A.store.levels[k])) === sig[j.id] || sameContent(A.store.levels[k], j)) { A.store.levels[k] = j; updated++; } else kept++;
        keys.push(k);
      } else {
        if (k) {   // one of the designer's own levels has this id: keep it, under the next free id
          const old = A.store.levels[k];
          old.id = 'level_' + String(++max).padStart(4, '0');
          moved.push(`${j.id} "${(old.meta && old.meta.name) || ''}" is now ${old.id}`);
        }
        keys.push(A.addLevel(j)); added++;
      }
      sig[j.id] = hash(text);
    });
    // put the bundled set at the top of the list in level order (levels added since a previous version would otherwise land at the end)
    const rest = A.store.order.filter(k => !keys.includes(k));
    A.store.order = keys.concat(rest);
    if (firstTime) A.store.current = keys[0];
    A.prefs.bundle = B.version; A.prefs.bundleSig = sig; A.savePrefs();
    A.saveStore();
    const parts = [];
    if (added) parts.push(`Added ${added} level${added > 1 ? 's' : ''} from levels.js`);
    if (updated) parts.push(`updated ${updated}`);
    if (kept) parts.push(`kept your edits on ${kept}`);
    let msg = parts.join(', ');
    if (msg) msg = msg[0].toUpperCase() + msg.slice(1);
    if (moved.length) msg += (msg ? '. ' : '') + 'Your ' + moved.join('; ') + '.';
    return msg;
  }

  function onKey(e) {
    const tag = (e.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || tag === 'select';
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key.toLowerCase() === 's') { e.preventDefault(); A.save(); return; }
    if ((ctrl && e.key === 'Enter') || e.key === 'F5') { e.preventDefault(); if (A.mode === 'play') P.restart(); else P.start(); return; }
    if ($('#dlg').open) return;
    if (typing) return;
    if (A.mode === 'play') { if (P.key(e)) e.preventDefault(); return; }
    if (ctrl && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) A.redo(); else A.undo(); return; }
    if (ctrl && e.key.toLowerCase() === 'y') { e.preventDefault(); A.redo(); return; }
    if (ctrl || e.altKey) return;
    const s = A.sel;
    const k = e.key;
    if (/^[1-8]$/.test(k)) {
      const c = +k;
      if (s && s.type === 'box' && A.tool === 'select') A.setValue('boxColor', c);
      else if (s && s.type === 'row' && A.tool === 'select') A.setValue('rowFill', c);
      A.setBrush(c);
      return;
    }
    switch (k.toLowerCase()) {
      case 'v': A.setTool('select'); return;
      case 'b': case 'p': A.setTool('paint'); return;
      case 'l': A.setTool('link'); return;
      case 'escape': A.linkFirst = null; A.select(null); return;
      case 'h':
        if (s && s.type === 'box') { const p = CS.boxPos(A.m, s.uid); if (p) A.setValue('boxHidden', !A.m.lanes[p.lane][p.tray].hidden); }
        else if (s && s.type === 'row') { const r = A.m.feeders[s.f].rows[s.r]; if (r) A.setValue('rowHidden', !r.hidden); }
        return;
      case 'delete': case 'backspace':
        if (!s) return;
        e.preventDefault();
        if (s.type === 'box') A.doCmd('boxDel'); else if (s.type === 'row') A.doCmd('rowDel'); else if (s.type === 'feeder') A.doCmd('feederDel'); else if (s.type === 'lane') A.doCmd('laneDel');
        return;
      case 'arrowup': if (s && s.type === 'box') { e.preventDefault(); A.doCmd('boxUp'); } else if (s && s.type === 'row') { e.preventDefault(); A.doCmd('rowDown'); } return;
      case 'arrowdown': if (s && s.type === 'box') { e.preventDefault(); A.doCmd('boxDown'); } else if (s && s.type === 'row') { e.preventDefault(); A.doCmd('rowUp'); } return;
      case 'arrowleft': if (s && s.type === 'box') { e.preventDefault(); A.doCmd('boxLeft'); } return;
      case 'arrowright': if (s && s.type === 'box') { e.preventDefault(); A.doCmd('boxRight'); } return;
      case '+': case '=': if (s && s.type === 'box') { const p = CS.boxPos(A.m, s.uid); A.setValue('boxSize', A.m.lanes[p.lane][p.tray].size + 1); } return;
      case '-': if (s && s.type === 'box') { const p = CS.boxPos(A.m, s.uid); A.setValue('boxSize', Math.max(1, A.m.lanes[p.lane][p.tray].size - 1)); } return;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(window.CS);
