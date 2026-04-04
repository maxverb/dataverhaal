// ── CANVAS HELPERS ─────────────────────────────────────────────────────────

function rrect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

function rbar(ctx,x,y,w,h,tR,bR){
  if(h<=0||w<=0)return;
  ctx.beginPath();
  ctx.moveTo(x+tR,y);ctx.lineTo(x+w-tR,y);ctx.quadraticCurveTo(x+w,y,x+w,y+tR);
  ctx.lineTo(x+w,y+h-bR);ctx.quadraticCurveTo(x+w,y+h,x+w-bR,y+h);
  ctx.lineTo(x+bR,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-bR);
  ctx.lineTo(x,y+tR);ctx.quadraticCurveTo(x,y,x+tR,y);
  ctx.closePath();ctx.fill();
}

// Horizontal bar: rounded on the RIGHT side only
function rbarH(ctx,x,y,w,h,rr){
  if(h<=0||w<=0)return;
  ctx.beginPath();
  ctx.moveTo(x,y);
  ctx.lineTo(x+w-rr,y);ctx.quadraticCurveTo(x+w,y,x+w,y+rr);
  ctx.lineTo(x+w,y+h-rr);ctx.quadraticCurveTo(x+w,y+h,x+w-rr,y+h);
  ctx.lineTo(x,y+h);
  ctx.closePath();ctx.fill();
}

// ── TEXT HELPERS ───────────────────────────────────────────────────────────

function wrap(ctx,text,maxW){
  const words=text.split(' '),lines=[];let ln='';
  words.forEach(w=>{
    const t=ln?ln+' '+w:w;
    if(ctx.measureText(t).width>maxW&&ln){lines.push(ln);ln=w;}
    else ln=t;
  });
  if(ln)lines.push(ln);
  const out=[];
  lines.forEach(l=>{
    while(ctx.measureText(l).width>maxW&&l.length>1){
      let i=l.length;
      while(i>1&&ctx.measureText(l.slice(0,i)).width>maxW)i--;
      out.push(l.slice(0,i));l=l.slice(i);
    }
    if(l)out.push(l);
  });
  return out;
}

function trunc(ctx,text,maxW){
  if(ctx.measureText(text).width<=maxW)return text;
  let t=text;while(t.length>1&&ctx.measureText(t+'…').width>maxW)t=t.slice(0,-1);return t+'…';
}

const MAAND=['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
function shortLabel(lbl){
  let m=lbl.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if(m) return parseInt(m[1],10)+' '+MAAND[parseInt(m[2],10)-1];
  m=lbl.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if(m) return parseInt(m[3],10)+' '+MAAND[parseInt(m[2],10)-1];
  return lbl;
}

// ── NUMBER HELPERS ────────────────────────────────────────────────────────

function niceTicks(min,max,count){
  const range=max-min||1;
  const step=niceN(range/count);
  const start=Math.ceil(min/step)*step;
  const out=[];
  for(let v=start;v<=max+step*0.001;v+=step)out.push(parseFloat(v.toFixed(10)));
  return out;
}

function niceN(n){
  const e=Math.floor(Math.log10(Math.abs(n)||1));
  const f=n/Math.pow(10,e);
  if(f<=1)return Math.pow(10,e);
  if(f<=2)return 2*Math.pow(10,e);
  if(f<=5)return 5*Math.pow(10,e);
  return 10*Math.pow(10,e);
}

function fmtN(n){
  const u=document.getElementById('unit').value;
  if(u==='auto'){
    if(Math.abs(n)>=1e6)return(n/1e6).toFixed(1).replace('.0','')+'M';
    if(Math.abs(n)>=1e3)return(n/1e3).toFixed(1).replace('.0','')+'k';
    if(Number.isInteger(n))return n.toString();
    return n.toFixed(1);
  }
  let v;
  if(u==='k') v=(n/1e3).toFixed(1).replace('.0','')+'k';
  else if(u==='M') v=(n/1e6).toFixed(1).replace('.0','')+'M';
  else{v=Number.isInteger(n)?n.toString():n.toFixed(1);}
  if(u==='pct') return v+'%';
  if(u==='eur') return '€'+v;
  if(u==='usd') return '$'+v;
  return v;
}
