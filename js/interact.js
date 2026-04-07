// ── HIGHLIGHT ─────────────────────────────────────────────────────────────
// Store rendered positions for click detection
let lastHitZones=[];

function registerHitZones(zones){lastHitZones=zones;}

function initClickHandler(){
  const cv=document.getElementById('cv');
  cv.addEventListener('click',function(e){
    const rect=cv.getBoundingClientRect();
    const scaleX=cv.width/rect.width, scaleY=cv.height/rect.height;
    const mx=(e.clientX-rect.left)*scaleX;
    const my=(e.clientY-rect.top)*scaleY;
    let hit=-1;
    for(let i=0;i<lastHitZones.length;i++){
      const z=lastHitZones[i];
      if(mx>=z.x&&mx<=z.x+z.w&&my>=z.y&&my<=z.y+z.h){hit=z.idx;break;}
    }
    if(hit>=0&&S.highlight===hit) S.highlight=null;
    else if(hit>=0) S.highlight=hit;
    else S.highlight=null;
    sched();
  });
}

// ── REVERSE DATA ORDER ───────────────────────────────────────────────────
function reverseData(){
  S.data.reverse();
  sched();
}

function transposeData(){
  const ta=document.getElementById('di');
  const raw=ta.value.trim();
  if(!raw) return;
  // Split into rows, detect delimiter
  const lines=raw.split('\n').filter(l=>l.trim());
  if(lines.length<2) return;
  const delim=lines[0].includes('\t')?'\t':lines[0].includes(';')?';':',';
  const grid=lines.map(l=>l.split(delim).map(c=>c.trim()));
  // Transpose
  const maxCols=Math.max(...grid.map(r=>r.length));
  const transposed=[];
  for(let c=0;c<maxCols;c++){
    const row=[];
    for(let r=0;r<grid.length;r++){
      row.push(grid[r][c]||'');
    }
    transposed.push(row);
  }
  ta.value=transposed.map(r=>r.join(delim)).join('\n');
  parseData();
}

// ── URL SHARE ────────────────────────────────────────────────────────────
function shareURL(){
  const cfg={
    ct:S.ct,pal:S.pal,fmt:S.fmt,
    ttl:document.getElementById('ttl').value,
    ey:document.getElementById('eyebrow').value,
    sub:document.getElementById('sub').value,
    bron:document.getElementById('bron').value,
    datum:document.getElementById('datum').value,
    note:document.getElementById('note')?.value||'',
    srt:document.getElementById('srt').value,
    mr:document.getElementById('mr').value,
    unit:document.getElementById('unit').value,
    disp:(document.getElementById('dispmode')||{}).value||'abs',
    br:document.getElementById('fg-br').value,
    grid:document.getElementById('fg-grid').checked?1:0,
    val:document.getElementById('fg-val').checked?1:0,
    xl:document.getElementById('fg-xl').checked?1:0,
    data:document.getElementById('di').value,
  };
  const hash='#'+btoa(unescape(encodeURIComponent(JSON.stringify(cfg))));
  const url=location.origin+location.pathname+hash;
  navigator.clipboard.writeText(url).then(()=>{
    const btn=document.querySelector('[onclick="shareURL()"]');
    const orig=btn.textContent;
    btn.textContent='✓ Gekopieerd';
    setTimeout(()=>{btn.textContent=orig;},1500);
  });
}

