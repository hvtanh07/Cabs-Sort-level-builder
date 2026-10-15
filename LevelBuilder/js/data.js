/* Cap Sort Level Builder: data model, JSON import/export, conveyor configs, validation, generators */
'use strict';
window.CS = window.CS || {};
(function (CS) {

  /* ---------- constants (from the GDD, section 3.2 colour list) ---------- */
  CS.COLORS = [null,
    { id: 1, name: 'Red', hex: '#D9363E' },
    { id: 2, name: 'Blue', hex: '#2563EB' },
    { id: 3, name: 'Green', hex: '#1B8641' },
    { id: 4, name: 'Yellow', hex: '#F4BE0B' },
    { id: 5, name: 'Pink', hex: '#F472B6' },
    { id: 6, name: 'Orange', hex: '#F58220' },
    { id: 7, name: 'Purple', hex: '#7C4DDB' },
    { id: 8, name: 'Cyan', hex: '#22B8D1' }
  ];
  CS.LIGHT = { 4: 1, 5: 1, 6: 1, 8: 1 };     // colours that need dark text
  CS.ROW_W = 4;                               // conveyor and Enter Path rows are 4 items wide
  CS.ENTRIES = ['left', 'middle', 'right'];
  CS.ENTRY_LABEL = { left: 'Left', middle: 'Middle', right: 'Right' };
  CS.MAX_SLOTS = 6;

  let uidN = 1;
  const uid = () => 'b' + (uidN++);
  CS.uid = uid;
  const int = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };
  CS.int = int;
  CS.clone = o => JSON.parse(JSON.stringify(o));

  /* ---------- level JSON <-> editor model ---------- */
  const KNOWN = ['$schema', 'formatVersion', 'id', 'conveyor', 'slots', 'extraSlots', 'slotLocks', 'trayCapacity',
    'colors', 'feeders', 'lanes', 'links', 'doorTurns', 'blockedLane', 'view', 'meta'];
  const FEEDER_KNOWN = ['bottles', 'hiddenRows', 'lockedRows', 'entry', 'doorShut'];
  const BOX_KNOWN = ['color', 'size', 'hidden', 'lockTurns'];
  const pickExtra = (o, known) => {
    const x = {};
    Object.keys(o || {}).forEach(k => { if (!known.includes(k)) x[k] = o[k]; });
    return x;
  };

  CS.defaultEntries = n => n <= 1 ? ['middle'] : n === 2 ? ['left', 'right'] : ['left', 'middle', 'right'];

  CS.LEVEL_SCHEMA = '../../../../../docs/design/level.schema.json';
  // the larger conveyors used before (square_42, bean_42, ...) were replaced by the game's own configs; a level that names one moves to its replacement
  CS.CONVEYOR_ALIAS = { square_42: 'square_19', bean_42: 'bean_18', lens_42: 'lens_18', heart_44: 'heart_21', triangle_28: 'triangle_12', oval_32: 'oval_14' };
  CS.FORMAT_VERSION = 5;   // feeders keyed by entry ("left" / "middle" / "right"), no trayCapacity
  // a level JSON's Enter Paths as a list with `entry` (works for formatVersion 5 and older files)
  CS.feederList = j => !j || !j.feeders ? [] : Array.isArray(j.feeders) ? j.feeders : Object.keys(j.feeders).map(e => Object.assign({ entry: e }, j.feeders[e]));

  // Box sizes: a box's `size` sets how many items it holds (size 1 = 16, 2 = 24, 3 = 32, 4 = 40).
  CS.BOX_ITEMS = { 1: 16, 2: 24, 3: 32, 4: 40 };
  CS.MAX_BOX_SIZE = 4;
  CS.boxItems = size => CS.BOX_ITEMS[size] || 16 + 8 * (Math.max(1, size) - 1);
  // split an item count into box sizes (largest first), or null when it can't be made from 16 / 24 / 32 / 40
  CS.splitBoxes = function (n) {
    const out = [];
    while (n > 0) {
      const s = n === 40 || n >= 56 ? 4 : n === 32 ? 3 : n === 24 || n === 48 ? 2 : n === 16 ? 1 : 0;
      if (!s) return null;
      out.push(s); n -= CS.boxItems(s);
    }
    return out;
  };
  // Files saved before the size table (no $schema, every box size 4 or more) used size = trays of trayCapacity items:
  // 4 / 5 / 6 / 8 trays of 4 were the 16 / 20 / 24 / 32-item boxes, which become sizes 1 / 2 / 3 / 4.
  function migrateSizes(j) {
    if (j.$schema !== undefined || !Array.isArray(j.lanes)) return;
    const boxes = [].concat(...j.lanes.filter(Array.isArray)).filter(t => t);
    if (!boxes.length || boxes.some(t => !(+t.size >= 4))) return;
    const tc = +j.trayCapacity || 4;
    const OLD = { 16: 1, 20: 2, 24: 3, 32: 4 };
    j.lanes = j.lanes.map(l => Array.isArray(l) ? l.map(t => {
      if (!t) return t;
      const items = t.size * tc;
      return Object.assign({}, t, { size: OLD[items] || Math.max(1, Math.min(CS.MAX_BOX_SIZE, Math.round(items / 8) - 1)) });
    }) : l);
  }

  // Older files kept meta.intro / meta.unlock / meta.booster: intro becomes meta.notes, the other two are dropped.
  // The "normal" difficulty is now called "medium".
  function migrateMeta(meta) {
    if (meta.intro !== undefined && meta.notes === undefined) meta.notes = meta.intro;
    delete meta.intro; delete meta.unlock; delete meta.booster;
    if (String(meta.difficulty).trim().toLowerCase() === 'normal') meta.difficulty = 'medium';
    return meta;
  }

  CS.fromJSON = function (j) {
    j = j || {};
    if (Array.isArray(j.lanes)) { j = Object.assign({}, j); migrateSizes(j); }
    const m = {
      schema: j.$schema !== undefined ? j.$schema : CS.LEVEL_SCHEMA,
      formatVersion: Math.max(CS.FORMAT_VERSION, int(j.formatVersion, CS.FORMAT_VERSION)),
      id: String(j.id || 'level_0001'),
      conveyor: CS.CONVEYOR_ALIAS[j.conveyor] || String(j.conveyor || 'square_19'),
      slots: int(j.slots, 4),
      extraSlots: int(j.extraSlots, 0),
      slotLocks: {},
      feeders: [],
      lanes: [],
      links: [],
      doorTurns: int(j.doorTurns, 0),
      blockedLane: j.blockedLane && j.blockedLane.lane != null ? { lane: int(j.blockedLane.lane, 0), lockTurns: int(j.blockedLane.lockTurns, 3) } : null,
      view: j.view !== undefined ? CS.clone(j.view) : { cameraPreset: 'default' },
      meta: migrateMeta(Object.assign({ name: '', difficulty: 'medium' }, CS.clone(j.meta || {}))),
      extra: CS.clone(pickExtra(j, KNOWN))
    };
    (j.slotLocks || []).forEach(s => { if (s && s.slot != null) m.slotLocks[int(s.slot, 0)] = int(s.lockTurns, 1); });

    // formatVersion 5 keys the Enter Paths by entry; older files list them with an `entry` field
    const feeders = Array.isArray(j.feeders) ? j.feeders
      : j.feeders && typeof j.feeders === 'object' ? Object.keys(j.feeders).map(e => Object.assign({}, j.feeders[e], { entry: e })) : [];
    const defaults = CS.defaultEntries(feeders.length);
    feeders.forEach((f, i) => {
      const b = Array.isArray(f.bottles) ? f.bottles.map(x => int(x, 0)) : [];
      const hidden = new Set((f.hiddenRows || []).map(x => int(x, -1)));
      const locks = {};
      (f.lockedRows || []).forEach(r => { if (r && r.row != null) locks[int(r.row, -1)] = int(r.lockTurns, 1); });
      const rows = [];
      for (let k = 0, r = 0; k < b.length; k += CS.ROW_W, r++) {
        const cells = b.slice(k, k + CS.ROW_W);
        while (cells.length < CS.ROW_W) cells.push(0);
        rows.push({ cells, hidden: hidden.has(r), lock: locks[r] || 0 });
      }
      m.feeders.push({
        entry: CS.ENTRIES.includes(f.entry) ? f.entry : defaults[i] || 'middle',
        doorShut: !!f.doorShut,
        rows,
        extra: CS.clone(pickExtra(f, FEEDER_KNOWN))
      });
    });

    (Array.isArray(j.lanes) ? j.lanes : []).forEach(l => {
      m.lanes.push((Array.isArray(l) ? l : []).map(t => ({
        uid: uid(),
        color: int(t && t.color, 1),
        size: Math.max(1, int(t && t.size, 1)),
        hidden: !!(t && t.hidden),
        lock: int(t && t.lockTurns, 0),
        extra: CS.clone(pickExtra(t, BOX_KNOWN))
      })));
    });
    (j.links || []).forEach(L => {
      if (!L || !L.a || !L.b) return;
      const A = (m.lanes[L.a.lane] || [])[L.a.tray], B = (m.lanes[L.b.lane] || [])[L.b.tray];
      if (A && B) m.links.push([A.uid, B.uid]);
    });
    return m;
  };

  CS.boxPos = function (m, id) {
    for (let l = 0; l < m.lanes.length; l++) {
      const t = m.lanes[l].findIndex(b => b.uid === id);
      if (t >= 0) return { lane: l, tray: t };
    }
    return null;
  };

  CS.usedColors = function (m) {
    const s = new Set();
    m.feeders.forEach(f => f.rows.forEach(r => r.cells.forEach(c => { if (c > 0) s.add(c); })));
    m.lanes.forEach(l => l.forEach(b => s.add(b.color)));
    return [...s].sort((a, b) => a - b);
  };

  CS.toJSON = function (m) {
    const o = {};
    o.$schema = m.schema !== undefined ? m.schema : CS.LEVEL_SCHEMA;
    o.formatVersion = m.formatVersion;
    o.id = m.id;
    o.conveyor = m.conveyor;
    o.slots = m.slots;
    o.extraSlots = m.extraSlots;
    const locks = Object.keys(m.slotLocks).map(Number).sort((a, b) => a - b)
      .filter(s => m.slotLocks[s] > 0).map(s => ({ slot: s, lockTurns: m.slotLocks[s] }));
    if (locks.length) o.slotLocks = locks;   // left out when empty
    o.colors = CS.usedColors(m);
    o.feeders = {};
    m.feeders.slice().sort((a, b) => CS.ENTRIES.indexOf(a.entry) - CS.ENTRIES.indexOf(b.entry)).forEach(f => {
      let bottles = [];
      f.rows.forEach(r => { bottles = bottles.concat(r.cells); });
      while (bottles.length && bottles[bottles.length - 1] === 0) bottles.pop();
      const fo = { bottles };
      const hid = []; const lk = [];
      f.rows.forEach((r, i) => { if (r.hidden) hid.push(i); if (r.lock > 0) lk.push({ row: i, lockTurns: r.lock }); });
      if (hid.length) fo.hiddenRows = hid;
      if (lk.length) fo.lockedRows = lk;
      if (f.doorShut) fo.doorShut = true;
      o.feeders[f.entry] = Object.assign(fo, f.extra || {});
    });
    o.lanes = m.lanes.map(l => l.map(b => {
      const t = { color: b.color };
      if (b.hidden) t.hidden = true;
      if (b.size > 1) t.size = b.size;
      if (b.lock > 0) t.lockTurns = b.lock;
      return Object.assign(t, b.extra || {});
    }));
    const links = m.links.map(([a, b]) => ({ a: CS.boxPos(m, a), b: CS.boxPos(m, b) })).filter(L => L.a && L.b)
      .map(L => ({ a: { lane: L.a.lane, tray: L.a.tray }, b: { lane: L.b.lane, tray: L.b.tray } }));
    if (links.length) o.links = links;   // left out when empty
    if (m.doorTurns > 0) o.doorTurns = m.doorTurns;
    if (m.blockedLane) o.blockedLane = { lane: m.blockedLane.lane, lockTurns: m.blockedLane.lockTurns };
    if (m.view !== undefined) o.view = m.view;
    o.meta = m.meta;
    return Object.assign(o, m.extra || {});
  };

  /* Pretty printer that matches the layout of demo.json (rows of 4 bottles, one lane per line) */
  const inline = v => {
    if (Array.isArray(v)) return '[' + v.map(inline).join(', ') + ']';
    if (v && typeof v === 'object') {
      const ks = Object.keys(v);
      return ks.length ? '{ ' + ks.map(k => JSON.stringify(k) + ': ' + inline(v[k])).join(', ') + ' }' : '{}';
    }
    return JSON.stringify(v);
  };
  CS.stringifyLevel = function (o) {
    const keys = Object.keys(o);
    const out = keys.map(k => {
      const v = o[k];
      let s;
      if (k === 'feeders' && v && !Array.isArray(v) && typeof v === 'object' && Object.keys(v).length) {
        s = '{\n' + Object.keys(v).map(e => {
          const f = v[e];
          const b = f.bottles || [];
          const rows = [];
          for (let i = 0; i < b.length; i += CS.ROW_W) rows.push('      ' + b.slice(i, i + CS.ROW_W).join(', '));
          const rest = Object.keys(f).filter(x => x !== 'bottles').map(x => ', ' + JSON.stringify(x) + ': ' + inline(f[x])).join('');
          return '    ' + JSON.stringify(e) + ': { "bottles": [' + (rows.length ? '\n' + rows.join(',\n') + '\n    ' : '') + ']' + rest + ' }';
        }).join(',\n') + '\n  }';
      } else if ((k === 'lanes' || k === 'links') && Array.isArray(v) && v.length) {
        s = '[\n' + v.map(x => '    ' + inline(x)).join(',\n') + '\n  ]';
      } else s = inline(v);
      return '  ' + JSON.stringify(k) + ': ' + s;
    });
    return '{\n' + out.join(',\n') + '\n}\n';
  };

  CS.blankLevel = function (id) {
    return CS.fromJSON({
      formatVersion: CS.FORMAT_VERSION, id, conveyor: 'square_19', slots: 4, extraSlots: 2,
      feeders: { left: { bottles: [1, 1, 1, 1, 2, 2, 2, 2] }, right: { bottles: [3, 3, 3, 3] } },
      lanes: [[{ color: 1 }, { color: 3 }], [{ color: 2 }]],
      links: [], view: { cameraPreset: 'default' }, meta: { name: 'New level', difficulty: 'medium' }
    });
  };

  /* ---------- colour balance & validation ---------- */
  CS.balance = function (m) {
    const items = {}, cap = {}, boxes = {};
    for (let c = 1; c <= 8; c++) { items[c] = 0; cap[c] = 0; boxes[c] = 0; }
    m.feeders.forEach(f => f.rows.forEach(r => r.cells.forEach(c => { if (c > 0) items[c]++; })));
    m.lanes.forEach(l => l.forEach(b => { cap[b.color] += CS.boxItems(b.size); boxes[b.color]++; }));
    return { items, cap, boxes };
  };

  CS.validate = function (m, conv) {
    const out = [];
    const err = (msg, target) => out.push({ level: 'error', msg, target });
    const warn = (msg, target) => out.push({ level: 'warn', msg, target });
    const info = (msg, target) => out.push({ level: 'info', msg, target });

    if (!/^[A-Za-z0-9_\-]+$/.test(m.id)) warn('Level id should only use letters, digits, "_" and "-".');
    if (m.slots < 1 || m.slots > CS.MAX_SLOTS) err(`Slots must be between 1 and ${CS.MAX_SLOTS}.`);
    if (m.slots + m.extraSlots > CS.MAX_SLOTS) warn(`Slots + RV slots is ${m.slots + m.extraSlots}; the GDD caps a level at ${CS.MAX_SLOTS}.`);
    Object.keys(m.slotLocks).forEach(s => { if (+s >= m.slots && m.slotLocks[s] > 0) err(`Slot lock on slot ${+s + 1}, but the level only has ${m.slots} slots.`); });
    if (Object.keys(m.slotLocks).filter(s => m.slotLocks[s] > 0 && +s < m.slots).length >= m.slots) err('Every slot is locked, so no box can ever be sent.');

    if (!m.feeders.length) err('The level has no Enter Path, so no items will reach the conveyor.');
    if (m.feeders.length > 3) err('A conveyor has at most 3 entry points (left, middle, right).');
    const seen = {};
    m.feeders.forEach((f, i) => {
      if (seen[f.entry]) err(`Enter Paths ${seen[f.entry]} and ${i + 1} both use the ${f.entry} entry.`, { feeder: i });
      seen[f.entry] = i + 1;
      if (conv && conv.entryT && conv.entryT[f.entry] == null) err(`Conveyor "${conv.id}" has no ${f.entry} entry point.`, { feeder: i });
      let empty = 0;
      f.rows.forEach((r, ri) => r.cells.forEach(c => { if (!(c > 0)) empty++; }));
      if (empty) warn(`Enter Path ${i + 1} (${f.entry}) has ${empty} empty cell${empty > 1 ? 's' : ''}; they are exported as 0.`, { feeder: i });
      if (!f.rows.length) warn(`Enter Path ${i + 1} (${f.entry}) has no rows.`, { feeder: i });
    });
    if (m.doorTurns > 0) {
      if (m.feeders.length < 2) warn('Block Door is on but there is only one Enter Path.');
      if (m.feeders.length && m.feeders.every(f => f.doorShut)) warn('Block Door: every door starts shut, so the conveyor starts empty.');
      if (m.feeders.length && m.feeders.every(f => !f.doorShut)) warn('Block Door: no door starts shut, so the countdown only swaps open doors.');
    } else if (m.feeders.some(f => f.doorShut)) warn('A door is marked shut but Block Door turns is 0, so doors are ignored.');

    if (!m.lanes.length || m.lanes.every(l => !l.length)) err('The level has no boxes.');
    m.lanes.forEach((l, i) => { if (!l.length) warn(`Queue ${i + 1} is empty.`, { lane: i }); });
    if (m.blockedLane && (m.blockedLane.lane >= m.lanes.length)) err('Block Queue points at a queue that does not exist.');
    if (m.blockedLane && m.lanes.length < 2) warn('Block Queue needs at least 2 queues to count down.');

    const linked = {};
    m.links.forEach(([a, b], i) => {
      const A = CS.boxPos(m, a), B = CS.boxPos(m, b);
      if (!A || !B) { err(`Link ${i + 1} points at a box that no longer exists.`); return; }
      if (A.lane === B.lane) err(`Link ${i + 1}: linked boxes must sit in two different queues.`, { box: a });
      [a, b].forEach(x => { if (linked[x]) err('A box is in more than one link.', { box: x }); linked[x] = 1; });
    });

    const bal = CS.balance(m);
    let tItems = 0, tCap = 0;
    for (let c = 1; c <= 8; c++) {
      tItems += bal.items[c]; tCap += bal.cap[c];
      if (bal.items[c] !== bal.cap[c]) {
        const name = CS.COLORS[c].name;
        if (bal.items[c] > bal.cap[c]) err(`${name}: ${bal.items[c]} items but boxes only hold ${bal.cap[c]} (${bal.items[c] - bal.cap[c]} extra items).`, { color: c });
        else err(`${name}: boxes need ${bal.cap[c]} items but only ${bal.items[c]} exist (${bal.cap[c] - bal.items[c]} missing).`, { color: c });
      }
    }
    if (conv) {
      const cells = conv.rows * CS.ROW_W;
      if (tItems < cells) info(`All ${tItems} items fit on the conveyor (${cells} spots), so Enter Paths empty at the start.`);
    }
    if (!out.some(x => x.level === 'error')) info(`${tItems} items, ${m.lanes.reduce((a, l) => a + l.length, 0)} boxes, ${CS.usedColors(m).length} colours.`);
    return out;
  };

  /* ---------- generators ---------- */
  const shuffle = (a, rnd = Math.random) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  CS.shuffle = shuffle;

  /* Rebuild every Enter Path's items so each colour matches the box capacity of that colour. */
  CS.fillFeedersFromBoxes = function (m, opts) {
    opts = opts || {};
    const bal = CS.balance(m);
    const rows = [], loose = [];
    for (let c = 1; c <= 8; c++) {
      let n = bal.cap[c];
      if (opts.mode === 'mixed') { for (let i = 0; i < n; i++) loose.push(c); continue; }
      while (n >= CS.ROW_W) { rows.push([c, c, c, c]); n -= CS.ROW_W; }
      for (let i = 0; i < n; i++) loose.push(c);
    }
    shuffle(loose);
    for (let i = 0; i < loose.length; i += CS.ROW_W) {
      const r = loose.slice(i, i + CS.ROW_W);
      while (r.length < CS.ROW_W) r.push(0);
      rows.push(r);
    }
    shuffle(rows);
    let count = opts.feeders || m.feeders.length || 2;
    count = Math.max(1, Math.min(3, count));
    if (m.feeders.length !== count) {
      const ents = CS.defaultEntries(count);
      const old = m.feeders;
      m.feeders = ents.map((e, i) => old[i] ? Object.assign(old[i], { entry: old[i].entry }) : { entry: e, doorShut: false, rows: [], extra: {} });
      // keep entries unique
      const used = new Set();
      m.feeders.forEach((f, i) => { if (used.has(f.entry)) f.entry = CS.ENTRIES.find(x => !used.has(x)); used.add(f.entry); });
    }
    m.feeders.forEach(f => { f.rows = []; });
    rows.forEach((r, i) => m.feeders[i % count].rows.push({ cells: r, hidden: false, lock: 0 }));
    return m;
  };

  /* Quick random level: boxes first, then items that match them. */
  CS.randomLevel = function (m, o) {
    const colors = shuffle([1, 2, 3, 4, 5, 6, 7, 8]).slice(0, Math.max(1, Math.min(8, o.colors)));
    const lanes = Math.max(1, Math.min(8, o.lanes));
    const total = Math.max(1, o.boxes);
    const pool = [];
    for (let i = 0; i < total; i++) pool.push(colors[i % colors.length]);
    shuffle(pool);
    m.lanes = [];
    for (let l = 0; l < lanes; l++) m.lanes.push([]);
    pool.forEach((c, i) => {
      const r = Math.random();
      const size = r < o.big3 ? 3 : r < o.big3 + o.big2 ? 2 : 1;
      m.lanes[i % lanes].push({ uid: uid(), color: c, size, hidden: Math.random() < o.hidden, lock: 0, extra: {} });
    });
    m.links = [];
    CS.fillFeedersFromBoxes(m, { feeders: o.feeders, mode: o.mode });
    return m;
  };

  /* ---------- conveyor configs ---------- */
  // premade configs from js/conveyors.js (copied from the conveyors folder); a stand-in is used if that file is missing
  CS.PRESET_CONVEYORS = (window.CS_CONVEYORS && window.CS_CONVEYORS.length) ? window.CS_CONVEYORS :
    [{ id: 'square_19', name: 'Square 19', rows: 19, shape: { type: 'roundrect', w: 300, h: 210, r: 62 } }];

  CS.signedArea = function (poly) {
    let a = 0;
    for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; a += p.x * q.y - q.x * p.y; }
    return a / 2;
  };

  const ptOf = p => Array.isArray(p) ? { x: +p[0], y: +p[1] } : { x: +p.x, y: +(p.y != null ? p.y : p.z) };

  /* Accepts many reasonable layouts for an imported conveyor config. See README. */
  CS.normConveyor = function (raw, fallbackId) {
    if (!raw || typeof raw !== 'object') throw new Error('Conveyor config must be a JSON object.');
    // game format (formatVersion 2): loop.nodes and feeders[] use x / z world units; z grows toward the top of the screen
    const loopNodes = raw.loop && Array.isArray(raw.loop.nodes) ? raw.loop.nodes : null;
    if (loopNodes && loopNodes.length >= 3) {
      const id2 = String(raw.id || fallbackId || 'conveyor_' + Date.now());
      const rows2 = int(raw.rows, int((id2.match(/(\d+)\s*$/) || [])[1], 40));
      const toPt = n => [+n.x, -(+(n.z != null ? n.z : n.y))];
      const entries2 = {}, paths = {};
      (raw.feeders || []).forEach(f => {
        const side = String(f.side || '').toLowerCase();
        if (!CS.ENTRIES.includes(side)) return;
        if (f.mergeAt != null) entries2[side] = { row: int(f.mergeAt, 0) };
        if (Array.isArray(f.nodes) && f.nodes.length) paths[side] = f.nodes.map(toPt);
      });
      return {
        id: id2, name: (raw.meta && raw.meta.name) || raw.name || id2, rows: Math.max(4, rows2),
        shape: { type: 'points', points: loopNodes.map(toPt), smooth: int(raw.smooth, 0) },
        entries: Object.keys(entries2).length ? entries2 : null, feederPaths: paths,
        pickRows: raw.pickRows != null ? int(raw.pickRows, 0) : null, width: int(raw.width, 4), scale: raw.scale,
        direction: raw.direction, source: raw.__source || 'imported', format: 2
      };
    }
    const id = String(raw.id || raw.key || raw.name || fallbackId || 'conveyor_' + Date.now());
    const num = (id.match(/(\d+)\s*$/) || [])[1];
    const rows = int(raw.rows || raw.length || raw.rowCount || raw.capacity, num ? +num : 40);
    let shape = raw.shape && typeof raw.shape === 'object' && !Array.isArray(raw.shape) ? CS.clone(raw.shape) : null;
    const pts = raw.points || raw.path || raw.waypoints || raw.cells || (Array.isArray(raw.shape) ? raw.shape : null);
    if (!shape && Array.isArray(pts)) shape = { type: 'points', points: pts.map(ptOf).map(p => [p.x, p.y]), smooth: int(raw.smooth, 0) };
    if (!shape && (raw.svgPath || raw.d)) shape = { type: 'svg', d: raw.svgPath || raw.d };
    if (!shape && raw.type) shape = { type: raw.type, w: raw.w || raw.width, h: raw.h || raw.height, r: raw.r || raw.radius };
    if (!shape) shape = { type: 'roundrect', w: 300, h: 200, r: 60 };
    if (shape.type === 'rect') shape.type = 'roundrect';
    if (shape.type === 'roundrect') { shape.w = +shape.w || 300; shape.h = +shape.h || 200; shape.r = Math.min(+shape.r || 0, shape.w / 2, shape.h / 2); }
    if (shape.type === 'points' && (!Array.isArray(shape.points) || shape.points.length < 3)) throw new Error('A conveyor path needs at least 3 points.');
    let entries = raw.entries || raw.entryPoints || raw.enterPoints || raw.enters || raw.entrances || null;
    if (Array.isArray(entries)) {
      const o = {};
      entries.forEach((e, i) => {
        const k = String(e.id || e.name || e.side || e.key || CS.ENTRIES[i] || '').toLowerCase();
        const key = k.startsWith('l') ? 'left' : k.startsWith('m') || k.startsWith('c') ? 'middle' : k.startsWith('r') ? 'right' : null;
        if (key) o[key] = e;
      });
      entries = o;
    }
    return { id, name: raw.name || id, rows: Math.max(4, rows), shape, entries: entries || null, feederPaths: raw.feederPaths || null, pickRows: raw.pickRows != null ? int(raw.pickRows, 0) : null, direction: raw.direction, source: raw.__source || 'imported' };
  };

  /* Build sampled geometry: polyline, arc length, entry positions.
     The belt runs counter-clockwise on screen unless the config says "direction": "cw"; a path drawn the other way is
     reversed from the same start point, and row / t based entries are mirrored so they stay at the same place. */
  CS.buildGeom = function (cfg) {
    const s = cfg.shape;
    let poly = [];
    if (s.type === 'circle') {
      const r = +s.r || 100;
      for (let i = 0; i < 240; i++) { const a = -Math.PI / 2 + i / 240 * Math.PI * 2; poly.push({ x: r * Math.cos(a), y: r * Math.sin(a) }); }
    } else if (s.type === 'roundrect') {
      const w = s.w, h = s.h, r = Math.max(0.001, s.r);
      const arc = (cx, cy, a0) => { for (let i = 0; i <= 24; i++) { const a = a0 + i / 24 * Math.PI / 2; poly.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }); } };
      poly.push({ x: r, y: 0 }, { x: w - r, y: 0 });
      arc(w - r, r, -Math.PI / 2);
      poly.push({ x: w, y: h - r });
      arc(w - r, h - r, 0);
      poly.push({ x: r, y: h });
      arc(r, h - r, Math.PI / 2);
      poly.push({ x: 0, y: r });
      arc(r, r, Math.PI);
    } else if (s.type === 'svg' && typeof document !== 'undefined') {
      const NS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(NS, 'svg');
      svg.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden';
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', s.d);
      svg.appendChild(p); document.body.appendChild(svg);
      const L = p.getTotalLength();
      for (let i = 0; i < 400; i++) { const q = p.getPointAtLength(i / 400 * L); poly.push({ x: q.x, y: q.y }); }
      svg.remove();
    } else {
      poly = (s.points || []).map(ptOf);
      for (let it = 0; it < (s.smooth || 0); it++) {     // Chaikin corner cutting
        const n = []; const N = poly.length;
        for (let i = 0; i < N; i++) {
          const a = poly[i], b = poly[(i + 1) % N];
          n.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 }, { x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
        }
        poly = n;
      }
    }
    // drop duplicate closing point
    if (poly.length > 2) { const a = poly[0], b = poly[poly.length - 1]; if (Math.hypot(a.x - b.x, a.y - b.y) < 1e-6) poly.pop(); }
    const wantCW = String(cfg.direction || '').toLowerCase() === 'cw';
    const reversed = poly.length > 2 && (CS.signedArea(poly) > 0) !== wantCW;   // signed area > 0 = clockwise on screen (y down)
    if (reversed) poly = [poly[0]].concat(poly.slice(1).reverse());
    const cum = [0];
    for (let i = 1; i <= poly.length; i++) {
      const a = poly[i - 1], b = poly[i % poly.length];
      cum.push(cum[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
    }
    const total = cum[poly.length] || 1;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    poly.forEach(p => { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
    const g = { poly, cum, total, bbox: { minX, minY, maxX, maxY, w: maxX - minX || 1, h: maxY - minY || 1 }, rows: cfg.rows, reversed };
    g.pointAt = function (t) {
      t = ((t % 1) + 1) % 1;
      const d = t * total;
      let lo = 0, hi = poly.length;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid + 1] < d) lo = mid + 1; else hi = mid; }
      const i = Math.min(lo, poly.length - 1);
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const seg = (cum[i + 1] - cum[i]) || 1;
      const f = (d - cum[i]) / seg;
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, dx: (b.x - a.x) / seg, dy: (b.y - a.y) / seg };
    };
    g.nearestT = function (x, y) {
      let best = 0, bd = Infinity;
      for (let i = 0; i < 600; i++) { const p = g.pointAt(i / 600); const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; best = i / 600; } }
      return best;
    };
    // entries
    g.entryT = {};
    const E = cfg.entries;
    const flip = t => reversed ? 1 - t : t;      // t measured along the path as written
    const resolve = v => {
      if (v == null) return null;
      if (typeof v === 'number') return flip(v > 1 ? v / cfg.rows : v);
      if (typeof v === 'object') {
        if (v.t != null) return flip(+v.t);
        if (v.at != null) return flip(+v.at > 1 ? +v.at / cfg.rows : +v.at);
        if (v.row != null) return flip(+v.row / cfg.rows);
        if (v.index != null) return flip(+v.index / cfg.rows);
        if (v.x != null) { const p = ptOf(v); return g.nearestT(p.x, p.y); }
      }
      return null;
    };
    if (E) CS.ENTRIES.forEach(k => { const t = resolve(E[k]); if (t != null && isFinite(t)) g.entryT[k] = ((t % 1) + 1) % 1; });
    else {
      // default: three points along the top edge at 25 / 50 / 75 % of the width
      const fr = { left: 0.2, middle: 0.5, right: 0.8 };
      CS.ENTRIES.forEach(k => {
        const tx = g.bbox.minX + g.bbox.w * fr[k];
        let best = 0, bs = Infinity;
        for (let i = 0; i < 600; i++) { const p = g.pointAt(i / 600); const sc = Math.abs(p.x - tx) + (p.y - g.bbox.minY) * 2; if (sc < bs) { bs = sc; best = i / 600; } }
        g.entryT[k] = best;
      });
    }
    // Enter Path tracks (game format): keep the part nearest the loop so the view stays readable
    g.feederPaths = {};
    let vb = Object.assign({}, g.bbox);
    const maxLen = Math.max(g.bbox.w, g.bbox.h) * 0.75;
    Object.keys(cfg.feederPaths || {}).forEach(side => {
      const pts = cfg.feederPaths[side].map(ptOf);
      if (g.entryT[side] != null) { const m = g.pointAt(g.entryT[side]); pts.push({ x: m.x, y: m.y }); }
      // walk back from the merge point
      const out = [pts[pts.length - 1]];
      let len = 0;
      for (let i = pts.length - 2; i >= 0 && len < maxLen; i--) {
        const a = out[out.length - 1], b = pts[i];
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        if (len + d > maxLen) { const f = (maxLen - len) / d; out.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }); len = maxLen; break; }
        out.push(b); len += d;
      }
      g.feederPaths[side] = out;          // out[0] = merge point, then back toward the start of the path
      out.forEach(p => { vb.minX = Math.min(vb.minX, p.x); vb.maxX = Math.max(vb.maxX, p.x); vb.minY = Math.min(vb.minY, p.y); vb.maxY = Math.max(vb.maxY, p.y); });
    });
    vb.w = vb.maxX - vb.minX || 1; vb.h = vb.maxY - vb.minY || 1;
    g.vbox = vb;
    g.pickRows = cfg.pickRows;
    g.entryRow = {};
    Object.keys(g.entryT).forEach(k => { g.entryRow[k] = Math.round(g.entryT[k] * cfg.rows) % cfg.rows; });
    // pickup point: the belt row at the lowest point of the loop (middle of a flat bottom edge)
    let lowY = -Infinity;
    const ys = Array.from({ length: cfg.rows }, (_, p) => g.pointAt(p / cfg.rows));
    ys.forEach(p => { lowY = Math.max(lowY, p.y); });
    const midX = g.bbox.minX + g.bbox.w / 2, tol = g.bbox.h * 0.02;
    let lowRow = 0, bestX = Infinity;
    ys.forEach((p, i) => { if (p.y >= lowY - tol && Math.abs(p.x - midX) < bestX) { bestX = Math.abs(p.x - midX); lowRow = i; } });
    g.lowRow = lowRow;
    return g;
  };

})(window.CS);
