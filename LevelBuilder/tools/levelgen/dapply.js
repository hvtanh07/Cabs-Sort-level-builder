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
  const i = levels.findIndex(j => j.id === json.id);
  if (i !== n - 1) throw new Error('level ' + n + ' id ' + json.id + ' not at its place');
  levels[i] = json;
  fs.writeFileSync(D + 'levels/' + json.id + '.json', G.CS.stringifyLevel(json));
  console.log(n, json.id, json.meta.difficulty);
});
const ver = 'unlock40-' + require('crypto').createHash('md5').update(JSON.stringify(levels)).digest('hex').slice(0, 8);
fs.writeFileSync(LJ, '/* The 40 element-unlock levels (copies of the files in levels/). Built by the level generator; loaded into the list once per version. */\nwindow.CS_BUNDLED_LEVELS = ' + JSON.stringify({ version: ver, levels }) + ';\n');
console.log(ver, levels.length);
