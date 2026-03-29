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
