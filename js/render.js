// ── SHARED CHART RENDERING ─────────────────────────────────────────────────

function drawGrid(ctx,x,y,w,cH,minV,maxV,count,glW,O){
  const {W,p}=O;
  const ticks=niceTicks(minV,maxV,count);
  const range=maxV-minV||1;
  const sz=W*0.016;
  ctx.font=`400 ${sz}px Barlow`;
  ctx.strokeStyle=p.muted+'70';
  ctx.lineWidth=Math.max(1.5,W*0.0014);
  ctx.setLineDash([]);
  ticks.forEach(t=>{
    const ty=y+cH-((t-minV)/range)*cH;
    ctx.beginPath();ctx.moveTo(x+glW,ty);ctx.lineTo(x+w,ty);ctx.stroke();
    ctx.fillStyle=p.muted;ctx.textAlign='right';ctx.textBaseline='middle';
    ctx.fillText(fmtN(t),x+glW-W*0.006,ty);
  });
  ctx.setLineDash([]);
}

function drawLegend(ctx,cols,colNames,p,W,x,y){
  const sz=Math.max(W*0.016,11);
  ctx.font=`600 ${sz}px Barlow`;
  let lx=x;
  cols.forEach((ci,j)=>{
    const col=p.bars[j%p.bars.length];
    ctx.fillStyle=col;
    ctx.fillRect(lx,y,sz*0.8,sz*0.8);
    ctx.fillStyle=p.muted;ctx.textAlign='left';ctx.textBaseline='middle';
    const name=colNames[ci]||'Kolom '+(ci+1);
    ctx.fillText(name,lx+sz*1.1,y+sz*0.4);
    lx+=ctx.measureText(name).width+sz*2;
  });
}

// ── MAIN DRAW ──────────────────────────────────────────────────────────────

function sched(){clearTimeout(rt);rt=setTimeout(draw,25);}

function draw(){
  const cv=document.getElementById('cv');
  const f=FMT[S.fmt];
  cv.width=f.w; cv.height=f.h;
  const ctx=cv.getContext('2d');
  const W=f.w, H=f.h;
  const ar=W/H;
  const sf=ar>1.5?0.64:ar>1.2?0.85:1;

  let p={...PAL[S.pal]};
  if(S.lay==='omgekeerd'&&S.pal!=='donker'){
    p={...p, bg:'#0F172A', text:'#F1F5F9', muted:'#94A3B8'};
  }

  const padPct = S.lay==='strak' ? 0.063 : 0.07;
  const px=W*padPct;

  ctx.fillStyle=p.bg;
  ctx.fillRect(0,0,W,H);

  if(S.lay==='kader'){
    const m=W*0.035, rr=W*0.018;
    ctx.strokeStyle=p.acc;
    ctx.lineWidth=Math.max(3,W*0.005);
    rrect(ctx,m,m,W-2*m,H-2*m,rr);
    ctx.stroke();
  }

  const eyebrow=document.getElementById('eyebrow').value;
  const title=document.getElementById('ttl').value;
  const subtitle=document.getElementById('sub').value;
  const showGrid=document.getElementById('fg-grid').checked;
  const showVal=document.getElementById('fg-val').checked;
  const showXL=document.getElementById('fg-xl').checked;
  const showBr=document.getElementById('fg-br').checked;
  const bron=document.getElementById('bron').value;
  const datum=document.getElementById('datum').value;
  const oneClr=true;

  let cy=H*0.064;

  if(eyebrow){
    const sz=W*0.024*sf;
    ctx.font=`600 ${sz}px Barlow`;ctx.fillStyle=p.acc;ctx.textAlign='left';ctx.textBaseline='top';
    ctx.fillText(eyebrow.toUpperCase(),px,cy);
    cy+=sz*1.35;
    if(S.lay==='lijn'){
      ctx.fillStyle=p.acc;
      ctx.fillRect(px,cy,W-2*px,Math.max(4,W*0.006));
      cy+=W*0.014;
    }
  }

  if(title){
    const sz=(S.lay==='strak'?W*0.055:W*0.052)*sf;
    ctx.font=`700 ${sz}px Sora`;ctx.fillStyle=p.text;ctx.textAlign='left';ctx.textBaseline='top';
    wrap(ctx,title,W-2*px).forEach(l=>{ctx.fillText(l,px,cy);cy+=sz*1.2;});
  }

  if(subtitle){
    const sz=W*0.026*sf;
    cy+=sz*0.3;
    ctx.font=`400 ${sz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='left';ctx.textBaseline='top';
    wrap(ctx,subtitle,W-2*px).forEach(l=>{ctx.fillText(l,px,cy);cy+=sz*1.4;});
    cy+=sz*0.3;
  }

  const chartTop=cy+(title?W*0.025:0);
  const botMargin=showBr?0.09:0.05;
  const chartBot=H-H*botMargin;
  const cH=chartBot-chartTop;
  const cW=W-2*px;

  if(!S.data.length){
    ctx.strokeStyle=p.muted+'40';ctx.setLineDash([W*0.012,W*0.012]);ctx.lineWidth=1;
    ctx.strokeRect(px,chartTop,cW,cH);ctx.setLineDash([]);
    ctx.font=`400 ${W*0.027}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('Plak data in het linkerpaneel',W/2,chartTop+cH/2);
  } else {
    let data=[...S.data];
    const srt=document.getElementById('srt').value;
    const mr=document.getElementById('mr').value;
    const sc=S.cols[0]||0;
    if(srt==='desc')data.sort((a,b)=>(b.values[sc]||0)-(a.values[sc]||0));
    if(srt==='asc') data.sort((a,b)=>(a.values[sc]||0)-(b.values[sc]||0));
    if(mr!=='all')data=data.slice(0,parseInt(mr));
    const O={showGrid,showVal,showXL,lay:S.lay,W,p,oneClr,cols:S.cols,colNames:S.colNames,sf};
    const chart=CHARTS[S.ct];
    if(chart) chart.draw(ctx,data,px,chartTop,cW,cH,O);
  }

  const bronDatum=[bron,datum].filter(Boolean).join(' · ');
  if(bronDatum){
    const sz=W*0.021*sf;
    ctx.font=`400 ${sz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='left';ctx.textBaseline='bottom';
    ctx.fillText(bronDatum,px*0.5,H-H*0.025);
  }

  if(showBr){
    const sz=W*0.022*sf;
    ctx.font=`500 ${sz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='right';ctx.textBaseline='bottom';
    ctx.fillText('dataverhaal.nl',W-px*0.5,H-H*0.025);
  }
}
