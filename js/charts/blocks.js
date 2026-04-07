// ── BLOCKS CHART — Economist-style grouped blocks ──
// Each row = a group with label above, columns as proportional blocks side by side
// Max 4 rows, max 3 columns. Skip 0-values. Hide column name if only 1 block in row.

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
  // Find global max for proportional sizing (only non-zero values)
  let globalMax=0;
  // Count actual rows (with non-zero values)
  let activeRows=0;
  rows.forEach(d=>{
    let hasVal=false;
    cols.slice(0,nc).forEach(ci=>{const v=d.values[ci]||0;if(v>globalMax)globalMax=v;if(v>0)hasVal=true;});
    if(hasVal) activeRows++;
  });
  if(!globalMax) globalMax=1;
  if(!activeRows) return;

  // Calculate space — spread evenly over available height
  const footerH=H*0.08;
  const availH=H-cy-footerH;
  const rowH=availH/activeRows;
  const blockH=Math.min(Math.max(rowH*0.45,W*0.04),W*0.09);
  const blockGap=W*0.005;

  rows.forEach((d,ri)=>{
    // Get non-zero values for this row
    const rowBlocks=[];
    cols.slice(0,nc).forEach((ci,j)=>{
      const v=d.values[ci]||0;
      if(v>0) rowBlocks.push({v,j,ci,name:colNames[ci]||''});
    });
    if(!rowBlocks.length) return; // skip empty rows entirely

    const showNames=rowBlocks.length>1; // hide column name if only 1 block

    // Group label
    const lblSz=W*0.026*sf;
    ctx.font=`700 ${lblSz}px Sora`;
    ctx.fillStyle=p.text;
    ctx.textAlign='left';ctx.textBaseline='top';
    ctx.fillText(d.label,px,cy);
    cy+=lblSz*1.3;

    // Draw blocks
    let bx=px;
    rowBlocks.forEach((blk)=>{
      const blockW=Math.max(W*0.06,(blk.v/globalMax)*maxW*0.8);
      const col=p.bars[blk.j%p.bars.length];

      // Block with border + light fill
      ctx.fillStyle=col+'20';
      ctx.strokeStyle=col;
      ctx.lineWidth=Math.max(2,W*0.002);
      const rr=Math.min(blockH*0.12,W*0.004);
      rrect(ctx,bx,cy,blockW,blockH,rr);
      ctx.fill();ctx.stroke();

      // Column name inside block (only if multiple blocks)
      let textY=cy+blockH*0.25;
      if(showNames){
        const nameSz=Math.max(W*0.019,10);
        ctx.font=`600 ${nameSz}px Barlow`;
        ctx.fillStyle=p.text;
        ctx.textAlign='left';ctx.textBaseline='top';
        ctx.fillText(trunc(ctx,blk.name,blockW-W*0.02),bx+W*0.012,cy+blockH*0.18);
        textY=cy+blockH*0.52;
      } else {
        textY=cy+blockH*0.3;
      }

      // Value
      const valSz=Math.max(W*0.024,13);
      ctx.font=`700 ${valSz}px Barlow`;
      ctx.fillStyle=p.text;
      ctx.textAlign='left';ctx.textBaseline='top';
      ctx.fillText(fmtN(blk.v),bx+W*0.012,textY);

      bx+=blockW+blockGap;
    });

    cy+=blockH+(rowH-blockH-lblSz*1.3)*0.8;
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
