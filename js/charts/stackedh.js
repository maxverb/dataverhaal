// ── STACKED HORIZONTAL BAR (single statement, Economist-style) ──
// One wide bar with colored segments, column names + % inside/below

registerChart('stackedh',{label:'Gestapeld H',draw:function(ctx,data,x,y,w,h,O){
  const {showVal,lay,W,H,p,cols,colNames,sf,wide,eyebrow,title,subtitle}=O;
  const nc=cols.length;
  if(nc<2) return;

  // Use first data row, or create one from all rows summed
  let values=[];
  if(data.length===1){
    values=cols.map(ci=>data[0].values[ci]||0);
  } else if(data.length>1){
    // Multiple rows: use first row
    values=cols.map(ci=>data[0].values[ci]||0);
  } else {
    return;
  }

  const total=values.reduce((s,v)=>s+v,0)||1;
  const pcts=values.map(v=>v/total);

  // This chart takes over the full canvas (like bignum)
  ctx.fillStyle=p.bg;
  ctx.fillRect(0,0,W,H);

  // Kader layout
  if(lay==='kader'){
    const m=W*0.035,rr=W*0.018;
    ctx.strokeStyle=p.acc;
    ctx.lineWidth=Math.max(3,W*0.005);
    rrect(ctx,m,m,W-2*m,H-2*m,rr);
    ctx.stroke();
  }

  const px=W*0.07;
  const maxW=W-2*px;
  let cy=H*0.08;

  // ── EYEBROW ──
  if(eyebrow){
    const sz=W*0.024*sf;
    ctx.font=`600 ${sz}px Barlow`;
    ctx.fillStyle=p.acc;
    ctx.textAlign='left';ctx.textBaseline='top';
    ctx.fillText(eyebrow.toUpperCase(),px,cy);
    cy+=sz*1.4;
    if(lay==='lijn'){
      ctx.fillStyle=p.acc;
      ctx.fillRect(px,cy,maxW,Math.max(3,W*0.004));
      cy+=W*0.012;
    }
  }

  // ── TITLE ──
  if(title){
    const sz=W*0.048*sf;
    ctx.font=`700 ${sz}px Sora`;
    ctx.fillStyle=p.text;
    ctx.textAlign='left';ctx.textBaseline='top';
    wrap(ctx,title,maxW).forEach(l=>{ctx.fillText(l,px,cy);cy+=sz*1.15;});
    cy+=W*0.01;
  }

  // ── SUBTITLE ──
  if(subtitle){
    const sz=W*0.024*sf;
    ctx.font=`400 ${sz}px Barlow`;
    ctx.fillStyle=p.muted;
    ctx.textAlign='left';ctx.textBaseline='top';
    wrap(ctx,subtitle,maxW).forEach(l=>{ctx.fillText(l,px,cy);cy+=sz*1.3;});
    cy+=W*0.015;
  }

  // ── STATEMENT (row label) ──
  const statement=data.length?data[0].label:'';
  if(statement){
    const sz=W*0.028*sf;
    cy+=W*0.01;
    ctx.font=`600 ${sz}px Barlow`;
    ctx.fillStyle=p.text;
    ctx.textAlign='left';ctx.textBaseline='top';
    wrap(ctx,statement,maxW).forEach(l=>{ctx.fillText(l,px,cy);cy+=sz*1.3;});
    cy+=W*0.015;
  }

  // ── BAR ──
  const barH=H*0.09;
  const barY=cy;
  let bx=px;

  cols.forEach((ci,j)=>{
    const pct=pcts[j];
    const segW=pct*maxW;
    if(segW<1) return;

    const col=p.bars[j%p.bars.length];
    ctx.fillStyle=col;

    // Rounded corners for first/last segment
    const rr=Math.min(barH*0.2,W*0.006);
    const isFirst=j===0;
    const isLast=j===nc-1;

    if(lay==='strak'){
      ctx.fillRect(bx,barY,segW,barH);
    } else {
      ctx.beginPath();
      if(isFirst&&isLast){
        rrect(ctx,bx,barY,segW,barH,rr);
      } else if(isFirst){
        ctx.moveTo(bx+rr,barY);ctx.lineTo(bx+segW,barY);ctx.lineTo(bx+segW,barY+barH);ctx.lineTo(bx+rr,barY+barH);ctx.arcTo(bx,barY+barH,bx,barY+barH-rr,rr);ctx.lineTo(bx,barY+rr);ctx.arcTo(bx,barY,bx+rr,barY,rr);
      } else if(isLast){
        ctx.moveTo(bx,barY);ctx.lineTo(bx+segW-rr,barY);ctx.arcTo(bx+segW,barY,bx+segW,barY+rr,rr);ctx.lineTo(bx+segW,barY+barH-rr);ctx.arcTo(bx+segW,barY+barH,bx+segW-rr,barY+barH,rr);ctx.lineTo(bx,barY+barH);
      } else {
        ctx.rect(bx,barY,segW,barH);
      }
      ctx.closePath();ctx.fill();
    }

    // Percentage inside bar if segment wide enough
    const pctText=Math.round(pct*100)+'%';
    const valSz=Math.max(W*0.022,12);
    ctx.font=`700 ${valSz}px Barlow`;
    const tw=ctx.measureText(pctText).width;
    if(segW>tw+W*0.015){
      const r=parseInt(col.slice(1,3),16)||0,g=parseInt(col.slice(3,5),16)||0,b2=parseInt(col.slice(5,7),16)||0;
      ctx.fillStyle=(r*0.299+g*0.587+b2*0.114)>160?'#1a1a1a':'#ffffff';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(pctText,bx+segW/2,barY+barH/2);
    }

    bx+=segW;
  });

  // ── LEGEND below bar ──
  cy=barY+barH+W*0.025;
  const legSz=Math.max(W*0.018,10);
  let lx=px;
  const legLineH=legSz*1.8;
  const legMaxW=maxW;

  cols.forEach((ci,j)=>{
    const col=p.bars[j%p.bars.length];
    const name=colNames[ci]||('Kolom '+(ci+1));
    const pctText=Math.round(pcts[j]*100)+'%';
    const label=name+' '+pctText;

    ctx.font=`500 ${legSz}px Barlow`;
    const itemW=legSz*1.5+ctx.measureText(label).width+legSz*1.5;

    // Wrap to next line if needed
    if(lx+itemW>px+legMaxW&&lx>px){lx=px;cy+=legLineH;}

    // Colored dot
    ctx.fillStyle=col;
    ctx.beginPath();ctx.arc(lx+legSz*0.5,cy+legSz*0.5,legSz*0.4,0,Math.PI*2);ctx.fill();

    // Text
    ctx.fillStyle=p.text;
    ctx.font=`600 ${legSz}px Barlow`;
    ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillText(name,lx+legSz*1.2,cy+legSz*0.5);

    const nameW=ctx.measureText(name).width;
    ctx.fillStyle=p.muted;
    ctx.font=`400 ${legSz}px Barlow`;
    ctx.fillText(pctText,lx+legSz*1.2+nameW+legSz*0.3,cy+legSz*0.5);

    lx+=itemW;
  });

  // ── FOOTER ──
  const bron=document.getElementById('bron').value;
  const datum=document.getElementById('datum').value;
  const footY=H-H*0.045;
  if(bron||datum){
    const sz=W*0.021*sf;
    ctx.font=`400 ${sz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='left';ctx.textBaseline='bottom';
    ctx.fillText([bron,datum].filter(Boolean).join(' · '),px,footY);
  }
  const branding=document.getElementById('fg-br').value;
  if(branding!=='none'){
    const sz=W*0.022*sf;
    ctx.font=`500 ${sz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='right';ctx.textBaseline='bottom';
    const brMap={metamax:'MetaMax',maxverbeek:'Max Verbeek'};
    ctx.fillText(brMap[branding]||'Max Verbeek',W-px,footY);
  }
}});
