const G=require('./gen.js'),SP=require('./specs.js');const out=require('./out.json');const CS=G.CS;
const rows=[];
for(const S of SP){const j=out[S.n].json;const m=CS.fromJSON(j);
 const warn=CS.validate(m,null).filter(x=>x.level!=='info').map(x=>x.msg);
 const b=j.lanes.flat();const items=j.feeders.reduce((a,f)=>a+f.bottles.length,0);
 const feat=[];const nh=b.filter(x=>x.hidden).length;if(nh)feat.push(`Hidden ×${nh} (${[...new Set(b.filter(x=>x.hidden).map(x=>(x.size||1)*4))].sort((p,q)=>p-q).join('/')} items)`);
 const nl=b.filter(x=>x.lockTurns).length;if(nl)feat.push(`Locked Box ×${nl}`);if(j.links.length)feat.push(`Linked ×${j.links.length}`);
 if(j.doorTurns)feat.push(`Block Door (${j.doorTurns})`);const li=j.feeders.reduce((a,f)=>a+(f.lockedRows||[]).length,0);if(li)feat.push(`Locked Item rows ×${li}`);if(j.blockedLane)feat.push(`Block Queue (${j.blockedLane.lockTurns})`);
 const sizes={};b.forEach(x=>sizes[x.size||1]=(sizes[x.size||1]||0)+1);
 const runs=S.n<=10?300:200;const r={};
 for(const k of (S.n<=10?['low','zon','zoff','lowNP','zonNP','zoffNP']:['low','zon','zoff'])) r[k]=G.rate(m,G.MODES[k],1,runs,7000);
 const sm=['low','zoff'].map(k=>G.play(m,G.MODES[k],'smart',1));
 rows.push({n:S.n,name:j.meta.name,diff:j.meta.difficulty,conv:j.conveyor,queues:j.lanes.length,paths:j.feeders.map(f=>f.entry[0].toUpperCase()).join(''),colors:j.colors.length,boxes:b.length,sizes,items,belt:G.GEOM[j.conveyor].rows*4,feat:feat.join(', '),smart:sm.map(x=>x.win),smartTicks:sm[0].ticks,rnd:Object.fromEntries(Object.entries(r).map(([k,v])=>[k,v.rate])),fs:r.low.fs,warn});
 console.log(S.n, JSON.stringify(rows[rows.length-1]).slice(0,330));
}
require('fs').writeFileSync(require('path').join(__dirname,'verify.json'),JSON.stringify(rows,null,1));
