'use strict';
/* Writes the levels chosen by dscan.js: node dapply.js [design.json] [levels]
   design.json maps level number -> { S, seed } (the settings and seed dscan.js printed). Each level is built by design.js
   and replaces its file in levels/ and its entry in js/levels.js; the other levels stay as they are. */
const fs = require('fs'), path = require('path');
const G = require('./gen.js'), DZ = require('./design.js');
const file = process.argv[2] || path.join(__dirname, 'design.json');
const only = process.argv[3] ? process.argv[3].split(',').map(Number) : null;
const pick = JSON.parse(fs.readFileSync(file, 'utf8'));
const D = path.join(__dirname, '../../');
const LJ = D + 'js/levels.js';
global.window = global; eval(fs.readFileSync(LJ, 'utf8'));
const levels = window.CS_BUNDLED_LEVELS.levels;
Object.keys(pick).map(Number).filter(n => !only || only.includes(n)).sort((a, b) => a - b).forEach(n => {
  const { json } = DZ.make(pick[n].S, pick[n].seed);
  // `post`: element edits made on top of the built level (user, 2026-11-06: an element from the start of the level)
  (pick[n].post || []).forEach(e => {
    if (e.t === 'lock') json.lanes[e.lane][e.depth].lockTurns = e.turns;
    else if (e.t === 'hidden') json.lanes[e.lane][e.depth].hidden = true;
    // user (2026-11-07): more sends to open the Locked Items, same layout
    else if (e.t === 'lockadd') Object.values(json.feeders).forEach(f => (f.lockedRows || []).forEach(r => { r.lockTurns += e.add; }));
    else if (e.t === 'link') (json.links = json.links || []).push({ a: { lane: e.lane, tray: e.depth }, b: { lane: e.lane2, tray: e.depth2 } });
  });
  const i = levels.findIndex(j => j.id === json.id);
  if (i !== n - 1) throw new Error('level ' + n + ' id ' + json.id + ' not at its place');
  levels[i] = json;
  fs.writeFileSync(D + 'levels/' + json.id + '.json', G.CS.stringifyLevel(json));
  console.log(n, json.id, json.meta.difficulty);
});
const ver = 'unlock40-' + require('crypto').createHash('md5').update(JSON.stringify(levels)).digest('hex').slice(0, 8);
fs.writeFileSync(LJ, '/* The 40 element-unlock levels (copies of the files in levels/). Built by the level generator; loaded into the list once per version. */\nwindow.CS_BUNDLED_LEVELS = ' + JSON.stringify({ version: ver, levels }) + ';\n');
console.log(ver, levels.length);
