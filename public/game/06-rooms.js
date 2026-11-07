const IR=(()=>{
const FT="Inter, sans-serif", FD="'Inter Display', Inter, sans-serif";
let C={ox:640,oy:150,tw:70,th:35,tz:33};
const P=(x,y,z=0)=>[C.ox+(x-y)*C.tw/2, C.oy+(x+y)*C.th/2-z*C.tz];
const f1=n=>(+n).toFixed(1), pts=a=>a.map(p=>f1(p[0])+','+f1(p[1])).join(' ');
const poly=(a,at)=>'<polygon points="'+pts(a)+'" '+(at||'')+'/>';
function hx(c){ c=c.replace('#',''); return [0,2,4].map(i=>parseInt(c.substr(i,2),16)); }
function rgb(a){ return '#'+a.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join(''); }
function mix(a,b,t){ const A=hx(a),B=hx(b); return rgb(A.map((v,i)=>v+(B[i]-v)*t)); }
const lt=(c,t)=>mix(c,'#ffffff',t), dk=(c,t)=>mix(c,'#3A2E2A',t);
const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
let GID=0;
// faces softened: same-colour stroke with round joins (gives Two Point-like softness)
const face=(a,c)=>poly(a,'fill="'+c+'" stroke="'+c+'" stroke-width="1.6" stroke-linejoin="round"');
const SH=c=>[lt(c,.22),c,dk(c,.13)];
const DEFS='<defs><filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter><filter id="soft2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>'+
  '<filter id="ds" x="-20%" y="-20%" width="140%" height="170%"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#5B4636" flood-opacity=".18"/></filter>'+
  '<linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE9F7"/><stop offset="1" stop-color="#8CC3E3"/></linearGradient>'+
  '<linearGradient id="glassR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9D2EA"/><stop offset="1" stop-color="#6FA6CC"/></linearGradient>'+
  '<radialGradient id="bgv" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="#FBF8F2"/><stop offset="1" stop-color="#EDE5D7"/></radialGradient>'+
  '<pattern id="grass" width="26" height="26" patternUnits="userSpaceOnUse"><rect width="26" height="26" fill="#CFE3B0"/><path d="M5 9l1-3 1 3M16 20l1-3 1 3M20 6l.8-2.4.8 2.4" stroke="#B9D596" stroke-width="1.1" fill="none" stroke-linecap="round"/></pattern>'+
  '<pattern id="wood" width="40" height="20" patternUnits="userSpaceOnUse"><rect width="40" height="20" fill="#E9CFA6"/><path d="M0 10h40M20 0v10M0 10v10" stroke="#DDBF92" stroke-width="1"/></pattern></defs>';

// ---------------- primitives ----------------
function box(x0,y0,x1,y1,z0,z1,c,o={}){ const [t,l,r]=SH(c); let s='';
  const L=[P(x0,y1,z0),P(x1,y1,z0),P(x1,y1,z1),P(x0,y1,z1)], R=[P(x1,y0,z0),P(x1,y1,z0),P(x1,y1,z1),P(x1,y0,z1)], Tp=[P(x0,y0,z1),P(x1,y0,z1),P(x1,y1,z1),P(x0,y1,z1)];
  s+=face(L,o.l||l)+face(R,o.r||r)+face(Tp,o.top||t);
  if(o.ao!==false&&z0===0&&(z1-z0)>.4){ const id='ao'+(++GID); s+='<defs><linearGradient id="'+id+'" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#3A2E2A" stop-opacity=".22"/><stop offset="1" stop-color="#3A2E2A" stop-opacity="0"/></linearGradient></defs>'+poly([P(x0,y1,0),P(x1,y1,0),P(x1,y1,.35),P(x0,y1,.35)],'fill="url(#'+id+')"')+poly([P(x1,y0,0),P(x1,y1,0),P(x1,y1,.35),P(x1,y0,.35)],'fill="url(#'+id+')"'); }
  if(o.edge) s+='<polyline points="'+pts([P(x0,y1,z1),P(x1,y1,z1),P(x1,y0,z1)])+'" fill="none" stroke="'+lt(c,.5)+'" stroke-width="1.4" stroke-linecap="round"/>';
  return s; }
function windows(x0,y0,x1,y1,z0,z1,fl,frame,o={}){ let s=''; const n=fl;
  for(let k=0;k<n;k++){ const za=z0+(k+.3)*(z1-z0)/n, zb=za+(z1-z0)/n*.45;
    for(let x=x0+.32;x<x1-.3;x+=.64){ const xb=Math.min(x+.42,x1-.18); if(o.skipL&&k===0&&x>o.skipL[0]&&x<o.skipL[1]) continue; const a=[P(x,y1,za),P(xb,y1,za),P(xb,y1,zb),P(x,y1,zb)];
      s+=poly(a,'fill="'+frame+'" stroke="'+frame+'" stroke-width="3.2" stroke-linejoin="round"')+poly(a,'fill="url(#glass)"')+poly([a[0],lerp(a[0],a[1],.4),lerp(a[3],a[2],.15),a[3]],'fill="#fff" opacity=".35"'); }
    for(let y=y0+.32;y<y1-.3;y+=.64){ const yb=Math.min(y+.42,y1-.18); const a=[P(x1,y,za),P(x1,yb,za),P(x1,yb,zb),P(x1,y,zb)];
      s+=poly(a,'fill="'+dk(frame,.1)+'" stroke="'+dk(frame,.1)+'" stroke-width="3.2" stroke-linejoin="round"')+poly(a,'fill="url(#glassR)"'); } }
  return s; }
function door(x,y1,z,c,w){ w=w||.75; return poly([P(x,y1,z),P(x+w,y1,z),P(x+w,y1,z+.82),P(x,y1,z+.82)],'fill="'+dk(c,.05)+'" stroke="'+dk(c,.05)+'" stroke-width="3" stroke-linejoin="round"')+poly([P(x+.06,y1,z),P(x+w-.06,y1,z),P(x+w-.06,y1,z+.74),P(x+.06,y1,z+.74)],'fill="url(#glass)"')+'<line x1="'+f1(P(x+w/2,y1,z)[0])+'" y1="'+f1(P(x+w/2,y1,z)[1])+'" x2="'+f1(P(x+w/2,y1,z+.74)[0])+'" y2="'+f1(P(x+w/2,y1,z+.74)[1])+'" stroke="'+dk(c,.05)+'" stroke-width="2"/>'; }
function awning(x0,x1,y1,z,c){ return poly([P(x0,y1,z),P(x1,y1,z),P(x1,y1+.45,z-.18),P(x0,y1+.45,z-.18)],'fill="'+c+'" stroke="'+c+'" stroke-width="1.5" stroke-linejoin="round"')+[...Array(Math.round((x1-x0)/.25))].map((_,i)=>i%2?'':poly([P(x0+i*.25,y1,z),P(x0+i*.25+.25,y1,z),P(x0+i*.25+.25,y1+.45,z-.18),P(x0+i*.25,y1+.45,z-.18)],'fill="#fff" opacity=".85"')).join(''); }
function shadow(x0,y0,x1,y1,h){ const dx=h*.5,dy=h*.16; return poly([P(x0,y0),P(x1,y0),P(x1+dx,y0+dy),P(x1+dx,y1+dy),P(x0+dx,y1+dy),P(x0,y1)],'fill="#6B5A3E" opacity=".22" filter="url(#soft)"'); }
function cyl(cx,cy,r,z0,z1,c,dome){ const [t,l,rr]=SH(c), a=P(cx,cy,z0), b=P(cx,cy,z1), rx=r*C.tw*.707, ry=r*C.th*.707, id='cy'+(++GID); let s='<defs><linearGradient id="'+id+'" x1="0" x2="1"><stop offset="0" stop-color="'+lt(c,.12)+'"/><stop offset=".5" stop-color="'+c+'"/><stop offset="1" stop-color="'+rr+'"/></linearGradient></defs>';
  s+='<path d="M'+f1(a[0]-rx)+' '+f1(a[1])+'A'+f1(rx)+' '+f1(ry)+' 0 0 0 '+f1(a[0]+rx)+' '+f1(a[1])+'L'+f1(b[0]+rx)+' '+f1(b[1])+'A'+f1(rx)+' '+f1(ry)+' 0 0 1 '+f1(b[0]-rx)+' '+f1(b[1])+'Z" fill="url(#'+id+')"/>';
  if(dome){ const id2='dm'+(++GID); s+='<defs><radialGradient id="'+id2+'" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="'+t+'"/><stop offset="1" stop-color="'+rr+'"/></radialGradient></defs><path d="M'+f1(b[0]-rx)+' '+f1(b[1])+'A'+f1(rx)+' '+f1(rx*.9)+' 0 0 1 '+f1(b[0]+rx)+' '+f1(b[1])+'A'+f1(rx)+' '+f1(ry)+' 0 0 1 '+f1(b[0]-rx)+' '+f1(b[1])+'Z" fill="url(#'+id2+')"/>'; }
  else s+='<ellipse cx="'+f1(b[0])+'" cy="'+f1(b[1])+'" rx="'+f1(rx)+'" ry="'+f1(ry)+'" fill="'+t+'"/>';
  return s; }
function tree(x,y,k,hue){ const g=P(x,y), s=k||1, c=hue||'#7DBB6A';
  return '<ellipse cx="'+f1(g[0]+9*s)+'" cy="'+f1(g[1]+3)+'" rx="'+f1(18*s)+'" ry="'+f1(7*s)+'" fill="#6B5A3E" opacity=".18" filter="url(#soft2)"/><rect x="'+f1(g[0]-2.6*s)+'" y="'+f1(g[1]-14*s)+'" width="'+f1(5.2*s)+'" height="'+f1(15*s)+'" rx="2.6" fill="#A98463"/>'+
    '<ellipse cx="'+f1(g[0])+'" cy="'+f1(g[1]-29*s)+'" rx="'+f1(15*s)+'" ry="'+f1(19*s)+'" fill="'+dk(c,.06)+'"/><ellipse cx="'+f1(g[0]-3*s)+'" cy="'+f1(g[1]-33*s)+'" rx="'+f1(11*s)+'" ry="'+f1(14*s)+'" fill="'+c+'"/><ellipse cx="'+f1(g[0]-6*s)+'" cy="'+f1(g[1]-39*s)+'" rx="'+f1(4.5*s)+'" ry="'+f1(5.5*s)+'" fill="'+lt(c,.35)+'"/>'; }
function bush(x,y,c){ const g=P(x,y); c=c||'#86C272'; return '<ellipse cx="'+f1(g[0])+'" cy="'+f1(g[1]-6)+'" rx="13" ry="9" fill="'+dk(c,.06)+'"/><ellipse cx="'+f1(g[0]-3)+'" cy="'+f1(g[1]-9)+'" rx="8" ry="6" fill="'+lt(c,.2)+'"/>'; }
function lamp(x,y){ const g=P(x,y); return '<line x1="'+f1(g[0])+'" y1="'+f1(g[1])+'" x2="'+f1(g[0])+'" y2="'+f1(g[1]-34)+'" stroke="#7D8794" stroke-width="2.4" stroke-linecap="round"/><path d="M'+f1(g[0])+' '+f1(g[1]-34)+'q8-4 12 2" fill="none" stroke="#7D8794" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="'+f1(g[0]+12)+'" cy="'+f1(g[1]-31)+'" rx="4" ry="2.5" fill="#FFF3C4"/>'; }
function bench(x,y){ return box(x-.4,y-.12,x+.4,y+.12,.18,.24,'#B98A5E',{ao:false})+box(x-.36,y-.08,x-.3,y+.08,0,.18,'#7D8794',{ao:false})+box(x+.3,y-.08,x+.36,y+.08,0,.18,'#7D8794',{ao:false}); }
function car(x,y,col,rot){ const [a,b]=rot?[.42,.8]:[.8,.42]; return '<ellipse cx="'+f1(P(x,y)[0]+4)+'" cy="'+f1(P(x,y)[1]+2)+'" rx="22" ry="8" fill="#6B5A3E" opacity=".2" filter="url(#soft2)"/>'+box(x-a/2,y-b/2,x+a/2,y+b/2,.06,.3,col,{ao:false})+box(x-a/2+.1,y-b/2+.12,x+a/2-.1,y+b/2-.12,.3,.5,'#DCEBF5',{ao:false}); }
// ---------------- people (Two Point-ish: oval heads, pill bodies, simple dot faces) ----------------
const SKIN=['#F2CBA8','#D9A27A','#A9714E','#7A4B33','#F6D9BE'], HAIR=['#3A2A22','#8A5A35','#1F1A17','#C98B4A','#6B6B6B','#E9C46A'];
function walker(x,y,i,dir){ const g=P(x,y), sk=SKIN[i%5], hr=HAIR[i%6], cl=['#F07B6B','#5FA8D3','#6CC4A1','#F2B544','#9B8CE0','#E98AB0','#4F7FC0'][i%7];
  return '<g transform="translate('+f1(g[0])+' '+f1(g[1])+') scale('+(dir||1)+' 1)"><ellipse cx="2" cy="1" rx="8" ry="3" fill="#6B5A3E" opacity=".25"/><path d="M-2.5 0v-8M2.5 0v-8" stroke="#55606E" stroke-width="2.6" stroke-linecap="round"/><path d="M-6-8q0-11 6-12q6 1 6 12z" fill="'+cl+'"/><ellipse cx="0" cy="-25" rx="5.2" ry="6.2" fill="'+sk+'"/><path d="M-5.4-26q0-6.5 5.4-6.6q5.4.1 5.4 6.6q-3-3-5.4-3q-2.4 0-5.4 3z" fill="'+hr+'"/><circle cx="2" cy="-25" r=".9" fill="#3A2E2A"/><circle cx="4.2" cy="-25" r=".9" fill="#3A2E2A"/></g>'; }
function sitter(cx,cy,s,o){ // upper body for room scenes
  const sk=o.skin, hr=o.hair, su=o.suit;
  return '<g transform="translate('+cx+' '+cy+') scale('+s+')"><path d="M-34 0q0-40 34-42q34 2 34 42z" fill="'+su+'"/><path d="M-34 0q0-40 34-42q-18 12-20 42z" fill="'+lt(su,.14)+'"/><path d="M-8-41l8 13l8-13z" fill="'+(o.shirt||'#fff')+'"/>'+(o.tie?'<path d="M-2.5-30h5l2 18h-9z" fill="'+o.tie+'"/>':'')+(o.badge?'<rect x="10" y="-26" width="12" height="8" rx="2" fill="'+o.badge+'"/>':'')+
    '<rect x="-6" y="-50" width="12" height="11" rx="4" fill="'+dk(sk,.07)+'"/><ellipse cx="0" cy="-66" rx="17" ry="21" fill="'+sk+'"/>'+hairS(o)+
    '<ellipse cx="-6" cy="-66" rx="1.9" ry="2.4" fill="#3A2E2A"/><ellipse cx="6" cy="-66" rx="1.9" ry="2.4" fill="#3A2E2A"/><path d="M-5-56q5 '+(o.mood||4)+' 10 0" stroke="#8A4A3A" stroke-width="1.8" fill="none" stroke-linecap="round"/><ellipse cx="-10" cy="-59" rx="3.5" ry="2" fill="#F08A7A" opacity=".3"/><ellipse cx="10" cy="-59" rx="3.5" ry="2" fill="#F08A7A" opacity=".3"/>'+
    (o.glasses?'<circle cx="-6" cy="-66" r="5" fill="none" stroke="#3A2E2A" stroke-width="1.5"/><circle cx="6" cy="-66" r="5" fill="none" stroke="#3A2E2A" stroke-width="1.5"/><path d="M-1-66h2" stroke="#3A2E2A" stroke-width="1.5"/>':'')+'</g>'; }
function hairS(o){ const c=o.hair; if(o.hs==='bun') return '<circle cx="0" cy="-90" r="8" fill="'+c+'"/><path d="M-17-66q-2-23 17-24q19 1 17 24q-6-10-17-11q-11 1-17 11z" fill="'+c+'"/>'; if(o.hs==='long') return '<path d="M-18-66q-3-24 18-25q21 1 18 25v26q-5 3-8-1v-20q-10-6-20-6q-8 5-10 6v20q-3 4-8 1z" fill="'+c+'"/>'; if(o.hs==='bald') return '<path d="M-17-62q-2-8 3-12M17-62q2-8-3-12" stroke="'+c+'" stroke-width="4" fill="none" stroke-linecap="round"/>'; return '<path d="M-17-64q-3-26 17-27q20 1 17 27q-4-9-10-10q-7 5-20 2q-4 3-4 8z" fill="'+c+'"/>'; }
// ---------------- HUD (Surviving Mars-like resource bar, light) ----------------
function ico(k,c){ const I={cr:'<circle r="7" fill="none" stroke="#fff" stroke-width="2"/><path d="M2.5-2.5a3.5 3.5 0 1 0 0 5M-4-1h5M-4 1h5" stroke="#fff" stroke-width="1.6" fill="none"/>',sci:'<path d="M-2-7h4M-1-7v5l-5 8h12l-5-8v-5" stroke="#fff" stroke-width="1.8" fill="none" stroke-linejoin="round"/>',rep:'<path d="M0-7l2.2 4.6 5 .6-3.7 3.4 1 5L0 4.2-4.5 6.6l1-5L-7.2-1.8l5-.6z" fill="#fff"/>',xp:'<path d="M-6 5l6-11 6 11z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>',time:'<circle r="7" fill="none" stroke="#fff" stroke-width="2"/><path d="M0-4v4l3 2" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>',sat:'<rect x="-3" y="-3" width="6" height="6" fill="#fff"/><rect x="-9" y="-2" width="5" height="4" fill="#fff"/><rect x="4" y="-2" width="5" height="4" fill="#fff"/>',team:'<circle cx="-3" cy="-3" r="3" fill="#fff"/><circle cx="4" cy="-2" r="2.5" fill="#fff"/><path d="M-8 6q5-8 10 0M1 6q3-6 7 0" fill="#fff"/>'};
  return '<circle r="12" fill="'+c+'"/>'+I[k]; }
function topBar(){ const items=[['cr','#3FA86B','450','crediti'],['sci','#5FA8D3','128','scienza'],['rep','#F2B544','68%','reputazione'],['team','#E98AB0','12','staff'],['sat','#9B8CE0','2/3','missioni']];
  let s='<g filter="url(#ds)"><rect x="300" y="12" width="680" height="54" rx="27" fill="#FFFDF8"/></g>'; items.forEach((it,i)=>{ const x=336+i*126; s+='<g transform="translate('+x+' 39)">'+ico(it[0],it[1])+'</g><text x="'+(x+20)+'" y="38" font-family="'+FD+'" font-weight="800" font-size="18" fill="#3A2E2A">'+it[2]+'</text><text x="'+(x+20)+'" y="54" font-family="'+FT+'" font-size="10.5" fill="#9A8B7A">'+it[3]+'</text>'+(i<4?'<line x1="'+(x+104)+'" y1="24" x2="'+(x+104)+'" y2="54" stroke="#EDE5D7" stroke-width="2"/>':''); });
  // left: level medallion + speed
  s+='<g filter="url(#ds)"><circle cx="54" cy="46" r="34" fill="#FFFDF8"/></g><circle cx="54" cy="46" r="26" fill="none" stroke="#EDE5D7" stroke-width="6"/><path d="M54 20a26 26 0 0 1 24.7 17.9" fill="none" stroke="#F07B6B" stroke-width="6" stroke-linecap="round"/><text x="54" y="44" text-anchor="middle" font-family="'+FT+'" font-weight="700" font-size="10" fill="#9A8B7A">LIV</text><text x="54" y="62" text-anchor="middle" font-family="'+FD+'" font-weight="900" font-size="20" fill="#3A2E2A">2</text>'+
    '<g filter="url(#ds)"><rect x="100" y="24" width="150" height="44" rx="22" fill="#FFFDF8"/></g>'+['M120 36v16M127 36v16','M150 34l12 10-12 10z','M178 34l10 10-10 10zM190 34l10 10-10 10z','M215 34l8 10-8 10zM224 34l8 10-8 10zM233 34l8 10-8 10z'].map((d,i)=>'<path d="'+d+'" fill="'+(i===1?'#3A2E2A':'#C9BBA8')+'" stroke="'+(i===0?'#C9BBA8':'none')+'" stroke-width="4" stroke-linecap="round"/>').join('');
  // right: mission chip
  s+='<g filter="url(#ds)"><rect x="1000" y="12" width="264" height="54" rx="27" fill="#FFFDF8"/></g><circle cx="1030" cy="39" r="15" fill="#5FA8D3"/><text x="1030" y="44" text-anchor="middle" font-family="'+FD+'" font-weight="900" font-size="13" fill="#fff">A</text><text x="1054" y="35" font-family="'+FT+'" font-size="10.5" fill="#9A8B7A">MISSIONE · FASE A</text><text x="1054" y="54" font-family="'+FD+'" font-weight="800" font-size="17" fill="#3A2E2A">AURASAT</text><rect x="1176" y="28" width="74" height="22" rx="11" fill="#FDEBD9"/><text x="1213" y="43" text-anchor="middle" font-family="'+FT+'" font-weight="700" font-size="11" fill="#C2410C">2 avvisi</text>';
  return s; }
function alertPill(y,t,c){ return '<g filter="url(#ds)"><rect x="20" y="'+y+'" width="330" height="40" rx="20" fill="#FFFDF8"/></g><circle cx="42" cy="'+(y+20)+'" r="12" fill="'+c+'"/><text x="42" y="'+(y+25)+'" text-anchor="middle" font-family="'+FD+'" font-weight="900" font-size="15" fill="#fff">!</text><text x="62" y="'+(y+25)+'" font-family="'+FT+'" font-weight="600" font-size="14" fill="#3A2E2A">'+t+'</text>'; }

// ---------------- build menu tiles (harmonised mini renders) ----------------
function miniScene(fn){ const keep=C; C={ox:0,oy:0,tw:26,th:13,tz:12.5}; const s=fn(); C=keep; return s; }
function tile(x,y,label,inner,sel,lock){ return '<g transform="translate('+x+' '+y+')"><rect x="-44" y="-44" width="88" height="88" rx="22" fill="'+(sel?'#FFF1E6':'#FFFDF8')+'" stroke="'+(sel?'#F07B6B':'#EDE5D7')+'" stroke-width="2.5"/><ellipse cx="0" cy="10" rx="34" ry="14" fill="'+(lock?'#EFEAE2':'#F3EBDD')+'"/><g transform="translate(0 6)"'+(lock?' opacity=".45" filter="url(#gray)"':'')+'>'+inner+'</g>'+(lock?'<g transform="translate(26 -26)"><circle r="11" fill="#9A8B7A"/><rect x="-5" y="-2" width="10" height="8" rx="2" fill="#fff"/><path d="M-3-2v-3a3 3 0 0 1 6 0v3" fill="none" stroke="#fff" stroke-width="2"/></g>':'')+'<text y="62" text-anchor="middle" font-family="'+FT+'" font-weight="600" font-size="12.5" fill="#3A2E2A">'+label+'</text></g>'; }
function buildMenu(){ let s='<defs><filter id="gray"><feColorMatrix type="saturate" values="0"/></filter></defs><g filter="url(#ds)"><rect x="300" y="618" width="680" height="168" rx="26" fill="#FFFDF8"/></g>';
  const T=[['Lab. prove',()=>box(-1,-1,1,1,0,1.2,'#F7F4EE')+box(-1,-1,1,1,1.2,1.32,'#6CC4A1')+cyl(.2,-.2,.55,1.32,1.6,'#FFFFFF',true)],
    ['Termovuoto',()=>box(-1.1,-.8,1.1,.8,0,.25,'#D9DEE5')+cyl(0,0,.7,.25,1.5,'#C9D3DD')+cyl(0,0,.5,1.5,1.6,'#9AA7B6')],
    ['Antenna',()=>box(-.3,-.3,.3,.3,0,.9,'#D9DEE5')+'<g transform="translate(0 -26) rotate(-25)"><ellipse rx="20" ry="10" fill="#FFFFFF" stroke="#D2D9E1" stroke-width="1.5"/><ellipse rx="14" ry="6.5" fill="#EEF2F6"/><path d="M0 0v-14" stroke="#7D8794" stroke-width="2"/><circle cy="-15" r="2.6" fill="#F07B6B"/></g>'],
    ['Partnership',()=>box(-1,-.9,1,.9,0,1.1,'#F7F4EE')+box(-1,-.9,1,.9,1.1,1.2,'#9B8CE0')+'<rect x="-8" y="-38" width="16" height="10" rx="2" fill="#9B8CE0"/>'],
    ['R&S',()=>box(-1,-.9,1,.9,0,1,'#F7F4EE')+box(-1,-.9,1,.9,1,1.1,'#F2B544')+cyl(.4,0,.3,1.1,1.6,'#F2B544')],
    ['Rampa',()=>box(-1.1,-1.1,1.1,1.1,0,.2,'#C9CED6')+'<path d="M-4 -6v-34q0-10 4-14q4 4 4 14v34z" fill="#fff" stroke="#D2D9E1"/><path d="M-4-40q0-10 4-14q4 4 4 14z" fill="#F07B6B"/>']];
  T.forEach((t,i)=>s+=tile(366+i*110,676,t[0],miniScene(t[1]),i===0,i===5));
  // category tabs
  const cats=['Edifici','Prove','Comunicazioni','Ricerca','Decorazioni']; s+='<g filter="url(#ds)"><rect x="372" y="752" width="536" height="40" rx="20" fill="#3A2E2A"/></g>'+cats.map((c,i)=>(i===0?'<rect x="378" y="757" width="104" height="30" rx="15" fill="#F07B6B"/>':'')+'<text x="'+(430+i*106)+'" y="777" text-anchor="middle" font-family="'+FT+'" font-weight="700" font-size="13" fill="#fff">'+c+'</text>').join('');
  return s; }

// =============== CAMPUS ===============
// ===================== SCI-FI CHIARO (stile NASA-punk) =====================
const SF={bg1:'#DCE9EC',bg2:'#F2F2EC',white:'#F4F4EF',panel:'#E3E6E2',steel:'#B8C2C6',dark:'#22313B',mid:'#66777F',teal:'#45A9A3',tealD:'#2F8580',cyan:'#7CCFD2',orange:'#EB7D44',red:'#CF5E4C',grass:'#A9C273',grassD:'#98B263',conc:'#DCDDD5',concD:'#CACCC3',water:'#79C4C8'};
const SH2=c=>[mix(c,'#ffffff',.25),c,mix(c,'#2A3B4C',.18)];
function prism(fp,z0,z1,c,o={}){ // fp: footprint points in grid coords, counter-clockwise when seen from above (x right, y down)
  let s=''; const n=fp.length, faces=[];
  const cx=fp.reduce((t,p)=>t+p[0],0)/n, cy=fp.reduce((t,p)=>t+p[1],0)/n;
  for(let i=0;i<n;i++){ const a=fp[i], b=fp[(i+1)%n], ex=b[0]-a[0], ey=b[1]-a[1]; let nx=ey, ny=-ex; const mx=(a[0]+b[0])/2-cx, my=(a[1]+b[1])/2-cy; if(nx*mx+ny*my<0){ nx=-nx; ny=-ny; } const len=Math.hypot(nx,ny)||1, vx=nx/len, vy=ny/len;
    if(vx+vy<=0.001) continue; // facing away from viewer (+x+y)
    faces.push({a,b,vx,vy,d:(a[0]+b[0]+a[1]+b[1])/2}); }
  faces.sort((p,q)=>p.d-q.d);
  faces.forEach(f=>{ const lightL=f.vy>f.vx; const col=lightL?mix(c,'#ffffff',.06):mix(c,'#2A3B4C',.14+0.1*(f.vx-f.vy)); const q=[P(f.a[0],f.a[1],z0),P(f.b[0],f.b[1],z0),P(f.b[0],f.b[1],z1),P(f.a[0],f.a[1],z1)];
    s+=face(q,col)+poly(q,'fill="url(#vgrad)"');
    (o.bands||[]).forEach(bd=>{ const g=bd.c||SF.teal; const qb=[P(f.a[0],f.a[1],bd.z0),P(f.b[0],f.b[1],bd.z0),P(f.b[0],f.b[1],bd.z1),P(f.a[0],f.a[1],bd.z1)]; s+=poly(qb,'fill="'+(lightL?g:mix(g,'#0A2A33',.25))+'"')+(bd.glass?'<line x1="'+f1(lerp(qb[3],qb[2],.05)[0])+'" y1="'+f1(lerp(qb[3],qb[2],.05)[1]+2)+'" x2="'+f1(lerp(qb[3],qb[2],.6)[0])+'" y2="'+f1(lerp(qb[3],qb[2],.6)[1]+2)+'" stroke="#fff" stroke-width="1.6" opacity=".55"/>':''); });
    (o.stripes||[]).forEach(st=>{ const q2=[P(f.a[0],f.a[1],st.z),P(f.b[0],f.b[1],st.z),P(f.b[0],f.b[1],st.z+(st.h||.06)),P(f.a[0],f.a[1],st.z+(st.h||.06))]; s+=poly(q2,'fill="'+st.c+'"'); });
    if(o.ribs){ const m=Math.max(1,Math.round(Math.hypot(f.b[0]-f.a[0],f.b[1]-f.a[1])/o.ribs)); for(let k=1;k<m;k++){ const p0=lerp(P(f.a[0],f.a[1],z0),P(f.b[0],f.b[1],z0),k/m), p1=lerp(P(f.a[0],f.a[1],z1),P(f.b[0],f.b[1],z1),k/m); s+='<line x1="'+f1(p0[0])+'" y1="'+f1(p0[1])+'" x2="'+f1(p1[0])+'" y2="'+f1(p1[1])+'" stroke="'+mix(c,'#2A3B4C',.12)+'" stroke-width="1" opacity=".35"/>'; } } });
  s+=face(fp.map(p=>P(p[0],p[1],z1)),o.top||mix(c,'#ffffff',.3));
  if(o.rim) s+='<polygon points="'+pts(fp.map(p=>P(p[0],p[1],z1)))+'" fill="none" stroke="'+o.rim+'" stroke-width="2.6" stroke-linejoin="round" opacity=".45"/>';
  return s; }
const oct=(x0,y0,x1,y1,c)=>[[x0+c,y0],[x1-c,y0],[x1,y0+c],[x1,y1-c],[x1-c,y1],[x0+c,y1],[x0,y1-c],[x0,y0+c]].reverse();
const circ=(cx,cy,r,n)=>{ const a=[]; for(let i=0;i<n;i++){ const t=-i/n*Math.PI*2; a.push([cx+r*Math.cos(t),cy+r*Math.sin(t)]); } return a; };
function acacia(x,y,k){ const g=P(x,y), s=k||1; return '<ellipse cx="'+f1(g[0]+12*s)+'" cy="'+f1(g[1]+3)+'" rx="'+f1(24*s)+'" ry="'+f1(7*s)+'" fill="#3E5A6A" opacity=".18" filter="url(#soft2)"/><path d="M'+f1(g[0]-2*s)+' '+f1(g[1])+'q-2 -14 -8 -22M'+f1(g[0]+1*s)+' '+f1(g[1])+'q2 -16 9 -24M'+f1(g[0])+' '+f1(g[1])+'v-26" stroke="#6B5A48" stroke-width="'+f1(3.2*s)+'" fill="none" stroke-linecap="round"/>'+
  '<ellipse cx="'+f1(g[0])+'" cy="'+f1(g[1]-30*s)+'" rx="'+f1(26*s)+'" ry="'+f1(8*s)+'" fill="#6E8E3E"/><ellipse cx="'+f1(g[0]-2*s)+'" cy="'+f1(g[1]-33*s)+'" rx="'+f1(21*s)+'" ry="'+f1(6*s)+'" fill="#8DAE4C"/><ellipse cx="'+f1(g[0]+8*s)+'" cy="'+f1(g[1]-38*s)+'" rx="'+f1(13*s)+'" ry="'+f1(4.5*s)+'" fill="#A6C45E"/>'; }
function banner(x,y,c1,c2){ const g=P(x,y); return '<line x1="'+f1(g[0])+'" y1="'+f1(g[1])+'" x2="'+f1(g[0])+'" y2="'+f1(g[1]-46)+'" stroke="#9AA9B6" stroke-width="2"/><path d="M'+f1(g[0])+' '+f1(g[1]-44)+'h10v28l-5 -4l-5 4z" fill="'+c1+'"/><path d="M'+f1(g[0]+3)+' '+f1(g[1]-44)+'h3v26h-3z" fill="'+c2+'"/>'; }
function sfWalker(x,y,i,dir){ const g=P(x,y), sk=SKIN[i%5], hr=HAIR[i%6], cl=[SF.white,SF.white,'#2E4A5E',SF.white,'#2E4A5E'][i%5], ac=[SF.teal,SF.orange,SF.teal,SF.red,SF.orange][i%5];
  return '<g transform="translate('+f1(g[0])+' '+f1(g[1])+') scale('+(dir||1)+' 1)"><ellipse cx="2" cy="1" rx="8" ry="3" fill="#3E5A6A" opacity=".25"/><path d="M-2.5 0v-8M2.5 0v-8" stroke="#3B4E5E" stroke-width="2.6" stroke-linecap="round"/><path d="M-6-8q0-11 6-12q6 1 6 12z" fill="'+cl+'"/><path d="M-6-14h12v2.5h-12z" fill="'+ac+'"/><ellipse cx="0" cy="-25" rx="5.2" ry="6.2" fill="'+sk+'"/><path d="M-5.4-26q0-6.5 5.4-6.6q5.4.1 5.4 6.6q-3-3-5.4-3q-2.4 0-5.4 3z" fill="'+hr+'"/></g>'; }
// ---------- UI: chamfered light panels ----------
function chamf(x,y,w,h,c,fill,stroke){ const r=Math.min(h/2,(c||12)+8); return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" fill="'+(fill||'rgba(250,250,246,.94)')+'" '+(stroke&&stroke!=='none'&&stroke!=='#C6D3DC'&&stroke!=='#D3DDE4'?'stroke="'+stroke+'" stroke-width="1.5"':'')+'/>'; }
function sfTop(){ let s='';
  s+='<g filter="url(#ds)">'+chamf(16,14,250,56,14)+'</g><path d="M30 14h60" stroke="'+SF.teal+'" stroke-width="3" stroke-linecap="round" opacity=".0"/><text x="32" y="36" font-family="'+FT+'" font-weight="700" font-size="10" letter-spacing=".22em" fill="'+SF.mid+'">MISSIONE · FASE A</text><text x="32" y="58" font-family="'+FD+'" font-weight="800" font-size="20" letter-spacing=".04em" fill="'+SF.dark+'">AURASAT</text><g transform="translate(222 42)"><circle r="16" fill="none" stroke="'+SF.panel+'" stroke-width="4"/><path d="M0-16a16 16 0 0 1 15.2 11" fill="none" stroke="'+SF.teal+'" stroke-width="4" stroke-linecap="round"/><text y="5" text-anchor="middle" font-family="'+FD+'" font-weight="800" font-size="13" fill="'+SF.dark+'">A</text></g>';
  const it=[['CREDITI','450',SF.teal],['SCIENZA','128','#3E8FD0'],['REPUTAZIONE','68%',SF.orange],['STAFF','12','#7A8C9C'],['MISSIONI','2/3',SF.red]];
  s+='<g filter="url(#ds)">'+chamf(300,14,680,56,14)+'</g>'; it.forEach((v,i)=>{ const x=322+i*132; s+='<rect x="'+x+'" y="30" width="4" height="26" fill="'+v[2]+'"/><text x="'+(x+12)+'" y="38" font-family="'+FT+'" font-weight="700" font-size="9.5" letter-spacing=".18em" fill="'+SF.mid+'">'+v[0]+'</text><text x="'+(x+12)+'" y="59" font-family="'+FD+'" font-weight="800" font-size="20" fill="'+SF.dark+'">'+v[1]+'</text>'; });
  s+='<g filter="url(#ds)">'+chamf(1000,14,264,56,14)+'</g><text x="1016" y="36" font-family="'+FT+'" font-weight="700" font-size="9.5" letter-spacing=".18em" fill="'+SF.mid+'">LIVELLO 2 · T+214 GG</text><rect x="1016" y="46" width="120" height="6" fill="'+SF.panel+'"/><rect x="1016" y="46" width="46" height="6" fill="'+SF.teal+'"/>'+['M1168 34v18M1175 34v18','M1192 33l12 10-12 10z','M1214 33l9 10-9 10zM1224 33l9 10-9 10z'].map((d,i)=>'<path d="'+d+'" fill="'+(i===1?SF.dark:SF.steel)+'" stroke="'+(i===0?SF.steel:'none')+'" stroke-width="4"/>').join('');
  return s; }
function sfAlert(y,t,c){ return '<g filter="url(#ds)">'+chamf(16,y,340,40,10)+'</g><rect x="16" y="'+(y+10)+'" width="4" height="20" fill="'+c+'"/><path d="M36 '+(y+28)+'l9-16 9 16z" fill="'+c+'"/><text x="45" y="'+(y+26)+'" text-anchor="middle" font-family="'+FD+'" font-weight="900" font-size="10" fill="#fff">!</text><text x="64" y="'+(y+25)+'" font-family="'+FT+'" font-weight="600" font-size="13.5" fill="'+SF.dark+'">'+t+'</text>'; }
function sfMenu(){ let s='<g filter="url(#ds)">'+chamf(300,620,680,166,18)+'</g><path d="M318 620h120" stroke="'+SF.teal+'" stroke-width="3" stroke-linecap="round" opacity=".0"/>';
  const T=[['Lab. prove',()=>prism(oct(-1,-1,1,1,.35),0,1,SF.white,{bands:[{z0:.45,z1:.7,c:SF.teal,glass:1}],top:'#FFFFFF'})+cyl(0,0,.5,1,1.2,SF.white,true)],
    ['Termovuoto',()=>prism(circ(0,0,.9,16),0,.3,SF.panel)+cyl(0,0,.65,.3,1.4,'#DDE5EB')+'<path d="M-14-30h28" stroke="'+SF.orange+'" stroke-width="3"/>'],
    ['Antenna',()=>prism(circ(0,0,.4,10),0,.9,SF.white,{stripes:[{z:.6,c:SF.orange,h:.1}]})+'<g transform="translate(0 -28) rotate(-25)"><ellipse rx="20" ry="10" fill="#fff" stroke="#C6D3DC" stroke-width="1.5"/><ellipse rx="14" ry="6.5" fill="#E8EEF2"/><path d="M0 0v-14" stroke="'+SF.mid+'" stroke-width="2"/><circle cy="-15" r="2.6" fill="'+SF.teal+'"/></g>'],
    ['Partnership',()=>prism(oct(-1,-.9,1,.9,.3),0,1.1,SF.white,{bands:[{z0:.3,z1:.9,c:'#A3CDD3',glass:1}]})],
    ['R&S',()=>prism(oct(-1,-.9,1,.9,.3),0,.9,SF.white,{stripes:[{z:.75,c:SF.orange,h:.1}]})+prism(circ(.3,0,.35,12),.9,1.5,SF.panel,{bands:[{z0:1.2,z1:1.35,c:SF.teal}]})],
    ['Rampa',()=>prism(circ(0,0,1.1,20),0,.15,SF.conc)+'<path d="M-5-6v-34q0-10 5-14q5 4 5 14v34z" fill="#fff" stroke="#C6D3DC"/><path d="M-5-30h10" stroke="'+SF.orange+'" stroke-width="3"/>']];
  T.forEach((t,i)=>{ const x=366+i*110, y=676, sel=i===0, lock=i===5; s+='<g transform="translate('+x+' '+y+')">'+chamf(-44,-44,88,88,12,sel?'#E6F7F6':'#F7FAFB',sel?SF.teal:'#D3DDE4')+'<ellipse cx="0" cy="10" rx="34" ry="13" fill="#E6ECF0"/><g transform="translate(0 6)"'+(lock?' opacity=".4" filter="url(#gray)"':'')+'>'+miniScene(t[1])+'</g>'+(lock?'<g transform="translate(26 -26)">'+chamf(-11,-11,22,22,5,SF.mid,'none')+'<rect x="-5" y="-1" width="10" height="7" fill="#fff"/><path d="M-3-1v-3a3 3 0 0 1 6 0v3" fill="none" stroke="#fff" stroke-width="2"/></g>':'')+'<text y="62" text-anchor="middle" font-family="'+FT+'" font-weight="600" font-size="12" letter-spacing=".02em" fill="'+SF.dark+'">'+t[0]+'</text></g>'; });
  const cats=['EDIFICI','PROVE','COMUNICAZIONI','RICERCA','DECORAZIONI']; s+=chamf(372,752,536,38,10,SF.dark,'none')+cats.map((c,i)=>(i===0?chamf(378,757,104,28,7,SF.teal,'none'):'')+'<text x="'+(430+i*106)+'" y="776" text-anchor="middle" font-family="'+FT+'" font-weight="700" font-size="11.5" letter-spacing=".12em" fill="#fff">'+c+'</text>').join('');
  return '<defs><filter id="gray"><feColorMatrix type="saturate" values="0"/></filter></defs>'+s; }

function scampus(){ C={ox:640,oy:168,tw:64,th:32,tz:30}; let s='<defs><linearGradient id="sfbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+SF.bg1+'"/><stop offset=".55" stop-color="'+SF.bg2+'"/><stop offset="1" stop-color="#E3ECEF"/></linearGradient><linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".55"/></linearGradient></defs><rect width="1280" height="800" fill="url(#sfbg)"/>';
  // terreno illimitato: prato su tutto lo schermo, campus pavimentato con angoli morbidi, strade che escono dallo schermo
  s+='<defs><filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .3  0 0 0 0 .32  0 0 0 0 .2  0 0 0 .07 0"/></filter><filter id="blotch" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".006" numOctaves="3" seed="9"/><feColorMatrix values="0 0 0 0 .55  0 0 0 0 .62  0 0 0 0 .3  0 0 0 .35 -.05"/></filter><linearGradient id="vgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#3A4A40" stop-opacity=".08"/></linearGradient><linearGradient id="fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9EFEC" stop-opacity=".95"/><stop offset=".28" stop-color="#E9EFEC" stop-opacity=".25"/><stop offset=".5" stop-color="#E9EFEC" stop-opacity="0"/></linearGradient><filter id="aa" x="0" y="0" width="100%" height="100%"><feGaussianBlur stdDeviation=".45"/></filter><radialGradient id="sun" cx=".18" cy=".05" r=".9"><stop offset="0" stop-color="#FFF1D2" stop-opacity=".45"/><stop offset="1" stop-color="#FFF1D2" stop-opacity="0"/></radialGradient></defs>';
  s+='<g filter="url(#aa)">';
  s+='<rect width="1280" height="800" fill="'+SF.grass+'"/><rect width="1280" height="800" filter="url(#blotch)"/>';
  // meadow tufts far and wide
  for(let i=0;i<70;i++){ const x=((i*137)%1300)-10, y=((i*89)%820); s+='<ellipse cx="'+x+'" cy="'+y+'" rx="'+(10+(i%5)*4)+'" ry="'+(4+(i%3)*2)+'" fill="'+(i%2?'#B5CC7F':'#9DB867')+'" opacity=".55"/>'; }
  // paved campus with rounded outline
  const soft=(pts2,fill,sw)=>'<polygon points="'+pts(pts2)+'" fill="'+fill+'" stroke="'+fill+'" stroke-width="'+(sw||26)+'" stroke-linejoin="round"/>';
  s+=soft([P(-.2,-.2),P(16.2,-.2),P(16.2,16.2),P(-.2,16.2)],'#C7CBBF',30)+soft([P(0,0),P(16,0),P(16,16),P(0,16)],SF.conc,26);
  // inner lawns with rounded corners
  const lawn=(x0,y0,x1,y1)=>soft([P(x0,y0),P(x1,y0),P(x1,y1),P(x0,y1)],SF.grass,18);
  s+=lawn(.3,12.8,6,15.8)+lawn(11.9,12.4,15.7,15.7)+lawn(12.4,5.1,15.7,6.1)+lawn(.3,6.1,1.2,12.2);
  // roads crossing the whole world
  const road=(h)=>{ const a0=6.5,a1=7.6, q=h?[P(-30,a0),P(40,a0),P(40,a1),P(-30,a1)]:[P(a0,-30),P(a1,-30),P(a1,40),P(a0,40)]; return soft(q,'#9AA19B',8); };
  s+=road(true)+road(false);
  for(let t=-30;t<40;t+=1.1){ if(t>6.2&&t<7.9) continue; const a=P(t,7.05),b=P(t+.5,7.05),c=P(7.05,t),d=P(7.05,t+.5); s+='<line x1="'+f1(a[0])+'" y1="'+f1(a[1])+'" x2="'+f1(b[0])+'" y2="'+f1(b[1])+'" stroke="#F1F1EA" stroke-width="2.4" stroke-linecap="round" opacity=".85"/><line x1="'+f1(c[0])+'" y1="'+f1(c[1])+'" x2="'+f1(d[0])+'" y2="'+f1(d[1])+'" stroke="#F1F1EA" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>'; }
  // outlying world: rocks, far acacias, a second small facility in the distance
  const rock=(x,y,k)=>{ const g=P(x,y); return '<ellipse cx="'+f1(g[0])+'" cy="'+f1(g[1])+'" rx="'+(14*k)+'" ry="'+(7*k)+'" fill="#B9B7A6"/><ellipse cx="'+f1(g[0]-3*k)+'" cy="'+f1(g[1]-3*k)+'" rx="'+(9*k)+'" ry="'+(4.5*k)+'" fill="#CFCDBC"/>'; };
  [[-4,3,1],[-3,10,1.3],[19,4,1.1],[20,12,1.4],[3,19,1],[13,19.5,1.2],[-6,15,1]].forEach(r=>s+=rock(r[0],r[1],r[2]));
  [[-3,-2,1],[-5,6,1.1],[-2,13,1],[18,-1,1],[20,8,1.1],[18.5,15,1],[9,18.5,1.1],[2,20,1],[-7,1,.9],[22,3,.9]].forEach(t=>s+=acacia(t[0],t[1],t[2]));
  // hazard crosswalk
  for(let i=0;i<6;i++) s+=poly([P(6.55+i*.18,6.15),P(6.64+i*.18,6.15),P(6.64+i*.18,6.42),P(6.55+i*.18,6.42)],'fill="'+(i%2?SF.orange:'#fff')+'"');
  // pond with lily pads near lab
  { const pc=circ(3.2,13.9,1.5,24); s+=poly(pc.map(p=>P(p[0],p[1],.02)),'fill="#E9EEF1" stroke="#fff" stroke-width="5"')+poly(circ(3.2,13.9,1.32,24).map(p=>P(p[0],p[1],.02)),'fill="'+SF.water+'"'); [[2.6,13.5],[3.6,14.4],[3.9,13.4]].forEach(l=>{ const g=P(l[0],l[1]); s+='<ellipse cx="'+f1(g[0])+'" cy="'+f1(g[1])+'" rx="7" ry="3.5" fill="#7FA84A"/>'; }); }
  // shadows
  [[3.1,2.9,2.4],[10,3,2.4],[3.1,10,2.2],[9.9,9.9,1.9],[13.8,9.9,2],[14,2.9,2.2]].forEach(a=>{ const g=P(a[0],a[1]); s+='<ellipse cx="'+f1(g[0])+'" cy="'+f1(g[1])+'" rx="'+(a[2]*C.tw*.75)+'" ry="'+(a[2]*C.th*.75)+'" fill="#55604F" opacity=".16" filter="url(#soft)"/>'; });
  s+=shadow(1.4,1.4,4.8,4.4,4.2)+shadow(8.3,1.4,11.7,4.5,2.4)+shadow(1.5,8.5,4.7,11.5,2)+shadow(8.6,8.6,11.2,11.2,2.3)+shadow(12.4,8.6,15.2,11.2,1.8)+shadow(14.2,1.6,14.8,2.2,4.2);
  // back trees
  [[0,0,1],[2.6,-.3,.9],[6.4,0,1],[-.2,6,1],[12.6,5.4,.9],[15.6,5.6,1]].forEach(t=>s+=acacia(t[0],t[1],t[2]));
  // ADMIN: octagonal tower with ribbon windows + orange stripe + rooftop ring
  s+=prism(oct(1.5,1.5,4.7,4.3,.7),0,1.2,SF.white,{bands:[{z0:.35,z1:.95,c:'#A3CDD3',glass:1}],ribs:.8});
  s+=prism(oct(1.8,1.8,4.4,4.0,.6),1.2,4.0,SF.white,{bands:[{z0:1.5,z1:1.85,c:SF.teal,glass:1},{z0:2.25,z1:2.6,c:SF.teal,glass:1},{z0:3.0,z1:3.35,c:SF.teal,glass:1}],stripes:[{z:3.7,c:SF.orange,h:.12}],rim:SF.teal});
  s+=prism(circ(3.1,2.9,.55,14),4.0,4.5,SF.panel,{bands:[{z0:4.15,z1:4.3,c:SF.cyan}]})+'<line x1="'+f1(P(3.1,2.9,4.5)[0])+'" y1="'+f1(P(3.1,2.9,4.5)[1])+'" x2="'+f1(P(3.1,2.9,4.5)[0])+'" y2="'+f1(P(3.1,2.9,4.5)[1]-40)+'" stroke="'+SF.mid+'" stroke-width="2"/><circle cx="'+f1(P(3.1,2.9,4.5)[0])+'" cy="'+f1(P(3.1,2.9,4.5)[1]-41)+'" r="3.5" fill="'+SF.red+'"/>';
  // entrance canopy
  s+=prism([[2.6,4.3],[3.7,4.3],[3.7,5],[2.6,5]].reverse(),.9,1,SF.white,{top:'#FFFFFF',rim:SF.orange});
  // FACTORY: long hangar with curved (stepped) roof + hazard door
  s+=prism([[8.3,1.4],[11.7,1.4],[11.7,4.5],[8.3,4.5]].reverse(),0,1.6,SF.white,{bands:[{z0:1.1,z1:1.35,c:'#A3CDD3',glass:1}],ribs:.55,stripes:[{z:.05,c:SF.orange,h:.1}]});
  for(let k=0;k<5;k++){ const z=1.6+Math.sin((k+1)/6*Math.PI)*.9, z2=1.6+Math.sin((k+2)/6*Math.PI)*.9; const y0=1.4+k*.62, y1=y0+.62; s+=face([P(8.3,y0,1.6+Math.sin(k/5*Math.PI)*.9),P(11.7,y0,1.6+Math.sin(k/5*Math.PI)*.9),P(11.7,y1,1.6+Math.sin((k+1)/5*Math.PI)*.9),P(8.3,y1,1.6+Math.sin((k+1)/5*Math.PI)*.9)],k<2?'#FFFFFF':k<3?'#EEF3F6':'#DDE5EB'); }
  { const q=[]; for(let k=0;k<=10;k++){ const y=1.4+k*.31; q.push(P(11.7,y,1.6+Math.sin(k/10*Math.PI)*.9)); } s+=poly([P(11.7,1.4,1.6)].concat(q).concat([P(11.7,4.5,1.6)]),'fill="#C9D4DC"'); }
  { const d=[P(9.2,4.5,0),P(10.8,4.5,0),P(10.8,4.5,1.1),P(9.2,4.5,1.1)]; s+=poly(d,'fill="#D5DDE3"'); for(let i=0;i<8;i++) s+=poly([lerp(d[0],d[1],i/8),lerp(d[0],d[1],(i+.5)/8),lerp(lerp(d[0],d[1],(i+.5)/8),lerp(d[3],d[2],(i+.5)/8),.12),lerp(lerp(d[0],d[1],i/8),lerp(d[3],d[2],i/8),.12)],'fill="'+(i%2?SF.dark:SF.orange)+'"'); }
  // LAB: low rounded block + big dome
  s+=prism(oct(1.5,8.5,4.7,11.5,.8),0,1.5,SF.white,{bands:[{z0:.45,z1:1.1,c:'#A3CDD3',glass:1}],stripes:[{z:1.35,c:SF.teal,h:.08}]})+cyl(3.3,9.9,1.05,1.5,1.7,'#EDF2F5',true);
  // FD CENTER with big dish
  s+=prism(oct(8.6,8.6,11.2,11.2,.6),0,2.3,SF.white,{bands:[{z0:.4,z1:.8,c:'#A3CDD3',glass:1},{z0:1.2,z1:1.6,c:'#A3CDD3',glass:1}],stripes:[{z:2.05,c:SF.red,h:.1}]});
  { s+=prism(circ(10,9.8,.22,10),2.3,2.9,SF.panel); const b=P(10,9.8,2.9); s+='<g transform="translate('+f1(b[0])+' '+f1(b[1]-8)+') rotate(-28)"><ellipse rx="38" ry="19" fill="#FFFFFF" stroke="#C6D3DC" stroke-width="2"/><ellipse rx="28" ry="12.5" fill="#E6ECF0"/><path d="M-20 4L0-28L20 4" fill="none" stroke="'+SF.mid+'" stroke-width="2"/><circle cy="-30" r="4.5" fill="'+SF.teal+'"/></g>'; }
  // MCC: building with cylinder tower and LED band
  s+=prism([[12.4,8.6],[15.2,8.6],[15.2,11.2],[12.4,11.2]].reverse(),0,1.8,SF.white,{bands:[{z0:.5,z1:1.3,c:'#A3CDD3',glass:1}],ribs:.7})+prism(circ(13.3,9.5,.5,14),1.8,2.6,SF.white,{bands:[{z0:2.05,z1:2.3,c:SF.cyan}],rim:SF.teal});
  s+=poly([P(12.4,11.2,1.55),P(15.2,11.2,1.55),P(15.2,11.2,1.62),P(12.4,11.2,1.62)],'fill="'+SF.orange+'"');
  // LAUNCH PAD: circular pad with hazard ring, tower, white/orange rocket
  { s+=prism(circ(14,2.9,1.9,28),0,.18,'#D3DAE0',{top:'#E4EAEE'}); const ring=circ(14,2.9,1.55,28); for(let i=0;i<28;i++){ const a=ring[i], b=ring[(i+1)%28]; const g1=P(a[0],a[1],.19), g2=P(b[0],b[1],.19); s+='<line x1="'+f1(g1[0])+'" y1="'+f1(g1[1])+'" x2="'+f1(g2[0])+'" y2="'+f1(g2[1])+'" stroke="'+(i%2?SF.orange:'#fff')+'" stroke-width="5" stroke-linecap="round" opacity=".9"/>'; }
    s+=poly(circ(14,2.9,.9,24).map(p=>P(p[0],p[1],.19)),'fill="#9AA8B3" opacity=".35"');
    s+=prism([[14.5,1.3],[14.9,1.3],[14.9,1.7],[14.5,1.7]].reverse(),.18,4.4,SF.white,{stripes:[{z:1.2,c:SF.orange,h:.12},{z:2.4,c:SF.orange,h:.12},{z:3.6,c:SF.orange,h:.12}],ribs:.2});
    s+=prism([[14.2,1.7],[14.6,1.7],[14.6,2.3],[14.2,2.3]].reverse(),3.2,3.32,SF.steel);
    const b=P(14,2.9,.19); s+='<g transform="translate('+f1(b[0])+' '+f1(b[1])+')"><path d="M-11 0v-92q0-26 11-40q11 14 11 40v92z" fill="#FFFFFF"/><path d="M3 0v-92q0-26-3-40q11 14 11 40v92z" fill="#DCE4EA"/><path d="M-11-92q0-26 11-40q11 14 11 40z" fill="'+SF.dark+'"/><rect x="-11" y="-74" width="22" height="7" fill="'+SF.orange+'"/><rect x="-11" y="-62" width="22" height="3" fill="'+SF.red+'"/><path d="M-11-8l-10 10v-24l10-14zM11-8l10 10v-24l-10-14z" fill="'+SF.orange+'"/><text y="-40" text-anchor="middle" font-family="'+FD+'" font-weight="900" font-size="7" fill="'+SF.mid+'" transform="rotate(-90 0 -40)">GNG</text></g>'; }
  // curved walkway / monorail arc
  { let d=''; for(let t=0;t<=20;t++){ const a=t/20; const x=5.2+a*3.4, y=5.6+Math.sin(a*Math.PI)*-.8; const g=P(x,y,1.3+Math.sin(a*Math.PI)*.3); d+=(t?'L':'M')+f1(g[0])+' '+f1(g[1]); } s+='<path d="'+d+'" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round"/><path d="'+d+'" fill="none" stroke="'+SF.teal+'" stroke-width="2"/>'; [5.6,7,8.2].forEach(x=>{ const a=(x-5.2)/3.4, y=5.6+Math.sin(a*Math.PI)*-.8, top=P(x,y,1.3+Math.sin(a*Math.PI)*.3), bot=P(x,y,0); s+='<line x1="'+f1(bot[0])+'" y1="'+f1(bot[1])+'" x2="'+f1(top[0])+'" y2="'+f1(top[1])+'" stroke="#E4EAEE" stroke-width="4"/>'; }); }
  // empty plot with holo marker
  { const x0=8.6,y0=12.8,x1=11.4,y1=15.4, c=P((x0+x1)/2,(y0+y1)/2); s+=poly([P(x0,y0),P(x1,y0),P(x1,y1),P(x0,y1)],'fill="rgba(23,179,174,.08)" stroke="'+SF.teal+'" stroke-width="2" stroke-dasharray="10 6"')+'<g transform="translate('+f1(c[0])+' '+f1(c[1]-10)+')">'+chamf(-18,-18,36,36,8,'rgba(247,250,251,.95)',SF.teal)+'<path d="M-7 0h14M0-7v14" stroke="'+SF.teal+'" stroke-width="3.2" stroke-linecap="round"/></g>'; }
  // banners, lights
  [[6.2,1.2,SF.teal,SF.orange],[6.2,2.4,SF.red,'#fff'],[6.2,3.6,'#2E4A5E',SF.teal],[8,8.2,SF.orange,'#fff'],[12,6.2,SF.teal,'#fff']].forEach(b=>s+=banner(b[0],b[1],b[2],b[3]));
  // rover/vehicles
  const rover=(x,y)=>prism([[x-.45,y-.25],[x+.45,y-.25],[x+.45,y+.25],[x-.45,y+.25]].reverse(),.12,.38,SF.white,{stripes:[{z:.2,c:SF.orange,h:.05}]})+[[-.3,.28],[.3,.28]].map(w=>{ const g=P(x+w[0],y+w[1],.12); return '<ellipse cx="'+f1(g[0])+'" cy="'+f1(g[1])+'" rx="5" ry="4" fill="'+SF.dark+'"/>'; }).join('');
  s+=rover(4.9,7.05)+rover(13.4,13.7);
  // front trees
  [[5.9,9.6,1],[0.4,12.4,1.1],[6.1,15.4,1],[12.6,15.6,1.1],[15.6,12.8,1],[15.6,15.5,1],[0.2,16,1]].forEach(t=>s+=acacia(t[0],t[1],t[2]));
  // people
  [[7.05,2.5,0,1],[6.8,4.8,1,-1],[7.3,9.4,2,1],[10.5,6.8,3,-1],[3,7.2,4,1],[13.5,7.3,0,-1],[7.2,13.5,1,1],[3.2,5.2,3,1],[10.2,5.1,4,1],[2.4,12,2,1],[13,12.4,0,-1]].forEach(w=>s+=sfWalker(w[0],w[1],w[2],w[3]));
  // haze for depth
  s+='</g><rect width="1280" height="800" fill="url(#fog)"/><rect width="1280" height="800" fill="url(#sun)"/><rect width="1280" height="800" filter="url(#grain)" opacity=".8"/>';
  // labels
  { const a=P(3.1,2.9,4.5); const x=a[0]-170, y=a[1]+40; s+='<g filter="url(#ds)">'+chamf(x-120,y-22,240,44,10)+'</g><path d="M'+(x-120)+' '+(y-22)+'h50" stroke="'+SF.teal+'" stroke-width="3" stroke-linecap="round" opacity=".0"/><line x1="'+(x+120)+'" y1="'+y+'" x2="'+(x+170)+'" y2="'+(y-40)+'" stroke="'+SF.teal+'" stroke-width="2"/><text x="'+(x-104)+'" y="'+(y-3)+'" font-family="'+FD+'" font-weight="800" font-size="14" letter-spacing=".08em" fill="'+SF.dark+'">AMMINISTRAZIONE</text><text x="'+(x-104)+'" y="'+(y+13)+'" font-family="'+FT+'" font-weight="600" font-size="10.5" letter-spacing=".08em" fill="'+SF.mid+'">RIUNIONE IN ATTESA · FASE A</text><path d="M'+(x+92)+' '+(y+8)+'l10-18 10 18z" fill="'+SF.orange+'"/><text x="'+(x+102)+'" y="'+(y+5)+'" text-anchor="middle" font-family="'+FD+'" font-weight="900" font-size="10" fill="#fff">!</text>'; }
  { const a=P(10,2.9,2.5); s+='<g filter="url(#ds)">'+chamf(a[0]-66,a[1]-62,132,36,8)+'</g><text x="'+(a[0]-54)+'" y="'+(a[1]-39)+'" font-family="'+FT+'" font-weight="700" font-size="11" letter-spacing=".08em" fill="'+SF.dark+'">SELENE-1</text><rect x="'+(a[0]+8)+'" y="'+(a[1]-48)+'" width="46" height="7" fill="'+SF.panel+'"/><rect x="'+(a[0]+8)+'" y="'+(a[1]-48)+'" width="30" height="7" fill="'+SF.teal+'"/>'; }
  s+=sfTop()+sfAlert(96,'AURASAT: la NASA ti aspetta al tavolo',SF.orange)+sfAlert(144,'SELENE-1: integrazione al 65%',SF.teal)+sfMenu();
  return s; }

// ---------- frontal meeting room, director at the head of the table ----------
function sfPerson(cx,cy,s,o,turn){ const sk=o.skin, hr=o.hair;
  return '<g transform="translate('+cx+' '+cy+') scale('+s*(turn||1)+' '+s+')"><path d="M-40 0q0-46 40-48q40 2 40 48z" fill="'+o.suit+'"/><path d="M-40 0q0-46 40-48q-22 14-24 48z" fill="#fff" opacity=".18"/><path d="M-30-30q10-14 30-17q20 3 30 17" fill="none" stroke="'+o.acc+'" stroke-width="5"/><path d="M-9-47l9 14l9-14z" fill="'+(o.shirt||'#E9EEF2')+'"/><rect x="14" y="-26" width="14" height="9" fill="'+o.acc+'"/>'+
    '<rect x="-7" y="-58" width="14" height="12" rx="5" fill="'+mix(sk,'#3A2E2A',.07)+'"/><ellipse cx="0" cy="-76" rx="19" ry="23" fill="'+sk+'"/>'+hairS2(o)+'<ellipse cx="-6.5" cy="-76" rx="2" ry="2.6" fill="#22303A"/><ellipse cx="6.5" cy="-76" rx="2" ry="2.6" fill="#22303A"/><path d="M-5.5-64q5.5 '+(o.mood||4)+' 11 0" stroke="#8A4A3A" stroke-width="2" fill="none" stroke-linecap="round"/>'+(o.glasses?'<rect x="-13" y="-81" width="11" height="9" rx="3" fill="none" stroke="#22303A" stroke-width="1.6"/><rect x="2" y="-81" width="11" height="9" rx="3" fill="none" stroke="#22303A" stroke-width="1.6"/>':'')+(o.headset?'<path d="M-19-80q0-24 19-24q19 0 19 24" fill="none" stroke="'+SF.dark+'" stroke-width="3"/><rect x="-23" y="-82" width="7" height="12" rx="3" fill="'+SF.dark+'"/><path d="M-19-72q2 12 12 12" fill="none" stroke="'+SF.dark+'" stroke-width="2"/>':'')+'</g>'; }
function hairS2(o){ const c=o.hair; if(o.hs==='bun') return '<circle cx="0" cy="-103" r="9" fill="'+c+'"/><path d="M-19-76q-2-26 19-27q21 1 19 27q-7-11-19-12q-12 1-19 12z" fill="'+c+'"/>'; if(o.hs==='long') return '<path d="M-20-76q-3-27 20-28q23 1 20 28v30q-6 3-9-1v-23q-11-7-22-7q-9 5-11 7v23q-3 4-9 1z" fill="'+c+'"/>'; if(o.hs==='bald') return '<path d="M-19-72q-2-9 3-14M19-72q2-9-3-14" stroke="'+c+'" stroke-width="4.5" fill="none" stroke-linecap="round"/>'; return '<path d="M-19-74q-3-29 19-30q22 1 19 30q-5-10-11-11q-8 6-23 2q-4 3-4 9z" fill="'+c+'"/>'; }
function sroom(){ let s='<defs><linearGradient id="wsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFE0EE"/><stop offset="1" stop-color="#EEF6F7"/></linearGradient><linearGradient id="tbl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E6ECF0"/></linearGradient><linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D8E0E5"/><stop offset="1" stop-color="#C3CDD4"/></linearGradient><radialGradient id="holo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="'+SF.cyan+'" stop-opacity=".45"/><stop offset="1" stop-color="'+SF.cyan+'" stop-opacity="0"/></radialGradient><clipPath id="win"><path d="M300 70H980Q1010 70 1010 100V330H270V100Q270 70 300 70Z"/></clipPath></defs>';
  // room shell (one-point perspective, VP 640,300)
  s+='<rect width="1280" height="800" fill="#EEF2F5"/>';
  s+=poly([[0,0],[200,40],[200,420],[0,560]],'fill="#E7EDF1"')+poly([[1280,0],[1080,40],[1080,420],[1280,560]],'fill="#DFE6EB"')+poly([[0,0],[1280,0],[1080,40],[200,40]],'fill="#F7FAFB"')+poly([[0,560],[200,420],[1080,420],[1280,560],[1280,800],[0,800]],'fill="url(#floor)"');
  // wall ribs and light strips on side walls
  for(let i=1;i<6;i++){ const x=i*36; const yT=x*40/200, yB=560-x*140/200; s+='<line x1="'+x+'" y1="'+yT+'" x2="'+x+'" y2="'+yB+'" stroke="#D3DDE3" stroke-width="2"/>'; const xr=1280-x; s+='<line x1="'+xr+'" y1="'+yT+'" x2="'+xr+'" y2="'+yB+'" stroke="#CDD7DD" stroke-width="2"/>'; }
  s+='<path d="M0 300L200 255" stroke="'+SF.cyan+'" stroke-width="4" opacity=".8"/><path d="M1280 300L1080 255" stroke="'+SF.cyan+'" stroke-width="4" opacity=".8"/>';
  s+='<path d="M0 470L200 380" stroke="'+SF.orange+'" stroke-width="3"/><path d="M1280 470L1080 380" stroke="'+SF.orange+'" stroke-width="3"/>';
  // back wall
  s+='<rect x="200" y="40" width="880" height="380" fill="#F3F6F8"/>';
  // panoramic window with landscape
  s+='<g clip-path="url(#win)"><rect x="260" y="60" width="760" height="280" fill="url(#wsky)"/><path d="M260 230L330 205L400 214L470 190L560 202L640 184L740 200L820 186L900 204L1020 192V340H260z" fill="#C8DBE2"/>'+
    '<path d="M260 262Q500 236 740 252T1020 246V340H260z" fill="#A9C770"/>'+'<path d="M260 262L1020 250V340H260z" fill="#C7C98A"/><path d="M260 290L1020 276V340H260z" fill="#AFC47A"/>'+[...Array(14)].map((_,k)=>'<g transform="translate('+(290+k*26)+' '+(262-k*.4)+')"><rect x="-1" y="-6" width="2" height="6" fill="#6B5A48"/><ellipse cy="-15" rx="5" ry="13" fill="#5F7F3E"/><ellipse cx="-1.5" cy="-17" rx="3" ry="9" fill="#7D9C50"/></g>').join('')+
 '<g><rect x="560" y="176" width="70" height="80" fill="#E9E8E2"/><rect x="630" y="186" width="22" height="70" fill="#CFCEC6"/><rect x="590" y="192" width="20" height="64" fill="#C9C9C2"/><rect x="616" y="194" width="5" height="48" fill="#E07A45"/><rect x="622" y="194" width="5" height="48" fill="#3F8E8A"/><rect x="520" y="228" width="40" height="28" fill="#E2E0D8"/></g>'+
 '<g transform="translate(900 214)"><rect x="-4" y="0" width="8" height="40" fill="#E8E6DF"/><ellipse cy="-4" rx="30" ry="14" fill="#F4F3EF" stroke="#C9CBC5" transform="rotate(-20)"/></g>'+
    '<g transform="translate(760 256)"><ellipse rx="42" ry="8" fill="#DCE3E8"/><path d="M-5 0v-58q0-16 5-24q5 8 5 24v58z" fill="#fff"/><path d="M-5-58q0-16 5-24q5 8 5 24z" fill="'+SF.dark+'"/><rect x="-5" y="-46" width="10" height="4" fill="'+SF.orange+'"/><rect x="12" y="-70" width="5" height="70" fill="#E9EEF1"/><path d="M17-60h-6M17-40h-6" stroke="'+SF.orange+'" stroke-width="3"/></g>'+
    '<path d="M560 80Q600 160 760 110" stroke="#fff" stroke-width="3" fill="none" opacity=".5"/></g>';
  s+='<path d="M300 70H980Q1010 70 1010 100V330H270V100Q270 70 300 70Z" fill="none" stroke="#DCE4EA" stroke-width="14"/>'+[470,640,810].map(x=>'<line x1="'+x+'" y1="70" x2="'+x+'" y2="330" stroke="#DCE4EA" stroke-width="8"/>').join('')+'<rect x="262" y="330" width="756" height="16" fill="#E2E9EE"/><rect x="262" y="344" width="756" height="4" fill="'+SF.teal+'"/>';
  // logo above window
  s+='<g transform="translate(640 96)">'+chamf(-80,-14,160,28,8,'#FFFFFF','#DCE4EA')+'<circle cx="-62" cy="0" r="7" fill="none" stroke="'+SF.orange+'" stroke-width="3"/><text x="-48" y="5" font-family="'+FD+'" font-weight="800" font-size="12" letter-spacing=".2em" fill="'+SF.dark+'">PERIGEO LABS</text></g>';
  // side screens on walls (perspective)
  s+=poly([[40,140],[170,160],[170,300],[40,308]],'fill="#22323F"')+poly([[50,152],[160,170],[160,290],[50,296]],'fill="#2B4252"');
  s+='<g transform="matrix(1 .14 0 1 0 0)"><text x="58" y="168" font-family="'+FT+'" font-weight="700" font-size="11" letter-spacing=".1em" fill="'+SF.cyan+'">REQUISITI</text><text x="58" y="190" font-family="'+FT+'" font-size="11" fill="#9FE3B8">✓ MIS-01 Costo</text><text x="58" y="208" font-family="'+FT+'" font-size="11" fill="#C9D6E3">○ MIS-02 Durata</text><text x="58" y="226" font-family="'+FT+'" font-size="11" fill="#C9D6E3">○ MIS-03 Rientro</text></g>';
  s+=poly([[1240,140],[1110,160],[1110,300],[1240,308]],'fill="#22323F"')+poly([[1230,152],[1120,170],[1120,290],[1230,296]],'fill="#2B4252"');
  s+='<g transform="matrix(1 -.14 0 1 0 0)"><text x="1130" y="335" font-family="'+FT+'" font-weight="700" font-size="11" letter-spacing=".1em" fill="'+SF.cyan+'">BUDGET</text><rect x="1130" y="348" width="90" height="8" fill="#3E5566"/><rect x="1130" y="348" width="40" height="8" fill="'+SF.teal+'"/><text x="1130" y="376" font-family="'+FT+'" font-size="11" fill="#C9D6E3">135 / 320 cr</text></g>';
  // people: far end (NASA), left & right sides
  s+=sfPerson(640,350,1.08,{skin:'#8D5B3E',hair:'#1F1A17',hs:'bun',suit:'#F4F7F9',acc:'#3E6DB5',mood:2});
  s+=sfPerson(430,410,1.25,{skin:'#F2CBA8',hair:'#8A5A35',hs:'long',suit:'#F4F7F9',acc:SF.teal,glasses:1});
  s+=sfPerson(850,410,1.25,{skin:'#D9A27A',hair:'#7A7A7A',hs:'bald',suit:'#2E4A5E',acc:SF.orange,shirt:'#F4F7F9'},-1);
  // chairs backs near sides
  // table (perspective trapezoid, director at near end)
  s+='<path d="M250 800L520 380H760L1030 800Z" fill="#B8C4CD"/><path d="M262 790L526 372H754L1018 790Z" fill="url(#tbl)"/><path d="M262 790L526 372" stroke="'+SF.teal+'" stroke-width="3" stroke-linecap="round" opacity=".0"/><path d="M1018 790L754 372" stroke="'+SF.teal+'" stroke-width="3" stroke-linecap="round" opacity=".0"/><path d="M526 372H754" stroke="'+SF.teal+'" stroke-width="3" stroke-linecap="round" opacity=".0"/>';
  // hologram at table centre: Earth + orbit + CubeSat
  s+='<ellipse cx="640" cy="470" rx="110" ry="22" fill="url(#holo)"/><ellipse cx="640" cy="470" rx="56" ry="11" fill="none" stroke="'+SF.cyan+'" stroke-width="2"/><path d="M590 470L612 430M690 470L668 430" stroke="'+SF.cyan+'" stroke-width="1" opacity=".5"/>'+
    '<g opacity=".9"><circle cx="640" cy="420" r="34" fill="'+SF.cyan+'" opacity=".22" stroke="'+SF.cyan+'" stroke-width="1.6"/><ellipse cx="640" cy="420" rx="34" ry="11" fill="none" stroke="'+SF.cyan+'" stroke-width="1"/><ellipse cx="640" cy="420" rx="12" ry="34" fill="none" stroke="'+SF.cyan+'" stroke-width="1"/><ellipse cx="640" cy="420" rx="58" ry="20" fill="none" stroke="'+SF.orange+'" stroke-width="1.8" stroke-dasharray="5 4" transform="rotate(-16 640 420)"/><rect x="690" y="398" width="9" height="9" fill="'+SF.orange+'"/><path d="M682 402h-7M706 402h7" stroke="'+SF.orange+'" stroke-width="3"/></g>';
  // tablets / documents
  s+='<g transform="translate(470 560) rotate(-12)">'+chamf(-44,-28,88,56,8,'#22323F','none')+'<rect x="-36" y="-20" width="72" height="40" fill="#2B4252"/><rect x="-30" y="-12" width="40" height="5" fill="'+SF.cyan+'"/><rect x="-30" y="-2" width="54" height="4" fill="#5B7083"/></g><g transform="translate(820 560) rotate(14)"><rect x="-40" y="-26" width="80" height="52" fill="#FFFFFF" stroke="#D3DDE4"/><rect x="-32" y="-16" width="48" height="4" fill="'+SF.orange+'"/><rect x="-32" y="-6" width="60" height="3" fill="#C9D3DC"/><rect x="-32" y="2" width="56" height="3" fill="#C9D3DC"/></g>';
  // speech bubble from NASA
  s+='<g filter="url(#ds)">'+chamf(470,150,340,58,10,'#FFFFFF','#C6D3DC')+'</g><path d="M470 150h70" stroke="'+SF.teal+'" stroke-width="3" stroke-linecap="round" opacity=".0"/><path d="M630 208l10 14 10-14z" fill="#fff"/><text x="486" y="172" font-family="'+FT+'" font-weight="700" font-size="11" letter-spacing=".14em" fill="#3E6DB5">DOTT.SSA HALE · NASA</text><text x="486" y="195" font-family="'+FT+'" font-size="15" fill="'+SF.dark+'">Satellite e lancio entro 320 crediti.</text>';
  // mood markers
  [[430,260,SF.teal,'+'],[850,260,SF.orange,'?']].forEach(m=>s+='<g transform="translate('+m[0]+' '+m[1]+')">'+chamf(-14,-14,28,28,6,'#FFFFFF',m[2])+'<text y="6" text-anchor="middle" font-family="'+FD+'" font-weight="900" font-size="16" fill="'+m[2]+'">'+m[3]+'</text></g>');
  // director's hands / own tablet at bottom (first person cue)

  s+=sfTop()+sfDialog();
  return s; }
function sfDialog(){ let s='<g filter="url(#ds)">'+chamf(150,590,980,150,16,'rgba(247,250,251,.96)','#C6D3DC')+'</g><path d="M150 606V590h80" stroke="'+SF.teal+'" stroke-width="3" fill="none"/>';
  s+='<text x="176" y="622" font-family="'+FT+'" font-weight="700" font-size="10.5" letter-spacing=".18em" fill="'+SF.mid+'">RICHIESTA · NASA · PRIORITÀ ALTA</text><text x="176" y="652" font-family="'+FD+'" font-weight="700" font-size="20" fill="'+SF.dark+'">«Satellite e lancio entro 320 crediti.»</text><text x="176" y="676" font-family="'+FT+'" font-size="13" fill="'+SF.mid+'">Se accetti diventa il requisito di missione MIS-01.</text>';
  s+='<g transform="translate(176 692)">'+chamf(0,0,268,32,8,'#E6F7F6',SF.teal)+'<text x="14" y="21" font-family="'+FT+'" font-weight="700" font-size="12.5" fill="'+SF.tealD+'">COSTO EXTRA 0 CR · GIÀ RISPETTATO</text></g>';
  const b=(x,w,fill,stroke,t,fg)=>'<g filter="url(#ds)">'+chamf(x,682,w,44,10,fill,stroke)+'</g><text x="'+(x+w/2)+'" y="710" text-anchor="middle" font-family="'+FD+'" font-weight="800" font-size="14" letter-spacing=".12em" fill="'+fg+'">'+t+'</text>';
  s+=b(640,150,SF.teal,'none','ACCETTA','#fff')+b(804,186,'#FFFFFF','#C6D3DC','CONTROPROPOSTA',SF.dark)+b(1004,108,'#FFFFFF','#F2B3A8','RIFIUTA',SF.red);
  [['HALE','#3E6DB5',.62],['RINALDI',SF.teal,.74],['BASSI',SF.orange,.55]].forEach((p,i)=>{ const x=820+i*100; s+='<text x="'+x+'" y="622" font-family="'+FT+'" font-weight="700" font-size="10" letter-spacing=".14em" fill="'+SF.mid+'">'+p[0]+'</text><rect x="'+x+'" y="630" width="84" height="6" fill="'+SF.panel+'"/><rect x="'+x+'" y="630" width="'+(84*p[2])+'" height="6" fill="'+p[1]+'"/>'; });
  return s; }
// ===================== CAMPUS "SEMI-REALISTICO" ASIMMETRICO =====================
const RC={wall:'#ECEAE3',wall2:'#E2E0D8',conc:'#D8D5CC',roof:'#C9C8C1',glass1:'#9FC3CC',glass2:'#5E8C99',asph:'#8D928F',curb:'#E4E1D7',lawn:'#A8BE74',lawn2:'#9BB46A',field1:'#AFC47A',field2:'#C7C98A',field3:'#93B064',field4:'#D2C795',dirt:'#C9B993'};
let RID=0;
// catmull-rom smooth path through screen points
function smooth(ptsS,closed){ const p=ptsS, n=p.length; if(n<2) return ''; let d='M'+f1(p[0][0])+' '+f1(p[0][1]);
  const g=i=>closed?p[(i+n)%n]:p[Math.max(0,Math.min(n-1,i))];
  for(let i=0;i<(closed?n:n-1);i++){ const p0=g(i-1),p1=g(i),p2=g(i+1),p3=g(i+2); const c1=[p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6], c2=[p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6]; d+='C'+f1(c1[0])+' '+f1(c1[1])+' '+f1(c2[0])+' '+f1(c2[1])+' '+f1(p2[0])+' '+f1(p2[1]); }
  return d+(closed?'Z':''); }
const gp=a=>a.map(q=>P(q[0],q[1],q[2]||0));
// shaded face with vertical gradient (light top, darker bottom) – gives the soft "rendered" look
function rface(q,col,k){ const id='rf'+(++RID); return '<defs><linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+mix(col,'#ffffff',.10*(k||1))+'"/><stop offset="1" stop-color="'+mix(col,'#4A4A40',.10*(k||1))+'"/></linearGradient></defs>'+poly(q,'fill="url(#'+id+')" stroke="'+col+'" stroke-width=".8" stroke-linejoin="round"'); }
// windows on a vertical face given by corners a(bottom-left) b(bottom-right) up to height h (in z units)
function winGrid(ax,ay,bx,by,z0,z1,floors,cols,o={}){ let s=''; const fh=(z1-z0)/floors;
  for(let f=0;f<floors;f++){ const za=z0+f*fh+fh*(o.sill||.28), zb=za+fh*(o.wh||.5);
    if(o.ribbon){ const q=[P(ax,ay,za),P(bx,by,za),P(bx,by,zb),P(ax,ay,zb)]; const id='gl'+(++RID); s+='<defs><linearGradient id="'+id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+RC.glass1+'"/><stop offset="1" stop-color="'+RC.glass2+'"/></linearGradient></defs>'+poly(q,'fill="url(#'+id+')" opacity="'+(o.dark?.85:1)+'"');
      for(let c=1;c<cols;c++){ const t=c/cols, p0=P(ax+(bx-ax)*t,ay+(by-ay)*t,za), p1=P(ax+(bx-ax)*t,ay+(by-ay)*t,zb); s+='<line x1="'+f1(p0[0])+'" y1="'+f1(p0[1])+'" x2="'+f1(p1[0])+'" y2="'+f1(p1[1])+'" stroke="'+(o.mull||'#E9ECE8')+'" stroke-width="1"/>'; }
      const hl=[P(ax+(bx-ax)*.05,ay+(by-ay)*.05,zb-.02),P(ax+(bx-ax)*.4,ay+(by-ay)*.4,zb-.02)]; s+='<line x1="'+f1(hl[0][0])+'" y1="'+f1(hl[0][1]+1.5)+'" x2="'+f1(hl[1][0])+'" y2="'+f1(hl[1][1]+1.5)+'" stroke="#fff" stroke-width="1.2" opacity=".5"/>'; continue; }
    for(let c=0;c<cols;c++){ const t0=(c+.18)/cols, t1=(c+.82)/cols; const q=[P(ax+(bx-ax)*t0,ay+(by-ay)*t0,za),P(ax+(bx-ax)*t1,ay+(by-ay)*t1,za),P(ax+(bx-ax)*t1,ay+(by-ay)*t1,zb),P(ax+(bx-ax)*t0,ay+(by-ay)*t0,zb)];
      s+=poly(q,'fill="'+(o.dark?RC.glass2:mix(RC.glass1,RC.glass2,(f+c)%3*.2))+'"'); } }
  return s; }
// realistic block: two visible walls + roof with parapet and rooftop units
function rblock(x0,y0,x1,y1,z0,z1,col,o={}){ let s=''; const L=[P(x0,y1,z0),P(x1,y1,z0),P(x1,y1,z1),P(x0,y1,z1)], R=[P(x1,y0,z0),P(x1,y1,z0),P(x1,y1,z1),P(x1,y0,z1)];
  s+=rface(L,mix(col,'#ffffff',.04))+rface(R,mix(col,'#5A5A50',.14));
  if(o.win) s+=winGrid(x0,y1,x1,y1,z0,z1,o.win[0],o.win[1],o.wo||{})+winGrid(x1,y1,x1,y0,z0,z1,o.win[0],o.win[2]||o.win[1],Object.assign({dark:1},o.wo||{}));
  if(o.fins){ const n=o.fins; for(let i=1;i<n;i++){ const t=i/n; const a=P(x0+(x1-x0)*t,y1,z0+.1), b=P(x0+(x1-x0)*t,y1,z1-.05); s+='<line x1="'+f1(a[0])+'" y1="'+f1(a[1])+'" x2="'+f1(b[0])+'" y2="'+f1(b[1])+'" stroke="'+mix(col,'#ffffff',.25)+'" stroke-width="3"/><line x1="'+f1(a[0]+2)+'" y1="'+f1(a[1]+1)+'" x2="'+f1(b[0]+2)+'" y2="'+f1(b[1]+1)+'" stroke="'+mix(col,'#5A5A50',.25)+'" stroke-width="1"/>'; }
    for(let i=1;i<Math.round(n*(y1-y0)/(x1-x0));i++){ const t=i/Math.round(n*(y1-y0)/(x1-x0)); const a=P(x1,y1-(y1-y0)*t,z0+.1), b=P(x1,y1-(y1-y0)*t,z1-.05); s+='<line x1="'+f1(a[0])+'" y1="'+f1(a[1])+'" x2="'+f1(b[0])+'" y2="'+f1(b[1])+'" stroke="'+mix(col,'#5A5A50',.08)+'" stroke-width="3"/>'; } }
  const T=[P(x0,y0,z1),P(x1,y0,z1),P(x1,y1,z1),P(x0,y1,z1)]; s+=poly(T,'fill="'+(o.roof||RC.roof)+'" stroke="'+mix(col,'#ffffff',.2)+'" stroke-width="2.2" stroke-linejoin="round"');
  if(o.units!==false&&(x1-x0)*(y1-y0)>2){ const ux=x0+(x1-x0)*.25, uy=y0+(y1-y0)*.3; s+=rbox(ux,uy,ux+.5,uy+.35,z1,z1+.25,'#BFC1BA')+rbox(ux+.8,uy+.1,ux+1.1,uy+.4,z1,z1+.18,'#B3B6AF'); }
  return s; }
function rbox(x0,y0,x1,y1,z0,z1,col){ return rface([P(x0,y1,z0),P(x1,y1,z0),P(x1,y1,z1),P(x0,y1,z1)],col,.6)+rface([P(x1,y0,z0),P(x1,y1,z0),P(x1,y1,z1),P(x1,y0,z1)],mix(col,'#5A5A50',.15),.6)+poly([P(x0,y0,z1),P(x1,y0,z1),P(x1,y1,z1),P(x0,y1,z1)],'fill="'+mix(col,'#ffffff',.15)+'"'); }
function rshadow(x0,y0,x1,y1,h){ const dx=h*.7,dy=h*.22; return poly([P(x0,y0),P(x1,y0),P(x1+dx,y0+dy),P(x1+dx,y1+dy),P(x0+dx,y1+dy),P(x0,y1)],'fill="#3E4A2E" opacity=".26" filter="url(#soft)"'); }
// ---- trees: soft, layered canopies ----
function rtree(x,y,k,type){ const g=P(x,y), s=k||1; let o='<ellipse cx="'+f1(g[0]+14*s)+'" cy="'+f1(g[1]+3)+'" rx="'+f1(16*s)+'" ry="'+f1(6*s)+'" fill="#3E4A2E" opacity=".28" filter="url(#soft2)"/>';
  if(type==='poplar') return o+'<rect x="'+f1(g[0]-1.2*s)+'" y="'+f1(g[1]-8*s)+'" width="'+f1(2.4*s)+'" height="'+f1(8*s)+'" fill="#6B5A48"/><ellipse cx="'+f1(g[0])+'" cy="'+f1(g[1]-24*s)+'" rx="'+f1(6.5*s)+'" ry="'+f1(19*s)+'" fill="#5F7F3E"/><ellipse cx="'+f1(g[0]-2*s)+'" cy="'+f1(g[1]-27*s)+'" rx="'+f1(4*s)+'" ry="'+f1(14*s)+'" fill="#7D9C50"/>';
  if(type==='pine') return o+'<rect x="'+f1(g[0]-1.6*s)+'" y="'+f1(g[1]-14*s)+'" width="'+f1(3.2*s)+'" height="'+f1(14*s)+'" fill="#7A6450"/><ellipse cx="'+f1(g[0])+'" cy="'+f1(g[1]-20*s)+'" rx="'+f1(17*s)+'" ry="'+f1(8*s)+'" fill="#4F6E3A"/><ellipse cx="'+f1(g[0]-3*s)+'" cy="'+f1(g[1]-23*s)+'" rx="'+f1(12*s)+'" ry="'+f1(5.5*s)+'" fill="#6A8A48"/>';
  return o+'<rect x="'+f1(g[0]-1.8*s)+'" y="'+f1(g[1]-10*s)+'" width="'+f1(3.6*s)+'" height="'+f1(10*s)+'" fill="#6B5A48"/><circle cx="'+f1(g[0]-5*s)+'" cy="'+f1(g[1]-16*s)+'" r="'+f1(8*s)+'" fill="#56763A"/><circle cx="'+f1(g[0]+5*s)+'" cy="'+f1(g[1]-17*s)+'" r="'+f1(8.5*s)+'" fill="#56763A"/><circle cx="'+f1(g[0])+'" cy="'+f1(g[1]-23*s)+'" r="'+f1(9.5*s)+'" fill="#6B8C45"/><circle cx="'+f1(g[0]-3*s)+'" cy="'+f1(g[1]-26*s)+'" r="'+f1(5*s)+'" fill="#88A85A"/>'; }
function hedge(pts2){ return '<path d="'+smooth(gp(pts2))+'" fill="none" stroke="#5F7F3E" stroke-width="6" stroke-linecap="round"/><path d="'+smooth(gp(pts2))+'" fill="none" stroke="#7D9C50" stroke-width="3" stroke-linecap="round" transform="translate(-1 -2)"/>'; }
// ---- people: realistic proportions ----
function rperson(x,y,i,dir,walk){ const g=P(x,y), sk=['#E8C3A0','#C99673','#9C6B4A','#6E4630','#F0D3B8'][i%5], hr=['#2E241E','#6B4A30','#1C1714','#B98A4E','#8A8A8A'][i%5], top=['#F2F2EE','#3F5E74','#C7643E','#E8E6DF','#4F6B48','#2F3B45'][i%6], pant=['#3B4652','#5C6670','#2F3640','#7A6A58'][i%4], w=walk?1:0;
  return '<g transform="translate('+f1(g[0])+' '+f1(g[1])+') scale('+(dir||1)+' 1)"><ellipse cx="4" cy="0.5" rx="6" ry="2" fill="#2E3A24" opacity=".3"/><path d="M-1.2 0l'+(w?'-2':'0')+' -7M1.2 0l'+(w?'2':'0')+' -7" stroke="'+pant+'" stroke-width="2.3" stroke-linecap="round"/><rect x="-3" y="-15" width="6" height="8.5" rx="2.4" fill="'+top+'"/><path d="M-3-13l'+(w?'-1.5 5':'-.6 5.5')+'M3-13l'+(w?'1.5 5':'.6 5.5')+'" stroke="'+top+'" stroke-width="1.8" stroke-linecap="round"/><circle cx="0" cy="-17.6" r="2.6" fill="'+sk+'"/><path d="M-2.7-17.8q0-3.3 2.7-3.3q2.7 0 2.7 3.3q-1.4-1.3-2.7-1.3q-1.3 0-2.7 1.3z" fill="'+hr+'"/></g>'; }
function rcar(x,y,col,rot){ const a=rot?.36:.7, b=rot?.7:.36; return rbox(x-a/2,y-b/2,x+a/2,y+b/2,.04,.2,col)+rbox(x-a/2+(rot?.04:.16),y-b/2+(rot?.16:.04),x+a/2-(rot?.04:.12),y+b/2-(rot?.12:.04),.2,.33,'#3E4E5A'); }
// ---- deep space / small dishes ----
function dishBig(x,y,k){ let s=rshadow(x-.6,y-.6,x+.6,y+.6,2.2*k)+rbox(x-.55,y-.55,x+.55,y+.55,0,.35,'#D8D5CC')+rbox(x-.3,y-.3,x+.3,y+.3,.35,1.6*k,'#E8E6DF'); const b=P(x,y,1.6*k+.25), r=46*k;
  s+='<g transform="translate('+f1(b[0])+' '+f1(b[1])+') rotate(-24)"><defs><radialGradient id="dg'+(++RID)+'" cx=".4" cy=".35"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#C9CCC7"/></radialGradient></defs><path d="M-'+r+' 0A'+r+' '+(r*.5)+' 0 0 0 '+r+' 0" fill="#B9BCB6"/><ellipse rx="'+r+'" ry="'+(r*.5)+'" fill="url(#dg'+RID+')" stroke="#D9DBD6" stroke-width="2"/><ellipse rx="'+(r*.75)+'" ry="'+(r*.36)+'" fill="none" stroke="#C7CAC4" stroke-width="1"/><ellipse rx="'+(r*.45)+'" ry="'+(r*.22)+'" fill="none" stroke="#C7CAC4" stroke-width="1"/>'+
    '<path d="M-'+(r*.6)+' '+(r*.1)+'L0 -'+(r*.62)+'L'+(r*.6)+' '+(r*.1)+'M0 '+(r*.25)+'L0 -'+(r*.62)+'" stroke="#9AA09A" stroke-width="1.6" fill="none"/><ellipse cy="-'+(r*.64)+'" rx="'+(r*.1)+'" ry="'+(r*.05)+'" fill="#E8E6DF" stroke="#9AA09A"/></g>';
  return s; }
function dishSmall(x,y,k,ang){ const b=P(x,y,.25), r=13*(k||1); return '<ellipse cx="'+f1(b[0]+8)+'" cy="'+f1(b[1]+5)+'" rx="'+(r*.9)+'" ry="'+(r*.35)+'" fill="#3E4A2E" opacity=".25" filter="url(#soft2)"/><rect x="'+f1(b[0]-2)+'" y="'+f1(b[1]-r*.7)+'" width="4" height="'+f1(r*.7+6)+'" fill="#D3D1C9"/><g transform="translate('+f1(b[0])+' '+f1(b[1]-r*.8)+') rotate('+(ang||-30)+')"><ellipse rx="'+r+'" ry="'+(r*.48)+'" fill="#F4F3EF" stroke="#C9CBC5" stroke-width="1.2"/><path d="M0 0V-'+(r*.6)+'" stroke="#8E948E" stroke-width="1.2"/></g>'; }
// ---- launch complex (LC-39 style: hardstand, flame trench, service tower, lightning mast, water sphere) ----
function launchPad(x,y){ let s='';
  const hs=[[x-2.2,y-1.2],[x+1.4,y-1.6],[x+2.4,y-.2],[x+1.8,y+1.8],[x-1.2,y+2.2],[x-2.4,y+.8]];
  s+='<path d="'+smooth(gp(hs),true)+'" fill="#D3CFC3" stroke="#C2BDAE" stroke-width="3"/>'+'<path d="'+smooth(gp(hs.map(p=>[x+(p[0]-x)*.78,y+(p[1]-y)*.78,.0])),true)+'" fill="#DDD9CE"/>';
  s+=poly(gp([[x-.25,y+.2],[x+2.1,y+.2],[x+2.1,y+.75],[x-.25,y+.75]]),'fill="#4A4A44"')+poly(gp([[x-.25,y+.2],[x+2.1,y+.2],[x+2.1,y+.3],[x-.25,y+.3]]),'fill="#2E2E2A"');
  // water sphere
  { const g=P(x+1.6,y-1.2,0); s+='<line x1="'+f1(g[0]-6)+'" y1="'+f1(g[1])+'" x2="'+f1(g[0]-3)+'" y2="'+f1(g[1]-34)+'" stroke="#A9ADA6" stroke-width="2"/><line x1="'+f1(g[0]+6)+'" y1="'+f1(g[1])+'" x2="'+f1(g[0]+3)+'" y2="'+f1(g[1]-34)+'" stroke="#A9ADA6" stroke-width="2"/><defs><radialGradient id="ws" cx=".35" cy=".3"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#BFC3BD"/></radialGradient></defs><circle cx="'+f1(g[0])+'" cy="'+f1(g[1]-44)+'" r="13" fill="url(#ws)"/>'; }
  s+=rshadow(x-.5,y-.8,x+.1,y-.2,7.2);
  // service tower (lattice)
  const tx0=x-.55,ty0=y-.85,tx1=x-.05,ty1=y-.35,H=7;
  s+=rface([P(tx0,ty1,0),P(tx1,ty1,0),P(tx1,ty1,H),P(tx0,ty1,H)],'#C24F3A',.8)+rface([P(tx1,ty0,0),P(tx1,ty1,0),P(tx1,ty1,H),P(tx1,ty0,H)],'#A8432F',.8);
  for(let z=.5;z<H;z+=.5){ const a=P(tx0,ty1,z),b=P(tx1,ty1,z-.5),c=P(tx1,ty1,z),d=P(tx1,ty0,z-.5); s+='<line x1="'+f1(a[0])+'" y1="'+f1(a[1])+'" x2="'+f1(b[0])+'" y2="'+f1(b[1])+'" stroke="#E7A592" stroke-width=".8"/><line x1="'+f1(c[0])+'" y1="'+f1(c[1])+'" x2="'+f1(d[0])+'" y2="'+f1(d[1])+'" stroke="#D58C78" stroke-width=".8"/>'; const h=P(tx0,ty1,z), h2=P(tx1,ty1,z); s+='<line x1="'+f1(h[0])+'" y1="'+f1(h[1])+'" x2="'+f1(h2[0])+'" y2="'+f1(h2[1])+'" stroke="#E7A592" stroke-width=".8"/>'; }
  // access arm
  s+=rbox(tx1,ty0+.15,x+.25,ty0+.3,5.2,5.38,'#B7B9B2');
  // lightning mast + catenary
  { const m=P(x-1.4,y-1.4,0), mt=P(x-1.4,y-1.4,9.2); s+='<line x1="'+f1(m[0])+'" y1="'+f1(m[1])+'" x2="'+f1(mt[0])+'" y2="'+f1(mt[1])+'" stroke="#9AA09A" stroke-width="2.4"/><path d="M'+f1(mt[0])+' '+f1(mt[1])+'Q'+f1(mt[0]+70)+' '+f1(mt[1]+120)+' '+f1(P(x+2.4,y+1.2)[0])+' '+f1(P(x+2.4,y+1.2)[1])+'" fill="none" stroke="#9AA09A" stroke-width=".8" opacity=".7"/><path d="M'+f1(mt[0])+' '+f1(mt[1])+'Q'+f1(mt[0]-40)+' '+f1(mt[1]+130)+' '+f1(P(x-2.6,y+1.4)[0])+' '+f1(P(x-2.6,y+1.4)[1])+'" fill="none" stroke="#9AA09A" stroke-width=".8" opacity=".7"/>'; }
  // rocket (realistic small launcher: white with black interstage)
  { const b=P(x+.3,y-.6,0); s+='<g transform="translate('+f1(b[0])+' '+f1(b[1])+')"><defs><linearGradient id="rk" x1="0" x2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#ECEDEA"/><stop offset="1" stop-color="#BFC2BC"/></linearGradient></defs><path d="M-7 0V-120Q-7-150 0-162Q7-150 7-120V0Z" fill="url(#rk)"/><rect x="-7" y="-92" width="14" height="6" fill="#2E2E2A"/><rect x="-7" y="-60" width="14" height="2.5" fill="#C24F3A"/><path d="M-7-8l-6 8v-14l6-8zM7-8l6 8v-14l-6-8z" fill="#CFCFC9"/><text x="0" y="-30" text-anchor="middle" font-family="'+FD+'" font-weight="800" font-size="6" fill="#4A4A44" transform="rotate(-90 0 -30)">PERIGEO</text></g>'; }
  return s; }
// ---- natural pond ----
function pond(cx,cy){ const shape=[[cx-1.6,cy-.4],[cx-.9,cy-1.2],[cx+.4,cy-1.1],[cx+1.5,cy-.5],[cx+1.7,cy+.5],[cx+.8,cy+1.2],[cx-.5,cy+1.0],[cx-1.4,cy+.6]];
  const d=smooth(gp(shape),true), d2=smooth(gp(shape.map(p=>[cx+(p[0]-cx)*.9,cy+(p[1]-cy)*.9])),true);
  let s='<defs><linearGradient id="pw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8FC2C2"/><stop offset=".6" stop-color="#5E9EA3"/><stop offset="1" stop-color="#477F86"/></linearGradient></defs><path d="'+d+'" fill="#CFCAB9" stroke="#BDB7A3" stroke-width="5"/><path d="'+d2+'" fill="url(#pw)"/>';
  [[cx-.4,cy-.3],[cx+.7,cy+.4],[cx-1,cy+.3],[cx+.2,cy+.7]].forEach((l,i)=>{ const g=P(l[0],l[1]); s+='<ellipse cx="'+f1(g[0])+'" cy="'+f1(g[1])+'" rx="'+(5+i%2*2)+'" ry="'+(2.6+i%2)+'" fill="#6E8F45"/><circle cx="'+f1(g[0]+2)+'" cy="'+f1(g[1]-1)+'" r="1.4" fill="#F1E3E8"/>'; });
  const a=P(cx-.8,cy-.6), b=P(cx+.6,cy-.7); s+='<path d="M'+f1(a[0])+' '+f1(a[1])+'Q'+f1((a[0]+b[0])/2)+' '+f1(a[1]-4)+' '+f1(b[0])+' '+f1(b[1])+'" stroke="#fff" stroke-width="1.5" opacity=".5" fill="none"/>';
  return s; }
// ---- roads ----
function rroad(pts2,w,o={}){ const d=smooth(gp(pts2)); return '<path d="'+d+'" fill="none" stroke="'+RC.curb+'" stroke-width="'+(w+6)+'" stroke-linecap="round" stroke-linejoin="round"/><path d="'+d+'" fill="none" stroke="'+(o.col||RC.asph)+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round"/>'+(o.dash===false?'':'<path d="'+d+'" fill="none" stroke="#F3F1EA" stroke-width="1.6" stroke-dasharray="10 10" opacity=".85"/>'); }

function hcampus(){ C={ox:610,oy:185,tw:48,th:24,tz:24}; let s='<defs><filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .3  0 0 0 0 .32  0 0 0 0 .2  0 0 0 .08 0"/></filter><filter id="blotch" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".008" numOctaves="3" seed="12"/><feColorMatrix values="0 0 0 0 .45  0 0 0 0 .5  0 0 0 0 .25  0 0 0 .32 -.06"/></filter><linearGradient id="fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E6ECEA" stop-opacity=".95"/><stop offset=".25" stop-color="#E6ECEA" stop-opacity=".3"/><stop offset=".45" stop-color="#E6ECEA" stop-opacity="0"/></linearGradient><radialGradient id="sun" cx=".15" cy=".0" r="1"><stop offset="0" stop-color="#FFEFCB" stop-opacity=".45"/><stop offset="1" stop-color="#FFEFCB" stop-opacity="0"/></radialGradient></defs>';
  // ---- fields patchwork (like Fucino) ----
  s+='<rect width="1280" height="800" fill="'+RC.field1+'"/>';
  const fields=[[[-14,-10],[2,-10],[1,-1],[-14,0]],[[2,-10],[16,-10],[15,-3],[1,-1]],[[16,-10],[34,-10],[34,-2],[15,-3]],[[-14,0],[-1,-1],[-2,18],[-14,18]],[[-14,18],[-2,18],[-2,34],[-14,34]],[[-2,22],[14,21],[14,34],[-2,34]],[[14,21],[34,20],[34,34],[14,34]],[[27,-2],[34,-2],[34,20],[26,20]]];
  const fc=[RC.field1,RC.field2,RC.field3,RC.field4,RC.field2,RC.field3,RC.field1,RC.field4];
  fields.forEach((f,i)=>{ s+=poly(gp(f),'fill="'+fc[i]+'"'); for(let k=1;k<14;k++){ const t=k/14, a=lerp(f[0],f[3],t), b=lerp(f[1],f[2],t), A=P(a[0],a[1]), B=P(b[0],b[1]); s+='<line x1="'+f1(A[0])+'" y1="'+f1(A[1])+'" x2="'+f1(B[0])+'" y2="'+f1(B[1])+'" stroke="'+mix(fc[i],'#4A5A30',.12)+'" stroke-width="1" opacity=".55"/>'; } });
  s+='<rect width="1280" height="800" filter="url(#blotch)"/>';
  // canal
  s+='<path d="'+smooth(gp([[26,-12],[25.4,0],[24.2,9],[24.6,19],[23,34]]))+'" fill="none" stroke="#8DB7B4" stroke-width="7"/>';
  // ---- campus grounds: irregular lawn ----
  const site=[[-1.5,-.5],[6,-2.2],[14,-1.5],[19,-3.4],[24,-1],[24.5,6],[21,10.5],[20,16.5],[13,19],[5,19.5],[-.5,17],[-2.2,9]];
  s+='<path d="'+smooth(gp(site),true)+'" fill="'+RC.lawn+'" stroke="#C9C3AE" stroke-width="3"/>';
  // fence
  s+='<path d="'+smooth(gp(site),true)+'" fill="none" stroke="#9BA09A" stroke-width="1.2" stroke-dasharray="3 3" transform="translate(0 -3)"/>';
  // ---- roads (asymmetric, curving) ----
  s+=rroad([[-12,17.5],[-2,16.6],[4,15.8],[8,15.6],[11.2,13.6],[12.2,10.6],[13.6,8.6],[18,8.2],[24,8.9],[34,9.5]],15);
  s+=rroad([[11.8,11.6],[9.6,9.6],[6.6,8.4],[3.2,8],[0,7.2],[-12,6]],11);
  s+=rroad([[4,15.8],[4.4,13.6],[5.4,12.4]],9,{dash:false});
  s+=rroad([[3.2,8],[3.6,5.8],[4.4,3.2]],8,{dash:false});
  // crawlerway: twin gravel lanes VAB -> pad
  { const cw=[[16.3,5.2],[17.6,3.6],[19.2,1.6],[20.6,.2]]; s+='<path d="'+smooth(gp(cw))+'" fill="none" stroke="#D9D2BC" stroke-width="18" stroke-linecap="round"/><path d="'+smooth(gp(cw))+'" fill="none" stroke="'+RC.lawn2+'" stroke-width="6"/>'; }
  // ---- paved plazas & parking ----
  const pave=(pp,c)=>'<path d="'+smooth(gp(pp),true)+'" fill="'+(c||'#DCD8CD')+'" stroke="#CBC6B6" stroke-width="2"/>';
  s+=pave([[1.6,10.6],[7.4,10.4],[7.6,14.6],[4.6,15.2],[1.4,14.8]]);
  s+=pave([[7.8,15.9],[11,15.8],[11.2,17.6],[7.6,17.8]],'#C9C7BF');
  s+=pave([[12.6,2.8],[17.6,2.6],[17.8,7.8],[12.4,8]],'#D6D2C6');
  s+=pave([[6.2,3.4],[11.4,3.3],[11.6,7.6],[6,7.8]],'#D6D2C6');
  for(let i=0;i<6;i++){ const a=P(8+i*.55,16.05), b=P(8+i*.55,16.75), c=P(8+i*.55,16.95), d=P(8+i*.55,17.6); s+='<line x1="'+f1(a[0])+'" y1="'+f1(a[1])+'" x2="'+f1(b[0])+'" y2="'+f1(b[1])+'" stroke="#F2F0E9" stroke-width="1.2"/><line x1="'+f1(c[0])+'" y1="'+f1(c[1])+'" x2="'+f1(d[0])+'" y2="'+f1(d[1])+'" stroke="#F2F0E9" stroke-width="1.2"/>'; }
  // dish field (Fucino-like) on lawn top-left
  [[1.5,2.4,.9,-20],[3,1.2,1,-35],[4.6,.6,.8,-25],[2.2,4.4,1.1,-30],[5.6,2.2,.9,-15],[0.4,5.6,.8,-40],[6.6,.4,.7,-28]].forEach(d=>s+=dishSmall(d[0],d[1],d[2],d[3]));
  // ---- shadows (sun from top-left) ----
  s+=rshadow(2,10.8,5.4,12.4,2.2)+rshadow(2,12.4,3.4,14.6,2.2)+rshadow(8.2,11.3,11,13.3,2.6)+rshadow(13.2,3.4,16.2,6.6,6.6)+rshadow(11.4,4.6,13.2,6.6,1.8)+rshadow(6.8,4.2,10.4,6.8,2.4)+rshadow(13.4,12.6,15.2,14.4,1.6);
  // ---- trees: rows of poplars along main road and around site ----
  for(let i=0;i<12;i++){ s+=rtree(-1+i*1.05,18.2-i*.12,1,'poplar'); }
  [[-2,8.8],[-1.6,11],[-1.9,13.2],[-.8,15]].forEach(t=>s+=rtree(t[0],t[1],1,'pine'));
  [[18.6,11],[19.4,13.6],[17.6,15.6],[21.2,6.4],[22.4,4]].forEach((t,i)=>s+=rtree(t[0],t[1],1.05,i%2?'pine':'round'));
  // ---- LAB / TEST CENTRE (ESTEC-like hall + large space simulator) ----
  s+=rblock(6.8,4.2,10.4,6.8,0,2.4,'#E6E4DC',{win:[1,8,6],wo:{ribbon:1,sill:.62,wh:.22}});
  { const g=P(9.4,3.9,2.4); const id='lss'; s+='<defs><linearGradient id="'+id+'" x1="0" x2="1"><stop offset="0" stop-color="#F4F3EE"/><stop offset=".6" stop-color="#E3E2DB"/><stop offset="1" stop-color="#BFBFB7"/></linearGradient></defs>'+cyl(9.4,4.4,.85,0,3.4,'#E7E6DF')+cyl(9.4,4.4,.85,3.4,3.6,'#F2F1EC',true); }
  // ---- VAB-like assembly building (construction) ----
  s+=rblock(11.4,4.6,13.2,6.6,0,1.8,'#E2E0D8',{win:[2,6,5]});
  s+=rblock(13.2,3.4,16.2,6.6,0,6.6,'#E9E8E2',{units:false});
  { // giant doors and vertical paneling on VAB, painted agency stripe
    for(let k=1;k<10;k++){ const t=k/10, a=P(13.2+3*t,6.6,.05), b=P(13.2+3*t,6.6,6.55); s+='<line x1="'+f1(a[0])+'" y1="'+f1(a[1])+'" x2="'+f1(b[0])+'" y2="'+f1(b[1])+'" stroke="#D6D4CC" stroke-width="1"/>'; }
    s+=poly(gp([[14.1,6.6,0],[15.3,6.6,0],[15.3,6.6,5.4],[14.1,6.6,5.4]]),'fill="#C9C9C2"')+[...Array(9)].map((_,i)=>{ const a=P(14.1,6.6,.6*i+.6), b=P(15.3,6.6,.6*i+.6); return '<line x1="'+f1(a[0])+'" y1="'+f1(a[1])+'" x2="'+f1(b[0])+'" y2="'+f1(b[1])+'" stroke="#B4B4AC" stroke-width="1"/>'; }).join('');
    s+=poly(gp([[16.2,4.0,1.4],[16.2,4.9,1.4],[16.2,4.9,6.1],[16.2,4.0,6.1]]),'fill="#E07A45" opacity=".9"')+poly(gp([[16.2,4.9,1.4],[16.2,5.7,1.4],[16.2,5.7,6.1],[16.2,4.9,6.1]]),'fill="#3F8E8A" opacity=".9"');
    const c=P(16.2,5.9,4.6); s+='<circle cx="'+f1(c[0])+'" cy="'+f1(c[1]-4)+'" r="0"/>'; }
  // ---- ADMIN (ESA/ESOC-like L building with glass and louvres) ----
  s+=rblock(2,10.8,5.4,12.4,0,2.2,'#EEEDE6',{win:[3,9,4],wo:{ribbon:1,sill:.22,wh:.55}});
  s+=rblock(2,12.4,3.4,14.6,0,2.2,'#EEEDE6',{win:[3,4,5],wo:{ribbon:1,sill:.22,wh:.55}});
  // entrance canopy + flags
  s+=rbox(3.4,13.6,4.6,14.5,1,1.08,'#F4F3EE');
  [[5,13.9],[5.4,13.6],[5.8,13.3]].forEach((f,i)=>{ const g=P(f[0],f[1]); s+='<line x1="'+f1(g[0])+'" y1="'+f1(g[1])+'" x2="'+f1(g[0])+'" y2="'+f1(g[1]-40)+'" stroke="#B9BCB6" stroke-width="1.6"/><path d="M'+f1(g[0])+' '+f1(g[1]-40)+'q8 2 16 0v10q-8 2-16 0z" fill="'+['#3F6FB0','#E07A45','#3F8E8A'][i]+'"/>'; });
  s+=pond(5.6,13.2);
  // ---- MISSION CONTROL (JSC Building 30 style with vertical fins) ----
  s+=rblock(8.2,11.3,11,13.3,0,2.6,'#DCD8CC',{fins:14});
  // ---- FLIGHT DYNAMICS + big deep-space antenna ----
  s+=rblock(13.4,12.6,15.2,14.4,0,1.6,'#E9E7E0',{win:[2,5,5],wo:{ribbon:1,sill:.3,wh:.4}});
  s+=dishBig(16.4,11.8,1);
  // ---- launch complex far out ----
  s+=launchPad(21.6,-.6);
  // cars
  [[8.3,16.4,'#C9CCCB',1],[8.85,16.4,'#4E6A86',1],[9.95,16.4,'#9B4A3C',1],[11,16.4,'#E3E1DA',1],[8.3,17.3,'#5B5F5A',1],[9.4,17.3,'#D9D6CE',1],[10.5,17.3,'#7D8C6A',1],[13.6,8.75,'#E9E8E2',0],[6.3,8.5,'#3F5E74',0]].forEach(c=>s+=rcar(c[0],c[1],c[2],c[3]));
  // front trees & hedges

  [[0.8,10.2,'round'],[1.1,13.4,'round'],[6.9,12.2,'round'],[7.4,14.8,'round'],[11.8,14.6,'pine'],[12.4,15.6,'round'],[16.4,14.6,'round'],[6.4,9.6,'pine'],[11.6,2.6,'round'],[17.6,2.2,'pine']].forEach(t=>s+=rtree(t[0],t[1],1.05,t[2]));
  // people
  [[4.4,12.6,0,1,1],[4.9,12.4,1,-1,0],[5.1,12.6,3,1,0],[6.8,11.6,2,1,1],[3.6,15.6,4,1,1],[9.2,14.1,5,-1,1],[11.2,14.6,1,1,1],[12.8,7.9,0,1,1],[13.6,7.4,3,-1,1],[8.6,8.2,4,1,1],[10.6,3.7,2,1,1],[2.8,9.8,5,-1,1],[14.6,11.9,0,1,1]].forEach(p=>s+=rperson(p[0],p[1],p[2],p[3],p[4]));
  // atmosphere
  s+='<rect width="1280" height="800" fill="url(#fog)"/><rect width="1280" height="800" fill="url(#sun)"/><rect width="1280" height="800" filter="url(#grain)" opacity=".8"/>';
  // labels
  { const a=P(3.7,11.6,2.4); const x=a[0]-150, y=a[1]-46; s+='<g filter="url(#ds)">'+chamf(x-110,y-22,220,44,10)+'</g><line x1="'+(x+110)+'" y1="'+y+'" x2="'+f1(a[0])+'" y2="'+f1(a[1])+'" stroke="'+SF.teal+'" stroke-width="1.6"/><text x="'+(x-94)+'" y="'+(y-3)+'" font-family="'+FD+'" font-weight="800" font-size="14" letter-spacing=".08em" fill="'+SF.dark+'">AMMINISTRAZIONE</text><text x="'+(x-94)+'" y="'+(y+13)+'" font-family="'+FT+'" font-weight="600" font-size="10.5" letter-spacing=".08em" fill="'+SF.mid+'">RIUNIONE IN ATTESA · FASE A</text><circle cx="'+(x+90)+'" cy="'+y+'" r="9" fill="'+SF.orange+'"/><text x="'+(x+90)+'" y="'+(y+4)+'" text-anchor="middle" font-family="'+FD+'" font-weight="900" font-size="12" fill="#fff">!</text>'; }
  { const a=P(14.7,5,6.8); s+='<g filter="url(#ds)">'+chamf(a[0]-66,a[1]-50,132,36,8)+'</g><text x="'+(a[0]-54)+'" y="'+(a[1]-27)+'" font-family="'+FT+'" font-weight="700" font-size="11" letter-spacing=".08em" fill="'+SF.dark+'">SELENE-1</text><rect x="'+(a[0]+8)+'" y="'+(a[1]-36)+'" width="46" height="7" rx="3.5" fill="'+SF.panel+'"/><rect x="'+(a[0]+8)+'" y="'+(a[1]-36)+'" width="30" height="7" rx="3.5" fill="'+SF.teal+'"/>'; }
  s+=sfTop()+sfAlert(96,'AURASAT: la NASA ti aspetta al tavolo',SF.orange)+sfAlert(144,'SELENE-1: integrazione al 65%',SF.teal)+sfMenu();
  return s; }

// ---- more realistic people for the frontal room ----
function sfPerson(cx,cy,s,o,turn){ const sk=o.skin, hr=o.hair, sd=mix(sk,'#5A3A2A',.18);
  return '<g transform="translate('+cx+' '+cy+') scale('+s*(turn||1)+' '+s+')">'+
    '<path d="M-44 0q2-34 14-42q12-7 30-8q18 1 30 8q12 8 14 42z" fill="'+o.suit+'"/><path d="M-44 0q2-34 14-42q12-7 30-8q-20 10-24 50z" fill="#fff" opacity=".12"/><path d="M30 0q-2-30-10-40" stroke="#000" stroke-width="10" opacity=".05"/>'+
    '<path d="M-12-49q12 18 24 0" fill="'+(o.shirt||'#E9EEF2')+'"/><path d="M-12-49l12 24l12-24" fill="none" stroke="'+mix(o.suit,'#000000',.15)+'" stroke-width="2"/>'+(o.acc?'<path d="M-30-40q8-6 18-9" stroke="'+o.acc+'" stroke-width="4" fill="none"/><rect x="14" y="-30" width="13" height="8" rx="1.5" fill="'+o.acc+'"/>':'')+
    '<path d="M-7-62h14v14q-7 4-14 0z" fill="'+sd+'"/><path d="M-17-80q0-28 17-29q17 1 17 29q0 14-6 20q-5 6-11 6q-6 0-11-6q-6-6-6-20z" fill="'+sk+'"/><ellipse cx="-17" cy="-77" rx="3" ry="5" fill="'+sd+'"/><ellipse cx="17" cy="-77" rx="3" ry="5" fill="'+sd+'"/>'+
    hairR(o)+'<path d="M-9-84q3-2 6 0M3-84q3-2 6 0" stroke="'+mix(hr,'#000',.2)+'" stroke-width="1.6" fill="none" stroke-linecap="round"/><ellipse cx="-6" cy="-78" rx="1.8" ry="2.1" fill="#26333C"/><ellipse cx="6" cy="-78" rx="1.8" ry="2.1" fill="#26333C"/><path d="M0-76q-2 5 0 7q1 1 2 0" stroke="'+sd+'" stroke-width="1.4" fill="none"/><path d="M-5-64q5 '+(o.mood||3)+' 10 0" stroke="#8A4A3A" stroke-width="1.8" fill="none" stroke-linecap="round"/>'+
    (o.glasses?'<rect x="-12" y="-82" width="10" height="8" rx="3" fill="none" stroke="#26333C" stroke-width="1.4"/><rect x="2" y="-82" width="10" height="8" rx="3" fill="none" stroke="#26333C" stroke-width="1.4"/><path d="M-2-78h4" stroke="#26333C" stroke-width="1.4"/>':'')+'</g>'; }
function hairR(o){ const c=o.hair, c2=mix(c,'#ffffff',.18); if(o.hs==='bun') return '<circle cx="0" cy="-112" r="9" fill="'+c+'"/><path d="M-18-78q-3-33 18-34q21 1 18 34q-5-15-18-17q-13 2-18 17z" fill="'+c+'"/><path d="M-8-108q6-3 12 0" stroke="'+c2+'" stroke-width="2" fill="none"/>';
  if(o.hs==='long') return '<path d="M-19-76q-4-36 19-37q23 1 19 37v30q-5 4-9 0v-22q-4-14-10-16q-9 4-14 6q-3 4-4 10v22q-4 4-9 0z" fill="'+c+'"/><path d="M-6-108q8-3 14 2" stroke="'+c2+'" stroke-width="2" fill="none"/>';
  if(o.hs==='bald') return '<path d="M-18-72q-2-10 2-16M18-72q2-10-2-16" stroke="'+c+'" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-6-104q6-2 12 0" stroke="#fff" stroke-width="2" opacity=".35" fill="none"/>';
  return '<path d="M-18-76q-4-35 18-36q22 1 18 36q-3-12-9-15q-9 5-24 2q-4 4-3 13z" fill="'+c+'"/>'; }
// ===================== INTERNI ISOMETRICI (stesso stile del campus) =====================
// figura in piedi, più dettagliata e scalabile
function fig(x,y,o){ const g=P(x,y), s=o.s||1.9, sk=o.skin||'#E8C3A0', hr=o.hair||'#3A2A22', top=o.top||'#F2F2EE', pant=o.pant||'#3B4652', dir=o.dir||1, sd=mix(sk,'#5A3A2A',.15);
  let b='<g transform="translate('+f1(g[0])+' '+f1(g[1])+') scale('+(s*dir)+' '+s+')"><ellipse cx="3" cy=".6" rx="7" ry="2.4" fill="#2E3A3A" opacity=".25"/>';
  if(o.suit){ // tuta da camera bianca
    b+='<path d="M-2.4 0v-8M2.4 0v-8" stroke="#E9EEF2" stroke-width="3" stroke-linecap="round"/><path d="M-3 0h2M1 0h2.4" stroke="#7FB6C8" stroke-width="2"/><rect x="-3.6" y="-16" width="7.2" height="9.5" rx="3" fill="#F6F8F9"/><path d="M-3.6-14l'+(o.arm||'-1.4 5.5')+'M3.6-14l1.4 5.5" stroke="#F6F8F9" stroke-width="2.2" stroke-linecap="round"/><circle cx="-5" cy="-8.5" r="1.1" fill="#7FB6C8"/><circle cx="5" cy="-8.5" r="1.1" fill="#7FB6C8"/>'+
       '<path d="M-3.4-17.2q0-5.4 3.4-5.6q3.4.2 3.4 5.6v1.2h-6.8z" fill="#F6F8F9"/><ellipse cx=".6" cy="-18.4" rx="2" ry="1.7" fill="'+sk+'"/><rect x="-1.3" y="-17.6" width="3.8" height="1.6" rx=".8" fill="#7FB6C8"/></g>'; return b; }
  b+='<path d="M-1.4 0l'+(o.walk?'-1.6':'0')+' -8M1.4 0l'+(o.walk?'1.6':'0')+' -8" stroke="'+pant+'" stroke-width="2.6" stroke-linecap="round"/><path d="M-2.4 0h1.6M1 0h2" stroke="#2A2A28" stroke-width="1.6" stroke-linecap="round"/><rect x="-3.4" y="-16.2" width="6.8" height="9.6" rx="2.6" fill="'+top+'"/>'+(o.vest?'<path d="M-3.4-15h6.8v2h-6.8z" fill="'+o.vest+'"/><rect x="-3.4" y="-11.8" width="6.8" height="1.2" fill="#F2F0E4" opacity=".8"/>':'')+(o.coat?'<path d="M-3.6-16v10.5h1.4v-10M3.6-16v10.5h-1.4v-10" fill="#F7F8F6"/>':'')+
     '<path d="M-3.4-14.5l'+(o.arm||'-1 5.6')+'M3.4-14.5l1 5.6" stroke="'+(o.coat?'#F7F8F6':top)+'" stroke-width="2" stroke-linecap="round"/><rect x="-1" y="-18" width="2" height="1.8" fill="'+sd+'"/><ellipse cx="0" cy="-19.8" rx="2.6" ry="2.9" fill="'+sk+'"/>'+
     '<path d="M-2.8-20q0-3.4 2.8-3.5q2.8.1 2.8 3.5q-1.5-1.6-2.8-1.6q-1.3 0-2.8 1.6z" fill="'+hr+'"/>'+(o.headset?'<path d="M-2.9-20.6q0-3.6 2.9-3.6q2.9 0 2.9 3.6" fill="none" stroke="#2A3440" stroke-width=".7"/><rect x="-3.4" y="-21" width="1.1" height="1.8" rx=".4" fill="#2A3440"/>':'')+(o.helmet?'<path d="M-3-21q0-3.8 3-3.8q3 0 3 3.8z" fill="'+o.helmet+'"/>':'')+'</g>'; return b; }
// operatore seduto visto di spalle (sala controllo)
function seated(x,y,o){ const g=P(x,y), s=o.s||1.9;
  return '<g transform="translate('+f1(g[0])+' '+f1(g[1])+') scale('+s+')"><ellipse cx="2" cy="0" rx="6" ry="2.2" fill="#22303A" opacity=".25"/><path d="M-1.5 0v-4.5M1.5 0v-4.5" stroke="#5B636C" stroke-width="1.2"/><ellipse cx="0" cy="-5" rx="4" ry="1.6" fill="#3A434D"/>'+
    '<rect x="-3.4" y="-14.6" width="6.8" height="8.6" rx="2.6" fill="'+(o.top||'#5E6F8A')+'"/><rect x="-3.9" y="-15.6" width="7.8" height="7.5" rx="2" fill="#2E3640"/><ellipse cx="0" cy="-17.6" rx="2.6" ry="2.9" fill="'+(o.skin||'#E8C3A0')+'"/><path d="M-2.7-17.4q0-3.9 2.7-3.9q2.7 0 2.7 3.9q-.4 1.6-2.7 1.4q-2.3.2-2.7-1.4z" fill="'+(o.hair||'#3A2A22')+'"/>'+(o.headset?'<path d="M-2.9-18.4q0-3.4 2.9-3.4q2.9 0 2.9 3.4" fill="none" stroke="#1E262E" stroke-width=".7"/>':'')+'</g>'; }
// immagine mappata su una parete (y=0: lungo x; x=0: lungo y)
function wallG(wall,a0,a1,z0,z1,Wpx,Hpx,content){ const span=a1-a0; let a,b,o;
  if(wall==='y0'){ a=span/Wpx*C.tw/2; b=span/Wpx*C.th/2; o=P(a0,0,z1); } else { a=span/Wpx*C.tw/2; b=-span/Wpx*C.th/2; o=P(0,a1,z1); }
  const d=(z1-z0)/Hpx*C.tz; return '<g transform="matrix('+[a,b,0,d,o[0],o[1]].map(v=>(+v).toFixed(4)).join(' ')+')">'+content+'</g>'; }
// ---------- guscio della stanza ----------
function roomShell(W,D,H,o){ let s='';
  // pavimento + base
  s+=poly([P(-.25,D+.25),P(W+.25,D+.25),P(W+.25,D+.25,-.35),P(-.25,D+.25,-.35)],'fill="'+(o.base||'#D8D4C8')+'"')+poly([P(W+.25,-.25),P(W+.25,D+.25),P(W+.25,D+.25,-.35),P(W+.25,-.25,-.35)],'fill="'+mix(o.base||'#D8D4C8','#3A3A30',.12)+'"');
  s+=poly([P(0,0),P(W,0),P(W,D),P(0,D)],'fill="'+o.floor+'"');
  if(o.tile){ for(let i=1;i<W/o.tile;i++){ const a=P(i*o.tile,0),b=P(i*o.tile,D); s+='<line x1="'+f1(a[0])+'" y1="'+f1(a[1])+'" x2="'+f1(b[0])+'" y2="'+f1(b[1])+'" stroke="'+o.tileC+'" stroke-width="1"/>'; } for(let j=1;j<D/o.tile;j++){ const a=P(0,j*o.tile),b=P(W,j*o.tile); s+='<line x1="'+f1(a[0])+'" y1="'+f1(a[1])+'" x2="'+f1(b[0])+'" y2="'+f1(b[1])+'" stroke="'+o.tileC+'" stroke-width="1"/>'; } }
  if(o.floorFx) s+=o.floorFx;
  // pareti di fondo
  s+=rface([P(0,0,0),P(W,0,0),P(W,0,H),P(0,0,H)],o.wallR||'#EEEDE6',.6)+rface([P(0,0,0),P(0,D,0),P(0,D,H),P(0,0,H)],o.wallL||'#E2E1D9',.6);
  // zoccolo e fascia
  s+=poly([P(0,0,0),P(W,0,0),P(W,0,.12),P(0,0,.12)],'fill="'+(o.skirt||'#C9C6BB')+'"')+poly([P(0,0,0),P(0,D,0),P(0,D,.12),P(0,0,.12)],'fill="'+mix(o.skirt||'#C9C6BB','#3A3A30',.08)+'"');
  if(o.stripe) s+=poly([P(0,0,o.stripe[0]),P(W,0,o.stripe[0]),P(W,0,o.stripe[0]+.06),P(0,0,o.stripe[0]+.06)],'fill="'+o.stripe[1]+'"')+poly([P(0,0,o.stripe[0]),P(0,D,o.stripe[0]),P(0,D,o.stripe[0]+.06),P(0,0,o.stripe[0]+.06)],'fill="'+o.stripe[1]+'"');
  // spessore in cima (sezione)
  const T=.22; s+=poly([P(-T,-T,H),P(W,-T,H),P(W,0,H),P(0,0,H),P(0,D,H),P(-T,D,H)],'fill="'+(o.cap||'#3E4A52')+'"');
  s+=poly([P(W,-T,H),P(W,0,H),P(W,0,0),P(W,-T,0)],'fill="'+(o.capSide||'#D0CDC2')+'"')+poly([P(-T,D,H),P(0,D,H),P(0,D,0),P(-T,D,0)],'fill="'+(o.capSide||'#D0CDC2')+'"');
  return s; }
function frontCut(W,D,o){ const h=o.cut||.35, c=o.wallR||'#EEEDE6', T=.22; return rface([P(0,D,0),P(W,D,0),P(W,D,h),P(0,D,h)],mix(c,'#ffffff',.05),.5)+rface([P(W,0,0),P(W,D,0),P(W,D,h),P(W,0,h)],mix(c,'#3A3A30',.1),.5)+poly([P(0,D,h),P(W,D,h),P(W+T,D+T,h),P(-T,D+T,h)],'fill="'+(o.cap||'#3E4A52')+'"')+poly([P(W,0,h),P(W+T,-T,h),P(W+T,D+T,h),P(W,D,h)],'fill="'+(o.cap||'#3E4A52')+'"')+poly([P(W,D,h),P(W+T,D+T,h),P(W+T,D+T,0),P(W,D,0)],'fill="'+mix(o.cap||'#3E4A52','#000',.1)+'"'); }
function ceilingLights(W,D,H,n,col){ let s=''; for(let i=0;i<n;i++){ const x=(i+.5)*W/n; s+=poly([P(x-.5,0,H-.02),P(x+.5,0,H-.02),P(x+.5,0,H-.12),P(x-.5,0,H-.12)],'fill="'+(col||'#FFFFFF')+'"'); } return s; }
// oggetti generici
function shelfRack(x,y,w,d,h,levels,boxCols,side){ let s=''; const P4=[[x,y],[x+w-.06,y],[x,y+d-.06],[x+w-.06,y+d-.06]];
  [P4[0],P4[1],P4[2]].forEach(p=>s+=rbox(p[0],p[1],p[0]+.06,p[1]+.06,0,h,'#4F7FB0'));
  for(let l=0;l<levels;l++){ const z=.1+l*h/levels; s+=rbox(x,y,x+w,y+d,z,z+.05,'#E07A45');
    let k=0; if(side){ for(let u=y+.08;u<y+d-.35;u+=.5){ const c=boxCols[(l*5+k++)%boxCols.length], bh=.2+((l+k)%3)*.07; s+=rbox(x+.08,u,x+w-.08,u+.4,z+.05,z+.05+bh,c); } }
    else for(let u=x+.08;u<x+w-.35;u+=.5){ const c=boxCols[(l*5+k++)%boxCols.length], bh=.2+((l+k)%3)*.07; s+=rbox(u,y+.08,u+.4,y+d-.08,z+.05,z+.05+bh,c); } }
  s+=rbox(P4[3][0],P4[3][1],P4[3][0]+.06,P4[3][1]+.06,0,h,'#4F7FB0'); return s; }
function monitor(x,y,z,w,h,face,screen){ // face 'y' (faces +y) o 'x' (faces +x)
  const q=face==='y'?[P(x-w/2,y,z),P(x+w/2,y,z),P(x+w/2,y,z+h),P(x-w/2,y,z+h)]:[P(x,y-w/2,z),P(x,y+w/2,z),P(x,y+w/2,z+h),P(x,y-w/2,z+h)];
  const inner=q.map((p,i)=>lerp(p,lerp(lerp(q[0],q[1],.5),lerp(q[3],q[2],.5),.5),.12));
  return poly(q,'fill="#2B3138"')+poly(inner,'fill="'+(screen||'#5FA8C8')+'"')+poly([inner[3],lerp(inner[3],inner[2],.6),lerp(lerp(inner[0],inner[3],.8),lerp(inner[1],inner[2],.8),.3)],'fill="#fff" opacity=".18"'); }
function desk(x0,y0,x1,y1,z,col){ return rbox(x0+.05,y0+.05,x0+.12,y0+.12,0,z,'#9AA2A8')+rbox(x1-.12,y1-.12,x1-.05,y1-.05,0,z,'#9AA2A8')+rbox(x1-.12,y0+.05,x1-.05,y0+.12,0,z,'#9AA2A8')+rbox(x0,y0,x1,y1,z-.06,z,col||'#F2F1EC'); }
function hazard(x0,y0,x1,y1){ let s=poly(gp([[x0,y0],[x1,y0],[x1,y1],[x0,y1]]),'fill="none" stroke="#F2C14E" stroke-width="6" stroke-linejoin="round"'); s+=poly(gp([[x0,y0],[x1,y0],[x1,y1],[x0,y1]]),'fill="none" stroke="#2A2A28" stroke-width="6" stroke-dasharray="7 7" stroke-linejoin="round"'); return s; }
function cable(a,b,col){ const A=P(a[0],a[1],a[2]||0),B=P(b[0],b[1],b[2]||0); return '<path d="M'+f1(A[0])+' '+f1(A[1])+'Q'+f1((A[0]+B[0])/2)+' '+f1(Math.max(A[1],B[1])+18)+' '+f1(B[0])+' '+f1(B[1])+'" fill="none" stroke="'+(col||'#2A2A28')+'" stroke-width="2"/>'; }
function plant(x,y){ const g=P(x,y); return rbox(x-.18,y-.18,x+.18,y+.18,0,.32,'#C9C3B4')+'<ellipse cx="'+f1(g[0])+'" cy="'+f1(g[1]-30)+'" rx="15" ry="19" fill="#5F8E4A"/><ellipse cx="'+f1(g[0]-4)+'" cy="'+f1(g[1]-36)+'" rx="8" ry="11" fill="#7FAE5E"/>'; }
// mini satellite 3U/6U aperto
function cubesat(x,y,z,s,o){ o=o||{}; const a=.36*s, h=1.02*s; let r='';
  const stack=[['#F28B50',0,.22],['#7C8CFF',.24,.36],['#B783E3',.38,.5],['#F06EAA',.52,.68],['#F0B43A',.7,.98]];
  stack.slice(0,o.n==null?5:o.n).forEach(p=>r+=rbox(x+.03,y+.03,x+a-.03,y+a-.03,z+p[1]*s,z+p[2]*s,p[0]));
  [[a,0],[0,a],[a,a]].forEach(([dx,dy])=>r+=rbox(x+dx-.025,y+dy-.025,x+dx+.025,y+dy+.025,z,z+h,'#AEB8C4'));
  r+=rbox(x-.025,y-.025,x+a+.025,y+a+.025,z+h,z+h+.03,'#AEB8C4');
  if(o.wings){ r+=poly([P(x+a,y+.03,z+.3*s),P(x+a+.9*s,y+.03,z+.3*s),P(x+a+.9*s,y+.03,z+h-.1),P(x+a,y+.03,z+h-.1)],'fill="#3F5FA8" stroke="#DDE3EA" stroke-width="1.5"'); }
  return r; }
// pannello HUD stile infografica (lo sfondo navy si adatta all'immagine di riferimento)
let MONO=0;
function hudScreen(w,h,kind,seed){ const T='#43D3E0', T2='#1B8FA0', BG='#0B1F2E'; let s='<rect width="'+w+'" height="'+h+'" fill="'+BG+'"/><rect width="'+w+'" height="'+h+'" fill="url(#hudg)"/>';
  if(kind==='globe'){ const cx=w/2, cy=h/2, r=Math.min(w,h)*.3; s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+(r*1.45)+'" fill="none" stroke="'+T2+'" stroke-width="3" stroke-dasharray="40 14 8 14"/><circle cx="'+cx+'" cy="'+cy+'" r="'+(r*1.2)+'" fill="none" stroke="'+T+'" stroke-width="6" stroke-dasharray="60 20"/><circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="#123A4E"/><path d="M'+(cx-r*.5)+' '+(cy-r*.4)+'q'+(r*.3)+' -'+(r*.25)+' '+(r*.55)+' -'+(r*.05)+'t'+(r*.2)+' '+(r*.35)+'q-'+(r*.3)+' '+(r*.15)+' -'+(r*.4)+' '+(r*.5)+'q-'+(r*.2)+' -'+(r*.3)+' -'+(r*.35)+' -'+(r*.8)+'zM'+(cx+r*.05)+' '+(cy+r*.2)+'q'+(r*.25)+' 0 '+(r*.3)+' '+(r*.3)+'t-'+(r*.15)+' '+(r*.4)+'q-'+(r*.2)+' -'+(r*.3)+' -'+(r*.15)+' -'+(r*.7)+'z" fill="'+T+'" opacity=".8"/><ellipse cx="'+cx+'" cy="'+cy+'" rx="'+(r*1.9)+'" ry="'+(r*.55)+'" fill="none" stroke="'+(MONO?'#E8F1F5':'#EB7D44')+'" stroke-width="2.5" stroke-dasharray="6 5" transform="rotate(-18 '+cx+' '+cy+')"/><circle cx="'+(cx+r*1.65)+'" cy="'+(cy-r*.6)+'" r="5" fill="'+(MONO?'#FFFFFF':'#EB7D44')+'"/><text x="14" y="26" font-family="'+FT+'" font-weight="700" font-size="15" fill="'+T+'">AURASAT · ORBITA 548 km</text><text x="14" y="'+(h-14)+'" font-family="'+FT+'" font-size="13" fill="'+T2+'">PROSSIMO CONTATTO 00:12:44</text>'; }
  if(kind==='gauges'){ [0,1,2].forEach(i=>{ const cx=w*(i+.5)/3, cy=h*.48, r=Math.min(w/7,h*.28); s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="#0E2A3A"/><circle cx="'+cx+'" cy="'+cy+'" r="'+(r*.86)+'" fill="none" stroke="'+T+'" stroke-width="7" stroke-dasharray="'+(r*5.4*(.4+i*.2))+' 400" transform="rotate(-90 '+cx+' '+cy+')"/><text x="'+cx+'" y="'+(cy+6)+'" text-anchor="middle" font-family="'+FD+'" font-weight="800" font-size="18" fill="#E6FBFF">'+['72%','14,2 W','98%'][i]+'</text><text x="'+cx+'" y="'+(cy+r+22)+'" text-anchor="middle" font-family="'+FT+'" font-weight="700" font-size="12" fill="'+T2+'">'+['BATTERIA','POTENZA','LINK'][i]+'</text>'; }); }
  if(kind==='chart'){ for(let i=0;i<=6;i++) s+='<line x1="20" y1="'+(30+i*(h-50)/6)+'" x2="'+(w-14)+'" y2="'+(30+i*(h-50)/6)+'" stroke="'+T2+'" stroke-width=".8" opacity=".6"/>'; let d='M20 '+(h-30), p='M20 '+(h-20); for(let i=0;i<=20;i++){ const x=20+i*(w-34)/20, v=Math.sin(i*.7+(seed||0))*.25+Math.sin(i*.23)*.2+.5; d+='L'+x.toFixed(1)+' '+(h-20-v*(h-60)).toFixed(1); p+='L'+x.toFixed(1)+' '+(h-20-(v*.6)*(h-60)).toFixed(1); }
    s+='<path d="'+p+'V'+(h-20)+'H20Z" fill="'+T2+'" opacity=".35"/><path d="'+d.replace('M20 '+(h-30),'M20 '+(h-30))+'" fill="none" stroke="'+T+'" stroke-width="3"/><text x="20" y="22" font-family="'+FT+'" font-weight="700" font-size="14" fill="'+T+'">TELEMETRIA · TEMPERATURA</text>'; }
  if(kind==='grid'){ const rows=['SISTEMI','ANTENNA','DOWNLINK','DATI','UPLINK','COMPUTER','TEMPO','TRACKING']; rows.forEach((r,i)=>{ s+='<text x="14" y="'+(32+i*((h-40)/8))+'" font-family="'+FT+'" font-weight="700" font-size="11" fill="'+(MONO?'#BFEFF5':'#9FE3B8')+'">'+r+'</text>'; for(let k=0;k<5;k++) s+='<rect x="'+(w*.42+k*(w*.11))+'" y="'+(21+i*((h-40)/8))+'" width="'+(w*.08)+'" height="'+((h-40)/8-6)+'" fill="'+(MONO?((i*5+k)%13===4?'#E8F1F5':'#43D3E0'):((i*5+k)%13===4?'#EB7D44':'#33C46A'))+'"/>'; }); }
  if(kind==='clock'&&MONO){ s='<rect width="'+w+'" height="'+h+'" fill="#061420"/><text x="'+(w/2)+'" y="'+(h*.45)+'" text-anchor="middle" font-family="DejaVu Sans Mono, monospace" font-weight="700" font-size="'+(h*.3)+'" fill="#43D3E0">214 14:32:07</text><text x="'+(w/2)+'" y="'+(h*.85)+'" text-anchor="middle" font-family="DejaVu Sans Mono, monospace" font-size="'+(h*.22)+'" fill="#BFEFF5">T+ 000:56:56</text>'; }
  else if(kind==='clock'){ s='<rect width="'+w+'" height="'+h+'" fill="#120D0D"/><text x="'+(w/2)+'" y="'+(h*.45)+'" text-anchor="middle" font-family="DejaVu Sans Mono, monospace" font-weight="700" font-size="'+(h*.3)+'" fill="#FF3B2F">214 14:32:07</text><text x="'+(w/2)+'" y="'+(h*.85)+'" text-anchor="middle" font-family="DejaVu Sans Mono, monospace" font-size="'+(h*.22)+'" fill="#FF7A5C">T+ 000:56:56</text>'; }
  if(kind==='sat'){ s+='<g transform="translate('+(w/2)+' '+(h/2)+')"><rect x="-22" y="-30" width="44" height="60" fill="#C9D3DD"/><rect x="-22" y="-30" width="44" height="12" fill="'+(MONO?'#E8F1F5':'#F0B43A')+'"/><rect x="-100" y="-16" width="70" height="32" fill="'+(MONO?'#1B8FA0':'#2E4FA0')+'" stroke="'+(MONO?'#43D3E0':'#7F9BD8')+'"/><rect x="30" y="-16" width="70" height="32" fill="'+(MONO?'#1B8FA0':'#2E4FA0')+'" stroke="'+(MONO?'#43D3E0':'#7F9BD8')+'"/></g><text x="14" y="24" font-family="'+FT+'" font-weight="700" font-size="14" fill="'+T+'">STATO DI BORDO · NOMINALE</text>'; }
  if(kind==='bars'){ for(let i=0;i<7;i++){ const L=.25+((i*37)%60)/100; s+='<rect x="'+(w*.1)+'" y="'+(28+i*(h-40)/7)+'" width="'+(w*.8*L)+'" height="'+((h-40)/7-8)+'" fill="'+(i%2?T:T2)+'"/>'; } s+='<text x="'+(w*.1)+'" y="20" font-family="'+FT+'" font-weight="700" font-size="13" fill="'+T+'">DATI SCIENTIFICI</text>'; }
  return s+'<rect x="1.5" y="1.5" width="'+(w-3)+'" height="'+(h-3)+'" fill="none" stroke="'+T2+'" stroke-width="3"/>'; }
// pannelli HUD di gioco per gli interni
function sidePanel(x,y,w,title,rows){ let s='<g filter="url(#ds)">'+chamf(x,y,w,48+rows.length*40,14)+'</g><text x="'+(x+18)+'" y="'+(y+32)+'" font-family="'+FD+'" font-weight="800" font-size="16" fill="'+SF.dark+'">'+title+'</text>';
  rows.forEach((r,i)=>{ const yy=y+62+i*40; s+='<text x="'+(x+18)+'" y="'+yy+'" font-family="'+FT+'" font-weight="600" font-size="13" fill="'+SF.dark+'">'+r[0]+'</text><text x="'+(x+w-18)+'" y="'+yy+'" text-anchor="end" font-family="'+FT+'" font-size="12" fill="'+SF.mid+'">'+r[1]+'</text><rect x="'+(x+18)+'" y="'+(yy+8)+'" width="'+(w-36)+'" height="8" rx="4" fill="'+SF.panel+'"/><rect x="'+(x+18)+'" y="'+(yy+8)+'" width="'+((w-36)*r[2])+'" height="8" rx="4" fill="'+(r[3]||SF.teal)+'"/>'; });
  return s; }
function roomTitle(t,sub){ return '<g filter="url(#ds)">'+chamf(16,96,330,58,14)+'</g><text x="34" y="120" font-family="'+FT+'" font-weight="700" font-size="10.5" letter-spacing=".16em" fill="'+SF.mid+'">'+sub+'</text><text x="34" y="142" font-family="'+FD+'" font-weight="800" font-size="19" fill="'+SF.dark+'">'+t+'</text>'; }
function actionBar(btns){ let x=640-btns.reduce((a,b)=>a+b[1]+12,-12)/2, s=''; btns.forEach(b=>{ s+='<g filter="url(#ds)"><rect x="'+x+'" y="726" width="'+b[1]+'" height="48" rx="24" fill="'+(b[2]?SF.teal:'#FAFAF6')+'"/></g><text x="'+(x+b[1]/2)+'" y="756" text-anchor="middle" font-family="'+FD+'" font-weight="800" font-size="14" letter-spacing=".06em" fill="'+(b[2]?'#fff':SF.dark)+'">'+b[0]+'</text>'; x+=b[1]+12; }); return s; }
const BG='<rect width="1280" height="800" fill="#E9EDE6"/><radialGradient id="ibg" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#F4F4EF"/><stop offset="1" stop-color="#DCE3DC"/></radialGradient><rect width="1280" height="800" fill="url(#ibg)"/>';
const HUDDEF='<defs><linearGradient id="hudg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14364A" stop-opacity=".9"/><stop offset="1" stop-color="#061420" stop-opacity=".2"/></linearGradient><filter id="glw" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="10"/></filter></defs>';
function depth(list){ return list.sort((a,b)=>a[0]-b[0]).map(x=>x[1]).join(''); }

// ===================== 1. OFFICINA DI COSTRUZIONE (fase C) =====================
function iBuild(){ C={ox:600,oy:200,tw:88,th:44,tz:42}; RID=0; const W=10,D=8,H=3.2; let s=BG+HUDDEF;
  s+=roomShell(W,D,H,{floor:'#B9BEC0',tile:1,tileC:'#AEB3B5',wallR:'#ECEBE5',wallL:'#E0DFD7',stripe:[1.1,SF.teal],cap:'#46525A',
    floorFx:poly(gp([[.4,4.3],[W-.4,4.3],[W-.4,4.5],[.4,4.5]]),'fill="#F2C14E"')+poly(gp([[5.6,.4],[5.8,.4],[5.8,D-.4],[5.6,D-.4]]),'fill="#F2C14E"')});
  // finestre a nastro sul muro y0
  s+=winGrid(.6,0,5,0,1.4,2.9,1,6,{ribbon:1,sill:.1,wh:.8});
  // pannello attrezzi + bacheca CAD sulla parete x0
  s+=wallG('x0',.6,2.6,1,2.4,200,140,'<rect width="200" height="140" fill="#3F6FB0" rx="6"/>'+[...Array(30)].map((_,i)=>'<circle cx="'+(14+(i%10)*19)+'" cy="'+(14+Math.floor(i/10)*20)+'" r="2" fill="#2E5490"/>').join('')+'<path d="M20 70v50M40 72l8 46M60 70h20v6h-20zM100 70v46M96 70h8M130 72q10 10 0 40M160 70l14 44" stroke="#E9EEF2" stroke-width="5" stroke-linecap="round" fill="none"/>');
  s+=wallG('x0',3.4,6.6,1.3,2.7,320,140,hudScreen(320,140,'chart',2));
  // gru a ponte (rotaia)
  s+=rbox(.3,2.8,W-.2,3,H-.35,H-.25,'#E07A45')+rbox(.3,5.2,W-.2,5.4,H-.35,H-.25,'#E07A45')+rbox(6.4,2.8,6.8,5.4,H-.5,H-.35,'#2E4A5E');
  { const a=P(6.6,4.1,H-.5), b=P(6.6,4.1,1.7); s+='<line x1="'+f1(a[0])+'" y1="'+f1(a[1])+'" x2="'+f1(b[0])+'" y2="'+f1(b[1])+'" stroke="#2A2A28" stroke-width="1.6"/><path d="M'+f1(b[0]-5)+' '+f1(b[1])+'q5 9 10 0" stroke="#2A2A28" stroke-width="2" fill="none"/>'; }
  const L=[];
  // scaffalature pezzi (stile magazzino)
  const cols=['#F28B50','#7C8CFF','#B783E3','#F06EAA','#F0B43A','#4DB8E8','#6CC4A1','#DDE2E6'];
  L.push([.2+.9,shelfRack(.2,.25,2.6,.8,2.2,3,cols)]);
  L.push([3.2+.9,shelfRack(3.2,.25,2.6,.8,2.2,3,cols.slice(3).concat(cols.slice(0,3)))]);
  
  // banco di lavoro con satellite al centro
  L.push([6.5+3.3,desk(6.2,2.2,8.6,3.8,.82,'#E9EEF2')+rbox(6.3,2.3,8.5,3.7,.82,.84,'#5FA87A')+cubesat(7.1,2.75,.84,1.1,{wings:1})+rbox(6.5,3.2,6.9,3.5,.84,.9,'#F06EAA')+rbox(8,2.4,8.3,2.7,.84,.92,'#7C8CFF')+rbox(7.9,3.2,8.35,3.55,.84,.88,'#F0B43A')]);
  // stazione CAD
  L.push([1.6+5.6,desk(.8,5,2.6,6.3,.78,'#F2F1EC')+monitor(1.4,5.2,.8,.7,.42,'y','#6FB7D6')+monitor(2.15,5.2,.8,.7,.42,'y','#8FD0A8')+rbox(1.2,5.6,1.8,5.8,.78,.8,'#3A3F46')]);
  L.push([1.7+6.9,fig(1.7,6.9,{top:'#3F6FB0',hair:'#6B4A30',skin:'#E8C3A0',dir:-1,s:2})]);
  // stampante 3D e carrello
  L.push([8.8+6.2,rbox(8.3,5.8,9.4,6.7,0,1.2,'#E9EEF2')+rbox(8.4,5.9,9.3,6.6,.3,1.05,'#BFE2EE')+rbox(8.6,6.1,9.1,6.4,.3,.5,'#F28B50')]);
  L.push([4.4+6.8,rbox(3.9,6.4,4.9,7.1,.5,.56,'#9AA2A8')+rbox(3.95,6.45,4.05,6.55,0,.5,'#9AA2A8')+rbox(4.75,6.95,4.85,7.05,0,.5,'#9AA2A8')+rbox(4.1,6.5,4.5,6.9,.56,.8,'#B783E3')+rbox(4.5,6.6,4.8,6.9,.56,.7,'#F0B43A')]);
  // tecnici
  L.push([7.4+4.4,fig(7.4,4.4,{top:'#F7F8F6',coat:1,hair:'#2E241E',skin:'#9C6B4A',s:2,arm:'-2 4'})]);
  L.push([9+3,fig(9,3,{top:'#2E4A5E',vest:'#EB7D44',helmet:'#F2C14E',hair:'#B98A4E',skin:'#F0D3B8',s:2,dir:-1,arm:'-2 4'})]);
  L.push([3.4+3.6,fig(3.4,3.6,{top:'#4F6B48',vest:'#EB7D44',helmet:'#F2C14E',hair:'#1C1714',skin:'#C99673',s:2,walk:1})]);
  L.push([.6+7.6,plant(.6,7.6)]);
  s+=depth(L)+frontCut(W,D,{wallR:'#ECEBE5',cap:'#46525A'});
  s+=sfTop().replace('FASE A','FASE C')+roomTitle('Officina di costruzione','EDIFICIO DI COSTRUZIONE · FASE C');
  s+=sidePanel(944,96,320,'CubeSat 3U · bilanci',[['Massa','2,5 / 6 kg',.42,'#3FA86B'],['Potenza','7,4 / 15 W',.49,'#3FA86B'],['Eclisse','scarica 22%',.22,'#3FA86B'],['Costo','152 / 315 cr',.48,'#E8AA30']]);
  s+=actionBar([['MAGAZZINO PEZZI',190],['PROGETTO 3D',160],['REVISIONE CDR',180,1]]);
  return s; }

// ===================== 2. CAMERA BIANCA DI ASSEMBLAGGIO (fase D) =====================
function iClean(){ C={ox:600,oy:200,tw:88,th:44,tz:42}; RID=0; const W=10,D=8,H=3.2; let s=BG+HUDDEF;
  s+=roomShell(W,D,H,{floor:'#F3F5F6',tile:.6,tileC:'#E3E8EB',wallR:'#F4F7F8',wallL:'#E8EEF1',skirt:'#BFD6DE',stripe:[2.75,'#7FB6C8'],cap:'#4E6470',
    floorFx:poly(gp([[3,2.2],[7.6,2.2],[7.6,5.8],[3,5.8]]),'fill="#9CC9A3" opacity=".55"')+hazard(2.8,2,7.8,6)});
  // filtri HEPA in alto sulle pareti
  for(let i=0;i<6;i++) s+=poly([P(.5+i*1.55,0,2.15),P(1.75+i*1.55,0,2.15),P(1.75+i*1.55,0,2.65),P(.5+i*1.55,0,2.65)],'fill="#FFFFFF" stroke="#CBD8DE" stroke-width="1.5"')+[0,1,2,3].map(k=>{ const a=P(.6+i*1.55+k*.3,0,2.2), b=P(.6+i*1.55+k*.3,0,2.6); return '<line x1="'+f1(a[0])+'" y1="'+f1(a[1])+'" x2="'+f1(b[0])+'" y2="'+f1(b[1])+'" stroke="#DCE6EA"/>'; }).join('');
  for(let i=0;i<4;i++) s+=poly([P(0,.6+i*1.8,2.15),P(0,1.9+i*1.8,2.15),P(0,1.9+i*1.8,2.65),P(0,.6+i*1.8,2.65)],'fill="#FFFFFF" stroke="#CBD8DE" stroke-width="1.5"');
  // vetrata di osservazione e cartello ISO
  s+=winGrid(6.4,0,9.6,0,.9,2,1,4,{ribbon:1,sill:.05,wh:.9});
  s+=wallG('x0',5.7,7.6,.6,2.05,190,145,'<rect width="190" height="145" rx="6" fill="#DDE8EC"/><rect x="18" y="12" width="154" height="121" rx="4" fill="#9FC3CC"/><rect x="18" y="12" width="154" height="121" rx="4" fill="url(#hudg)" opacity=".25"/><rect x="88" y="12" width="4" height="121" fill="#DDE8EC"/>');
  s+=wallG('y0',.6,2.2,1,1.8,160,80,'<rect width="160" height="80" rx="6" fill="#2F8580"/><text x="80" y="36" text-anchor="middle" font-family="'+FD+'" font-weight="800" font-size="24" fill="#fff">ISO 8</text><text x="80" y="62" text-anchor="middle" font-family="'+FT+'" font-weight="600" font-size="13" fill="#D7F2EF">camera bianca</text>');
  const L=[];
  // supporto rotante + satellite grande
  L.push([5.3+4,cyl(5.3,4,.9,0,.12,'#C9D3DD')+cyl(5.3,4,.22,.12,.95,'#9AA9B6')+rbox(4.75,3.45,5.85,4.55,.95,1.02,'#D9E0E5')+cubesat(4.95,3.65,1.02,2.1,{wings:1,n:4})]);
  // carrello attrezzi ESD
  L.push([8.6+2.2,rbox(8,1.8,9.2,2.6,.6,.66,'#F4F7F8')+rbox(8.05,1.85,8.15,1.95,0,.6,'#9AA9B6')+rbox(9.05,2.45,9.15,2.55,0,.6,'#9AA9B6')+rbox(8.1,1.9,9.1,2.5,.66,.68,'#6FB18A')+rbox(8.3,2,8.6,2.3,.68,.82,'#F06EAA')+rbox(8.7,2,9,2.4,.68,.76,'#7C8CFF')]);
  // banco con microscopio
  L.push([1.5+5.4,desk(.6,4.8,2.4,6,.82,'#F4F7F8')+rbox(1.2,5.1,1.5,5.4,.82,.86,'#3A3F46')+rbox(1.3,5.2,1.4,5.3,.86,1.3,'#9AA9B6')+rbox(1.15,5.15,1.6,5.35,1.25,1.35,'#E9EEF2')+monitor(2,4.9,.84,.5,.32,'y','#8FD0A8')]);
  // scaffale contenitori sterili
  L.push([1.2+1.2,shelfRack(.3,.3,2.6,.7,1.8,3,['#E9EEF2','#DCE6EA','#BFE2EE','#F4F7F8'])]);
  // tecnici in tuta
  L.push([4.3+5.3,fig(4.3,5.3,{suit:1,skin:'#E8C3A0',s:2.1,dir:-1,arm:'-2.6 3'})]);
  L.push([6.5+3.2,fig(6.5,3.2,{suit:1,skin:'#9C6B4A',s:2.1,arm:'-2.6 3'})]);
  L.push([1.9+6.6,fig(1.9,6.6,{suit:1,skin:'#F0D3B8',s:2.1,dir:-1})]);
  // doccia d'aria / ingresso sulla parete destra frontale
  L.push([9.2+6.5,rbox(8.6,5.8,9.8,7.4,0,2.2,'#E8EEF1')+poly(gp([[8.6,7.4,.1],[9.6,7.4,.1],[9.6,7.4,2],[8.6,7.4,2]]),'fill="#BFE2EE" opacity=".8"')+poly(gp([[8.62,6.2,1.9],[8.62,7,1.9],[8.62,7,2.08],[8.62,6.2,2.08]]),'fill="#3FA86B"')]);
  s+=depth(L)+frontCut(W,D,{wallR:'#F4F7F8',cap:'#4E6470'});
  s+=sfTop().replace('FASE A','FASE D')+roomTitle('Camera bianca','EDIFICIO DI COSTRUZIONE · FASE D');
  s+=sidePanel(944,96,320,'Integrazione 65%',[['Struttura e cablaggio','fatto',1,'#3FA86B'],['Batteria e computer','fatto',1,'#3FA86B'],['Radio e assetto','in corso',.55],['Payload e pannelli','in attesa',.0]]);
  s+=actionBar([['VELOCITÀ ×10',160],['AL LABORATORIO PROVE',230,1]]);
  return s; }

// ===================== 3. LABORATORIO PROVE (fase D) =====================
function iTest(){ C={ox:535,oy:205,tw:88,th:44,tz:42}; RID=0; const W=11,D=8,H=3.4; let s=BG+HUDDEF;
  s+=roomShell(W,D,H,{floor:'#C9CDCF',tile:1,tileC:'#BEC3C6',wallR:'#ECEBE5',wallL:'#E0DFD7',stripe:[1.2,SF.orange],cap:'#46525A'});
  // baie numerate a terra
  const bays=[[.5,4.6],[3.5,4.6],[6.5,4.6],[.5,1.2],[3.5,1.2],[6.5,1.2]];
  bays.forEach((b,i)=>{ s+=poly(gp([[b[0],b[1]],[b[0]+2.6,b[1]],[b[0]+2.6,b[1]+2.8],[b[0],b[1]+2.8]]),'fill="none" stroke="#F2C14E" stroke-width="3" stroke-dasharray="10 6"'); const g=P(b[0]+.35,b[1]+.35); s+='<ellipse cx="'+f1(g[0])+'" cy="'+f1(g[1])+'" rx="13" ry="7" fill="#2E4A5E"/><text x="'+f1(g[0])+'" y="'+f1(g[1]+4)+'" text-anchor="middle" font-family="'+FD+'" font-weight="800" font-size="11" fill="#fff">'+(i+1)+'</text>'; });
  // camera anecoica (piramidi blu) sulla parete y0, a destra
  s+=wallG('y0',9.2,11,.1,2.4,180,230,'<rect width="180" height="230" fill="#2E4FA0"/>'+[...Array(48)].map((_,i)=>{ const x=(i%6)*30, y=Math.floor(i/6)*29; return '<path d="M'+x+' '+(y+29)+'l15 -29l15 29z" fill="'+(i%2?'#3E64BF':'#2A4794')+'"/>'; }).join(''));
  s+=wallG('x0',2.4,6.4,1.6,2.9,400,130,hudScreen(400,130,'chart',5));
  const L=[];
  // 1. tavola vibrante con satellite
  { const x=.5,y=4.6; L.push([x+y+2.6,hazard(x+.2,y+.2,x+2.4,y+2.6)+rbox(x+.5,y+.6,x+2.1,y+2.2,0,.55,'#3F6FB0')+rbox(x+.7,y+.8,x+1.9,y+2,.55,.62,'#C9D3DD')+cubesat(x+1.12,y+1.22,.62,1)+cable([x+1.9,y+1.8,.4],[x+2.6,y+2.9,0],'#2A2A28')]); }
  // 2. camera termovuoto (cilindro orizzontale simulato con prisma+anelli)
  { const x=3.5,y=4.6; let t=rbox(x+.2,y+.5,x+2.4,y+2.3,0,.25,'#9AA2A8'); t+=prism(circ(x+1.3,y+1.4,.95,24),.25,2.1,'#DCE3E8',{bands:[{z0:.6,z1:.68,c:'#B9C3CB'},{z0:1.2,z1:1.28,c:'#B9C3CB'},{z0:1.75,z1:1.83,c:'#B9C3CB'}]}); t+=cyl(x+1.3,y+1.4,.95,2.1,2.25,'#E9EEF2',true);
    const g=P(x+1.3,y+2.35,1.15); t+='<ellipse cx="'+f1(g[0])+'" cy="'+f1(g[1])+'" rx="26" ry="30" fill="#5E7180"/><ellipse cx="'+f1(g[0])+'" cy="'+f1(g[1])+'" rx="18" ry="22" fill="#8FC2D6"/><circle cx="'+f1(g[0]-5)+'" cy="'+f1(g[1]-7)+'" r="4" fill="#fff" opacity=".5"/>'; t+=cable([x+.2,y+1.4,.6],[x-.1,y+2.6,0],'#5E7180'); L.push([x+y+2.6,t]); }
  // 3. baia libera: icona "+"
  { const g=P(7.8,6); L.push([6.5+4.6+2,'<g transform="translate('+f1(g[0])+' '+f1(g[1])+')"><circle r="22" fill="#FAFAF6" opacity=".95"/><path d="M-8 0h16M0-8v16" stroke="'+SF.teal+'" stroke-width="3.4" stroke-linecap="round"/></g>']); }
  // 4. EMC: antenna a tromba davanti alla parete anecoica
  { const x=6.5,y=1.2; L.push([x+y+2,rbox(x+1.6,y+.4,x+2.2,y+1,0,.9,'#E9EEF2')+rbox(x+1.7,y+.5,x+2.1,y+.9,.9,1.4,'#F2C14E')+cubesat(x+.6,y+1.4,.0,.9)]); }
  // 5,6 baie bloccate
  [[.5,1.2],[3.5,1.2]].forEach(b=>{ const g=P(b[0]+1.3,b[1]+1.4); L.push([b[0]+b[1]+2,'<g transform="translate('+f1(g[0])+' '+f1(g[1])+')" opacity=".75"><circle r="20" fill="#9A9A90"/><rect x="-7" y="-2" width="14" height="10" rx="2" fill="#fff"/><path d="M-4.5-2v-4a4.5 4.5 0 0 1 9 0v4" fill="none" stroke="#fff" stroke-width="2.4"/></g>']); });
  // console di controllo prove
  L.push([9.6+5.6,desk(8.9,4.6,10.6,6.6,.8,'#F2F1EC')+monitor(9.1,5.1,.82,.7,.45,'x','#6FB7D6')+monitor(9.1,6,.82,.7,.45,'x','#F28B50')]);
  L.push([10.2+5.4,fig(10.2,5.4,{top:'#F7F8F6',coat:1,hair:'#8A8A8A',skin:'#E8C3A0',s:2,dir:-1,headset:1})]);
  L.push([2.6+7.4,fig(2.6,7.4,{top:'#2E4A5E',vest:'#EB7D44',helmet:'#F2C14E',skin:'#6E4630',hair:'#1C1714',s:2,walk:1})]);
  L.push([5.8+7.2,fig(5.8,7.2,{top:'#F7F8F6',coat:1,hair:'#B98A4E',skin:'#F0D3B8',s:2,dir:-1})]);
  s+=depth(L)+frontCut(W,D,{wallR:'#ECEBE5',cap:'#46525A'});
  s+=sfTop().replace('FASE A','FASE D')+roomTitle('Laboratorio prove','EDIFICIO DI TESTING · FASE D');
  s+=sidePanel(944,96,320,'Campagna di prove',[['Vibrazione','superata',1,'#3FA86B'],['Termovuoto','in corso · 42 s',.6,SF.teal],['EMC','da fare',0],['Shock','baia bloccata · liv. 3',0,'#9A9A90']]);
  s+=actionBar([['INSTALLA MACCHINARIO',230],['REVISIONE FRR',180,1]]);
  return s; }

// ===================== 4. SALA DI CONTROLLO (fase E) =====================
function iMcc(){ C={ox:560,oy:215,tw:84,th:42,tz:40}; RID=0; const W=12,D=9,H=3.6; let s=BG+HUDDEF;
  s+=roomShell(W,D,H,{floor:'#8E959B',base:'#C9CCC8',wallR:'#C5CAD0',wallL:'#B6BCC3',skirt:'#7D858D',cap:'#2A323A',capSide:'#A9AFB5',
    floorFx:[...Array(160)].map((_,i)=>{ const p=P(((i*37)%120)/10,((i*53)%90)/10); return '<circle cx="'+f1(p[0])+'" cy="'+f1(p[1])+'" r="1" fill="#7E858B"/>'; }).join('')});
  // fascia scura superiore della parete (come ESOC) + faretti
  s+=poly([P(0,0,2.9),P(W,0,2.9),P(W,0,H),P(0,0,H)],'fill="#2E363E"')+poly([P(0,0,2.9),P(0,D,2.9),P(0,D,H),P(0,0,H)],'fill="#262D34"');
  for(let i=0;i<14;i++){ const p=P(.4+i*.85,0,3.3); s+='<circle cx="'+f1(p[0])+'" cy="'+f1(p[1])+'" r="2.4" fill="#FFF3D6"/>'; } for(let i=0;i<10;i++){ const p=P(0,.4+i*.85,3.3); s+='<circle cx="'+f1(p[0])+'" cy="'+f1(p[1])+'" r="2.4" fill="#FFF3D6"/>'; }
  // videowall (parete y0) e schermi (parete x0)
  const vw=[[.5,2.4,'sat'],[2.6,5.8,'globe'],[6,7.6,'clock'],[7.8,11.6,'chart']];
  vw.forEach((v,i)=>{ const w=(v[1]-v[0])*100, h=v[2]==='clock'?70:130; s+=wallG('y0',v[0],v[1],v[2]==='clock'?1.95:1.3,2.75,w,h,hudScreen(w,h,v[2],i)); });
  s+=wallG('y0',6,7.6,1.3,1.85,160,55,'<rect width="160" height="55" fill="#120D0D"/><text x="80" y="38" text-anchor="middle" font-family="DejaVu Sans Mono, monospace" font-weight="700" font-size="26" fill="#FF3B2F">AOS 00:12</text>');
  s+=wallG('x0',.6,4.2,1.2,2.75,360,155,hudScreen(360,155,'grid'))+wallG('x0',4.5,7.4,1.3,2.6,290,130,hudScreen(290,130,'gauges'))+wallG('x0',7.7,8.7,1.5,2.3,100,80,hudScreen(100,80,'bars'));
  // logo agenzia sulla parete
  { const g=P(.2,0,2.6); }
  // bagliore azzurro sul pavimento
  { const g=P(6,1.4); s+='<ellipse cx="'+f1(g[0])+'" cy="'+f1(g[1])+'" rx="300" ry="70" fill="#43D3E0" opacity=".14" filter="url(#glw)"/>'; }
  // console curve: archi concentrici con centro davanti (verso lo spettatore)
  const L=[], cx=6.2, cy=13.5, rows=[[8.6,-.62,.62],[10.4,-.5,.5],[12.2,-.42,.42]];
  rows.forEach((row,ri)=>{ const [r,a0,a1]=row, n=Math.round((a1-a0)*r/0.62); for(let k=0;k<n;k++){ const t0=a0+(a1-a0)*k/n, t1=a0+(a1-a0)*(k+1)/n, tm=(t0+t1)/2;
      const pt=(rr,t)=>[cx+rr*Math.sin(t), cy-rr*Math.cos(t)];
      const dIn=pt(r-.0,t0), dIn2=pt(r,t1), dOut=pt(r+.7,t1), dOut2=pt(r+.7,t0); const mid=pt(r+.35,tm);
      if(mid[1]<.4||mid[0]<.4||mid[0]>W-.4) continue;
      let seg=poly(gp([[dIn[0],dIn[1],.78],[dIn2[0],dIn2[1],.78],[dOut[0],dOut[1],.78],[dOut2[0],dOut2[1],.78]]),'fill="#F3F3EF" stroke="#DCDCD6" stroke-width="1"');
      seg+=rface(gp([[dIn[0],dIn[1],0],[dIn2[0],dIn2[1],0],[dIn2[0],dIn2[1],.78],[dIn[0],dIn[1],.78]]),'#E6E6E0',.5);
      // monitor sul bordo esterno, rivolti verso il centro (verso chi guarda)
      const m=pt(r+.55,tm), ta=pt(r+.55,tm-.024), tb=pt(r+.55,tm+.024);
      const q=gp([[ta[0],ta[1],.8],[tb[0],tb[1],.8],[tb[0],tb[1],1.25],[ta[0],ta[1],1.25]]); const inner=q.map(p=>lerp(p,lerp(lerp(q[0],q[1],.5),lerp(q[3],q[2],.5),.5),.12));
      seg+=poly(q,'fill="#23282E"')+poly(inner,'fill="'+['#6FB7D6','#8FD0A8','#5FA8C8','#D7E6EE','#F2B06B'][(k+ri)%5]+'"');
      L.push([mid[0]+mid[1]+.3,seg]);
      if((k+ri)%2===0){ const p=pt(r-.55,tm); L.push([p[0]+p[1],seated(p[0],p[1],{s:2.05,top:['#5E6F8A','#E8E6DF','#7A3E58','#3F6FB0','#4F6B48'][(k*3+ri)%5],skin:['#E8C3A0','#C99673','#9C6B4A','#F0D3B8'][(k+ri)%4],hair:['#2E241E','#6B4A30','#1C1714','#B98A4E','#8A8A8A'][(k*2+ri)%5],headset:1})]); } } });
  // direttore di volo in piedi
  L.push([9.6+7.4,fig(9.6,7.4,{top:'#E8E6DF',hair:'#1C1714',skin:'#6E4630',pant:'#2F3640',s:2.1,headset:1,dir:-1,arm:'-2.4 3'})]);
  L.push([11.4+8.4,plant(11.4,8.4)]);
  s+=depth(L)+frontCut(W,D,{wallR:'#C5CAD0',cap:'#2A323A',cut:.3});
  s+=sfTop().replace('FASE A','FASE E')+roomTitle('Mission Control Center','SALA DI CONTROLLO · FASE E');
  s+=sidePanel(944,96,320,'AURASAT · mese 7 di 12',[['Scienza raccolta','128',.58],['Batteria','72%',.72,'#3FA86B'],['ΔV residuo','nessuna manovra',1,'#9A9A90'],['Contatti','+20% stazione',.8]]);
  s+=sfAlert(168,'Tempesta solare tra 2 mesi',SF.orange);
  s+=actionBar([['TELEMETRIA',160],['DECISIONI',150],['PASSA IN SAFE MODE',220,1]]);
  return s; }
// ===================== INTERNI GRANDI, tutti della stessa dimensione (18 × 14 × 3,6) =====================
const RW=18, RD=14, RH=3.6, FS=1.32, SS=1.38;
function bigCam(){ C={ox:590,oy:182,tw:58,th:29,tz:28}; RID=0; }
function glassWall(a,b,h,col){ const q=gp([[a[0],a[1],0],[b[0],b[1],0],[b[0],b[1],h],[a[0],a[1],h]]); return poly(q,'fill="'+(col||'#BFE2EE')+'" opacity=".35" stroke="#9FC3CC" stroke-width="1.5"')+'<line x1="'+f1(q[3][0])+'" y1="'+f1(q[3][1])+'" x2="'+f1(q[2][0])+'" y2="'+f1(q[2][1])+'" stroke="#8FB0BA" stroke-width="2.5"/>'; }
function rollDoor(x0,x1,h,col){ let s=poly(gp([[x0,0,0],[x1,0,0],[x1,0,h],[x0,0,h]]),'fill="'+(col||'#C9C9C2')+'"'); for(let z=.2;z<h;z+=.2){ const a=P(x0,0,z),b=P(x1,0,z); s+='<line x1="'+f1(a[0])+'" y1="'+f1(a[1])+'" x2="'+f1(b[0])+'" y2="'+f1(b[1])+'" stroke="#AFAFA8" stroke-width="1"/>'; } const c=gp([[x0,0,h],[x1,0,h],[x1,0,h+.25],[x0,0,h+.25]]); return s+poly(c,'fill="#9AA2A8"')+hazardWall(x0,x1); }
function hazardWall(x0,x1){ let s=''; const n=Math.round((x1-x0)/.3); for(let i=0;i<n;i++){ const a=x0+i*(x1-x0)/n,b=a+(x1-x0)/n; s+=poly(gp([[a,0,0],[b,0,0],[b,0,.18],[a,0,.18]]),'fill="'+(i%2?'#2A2A28':'#F2C14E')+'"'); } return s; }
function forklift(x,y){ return rbox(x,y,x+.9,y+.6,.1,.55,'#F2C14E')+rbox(x+.1,y+.05,x+.6,y+.55,.55,1.1,'#2A3440')+rbox(x+.15,y+.1,x+.55,y+.5,1.1,1.14,'#F2C14E')+rbox(x+.9,y+.05,x+.98,y+.55,.05,1.3,'#5D6B78')+rbox(x+.98,y+.1,x+1.5,y+.2,.06,.1,'#5D6B78')+rbox(x+.98,y+.4,x+1.5,y+.5,.06,.1,'#5D6B78'); }
function tag(x,y,z,t,col){ const g=P(x,y,z); const w=t.length*7.4+20; return '<g filter="url(#ds)"><rect x="'+f1(g[0]-w/2)+'" y="'+f1(g[1]-22)+'" width="'+w+'" height="20" rx="10" fill="rgba(250,250,246,.95)"/></g><circle cx="'+f1(g[0]-w/2+10)+'" cy="'+f1(g[1]-12)+'" r="4" fill="'+(col||SF.teal)+'"/><text x="'+f1(g[0]-w/2+18)+'" y="'+f1(g[1]-8)+'" font-family="'+FT+'" font-weight="700" font-size="12" fill="'+SF.dark+'">'+t+'</text>'; }
function lockBay(x,y){ const g=P(x,y); return '<g transform="translate('+f1(g[0])+' '+f1(g[1])+')" opacity=".8"><circle r="15" fill="#9A9A90"/><rect x="-5.5" y="-1.5" width="11" height="8" rx="2" fill="#fff"/><path d="M-3.5-1.5v-3a3.5 3.5 0 0 1 7 0v3" fill="none" stroke="#fff" stroke-width="2"/></g>'; }
function plusBay(x,y){ const g=P(x,y); return '<g transform="translate('+f1(g[0])+' '+f1(g[1])+')"><circle r="17" fill="#FAFAF6" opacity=".95"/><path d="M-7 0h14M0-7v14" stroke="'+SF.teal+'" stroke-width="3" stroke-linecap="round"/></g>'; }

// ---------- OFFICINA ----------
function jBuild(){ bigCam(); const W=RW,D=RD,H=RH; let s=BG+HUDDEF;
  s+=roomShell(W,D,H,{floor:'#B9BEC0',tile:1,tileC:'#AEB3B5',wallR:'#ECEBE5',wallL:'#E0DFD7',stripe:[1.2,SF.teal],cap:'#46525A',
    floorFx:poly(gp([[.5,6.6],[W-.5,6.6],[W-.5,6.85],[.5,6.85]]),'fill="#F2C14E"')+poly(gp([[11.4,.5],[11.65,.5],[11.65,D-.5],[11.4,D-.5]]),'fill="#F2C14E"')+poly(gp([[12.2,7.6],[17.2,7.6],[17.2,13.2],[12.2,13.2]]),'fill="#A9AFB2"')});
  s+=winGrid(.5,0,8.5,0,1.7,3.3,1,10,{ribbon:1,sill:.05,wh:.85})+rollDoor(12.4,16.6,2.6);
  s+=wallG('x0',.6,3.2,1.2,2.6,260,140,'<rect width="260" height="140" fill="#3F6FB0" rx="6"/>'+[...Array(48)].map((_,i)=>'<circle cx="'+(12+(i%12)*21)+'" cy="'+(12+Math.floor(i/12)*18)+'" r="2" fill="#2E5490"/>').join('')+'<path d="M20 80v44M44 82l8 40M70 80h24v7h-24zM120 80v42M116 80h8M150 82q12 12 0 40M190 80l16 40M230 80v40" stroke="#E9EEF2" stroke-width="5" stroke-linecap="round" fill="none"/>');
  s+=wallG('x0',4,9,1.5,3.1,500,160,hudScreen(500,160,'chart',2))+wallG('x0',9.6,13,1.5,3.1,340,160,hudScreen(340,160,'sat'));

  const L=[], cols=['#F28B50','#7C8CFF','#B783E3','#F06EAA','#F0B43A','#4DB8E8','#6CC4A1','#DDE2E6'];
  [0,1,2].forEach(i=>L.push([.4+i*3.6+1.5,shelfRack(.4+i*3.6,.3,3.2,.9,2.6,3,cols.slice(i*2).concat(cols.slice(0,i*2)))]));
  [0,1].forEach(i=>L.push([.3+1.5+i*3.4+2,shelfRack(.3,1.6+i*3.4,.9,3,2.6,3,cols.slice(3+i).concat(cols.slice(0,3+i)),1)]));
  // banchi di lavoro: una missione per banco
  const bench=(x,y,size,lab,col)=>{ L.push([x+y+2,desk(x,y,x+2.6,y+1.8,.82,'#E9EEF2')+rbox(x+.1,y+.1,x+2.5,y+1.7,.82,.84,'#5FA87A')+cubesat(x+.9,y+.6,.84,size,{wings:1})+rbox(x+.3,y+1.1,x+.7,y+1.4,.84,.9,'#F06EAA')+rbox(x+2,y+.3,x+2.3,y+.6,.84,.92,'#7C8CFF')]); L.push([x+y+2.05,tag(x+1.3,y+.9,2.4,lab,col)]); };
  bench(4.4,3,1,'AURASAT · 3U',SF.teal); bench(7.6,3,1.25,'SELENE-1 · 6U',SF.orange); bench(4.4,8,1,'banco libero','#9A9A90');
  // fila CAD
  [0,1,2].forEach(i=>{ const x=.9, y=7.6+i*1.9; L.push([x+y+1,desk(x,y,x+1.4,y+1.4,.78,'#F2F1EC')+monitor(x+1.3,y+.45,.8,.55,.36,'x','#6FB7D6')+monitor(x+1.3,y+1,.8,.55,.36,'x','#8FD0A8')]); L.push([x+y+1.5,fig(x+.5,y+.7,{top:['#3F6FB0','#7A3E58','#4F6B48'][i],hair:['#6B4A30','#1C1714','#B98A4E'][i],skin:['#E8C3A0','#9C6B4A','#F0D3B8'][i],dir:1,s:FS})]); });
  // stampanti 3D, muletto, carrelli
  [0,1].forEach(i=>L.push([9.4+i*1.3+11.6,rbox(9+i*1.3,11.1,10+i*1.3,12,0,1.1,'#E9EEF2')+rbox(9.1+i*1.3,11.2,9.9+i*1.3,11.9,.3,.95,'#BFE2EE')+rbox(9.3+i*1.3,11.4,9.7+i*1.3,11.7,.3,.48,['#F28B50','#4DB8E8'][i])]));
  L.push([13+9,forklift(12.8,8.6)+rbox(14.6,8.5,15.8,9.6,0,.12,'#B98A5E')+rbox(14.7,8.6,15.7,9.5,.12,.6,'#DDE2E6')]);
  L.push([15+11.5,rbox(14.4,11,15.8,12.2,0,.12,'#B98A5E')+rbox(14.5,11.1,15.1,11.7,.12,.6,'#F0B43A')+rbox(15.1,11.2,15.7,12.1,.12,.5,'#7C8CFF')]);
  L.push([7.2+11.5,rbox(6.6,11,7.8,11.8,.5,.56,'#9AA2A8')+rbox(6.65,11.05,6.75,11.15,0,.5,'#9AA2A8')+rbox(7.65,11.65,7.75,11.75,0,.5,'#9AA2A8')+rbox(6.8,11.1,7.2,11.5,.56,.8,'#B783E3')+rbox(7.2,11.2,7.6,11.6,.56,.7,'#F0B43A')]);
  // persone
  [[5.7,5.4,{top:'#F7F8F6',coat:1,hair:'#2E241E',skin:'#9C6B4A',arm:'-2 4'}],[9.2,5.3,{top:'#2E4A5E',vest:'#EB7D44',helmet:'#F2C14E',hair:'#B98A4E',skin:'#F0D3B8',dir:-1,arm:'-2 4'}],[10.5,7.3,{top:'#4F6B48',vest:'#EB7D44',helmet:'#F2C14E',hair:'#1C1714',skin:'#C99673',walk:1}],[13.6,10.4,{top:'#2E4A5E',vest:'#EB7D44',helmet:'#F2C14E',skin:'#6E4630',walk:1,dir:-1}],[3.3,2.6,{top:'#C7643E',hair:'#6B4A30',skin:'#E8C3A0',walk:1}],[16.4,6,{top:'#F7F8F6',coat:1,hair:'#8A8A8A',skin:'#E8C3A0',dir:-1}]].forEach(p=>L.push([p[0]+p[1],fig(p[0],p[1],Object.assign({s:FS},p[2]))]));
  [[.6,13.3],[17.3,.7]].forEach(p=>L.push([p[0]+p[1],plant(p[0],p[1])]));
  s+=depth(L)+frontCut(W,D,{wallR:'#ECEBE5',cap:'#46525A'});
  s+=sfTop().replace('FASE A','FASE C')+roomTitle('Officina di costruzione','EDIFICIO DI COSTRUZIONE · FASE C');
  s+=sidePanel(944,96,320,'AURASAT · bilanci',[['Massa','2,5 / 6 kg',.42,'#3FA86B'],['Potenza','7,4 / 15 W',.49,'#3FA86B'],['Costo','152 / 315 cr',.48,'#E8AA30']]);
  s+=actionBar([['MAGAZZINO PEZZI',190],['PROGETTO 3D',160],['REVISIONE CDR',180,1]]);
  return s; }

// ---------- CAMERA BIANCA ----------
function jClean(){ bigCam(); const W=RW,D=RD,H=RH; let s=BG+HUDDEF;
  s+=roomShell(W,D,H,{floor:'#F3F5F6',tile:.7,tileC:'#E3E8EB',wallR:'#F4F7F8',wallL:'#E8EEF1',skirt:'#BFD6DE',stripe:[3.1,'#7FB6C8'],cap:'#4E6470',
    floorFx:poly(gp([[3,2.2],[8.2,2.2],[8.2,7],[3,7]]),'fill="#9CC9A3" opacity=".55"')+hazard(2.8,2,8.4,7.2)+poly(gp([[10.2,2.2],[15.4,2.2],[15.4,7],[10.2,7]]),'fill="#9CC9A3" opacity=".55"')+hazard(10,2,15.6,7.2)});
  for(let i=0;i<10;i++) s+=poly([P(.5+i*1.75,0,2.5),P(1.95+i*1.75,0,2.5),P(1.95+i*1.75,0,3.05),P(.5+i*1.75,0,3.05)],'fill="#FFFFFF" stroke="#CBD8DE" stroke-width="1.2"');
  for(let i=0;i<7;i++) s+=poly([P(0,.5+i*1.9,2.5),P(0,1.95+i*1.9,2.5),P(0,1.95+i*1.9,3.05),P(0,.5+i*1.9,3.05)],'fill="#FFFFFF" stroke="#CBD8DE" stroke-width="1.2"');
  s+=winGrid(11,0,17.4,0,.9,2.3,1,7,{ribbon:1,sill:.05,wh:.9});
  s+=wallG('y0',.8,2.8,1,1.9,170,80,'<rect width="170" height="80" rx="6" fill="#2F8580"/><text x="85" y="36" text-anchor="middle" font-family="'+FD+'" font-weight="800" font-size="26" fill="#fff">ISO 8</text><text x="85" y="62" text-anchor="middle" font-family="'+FT+'" font-weight="600" font-size="13" fill="#D7F2EF">camera bianca</text>');
  const L=[];
  const station=(x,y,size,lab,col,n)=>{ L.push([x+y,cyl(x,y,1.1,0,.12,'#C9D3DD')+cyl(x,y,.25,.12,1,'#9AA9B6')+rbox(x-.6,y-.6,x+.6,y+.6,1,1.07,'#D9E0E5')+cubesat(x-.2*size,y-.2*size,1.07,size,{wings:1,n})]); L.push([x+y+.05,tag(x,y,1.07+size*1.2+.9,lab,col)]); };
  station(5.6,4.6,1.5,'AURASAT · 3U',SF.teal,4); station(12.8,4.6,1.9,'SELENE-1 · 6U',SF.orange,2);
  // spogliatoio vetrato (airlock) davanti a sinistra
  L.push([1.5+11,rbox(.3,10.4,3.6,13.6,0,.04,'#DCE6EA')+glassWall([3.6,10.4],[3.6,13.6],2.4)+glassWall([.3,10.4],[3.6,10.4],2.4)+rbox(.5,11,1.3,12.8,0,.5,'#E9EEF2')+rbox(2.2,12.6,3.3,13.4,0,1.9,'#BFE2EE')]);
  L.push([2.2+12.1,tag(2,12,2.6,'Vestizione',SF.teal)]);
  // banchi, carrelli, scaffali sterili
  L.push([1.4+1.4,shelfRack(.4,.3,3.6,.8,2.2,3,['#E9EEF2','#DCE6EA','#BFE2EE','#F4F7F8'])]);
  L.push([1.4+5.5,desk(.5,4.8,2.4,6.4,.82,'#F4F7F8')+rbox(1.1,5.2,1.4,5.5,.82,.86,'#3A3F46')+rbox(1.2,5.3,1.3,5.4,.86,1.3,'#9AA9B6')+monitor(2.3,5.6,.84,.6,.36,'x','#8FD0A8')]);
  [[8.9,2],[16.4,2],[9,8.4]].forEach((c,i)=>L.push([c[0]+c[1]+.6,rbox(c[0],c[1],c[0]+1.2,c[1]+.8,.6,.66,'#F4F7F8')+rbox(c[0]+.05,c[1]+.05,c[0]+.15,c[1]+.15,0,.6,'#9AA9B6')+rbox(c[0]+1.05,c[1]+.65,c[0]+1.15,c[1]+.75,0,.6,'#9AA9B6')+rbox(c[0]+.1,c[1]+.1,c[0]+1.1,c[1]+.7,.66,.68,'#6FB18A')+rbox(c[0]+.3,c[1]+.2,c[0]+.6,c[1]+.5,.68,.82,['#F06EAA','#7C8CFF','#F0B43A'][i])]));
  L.push([16+12,rbox(14.8,11,17.4,13.4,0,2.4,'#E8EEF1')+poly(gp([[14.8,13.4,.1],[16.6,13.4,.1],[16.6,13.4,2.2],[14.8,13.4,2.2]]),'fill="#BFE2EE" opacity=".8"')+poly(gp([[14.82,11.6,2.1],[14.82,12.6,2.1],[14.82,12.6,2.3],[14.82,11.6,2.3]]),'fill="#3FA86B"')]);
  L.push([16.1+12.2,tag(16.1,12.2,2.9,'Doccia d’aria',SF.teal)]);
  [[4.4,6.3,'#E8C3A0',-1],[6.9,3.2,'#9C6B4A',1],[11.6,6.4,'#F0D3B8',-1],[14.1,3.3,'#6E4630',1],[13.9,6.5,'#E8C3A0',-1],[2,8,'#F0D3B8',1],[8.8,9.8,'#C99673',1]].forEach(p=>L.push([p[0]+p[1],fig(p[0],p[1],{suit:1,skin:p[2],s:FS,dir:p[3],arm:'-2.6 3'})]));
  s+=depth(L)+frontCut(W,D,{wallR:'#F4F7F8',cap:'#4E6470'});
  s+=sfTop().replace('FASE A','FASE D')+roomTitle('Camera bianca','EDIFICIO DI COSTRUZIONE · FASE D');
  s+=sidePanel(944,96,320,'Integrazione',[['AURASAT','65%',.65],['SELENE-1','30%',.3,SF.orange]]);
  s+=actionBar([['VELOCITÀ ×10',160],['AL LABORATORIO PROVE',230,1]]);
  return s; }

// ---------- LABORATORIO PROVE: 12 baie ----------
function jTest(){ bigCam(); const W=RW,D=RD,H=RH; let s=BG+HUDDEF;
  s+=roomShell(W,D,H,{floor:'#C9CDCF',tile:1,tileC:'#BEC3C6',wallR:'#ECEBE5',wallL:'#E0DFD7',stripe:[1.3,SF.orange],cap:'#46525A'});
  s+=rollDoor(.8,4.6,2.8)+winGrid(5.4,0,17.4,0,2.2,3.3,1,12,{ribbon:1,sill:.05,wh:.75});
  s+=wallG('x0',1,6,1.5,3.2,500,170,hudScreen(500,170,'chart',5))+wallG('x0',6.6,10,1.5,3.2,340,170,hudScreen(340,170,'gauges'));

  // macchinari posizionati liberamente dal giocatore (massimo 9): ognuno ha la sua impronta
  const L=[], M=[];
  const machine=(k,x,y,lab,col)=>{ M.push([k,x,y]); const d={vib:[2.8,2.8],tvac:[3,3],emc:[3.2,3.2],mass:[2,2]}[k]; let g='';
    if(k==='vib') g=hazard(x+.1,y+.1,x+2.7,y+2.7)+rbox(x+.5,y+.5,x+2.3,y+2.3,0,.6,'#3F6FB0')+rbox(x+.7,y+.7,x+2.1,y+2.1,.6,.67,'#C9D3DD')+cubesat(x+1.2,y+1.2,.67,1)+cable([x+2.3,y+2.1,.4],[x+2.9,y+3,0]);
    if(k==='tvac') g=rbox(x+.2,y+.3,x+2.8,y+2.7,0,.25,'#9AA2A8')+prism(circ(x+1.5,y+1.5,1.05,24),.25,2.3,'#DCE3E8',{bands:[{z0:.7,z1:.78,c:'#B9C3CB'},{z0:1.4,z1:1.48,c:'#B9C3CB'}]})+cyl(x+1.5,y+1.5,1.05,2.3,2.45,'#E9EEF2',true)+(()=>{ const q=P(x+1.5,y+2.55,1.25); return '<ellipse cx="'+f1(q[0])+'" cy="'+f1(q[1])+'" rx="18" ry="21" fill="#5E7180"/><ellipse cx="'+f1(q[0])+'" cy="'+f1(q[1])+'" rx="12" ry="15" fill="#8FC2D6"/>'; })();
    if(k==='emc') g=rbox(x,y,x+3.2,y+.2,0,2.4,'#2E4FA0')+rbox(x,y+.2,x+.2,y+3.2,0,2.4,'#2A4794')+rbox(x+.2,y+.2,x+3.2,y+3.2,0,.05,'#3E64BF')+rbox(x+2,y+.6,x+2.5,y+1.1,0,.9,'#E9EEF2')+rbox(x+2.1,y+.7,x+2.4,y+1,.9,1.3,'#F2C14E')+cubesat(x+.8,y+1.6,0,.9);
    if(k==='mass') g=cyl(x+1,y+1,.8,0,.7,'#C9CED2')+cyl(x+1,y+1,.6,.7,.78,'#E9EEF2')+cubesat(x+.8,y+.8,.78,1);
    L.push([x+y+d[0],g]); L.push([x+y+d[0]+.1,tag(x+d[0]/2,y+d[1]/2,k==='tvac'?3.4:k==='emc'?3.1:2.5,lab,col)]); };
  machine('vib',2,2,'Vibrazione · superata','#3FA86B'); machine('tvac',7.4,1.4,'Termovuoto · 42 s',SF.teal); machine('emc',12.6,1.2,'EMC · da fare','#9A9A90'); machine('mass',3,8.6,'Massa · libera',SF.teal);
  // fantasma di un nuovo macchinario in posizionamento (come nel campus)
  { const x=8.4,y=7.6; L.push([x+y+2.5,'<g opacity=".7">'+rbox(x+.4,y+.4,x+2.4,y+2.4,0,1.6,'#D9DEE5')+rbox(x+.6,y+.6,x+2.2,y+2.2,1.6,1.7,'#E07A45')+'</g>'+poly(gp([[x,y],[x+2.8,y],[x+2.8,y+2.8],[x,y+2.8]]),'fill="rgba(69,169,163,.18)" stroke="'+SF.teal+'" stroke-width="2.2" stroke-dasharray="8 5"')]); }
  // console prove sul lato
  L.push([16.6+6,desk(15.8,5.4,17.4,8.4,.8,'#F2F1EC')+monitor(16,6,.82,.7,.45,'x','#6FB7D6')+monitor(16,7,.82,.7,.45,'x','#F28B50')+monitor(16,7.9,.82,.5,.4,'x','#8FD0A8')]);
  [[17,6.6,{top:'#F7F8F6',coat:1,hair:'#8A8A8A',skin:'#E8C3A0',dir:-1,headset:1}],[17,7.6,{top:'#3F6FB0',hair:'#1C1714',skin:'#9C6B4A',dir:-1,headset:1}],[4.6,4.5,{top:'#2E4A5E',vest:'#EB7D44',helmet:'#F2C14E',skin:'#6E4630',walk:1}],[7.6,4.9,{top:'#F7F8F6',coat:1,hair:'#B98A4E',skin:'#F0D3B8',dir:-1}],[12.2,5,{top:'#4F6B48',vest:'#EB7D44',helmet:'#F2C14E',skin:'#C99673',walk:1}]].forEach(p=>L.push([p[0]+p[1],fig(p[0],p[1],Object.assign({s:FS},p[2]))]));
  L.push([14+2,forklift(13.2,.9)]);
  s+=depth(L)+frontCut(W,D,{wallR:'#ECEBE5',cap:'#46525A'});
  s+=sfTop().replace('FASE A','FASE D')+roomTitle('Laboratorio prove','EDIFICIO DI TESTING · FASE D');
  s+=sidePanel(944,96,320,'Macchinari: 4 di 9',[['Vibrazione','superata',1,'#3FA86B'],['Termovuoto','in corso',.6],['EMC','da fare',0,'#9A9A90']]);
  s+='<g filter="url(#ds)"><rect x="330" y="612" width="620" height="100" rx="22" fill="#FAFAF6"/></g><text x="352" y="638" font-family="'+FT+'" font-weight="700" font-size="11" letter-spacing=".12em" fill="'+SF.mid+'">NUOVO MACCHINARIO · TOCCA UN PUNTO LIBERO DEL LABORATORIO</text>'+
    [['Shock','80 cr',1,0],['Acustica','liv. 3',0,1],['Antenne','liv. 3',0,1],['Magnetica','liv. 4',0,1]].map((t,i)=>'<g transform="translate('+(352+i*148)+' 650)"><rect width="136" height="50" rx="14" fill="'+(t[2]?'#EEF8F6':'#F2F1EC')+'" stroke="'+(t[2]?SF.teal:'#E0DED5')+'" stroke-width="2"/><text x="14" y="22" font-family="'+FT+'" font-weight="700" font-size="13" fill="'+(t[3]?'#9A9A90':SF.dark)+'">'+(t[3]?'🔒 ':'')+t[0]+'</text><text x="14" y="40" font-family="'+FT+'" font-size="11.5" fill="'+SF.mid+'">'+t[1]+'</text></g>').join('');
  s+=actionBar([['ANNULLA',140],['REVISIONE FRR',180,1]]);
  return s; }

// ---------- SALA DI CONTROLLO ----------
function jMcc(){ MONO=1; bigCam(); const W=RW,D=RD,H=RH; let s=BG+HUDDEF;
  s+=roomShell(W,D,H,{floor:'#8E959B',base:'#C9CCC8',wallR:'#C5CAD0',wallL:'#B6BCC3',skirt:'#7D858D',cap:'#2A323A',capSide:'#A9AFB5',
    floorFx:[...Array(260)].map((_,i)=>{ const p=P(((i*37)%180)/10,((i*53)%140)/10); return '<circle cx="'+f1(p[0])+'" cy="'+f1(p[1])+'" r=".9" fill="#7E858B"/>'; }).join('')});
  s+=poly([P(0,0,3.3),P(W,0,3.3),P(W,0,H),P(0,0,H)],'fill="#2E363E"')+poly([P(0,0,3.3),P(0,D,3.3),P(0,D,H),P(0,0,H)],'fill="#262D34"');
  for(let i=0;i<22;i++){ const p=P(.4+i*.8,0,3.46); s+='<circle cx="'+f1(p[0])+'" cy="'+f1(p[1])+'" r="2" fill="#FFF3D6"/>'; } for(let i=0;i<17;i++){ const p=P(0,.4+i*.8,3.46); s+='<circle cx="'+f1(p[0])+'" cy="'+f1(p[1])+'" r="2" fill="#FFF3D6"/>'; }
  const vw=[[.6,3.6,'sat'],[3.9,9.4,'globe'],[9.7,12.2,'clock'],[12.5,17.4,'chart']];
  vw.forEach((v,i)=>{ const w=(v[1]-v[0])*100, h=v[2]==='clock'?70:150; s+=wallG('y0',v[0],v[1],v[2]==='clock'?2.35:1.4,3.15,w,h,hudScreen(w,h,v[2],i)); });
  s+=wallG('y0',9.7,12.2,1.4,2.15,250,60,'<rect width="250" height="60" fill="#061420"/><text x="125" y="42" text-anchor="middle" font-family="DejaVu Sans Mono, monospace" font-weight="700" font-size="30" fill="#43D3E0">AOS 00:12</text>');
  s+=wallG('x0',.6,6,1.3,3.15,540,185,hudScreen(540,185,'grid'))+wallG('x0',6.4,10.6,1.4,3.05,420,165,hudScreen(420,165,'gauges'))+wallG('x0',11,13.4,1.6,2.9,240,130,hudScreen(240,130,'bars'));
  { const g=P(9,2); s+='<ellipse cx="'+f1(g[0])+'" cy="'+f1(g[1])+'" rx="360" ry="80" fill="#43D3E0" opacity=".14" filter="url(#glw)"/>'; }
  const L=[], cx=9, cy=20.5, rows=[[12.6,-.5,.5],[14.6,-.46,.46],[16.6,-.42,.42]];
  rows.forEach((row,ri)=>{ const [r,a0,a1]=row, n=Math.round((a1-a0)*r/0.75); for(let k=0;k<n;k++){ const t0=a0+(a1-a0)*k/n, t1=a0+(a1-a0)*(k+1)/n, tm=(t0+t1)/2;
      const pt=(rr,t)=>[cx+rr*Math.sin(t), cy-rr*Math.cos(t)];
      const dIn=pt(r,t0), dIn2=pt(r,t1), dOut=pt(r+.8,t1), dOut2=pt(r+.8,t0), mid=pt(r+.4,tm);
      if(mid[1]<.6||mid[0]<.6||mid[0]>W-.6||mid[1]>D-.6) continue;
      let seg=poly(gp([[dIn[0],dIn[1],.78],[dIn2[0],dIn2[1],.78],[dOut[0],dOut[1],.78],[dOut2[0],dOut2[1],.78]]),'fill="#F3F3EF" stroke="#DCDCD6" stroke-width="1"')+rface(gp([[dIn[0],dIn[1],0],[dIn2[0],dIn2[1],0],[dIn2[0],dIn2[1],.78],[dIn[0],dIn[1],.78]]),'#E6E6E0',.5);
      { const hw=.26/(r+.62), ta=pt(r+.62,tm-hw), tb=pt(r+.62,tm+hw); const q=gp([[ta[0],ta[1],.82],[tb[0],tb[1],.82],[tb[0],tb[1],1.3],[ta[0],ta[1],1.3]]); seg+=poly(q,'fill="'+['#7CC3E0','#F2F6F8','#1B2530'][(k+ri)%3]+'" stroke="#1B2530" stroke-width="1.2" stroke-linejoin="round"'); }
      L.push([mid[0]+mid[1]+.3,seg]);
      if((k+ri)%2===0){ const p=pt(r-.55,tm); L.push([p[0]+p[1],seated(p[0],p[1],{s:SS,top:['#5E6F8A','#E8E6DF','#7A3E58','#3F6FB0','#4F6B48'][(k*3+ri)%5],skin:['#E8C3A0','#C99673','#9C6B4A','#F0D3B8'][(k+ri)%4],hair:['#2E241E','#6B4A30','#1C1714','#B98A4E','#8A8A8A'][(k*2+ri)%5],headset:1})]); } } });
  // sala VIP vetrata in fondo a destra
  L.push([2+12.5,rbox(.4,10.6,3.8,13.6,0,.05,'#9AA2A8')+glassWall([.4,10.6],[3.8,10.6],2.6,'#A9D2EA')+glassWall([3.8,10.6],[3.8,13.6],2.6,'#A9D2EA')+desk(1,11.4,3.2,12.4,.75,'#F2F1EC')]);
  L.push([2.1+12.6,tag(2.1,12,2.9,'Sala ospiti',SF.teal)]);
  L.push([12.4+10.6,fig(12.4,10.6,{top:'#E8E6DF',hair:'#1C1714',skin:'#6E4630',pant:'#2F3640',s:FS,headset:1,dir:-1,arm:'-2.4 3'})]);
  [[2.4,13,'#3F6FB0'],[1.6,13.1,'#C7643E']].forEach(p=>L.push([p[0]+p[1],fig(p[0],p[1],{top:p[2],s:FS,dir:-1})]));
  L.push([17+13,plant(17,13)]);
  s+=depth(L)+frontCut(W,D,{wallR:'#C5CAD0',cap:'#2A323A',cut:.3});
  s+=sfTop().replace('FASE A','FASE E')+roomTitle('Mission Control Center','SALA DI CONTROLLO · FASE E');
  s+=sfAlert(168,'Tempesta solare tra 2 mesi',SF.orange);
  s+='<g filter="url(#ds)">'+chamf(1044,96,220,44,12)+'</g><text x="1154" y="123" text-anchor="middle" font-family="'+FD+'" font-weight="800" font-size="13" letter-spacing=".06em" fill="'+SF.dark+'">⤢ VISTA SCHERMI</text>';
  s+=actionBar([['TELEMETRIA',160],['DECISIONI',150],['PASSA IN SAFE MODE',220,1]]);
  return s; }
// vista ravvicinata della parete video (si apre toccando gli schermi)
function jMccWall(){ MONO=1; let s='<rect width="1280" height="800" fill="#2B333B"/>'+HUDDEF;
  s+='<rect x="0" y="0" width="1280" height="90" fill="#1F262D"/>'+[...Array(20)].map((_,i)=>'<circle cx="'+(40+i*63)+'" cy="46" r="4" fill="#FFF3D6"/>').join('');
  s+='<rect x="0" y="90" width="1280" height="520" fill="#C5CAD0"/><rect x="0" y="560" width="1280" height="240" fill="#8E959B"/>';
  const sc=(x,y,w,h,k,i)=>'<g transform="translate('+x+' '+y+')"><rect x="-6" y="-6" width="'+(w+12)+'" height="'+(h+12)+'" fill="#1A1F24"/>'+hudScreen(w,h,k,i)+'</g>';
  s+='<ellipse cx="640" cy="560" rx="620" ry="60" fill="#43D3E0" opacity=".18" filter="url(#glw)"/>';
  s+=sc(30,120,280,190,'sat',0)+sc(330,110,560,300,'globe',1)+sc(910,120,340,110,'clock',2)+sc(910,250,340,160,'grid',3)+sc(30,330,280,180,'gauges',4)+sc(330,430,270,110,'bars',5)+sc(620,430,270,110,'chart',6)+sc(910,430,340,110,'chart',8);
  // console in primo piano
  s+='<path d="M-20 800Q640 690 1300 800Z" fill="#E6E6E0"/><path d="M-20 790Q640 670 1300 790L1300 812Q640 700 -20 812Z" fill="#F3F3EF"/>';
  [[230,700,-8],[640,668,0],[1050,700,8]].forEach((p,i)=>{ s+='<g transform="translate('+p[0]+' '+p[1]+') rotate('+p[2]+')"><rect x="-150" y="0" width="300" height="160" rx="6" fill="#1B2128"/><rect x="-138" y="12" width="276" height="150" fill="'+['#9FD3E6','#E8F1F5','#7CC3E0'][i]+'"/><rect x="-138" y="12" width="276" height="150" fill="url(#hudg)" opacity=".18"/>'+[0,1,2,3].map(k=>'<rect x="-118" y="'+(32+k*22)+'" width="'+(150+((k*53+i*31)%90))+'" height="8" rx="4" fill="#2A3846" opacity=".35"/>').join('')+'</g>'; });
  if(0) s+='<g transform="translate(640 800) scale(4.2)"><path d="M-10 0q0-14 10-15q10 1 10 15z" fill="#3F6FB0"/><ellipse cx="0" cy="-19" rx="5.6" ry="6.4" fill="#2E241E"/><path d="M-6.2-21q0-7 6.2-7q6.2 0 6.2 7" fill="none" stroke="#1E262E" stroke-width="1.1"/></g>';
  s+=sfTop().replace('FASE A','FASE E')+'<g filter="url(#ds)">'+chamf(1044,96,220,44,12)+'</g><text x="1154" y="123" text-anchor="middle" font-family="'+FD+'" font-weight="800" font-size="13" letter-spacing=".06em" fill="'+SF.dark+'">⤡ TORNA ALLA SALA</text>';
  return s; }

// ===================== interni nel gioco =====================
const FOOT={ plant:[.6,.6], vib:[2.8,2.8], tvac:[3,3], emc:[3.2,3.2], mass:[2,2], func:[2.6,1.8], shock:[2.4,2.4] };
const BENCH=[[4.4,3],[7.6,3],[4.4,8],[7.6,8]], STAT=[[5.6,4.6],[12.8,4.6]];
const PPL={ build:[[5.7,5.4],[9.2,5.3],[10.5,7.3],[13.6,10.4],[3.3,2.6],[16.4,6]], clean:[[4.4,6.3],[6.9,3.2],[11.6,6.4],[14.1,3.3],[2,8],[8.8,9.8]], test:[[17,6.6],[17,7.6]], mcc:[[12.4,10.6]] };
const OBST={
  build:[[.4,.3,11.2,1.25],[.3,1.6,1.25,4.6],[.3,5,1.25,8],[.9,7.6,2.4,13.1],[9,11.1,12.4,12.05],[12.2,7.6,17.2,13.2],[6.6,11,7.8,11.8],[12.4,0,16.6,.8]].concat(BENCH.map(b=>[b[0]-.1,b[1]-.1,b[0]+2.7,b[1]+1.9])),
  clean:[[2.8,2,8.4,7.2],[10,2,15.6,7.2],[.3,10.4,3.7,13.7],[.4,.3,4,1.15],[.5,4.8,2.5,6.5],[8.9,2,10.1,2.8],[16.4,2,17.6,2.8],[9,8.4,10.2,9.2],[14.8,11,17.6,13.6],[11,0,17.4,.6]],
  test:[[15.8,5.4,17.5,8.5],[.8,0,4.6,1.2],[13.2,.9,14.8,1.6]],
  mcc:[[.4,10.6,3.9,13.7],[11.9,10.1,12.9,11.1]] };
function inArc(x,y){ const dx=x-9, dy=20.5-y, r=Math.hypot(dx,dy), t=Math.atan2(dx,dy); return r>12.0&&r<17.6&&Math.abs(t)<.56; }
function rectHit(a,b){ return a[0]<b[2]&&a[2]>b[0]&&a[1]<b[3]&&a[3]>b[1]; }
function valid(room,k,x,y,st,skip){ const f=FOOT[k]||[1,1], r=[x,y,x+f[0],y+f[1]];
  if(x<.3||y<.3||r[2]>RW-.3||r[3]>RD-.3) return 'fuori dalla stanza';
  for(const o of OBST[room]||[]) if(rectHit(r,o)) return 'c’è già un arredo';
  for(const p of PPL[room]||[]) if(rectHit(r,[p[0]-.35,p[1]-.35,p[0]+.35,p[1]+.35])) return 'c’è una persona';
  if(room==='mcc'){ for(let i=0;i<=3;i++) for(let j=0;j<=3;j++) if(inArc(x+f[0]*i/3,y+f[1]*j/3)) return 'sopra le console'; }
  const gap=k==='plant'?.05:.4;
  for(const m of (st.machines||[])){ if(m.i===skip) continue; const g=FOOT[m.k]||[2,2]; if(rectHit([r[0]-gap,r[1]-gap,r[2]+gap,r[3]+gap],[m.x,m.y,m.x+g[0],m.y+g[1]])) return 'troppo vicino a '+(m.n||'un macchinario').toLowerCase(); }
  for(let i=0;i<(st.plants||[]).length;i++){ const p=st.plants[i]; if(rectHit(r,[p.x,p.y,p.x+.6,p.y+.6])) return 'c’è già una pianta'; }
  return ''; }
function toGrid(sx,sy){ bigCam(); const a=(sx-C.ox)/(C.tw/2), b=(sy-C.oy)/(C.th/2); return [(a+b)/2,(b-a)/2]; }
const wrap=(attrs,svg)=>'<g class="robj" '+attrs+'>'+svg+'</g>';
function plantsOf(room,st,L){ (st.plants||[]).forEach((p,i)=>L.push([p.x+p.y+.6,wrap('data-act="plantsel" data-r="'+room+'" data-i="'+i+'"',plant(p.x+.3,p.y+.3)+(st.sel===i?poly(gp([[p.x,p.y],[p.x+.6,p.y],[p.x+.6,p.y+.6],[p.x,p.y+.6]]),'fill="none" stroke="'+SF.teal+'" stroke-width="2.4"'):''))])); }
function people(room,L,opt){ (PPL[room]||[]).forEach((p,i)=>{ const o=opt[i]||{}; L.push([p[0]+p[1],fig(p[0],p[1],Object.assign({s:FS},o))]); }); }
function machineArt(k,x,y,run0,hasImg){ let g=''; const run=run0&&!hasImg;
  if(k==='vib') g=hazard(x+.1,y+.1,x+2.7,y+2.7)+rbox(x+.5,y+.5,x+2.3,y+2.3,0,.6,'#3F6FB0')+rbox(x+.7,y+.7,x+2.1,y+2.1,.6,.67,'#C9D3DD')+(run?cubesat(x+1.2,y+1.2,.67,1):'')+cable([x+2.3,y+2.1,.4],[x+2.9,y+3,0]);
  if(k==='tvac') g=rbox(x+.2,y+.3,x+2.8,y+2.7,0,.25,'#9AA2A8')+prism(circ(x+1.5,y+1.5,1.05,24),.25,2.3,'#DCE3E8',{bands:[{z0:.7,z1:.78,c:'#B9C3CB'},{z0:1.4,z1:1.48,c:'#B9C3CB'}]})+cyl(x+1.5,y+1.5,1.05,2.3,2.45,'#E9EEF2',true)+(()=>{ const q=P(x+1.5,y+2.55,1.25); return '<ellipse cx="'+f1(q[0])+'" cy="'+f1(q[1])+'" rx="18" ry="21" fill="#5E7180"/><ellipse cx="'+f1(q[0])+'" cy="'+f1(q[1])+'" rx="12" ry="15" fill="'+(run?'#F2B06B':'#8FC2D6')+'"/>'; })();
  if(k==='emc') g=rbox(x,y,x+3.2,y+.2,0,2.4,'#2E4FA0')+rbox(x,y+.2,x+.2,y+3.2,0,2.4,'#2A4794')+rbox(x+.2,y+.2,x+3.2,y+3.2,0,.05,'#3E64BF')+rbox(x+2,y+.6,x+2.5,y+1.1,0,.9,'#E9EEF2')+rbox(x+2.1,y+.7,x+2.4,y+1,.9,1.3,'#F2C14E')+(run?cubesat(x+.8,y+1.6,0,.9):'');
  if(k==='mass') g=cyl(x+1,y+1,.8,0,.7,'#C9CED2')+cyl(x+1,y+1,.6,.7,.78,'#E9EEF2')+(run?cubesat(x+.8,y+.8,.78,1):'');
  if(k==='func') g=desk(x,y,x+2.6,y+1.8,.82,'#F2F1EC')+rbox(x+.2,y+.3,x+1.6,y+1.5,.82,.86,'#4FAE6A')+rbox(x+.4,y+.5,x+.8,y+.9,.86,.92,'#3A3F46')+rbox(x+1,y+.5,x+1.4,y+.8,.86,.9,'#F2C14E')+monitor(x+2.3,y+.9,.84,.6,.4,'x','#6FB7D6')+(run?cubesat(x+1.7,y+.3,.82,.8):'');
  if(k==='shock') g=rbox(x+.2,y+.2,x+2.2,y+2.2,0,.3,'#5D6B78')+rbox(x+.3,y+.3,x+.5,y+.5,.3,2.6,'#E07A45')+rbox(x+1.9,y+1.9,x+2.1,y+2.1,.3,2.6,'#E07A45')+rbox(x+1.9,y+.3,x+2.1,y+.5,.3,2.6,'#E07A45')+rbox(x+.3,y+.3,x+2.1,y+2.1,2.6,2.7,'#E07A45')+rbox(x+.8,y+.8,x+1.6,y+1.6,1.8,2.2,'#3A3F46')+rbox(x+.7,y+.7,x+1.7,y+1.7,.3,.42,'#C9D3DD')+(run?cubesat(x+1,y+1,.42,.9):'');
  return g; }
function ghostOf(room,st){ const gh=st.ghost; if(!gh) return ''; const f=FOOT[gh.k]||[1,1]; return (gh.k==='plant'?'<g opacity=".7">'+plant(gh.x+.3,gh.y+.3)+'</g>':'<g opacity=".6">'+machineArt(gh.k,gh.x,gh.y,0)+'</g>')+poly(gp([[gh.x,gh.y],[gh.x+f[0],gh.y],[gh.x+f[0],gh.y+f[1]],[gh.x,gh.y+f[1]]]),'fill="'+(gh.ok?'rgba(69,169,163,.2)':'rgba(207,94,76,.28)')+'" stroke="'+(gh.ok?SF.teal:'#CF5E4C')+'" stroke-width="2.4" stroke-dasharray="8 5"'); }

function build(st){ bigCam(); MONO=0; const W=RW,D=RD,H=RH; let s=DEFS+HUDDEF;
  s+=roomShell(W,D,H,{floor:'#B9BEC0',tile:1,tileC:'#AEB3B5',wallR:'#ECEBE5',wallL:'#E0DFD7',stripe:[1.2,SF.teal],cap:'#46525A',
    floorFx:poly(gp([[.5,6.6],[W-.5,6.6],[W-.5,6.85],[.5,6.85]]),'fill="#F2C14E"')+poly(gp([[11.4,.5],[11.65,.5],[11.65,D-.5],[11.4,D-.5]]),'fill="#F2C14E"')+poly(gp([[12.2,7.6],[17.2,7.6],[17.2,13.2],[12.2,13.2]]),'fill="#A9AFB2"')});
  s+=winGrid(.5,0,8.5,0,1.7,3.3,1,10,{ribbon:1,sill:.05,wh:.85})+rollDoor(12.4,16.6,2.6);
  s+=wallG('x0',.6,3.2,1.2,2.6,260,140,'<rect width="260" height="140" fill="#3F6FB0" rx="6"/>'+[...Array(48)].map((_,i)=>'<circle cx="'+(12+(i%12)*21)+'" cy="'+(12+Math.floor(i/12)*18)+'" r="2" fill="#2E5490"/>').join('')+'<path d="M20 80v44M44 82l8 40M70 80h24v7h-24zM120 80v42M116 80h8M150 82q12 12 0 40M190 80l16 40M230 80v40" stroke="#E9EEF2" stroke-width="5" stroke-linecap="round" fill="none"/>');
  s+=wallG('x0',4,9,1.5,3.1,500,160,hudScreen(500,160,'chart',2))+wallG('x0',9.6,13,1.5,3.1,340,160,hudScreen(340,160,'sat'));
  const L=[], cols=['#F28B50','#7C8CFF','#B783E3','#F06EAA','#F0B43A','#4DB8E8','#6CC4A1','#DDE2E6'];
  [0,1,2].forEach(i=>L.push([.4+i*3.6+1.5,shelfRack(.4+i*3.6,.3,3.2,.9,2.6,3,cols.slice(i*2).concat(cols.slice(0,i*2)))]));
  [0,1].forEach(i=>L.push([.3+1.5+i*3.4+2,shelfRack(.3,1.6+i*3.4,.9,3,2.6,3,cols.slice(3+i).concat(cols.slice(0,3+i)),1)]));
  BENCH.forEach((b,i)=>{ const x=b[0],y=b[1], m=(st.benches||[])[i]; const base=desk(x,y,x+2.6,y+1.8,.82,'#E9EEF2')+rbox(x+.1,y+.1,x+2.5,y+1.7,.82,.84,m?'#5FA87A':'#B9C9BE');
    const art=m?cubesat(x+.9,y+.6,.84,m.size,{wings:1,n:m.n})+rbox(x+.3,y+1.1,x+.7,y+1.4,.84,.9,'#F06EAA')+rbox(x+2,y+.3,x+2.3,y+.6,.84,.92,'#7C8CFF'):'';
    L.push([x+y+2,wrap(m?'data-act="openyard" data-id="'+m.id+'"':'data-act="benchfree"',base+art)]); L.push([x+y+2.05,tag(x+1.3,y+.9,m?2.4:1.4,m?m.label:'banco libero',m?m.col:'#9A9A90')]); });
  [0,1,2].forEach(i=>{ const x=.9, y=7.6+i*1.9; L.push([x+y+1,desk(x,y,x+1.4,y+1.4,.78,'#F2F1EC')+monitor(x+1.3,y+.45,.8,.55,.36,'x','#6FB7D6')+monitor(x+1.3,y+1,.8,.55,.36,'x','#8FD0A8')]); L.push([x+y+1.5,fig(x+.5,y+.7,{top:['#3F6FB0','#7A3E58','#4F6B48'][i],hair:['#6B4A30','#1C1714','#B98A4E'][i],skin:['#E8C3A0','#9C6B4A','#F0D3B8'][i],s:FS})]); });
  [0,1].forEach(i=>L.push([9.4+i*1.3+11.6,rbox(9+i*1.3,11.1,10+i*1.3,12,0,1.1,'#E9EEF2')+rbox(9.1+i*1.3,11.2,9.9+i*1.3,11.9,.3,.95,'#BFE2EE')+rbox(9.3+i*1.3,11.4,9.7+i*1.3,11.7,.3,.48,['#F28B50','#4DB8E8'][i])]));
  L.push([13+9,forklift(12.8,8.6)+rbox(14.6,8.5,15.8,9.6,0,.12,'#B98A5E')+rbox(14.7,8.6,15.7,9.5,.12,.6,'#DDE2E6')]);
  L.push([15+11.5,rbox(14.4,11,15.8,12.2,0,.12,'#B98A5E')+rbox(14.5,11.1,15.1,11.7,.12,.6,'#F0B43A')+rbox(15.1,11.2,15.7,12.1,.12,.5,'#7C8CFF')]);
  L.push([7.2+11.5,rbox(6.6,11,7.8,11.8,.5,.56,'#9AA2A8')+rbox(6.65,11.05,6.75,11.15,0,.5,'#9AA2A8')+rbox(7.65,11.65,7.75,11.75,0,.5,'#9AA2A8')+rbox(6.8,11.1,7.2,11.5,.56,.8,'#B783E3')+rbox(7.2,11.2,7.6,11.6,.56,.7,'#F0B43A')]);
  people('build',L,[{top:'#F7F8F6',coat:1,hair:'#2E241E',skin:'#9C6B4A',arm:'-2 4'},{top:'#2E4A5E',vest:'#EB7D44',helmet:'#F2C14E',hair:'#B98A4E',skin:'#F0D3B8',dir:-1,arm:'-2 4'},{top:'#4F6B48',vest:'#EB7D44',helmet:'#F2C14E',hair:'#1C1714',skin:'#C99673',walk:1},{top:'#2E4A5E',vest:'#EB7D44',helmet:'#F2C14E',skin:'#6E4630',walk:1,dir:-1},{top:'#C7643E',hair:'#6B4A30',skin:'#E8C3A0',walk:1},{top:'#F7F8F6',coat:1,hair:'#8A8A8A',skin:'#E8C3A0',dir:-1}]);
  plantsOf('build',st,L); L.push([99,ghostOf('build',st)]);
  return s+depth(L)+frontCut(W,D,{wallR:'#ECEBE5',cap:'#46525A'}); }

function clean(st){ bigCam(); MONO=0; const W=RW,D=RD,H=RH; let s=DEFS+HUDDEF;
  s+=roomShell(W,D,H,{floor:'#F3F5F6',tile:.7,tileC:'#E3E8EB',wallR:'#F4F7F8',wallL:'#E8EEF1',skirt:'#BFD6DE',stripe:[3.1,'#7FB6C8'],cap:'#4E6470',
    floorFx:poly(gp([[3,2.2],[8.2,2.2],[8.2,7],[3,7]]),'fill="#9CC9A3" opacity=".55"')+hazard(2.8,2,8.4,7.2)+poly(gp([[10.2,2.2],[15.4,2.2],[15.4,7],[10.2,7]]),'fill="#9CC9A3" opacity=".55"')+hazard(10,2,15.6,7.2)});
  for(let i=0;i<10;i++) s+=poly([P(.5+i*1.75,0,2.5),P(1.95+i*1.75,0,2.5),P(1.95+i*1.75,0,3.05),P(.5+i*1.75,0,3.05)],'fill="#FFFFFF" stroke="#CBD8DE" stroke-width="1.2"');
  for(let i=0;i<7;i++) s+=poly([P(0,.5+i*1.9,2.5),P(0,1.95+i*1.9,2.5),P(0,1.95+i*1.9,3.05),P(0,.5+i*1.9,3.05)],'fill="#FFFFFF" stroke="#CBD8DE" stroke-width="1.2"');
  s+=winGrid(11,0,17.4,0,.9,2.3,1,7,{ribbon:1,sill:.05,wh:.9});
  s+=wallG('y0',.8,2.8,1,1.9,170,80,'<rect width="170" height="80" rx="6" fill="#2F8580"/><text x="85" y="36" text-anchor="middle" font-family="'+FD+'" font-weight="800" font-size="26" fill="#fff">ISO 8</text><text x="85" y="62" text-anchor="middle" font-family="'+FT+'" font-weight="600" font-size="13" fill="#D7F2EF">camera bianca</text>');
  const L=[];
  STAT.forEach((p,i)=>{ const [x,y]=p, m=(st.stations||[])[i]; L.push([x+y,wrap('data-act="station" data-i="'+i+'"',cyl(x,y,1.1,0,.12,'#C9D3DD')+cyl(x,y,.25,.12,1,'#9AA9B6')+rbox(x-.6,y-.6,x+.6,y+.6,1,1.07,'#D9E0E5')+(m?(m.img?(()=>{ const g=P(x,y,1.07); return '<image href="'+m.img+'" x="'+f1(g[0]-62)+'" y="'+f1(g[1]-112)+'" width="124" height="124" preserveAspectRatio="xMidYMax meet"/>'; })():cubesat(x-.2*m.size,y-.2*m.size,1.07,m.size,{wings:m.n>=5,n:m.n})):''))]);
    L.push([x+y+.05,tag(x,y,m?1.07+m.size*1.2+.9:2.2,m?m.label:'postazione libera',m?m.col:'#9A9A90')]); });
  L.push([1.5+11,rbox(.3,10.4,3.6,13.6,0,.04,'#DCE6EA')+glassWall([3.6,10.4],[3.6,13.6],2.4)+glassWall([.3,10.4],[3.6,10.4],2.4)+rbox(.5,11,1.3,12.8,0,.5,'#E9EEF2')+rbox(2.2,12.6,3.3,13.4,0,1.9,'#BFE2EE')]);
  L.push([2.2+12.1,tag(2,12,2.6,'Vestizione',SF.teal)]);
  L.push([1.4+1.4,shelfRack(.4,.3,3.6,.8,2.2,3,['#E9EEF2','#DCE6EA','#BFE2EE','#F4F7F8'])]);
  L.push([1.4+5.5,desk(.5,4.8,2.4,6.4,.82,'#F4F7F8')+rbox(1.1,5.2,1.4,5.5,.82,.86,'#3A3F46')+rbox(1.2,5.3,1.3,5.4,.86,1.3,'#9AA9B6')+monitor(2.3,5.6,.84,.6,.36,'x','#8FD0A8')]);
  [[8.9,2],[16.4,2],[9,8.4]].forEach((c,i)=>L.push([c[0]+c[1]+.6,rbox(c[0],c[1],c[0]+1.2,c[1]+.8,.6,.66,'#F4F7F8')+rbox(c[0]+.05,c[1]+.05,c[0]+.15,c[1]+.15,0,.6,'#9AA9B6')+rbox(c[0]+1.05,c[1]+.65,c[0]+1.15,c[1]+.75,0,.6,'#9AA9B6')+rbox(c[0]+.1,c[1]+.1,c[0]+1.1,c[1]+.7,.66,.68,'#6FB18A')+rbox(c[0]+.3,c[1]+.2,c[0]+.6,c[1]+.5,.68,.82,['#F06EAA','#7C8CFF','#F0B43A'][i])]));
  L.push([16+12,rbox(14.8,11,17.4,13.4,0,2.4,'#E8EEF1')+poly(gp([[14.8,13.4,.1],[16.6,13.4,.1],[16.6,13.4,2.2],[14.8,13.4,2.2]]),'fill="#BFE2EE" opacity=".8"')+poly(gp([[14.82,11.6,2.1],[14.82,12.6,2.1],[14.82,12.6,2.3],[14.82,11.6,2.3]]),'fill="#3FA86B"')]);
  L.push([16.1+12.2,tag(16.1,12.2,2.9,'Doccia d’aria',SF.teal)]);
  (PPL.clean).forEach((p,i)=>L.push([p[0]+p[1],fig(p[0],p[1],{suit:1,skin:['#E8C3A0','#9C6B4A','#F0D3B8','#6E4630','#F0D3B8','#C99673'][i],s:FS,dir:i%2?1:-1,arm:'-2.6 3'})]));
  plantsOf('clean',st,L); L.push([99,ghostOf('clean',st)]);
  return s+depth(L)+frontCut(W,D,{wallR:'#F4F7F8',cap:'#4E6470'}); }

function test(st){ bigCam(); MONO=0; const W=RW,D=RD,H=RH; let s=DEFS+HUDDEF;
  s+=roomShell(W,D,H,{floor:'#C9CDCF',tile:1,tileC:'#BEC3C6',wallR:'#ECEBE5',wallL:'#E0DFD7',stripe:[1.3,SF.orange],cap:'#46525A'});
  s+=rollDoor(.8,4.6,2.8)+winGrid(5.4,0,17.4,0,2.2,3.3,1,12,{ribbon:1,sill:.05,wh:.75});
  s+=wallG('x0',1,6,1.5,3.2,500,170,hudScreen(500,170,'chart',5))+wallG('x0',6.6,10,1.5,3.2,340,170,hudScreen(340,170,'gauges'));
  const L=[];
  (st.machines||[]).forEach(m=>{ const f=FOOT[m.k]||[2,2]; L.push([m.x+m.y+f[0],wrap('data-act="mach" data-k="'+m.k+'"',machineArt(m.k,m.x,m.y,m.state==='run',!!m.img&&m.k!=='tvac')+(m.img&&m.k!=='tvac'?(()=>{ const o={vib:[1.4,1.4,.67,96],func:[1.7,.9,.86,78],emc:[1.2,2,.05,96],mass:[1,1,.78,92],shock:[1.2,1.2,.42,58]}[m.k]||[f[0]/2,f[1]/2,.8,90], g=P(m.x+o[0],m.y+o[1],o[2]), w=o[3]; return '<g class="'+(m.k==='vib'||m.k==='shock'?'shake':'')+'"><image href="'+m.img+'" x="'+f1(g[0]-w/2)+'" y="'+f1(g[1]-w*.92)+'" width="'+w+'" height="'+w+'" preserveAspectRatio="xMidYMax meet"/></g>'; })():'')+(m.img&&m.k==='shock'?rbox(m.x+1.9,m.y+1.9,m.x+2.1,m.y+2.1,.3,2.6,'#E07A45')+rbox(m.x+.8,m.y+.8,m.x+1.6,m.y+1.6,1.8,2.2,'#3A3F46')+rbox(m.x+.3,m.y+.3,m.x+2.1,m.y+2.1,2.6,2.7,'#E07A45'):''))]); L.push([m.x+m.y+f[0]+.1,tag(m.x+f[0]/2,m.y+f[1]/2,{tvac:3.4,emc:3.1,shock:3.2}[m.k]||2.5,m.n+(m.lab?' · '+m.lab:''),m.col||SF.teal)]); });
  L.push([16.6+6,desk(15.8,5.4,17.4,8.4,.8,'#F2F1EC')+monitor(16,6,.82,.7,.45,'x','#6FB7D6')+monitor(16,7,.82,.7,.45,'x','#F28B50')+monitor(16,7.9,.82,.5,.4,'x','#8FD0A8')]);
  people('test',L,[{top:'#F7F8F6',coat:1,hair:'#8A8A8A',skin:'#E8C3A0',dir:-1,headset:1},{top:'#3F6FB0',hair:'#1C1714',skin:'#9C6B4A',dir:-1,headset:1}]);
  L.push([14+2,forklift(13.2,.9)]);
  plantsOf('test',st,L); L.push([99,ghostOf('test',st)]);
  return s+depth(L)+frontCut(W,D,{wallR:'#ECEBE5',cap:'#46525A'}); }

function mcc(st){ bigCam(); MONO=1; const W=RW,D=RD,H=RH; let s=DEFS+HUDDEF;
  s+=roomShell(W,D,H,{floor:'#8E959B',base:'#C9CCC8',wallR:'#C5CAD0',wallL:'#B6BCC3',skirt:'#7D858D',cap:'#2A323A',capSide:'#A9AFB5',
    floorFx:[...Array(260)].map((_,i)=>{ const p=P(((i*37)%180)/10,((i*53)%140)/10); return '<circle cx="'+f1(p[0])+'" cy="'+f1(p[1])+'" r=".9" fill="#7E858B"/>'; }).join('')});
  s+=poly([P(0,0,3.3),P(W,0,3.3),P(W,0,H),P(0,0,H)],'fill="#2E363E"')+poly([P(0,0,3.3),P(0,D,3.3),P(0,D,H),P(0,0,H)],'fill="#262D34"');
  for(let i=0;i<22;i++){ const p=P(.4+i*.8,0,3.46); s+='<circle cx="'+f1(p[0])+'" cy="'+f1(p[1])+'" r="2" fill="#FFF3D6"/>'; } for(let i=0;i<17;i++){ const p=P(0,.4+i*.8,3.46); s+='<circle cx="'+f1(p[0])+'" cy="'+f1(p[1])+'" r="2" fill="#FFF3D6"/>'; }
  let wall='';
  const W1=x=>wrap('data-act="mccwall"',x);
  [[.6,3.6,'sat'],[3.9,9.4,'globe'],[9.7,12.2,'clock'],[12.5,17.4,'chart']].forEach((v,i)=>{ const w=(v[1]-v[0])*100, h=v[2]==='clock'?70:150; wall+=W1(wallG('y0',v[0],v[1],v[2]==='clock'?2.35:1.4,3.15,w,h,hudScreen(w,h,v[2],i))); });
  wall+=W1(wallG('y0',9.7,12.2,1.4,2.15,250,60,'<rect width="250" height="60" fill="#061420"/><text x="125" y="42" text-anchor="middle" font-family="DejaVu Sans Mono, monospace" font-weight="700" font-size="30" fill="#43D3E0">AOS 00:12</text>'));
  wall+=W1(wallG('x0',.6,6,1.3,3.15,540,185,hudScreen(540,185,'grid')))+W1(wallG('x0',6.4,10.6,1.4,3.05,420,165,hudScreen(420,165,'gauges')))+W1(wallG('x0',11,13.4,1.6,2.9,240,130,hudScreen(240,130,'bars')));
  s+=wall;
  { const g=P(9,2); s+='<ellipse cx="'+f1(g[0])+'" cy="'+f1(g[1])+'" rx="360" ry="80" fill="#43D3E0" opacity=".14" filter="url(#glw)" pointer-events="none"/>'; }
  const L=[], cx=9, cy=20.5, rows=[[12.6,-.5,.5],[14.6,-.46,.46],[16.6,-.42,.42]];
  rows.forEach((row,ri)=>{ const [r,a0,a1]=row, n=Math.round((a1-a0)*r/0.75); for(let k=0;k<n;k++){ const t0=a0+(a1-a0)*k/n, t1=a0+(a1-a0)*(k+1)/n, tm=(t0+t1)/2;
      const pt=(rr,t)=>[cx+rr*Math.sin(t), cy-rr*Math.cos(t)];
      const dIn=pt(r,t0), dIn2=pt(r,t1), dOut=pt(r+.8,t1), dOut2=pt(r+.8,t0), mid=pt(r+.4,tm);
      if(mid[1]<.6||mid[0]<.6||mid[0]>W-.6||mid[1]>D-.6) continue;
      let seg=poly(gp([[dIn[0],dIn[1],.78],[dIn2[0],dIn2[1],.78],[dOut[0],dOut[1],.78],[dOut2[0],dOut2[1],.78]]),'fill="#F3F3EF" stroke="#DCDCD6" stroke-width="1"')+rface(gp([[dIn[0],dIn[1],0],[dIn2[0],dIn2[1],0],[dIn2[0],dIn2[1],.78],[dIn[0],dIn[1],.78]]),'#E6E6E0',.5);
      { const hw=.26/(r+.62), ta=pt(r+.62,tm-hw), tb=pt(r+.62,tm+hw); const q=gp([[ta[0],ta[1],.82],[tb[0],tb[1],.82],[tb[0],tb[1],1.3],[ta[0],ta[1],1.3]]); seg+=poly(q,'fill="'+['#7CC3E0','#F2F6F8','#1B2530'][(k+ri)%3]+'" stroke="#1B2530" stroke-width="1.2" stroke-linejoin="round"'); }
      L.push([mid[0]+mid[1]+.3,seg]);
      if((k+ri)%2===0){ const p=pt(r-.55,tm); L.push([p[0]+p[1],seated(p[0],p[1],{s:SS,top:['#5E6F8A','#E8E6DF','#7A3E58','#3F6FB0','#4F6B48'][(k*3+ri)%5],skin:['#E8C3A0','#C99673','#9C6B4A','#F0D3B8'][(k+ri)%4],hair:['#2E241E','#6B4A30','#1C1714','#B98A4E','#8A8A8A'][(k*2+ri)%5],headset:1})]); } } });
  L.push([2+12.5,rbox(.4,10.6,3.8,13.6,0,.05,'#9AA2A8')+glassWall([.4,10.6],[3.8,10.6],2.6,'#A9D2EA')+glassWall([3.8,10.6],[3.8,13.6],2.6,'#A9D2EA')+desk(1,11.4,3.2,12.4,.75,'#F2F1EC')]);
  L.push([2.1+12.6,tag(2.1,12,2.9,'Sala ospiti',SF.teal)]);
  people('mcc',L,[{top:'#E8E6DF',hair:'#1C1714',skin:'#6E4630',pant:'#2F3640',headset:1,dir:-1,arm:'-2.4 3'}]);
  plantsOf('mcc',st,L); L.push([99,ghostOf('mcc',st)]);
  return s+depth(L)+frontCut(W,D,{wallR:'#C5CAD0',cap:'#2A323A',cut:.3}); }

// parete video frontale, allineata ai riquadri funzionali della sala controllo (viewBox 1000 × 560)
function mccWallBack(){ MONO=1; let s=HUDDEF+'<rect width="1000" height="560" fill="#C5CAD0"/><rect width="1000" height="62" fill="#1F262D"/>'+[...Array(16)].map((_,i)=>'<circle cx="'+(30+i*63)+'" cy="31" r="3.5" fill="#FFF3D6"/>').join('');
  s+='<rect y="300" width="1000" height="260" fill="#8E959B"/><ellipse cx="500" cy="300" rx="520" ry="46" fill="#43D3E0" opacity=".16" filter="url(#glw)"/>';
  [[40,85],[355,85],[670,85]].forEach(p=>s+='<rect x="'+(p[0]-7)+'" y="'+(p[1]-7)+'" width="304" height="214" rx="4" fill="#1A1F24"/>');
  s+='<rect x="345" y="66" width="310" height="14" rx="3" fill="#061420"/><text x="500" y="77" text-anchor="middle" font-family="DejaVu Sans Mono, monospace" font-size="10" fill="#43D3E0">PERIGEO LABS · MISSION CONTROL</text>';
  s+='<path d="M-20 560Q500 470 1020 560Z" fill="#E6E6E0"/>';
  [[332,334,336]].forEach(p=>{ s+='<rect x="'+p[0]+'" y="'+p[1]+'" width="'+p[2]+'" height="'+(560-p[1]+20)+'" rx="8" fill="#1B2128"/><rect x="'+(p[0]+8)+'" y="'+(p[1]+8)+'" width="'+(p[2]-16)+'" height="'+(560-p[1])+'" fill="#0B141C"/>'; });
  return s; }

// ===================== sala riunioni (frontale, prima persona) =====================
const MSEAT=(()=>{ const head=[640,402,.8], L=t=>[545-245*t,400+320*t], out=[head];
  [[.2,.98],[.52,1.2],[.86,1.48]].forEach(([t,s])=>{ const e=L(t); out.push([e[0]-38*s,e[1]+6*s,s]); out.push([1280-(e[0]-38*s),e[1]+6*s,s]); }); return out; })();
function hashN(s){ let h=7; for(const c of String(s)) h=(h*31+c.charCodeAt(0))>>>0; return h; }
function lookOf(id,col,name){ const h=hashN(id), fem=/^(Dott\.ssa|Prof\.ssa|Sig\.ra|Maestra|Dra\.)/.test(name||''), SK=['#F2CBA8','#E8B48E','#C98E66','#8D5B3E','#5E3B28','#F5D5BC'], HR=['#1F1A17','#3B2A20','#8A5A35','#B98A4E','#7A7A7A','#2E2622'], HS=['bun','long','short','bald','short','long'];
  const hs=name==null?HS[(h>>3)%6]:fem?['bun','long','long','bun'][(h>>3)%4]:['short','bald','short','short'][(h>>3)%4]; return {skin:SK[h%6],hair:HR[(h>>5)%6],hs,suit:(h>>7)%3===0?'#2E4A5E':(h>>7)%3===1?'#F4F7F9':'#5C6670',shirt:'#F4F7F9',acc:col,glasses:(h>>9)%3===0,mood:2+((h>>11)%3)}; }
function meetChair(x,y,s,empty){ return '<g transform="translate('+x+' '+y+') scale('+s+')"><ellipse cx="0" cy="4" rx="58" ry="10" fill="#22313B" opacity=".12"/><path d="M-46 0V-104Q-46-128-22-130H22Q46-128 46-104V0Z" fill="#3E4A55"/><path d="M-38-6V-100Q-38-120-18-122H18Q38-120 38-100V-6Z" fill="#4B5864"/><path d="M-30-112h60" stroke="#fff" stroke-opacity=".12" stroke-width="5" stroke-linecap="round"/>'+(empty?'<path d="M-52 0h104l-8 18h-88z" fill="#36414B"/>':'')+'</g>'; }
function meetWindow(){ let s='<defs><linearGradient id="msky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BBDDEC"/><stop offset=".75" stop-color="#E8F2F2"/></linearGradient><clipPath id="mwin"><rect x="330" y="112" width="620" height="220" rx="10"/></clipPath>'+
    '<linearGradient id="mfloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9D8D1"/><stop offset="1" stop-color="#C4C3BC"/></linearGradient><linearGradient id="mtable" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7F7F3"/><stop offset="1" stop-color="#E4E6E2"/></linearGradient>'+
    '<radialGradient id="mholo"><stop offset="0" stop-color="#7CCFD2" stop-opacity=".55"/><stop offset="1" stop-color="#7CCFD2" stop-opacity="0"/></radialGradient><radialGradient id="mlamp" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#FFF8E8" stop-opacity=".7"/><stop offset="1" stop-color="#FFF8E8" stop-opacity="0"/></radialGradient></defs>';
  s+='<g clip-path="url(#mwin)"><rect x="330" y="112" width="620" height="220" fill="url(#msky)"/><path d="M330 236L400 214L470 222L540 200L620 212L700 196L790 210L870 194L950 210V332H330z" fill="#C9D9DF"/>'+
    '<path d="M330 262Q520 240 700 254T950 246V332H330z" fill="#B4C98A"/><path d="M330 284Q600 268 950 276V332H330z" fill="#A6BF77"/>'+
    [...Array(12)].map((_,k)=>{ const x=352+k*22, y=264-k*.6; return '<g transform="translate('+x+' '+y+')"><rect x="-1" y="-5" width="2" height="5" fill="#6B5A48"/><ellipse cy="-14" rx="4.5" ry="12" fill="'+(k%2?'#5F7F3E':'#6A8A47')+'"/></g>'; }).join('')+
    '<g transform="translate(560 262)"><rect x="0" y="-66" width="62" height="66" fill="#ECEBE5"/><rect x="62" y="-54" width="22" height="54" fill="#CFCEC6"/><rect x="14" y="-58" width="5" height="44" fill="'+SF.orange+'"/><rect x="21" y="-58" width="5" height="44" fill="'+SF.teal+'"/><rect x="-40" y="-26" width="40" height="26" fill="#E2E0D8"/><rect x="-34" y="-20" width="28" height="4" fill="#9FB8C0"/></g>'+
    '<g transform="translate(800 266)"><ellipse rx="40" ry="7" fill="#DCE1DE"/><path d="M-5 0v-62q0-16 5-24q5 8 5 24v62z" fill="#fff"/><path d="M-5-62q0-16 5-24q5 8 5 24z" fill="'+SF.dark+'"/><rect x="-5" y="-48" width="10" height="4" fill="'+SF.orange+'"/><rect x="12" y="-74" width="5" height="74" fill="#E4E7E6"/><path d="M17-64h-7M17-44h-7" stroke="'+SF.orange+'" stroke-width="3"/></g>'+
    '<g transform="translate(900 250)"><rect x="-3" y="0" width="6" height="22" fill="#E2E1DA"/><ellipse cy="-6" rx="24" ry="11" fill="#F6F5F1" stroke="#C9CBC5" transform="rotate(-22)"/></g>'+
    '<path d="M420 140Q520 112 640 128" stroke="#fff" stroke-width="3" fill="none" opacity=".45"/></g>';
  s+='<rect x="330" y="112" width="620" height="220" rx="10" fill="none" stroke="#E0DFD8" stroke-width="12"/>'+[485,640,795].map(x=>'<rect x="'+(x-4)+'" y="112" width="8" height="220" fill="#E0DFD8"/>').join('')+'<rect x="322" y="330" width="636" height="12" rx="3" fill="#E6E5DE"/><rect x="322" y="340" width="636" height="3" fill="'+SF.teal+'"/>';
  return s; }
function wallScreen(side,lines){ const L=side<0; const q0=L?[[38,150],[200,176],[200,330],[38,354]]:[[1242,150],[1080,176],[1080,330],[1242,354]], qi0=L?[[48,162],[190,185],[190,322],[48,342]]:[[1232,162],[1090,185],[1090,322],[1232,342]], dx=L?34:-34, q=q0.map(p=>[p[0]+dx,p[1]+4]), qi=qi0.map(p=>[p[0]+dx,p[1]+4]);
  let s=poly(q,'fill="#1F262D"')+poly(qi,'fill="#0F161C"'); const k=L?.16:-.16, x0=L?94:1068;
  const esc2=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;'), W=19, rows=[]; const wrapT=t=>{ const w=String(t).split(' '), o=['']; w.forEach(x=>{ const c=o[o.length-1]; if((c+' '+x).trim().length>W&&c){ if(o.length===2){ o[1]=(o[1]+' '+x).trim(); return; } o.push(x); } else o[o.length-1]=(c+' '+x).trim(); }); if(o[1]&&o[1].length>W) o[1]=o[1].slice(0,W-1)+'…'; return o; };
  lines.forEach((ln,i)=>{ if(!i){ rows.push({t:String(ln.t||ln),h:1,y:0}); return; } wrapT(ln.t||ln).forEach((t,j)=>rows.push({t,ok:ln.ok,c:j>0})); });
  let y=188, out=[], more=0; rows.forEach((r,i)=>{ const dy=i===0?0:r.c?14:(i===1?20:18); if(y+dy>(L?322:322)){ more++; return; } y+=dy; out.push('<text x="'+x0+'" y="'+y+'" font-family="'+FT+'" font-weight="'+(r.h?700:r.c?500:600)+'" font-size="'+(r.h?12:12.5)+'" letter-spacing="'+(r.h?'.12em':0)+'" fill="'+(r.h?'#7FD3EA':r.ok?'#FFFFFF':'#BFE6F2')+'">'+(r.c?'  ':'')+esc2(r.t)+'</text>'); });
  if(L) out.push('<text x="'+x0+'" y="'+(Math.min(y,316)+18)+'" font-family="'+FT+'" font-weight="600" font-size="12" fill="#F2A36F">'+(more?'+ altri · ':'')+'tocca per la lista</text>');
  s+='<g transform="matrix(1 '+k+' 0 1 0 '+(-x0*k)+')">'+out.join('')+'</g>';
  return s; }
function meet(st){ let s=meetWindow(); const ext='<rect x="-1600" y="0" width="1600" height="590" fill="#ECEBE4"/><rect x="1280" y="0" width="1600" height="590" fill="#E3E2DB"/><rect x="-1600" y="0" width="4480" height="40" fill="#F6F5F0" opacity=".6"/><rect x="-1600" y="588" width="4480" height="300" fill="#C9C8C1"/><path d="M-1600 470H0M1280 470H2880" stroke="#EB7D44" stroke-width="3" opacity=".85"/>';
  // stanza in prospettiva centrale
  s=ext+poly([[0,0],[1280,0],[1050,64],[230,64]],'fill="#F6F5F0"')+[0,1,2].map(i=>poly([[420+i*160,14],[540+i*160,14],[528+i*150,40],[436+i*150,40]].map(p=>[p[0]-40,p[1]]),'fill="#FFFDF6" opacity=".9"')).join('')+
    poly([[0,0],[230,64],[230,430],[0,590]],'fill="#ECEBE4"')+poly([[1280,0],[1050,64],[1050,430],[1280,590]],'fill="#E3E2DB"')+
    '<rect x="230" y="64" width="820" height="366" fill="#F2F1EB"/>'+poly([[0,590],[230,430],[1050,430],[1280,590],[1280,720],[0,720]],'fill="url(#mfloor)"')+
    '<path d="M0 470L230 352M1280 470L1050 352" stroke="'+SF.orange+'" stroke-width="3" opacity=".85"/><path d="M230 430H1050" stroke="#D2D1CA" stroke-width="2"/>'+
    [1,2,3,4].map(i=>{ const x=i*46; return '<path d="M'+x+' '+(x*64/230)+'V'+(590-x*160/230)+'M'+(1280-x)+' '+(x*64/230)+'V'+(590-x*160/230)+'" stroke="#DDDCD5" stroke-width="2"/>'; }).join('')+s;
  s+='<g transform="translate(640 89)">'+chamf(-74,-13,148,26,8,'#FFFFFF','#DCE4EA')+'<circle cx="-56" cy="0" r="6.5" fill="none" stroke="'+SF.orange+'" stroke-width="3"/><text x="-42" y="4.5" font-family="'+FD+'" font-weight="800" font-size="11" letter-spacing=".18em" fill="'+SF.dark+'">'+String(st.co||'PERIGEO LABS').toUpperCase().replace(/&/g,'&amp;').replace(/</g,'&lt;').slice(0,16)+'</text></g>';
  s+='<g class="robj wsc" data-act="reqlist"><title>Requisiti accettati</title>'+wallScreen(-1,st.left||['REQUISITI'])+'</g>'+wallScreen(1,st.right||['MISSIONE']);
  // piante d'angolo
  [[262,452,1.15],[1018,452,1.15]].forEach(p=>{ s+='<g transform="translate('+p[0]+' '+p[1]+') scale('+p[2]+')"><path d="M-14 0l3 22h22l3-22z" fill="#CFC8B8"/><ellipse cx="0" cy="-16" rx="18" ry="22" fill="#5F8E4A"/><ellipse cx="-7" cy="-26" rx="10" ry="13" fill="#79A65A"/><ellipse cx="8" cy="-8" rx="9" ry="11" fill="#4E7A3C"/></g>'; });
  // persone: dal fondo verso chi guarda
  const seats=st.seats||[]; const order=MSEAT.map((p,i)=>i).sort((a,b)=>MSEAT[a][1]-MSEAT[b][1]);
  const at=i=>MSEAT[i];
  order.forEach(i=>{ const p=at(i), o=seats[i]; if(!o) return; if(i===0) return; s+=meetChair(p[0]+(p[0]<640?-14:14)*p[2],p[1]+2,p[2]*1.02,o.gone); if(!o.gone){ if(o.speak) s+='<ellipse cx="'+p[0]+'" cy="'+(p[1]-80*p[2])+'" rx="'+(58*p[2])+'" ry="'+(62*p[2])+'" fill="url(#mholo)"/>'; s+=sfPerson(p[0],p[1],p[2],o.look,1); } });
  // capotavola
  if(seats[0]){ const p=at(0), o=seats[0]; s=s.replace('<!--HEAD-->',''); const head=meetChair(p[0],p[1],p[2],o.gone)+(o.gone?'':(o.speak?'<ellipse cx="'+p[0]+'" cy="'+(p[1]-80*p[2])+'" rx="'+(58*p[2])+'" ry="'+(62*p[2])+'" fill="url(#mholo)"/>':'')+sfPerson(p[0],p[1],p[2],o.look,1)); s+=head; }
  // tavolo
  s+='<path d="M286 720L536 398H744L994 720Z" fill="#B9BDB9"/><path d="M296 720L540 392H740L984 720Z" fill="url(#mtable)"/><path d="M540 392H740" stroke="#FFFFFF" stroke-width="2"/><path d="M540 392L296 720M740 392L984 720" stroke="#D3D6D2" stroke-width="2"/>'+
    '<path d="M596 452H684L716 560H564Z" fill="#E9ECE8" opacity=".7"/>';
  // ologramma
  s+='<ellipse cx="640" cy="520" rx="120" ry="24" fill="url(#mholo)"/><ellipse cx="640" cy="520" rx="58" ry="11" fill="none" stroke="'+SF.cyan+'" stroke-width="2"/><path d="M592 520L614 472M688 520L666 472" stroke="'+SF.cyan+'" stroke-width="1" opacity=".55"/>'+
    '<g opacity=".92"><circle cx="640" cy="462" r="36" fill="'+SF.cyan+'" opacity=".2" stroke="'+SF.cyan+'" stroke-width="1.6"/><ellipse cx="640" cy="462" rx="36" ry="12" fill="none" stroke="'+SF.cyan+'" stroke-width="1"/><ellipse cx="640" cy="462" rx="13" ry="36" fill="none" stroke="'+SF.cyan+'" stroke-width="1"/><ellipse cx="640" cy="462" rx="62" ry="21" fill="none" stroke="'+SF.orange+'" stroke-width="2" stroke-dasharray="6 5" transform="rotate(-14 640 462)"/><rect x="694" y="440" width="9" height="9" fill="'+SF.orange+'"/></g>';
  // oggetti sul tavolo (di fronte a chi guarda)
  s+='<g transform="translate(520 660) rotate(-10)"><rect x="-50" y="-30" width="100" height="62" rx="9" fill="#22313B"/><rect x="-42" y="-22" width="84" height="46" rx="3" fill="#2B4252"/><rect x="-34" y="-14" width="44" height="5" fill="'+SF.cyan+'"/><rect x="-34" y="-4" width="60" height="4" fill="#5B7083"/><rect x="-34" y="5" width="36" height="4" fill="#5B7083"/></g>'+
    '<g transform="translate(780 655) rotate(12)"><rect x="-44" y="-28" width="88" height="58" fill="#FFFFFF" stroke="#D3D7D3"/><rect x="-34" y="-18" width="50" height="5" fill="'+SF.orange+'"/><rect x="-34" y="-6" width="64" height="3" fill="#C9CFD3"/><rect x="-34" y="2" width="58" height="3" fill="#C9CFD3"/><rect x="-34" y="10" width="40" height="3" fill="#C9CFD3"/></g>'+
    '<g transform="translate(870 600)"><ellipse rx="16" ry="6" fill="#E3E5E1"/><path d="M-11-22h22v20q-11 6-22 0z" fill="#FFFFFF" stroke="#D3D7D3"/><path d="M11-16q8 2 0 10" stroke="#D3D7D3" stroke-width="3" fill="none"/></g>';
  // cartellini con nome e gradimento
  order.forEach(i=>{ const p=at(i), o=seats[i]; if(!o||o.gone) return; const y=p[1]-128*p[2]-14, w=Math.max(92,o.name.length*6.6+34), j=Math.max(0,Math.min(100,o.joy==null?60:o.joy)), jc=j<35?'#CF5E4C':j<60?'#E8AA30':'#3FA86B';
    s+='<g transform="translate('+p[0]+' '+y+')"><rect x="'+(-w/2)+'" y="-15" width="'+w+'" height="30" rx="15" fill="#FFFFFF" opacity=".95" stroke="'+(o.speak?SF.teal:'#DCE0DC')+'" stroke-width="'+(o.speak?2.5:1)+'"/><circle cx="'+(-w/2+13)+'" cy="-3" r="4.5" fill="'+o.col+'"/><text x="'+(-w/2+23)+'" y="1" font-family="'+FT+'" font-weight="700" font-size="12" fill="'+SF.dark+'">'+o.name.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</text><rect x="'+(-w/2+12)+'" y="6" width="'+(w-24)+'" height="4" rx="2" fill="#E3E6E2"/><rect x="'+(-w/2+12)+'" y="6" width="'+((w-24)*j/100)+'" height="4" rx="2" fill="'+jc+'"/></g>'; });
  return s; }

// ===================== bunker di lancio (vista dalla vetrata) =====================
function launchScene(st){ const T=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;'); let s='<defs><linearGradient id="lsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8CC8E8"/><stop offset=".7" stop-color="#CFE8F2"/></linearGradient><linearGradient id="lcon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A5560"/><stop offset="1" stop-color="#2C343C"/></linearGradient>'+
  '<linearGradient id="lbtnL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F06A4A"/><stop offset="1" stop-color="#C9402A"/></linearGradient><linearGradient id="lbtnA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B7BEC5"/><stop offset="1" stop-color="#7F8891"/></linearGradient><radialGradient id="lflame" cx=".5" cy=".1" r=".9"><stop offset="0" stop-color="#FFF6C9"/><stop offset=".4" stop-color="#FFB347"/><stop offset="1" stop-color="#F06A2A" stop-opacity="0"/></radialGradient></defs>';
  // paesaggio
  s+='<rect x="-1600" y="0" width="4480" height="800" fill="#D7D9D6"/>';
  s+='<rect width="1280" height="800" fill="url(#lsky)"/><g fill="#fff" opacity=".85"><ellipse cx="230" cy="190" rx="90" ry="20"/><ellipse cx="290" cy="176" rx="60" ry="22"/><ellipse cx="1010" cy="240" rx="110" ry="18"/></g>'+
    '<path d="M0 470L140 440L300 452L470 428L640 446L820 424L1000 444L1150 430L1280 442V560H0z" fill="#B9CFD6"/><path d="M0 500Q400 470 800 488T1280 480V600H0z" fill="#AFC77A"/><rect y="530" width="1280" height="270" fill="#A2BC6C"/>'+
    '<path d="M300 560L980 560L1060 610L220 610z" fill="#D8D6CC"/><path d="M560 548h160v14h-160z" fill="#C9C7BD"/>';
  // piattaforma mobile e torre
  const X=640, Y=548;
  s+='<g transform="translate('+X+' '+Y+')"><rect x="-150" y="-34" width="300" height="34" fill="#3A4148"/><rect x="-150" y="-34" width="300" height="6" fill="#59626B"/>'+[-120,-60,60,120].map(x=>'<rect x="'+(x-16)+'" y="0" width="32" height="14" rx="3" fill="#2A3036"/>').join('')+
    '<g transform="translate(70 -34)">'+'<rect x="-22" y="-330" width="44" height="330" fill="none" stroke="#9AA3AA" stroke-width="4"/>'+[...Array(16)].map((_,i)=>'<path d="M-22 '+(-i*20.6)+'L22 '+(-(i+1)*20.6)+'M22 '+(-i*20.6)+'L-22 '+(-(i+1)*20.6)+'" stroke="#B9C0C6" stroke-width="2"/>').join('')+'<rect x="-28" y="-344" width="56" height="16" fill="#8E979E"/><rect x="-6" y="-370" width="12" height="28" fill="#8E979E"/>'+
      '<rect x="-80" y="-250" width="58" height="7" fill="#9AA3AA"/><rect x="-80" y="-150" width="58" height="7" fill="#9AA3AA"/><rect x="-6" y="-330" width="3" height="330" fill="#CF5E4C" opacity=".6"/></g>';
  // razzo
  const h=st.h||1, showR=st.rocket!=null?st.rocket:!st.empty; s+='<g id="lrk" class="lrk'+(st.go?' go':'')+'" style="display:'+(showR||st.go?'inline':'none')+'"><g transform="translate(0 -34) scale('+(1.15*h)+')"><g class="lfl" opacity="'+(st.ign||st.go?1:0)+'"><ellipse cx="0" cy="24" rx="16" ry="44" fill="url(#lflame)"/></g>'+
    '<path d="M-14 0V-196Q-14-232 0-252Q14-232 14-196V0Z" fill="#F7F7F4" stroke="#C9CCCB" stroke-width="1.5"/><path d="M4 0V-196Q4-230 0-252Q14-232 14-196V0Z" fill="#E1E4E2"/>'+
    '<rect x="-14" y="-150" width="28" height="7" fill="#EB7D44"/><rect x="-14" y="-140" width="28" height="4" fill="#45A9A3"/><path d="M-14-30l-14 30h14zM14-30l14 30h-14z" fill="#3F4A54"/>'+
    '<path d="M-24 0v-90q0-12 5-16q5 4 5 16v90z" fill="#ECECE8" stroke="#C9CCCB"/><path d="M24 0v-90q0-12-5-16q-5 4-5 16v90z" fill="#E1E4E2" stroke="#C9CCCB"/><text x="0" y="-62" text-anchor="middle" font-family="Inter,sans-serif" font-weight="800" font-size="8" fill="#22313B" transform="rotate(-90 0 -62)">'+T(st.lvn||'').slice(0,14)+'</text>'+(st.flag?'<image href="'+st.flag+'" x="-11" y="-128" width="22" height="15" preserveAspectRatio="none"/><rect x="-11" y="-128" width="22" height="15" fill="none" stroke="#9AA3AA" stroke-width=".8"/>':'')+'</g></g>';
  s+='</g><g id="lsmk"></g>';
  // vetrata del bunker
  s+='<path d="M0 0H1280V96Q1100 70 640 74Q180 70 0 96Z" fill="#EDE3C2"/><path d="M0 96Q180 70 640 74Q1100 70 1280 96" fill="none" stroke="#B7B9B4" stroke-width="22"/>'+
    '<path d="M0 0L150 86V600L0 690Z" fill="#D7D9D6"/><path d="M1280 0L1130 86V600L1280 690Z" fill="#CDD0CC"/><path d="M150 86V600M1130 86V600" stroke="#B7B9B4" stroke-width="22"/>'+
    '<path d="M150 600H1130" stroke="#B7B9B4" stroke-width="22"/><path d="M161 92Q640 80 1119 92" stroke="#fff" stroke-width="2" opacity=".5" fill="none"/><path d="M200 120L300 110L230 300z" fill="#fff" opacity=".08"/>';
  // consolle
  s+='<rect x="-1600" y="0" width="1600" height="96" fill="#EDE3C2"/><rect x="1280" y="0" width="1600" height="96" fill="#EDE3C2"/><rect x="-1600" y="640" width="4480" height="160" fill="url(#lcon)"/>';
  s+='<path d="M0 640L150 608H1130L1280 640V800H0Z" fill="url(#lcon)"/><path d="M150 608H1130" stroke="#6B7680" stroke-width="3"/><path d="M60 690H1220" stroke="#20272E" stroke-width="2" opacity=".6"/>';
  const btn=(x,act,lab,fill,dis)=>'<g class="lbtn'+(dis?' dis':'')+'" data-act="'+act+'" transform="translate('+x+' 700)"><ellipse cx="0" cy="58" rx="132" ry="26" fill="#1E252B" opacity=".55"/><path d="M-118 0V46Q-118 72 0 72Q118 72 118 46V0Z" fill="'+fill+'" filter="brightness(.8)"/><path d="M-118 0V46Q-118 72 0 72Q118 72 118 46V0Z" fill="#000" opacity=".22"/><g class="lcap"><ellipse cx="0" cy="0" rx="118" ry="34" fill="'+fill+'"/><ellipse cx="-20" cy="-8" rx="70" ry="14" fill="#fff" opacity=".18"/><text x="0" y="9" text-anchor="middle" font-family="Barlow Condensed,Inter,sans-serif" font-weight="800" font-size="30" letter-spacing="3" fill="#fff">'+lab+'</text></g></g>';
  s+=btn(400,'xlaunch','LAUNCH','url(#lbtnL)',st.busy)+btn(880,'abort','ABORT','url(#lbtnA)',st.busy);
  // display centrale con durata e conto alla rovescia
  s+='<g transform="translate(640 690)"><rect x="-108" y="-50" width="216" height="100" rx="10" fill="#0F161C" stroke="#55606A" stroke-width="3"/><text x="0" y="-26" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="11" letter-spacing=".12em" fill="#7FD3EA">'+T(st.name).toUpperCase().slice(0,18)+'</text>'+
    '<text id="lcnt" x="0" y="8" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-weight="700" font-size="28" fill="#FFFFFF">'+T(st.cnt||'T-10')+'</text>'+
    '<g class="ldur'+(st.busy?' dis':'')+'"><g data-act="durm" class="lpm"><rect x="-100" y="20" width="30" height="24" rx="6" fill="#26313B"/><text x="-85" y="37" text-anchor="middle" font-size="18" font-weight="700" fill="#fff">−</text></g><text x="0" y="37" text-anchor="middle" font-family="Inter,sans-serif" font-weight="600" font-size="12.5" fill="#BFE6F2">'+T(st.dur)+' mesi</text><g data-act="durp" class="lpm"><rect x="70" y="20" width="30" height="24" rx="6" fill="#26313B"/><text x="85" y="37" text-anchor="middle" font-size="18" font-weight="700" fill="#fff">+</text></g></g></g>';
  s+='<text x="640" y="634" text-anchor="middle" font-family="Inter,sans-serif" font-weight="600" font-size="12" letter-spacing=".1em" fill="#AEB8C1">'+T(st.sub||'').toUpperCase()+'</text>';
  return s; }

// ===================== edifici sbloccabili (stesso stile isometrico) =====================
function isoImg(x,y,z,href,w){ const g=P(x,y,z); return '<image href="'+href+'" x="'+f1(g[0]-w/2)+'" y="'+f1(g[1]-w*.92)+'" width="'+w+'" height="'+w+'" preserveAspectRatio="xMidYMax meet"/>'; }
function rack(x,y,h,seed){ let s=rbox(x,y,x+.9,y+.8,0,h,'#2C343C'); const r=E.rng(seed||3); for(let i=0;i<9;i++){ const p=P(x+.9,y+.12+r()*.56,.2+i*(h-.4)/9); s+='<circle cx="'+f1(p[0])+'" cy="'+f1(p[1])+'" r="1.6" fill="'+(r()<.7?'#45D483':r()<.5?'#43D3E0':'#F2C14E')+'"/>'; } return s; }
function robotArm(x,y,ph){ const b=P(x,y,.35), sh=P(x,y,1.7), el=P(x+.9+.3*ph,y+.7,1.9), wr=P(x+1.5,y+1.2-.2*ph,1.0);
  return cyl(x,y,.5,0,.35,'#5D6B78')+cyl(x,y,.22,.35,1.7,'#EB7D44')+'<path d="M'+f1(sh[0])+' '+f1(sh[1])+'L'+f1(el[0])+' '+f1(el[1])+'L'+f1(wr[0])+' '+f1(wr[1])+'" stroke="#F28B50" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M'+f1(sh[0])+' '+f1(sh[1])+'L'+f1(el[0])+' '+f1(el[1])+'L'+f1(wr[0])+' '+f1(wr[1])+'" stroke="#FFB08A" stroke-width="3" stroke-linecap="round" fill="none" opacity=".6"/>'+
    [sh,el].map(p=>'<circle cx="'+f1(p[0])+'" cy="'+f1(p[1])+'" r="7" fill="#3A434D"/>').join('')+'<path d="M'+f1(wr[0]-6)+' '+f1(wr[1])+'l0 9M'+f1(wr[0]+6)+' '+f1(wr[1])+'l0 9" stroke="#3A434D" stroke-width="3" stroke-linecap="round"/>'; }
function ropePosts(pts){ let s=''; pts.forEach(p=>{ s+=cyl(p[0],p[1],.07,0,.85,'#B89A55'); }); for(let i=0;i<pts.length-1;i++){ const a=P(pts[i][0],pts[i][1],.8), b=P(pts[i+1][0],pts[i+1][1],.8); s+='<path d="M'+f1(a[0])+' '+f1(a[1])+'Q'+f1((a[0]+b[0])/2)+' '+f1((a[1]+b[1])/2+10)+' '+f1(b[0])+' '+f1(b[1])+'" stroke="#B03A3A" stroke-width="3" fill="none"/>'; } return s; }
function wallText(title,lines,bg,fg){ return '<rect width="300" height="160" rx="8" fill="'+(bg||'#FFFFFF')+'"/><text x="18" y="38" font-family="'+FD+'" font-weight="800" font-size="24" fill="'+(fg||SF.dark)+'">'+title+'</text>'+lines.map((l,i)=>'<rect x="18" y="'+(56+i*22)+'" width="'+l+'" height="9" rx="4" fill="'+(fg||SF.dark)+'" opacity=".22"/>').join(''); }
function fac(k,st){ bigCam(); MONO=0; const W=RW,D=RD,H=RH; let s=DEFS+HUDDEF; const L=[]; st=st||{};
  if(k==='factory'){
    s+=roomShell(W,D,H,{floor:'#B6BBBE',tile:1,tileC:'#ABB0B3',wallR:'#ECEBE5',wallL:'#E0DFD7',stripe:[1.2,SF.orange],cap:'#46525A',floorFx:hazard(1.6,5.3,16.4,7.7)+poly(gp([[1.5,10.6],[16.5,10.6],[16.5,10.85],[1.5,10.85]]),'fill="#F2C14E"')});
    s+=winGrid(.5,0,10.5,0,1.8,3.3,1,12,{ribbon:1,sill:.05,wh:.85})+rollDoor(12,16.8,2.7);
    s+=wallG('x0',.8,6,1.4,3.1,520,170,hudScreen(520,170,'bars',3))+wallG('x0',6.6,11,1.4,3.1,440,170,hudScreen(440,170,'chart',5));
    L.push([2+6.5,rbox(2,5.8,16,7.2,0,.7,'#4A545C')+rbox(2,5.9,16,7.1,.7,.78,'#2E353B')+[...Array(14)].map((_,i)=>rbox(2.3+i,5.86,2.42+i,7.14,.78,.8,'#6C767E')).join('')]);
    const sats=st.sats||[]; [3.4,8,12.6].forEach((x,i)=>{ const m=sats[i]; L.push([x+6.5+1.2,m&&m.img?isoImg(x+.6,6.5,.8,m.img,86):cubesat(x,6.1,.8,1.1,{wings:i===2,n:3+i})]); if(m) L.push([x+6.5+1.3,tag(x+.6,6.5,2.5,m.label,SF.orange)]); });
    [[6,4.4,0],[10.6,4.4,1],[13.6,8.6,0]].forEach(([x,y,p])=>L.push([x+y+.4,robotArm(x,y,p)]));
    L.push([.4+.3+1.6,shelfRack(.4,.3,3.4,.9,2.6,3,['#F28B50','#7C8CFF','#4DB8E8','#DDE2E6'])]);
    L.push([.3+1.6+2,shelfRack(.3,1.6,.9,3,2.6,3,['#6CC4A1','#F0B43A','#B783E3'],1)]);
    L.push([14.5+11.6,forklift(14.5,11.2)]);
    [[5.2,8.6,{vest:'#EB7D44',helmet:'#F2C14E',top:'#2E4A5E',hair:'#1C1714',skin:'#C99673'}],[9.2,8.9,{vest:'#EB7D44',helmet:'#F2C14E',top:'#4F6B48',skin:'#F0D3B8',dir:-1,walk:1}],[3.2,4.4,{coat:1,top:'#F7F8F6',hair:'#8A8A8A'}],[15.8,4.6,{vest:'#EB7D44',helmet:'#F2C14E',top:'#2E4A5E',skin:'#6E4630',walk:1}]].forEach(p=>L.push([p[0]+p[1],fig(p[0],p[1],Object.assign({s:FS},p[2]))]));
    L.push([2.8+11.8,desk(1.6,11,3.6,12.6,.82,'#F2F1EC')+monitor(3.5,11.4,.84,.6,.4,'x','#6FB7D6')+monitor(3.5,12.1,.84,.6,.4,'x','#8FD0A8')]); L.push([2.8+12.3,fig(2.4,11.8,{s:FS,top:'#3F6FB0',hair:'#6B4A30'})]);
    L.push([99,tag(9,6.5,3.2,'Linea di integrazione · tempi dimezzati',SF.orange)]);
    return s+depth(L)+frontCut(W,D,{wallR:'#ECEBE5',cap:'#46525A'}); }
  if(k==='ground'){
    s+=roomShell(W,D,H,{floor:'#7E878F',tile:1.2,tileC:'#747C84',wallR:'#D9DDE0',wallL:'#CDD2D6',stripe:[1.1,'#43D3E0'],cap:'#2A323A',capSide:'#A9AFB5'});
    s+=wallG('y0',1.5,12.5,1.1,3.3,1100,220,hudScreen(1100,220,'globe',4))+wallG('y0',13,17,1.6,3.3,400,170,'<rect width="400" height="170" fill="#0B141C"/><text x="20" y="44" font-family="DejaVu Sans Mono,monospace" font-size="26" fill="#43D3E0">ANTENNE '+(st.dishes||0)+'/6</text><text x="20" y="90" font-family="DejaVu Sans Mono,monospace" font-size="22" fill="#9EE6B8">DATI +'+(20+3*(st.dishes||0))+'%</text><text x="20" y="130" font-family="DejaVu Sans Mono,monospace" font-size="22" fill="#FFE08A">AGGANCIO RADIO '+(60+5*(st.dishes||0))+'%</text>');
    for(let i=0;i<6;i++) L.push([.3+1+i*1.9+.5,rack(.3,1+i*1.9,2.5,i+2)]);
    [[4.2,5.2],[4.2,8.2],[4.2,11.2]].forEach(([x,y],r)=>{ for(let c=0;c<4;c++){ const xx=x+c*2.8; L.push([xx+y+1.4,desk(xx,y,xx+2.4,y+1,.78,'#E9ECEE')+monitor(xx+.6,y+.1,.8,.6,.42,'y',['#7CC3E0','#F2F6F8','#1B2530'][(c+r)%3])+monitor(xx+1.6,y+.1,.8,.6,.42,'y',['#1B2530','#7CC3E0','#F2F6F8'][(c+r)%3])]); if((c+r)%2===0) L.push([xx+y+2,seated(xx+1.2,y+1.5,{s:SS,top:['#5E6F8A','#E8E6DF','#7A3E58','#3F6FB0'][c],skin:['#E8C3A0','#9C6B4A','#F0D3B8','#C99673'][(c+r)%4],hair:['#2E241E','#1C1714','#B98A4E','#6B4A30'][c],headset:1})]); } });
    L.push([15.6+12.6,cyl(15.6,12.4,.5,0,.9,'#C9CED2')+cyl(15.6,12.4,.12,.9,1.6,'#9AA2A8')+(()=>{ const c=P(15.6,12.4,2.1); return '<ellipse cx="'+f1(c[0])+'" cy="'+f1(c[1])+'" rx="40" ry="18" fill="#F4F3EF" stroke="#C9CBC5" stroke-width="2" transform="rotate(-25 '+f1(c[0])+' '+f1(c[1])+')"/><path d="M'+f1(c[0])+' '+f1(c[1])+'l10 -26" stroke="#9AA2A8" stroke-width="2"/>'; })()]);
    L.push([16+13.4,tag(15.6,12.4,3.1,'Modello dell’antenna',SF.teal)]);
    return s+depth(L)+frontCut(W,D,{wallR:'#D9DDE0',cap:'#2A323A'}); }
  if(k==='rnd'){
    s+=roomShell(W,D,H,{floor:'#E6E9EA',tile:.9,tileC:'#D9DDDF',wallR:'#F4F6F6',wallL:'#E9EDEE',stripe:[1.2,'#8E5BB0'],cap:'#4E5560'});
    s+=winGrid(6,0,17.4,0,1.2,3.1,1,11,{ribbon:1,sill:.05,wh:.9});
    s+=wallG('y0',.6,5.4,1.1,3,460,180,'<rect width="460" height="180" rx="6" fill="#FFFFFF" stroke="#C9CED2" stroke-width="4"/><path d="M30 120q40-80 80-20t80-30M220 40h80M220 60h120M220 80h60" stroke="#3F6FB0" stroke-width="4" fill="none"/><circle cx="380" cy="110" r="34" fill="none" stroke="#EB7D44" stroke-width="4"/><path d="M350 140l60-60" stroke="#EB7D44" stroke-width="3"/><text x="30" y="160" font-family="'+FT+'" font-size="18" fill="#4E5560">ΔV = Isp·g·ln(m0/m1)</text>');
    s+=wallG('x0',1,6,1.2,3,480,170,hudScreen(480,170,'grid',6))+wallG('x0',6.6,11.6,1.2,3,480,170,hudScreen(480,170,'chart',7));
    [[1.4,3.6],[1.4,7.6],[7.4,3.6],[7.4,7.6]].forEach(([x,y],i)=>{ L.push([x+y+2,desk(x,y,x+4,y+1.4,.9,'#F7F7F4')+cyl(x+.8,y+.7,.18,.9,1.2,'#5D6B78')+cyl(x+.8,y+.7,.07,1.2,1.55,'#3A434D')+rbox(x+1.8,y+.3,x+2.6,y+1.1,.9,1.5,'#DCE6EA')+rbox(x+1.85,y+.35,x+2.55,y+1.05,.95,1.45,'#BFE2EE')+monitor(x+3.6,y+.6,.92,.6,.4,'x','#8FD0A8')]); L.push([x+y+2.6,fig(x+2,y+2,{s:FS,coat:1,top:['#3F6FB0','#7A3E58','#4F6B48','#C7643E'][i],hair:['#6B4A30','#1C1714','#B98A4E','#2E241E'][i],skin:['#E8C3A0','#9C6B4A','#F0D3B8','#C99673'][i],dir:i%2?-1:1})]); });
    L.push([14.8+9.8,cyl(14.8,9.8,1.1,0,.2,'#C9D3DD')+cyl(14.8,9.8,.25,.2,1,'#9AA9B6')+rbox(14.2,9.2,15.4,10.4,1,1.07,'#D9E0E5')+(st.proto?isoImg(14.8,9.8,1.07,st.proto,110):cubesat(14.5,9.5,1.07,1.4,{wings:1,n:5}))]);
    L.push([15.2+10.4,tag(14.8,9.8,3.1,'Prototipo in prova',SF.teal)]);
    L.push([13+4,rbox(12.2,3.4,14.2,5,0,1.4,'#E9EEF2')+rbox(12.35,3.55,14.05,4.85,.4,1.25,'#BFE2EE')+rbox(12.9,4,13.5,4.4,.4,.7,'#EB7D44')]); L.push([13.2+5.4,tag(13.2,4.2,1.9,'Stampante 3D','#8E5BB0')]);
    return s+depth(L)+frontCut(W,D,{wallR:'#F4F6F6',cap:'#4E5560'}); }
  if(k==='office'){
    s+=roomShell(W,D,H,{floor:'#C9BBA6',tile:1.6,tileC:'#BFB09A',wallR:'#F4F1EA',wallL:'#ECE8DE',stripe:[1.1,SF.teal],cap:'#46525A'});
    s+=winGrid(9.5,0,17.4,0,1.1,3.2,1,8,{ribbon:1,sill:.05,wh:.9});
    const logos=(st.logos||[]).slice(0,12); s+=wallG('y0',.6,8.8,1.2,3.2,820,200,'<rect width="820" height="200" rx="8" fill="#22313B"/><text x="20" y="34" font-family="'+FD+'" font-weight="800" font-size="22" letter-spacing="3" fill="#FFFFFF">I NOSTRI PARTNER</text>'+logos.map((l,i)=>{ const x=50+(i%6)*130, y=90+Math.floor(i/6)*70; return '<circle cx="'+x+'" cy="'+y+'" r="26" fill="'+l.c+'"'+(l.on?'':' opacity=".35"')+'/><text x="'+x+'" y="'+(y+6)+'" text-anchor="middle" font-family="'+FT+'" font-weight="800" font-size="15" fill="#fff">'+l.t+'</text>'; }).join(''));
    s+=wallG('x0',1,6.5,1.2,3,520,180,hudScreen(520,180,'bars',8));
    [[2.4,4.6],[2.4,8.6],[6.6,4.6],[6.6,8.6]].forEach(([x,y],i)=>{ L.push([x+y+1.6,desk(x,y,x+3.2,y+1.6,.76,'#F7F4EE')+monitor(x+.9,y+.1,.8,.6,.4,'y','#7CC3E0')+monitor(x+2.3,y+.1,.8,.6,.4,'y','#F2F6F8')]); L.push([x+y+2.2,seated(x+1.2,y+2,{s:SS,top:['#3F6FB0','#7A3E58','#4F6B48','#C7643E'][i],skin:['#E8C3A0','#9C6B4A','#F0D3B8','#C99673'][i],hair:['#6B4A30','#1C1714','#B98A4E','#2E241E'][i]})]); });
    L.push([13.6+9.6,prism(circ(13.6,9.4,1.6,28),0,.74,'#F7F4EE')+[0,1,2,3,4,5].map(i=>{ const a=i/6*6.283, x=13.6+Math.cos(a)*2.1, y=9.4+Math.sin(a)*2.1; return rbox(x-.25,y-.25,x+.25,y+.25,0,.9,'#3E4A55'); }).join('')]);
    L.push([14+10.4,fig(15.2,11.2,{s:FS,top:'#2E4A5E',hair:'#1C1714',skin:'#9C6B4A'})]); L.push([14+10.6,fig(12,11,{s:FS,top:'#EB7D44',hair:'#B98A4E',dir:-1})]);
    L.push([16.4+3,rbox(14.4,2.4,17.4,3.6,0,.45,'#45A9A3')+rbox(14.4,2.4,17.4,2.75,.45,.9,'#3F948E')]); L.push([1+1.4,plant(1.2,1.4)]); L.push([17+12.8,plant(17,12.8)]);
    return s+depth(L)+frontCut(W,D,{wallR:'#F4F1EA',cap:'#46525A'}); }
  // centro visitatori
  s+=roomShell(W,D,H,{floor:'#E9E6DF',tile:2,tileC:'#DEDAD1',wallR:'#F6F5F1',wallL:'#EEECE6',stripe:[2.9,SF.orange],cap:'#46525A'});
  s+=wallG('y0',.6,5.6,1.2,2.8,300,160,wallText('Dalla Terra all’orbita',[240,200,220,170]))+wallG('y0',11,16,1.2,2.8,300,160,wallText('Le nostre missioni',[220,240,190,200],'#22313B','#FFFFFF'))+wallG('x0',1,7,1.1,3.1,560,190,hudScreen(560,190,'sat',9));
  L.push([8.8+3+1,cyl(8.8,3,1.1,0,.25,'#C9CED2')+cyl(8.8,3,.36,.25,3.0,'#F7F7F4')+cyl(8.8,3,.36,1.6,1.75,SF.orange)+(()=>{ const a=P(8.8,3,3.0), b=P(8.8,3,3.6); return '<path d="M'+f1(a[0]-10)+' '+f1(a[1])+'Q'+f1(b[0])+' '+f1(b[1]-40)+' '+f1(a[0]+10)+' '+f1(a[1])+'Z" fill="#F7F7F4" stroke="#C9CCCB"/>'; })()+cyl(9.6,3.6,.16,.25,1.8,'#ECECE8')+cyl(8,3.6,.16,.25,1.8,'#ECECE8')]);
  L.push([9+4.2,tag(8.8,3,3.9,'Razzo in scala 1:20',SF.orange)]);
  const sats=(st.sats||[]).slice(0,5); [[3.4,9],[6.8,10.4],[10.4,10.4],[13.8,9],[15.6,5.6]].forEach(([x,y],i)=>{ const m=sats[i]; L.push([x+y+.6,cyl(x,y,.55,0,.9,'#FFFFFF')+cyl(x,y,.58,.9,.98,'#DCD8CF')+(m&&m.img?isoImg(x,y,.98,m.img,90):m?cubesat(x-.3,y-.3,.98,1,{wings:1,n:5}):'')]); L.push([x+y+.7,tag(x,y,m?2.7:1.6,m?m.label:'teca vuota',m?SF.teal:'#9A9A90')]); });
  L.push([12+12.4,ropePosts([[2.4,12.2],[6,12.6],[9.6,12.6],[13.2,12.6],[16.4,12.2]])]);
  [[5.2,7.2,{top:'#3F6FB0',walk:1}],[11.8,7.6,{top:'#C7643E',hair:'#B98A4E',dir:-1}],[8.4,12,{top:'#4F6B48',walk:1,dir:-1}],[15,10.8,{top:'#7A3E58',hair:'#1C1714',skin:'#9C6B4A'}],[3,5.2,{top:'#F0B43A',hair:'#6B4A30',walk:1}]].forEach(p=>L.push([p[0]+p[1],fig(p[0],p[1],Object.assign({s:FS},p[2]))]));
  return s+depth(L)+frontCut(W,D,{wallR:'#F6F5F1',cap:'#46525A'}); }

let WEXTRA=[];
function depth(list){ const l=list.concat(WEXTRA.map(w=>[w.d,w.svg,1])); WEXTRA=[]; return l.sort((a,b)=>a[0]-b[0]).map(x=>x[2]?x[1]:'<g class="dz" data-d="'+(+x[0]).toFixed(3)+'">'+x[1]+'</g>').join(''); }
return { setWalkers:a=>{ WEXTRA=a||[]; }, P:(x,y,z)=>{ bigCam(); return P(x,y,z||0); }, dims:[RW,RD], inArc, fac, launchScene, meet, MSEAT, lookOf, build, clean, test, mcc, mccWallBack, valid, toGrid, FOOT, ghost:(r,g)=>{ bigCam(); return ghostOf(r,{ghost:g}); }, view:'150 60 1000 620' };
})();

