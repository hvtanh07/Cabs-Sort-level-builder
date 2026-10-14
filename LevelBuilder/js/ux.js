/* Cap Sort Level Builder: design-flow helpers
   balance bar with one-click fixes, next-step guide, new-level wizard, quick entry,
   right-click menus, status bar, collapsible inspector sections, inline rename */
'use strict';
(function (CS) {
  const $ = CS.$, $$ = CS.$$, esc = CS.esc, A = CS.App;
  const U = CS.UX = {};
  const COLS = [1, 2, 3, 4, 5, 6, 7, 8];
  const sw = (c, attr, on) => `<button type="button" class="swatch c${c} ${CS.LIGHT[c] ? 'l' : ''} ${on ? 'on' : ''}" ${attr} title="${CS.COLORS[c].name} (${c})"><span>${c}</span></button>`;

  /* ---------- quick-entry codes ----------
     box:  3   3x2 (size 2)   3h (hidden)   3L4 (locked 4)   combine: 3x2hL4
     row:  5   (four of colour 5)   1122 (one per item, 0 = empty)   suffix h / L3 */
  U.boxCode = b => `${b.color}${b.size > 1 ? 'x' + b.size : ''}${b.hidden ? 'h' : ''}${b.lock > 0 ? 'L' + b.lock : ''}`;
  U.rowCode = r => {
    const same = r.cells.every(c => c === r.cells[0]) && r.cells[0] > 0;
    return (same ? String(r.cells[0]) : r.cells.map(c => c > 0 ? c : 0).join('')) + (r.hidden ? 'h' : '') + (r.lock > 0 ? 'L' + r.lock : '');
  };
  const parseMods = s => {
    const o = { size: 1, hidden: false, lock: 0 };
    const re = /x(\d+)|h|l(\d+)/gi; let m, used = 0;
    while ((m = re.exec(s))) {
      used += m[0].length;
      if (m[0][0].toLowerCase() === 'x') o.size = Math.max(1, +m[1]);
      else if (m[0].toLowerCase() === 'h') o.hidden = true;
      else o.lock = +m[2];
    }
    o.ok = used === s.length;
    return o;
  };
  U.parseBoxes = text => {
    const out = [], bad = [];
    (text.match(/\S+/g) || []).forEach(tok => {
      const m = tok.match(/^([1-8])(.*)$/);
      const mods = m && parseMods(m[2]);
      if (!m || !mods.ok) { bad.push(tok); return; }
      out.push({ color: +m[1], size: mods.size, hidden: mods.hidden, lock: mods.lock });
    });
    return { out, bad };
  };
  U.parseRows = text => {
    const out = [], bad = [];
    (text.match(/\S+/g) || []).forEach(tok => {
      const m = tok.match(/^([0-8]{4}|[1-8])(.*)$/);
      const mods = m && parseMods(m[2]);
      if (!m || !mods.ok) { bad.push(tok); return; }
      const cells = m[1].length === 1 ? [+m[1], +m[1], +m[1], +m[1]] : m[1].split('').map(Number);
      out.push({ cells, hidden: mods.hidden, lock: mods.lock });
    });
    return { out, bad };
  };

  /* ---------- popover menu ---------- */
  const pop = () => $('#pop');
  U.closePop = () => { const p = pop(); if (p) { p.classList.add('hidden'); p.innerHTML = ''; } };
  U.openPop = function (x, y, html, onClick) {
    const p = pop();
    p.innerHTML = html;
    p.classList.remove('hidden');
    const r = p.getBoundingClientRect();
    p.style.left = Math.max(6, Math.min(x, window.innerWidth - r.width - 8)) + 'px';
    p.style.top = Math.max(6, Math.min(y, window.innerHeight - r.height - 8)) + 'px';
    p.onclick = e => {
      const b = e.target.closest('[data-m]'); if (!b) return;
      e.preventDefault();
      const keep = onClick(b.dataset.m, b.dataset.v, b);
      if (!keep) U.closePop();
    };
  };
  const item = (m, label, extra) => `<button type="button" class="mi" data-m="${m}" ${extra || ''}>${label}</button>`;
  const stepper = (m, label, v) => `<div class="mstep"><span>${label}</span><button type="button" data-m="${m}" data-v="-1">−</button><b>${v}</b><button type="button" data-m="${m}" data-v="1">+</button></div>`;

  U.boxMenu = function (uid, x, y) {
    const m = A.m, p = CS.boxPos(m, uid); if (!p) return;
    A.sel = { type: 'box', uid }; A.renderBoard();
    const draw = () => {
      const b = m.lanes[p.lane][p.tray];
      const linked = m.links.some(L => L.includes(uid));
      return `<div class="mhead">Box · Q${p.lane + 1} #${p.tray + 1} · holds ${CS.boxItems(b.size)}</div>
        <div class="mrow">${COLS.map(c => sw(c, `data-m="color" data-v="${c}"`, b.color === c)).join('')}</div>
        ${stepper('size', 'Size', b.size)}${stepper('lock', 'Lock', b.lock)}
        ${item('hidden', (b.hidden ? '☑' : '☐') + ' Hidden Box')}
        ${linked ? item('unlink', '⛓ Unlink') : item('link', '⛓ Link with another box…')}
        <hr>${item('front', '⤒ Move to front')}${item('dup', 'Duplicate')}${item('del', 'Delete', 'class="mi danger"')}`;
    };
    U.openPop(x, y, draw(), (k, v) => {
      const b = m.lanes[p.lane][p.tray];
      if (k === 'color') b.color = +v;
      else if (k === 'size') b.size = Math.max(1, Math.min(CS.MAX_BOX_SIZE, b.size + +v));
      else if (k === 'lock') b.lock = Math.max(0, b.lock + +v);
      else if (k === 'hidden') b.hidden = !b.hidden;
      else if (k === 'unlink') m.links = m.links.filter(L => !L.includes(uid));
      else if (k === 'link') { A.setTool('link'); A.linkFirst = uid; A.renderBoard(); A.toast('Now click a box in another queue'); return false; }
      else if (k === 'front') { m.lanes[p.lane].splice(p.tray, 1); m.lanes[p.lane].unshift(b); }
      else if (k === 'dup') { A.sel = { type: 'box', uid }; A.doCmd('boxDup'); return false; }
      else if (k === 'del') { A.sel = { type: 'box', uid }; A.doCmd('boxDel'); return false; }
      A.commit();
      const keep = ['size', 'lock', 'hidden', 'color'].includes(k);
      if (keep) { const np = CS.boxPos(m, uid); if (np) { p.lane = np.lane; p.tray = np.tray; pop().innerHTML = draw(); } }
      return keep;
    });
  };
  U.rowMenu = function (f, r, x, y) {
    const m = A.m;
    A.sel = { type: 'row', f, r }; A.renderBoard();
    const draw = () => {
      const row = m.feeders[f].rows[r];
      return `<div class="mhead">${CS.ENTRY_LABEL[m.feeders[f].entry]} · row ${r + 1}</div>
        <div class="mrow">${COLS.map(c => sw(c, `data-m="fill" data-v="${c}"`, row.cells.every(x => x === c))).join('')}</div>
        ${stepper('lock', 'Locked Items', row.lock)}
        ${item('hidden', (row.hidden ? '☑' : '☐') + ' Hidden row')}
        <hr>${item('ins', 'Insert row before')}${item('dup', 'Duplicate row')}${item('del', 'Delete row', 'class="mi danger"')}`;
    };
    U.openPop(x, y, draw(), (k, v) => {
      const row = m.feeders[f].rows[r];
      if (k === 'fill') row.cells = row.cells.map(() => +v);
      else if (k === 'lock') row.lock = Math.max(0, row.lock + +v);
      else if (k === 'hidden') row.hidden = !row.hidden;
      else { A.sel = { type: 'row', f, r }; A.doCmd({ ins: 'rowIns', dup: 'rowDup', del: 'rowDel' }[k]); return false; }
      A.commit();
      pop().innerHTML = draw();
      return true;
    });
  };
  U.slotMenu = function (i, x, y) {
    const m = A.m;
    if (i >= m.slots) return;
    const draw = () => `<div class="mhead">Slot ${i + 1}</div>${stepper('lock', 'Lock turns', m.slotLocks[i] || 0)}`;
    U.openPop(x, y, draw(), (k, v) => {
      const n = Math.max(0, (m.slotLocks[i] || 0) + +v);
      if (n) m.slotLocks[i] = n; else delete m.slotLocks[i];
      A.commit(); pop().innerHTML = draw(); return true;
    });
  };
  U.laneMenu = function (l, x, y) {
    const m = A.m;
    U.openPop(x, y, `<div class="mhead">Queue ${l + 1}</div>
      ${item('add', `+ Add ${CS.COLORS[A.brush].name} box`)}${item('quick', '⌨ Type the boxes…')}
      ${item('block', (m.blockedLane && m.blockedLane.lane === l ? '☑' : '☐') + ' Block Queue')}
      ${item('shuffle', 'Shuffle boxes')}${item('dup', 'Duplicate queue')}<hr>${item('del', 'Delete queue', 'class="mi danger"')}`, k => {
      A.sel = { type: 'lane', l };
      if (k === 'add') { A.action('addBox', { l }); return false; }
      if (k === 'quick') { A.tab = 'sel'; A.renderBoard(); A.renderInspector(); const t = $('#quickLane'); if (t) { t.focus(); t.select(); } return false; }
      if (k === 'block') { A.setValue('laneBlocked', !(m.blockedLane && m.blockedLane.lane === l)); return false; }
      A.doCmd({ shuffle: 'laneShuffle', dup: 'laneDup', del: 'laneDel' }[k]);
      return false;
    });
  };

  /* ---------- balance fixes ---------- */
  U.addItems = function (m, c, n) {
    // fill empty cells first, then add rows to the Enter Path with the fewest items
    m.feeders.forEach(f => f.rows.forEach(r => r.cells.forEach((x, k) => { if (n > 0 && !(x > 0)) { r.cells[k] = c; n--; } })));
    if (n <= 0) return;
    if (!m.feeders.length) {
      const g = A.geom(m.conveyor);
      m.feeders.push({ entry: CS.ENTRIES.find(e => g.entryT[e] != null) || 'middle', doorShut: false, rows: [], extra: {} });
    }
    const count = f => f.rows.reduce((a, r) => a + r.cells.filter(x => x > 0).length, 0);
    const f = m.feeders.slice().sort((a, b) => count(a) - count(b))[0];
    while (n > 0) { const k = Math.min(CS.ROW_W, n); const cells = [0, 0, 0, 0].map((_, i) => i < k ? c : 0); f.rows.push({ cells, hidden: false, lock: 0 }); n -= k; }
  };
  U.removeItems = function (m, c, n) {
    // take items of colour c from the back rows first
    const maxR = Math.max(0, ...m.feeders.map(f => f.rows.length));
    for (let r = maxR - 1; r >= 0 && n > 0; r--) {
      m.feeders.forEach(f => {
        const row = f.rows[r]; if (!row) return;
        for (let k = CS.ROW_W - 1; k >= 0 && n > 0; k--) if (row.cells[k] === c) { row.cells[k] = 0; n--; }
      });
    }
    m.feeders.forEach(f => { f.rows = f.rows.filter(r => r.cells.some(x => x > 0)); });
  };
  U.addBoxes = function (m, c, n) {
    if (!m.lanes.length) m.lanes.push([]);
    (CS.splitBoxes(n) || []).forEach(size => {
      const lane = m.lanes.slice().sort((a, b) => a.length - b.length)[0];
      lane.push({ uid: CS.uid(), color: c, size, hidden: false, lock: 0, extra: {} });
    });
  };
  U.balanceMenu = function (c, x, y) {
    const m = A.m, bal = CS.balance(m);
    const d = bal.items[c] - bal.cap[c];
    const name = CS.COLORS[c].name;
    let html = `<div class="mhead"><span class="mini c${c}"></span>${name}: ${bal.boxes[c]} boxes hold ${bal.cap[c]}, ${bal.items[c]} items</div>`;
    if (!d) html += '<div class="mnote">Balanced.</div>';
    if (d < 0) html += item('add', `+ Add ${-d} ${name} items to an Enter Path`);
    if (d > 0) {
      html += item('remove', `− Remove ${d} ${name} items from the back rows`);
      const add = CS.splitBoxes(d);
      if (add) html += item('boxes', `+ Add ${add.length} ${name} box${add.length > 1 ? 'es' : ''} (${add.map(CS.boxItems).join(' + ')} items) to the shortest queues`);
    }
    html += item('select', `Paint with ${name}`);
    U.openPop(x, y, html, k => {
      if (k === 'add') U.addItems(m, c, -d);
      else if (k === 'remove') U.removeItems(m, c, d);
      else if (k === 'boxes') U.addBoxes(m, c, d);
      else if (k === 'select') { A.setBrush(c); A.setTool('paint'); return false; }
      A.commit(); A.toast(`${name} balanced`);
      return false;
    });
  };

  /* ---------- balance bar + next step guide ---------- */
  U.nextStep = function (m, val) {
    const boxes = m.lanes.reduce((a, l) => a + l.length, 0);
    const bal = CS.balance(m);
    const off = COLS.filter(c => bal.items[c] !== bal.cap[c]);
    const errs = val.filter(v => v.level === 'error');
    if (!boxes) return { kind: 'todo', text: 'Step 1 · Add boxes: pick a colour, then click + under a queue (or right-click a queue to type them).' };
    const items = COLS.reduce((a, c) => a + bal.items[c], 0);
    if (!items) return { kind: 'todo', text: 'Step 2 · Add items: click “Fill items from boxes”, or paint rows into an Enter Path.', act: 'fill', btn: 'Fill items from boxes' };
    if (off.length) return { kind: 'warn', text: `Step 2 · ${off.length} colour${off.length > 1 ? 's don’t' : ' doesn’t'} match the boxes. Click a red chip to fix it.`, act: 'fill', btn: 'Fix all' };
    if (errs.length) return { kind: 'warn', text: `Step 3 · ${errs[0].msg}`, act: 'check', btn: errs.length > 1 ? `See all ${errs.length}` : 'Open Check' };
    return { kind: 'ok', text: 'Ready · the level is balanced with no errors. Play test it.', act: 'play', btn: '▶ Play test' };
  };
  U.renderBalance = function () {
    const bar = $('#balanceBar'); if (!bar) return;
    if (A.mode !== 'edit' || !A.m) { bar.classList.add('hidden'); return; }
    bar.classList.remove('hidden');
    const m = A.m, cfg = A.conv(m.conveyor), g = A.geom(m.conveyor);
    const val = CS.validate(m, Object.assign({}, cfg, { entryT: g.entryT }));
    const bal = CS.balance(m);
    const chips = COLS.filter(c => bal.items[c] || bal.cap[c]).map(c => {
      const d = bal.items[c] - bal.cap[c];
      return `<button class="bchip ${d ? 'bad' : ''}" data-bc="${c}" title="${CS.COLORS[c].name}: boxes hold ${bal.cap[c]}, items ${bal.items[c]}${d ? ' · click to fix' : ''}">
        <span class="mini c${c}"></span>${d ? (d > 0 ? '+' + d : d) : bal.cap[c]}</button>`;
    }).join('');
    const items = COLS.reduce((a, c) => a + bal.items[c], 0);
    const boxes = m.lanes.reduce((a, l) => a + l.length, 0);
    const spots = cfg.rows * CS.ROW_W;
    const ns = U.nextStep(m, val);
    bar.innerHTML = `<div class="bchips">${chips || '<span class="hint">No colours yet</span>'}</div>
      <div class="bstats">${boxes} boxes · ${items} items · conveyor ${Math.min(100, Math.round(items / spots * 100))}% full</div>
      <div class="next ${ns.kind}"><span>${esc(ns.text)}</span>${ns.btn ? `<button data-next="${ns.act}" class="${ns.kind === 'ok' ? 'primary' : ''}">${ns.btn}</button>` : ''}</div>`;
  };
  U.bindBalance = function () {
    $('#balanceBar').addEventListener('click', e => {
      const chip = e.target.closest('[data-bc]');
      if (chip) { const r = chip.getBoundingClientRect(); U.balanceMenu(+chip.dataset.bc, r.left, r.bottom + 4); e.stopPropagation(); return; }
      const nx = e.target.closest('[data-next]');
      if (!nx) return;
      const a = nx.dataset.next;
      if (a === 'fill') A.doCmd('fillRows');
      else if (a === 'check') { A.tab = 'check'; A.renderInspector(); }
      else if (a === 'play') CS.Play.start();
    });
  };

  /* ---------- status bar ---------- */
  const HINT = {
    select: 'Select: click to edit · right-click for quick actions · drag boxes between queues · Alt+click picks a colour',
    paint: 'Paint: drag across item cells or click boxes to recolour · right-click clears a cell · 1–8 change colour',
    link: 'Link: click a box, then a box in another queue · click a linked box to unlink'
  };
  U.savedAt = null;
  U.renderStatus = function () {
    const sb = $('#statusBar'); if (!sb) return;
    if (A.mode !== 'edit') { sb.innerHTML = '<span>Play test · Space pause · R restart · 1–9 send a queue · H / S / M boosters · Esc back to edit</span>'; return; }
    let sel = '';
    const s = A.sel, m = A.m;
    if (s && m) {
      if (s.type === 'box') { const p = CS.boxPos(m, s.uid); if (p) { const b = m.lanes[p.lane][p.tray]; sel = `Box ${U.boxCode(b)} · Q${p.lane + 1} #${p.tray + 1}`; } }
      else if (s.type === 'row' && m.feeders[s.f] && m.feeders[s.f].rows[s.r]) sel = `${CS.ENTRY_LABEL[m.feeders[s.f].entry]} row ${s.r + 1} · ${U.rowCode(m.feeders[s.f].rows[s.r])}`;
      else if (s.type === 'lane') sel = `Queue ${s.l + 1}`;
      else if (s.type === 'slot') sel = `Slot ${s.i + 1}`;
      else if (s.type === 'feeder' && m.feeders[s.f]) sel = `${CS.ENTRY_LABEL[m.feeders[s.f].entry]} Enter Path`;
    }
    const t = U.savedAt ? U.savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const folder = A.dir ? (A.dirty[A.key] ? ' · <b class="warnt">not saved to folder (Ctrl+S)</b>' : ' · saved to folder') : '';
    sb.innerHTML = `<span class="sh">${HINT[A.tool] || ''}</span><span class="grow"></span>${sel ? `<span class="ss">${esc(sel)}</span>` : ''}<span class="sv">✓ Saved in browser${t ? ' ' + t : ''}${folder}</span>`;
  };

  /* ---------- collapsible inspector sections ---------- */
  U.sectionize = function () {
    const pane = $('#inspector .pane'); if (!pane || A.mode !== 'edit') return;
    A.prefs.closed = A.prefs.closed || {};
    const kids = Array.from(pane.children);
    if (kids.filter(k => k.tagName === 'H3').length < 2) return;
    let cur = null;
    kids.forEach(k => {
      if (k.tagName === 'H3') {
        const key = A.tab + ':' + k.textContent.trim();
        cur = document.createElement('details');
        cur.className = 'sec'; cur.open = !A.prefs.closed[key]; cur.dataset.key = key;
        const sum = document.createElement('summary'); sum.innerHTML = k.innerHTML;
        cur.appendChild(sum);
        pane.insertBefore(cur, k); k.remove();
        cur.addEventListener('toggle', () => { A.prefs.closed[key] = !cur.open; A.savePrefs(); });
      } else if (cur) cur.appendChild(k);
    });
  };

  /* ---------- quick entry in the Selected tab ---------- */
  U.quickBlock = function () {
    const s = A.sel, m = A.m; if (!s || !m) return '';
    if (s.type === 'lane' || s.type === 'box') {
      const l = s.type === 'lane' ? s.l : (CS.boxPos(m, s.uid) || {}).lane;
      if (l == null || !m.lanes[l]) return '';
      return `<h3>Type queue ${l + 1}</h3>
        <textarea id="quickLane" data-l="${l}" rows="3" spellcheck="false">${m.lanes[l].map(U.boxCode).join(' ')}</textarea>
        <div class="hint">Front box first. <code>3</code> colour · <code>3x2</code> size 2 · <code>3h</code> hidden · <code>3L4</code> locked 4. Ctrl+Enter applies.</div>
        <div class="btnrow"><button data-ux="applyLane" class="primary">Apply</button></div>`;
    }
    if (s.type === 'feeder' || s.type === 'row') {
      const f = m.feeders[s.f]; if (!f) return '';
      return `<h3>Type ${CS.ENTRY_LABEL[f.entry]} rows</h3>
        <textarea id="quickRows" data-f="${s.f}" rows="4" spellcheck="false">${f.rows.map(U.rowCode).join(' ')}</textarea>
        <div class="hint">Row 1 first. <code>5</code> = four of colour 5 · <code>1122</code> = one per item (0 empty) · add <code>h</code> hidden · <code>L3</code> locked 3. Ctrl+Enter applies.</div>
        <div class="btnrow"><button data-ux="applyRows" class="primary">Apply</button></div>`;
    }
    return '';
  };
  U.applyLane = function () {
    const t = $('#quickLane'); if (!t) return;
    const l = +t.dataset.l, m = A.m;
    const { out, bad } = U.parseBoxes(t.value);
    if (bad.length) { A.toast('Not understood: ' + bad.join(' ')); return; }
    const old = m.lanes[l];
    m.lanes[l] = out.map((b, i) => Object.assign(old[i] || { uid: CS.uid(), extra: {} }, b));
    const keep = new Set(m.lanes.flat().map(b => b.uid));
    m.links = m.links.filter(L => keep.has(L[0]) && keep.has(L[1]));
    A.sel = { type: 'lane', l };
    A.commit(); A.toast(`Queue ${l + 1}: ${out.length} boxes`);
  };
  U.applyRows = function () {
    const t = $('#quickRows'); if (!t) return;
    const f = +t.dataset.f;
    const { out, bad } = U.parseRows(t.value);
    if (bad.length) { A.toast('Not understood: ' + bad.join(' ')); return; }
    A.m.feeders[f].rows = out;
    A.sel = { type: 'feeder', f };
    A.commit(); A.toast(`${out.length} rows`);
  };

  /* ---------- level list with stats and inline rename ---------- */
  U.renderList = function () {
    const q = ($('#levelSearch').value || '').toLowerCase().trim();
    const ul = $('#levelList');
    $('#levelCount').textContent = `(${A.store.order.length})`;
    ul.innerHTML = A.store.order.map((k, i) => {
      const j = A.store.levels[k];
      const name = (j.meta && j.meta.name) || '';
      const diff = (j.meta && j.meta.difficulty) || '';
      if (q && !(String(j.id).toLowerCase().includes(q) || name.toLowerCase().includes(q) || diff.toLowerCase().includes(q) || String(j.conveyor).includes(q))) return '';
      const st = A.levelStatus(k);
      const boxes = (j.lanes || []).reduce((a, l) => a + l.length, 0);
      const items = CS.feederList(j).reduce((a, f) => a + (f.bottles || []).filter(x => x > 0).length, 0);
      return `<li data-key="${k}" draggable="true" class="${k === A.key ? 'on' : ''}" title="${esc(j.id)} · double-click to rename">
        <span class="n">${i + 1}</span>
        <span class="nm"><b>${esc(name || j.id)}</b><small>${esc(j.id)}${diff ? `<span class="diff d-${esc(diff.replace(/\s+/g, '-').toLowerCase())}">${esc(diff)}</span>` : ''}${A.dir && A.dirty[k] ? ' •' : ''}</small>
        <small class="ls">${esc(j.conveyor || '')} · ${boxes} boxes · ${items} items</small></span>
        <span class="dot ${st === 'ok' ? '' : st}" title="${st === 'ok' ? 'No problems' : st === 'warn' ? 'Has warnings' : 'Has errors'}"></span>
      </li>`;
    }).join('') || '<li class="empty-list">No levels match.</li>';
  };
  U.bindRename = function () {
    $('#levelList').addEventListener('dblclick', e => {
      const li = e.target.closest('li[data-key]'); if (!li) return;
      const k = li.dataset.key, j = A.store.levels[k];
      const b = $('.nm b', li);
      const inp = document.createElement('input');
      inp.type = 'text'; inp.value = (j.meta && j.meta.name) || ''; inp.className = 'rename';
      b.replaceWith(inp); inp.focus(); inp.select();
      let finished = false;
      const done = ok => {
        if (finished) return; finished = true;
        if (ok && inp.value.trim() !== ((j.meta && j.meta.name) || '')) {
          if (k === A.key) { A.m.meta.name = inp.value.trim(); A.commit(); return; }
          j.meta = Object.assign({}, j.meta, { name: inp.value.trim() }); A.saveStore();
        }
        A.renderList();
      };
      inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') done(true); if (ev.key === 'Escape') done(false); ev.stopPropagation(); });
      inp.addEventListener('blur', () => done(true));
      inp.addEventListener('click', ev => ev.stopPropagation());
    });
  };

  /* ---------- new level wizard ---------- */
  U.newLevelWizard = function () {
    const id = A.nextId();
    const cur = A.m;
    const convs = A.convOrder.map(cid => `<label class="wconv"><input type="radio" name="conv" value="${esc(cid)}" ${cid === ((cur && cur.conveyor) || A.convOrder[0]) ? 'checked' : ''}><canvas data-cid="${esc(cid)}"></canvas><span>${esc(A.conveyors[cid].name)}<small>${A.conveyors[cid].rows} rows</small></span></label>`).join('');
    A.dialog(`<h2>New level</h2>
      <div class="wgrid">
        <label class="field"><span>Name</span><input type="text" name="name" value="" placeholder="Level ${A.store.order.length + 1}"></label>
        <label class="field"><span>Level id</span><input type="text" name="id" value="${id}"></label>
        <label class="field"><span>Difficulty</span><select name="diff"><option>easy</option><option selected>normal</option><option>hard</option><option>super hard</option></select></label>
        <label class="field"><span>Slots</span><div class="inline"><input type="number" name="slots" value="${cur ? cur.slots : 4}" min="1" max="6"> + RV <input type="number" name="rv" value="${cur ? cur.extraSlots : 2}" min="0" max="6"></div></label>
      </div>
      <h3>Conveyor</h3><div class="wconvs">${convs}</div>
      <h3>Start with</h3>
      <div class="wstart">
        <label><input type="radio" name="start" value="empty" checked> <b>Empty queues</b><small>Then add boxes and fill the items from them.</small></label>
        <label><input type="radio" name="start" value="random"> <b>Random draft</b><small>Boxes and matching items to tweak.</small></label>
      </div>
      <div class="wgrid">
        <label class="field"><span>Queues</span><input type="number" name="lanes" value="4" min="1" max="8"></label>
        <label class="field"><span>Enter Paths</span><input type="number" name="feeders" value="2" min="1" max="3"></label>
        <label class="field rnd"><span>Colours</span><input type="number" name="colors" value="6" min="1" max="8"></label>
        <label class="field rnd"><span>Boxes</span><input type="number" name="boxes" value="32" min="1" max="200"></label>
      </div>
      <div class="foot"><button value="cancel">Cancel</button><button value="ok" class="primary">Create level</button></div>`,
      fd => {
        const nid = String(fd.get('id') || '').trim() || A.nextId();
        if (A.allIds().has(nid)) { A.toast(`The id ${nid} is already used`); return false; }
        const m = CS.blankLevel(nid);
        m.conveyor = fd.get('conv') || m.conveyor;
        m.meta.name = String(fd.get('name') || '').trim() || `Level ${A.store.order.length + 1}`;
        m.meta.difficulty = fd.get('diff');
        m.slots = Math.max(1, Math.min(6, CS.int(fd.get('slots'), 4)));
        m.extraSlots = Math.max(0, Math.min(6, CS.int(fd.get('rv'), 2)));
        const lanes = Math.max(1, Math.min(8, CS.int(fd.get('lanes'), 4)));
        const nf = Math.max(1, Math.min(3, CS.int(fd.get('feeders'), 2)));
        const g = A.geom(m.conveyor);
        if (fd.get('start') === 'random') {
          CS.randomLevel(m, { colors: CS.int(fd.get('colors'), 6), lanes, boxes: CS.int(fd.get('boxes'), 32), feeders: nf, big2: 0.1, big3: 0.05, hidden: 0, mode: 'rows' });
        } else {
          m.lanes = Array.from({ length: lanes }, () => []);
          m.links = [];
          m.feeders = CS.defaultEntries(nf).map(e => ({ entry: e, doorShut: false, rows: [], extra: {} }));
        }
        m.feeders.forEach(f => { if (g.entryT[f.entry] == null) { const free = CS.ENTRIES.find(e => g.entryT[e] != null && !m.feeders.some(x => x.entry === e)); if (free) f.entry = free; } });
        const at = A.key ? A.store.order.indexOf(A.key) + 1 : -1;
        A.openLevel(A.addLevel(CS.toJSON(m), at));
        A.tab = 'level'; A.renderInspector();
        A.toast('Level created');
      },
      form => {
        $$('canvas[data-cid]', form).forEach(cv => {
          const gg = A.geom(cv.dataset.cid);
          new CS.ConvView(cv, gg).draw(null, CS.ENTRIES.filter(e => gg.entryT[e] != null).map(e => ({ entry: e, label: e[0].toUpperCase() })), { compact: true });
        });
        const sync = () => $$('.rnd', form).forEach(x => x.classList.toggle('dim', form.elements.namedItem('start').value !== 'random'));
        form.addEventListener('change', sync); sync();
        form.elements.namedItem('name').focus();
      });
  };

  /* ---------- wiring ---------- */
  U.init = function () {
    // wrap renders
    const rAll = A.renderAll;
    A.renderAll = function () { rAll(); U.renderBalance(); U.renderStatus(); };
    const rIns = A.renderInspector;
    A.renderInspector = function () {
      rIns();
      if (A.mode === 'edit' && A.tab === 'sel') {
        const extra = U.quickBlock();
        if (extra) $('#inspector .pane').insertAdjacentHTML('beforeend', extra);
      }
      U.sectionize();
      U.renderStatus();
    };
    const rBoard = A.renderBoard;
    A.renderBoard = function () {
      rBoard();
      $('#board').classList.toggle('tall', !!A.prefs.tall);
      $$('#feeders .fh').forEach(h => {
        if (!$('.fexp', h)) h.insertAdjacentHTML('beforeend', `<button type="button" class="fexp" data-ux="tall" title="${A.prefs.tall ? 'Show fewer rows' : 'Show all rows'}">${A.prefs.tall ? '▴' : '▾'}</button>`);
      });
      U.renderStatus();
    };
    A.renderList = U.renderList;
    const save = A.saveStore;
    A.saveStore = function () { save(); U.savedAt = new Date(); U.renderStatus(); };
    const setTool = A.setTool;
    A.setTool = function (t) { setTool(t); U.renderStatus(); };

    U.bindBalance();
    U.bindRename();
    $('#btnNew').onclick = U.newLevelWizard;

    // right-click menus (capture, so they run before the default cell-clear)
    $('#board').addEventListener('contextmenu', e => {
      if (A.mode !== 'edit') return;
      const cell = e.target.closest('.cell');
      if (cell && A.tool === 'paint') return;                  // paint: right-click clears the cell
      const box = e.target.closest('.box'), row = e.target.closest('.frow'), slot = e.target.closest('.slot'), lh = e.target.closest('.lh');
      let done = true;
      if (box) U.boxMenu(box.dataset.uid, e.clientX, e.clientY);
      else if (row) U.rowMenu(+row.dataset.f, +row.dataset.r, e.clientX, e.clientY);
      else if (slot) U.slotMenu(+slot.dataset.slot, e.clientX, e.clientY);
      else if (lh) U.laneMenu(+lh.dataset.l, e.clientX, e.clientY);
      else done = false;
      if (done) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    $('#board').addEventListener('click', e => {
      const t = e.target.closest('[data-ux="tall"]');
      if (t) { e.stopPropagation(); A.prefs.tall = !A.prefs.tall; A.savePrefs(); A.renderBoard(); }
    }, true);
    document.addEventListener('mousedown', e => { if (!e.target.closest('#pop')) U.closePop(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !pop().classList.contains('hidden')) { U.closePop(); e.stopPropagation(); return; }
      if (e.key === '?' && !/input|textarea|select/i.test(e.target.tagName) && !$('#dlg').open) { e.preventDefault(); A.dialogHelp(); }
    }, true);
    window.addEventListener('resize', U.closePop);
    $('#boardWrap') && $('#boardWrap').addEventListener('wheel', U.closePop, { passive: true });

    // quick entry buttons
    $('#inspector').addEventListener('click', e => {
      const b = e.target.closest('[data-ux]'); if (!b) return;
      if (b.dataset.ux === 'applyLane') U.applyLane();
      if (b.dataset.ux === 'applyRows') U.applyRows();
    });
    $('#inspector').addEventListener('keydown', e => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        if (e.target.id === 'quickLane') { e.preventDefault(); e.stopPropagation(); U.applyLane(); }
        if (e.target.id === 'quickRows') { e.preventDefault(); e.stopPropagation(); U.applyRows(); }
      }
    }, true);
  };
})(window.CS);
