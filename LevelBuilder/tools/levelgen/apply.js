'use strict';
/* Writes the levels chosen by retune.js: node apply.js retune.json
   retune.json maps level number -> { over, seed } (the settings and seed retune.js printed). Each level is built from its
   specs.js entry with those settings, gets the difficulty of its GDD role (playtest.js `role`) and replaces its file in
   levels/ and its entry in js/levels.js; the other levels stay as they are. */
const fs = require('fs'), path = require('path');
const G = require('./gen.js'), SPECS = require('./specs.js'), P = require('./playtest.js');
const pick = JSON.parse(fs.readFileSync(process.argv[2] || path.join(__dirname, 'retune.json'), 'utf8'));
const D = path.join(__dirname, '../../');
const LJ = D + 'js/levels.js';
global.window = global; eval(fs.readFileSync(LJ, 'utf8'));
const levels = window.CS_BUNDLED_LEVELS.levels;
const DIFF = { tutorial: 'easy', intro: 'easy', 'after-hard': 'easy', medium: 'medium', 'pre-hard': 'medium', hard: 'hard' };
Object.keys(pick).map(Number).sort((a, b) => a - b).forEach(n => {
  const base = SPECS.find(s => s.n === n), o = pick[n];
  const S = Object.assign({}, base, base.watchTries ? base.watchTries[0] : {}, o.over);
  const { json } = G.make(S, o.seed);
  json.meta.difficulty = DIFF[P.role(n)];
  const i = levels.findIndex(j => j.id === json.id);
  if (i !== n - 1) throw new Error('level ' + n + ' id ' + json.id + ' not at its place');
  levels[i] = json;
  fs.writeFileSync(D + 'levels/' + json.id + '.json', G.CS.stringifyLevel(json));
  console.log(n, json.id, json.meta.difficulty);
});
const ver = 'unlock40-' + require('crypto').createHash('md5').update(JSON.stringify(levels)).digest('hex').slice(0, 8);
fs.writeFileSync(LJ, '/* The 40 element-unlock levels (copies of the files in levels/). Built by the level generator; loaded into the list once per version. */\nwindow.CS_BUNDLED_LEVELS = ' + JSON.stringify({ version: ver, levels }) + ';\n');
console.log(ver, levels.length);
