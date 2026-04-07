// ── SHARED CHART RENDERING ─────────────────────────────────────────────────

function drawGrid(ctx,x,y,w,cH,minV,maxV,count,glW,O){
  const {W,p,gridStyle}=O;
  const ticks=niceTicks(minV,maxV,count);
  const range=maxV-minV||1;
  const sz=W*0.016;
  ctx.font=`400 ${sz}px Barlow`;
  ctx.strokeStyle=p.muted+'70';
  ctx.lineWidth=Math.max(1.5,W*0.0014);
  if(gridStyle==='dashed') ctx.setLineDash([W*0.006,W*0.004]);
  else ctx.setLineDash([]);
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
  const wide=ar>1.3;
  const sf=wide?0.55:1;

  let p={...PAL[S.pal]};
  if(S.lay==='omgekeerd'&&S.pal!=='donker'){
    p={...p, bg:'#0F172A', text:'#F1F5F9', muted:'#94A3B8'};
  }

  // Apply custom color override to palette
  if(S.customClr){
    p.acc=S.customClr;
    p.bars=[S.customClr,...p.bars.slice(1)];
  }

  // Bignum: full canvas takeover, skip all normal rendering
  if(S.ct==='bignum'){
    const chart=CHARTS.bignum;
    if(chart){
      const O={W,H,p,sf,wide,lay:S.lay,
        eyebrow:document.getElementById('eyebrow').value,
        title:document.getElementById('ttl').value,
        subtitle:document.getElementById('sub').value,
        acc:p.acc};
      chart.draw(ctx,null,0,0,W,H,O);
    }
    return;
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
  const gridStyle='dashed';
  const showGrid=document.getElementById('fg-grid')?document.getElementById('fg-grid').checked:true;
  const showVal=document.getElementById('fg-val').checked;
  const showXL=document.getElementById('fg-xl').checked;
  const showPctChg=(document.getElementById('fg-pctchg')||{}).checked||false;
  const showTrend=document.getElementById('fg-trend')?document.getElementById('fg-trend').checked:false;
  const showMA=document.getElementById('fg-ma')?document.getElementById('fg-ma').checked:false;
  const showAvg=(document.getElementById('fg-avg')||{}).checked||false;
  const refVal=parseFloat((document.getElementById('fg-ref')||{}).value);
  const refLbl=(document.getElementById('fg-ref-lbl')||{}).value||'';
  const annotRaw=(document.getElementById('annot')||{}).value||'';
  const branding=document.getElementById('fg-br').value;
  const showBr=branding!=='none';
  const bron=document.getElementById('bron').value;
  const datum=document.getElementById('datum').value;
  const oneClr=true;

  let cy=H*(wide?0.045:0.064);

  if(eyebrow){
    const sz=W*0.024*sf;
    ctx.font=`600 ${sz}px Barlow`;ctx.fillStyle=p.acc;ctx.textAlign='left';ctx.textBaseline='top';
    ctx.fillText(eyebrow.toUpperCase(),px,cy);
    cy+=sz*(wide?1.15:1.35);
    if(S.lay==='lijn'){
      ctx.fillStyle=p.acc;
      ctx.fillRect(px,cy,W-2*px,Math.max(3,W*0.004));
      cy+=W*(wide?0.008:0.014);
    }
  }

  if(title){
    const sz=(S.lay==='strak'?W*0.055:W*0.052)*sf;
    ctx.font=`700 ${sz}px Sora`;ctx.fillStyle=p.text;ctx.textAlign='left';ctx.textBaseline='top';
    wrap(ctx,title,W-2*px).forEach(l=>{ctx.fillText(l,px,cy);cy+=sz*1.15;});
  }

  if(subtitle){
    const sz=W*0.026*sf;
    cy+=sz*0.2;
    ctx.font=`400 ${sz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='left';ctx.textBaseline='top';
    wrap(ctx,subtitle,W-2*px).forEach(l=>{ctx.fillText(l,px,cy);cy+=sz*1.3;});
    cy+=sz*0.15;
  }

  const chartTop=Math.max(cy+(title?W*(wide?0.012:0.025):0), H*0.08);
  const botMargin=showBr?(wide?0.065:0.09):(wide?0.035:0.05);
  const chartBot=H-H*botMargin;
  // Reserve space for value labels above bars
  const valPad=showVal?W*0.035:0;
  const cH=chartBot-chartTop-valPad;
  const cW=W-2*px;

  if(!S.data.length){
    ctx.strokeStyle=p.muted+'40';ctx.setLineDash([W*0.012,W*0.012]);ctx.lineWidth=1;
    ctx.strokeRect(px,chartTop,cW,cH);ctx.setLineDash([]);
    ctx.font=`400 ${W*0.027}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('Plak data in het linkerpaneel',W/2,chartTop+cH/2);
  } else {
    let data=S.data.map(d=>({label:d.label,values:[...d.values]}));
    const srt=document.getElementById('srt').value;
    const mr=document.getElementById('mr').value;
    const dispmode=(document.getElementById('dispmode')||{}).value||'abs';
    const sc=S.cols[0]||0;
    if(srt==='desc')data.sort((a,b)=>(b.values[sc]||0)-(a.values[sc]||0));
    if(srt==='asc') data.sort((a,b)=>(a.values[sc]||0)-(b.values[sc]||0));
    if(mr!=='all')data=data.slice(0,parseInt(mr));
    // Percentage mode: convert values to % of column total
    if(dispmode==='pct'){
      const cols=S.cols;
      cols.forEach(ci=>{
        const total=data.reduce((s,d)=>s+(d.values[ci]||0),0)||1;
        data.forEach(d=>{d.values[ci]=Math.round((d.values[ci]||0)/total*1000)/10;});
      });
    }
    const annots={};
    annotRaw.split(';').forEach(a=>{const m=a.match(/^(\d+):(.+)$/);if(m)annots[parseInt(m[1])-1]=m[2].trim();});
    const O={showGrid,gridStyle,showVal,showXL,showPctChg,showTrend,showMA,showAvg,refVal,refLbl,annots,lay:S.lay,W,H,p,oneClr,cols:S.cols,colNames:S.colNames,sf,wide,dispmode,eyebrow,title,subtitle,unit:(document.getElementById('unit')||{}).value||'auto'};
    const chart=CHARTS[S.ct];
    if(chart) chart.draw(ctx,data,px,chartTop+valPad,cW,cH,O);
  }

  const note=(document.getElementById('note')||{}).value||'';
  const bronDatum=[bron,datum].filter(Boolean).join(' · ');
  const footY=H-H*(wide?0.018:0.025);
  const noteY=footY-(note?W*0.02:0);
  if(note){
    const sz=W*0.016*sf;
    ctx.font=`400 ${sz}px Barlow`;ctx.fillStyle=p.muted+'90';ctx.textAlign='left';ctx.textBaseline='bottom';
    ctx.fillText(note,px*0.5,footY);
  }
  if(bronDatum){
    const sz=W*0.021*sf;
    ctx.font=`400 ${sz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='left';ctx.textBaseline='bottom';
    ctx.fillText(bronDatum,px*0.5,noteY);
  }

  if(showBr){
    const sz=W*0.022*sf;
    ctx.font=`500 ${sz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='right';ctx.textBaseline='bottom';
    const brMap={metamax:'MetaMax',maxverbeek:'Max Verbeek'};
    const brTxt=brMap[branding]||'Max Verbeek';
    ctx.fillText(brTxt,W-px*0.5,footY);
  }
}
