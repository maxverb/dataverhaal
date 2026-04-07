// ── BLOCKS CHART — Economist-style grouped blocks ──
// Each row = a group with label above, columns as proportional blocks side by side
// Max 4 rows, max 3 columns. Column name + value inside each block.

registerChart('blocks',{label:'Blokken',draw:function(ctx,data,x,y,w,h,O){
  const {showVal,lay,W,H,p,cols,colNames,sf,wide,eyebrow,title,subtitle}=O;
  const nc=Math.min(cols.length,3);
  const rows=data.slice(0,4);
  if(!rows.length||nc<1) return;

  // Full canvas takeover
  ctx.fillStyle=p.bg;
  ctx.fillRect(0,0,W,H);

  if(lay==='kader'){
    const m=W*0.035,rr=W*0.018;
    ctx.strokeStyle=p.acc;
    ctx.lineWidth=Math.max(3,W*0.005);
    rrect(ctx,m,m,W-2*m,H-2*m,rr);
    ctx.stroke();
  }

  const px=W*0.07;
  const maxW=W-2*px;
  let cy=H*0.07;

  // ── EYEBROW ──
  if(eyebrow){
    const sz=W*0.024*sf;
    ctx.font=`600 ${sz}px Barlow`;
    ctx.fillStyle=p.acc;
    ctx.textAlign='left';ctx.textBaseline='top';
    ctx.fillText(eyebrow.toUpperCase(),px,cy);
    cy+=sz*1.4;
    // Accent line
    ctx.fillStyle=p.acc;
    ctx.fillRect(px,cy,W*0.08,Math.max(3,W*0.005));
    cy+=W*0.018;
  }

  // ── TITLE ──
  if(title){
    const sz=W*0.046*sf;
    ctx.font=`700 ${sz}px Sora`;
    ctx.fillStyle=p.text;
    ctx.textAlign='left';ctx.textBaseline='top';
    wrap(ctx,title,maxW).forEach(l=>{ctx.fillText(l,px,cy);cy+=sz*1.15;});
    cy+=W*0.006;
  }

  // ── SUBTITLE ──
  if(subtitle){
    const sz=W*0.023*sf;
    ctx.font=`400 ${sz}px Barlow`;
    ctx.fillStyle=p.muted;
    ctx.textAlign='left';ctx.textBaseline='top';
    wrap(ctx,subtitle,maxW).forEach(l=>{ctx.fillText(l,px,cy);cy+=sz*1.3;});
    cy+=W*0.01;
  }

  // ── BLOCKS ──
  // Find global max for proportional sizing
  let globalMax=0;
  rows.forEach(d=>{cols.slice(0,nc).forEach(ci=>{const v=d.values[ci]||0;if(v>globalMax)globalMax=v;});});
  if(!globalMax) globalMax=1;

  // Calculate space
  const footerH=H*0.1;
  const availH=H-cy-footerH;
  const rowH=availH/rows.length;
  const blockH=rowH*0.48;
  const labelH=rowH*0.28;
  const gapH=rowH*0.24;
  const blockGap=W*0.005;

  rows.forEach((d,ri)=>{
    // Group label
    const lblSz=W*0.026*sf;
    ctx.font=`700 ${lblSz}px Sora`;
    ctx.fillStyle=p.text;
    ctx.textAlign='left';ctx.textBaseline='top';
    ctx.fillText(d.label,px,cy);
    cy+=lblSz*1.4;

    // Draw blocks for this row
    const rowVals=cols.slice(0,nc).map(ci=>d.values[ci]||0);
    const rowTotal=rowVals.reduce((s,v)=>s+v,0);

    // Block widths proportional to value (relative to global max * nc to keep scale)
    let bx=px;
    rowVals.forEach((v,j)=>{
      const blockW=Math.max(W*0.04,(v/globalMax)*maxW*0.85);
      const col=p.bars[j%p.bars.length];

      // Block with border
      ctx.fillStyle=col+'20'; // light fill
      ctx.strokeStyle=col;
      ctx.lineWidth=Math.max(2,W*0.002);
      const rr=Math.min(blockH*0.12,W*0.004);
      rrect(ctx,bx,cy,blockW,blockH,rr);
      ctx.fill();ctx.stroke();

      // Column name inside block
      const nameSz=Math.max(W*0.019,10);
      ctx.font=`600 ${nameSz}px Barlow`;
      ctx.fillStyle=p.text;
      ctx.textAlign='left';ctx.textBaseline='top';
      const name=colNames[cols[j]]||'';
      ctx.fillText(trunc(ctx,name,blockW-W*0.015),bx+W*0.012,cy+blockH*0.2);

      // Value below name
      const valSz=Math.max(W*0.022,12);
      ctx.font=`700 ${valSz}px Barlow`;
      ctx.fillStyle=p.text;
      ctx.fillText(fmtN(v)+(rowTotal>0?'':''),bx+W*0.012,cy+blockH*0.52);

      bx+=blockW+blockGap;
    });

    cy+=blockH+gapH;
  });

  // ── FOOTER ──
  const bron=document.getElementById('bron').value;
  const datum=document.getElementById('datum').value;
  const footY=H-H*0.04;
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