function loadFromURL(){
  if(!location.hash||location.hash.length<2)return false;
  try{
    const json=decodeURIComponent(escape(atob(location.hash.slice(1))));
    const c=JSON.parse(json);
    if(c.ttl!==undefined) document.getElementById('ttl').value=c.ttl;
    if(c.ey!==undefined) document.getElementById('eyebrow').value=c.ey;
    if(c.sub!==undefined) document.getElementById('sub').value=c.sub;
    if(c.bron!==undefined) document.getElementById('bron').value=c.bron;
    if(c.datum!==undefined) document.getElementById('datum').value=c.datum;
    if(c.note!==undefined&&document.getElementById('note')) document.getElementById('note').value=c.note;
    if(c.srt) document.getElementById('srt').value=c.srt;
    if(c.mr) document.getElementById('mr').value=c.mr;
    if(c.unit) document.getElementById('unit').value=c.unit;
    if(c.disp&&document.getElementById('dispmode')) document.getElementById('dispmode').value=c.disp;
    if(c.br) document.getElementById('fg-br').value=c.br;
    if(c.grid!==undefined) document.getElementById('fg-grid').checked=!!c.grid;
    if(c.val!==undefined) document.getElementById('fg-val').checked=!!c.val;
    if(c.xl!==undefined) document.getElementById('fg-xl').checked=!!c.xl;
    if(c.data) document.getElementById('di').value=c.data;
    setCT(c.ct||'bar');setPal(c.pal||'blauw');setFmt(c.fmt||'ig_post');
    parseData();
    return true;
  }catch(e){return false;}
}

// ── COPY TO CLIPBOARD ────────────────────────────────────────────────────
function copyToClipboard(){
  draw();
  const cv=document.getElementById('cv');
  cv.toBlob(function(blob){
    navigator.clipboard.write([new ClipboardItem({'image/png':blob})]).then(()=>{
      const btn=document.querySelector('[onclick="copyToClipboard()"]');
      const orig=btn.textContent;
      btn.textContent='✓ Gekopieerd';
      setTimeout(()=>{btn.textContent=orig;},1500);
    }).catch(()=>alert('Kopiëren mislukt — gebruik Download'));
  });
}

// ── CUSTOM COLOR ─────────────────────────────────────────────────────────
function setCustomClr(v){
  if(!v||!v.match(/^#[0-9a-fA-F]{3,8}$/)){S.customClr=null;sched();return;}
  S.customClr=v;
  document.getElementById('cc-pick').value=v;
  document.getElementById('cc-hex').value=v;
  sched();
}

function clearCustomClr(){
  S.customClr=null;
  document.getElementById('cc-hex').value='';
  sched();
}

// ── TRENDLINE ─────────────────────────────────────────────────────────────
function drawTrend(ctx,data,ci,xPts,yFn,O){
  const {W,p}=O;
  const n=data.length;if(n<2)return;
  // Linear regression
  const vals=data.map(d=>d.values[ci]||0);
  let sx=0,sy=0,sxy=0,sx2=0;
  for(let i=0;i<n;i++){sx+=i;sy+=vals[i];sxy+=i*vals[i];sx2+=i*i;}
  const slope=(n*sxy-sx*sy)/(n*sx2-sx*sx);
  const intercept=(sy-slope*sx)/n;

  ctx.strokeStyle=p.acc+'90';
  ctx.lineWidth=Math.max(2,W*0.003);
  ctx.setLineDash([W*0.008,W*0.006]);
  ctx.beginPath();
  ctx.moveTo(xPts[0],yFn(intercept));
  ctx.lineTo(xPts[n-1],yFn(slope*(n-1)+intercept));
  ctx.stroke();
  ctx.setLineDash([]);
}

// ── MOVING AVERAGE ───────────────────────────────────────────────────────
function drawMA(ctx,data,ci,xPts,yFn,O,window){
  const {W,p}=O;
  const n=data.length;if(n<window)return;
  const vals=data.map(d=>d.values[ci]||0);
  const ma=[];
  for(let i=0;i<n;i++){
    if(i<window-1){ma.push(null);continue;}
    let sum=0;for(let j=i-window+1;j<=i;j++)sum+=vals[j];
    ma.push(sum/window);
  }
  ctx.strokeStyle=p.muted;
  ctx.lineWidth=Math.max(2,W*0.003);
  ctx.setLineDash([W*0.006,W*0.004]);
  ctx.beginPath();
  let started=false;
  ma.forEach((v,i)=>{
    if(v===null)return;
    if(!started){ctx.moveTo(xPts[i],yFn(v));started=true;}
    else ctx.lineTo(xPts[i],yFn(v));
  });
  ctx.stroke();
  ctx.setLineDash([]);
}
