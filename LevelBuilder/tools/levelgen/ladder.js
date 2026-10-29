'use strict';
/* Bot ladder: plays every level (or node ladder.js 5,6) with the six bots in gen.js BOTS, from blind taps to careful play,
   and writes the win rates and the rung each level needs into the "Bot ladder" section of levels/README.md. */
const fs = require('fs'), path = require('path');
const G = require('./gen.js');
const only = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
global.window = global; eval(fs.readFileSync(path.join(__dirname, '../../js/levels.js'), 'utf8'));
const levels = window.CS_BUNDLED_LEVELS.levels;
const RUNS = 200, WIN = 0.9;
// the first rung that wins at least 90 % of runs names the level's difficulty
const LABEL = { stay: 'Very easy', turns: 'Very easy', random: 'Very easy', novice: 'Easy', casual: 'Medium', watcher: 'Hard', careful: 'Very hard' };
const md = path.join(__dirname, '../../levels/README.md');
let text = fs.readFileSync(md, 'utf8');
const old = {};
(text.match(/<!-- ladder -->[\s\S]*?<!-- \/ladder -->/) || [''])[0].split('\n').forEach(l => { const m = l.match(/^\| (\d+) \|/); if (m) old[m[1]] = l; });
const rows = levels.map((j, i) => {
  const n = i + 1;
  if (only && !only.includes(n)) return old[n];
  const r = G.ladder(G.CS.fromJSON(j), G.MODES.fly, RUNS, 7000);
  const k = r.findIndex((x, i) => !G.BOTS[i].extra && x >= WIN);
  const need = k < 0 ? 'none' : G.BOTS[k].name;
  const row = `| ${n} | ${j.meta.name} | ${j.meta.difficulty} | ${r.map(x => Math.round(x * 100) + '%').join(' | ')} | ${need} | ${k < 0 ? 'Unwinnable' : LABEL[G.BOTS[k].id]} |`;
  console.log(row);
  return row;
});
const head = [
  '<!-- ladder -->',
  `Win rate of each bot over ${RUNS} runs (items fly straight to any matching box, belt starting full). Built by \`tools/levelgen/ladder.js\`.`,
  '',
  ...G.BOTS.map(b => `- **${b.name}**: ${b.note}.`),
  '',
  `"Needs" is the first bot that wins ${WIN * 100} % or more of runs, and "Ladder rating" turns it into a difficulty: either Blind bot or Random tap = Very easy, Beginner = Easy, Casual = Medium, Belt watcher = Hard, Careful = Very hard. The careful bot plays without luck, so it always shows 0 % or 100 %. The blind bots try a random order of the queues each run; a level that \"Blind, in turn\" wins can be cleared by tapping the queues in turn without looking.`,
  '',
  `| # | Name | Difficulty | ${G.BOTS.map(b => b.name).join(' | ')} | Needs | Ladder rating |`,
  `|---|---|---|${G.BOTS.map(() => '---').join('|')}|---|---|`
];
const block = head.concat(rows.filter(Boolean), '<!-- /ladder -->').join('\n');
text = /<!-- ladder -->/.test(text) ? text.replace(/<!-- ladder -->[\s\S]*?<!-- \/ladder -->/, block) : text.trimEnd() + '\n\n## Bot ladder\n\n' + block + '\n';
fs.writeFileSync(md, text);
