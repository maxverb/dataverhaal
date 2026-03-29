// ── REFERENCE LINE ───────────────────────────────────────────────────────
function drawRefLine(ctx,refVal,refLbl,x,glW,w,yFn,O){
  const {W,p}=O;
  if(isNaN(refVal))return;
  const ry=yFn(refVal);
  ctx.strokeStyle=p.acc;
  ctx.lineWidth=Math.max(2,W*0.003);
  ctx.setLineDash([W*0.008,W*0.005]);
  ctx.beginPath();ctx.moveTo(x+glW,ry);ctx.lineTo(x+w,ry);ctx.stroke();
  ctx.setLineDash([]);
  if(refLbl){
    const sz=W*0.014;
    ctx.font=`600 ${sz}px Barlow`;ctx.fillStyle=p.acc;
    ctx.textAlign='right';ctx.textBaseline='bottom';
    ctx.fillText(refLbl+': '+fmtN(refVal),x+w,ry-W*0.004);
  }
}

// ── AVERAGE LINE ─────────────────────────────────────────────────────────
function drawAvgLine(ctx,data,ci,x,glW,w,yFn,O){
  const {W,p}=O;
  const vals=data.map(d=>d.values[ci]||0);
  const avg=vals.reduce((s,v)=>s+v,0)/vals.length;
  const ay=yFn(avg);
  ctx.strokeStyle=p.muted;
  ctx.lineWidth=Math.max(1.5,W*0.002);
  ctx.setLineDash([W*0.005,W*0.005]);
  ctx.beginPath();ctx.moveTo(x+glW,ay);ctx.lineTo(x+w,ay);ctx.stroke();
  ctx.setLineDash([]);
  const sz=W*0.013;
  ctx.font=`500 ${sz}px Barlow`;ctx.fillStyle=p.muted;
  ctx.textAlign='right';ctx.textBaseline='bottom';
  ctx.fillText('Gem: '+fmtN(avg),x+w,ay-W*0.003);
}

// ── PERCENTAGE CHANGE LABELS ─────────────────────────────────────────────
function drawPctChange(ctx,data,ci,positions,O){
  const {W,p}=O;
  const sz=Math.max(W*0.012,9);
  ctx.font=`600 ${sz}px Barlow`;ctx.textAlign='center';ctx.textBaseline='top';
  for(let i=1;i<data.length;i++){
    const prev=data[i-1].values[ci]||0;
    const cur=data[i].values[ci]||0;
    if(!prev)continue;
    const pct=Math.round((cur-prev)/prev*100);
    const sign=pct>0?'+':'';
    ctx.fillStyle=pct>=0?'#16a34a':'#dc2626';
    const px=positions[i].x!==undefined?positions[i].x:positions[i].px;
    const py=(positions[i].y!==undefined?positions[i].y:positions[i].py)+W*0.002;
    ctx.fillText(sign+pct+'%',px,py);
  }
}

// ── ANNOTATION ARROWS ────────────────────────────────────────────────────
function drawAnnotations(ctx,annots,positions,O){
  const {W,p}=O;
  if(!annots||!Object.keys(annots).length)return;
  Object.entries(annots).forEach(([idx,txt])=>{
    const i=parseInt(idx);
    if(i<0||i>=positions.length)return;
    const pos=positions[i];
    const px=pos.x!==undefined?pos.x:pos.px;
    const py=pos.y!==undefined?pos.y:pos.py;

    // Arrow from above
    const sz=W*0.013;
    ctx.font=`600 ${sz}px Barlow`;
    const tw=ctx.measureText(txt).width;
    const bx=px-tw/2-W*0.008;
    const by=py-W*0.055;
    const bw=tw+W*0.016;
    const bh=sz*1.8;

    // Tooltip box
    ctx.fillStyle=p.text;
    rrect(ctx,bx,by,bw,bh,W*0.004);ctx.fill();
    ctx.fillStyle=p.bg;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(txt,px,by+bh/2);

    // Arrow line
    ctx.strokeStyle=p.text;ctx.lineWidth=Math.max(1.5,W*0.002);
    ctx.beginPath();ctx.moveTo(px,by+bh);ctx.lineTo(px,py-W*0.005);ctx.stroke();

    // Arrow tip
    ctx.fillStyle=p.text;ctx.beginPath();
    ctx.moveTo(px,py-W*0.003);
    ctx.lineTo(px-W*0.004,py-W*0.01);
    ctx.lineTo(px+W*0.004,py-W*0.01);
    ctx.closePath();ctx.fill();
  });
}
