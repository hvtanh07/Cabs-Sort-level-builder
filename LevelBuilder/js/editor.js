/* Cap Sort Level Builder: editor (level list, board, inspector, dialogs) */
'use strict';
(function (CS) {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  CS.$ = $; CS.$$ = $$; CS.esc = esc;

  const LS_LEVELS = 'capsort.lb.levels.v1', LS_CONV = 'capsort.lb.conveyors.v1', LS_PREF = 'capsort.lb.prefs.v1';
  const lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

  const A = CS.App = {
    store: { order: [], levels: {}, current: null },
    files: {},              // key -> file name in the linked folder
    dir: null,              // linked folder handle
    dirty: {},              // key -> true when changed since last folder save
    m: null, key: null,
    hist: [], hi: -1,
    sel: null, tool: 'select', brush: 1, linkFirst: null,
    conveyors: {}, convOrder: [],
    mode: 'edit', tab: 'level',
    valCache: {},
    // pickV 2: items fly to any matching box (the new default); prefs saved before it go back to that default once
    prefs: (p => Object.assign({ speed: 1, pick: 'fly', pickV: 2 }, p, p.pickV === 2 ? {} : { pick: 'fly', pickV: 2 }))(lsGet(LS_PREF) || {})
  };
  A.savePrefs = () => lsSet(LS_PREF, A.prefs);

  /* ---------- toast & download helpers ---------- */
  let toastT = 0;
  A.toast = function (msg, ms) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms || 2200);
  };
  A.download = function (name, text, type) {
    const blob = text instanceof Blob ? text : new Blob([text], { type: type || 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  A.readFile = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(f); });

  /* ---------- conveyors ---------- */
  A.loadConveyors = function () {
    A.conveyors = {}; A.convOrder = [];
    CS.PRESET_CONVEYORS.forEach(p => A.addConveyor(CS.normConveyor(Object.assign({ __source: 'preset' }, p)), true));
    (lsGet(LS_CONV) || []).forEach(c => { try { A.addConveyor(CS.normConveyor(c), true); } catch (e) { } });
  };
  A.addConveyor = function (cfg, silent) {
    if (!A.conveyors[cfg.id]) A.convOrder.push(cfg.id);
    A.conveyors[cfg.id] = cfg;
    delete A._geom[cfg.id];
    if (!silent) A.saveConveyors();
  };
  A.saveConveyors = function () {
    lsSet(LS_CONV, A.convOrder.map(id => A.conveyors[id]).filter(c => c.source !== 'preset'));
  };
  A._geom = {};
  A.conv = function (id) {
    if (A.conveyors[id]) return A.conveyors[id];
    const c = CS.normConveyor({ id, __source: 'missing' });
    c.missing = true;
    return c;
  };
  A.geom = function (id) {
    const cfg = A.conv(id);
    const key = id + '|' + JSON.stringify(cfg.shape) + JSON.stringify(cfg.entries) + cfg.rows;
    if (!A._geom[id] || A._geom[id].key !== key) A._geom[id] = { key, g: CS.buildGeom(cfg) };
    return A._geom[id].g;
  };

  /* ---------- level store ---------- */
  A.newKey = () => 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  A.saveStore = function () {
    if (!lsSet(LS_LEVELS, A.store)) A.toast('Browser storage is full or blocked; export your levels to keep them.', 4000);
  };
  let saveT = 0;
  A.saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(A.saveStore, 300); };
  A.loadStore = function () {
    const s = lsGet(LS_LEVELS);
    if (s && Array.isArray(s.order) && s.levels) A.store = s;
    A.store.order = A.store.order.filter(k => A.store.levels[k]);
  };
  A.allIds = () => new Set(A.store.order.map(k => A.store.levels[k].id));
  A.nextId = function (base) {
    const ids = A.allIds();
    if (base && !ids.has(base)) return base;
    let max = 0;
    ids.forEach(id => { const n = (String(id).match(/(\d+)$/) || [])[1]; if (n) max = Math.max(max, +n); });
    let n = max + 1, id;
    do { id = 'level_' + String(n).padStart(4, '0'); n++; } while (ids.has(id));
    return id;
  };
  A.addLevel = function (json, at) {
    const key = A.newKey();
    A.store.levels[key] = json;
    if (at == null || at < 0) A.store.order.push(key); else A.store.order.splice(at, 0, key);
    return key;
  };
  A.levelStatus = function (key) {
    const j = A.store.levels[key];
    const s = JSON.stringify(j);
    const c = A.valCache[key];
    if (c && c.s === s) return c.v;
    let v = 'ok';
    try {
      const m = CS.fromJSON(j);
      const cfg = A.conv(m.conveyor);
      const g = A.geom(m.conveyor);
      const res = CS.validate(m, Object.assign({}, cfg, { entryT: g.entryT }));
      if (cfg.missing) res.push({ level: 'warn' });
      v = res.some(x => x.level === 'error') ? 'error' : res.some(x => x.level === 'warn') ? 'warn' : 'ok';
    } catch (e) { v = 'error'; }
    A.valCache[key] = { s, v };
    return v;
  };

  A.openLevel = function (key) {
    if (!A.store.levels[key]) return;
    if (A.mode === 'play') CS.Play.stop();
    A.key = key; A.store.current = key;
    A.m = CS.fromJSON(A.store.levels[key]);
    A.hist = [JSON.stringify(A.m)]; A.hi = 0;
    A.sel = null; A.linkFirst = null;
    A.saveSoon();
    A.renderAll();
  };
  A.commit = function (opts) {
    if (!A.m) return;
    const s = JSON.stringify(A.m);
    if (s !== A.hist[A.hi]) {
      A.hist = A.hist.slice(0, A.hi + 1); A.hist.push(s);
      if (A.hist.length > 200) A.hist.shift();
      A.hi = A.hist.length - 1;
    }
    A.store.levels[A.key] = CS.toJSON(A.m);
    A.dirty[A.key] = true;
    A.saveSoon();
    if (!(opts && opts.noRender)) A.renderAll();
  };
  A.restore = function (i) {
    A.hi = i; A.m = JSON.parse(A.hist[i]);
    A.store.levels[A.key] = CS.toJSON(A.m); A.dirty[A.key] = true; A.saveSoon();
    if (A.sel && A.sel.type === 'box' && !CS.boxPos(A.m, A.sel.uid)) A.sel = null;
    A.renderAll();
  };
  A.undo = () => { if (A.mode === 'edit' && A.hi > 0) A.restore(A.hi - 1); };
  A.redo = () => { if (A.mode === 'edit' && A.hi < A.hist.length - 1) A.restore(A.hi + 1); };

  A.renderAll = function () {
    A.renderList();
    if (A.mode === 'edit') { A.renderBoard(); A.renderInspector(); }
    $('#btnUndo').disabled = !(A.mode === 'edit' && A.hi > 0);
    $('#btnRedo').disabled = !(A.mode === 'edit' && A.hi < A.hist.length - 1);
  };

  /* ---------- level list ---------- */
  A.renderList = function () {
    const q = ($('#levelSearch').value || '').toLowerCase().trim();
    const ul = $('#levelList');
    $('#levelCount').textContent = `(${A.store.order.length})`;
    ul.innerHTML = A.store.order.map((k, i) => {
      const j = A.store.levels[k];
      const name = (j.meta && j.meta.name) || '';
      const diff = (j.meta && j.meta.difficulty) || '';
      if (q && !(String(j.id).toLowerCase().includes(q) || name.toLowerCase().includes(q) || diff.toLowerCase().includes(q))) return '';
      const st = A.levelStatus(k);
      return `<li data-key="${k}" draggable="true" class="${k === A.key ? 'on' : ''}" title="${esc(j.id)}">
        <span class="n">${i + 1}</span>
        <span class="nm"><b>${esc(name || j.id)}</b><small>${esc(j.id)}${diff ? `<span class="diff">${esc(diff)}</span>` : ''}${A.dir && A.dirty[k] ? ' •' : ''}</small></span>
        <span class="dot ${st === 'ok' ? '' : st}" title="${st === 'ok' ? 'No problems' : st === 'warn' ? 'Has warnings' : 'Has errors'}"></span>
      </li>`;
    }).join('');
  };
  A.bindList = function () {
    const ul = $('#levelList');
    ul.addEventListener('click', e => { const li = e.target.closest('li[data-key]'); if (li && li.dataset.key !== A.key) A.openLevel(li.dataset.key); });
    let dragKey = null;
    ul.addEventListener('dragstart', e => { const li = e.target.closest('li'); if (!li) return; dragKey = li.dataset.key; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragKey); });
    ul.addEventListener('dragover', e => {
      if (!dragKey) return; e.preventDefault();
      $$('li', ul).forEach(li => li.classList.remove('drop'));
      const li = e.target.closest('li'); if (li) li.classList.add('drop');
    });
    ul.addEventListener('dragend', () => { dragKey = null; $$('li', ul).forEach(li => li.classList.remove('drop')); });
    ul.addEventListener('drop', e => {
      e.preventDefault();
      const li = e.target.closest('li[data-key]');
      if (!dragKey) return;
      // dropping outside a level (a slip of the mouse) leaves the order alone
      if (!li || li.dataset.key === dragKey) { dragKey = null; A.renderList(); return; }
      const o = A.store.order;
      o.splice(o.indexOf(dragKey), 1);
      let at = o.indexOf(li.dataset.key);
      const r = li.getBoundingClientRect();
      if (at === o.length - 1 && e.clientY > r.top + r.height / 2) at = o.length;   // lower half of the last level: move to the end
      o.splice(at < 0 ? o.length : at, 0, dragKey);
      dragKey = null; A.saveSoon(); A.renderList();
    });
    $('#levelSearch').addEventListener('input', A.renderList);
    $('#btnNew').onclick = () => {
      const m = CS.blankLevel(A.nextId());
      const at = A.key ? A.store.order.indexOf(A.key) + 1 : -1;
      A.openLevel(A.addLevel(CS.toJSON(m), at));
      A.tab = 'level'; A.renderInspector();
      A.toast('New level created');
    };
    $('#btnDup').onclick = () => {
      if (!A.key) return;
      const j = CS.clone(A.store.levels[A.key]);
      j.id = A.nextId();
      j.meta = Object.assign({}, j.meta, { name: ((j.meta && j.meta.name) || '') + ' copy' });
      A.openLevel(A.addLevel(j, A.store.order.indexOf(A.key) + 1));
      A.toast('Duplicated as ' + j.id);
    };
    $('#btnDel').onclick = () => {
      if (!A.key) return;
      const j = A.store.levels[A.key];
      if (!confirm(`Delete "${(j.meta && j.meta.name) || j.id}" (${j.id}) from the list?` + (A.files[A.key] ? '\nThe file in the linked folder is not deleted.' : ''))) return;
      const i = A.store.order.indexOf(A.key);
      A.store.order.splice(i, 1); delete A.store.levels[A.key]; delete A.files[A.key];
      A.saveStore();
      if (!A.store.order.length) A.addLevel(CS.toJSON(CS.blankLevel(A.nextId())));
      A.openLevel(A.store.order[Math.min(i, A.store.order.length - 1)]);
    };
  };

  /* ---------- import / export ---------- */
  const looksLikeConveyor = j => j && typeof j === 'object' && !Array.isArray(j) && !Array.isArray(j.lanes) &&
    !!(j.loop || j.shape || j.path || j.points || j.svgPath || j.d || j.waypoints || j.cells || j.entries || j.entryPoints);
  const looksLikeLevel = j => j && typeof j === 'object' && !Array.isArray(j) && !looksLikeConveyor(j) && (Array.isArray(j.lanes) || (j.feeders && typeof j.feeders === 'object'));
  A.importTexts = function (texts) {   // [{name, text}]
    const levels = [], convs = [], bad = [];
    texts.forEach(({ name, text }) => {
      let j;
      try { j = JSON.parse(text); } catch (e) { bad.push(name); return; }
      const list = Array.isArray(j) ? j : Array.isArray(j.levels) ? j.levels : Array.isArray(j.conveyors) ? j.conveyors : [j];
      list.forEach(x => {
        if (looksLikeLevel(x)) levels.push({ name, j: x });
        else if (looksLikeConveyor(x)) convs.push({ name, j: x });
        else bad.push(name);
      });
    });
    convs.forEach(c => { try { A.addConveyor(CS.normConveyor(c.j, c.name.replace(/\.json$/i, ''))); } catch (e) { bad.push(c.name); } });
    let firstKey = null;
    if (levels.length) {
      const byId = {};
      A.store.order.forEach(k => { byId[A.store.levels[k].id] = k; });
      const clash = levels.filter(l => byId[l.j.id]);
      let replace = false;
      if (clash.length) replace = confirm(`${clash.length} imported level${clash.length > 1 ? 's have ids' : ' has an id'} already in the list (${clash.slice(0, 4).map(l => l.j.id).join(', ')}${clash.length > 4 ? '…' : ''}).\n\nOK = replace them\nCancel = import as new copies`);
      levels.forEach(({ name, j }) => {
        const norm = CS.toJSON(CS.fromJSON(j));
        // keep the original object untouched where possible, but make sure editor-added keys are filled
        const k0 = byId[j.id];
        let key;
        if (k0 && replace) { A.store.levels[k0] = norm; key = k0; }
        else {
          if (k0) norm.id = A.nextId(j.id + '_copy');
          if (!norm.id) norm.id = A.nextId();
          key = A.addLevel(norm);
        }
        if (A.dir && name) A.files[key] = name;
        firstKey = firstKey || key;
      });
      A.saveStore();
    }
    const parts = [];
    if (levels.length) parts.push(`${levels.length} level${levels.length > 1 ? 's' : ''}`);
    if (convs.length) parts.push(`${convs.length} conveyor config${convs.length > 1 ? 's' : ''}`);
    A.toast((parts.length ? 'Imported ' + parts.join(' and ') : 'Nothing imported') + (bad.length ? ` · skipped ${bad.length} file(s) that were not level or conveyor JSON` : ''), 3500);
    if (firstKey) A.openLevel(firstKey); else A.renderAll();
    return { levels: levels.length, convs: convs.length, bad };
  };
  A.levelText = key => CS.stringifyLevel(A.store.levels[key || A.key]);
  A.exportCurrent = function () {
    if (!A.key) return;
    A.download(A.store.levels[A.key].id + '.json', A.levelText());
  };
  A.loadScript = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  A.exportAll = async function () {
    const order = A.store.order;
    try {
      if (!window.JSZip) await A.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
      const zip = new window.JSZip();
      const names = new Set();
      order.forEach((k, i) => {
        let n = A.store.levels[k].id + '.json';
        while (names.has(n)) n = n.replace(/\.json$/, '_' + i + '.json');
        names.add(n);
        zip.file(n, A.levelText(k));
      });
      zip.file('_level_order.json', JSON.stringify(order.map(k => A.store.levels[k].id), null, 2));
      const blob = await zip.generateAsync({ type: 'blob' });
      A.download('levels.zip', blob);
      A.toast(`Exported ${order.length} levels as levels.zip`);
    } catch (e) {
      A.download('levels_bundle.json', JSON.stringify({ levels: order.map(k => A.store.levels[k]) }, null, 2));
      A.toast('Zip library could not load (offline?), so the levels were exported as one bundle JSON.', 4000);
    }
  };

  /* linked folder (File System Access API: Chrome and Edge) */
  A.openFolder = async function () {
    if (!window.showDirectoryPicker) { A.toast('Opening a folder needs Chrome or Edge. Use Import / Export instead.', 4000); return; }
    let dir;
    try { dir = await window.showDirectoryPicker({ mode: 'readwrite' }); } catch (e) { return; }
    A.dir = dir;
    const texts = [];
    const walk = async (d, prefix, depth) => {
      for await (const [name, h] of d.entries()) {
        if (h.kind === 'file' && /\.json$/i.test(name)) { const f = await h.getFile(); texts.push({ name: prefix + name, text: await f.text() }); }
        else if (h.kind === 'directory' && depth < 1 && !name.startsWith('.')) await walk(h, prefix + name + '/', depth + 1);
      }
    };
    await walk(dir, '', 0);
    const before = new Set(A.store.order);
    A.importTexts(texts);
    A.store.order.forEach(k => { if (!before.has(k)) A.dirty[k] = false; });
    $('#folderInfo').textContent = 'Linked folder: ' + dir.name + ' · Ctrl+S saves the open level there';
    $('#btnFolder').textContent = 'Save all to folder';
    A.renderList();
  };
  A.writeFile = async function (key) {
    const j = A.store.levels[key];
    let name = A.files[key] || (j.id + '.json');
    const parts = name.split('/');
    let d = A.dir;
    for (let i = 0; i < parts.length - 1; i++) d = await d.getDirectoryHandle(parts[i], { create: true });
    const fh = await d.getFileHandle(parts[parts.length - 1], { create: true });
    const w = await fh.createWritable();
    await w.write(A.levelText(key)); await w.close();
    A.files[key] = name; A.dirty[key] = false;
    return name;
  };
  A.save = async function () {
    if (!A.dir) { A.exportCurrent(); return; }
    try { const n = await A.writeFile(A.key); A.toast('Saved ' + n); A.renderList(); }
    catch (e) { A.toast('Could not save: ' + e.message, 4000); }
  };
  A.saveAll = async function () {
    let n = 0;
    try { for (const k of A.store.order) { await A.writeFile(k); n++; } A.toast(`Saved ${n} levels to ${A.dir.name}`); }
    catch (e) { A.toast('Could not save: ' + e.message, 4000); }
    A.renderList();
  };

  /* ---------- palette & tools ---------- */
  A.renderPalette = function () {
    $('#palette').innerHTML = [1, 2, 3, 4, 5, 6, 7, 8].map(c =>
      `<button class="swatch c${c} ${CS.LIGHT[c] ? 'l' : ''} ${A.brush === c ? 'on' : ''}" data-c="${c}" title="${CS.COLORS[c].name} (${c})"><span>${c}</span></button>`).join('');
  };
  A.setBrush = c => { A.brush = c; A.renderPalette(); };
  A.setTool = function (t) {
    A.tool = t; A.linkFirst = null;
    $$('#toolSeg button').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
    if (A.mode === 'edit') A.renderBoard();
  };

  /* ---------- board (edit mode) ---------- */
  const linkLetters = m => {
    const map = {};
    m.links.forEach(([a, b], i) => { const L = String.fromCharCode(65 + (i % 26)) + (i >= 26 ? Math.floor(i / 26) : ''); map[a] = L; map[b] = L; });
    return map;
  };
  CS.boxHTML = function (b, cap, o) {
    o = o || {};
    const cls = ['box', 'c' + b.color];
    if (CS.LIGHT[b.color]) cls.push('l');
    if (b.hidden) cls.push('hid');
    if (o.sel) cls.push('sel');
    if (o.extra) cls.push(o.extra);
    const label = o.showHidden === false && b.hidden ? '' : cap;
    return `<div class="${cls.join(' ')}" data-uid="${b.uid}" ${o.drag ? 'draggable="true"' : ''} title="${o.title || ''}">` +
      `<b>${label}</b>${b.size > 1 ? `<i class="sz">×${b.size}</i>` : ''}` +
      `${b.lock > 0 ? `<span class="lk">🔒${b.lock}</span>` : ''}${o.link ? `<span class="ln">⛓${o.link}</span>` : ''}` +
      `${o.fill != null ? `<span class="fillt"><span class="fill" style="width:${o.fill * 100}%"></span></span>` : ''}</div>`;
  };

  A.renderBoard = function () {
    const m = A.m; if (!m) return;
    const board = $('#board');
    board.classList.remove('play', 'mode-hand', 'mode-magnet');
    $('#banner').classList.add('hidden');
    const g = A.geom(m.conveyor);
    // feeders
    const fh = CS.ENTRIES.map(entry => {
      const fi = m.feeders.findIndex(f => f.entry === entry);
      if (fi < 0) {
        if (g.entryT[entry] == null) return `<div class="feeder-empty na">No ${entry} entry on this conveyor</div>`;
        return `<div class="feeder-empty"><button data-act="addFeeder" data-entry="${entry}" ${m.feeders.length >= 3 ? 'disabled' : ''}>+ ${CS.ENTRY_LABEL[entry]} Enter Path</button></div>`;
      }
      const f = m.feeders[fi];
      const sel = A.sel || {};
      const items = f.rows.reduce((a, r) => a + r.cells.filter(c => c > 0).length, 0);
      const rows = f.rows.map((r, ri) => {
        const isSel = sel.type === 'row' && sel.f === fi && sel.r === ri;
        return `<div class="frow ${r.hidden ? 'hid' : ''} ${r.lock > 0 ? 'lk' : ''} ${isSel ? 'sel' : ''}" data-f="${fi}" data-r="${ri}">
          <span class="ri" title="Row ${ri + 1} (row 1 enters the conveyor first)">${ri + 1}</span>
          ${r.cells.map((c, k) => `<span class="cell ${c > 0 ? 'c' + c : 'empty'}" data-k="${k}"></span>`).join('')}
          <span class="fb">${r.hidden ? '?' : ''}${r.lock > 0 ? '🔒' + r.lock : ''}</span></div>`;
      }).join('');
      const doorOn = m.doorTurns > 0;
      return `<div class="feeder ${sel.type === 'feeder' && sel.f === fi ? 'sel' : ''}" data-f="${fi}">
        <div class="fh" data-f="${fi}">${CS.ENTRY_LABEL[entry]} <small>${f.rows.length} rows · ${items} items</small>
          ${doorOn ? `<span class="door ${f.doorShut ? 'shut' : ''}">${f.doorShut ? 'shut' : 'open'}</span>` : ''}</div>
        <div class="frows">${rows || '<div class="hint" style="text-align:center">No rows yet</div>'}</div>
        <div class="ff"><button data-act="addRow" data-f="${fi}" title="Add a row at the back filled with the brush colour">+ Row</button><button data-act="addRows" data-f="${fi}" title="Add several rows">+ Rows…</button></div>
      </div>`;
    });
    $('#feeders').innerHTML = fh.join('');
    // conveyor preview with the start state
    A.drawConveyorPreview();
    // slots
    let sh = '';
    for (let i = 0; i < m.slots + m.extraSlots; i++) {
      const rv = i >= m.slots;
      const lock = !rv && m.slotLocks[i] > 0 ? m.slotLocks[i] : 0;
      const isSel = A.sel && A.sel.type === 'slot' && A.sel.i === i;
      sh += `<div class="slot ${rv ? 'rv' : ''} ${isSel ? 'sel' : ''}" data-slot="${i}" title="${rv ? 'RV slot: unlocked by watching an ad' : 'Slot ' + (i + 1)}">${lock ? `<span class="lockb">🔒${lock}</span>` : `<small style="color:var(--muted)">${i + 1}</small>`}</div>`;
    }
    $('#slots').innerHTML = sh;
    // queues
    const L = linkLetters(m);
    const qh = m.lanes.map((lane, l) => {
      const blocked = m.blockedLane && m.blockedLane.lane === l;
      const turn = m.blockedLane && !blocked && m.blockedLane.lane2 === l;   // blocked after the first switch
      const isSel = A.sel && A.sel.type === 'lane' && A.sel.l === l;
      return `<div class="lane ${blocked ? 'blocked' : ''} ${isSel ? 'sel' : ''}" data-l="${l}">
        <div class="lh" data-l="${l}" title="Queue ${l + 1}: select for queue options">Q${l + 1} · ${lane.length}${blocked ? ` <span class="blk">⛔${m.blockedLane.lockTurns}</span>` : ''}${turn ? ' <span class="blk" title="Takes turns being blocked">⇄</span>' : ''}</div>
        ${lane.map((b, t) => CS.boxHTML(b, CS.boxItems(b.size), {
          sel: A.sel && A.sel.type === 'box' && A.sel.uid === b.uid, link: L[b.uid], drag: true,
          extra: A.linkFirst === b.uid ? 'linkpick' : '',
          title: `${CS.COLORS[b.color].name} · capacity ${CS.boxItems(b.size)}${b.hidden ? ' · hidden' : ''}${b.lock ? ' · locked ' + b.lock : ''}${L[b.uid] ? ' · link ' + L[b.uid] : ''}`
        })).join('')}
        <button class="addbox" data-act="addBox" data-l="${l}" title="Add a box with the brush colour">+</button>
      </div>`;
    }).join('');
    $('#queues').innerHTML = qh + `<button class="addlane" data-act="addLane" title="Add a queue">+ Queue</button>`;
    const fx = $('#fx'); CS.fitCanvas(fx).ctx.clearRect(0, 0, fx.clientWidth, fx.clientHeight);
  };

  A.drawConveyorPreview = function () {
    const m = A.m, cfg = A.conv(m.conveyor), g = A.geom(m.conveyor);
    const canvas = $('#convCanvas');
    let state = null, G = null;
    try { G = new CS.Game(m, g, { prefill: true }); state = { rows: G.rows, shift: 0, phase: 0 }; } catch (e) { G = null; }
    const view = new CS.ConvView(canvas, g);
    view.draw(state, A.gatesFor(m, g, G), { caption: Object.keys(g.feederPaths || {}).length ? '' : `${cfg.name}${cfg.missing ? ' (missing config)' : ''}\n${cfg.rows} rows · ${cfg.rows * CS.ROW_W} spots` });
  };
  A.gatesFor = function (m, g, game) {
    return CS.ENTRIES.filter(e => g.entryT[e] != null).map(entry => {
      if (game) {
        const f = game.feeders.find(x => x.entry === entry);
        if (!f) return { entry, label: CS.ENTRY_LABEL[entry], short: entry[0].toUpperCase(), active: false };
        return { entry, label: CS.ENTRY_LABEL[entry], short: entry[0].toUpperCase(), shut: f.shut, countdown: game.doorTurns > 0 ? game.doorCount : null, preview: f.rows.slice(0, 3) };
      }
      const f = m.feeders.find(x => x.entry === entry);
      if (!f) return { entry, label: CS.ENTRY_LABEL[entry], short: entry[0].toUpperCase(), active: false };
      return {
        entry, label: CS.ENTRY_LABEL[entry], short: entry[0].toUpperCase(), shut: m.doorTurns > 0 && f.doorShut, countdown: m.doorTurns > 0 ? m.doorTurns : null,
        preview: [], hiddenRows: [], lockRows: []
      };
    });
  };

  /* board interactions (edit) */
  A.bindBoard = function () {
    const board = $('#board');
    let painting = false, painted = false;
    const paintCell = el => {
      const row = el.closest('.frow'); if (!row) return;
      const f = +row.dataset.f, r = +row.dataset.r, k = +el.dataset.k;
      const cells = A.m.feeders[f].rows[r].cells;
      if (cells[k] !== A.brush) { cells[k] = A.brush; el.className = 'cell c' + A.brush; painted = true; }
    };
    board.addEventListener('mousedown', e => {
      if (A.mode !== 'edit') return;
      const cell = e.target.closest('.cell');
      if (cell && A.tool === 'paint' && e.button === 0) { painting = true; painted = false; paintCell(cell); e.preventDefault(); }
    });
    board.addEventListener('mouseover', e => {
      if (!painting) return;
      const cell = e.target.closest('.cell'); if (cell) paintCell(cell);
    });
    window.addEventListener('mouseup', () => { if (painting) { painting = false; if (painted) A.commit(); } });
    board.addEventListener('contextmenu', e => {
      if (A.mode !== 'edit') return;
      const cell = e.target.closest('.cell');
      if (cell) {           // right click clears a cell
        e.preventDefault();
        const row = cell.closest('.frow');
        A.m.feeders[+row.dataset.f].rows[+row.dataset.r].cells[+cell.dataset.k] = 0;
        A.commit();
      }
    });
    board.addEventListener('click', e => {
      if (A.mode !== 'edit') return;
      const act = e.target.closest('[data-act]');
      if (act) { A.action(act.dataset.act, act.dataset); return; }
      const cell = e.target.closest('.cell');
      if (cell) {
        if (A.tool === 'paint') return;
        const row = cell.closest('.frow');
        if (A.tool === 'select' && e.altKey) {   // alt-click: pick colour
          const c = A.m.feeders[+row.dataset.f].rows[+row.dataset.r].cells[+cell.dataset.k]; if (c > 0) A.setBrush(c); return;
        }
        A.select({ type: 'row', f: +row.dataset.f, r: +row.dataset.r });
        return;
      }
      const ri = e.target.closest('.frow');
      if (ri) { A.select({ type: 'row', f: +ri.dataset.f, r: +ri.dataset.r }); return; }
      const fh = e.target.closest('.fh');
      if (fh) { A.select({ type: 'feeder', f: +fh.dataset.f }); return; }
      const box = e.target.closest('.box');
      if (box) { A.clickBox(box.dataset.uid, e); return; }
      const lh = e.target.closest('.lh');
      if (lh) { A.select({ type: 'lane', l: +lh.dataset.l }); return; }
      const slot = e.target.closest('.slot');
      if (slot) { A.select({ type: 'slot', i: +slot.dataset.slot }); return; }
      if (e.target === board || e.target.closest('.conv')) A.select(null);
    });
    // drag boxes between queues
    let dragUid = null;
    board.addEventListener('dragstart', e => {
      const b = e.target.closest('.box');
      if (!b || A.mode !== 'edit') return;
      dragUid = b.dataset.uid; b.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragUid);
    });
    board.addEventListener('dragend', () => { dragUid = null; $$('.lane', board).forEach(l => l.classList.remove('dragover')); });
    board.addEventListener('dragover', e => {
      if (!dragUid) return;
      const lane = e.target.closest('.lane'); if (!lane) return;
      e.preventDefault();
      $$('.lane', board).forEach(l => l.classList.toggle('dragover', l === lane));
    });
    board.addEventListener('drop', e => {
      if (!dragUid) return;
      const lane = e.target.closest('.lane'); if (!lane) return;
      e.preventDefault();
      const l = +lane.dataset.l;
      const boxes = $$('.box', lane).filter(x => x.dataset.uid !== dragUid);
      let at = boxes.length;
      for (let i = 0; i < boxes.length; i++) { const r = boxes[i].getBoundingClientRect(); if (e.clientY < r.top + r.height / 2) { at = i; break; } }
      const p = CS.boxPos(A.m, dragUid);
      const [b] = A.m.lanes[p.lane].splice(p.tray, 1);
      A.m.lanes[l].splice(at, 0, b);
      dragUid = null;
      A.sel = { type: 'box', uid: b.uid };
      A.commit();
    });
  };

  A.clickBox = function (uid, e) {
    const m = A.m;
    const p = CS.boxPos(m, uid); if (!p) return;
    const b = m.lanes[p.lane][p.tray];
    if (A.tool === 'paint') { if (b.color !== A.brush) { b.color = A.brush; A.commit(); } return; }
    if (A.tool === 'link') {
      const li = m.links.findIndex(L => L.includes(uid));
      if (!A.linkFirst && li >= 0) { m.links.splice(li, 1); A.toast('Link removed'); A.commit(); return; }
      if (!A.linkFirst) { A.linkFirst = uid; A.renderBoard(); A.toast('Now click a box in a neighbouring queue'); return; }
      if (A.linkFirst === uid) { A.linkFirst = null; A.renderBoard(); return; }
      const q = CS.boxPos(m, A.linkFirst);
      if (q && q.lane === p.lane) { A.toast('Linked boxes must sit in two different queues'); return; }
      if (q && Math.abs(q.lane - p.lane) > 1) { A.toast('Linked boxes must sit in neighbouring queues'); return; }
      m.links = m.links.filter(L => !L.includes(uid) && !L.includes(A.linkFirst));
      m.links.push([A.linkFirst, uid]);
      A.linkFirst = null;
      A.toast('Boxes linked');
      A.commit();
      return;
    }
    if (e && e.altKey) { A.setBrush(b.color); return; }
    A.select({ type: 'box', uid });
  };

  A.select = function (s) {
    A.sel = s;
    if (s) A.tab = 'sel';
    A.renderBoard(); A.renderInspector();
  };

  A.action = function (act, d) {
    const m = A.m;
    switch (act) {
      case 'addFeeder': {
        if (m.feeders.length >= 3) return;
        m.feeders.push({ entry: d.entry, doorShut: false, rows: [{ cells: [A.brush, A.brush, A.brush, A.brush], hidden: false, lock: 0 }], extra: {} });
        m.feeders.sort((a, b) => CS.ENTRIES.indexOf(a.entry) - CS.ENTRIES.indexOf(b.entry));
        A.sel = { type: 'feeder', f: m.feeders.findIndex(f => f.entry === d.entry) };
        A.commit(); break;
      }
      case 'addRow': {
        const f = m.feeders[+d.f];
        f.rows.push({ cells: [A.brush, A.brush, A.brush, A.brush], hidden: false, lock: 0 });
        A.sel = { type: 'row', f: +d.f, r: f.rows.length - 1 };
        A.commit(); break;
      }
      case 'addRows': A.dialogAddRows(+d.f); break;
      case 'addBox': {
        const b = { uid: CS.uid(), color: A.brush, size: 1, hidden: false, lock: 0, extra: {} };
        m.lanes[+d.l].push(b); A.sel = { type: 'box', uid: b.uid };
        A.commit(); break;
      }
      case 'addLane': m.lanes.push([]); A.sel = { type: 'lane', l: m.lanes.length - 1 }; A.commit(); break;
    }
  };

  /* ---------- inspector (edit) ---------- */
  const field = (label, html, hint) => `<label class="field"><span>${label}</span><div class="inline">${html}</div></label>${hint ? `<div class="hint">${hint}</div>` : ''}`;
  const num = (key, v, min, max, extra) => `<input type="number" data-k="${key}" value="${v}" min="${min}" ${max != null ? `max="${max}"` : ''} ${extra || ''}>`;
  const colorPick = (cur, key) => `<div class="colorpick">${[1, 2, 3, 4, 5, 6, 7, 8].map(c => `<button type="button" class="swatch c${c} ${CS.LIGHT[c] ? 'l' : ''} ${cur === c ? 'on' : ''}" data-set="${key}" data-v="${c}" title="${CS.COLORS[c].name}"><span>${c}</span></button>`).join('')}</div>`;

  A.renderInspector = function () {
    const ins = $('#inspector');
    if (A.mode !== 'edit' || !A.m) return;
    const m = A.m, cfg = A.conv(m.conveyor), g = A.geom(m.conveyor);
    const val = CS.validate(m, Object.assign({}, cfg, { entryT: g.entryT }));
    if (cfg.missing) val.unshift({ level: 'warn', msg: `Conveyor "${m.conveyor}" is not loaded, so a stand-in shape is used. Import its config under Conveyors.` });
    const nErr = val.filter(x => x.level === 'error').length, nWarn = val.filter(x => x.level === 'warn').length;
    const tabs = `<div class="tabs">
      <button data-tab="level" class="${A.tab === 'level' ? 'on' : ''}">Level</button>
      <button data-tab="sel" class="${A.tab === 'sel' ? 'on' : ''}">Selected</button>
      <button data-tab="check" class="${A.tab === 'check' ? 'on' : ''}">Check${nErr ? `<span class="badge">${nErr}</span>` : nWarn ? `<span class="badge warn">${nWarn}</span>` : ''}</button></div>`;
    let body = '';
    if (A.tab === 'level') body = A.paneLevel(m, cfg, g);
    else if (A.tab === 'sel') body = A.paneSel(m);
    else body = A.paneCheck(m, val);
    ins.innerHTML = tabs + `<div class="pane">${body}</div>`;
  };

  A.paneLevel = function (m, cfg, g) {
    const convOpts = A.convOrder.map(id => `<option value="${esc(id)}" ${id === m.conveyor ? 'selected' : ''}>${esc(A.conveyors[id].name)} (${A.conveyors[id].rows} rows)</option>`).join('') +
      (A.conveyors[m.conveyor] ? '' : `<option selected value="${esc(m.conveyor)}">${esc(m.conveyor)} (not loaded)</option>`);
    let locks = '';
    for (let i = 0; i < m.slots; i++) locks += `<label title="Slot ${i + 1} lock turns (0 = unlocked)">${i + 1}: ${num('slotLock:' + i, m.slotLocks[i] || 0, 0, 99, 'style="width:52px"')}</label>`;
    const doors = m.feeders.map((f, i) => `<label class="chk"><input type="checkbox" data-k="doorShut:${i}" ${f.doorShut ? 'checked' : ''}> ${CS.ENTRY_LABEL[f.entry]} shut</label>`).join(' ');
    const laneOpts = `<option value="-1">None</option>` + m.lanes.map((_, i) => `<option value="${i}" ${m.blockedLane && m.blockedLane.lane === i ? 'selected' : ''}>Queue ${i + 1}</option>`).join('');
    const lane2Opts = m.lanes.map((_, i) => `<option value="${i}" ${m.blockedLane && m.blockedLane.lane2 === i ? 'selected' : ''}>Queue ${i + 1}</option>`).join('');
    const extraKeys = Object.keys(m.extra || {});
    return `<h3>Level</h3>
      ${field('Name', `<input type="text" data-k="name" value="${esc(m.meta.name)}" style="width:100%">`)}
      ${field('Level id', `<input type="text" data-k="id" value="${esc(m.id)}" style="width:100%">`)}
      ${field('Difficulty', `<input type="text" data-k="difficulty" list="diffList" value="${esc(m.meta.difficulty || '')}" style="width:100%"><datalist id="diffList"><option>easy</option><option>medium</option><option>hard</option><option>super hard</option></datalist>`)}
      <h3>Conveyor</h3>
      ${field('Config', `<select data-k="conveyor" style="width:100%">${convOpts}</select>`)}
      <div class="hint">${cfg.rows} rows × ${CS.ROW_W} = ${cfg.rows * CS.ROW_W} spots · entries: ${CS.ENTRIES.filter(e => g.entryT[e] != null).map(e => CS.ENTRY_LABEL[e]).join(', ') || 'none'} · <a href="#" data-open="conveyors">manage / import</a></div>
      <h3>Slots</h3>
      ${field('Slots', num('slots', m.slots, 1, CS.MAX_SLOTS))}
      ${field('RV slots', num('extraSlots', m.extraSlots, 0, CS.MAX_SLOTS), 'Extra slots the player can unlock with a rewarded ad (GDD 1.3: max 6 slots in total).')}
      ${field('Locked Slot', `<div class="inline">${locks}</div>`, 'Lock turns per slot. Each box sent lowers it by 1.')}
      <h3>Boxes</h3>
      <div class="hint">A box's size sets how many items it holds: 1 = 16, 2 = 24, 3 = 32, 4 = 40.</div>
      <h3>Block Door</h3>
      ${field('Turns', num('doorTurns', m.doorTurns, 0, 99), '0 = no Block Door. When the count reaches 0, shut doors open and open doors shut.')}
      ${m.doorTurns > 0 ? field('Start state', doors || '<span class="hint">Add an Enter Path first</span>') : ''}
      <h3>Block Queue</h3>
      ${field('Starts blocked', `<select data-k="blockLane">${laneOpts}</select>`)}
      ${m.blockedLane ? field('Takes turns with', `<select data-k="blockLane2">${lane2Opts}</select>`, 'The two queues take turns being blocked; the other queues are never blocked.') : ''}
      ${m.blockedLane ? field('Turns', num('blockTurns', m.blockedLane.lockTurns, 1, 99), 'Counts boxes sent from the other queues, then the block switches to the other queue of the pair.') : ''}
      <h3>Other</h3>
      ${field('Camera preset', `<input type="text" data-k="camera" value="${esc(m.view && m.view.cameraPreset || '')}">`)}
      ${field('Format version', num('formatVersion', m.formatVersion, 1, 99))}
      ${extraKeys.length ? `<div class="hint">Kept as-is on export: ${extraKeys.map(esc).join(', ')}</div>` : ''}`;
  };

  A.paneSel = function (m) {
    const s = A.sel;
    if (!s) return `<div class="hint">Click a box, an Enter Path row, a slot or a queue header to edit it.<br><br>
      <b>Tools</b><br>Select <kbd>V</kbd> · Paint <kbd>B</kbd> · Link <kbd>L</kbd><br>
      <kbd>1</kbd>–<kbd>8</kbd> pick the brush colour, or recolour the selection.<br>
      Paint: drag over item cells; right-click clears a cell.<br>Alt+click picks a colour.<br>Drag boxes to reorder them or move them between queues.</div>`;
    if (s.type === 'box') {
      const p = CS.boxPos(m, s.uid); if (!p) return '';
      const b = m.lanes[p.lane][p.tray];
      const link = m.links.find(L => L.includes(b.uid));
      let linkTxt = 'Not linked. Use the Link tool <kbd>L</kbd> to link it.';
      if (link) { const o = CS.boxPos(m, link[0] === b.uid ? link[1] : link[0]); linkTxt = o ? `Linked to queue ${o.lane + 1}, box ${o.tray + 1}. <a href="#" data-do="unlink">Unlink</a>` : ''; }
      return `<h3>Box · queue ${p.lane + 1}, position ${p.tray + 1}</h3>
        ${field('Colour', colorPick(b.color, 'boxColor'))}
        ${field('Size', num('boxSize', b.size, 1, CS.MAX_BOX_SIZE), `Capacity ${CS.boxItems(b.size)} items (size 1 = 16, 2 = 24, 3 = 32, 4 = 40).`)}
        ${field('Hidden Box', `<label class="chk"><input type="checkbox" data-k="boxHidden" ${b.hidden ? 'checked' : ''}> hidden until it reaches the front</label>`)}
        ${field('Locked Box', num('boxLock', b.lock, 0, 99), 'Lock turns, 0 = not locked. Counts down only while the box is at the front of its queue: 1 for each box sent.')}
        ${field('Linked Box', `<span>${linkTxt}</span>`)}
        <div class="btnrow">
          <button data-do="boxUp" title="Move toward the front (↑)">↑ Front</button><button data-do="boxDown" title="Move back (↓)">↓ Back</button>
          <button data-do="boxLeft" title="Move to the queue on the left (←)">← Queue</button><button data-do="boxRight" title="Move to the queue on the right (→)">Queue →</button>
        </div>
        <div class="btnrow"><button data-do="boxDup">Duplicate</button><button data-do="boxDel" class="danger">Delete (Del)</button></div>`;
    }
    if (s.type === 'row') {
      const f = m.feeders[s.f]; const r = f && f.rows[s.r]; if (!r) return '';
      return `<h3>${CS.ENTRY_LABEL[f.entry]} Enter Path · row ${s.r + 1}</h3>
        <div class="hint">Row 1 enters the conveyor first. Each row is ${CS.ROW_W} items wide.</div>
        ${r.cells.map((c, k) => field('Item ' + (k + 1), colorPick(c, 'cell:' + k) + ` <button type="button" data-set="cell:${k}" data-v="0" title="Empty">∅</button>`)).join('')}
        ${field('Fill row', colorPick(0, 'rowFill'))}
        ${field('Hidden row', `<label class="chk"><input type="checkbox" data-k="rowHidden" ${r.hidden ? 'checked' : ''}> “?” until on the conveyor</label>`)}
        ${field('Locked Items', num('rowLock', r.lock, 0, 99), 'Lock turns for every item in this row, 0 = not locked. Counts down only once the items are on the conveyor: 1 for each box sent.')}
        <div class="btnrow"><button data-do="rowUp" title="Closer to the conveyor (↓ in the list)">Move earlier</button><button data-do="rowDown">Move later</button>
        <button data-do="rowIns">Insert row before</button><button data-do="rowDup">Duplicate</button><button data-do="rowDel" class="danger">Delete (Del)</button></div>`;
    }
    if (s.type === 'feeder') {
      const f = m.feeders[s.f]; if (!f) return '';
      const g = A.geom(m.conveyor);
      const opts = CS.ENTRIES.map(e => `<option value="${e}" ${f.entry === e ? 'selected' : ''} ${g.entryT[e] == null ? 'disabled' : ''}>${CS.ENTRY_LABEL[e]}</option>`).join('');
      return `<h3>Enter Path · ${CS.ENTRY_LABEL[f.entry]}</h3>
        ${field('Entry point', `<select data-k="feederEntry">${opts}</select>`, 'Swaps with the Enter Path already at that entry.')}
        ${m.doorTurns > 0 ? field('Block Door', `<label class="chk"><input type="checkbox" data-k="feederShut" ${f.doorShut ? 'checked' : ''}> starts shut</label>`) : ''}
        <div class="btnrow"><button data-do="feederReverse">Reverse row order</button><button data-do="feederShuffle">Shuffle rows</button><button data-do="feederClear">Clear rows</button></div>
        <div class="btnrow"><button data-do="feederDel" class="danger">Delete Enter Path</button></div>`;
    }
    if (s.type === 'slot') {
      const rv = s.i >= m.slots;
      return `<h3>Slot ${s.i + 1}${rv ? ' (RV)' : ''}</h3>` + (rv ? '<div class="hint">RV slots start locked and open when the player watches a rewarded ad. Change the number of RV slots on the Level tab.</div>' :
        field('Locked Slot', num('slotLock:' + s.i, m.slotLocks[s.i] || 0, 0, 99), 'Lock turns, 0 = unlocked. A sent box skips a locked slot.'));
    }
    if (s.type === 'lane') {
      const lane = m.lanes[s.l]; if (!lane) return '';
      const cap = lane.reduce((a, b) => a + CS.boxItems(b.size), 0);
      return `<h3>Queue ${s.l + 1}</h3><div class="hint">${lane.length} boxes · ${cap} items of capacity</div>
        ${field('Block Queue', `<label class="chk"><input type="checkbox" data-k="laneBlocked" ${m.blockedLane && m.blockedLane.lane === s.l ? 'checked' : ''}> starts blocked</label>`)}
        <div class="btnrow"><button data-do="laneLeft">← Move</button><button data-do="laneRight">Move →</button><button data-do="laneShuffle">Shuffle boxes</button><button data-do="laneReverse">Reverse</button></div>
        <div class="btnrow"><button data-do="laneDup">Duplicate</button><button data-do="laneDel" class="danger">Delete queue</button></div>`;
    }
    return '';
  };

  A.paneCheck = function (m, val) {
    const bal = CS.balance(m);
    let rows = '';
    for (let c = 1; c <= 8; c++) {
      if (!bal.items[c] && !bal.cap[c]) continue;
      const d = bal.items[c] - bal.cap[c];
      rows += `<tr><td><span class="mini c${c}"></span>${CS.COLORS[c].name}</td><td>${bal.boxes[c]}</td><td>${bal.cap[c]}</td><td>${bal.items[c]}</td><td class="${d ? 'bad' : ''}">${d > 0 ? '+' + d : d}</td></tr>`;
    }
    return `<h3>Problems</h3>
      <ul class="msgs">${val.map(v => `<li class="${v.level}">${esc(v.msg)}</li>`).join('')}</ul>
      <h3>Colour balance</h3>
      <table class="bal"><tr><th>Colour</th><th>Boxes</th><th>Capacity</th><th>Items</th><th>Diff</th></tr>${rows}</table>
      <div class="btnrow"><button data-do="fillRows">Fill items from boxes (rows)</button><button data-do="fillMixed">Fill items (mixed)</button></div>
      <div class="hint">Rebuilds every Enter Path so each colour has exactly as many items as its boxes hold. Hidden and locked rows are reset.</div>
      <h3>Solvability check</h3>
      <div class="hint">Plays the level 20 times with a simple bot (no boosters, no revive) and reports how often it wins.</div>
      <div class="btnrow"><button data-do="simulate">Run 20 bot plays</button></div><div id="simOut" class="hint"></div>`;
  };

  A.bindInspector = function () {
    const ins = $('#inspector');
    ins.addEventListener('click', e => {
      const t = e.target.closest('[data-tab]');
      if (t) { A.tab = t.dataset.tab; A.renderInspector(); return; }
      const o = e.target.closest('[data-open]');
      if (o) { e.preventDefault(); if (o.dataset.open === 'conveyors') A.dialogConveyors(); return; }
      const st = e.target.closest('[data-set]');
      if (st) { e.preventDefault(); A.setValue(st.dataset.set, +st.dataset.v); return; }
      const d = e.target.closest('[data-do]');
      if (d) { e.preventDefault(); A.doCmd(d.dataset.do); }
    });
    ins.addEventListener('change', e => {
      const k = e.target.dataset.k; if (!k) return;
      const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      A.setValue(k, v);
    });
  };

  A.setValue = function (k, v) {
    const m = A.m, s = A.sel || {};
    const n = Math.max(0, CS.int(v, 0));
    const box = () => { const p = CS.boxPos(m, s.uid); return p && m.lanes[p.lane][p.tray]; };
    const row = () => m.feeders[s.f] && m.feeders[s.f].rows[s.r];
    if (k.startsWith('slotLock:')) { const i = +k.split(':')[1]; if (n) m.slotLocks[i] = n; else delete m.slotLocks[i]; }
    else if (k.startsWith('doorShut:')) m.feeders[+k.split(':')[1]].doorShut = !!v;
    else if (k.startsWith('cell:')) { const r = row(); if (r) r.cells[+k.split(':')[1]] = n; }
    else switch (k) {
      case 'name': m.meta.name = String(v); break;
      case 'id': { const id = String(v).trim(); if (!id) return A.renderInspector(); m.id = id; break; }
      case 'difficulty': m.meta.difficulty = String(v); break;
      case 'conveyor': m.conveyor = String(v); {
        const g = A.geom(m.conveyor);
        m.feeders.forEach(f => { if (g.entryT[f.entry] == null) { const free = CS.ENTRIES.find(e => g.entryT[e] != null && !m.feeders.some(x => x.entry === e)); if (free) f.entry = free; } });
      } break;
      case 'slots': m.slots = Math.max(1, Math.min(CS.MAX_SLOTS, n)); break;
      case 'extraSlots': m.extraSlots = Math.min(CS.MAX_SLOTS, n); break;
      case 'doorTurns': m.doorTurns = n; break;
      case 'blockLane': { const l = CS.int(v, -1); m.blockedLane = l < 0 ? null : CS.startBlock(m, l); break; }
      case 'blockLane2': if (m.blockedLane) m.blockedLane.lane2 = CS.int(v, m.blockedLane.lane2); break;
      case 'blockTurns': if (m.blockedLane) m.blockedLane.lockTurns = Math.max(1, n); break;
      case 'camera': m.view = Object.assign({}, m.view || {}, { cameraPreset: String(v) }); break;
      case 'formatVersion': m.formatVersion = Math.max(1, n); break;
      case 'boxColor': { const b = box(); if (b) b.color = n; break; }
      case 'boxSize': { const b = box(); if (b) b.size = Math.max(1, Math.min(CS.MAX_BOX_SIZE, n)); break; }
      case 'boxHidden': { const b = box(); if (b) b.hidden = !!v; break; }
      case 'boxLock': { const b = box(); if (b) b.lock = n; break; }
      case 'rowFill': { const r = row(); if (r) r.cells = r.cells.map(() => n); break; }
      case 'rowHidden': { const r = row(); if (r) r.hidden = !!v; break; }
      case 'rowLock': { const r = row(); if (r) r.lock = n; break; }
      case 'feederEntry': {
        const f = m.feeders[s.f]; const other = m.feeders.find(x => x.entry === v);
        if (other) other.entry = f.entry;
        f.entry = String(v);
        m.feeders.sort((a, b) => CS.ENTRIES.indexOf(a.entry) - CS.ENTRIES.indexOf(b.entry));
        A.sel = { type: 'feeder', f: m.feeders.indexOf(f) };
        break;
      }
      case 'feederShut': m.feeders[s.f].doorShut = !!v; break;
      case 'laneBlocked': m.blockedLane = v ? CS.startBlock(m, s.l) : (m.blockedLane && m.blockedLane.lane === s.l ? null : m.blockedLane); break;
      default: return;
    }
    A.commit();
  };

  A.doCmd = function (c) {
    const m = A.m, s = A.sel || {};
    const p = s.type === 'box' ? CS.boxPos(m, s.uid) : null;
    const f = s.f != null ? m.feeders[s.f] : null;
    const moveArr = (arr, i, j) => { if (j < 0 || j >= arr.length) return false; const [x] = arr.splice(i, 1); arr.splice(j, 0, x); return true; };
    switch (c) {
      case 'unlink': m.links = m.links.filter(L => !L.includes(s.uid)); break;
      case 'boxUp': if (!p || !moveArr(m.lanes[p.lane], p.tray, p.tray - 1)) return; break;
      case 'boxDown': if (!p || !moveArr(m.lanes[p.lane], p.tray, p.tray + 1)) return; break;
      case 'boxLeft': case 'boxRight': {
        if (!p) return;
        const to = p.lane + (c === 'boxLeft' ? -1 : 1);
        if (to < 0 || to >= m.lanes.length) return;
        const [b] = m.lanes[p.lane].splice(p.tray, 1);
        m.lanes[to].splice(Math.min(p.tray, m.lanes[to].length), 0, b);
        break;
      }
      case 'boxDup': { if (!p) return; const b = m.lanes[p.lane][p.tray]; const nb = Object.assign(CS.clone(b), { uid: CS.uid() }); m.lanes[p.lane].splice(p.tray + 1, 0, nb); A.sel = { type: 'box', uid: nb.uid }; break; }
      case 'boxDel': { if (!p) return; m.lanes[p.lane].splice(p.tray, 1); m.links = m.links.filter(L => !L.includes(s.uid)); const nx = m.lanes[p.lane][Math.min(p.tray, m.lanes[p.lane].length - 1)]; A.sel = nx ? { type: 'box', uid: nx.uid } : null; break; }
      case 'rowUp': if (!f || !moveArr(f.rows, s.r, s.r - 1)) return; A.sel.r--; break;
      case 'rowDown': if (!f || !moveArr(f.rows, s.r, s.r + 1)) return; A.sel.r++; break;
      case 'rowIns': if (!f) return; f.rows.splice(s.r, 0, { cells: [A.brush, A.brush, A.brush, A.brush], hidden: false, lock: 0 }); break;
      case 'rowDup': if (!f) return; f.rows.splice(s.r + 1, 0, CS.clone(f.rows[s.r])); A.sel.r++; break;
      case 'rowDel': if (!f) return; f.rows.splice(s.r, 1); if (!f.rows.length) A.sel = { type: 'feeder', f: s.f }; else A.sel.r = Math.min(s.r, f.rows.length - 1); break;
      case 'feederReverse': if (!f) return; f.rows.reverse(); break;
      case 'feederShuffle': if (!f) return; CS.shuffle(f.rows); break;
      case 'feederClear': if (!f || !confirm('Remove every row from this Enter Path?')) return; f.rows = []; break;
      case 'feederDel': if (!f || !confirm('Delete this Enter Path and its items?')) return; m.feeders.splice(s.f, 1); A.sel = null; break;
      case 'laneLeft': case 'laneRight': {
        const to = s.l + (c === 'laneLeft' ? -1 : 1);
        if (!moveArr(m.lanes, s.l, to)) return;
        if (m.blockedLane) ['lane', 'lane2'].forEach(k => { if (m.blockedLane[k] === s.l) m.blockedLane[k] = to; else if (m.blockedLane[k] === to) m.blockedLane[k] = s.l; });
        A.sel = { type: 'lane', l: to }; break;
      }
      case 'laneShuffle': CS.shuffle(m.lanes[s.l]); break;
      case 'laneReverse': m.lanes[s.l].reverse(); break;
      case 'laneDup': { const nl = m.lanes[s.l].map(b => Object.assign(CS.clone(b), { uid: CS.uid() })); m.lanes.splice(s.l + 1, 0, nl); break; }
      case 'laneDel': {
        if (m.lanes[s.l].length && !confirm('Delete this queue and its boxes?')) return;
        const gone = new Set(m.lanes[s.l].map(b => b.uid));
        m.lanes.splice(s.l, 1);
        m.links = m.links.filter(L => !gone.has(L[0]) && !gone.has(L[1]));
        if (m.blockedLane) {
          const B = m.blockedLane;
          if (B.lane === s.l || B.lane2 === s.l) m.blockedLane = null;   // a pair needs both queues
          else { if (B.lane > s.l) B.lane--; if (B.lane2 > s.l) B.lane2--; }
        }
        A.sel = null; break;
      }
      case 'fillRows': case 'fillMixed':
        if (!confirm('Replace every item in the Enter Paths with items that match the boxes?')) return;
        CS.fillFeedersFromBoxes(m, { mode: c === 'fillMixed' ? 'mixed' : 'rows' });
        if (A.sel && A.sel.type === 'row') A.sel = null;
        break;
      case 'simulate': A.simulate(); return;
      default: return;
    }
    A.commit();
  };

  A.simulate = function () {
    const out = $('#simOut'); if (!out) return;
    out.textContent = 'Running…';
    setTimeout(() => {
      const g = A.geom(A.m.conveyor);
      let wins = 0, sends = 0, fs = 0, ticks = 0;
      const N = 20;
      for (let i = 0; i < N; i++) {
        const G = new CS.Game(A.m, g, { pickMode: A.prefs.pick });
        let n = 0;
        while (!G.over && n < 30000) { if (n % 3 === 0) G.botMove(); G.step(); n++; }
        if (G.over === 'win') { wins++; sends += G.sends; ticks += G.ticks; }
        if (G.failsafe) fs++;
      }
      out.innerHTML = `Bot won <b>${wins}/${N}</b>` + (wins ? ` · average ${Math.round(ticks / wins)} conveyor steps` : '') + (fs ? ` · fail-safe fired in ${fs} run${fs > 1 ? 's' : ''}` : '') +
        '.<br>The bot is greedy, so a low win rate means the level is hard or a box order can dead-end, not that it is impossible.';
    }, 20);
  };

  /* ---------- dialogs ---------- */
  A.dialog = function (html, onSubmit, onOpen) {
    const dlg = $('#dlg'), form = $('#dlgForm');
    form.innerHTML = html;
    form.onsubmit = e => {
      const btn = e.submitter;
      if (btn && btn.value === 'ok' && onSubmit) { if (onSubmit(new FormData(form), form) === false) { e.preventDefault(); return; } }
    };
    dlg.showModal();
    if (onOpen) onOpen(form);
  };

  A.dialogAddRows = function (fi) {
    A.dialog(`<h2>Add rows</h2>
      ${field('Rows', '<input type="number" name="n" value="4" min="1" max="200">')}
      ${field('Colour', `<select name="c">${[1, 2, 3, 4, 5, 6, 7, 8].map(c => `<option value="${c}" ${c === A.brush ? 'selected' : ''}>${c} · ${CS.COLORS[c].name}</option>`).join('')}<option value="r">Random (level colours)</option></select>`)}
      <div class="foot"><button value="cancel">Cancel</button><button value="ok" class="primary">Add</button></div>`,
      fd => {
        const n = Math.max(1, Math.min(200, CS.int(fd.get('n'), 1)));
        const c = fd.get('c');
        const pool = CS.usedColors(A.m).length ? CS.usedColors(A.m) : [1, 2, 3, 4];
        for (let i = 0; i < n; i++) {
          const col = c === 'r' ? pool[Math.floor(Math.random() * pool.length)] : +c;
          A.m.feeders[fi].rows.push({ cells: [col, col, col, col], hidden: false, lock: 0 });
        }
        A.commit();
      });
  };

  A.dialogRandom = function () {
    A.dialog(`<h2>Random level</h2>
      <div class="hint">Replaces the boxes and items of the open level. Settings such as conveyor and slots stay. You can undo.</div>
      ${field('Colours', '<input type="number" name="colors" value="6" min="1" max="8">')}
      ${field('Queues', '<input type="number" name="lanes" value="4" min="1" max="8">')}
      ${field('Boxes', '<input type="number" name="boxes" value="32" min="1" max="200">')}
      ${field('Enter Paths', '<input type="number" name="feeders" value="2" min="1" max="3">')}
      ${field('Size 2 boxes (24 items)', '<input type="number" name="big2" value="10" min="0" max="100"> %')}
      ${field('Size 3 boxes (32 items)', '<input type="number" name="big3" value="5" min="0" max="100"> %')}
      ${field('Hidden Boxes', '<input type="number" name="hidden" value="0" min="0" max="100"> %')}
      ${field('Items', '<select name="mode"><option value="rows">Rows of one colour</option><option value="mixed">Mixed colours</option></select>')}
      <div class="foot"><button value="cancel">Cancel</button><button value="ok" class="primary">Generate</button></div>`,
      fd => {
        const g = A.geom(A.m.conveyor);
        CS.randomLevel(A.m, {
          colors: CS.int(fd.get('colors'), 6), lanes: CS.int(fd.get('lanes'), 4), boxes: CS.int(fd.get('boxes'), 32),
          feeders: CS.int(fd.get('feeders'), 2), big2: CS.int(fd.get('big2'), 0) / 100, big3: CS.int(fd.get('big3'), 0) / 100,
          hidden: CS.int(fd.get('hidden'), 0) / 100, mode: fd.get('mode')
        });
        A.m.feeders.forEach(f => { if (g.entryT[f.entry] == null) { const free = CS.ENTRIES.find(e => g.entryT[e] != null && !A.m.feeders.some(x => x.entry === e)); if (free) f.entry = free; } });
        A.sel = null;
        A.commit();
      });
  };

  A.dialogConveyors = function () {
    const cards = () => A.convOrder.map(id => {
      const c = A.conveyors[id];
      return `<div class="conv-card ${A.m && A.m.conveyor === id ? 'on' : ''}" data-id="${esc(id)}">
        <canvas></canvas><b>${esc(c.name)}</b><small>${esc(id)} · ${c.rows} rows · ${c.source}</small>
        ${c.source !== 'preset' ? `<div><a href="#" data-del="${esc(id)}">Remove</a></div>` : ''}</div>`;
    }).join('');
    const draw = form => {
      $$('.conv-card', form).forEach(card => {
        const id = card.dataset.id;
        const g = A.geom(id);
        new CS.ConvView($('canvas', card), g).draw(null, CS.ENTRIES.filter(e => g.entryT[e] != null).map(e => ({ entry: e, label: e[0].toUpperCase() })), { compact: true });
      });
    };
    A.dialog(`<h2>Conveyor configs</h2>
      <div class="hint">Click a conveyor to use it for the open level. Import your premade conveyor JSON files; several files, or one file with an array, work too.</div>
      <div class="conv-list">${cards()}</div>
      <details style="margin-top:12px"><summary><b>Conveyor config format</b></summary>
      <div class="hint">Path points are listed in the direction the belt moves. Entry points can be a fraction of the loop (0 to 1), a row index, or an x/y point that is snapped to the path. Leave entries out to place them on the top edge at 25 / 50 / 75 %.</div>
<pre>{
  "formatVersion": 2,
  "id": "square_42",
  "rows": 42, "width": 4, "pickRows": 5, "scale": 0.46,
  "loop": { "nodes": [ { "x": 0.8, "z": 3.1, "yRotation": 270 }, ... ] },
  "feeders": [
    { "side": "left", "mergeAt": 13, "nodes": [ { "x": -2.7, "z": 11.7, "yRotation": 180 }, ... ] }
  ],
  "meta": { "name": "Rounded square" }
}</pre>
<div class="hint">loop.nodes are read in belt order, x / z in game units (z up the screen). mergeAt is the loop row where that Enter Path joins. Belts run counter-clockwise unless the config has "direction": "cw". Items fly straight to any box of their colour in the slots; pickRows is only used by the older Pickup zone rule in play test. Simpler configs with a "shape" (roundrect, circle, points, svg) and "entries" also import.</div></pre></details>
      <div class="foot"><button type="button" id="convImport">Import conveyor JSON…</button><span class="grow"></span><button value="cancel" class="primary">Close</button></div>`,
      null, form => {
        draw(form);
        form.onclick = e => {
          const del = e.target.closest('[data-del]');
          if (del) {
            e.preventDefault();
            const id = del.dataset.del;
            delete A.conveyors[id]; A.convOrder = A.convOrder.filter(x => x !== id); A.saveConveyors();
            $('.conv-list', form).innerHTML = cards(); draw(form); A.renderAll(); return;
          }
          const card = e.target.closest('.conv-card');
          if (card && A.m) { A.setValue('conveyor', card.dataset.id); $$('.conv-card', form).forEach(c => c.classList.toggle('on', c === card)); return; }
          if (e.target.id === 'convImport') {
            const inp = $('#fileConv');
            inp.onchange = async () => {
              const texts = [];
              for (const f of inp.files) texts.push({ name: f.name, text: await A.readFile(f) });
              inp.value = '';
              const n = A.importConveyorTexts(texts);
              $('.conv-list', form).innerHTML = cards(); draw(form);
              A.toast(n ? `Imported ${n} conveyor config${n > 1 ? 's' : ''}` : 'No conveyor configs found in those files', 3000);
              A.renderAll();
            };
            inp.click();
          }
        };
      });
  };
  A.importConveyorTexts = function (texts) {
    let n = 0;
    texts.forEach(({ name, text }) => {
      let j; try { j = JSON.parse(text); } catch (e) { return; }
      const list = Array.isArray(j) ? j : Array.isArray(j.conveyors) ? j.conveyors : [j];
      list.forEach((x, i) => { try { if (looksLikeLevel(x)) return; A.addConveyor(CS.normConveyor(x, name.replace(/\.json$/i, '') + (list.length > 1 ? '_' + i : ''))); n++; } catch (e) { } });
    });
    return n;
  };

  A.dialogHelp = function () {
    A.dialog(`<h2>Cap Sort Level Builder</h2>
      <h3>Shortcuts</h3>
      <div class="hint"><kbd>V</kbd> Select · <kbd>B</kbd> Paint · <kbd>L</kbd> Link · <kbd>1</kbd>–<kbd>8</kbd> colour ·
      <kbd>H</kbd> toggle hidden · <kbd>Del</kbd> delete selection · <kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> move selected box ·
      <kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Ctrl</kbd>+<kbd>Y</kbd> undo / redo · <kbd>Ctrl</kbd>+<kbd>S</kbd> save (linked folder) or download ·
      <kbd>Ctrl</kbd>+<kbd>Enter</kbd> play test · <kbd>Esc</kbd> back to edit · in play: <kbd>Space</kbd> pause, <kbd>R</kbd> restart, <kbd>.</kbd> step, <kbd>1</kbd>–<kbd>6</kbd> send queue.</div>
      <h3>Level JSON</h3>
      <div class="hint">formatVersion 5: <code>feeders</code> is keyed by entry (<code>"left"</code> | <code>"middle"</code> | <code>"right"</code>), each with <code>bottles</code>, <code>hiddenRows</code>, <code>lockedRows</code> when used.
      Older files (feeders as a list with <code>entry</code>, <code>trayCapacity</code>, <code>doorTurns</code> / <code>doorShut</code>) still import. Other fields:
      <code>blockDoor: { turns, doors: [{ feeder, open }] }</code> (Block Door countdown and each door's start state),
      <code>blockQueue: { turns, lanes: [a, b] }</code> (Block Queue: queues a and b take turns being blocked, a first; older <code>blockedLane</code> files still import). <code>colors</code> is filled from the colours used. A box's <code>size</code> sets its items: 1 = 16, 2 = 24, 3 = 32, 4 = 40.
      Feeder row 0 and lane box 0 are the ones nearest the conveyor and the slots. Unknown fields are kept on export.</div>
      <h3>Storage</h3>
      <div class="hint">Levels are saved in this browser automatically. Use Export / Export all to get files, or Open folder (Chrome / Edge) to load and save a folder of level files directly.</div>
      <div class="foot"><button value="cancel" class="primary">Close</button></div>`);
  };

})(window.CS);
