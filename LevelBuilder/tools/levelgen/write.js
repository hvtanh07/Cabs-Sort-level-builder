const fs=require('fs');const G=require('./gen.js');const out=require('./out.json');const V=require('./verify.json');
const D=require('path').join(__dirname,'../../')+'/';fs.mkdirSync(D+'levels',{recursive:true});
const levels=[];
for(const n of Object.keys(out).map(Number).sort((a,b)=>a-b)){const j=out[n].json;levels.push(j);fs.writeFileSync(D+'levels/'+j.id+'.json',G.CS.stringifyLevel(j));}
const ver='unlock40-'+require('crypto').createHash('md5').update(JSON.stringify(levels)).digest('hex').slice(0,8);
fs.writeFileSync(D+'js/levels.js','/* The 40 element-unlock levels (copies of the files in levels/). Built by the level generator; loaded into the list once per version. */\nwindow.CS_BUNDLED_LEVELS = '+JSON.stringify({version:ver,levels})+';\n');
console.log(ver, levels.length);
