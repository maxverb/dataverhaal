// ── BIG NUMBER / UITGELICHT GETAL ──
// Economist-style: eyebrow top, huge number center, divider line, subtitle below

registerChart('bignum',{label:'Getal',draw:function(ctx,data,x,y,w,h,O){
  const {W,H,p,cols,showVal,eyebrow,title,subtitle,sf,wide}=O;
  // This chart ignores the normal data — it uses the text fields differently:
  // Title field → the big number (e.g. "40%")
  // Eyebrow → small label above the number
  // Subtitle → description below the divider line

  const px=W*0.07;
  const centerY=H*0.42;

  // ── EYEBROW (already drawn by render.js, but we draw it bigger & positioned) ──
  // We skip the default header and draw our own layout
  // The draw() function already drew eyebrow/title/subtitle, so we work in the chart area

  // Use first data value as the big number if no title provided
  let bigNum=title||'';
  if(!bigNum&&data.length){
    const v=data[0].values[cols[0]||0];
    bigNum=fmtN(v,O.unit);
  }

  // If title was used as big number, use data label as context
  const descText=subtitle||'';
  const topLabel=eyebrow||'';

  // Clear the chart area (we override default header positioning)
  // Actually we draw over the whole canvas since this is a full-canvas chart
  ctx.fillStyle=p.bg;
  ctx.fillRect(0,0,W,H);

  // Kader layout
  if(O.lay==='kader'){
    const m=W*0.035,rr=W*0.018;
    ctx.strokeStyle=p.acc;
    ctx.lineWidth=Math.max(3,W*0.005);
    rrect(ctx,m,m,W-2*m,H-2*m,rr);
    ctx.stroke();
  }

  // ── TOP LABEL (eyebrow) ──
  let cy=H*0.18;
  if(topLabel){
    const sz=W*0.032*sf;
    ctx.font=`600 ${sz}px Barlow`;
    ctx.fillStyle=p.text;
    ctx.textAlign='left';
    ctx.textBaseline='top';
    const lines=wrap(ctx,topLabel,W-2*px);
    lines.forEach(l=>{ctx.fillText(l,px,cy);cy+=sz*1.3;});
    cy+=sz*0.5;
  }

  // ── BIG NUMBER ──
  if(bigNum){
    const sz=W*0.18*sf;
    ctx.font=`900 ${sz}px Sora`;
    ctx.fillStyle=p.text;
    ctx.textAlign='left';
    ctx.textBaseline='top';
    // Measure and auto-shrink if too wide
    let numSz=sz;
    while(ctx.measureText(bigNum).width>w-px&&numSz>W*0.06){
      numSz*=0.9;
      ctx.font=`900 ${numSz}px Sora`;
    }
    ctx.fillText(bigNum,px,cy);
    cy+=numSz*1.1;
  }

  // ── DIVIDER LINE ──
  cy+=H*0.02;
  ctx.fillStyle=p.acc;
  ctx.fillRect(px,cy,W-2*px,Math.max(3,W*0.004));
  cy+=H*0.04;

  // ── DESCRIPTION (subtitle) ──
  if(descText){
    const sz=W*0.032*sf;
    ctx.font=`400 ${sz}px Barlow`;
    ctx.fillStyle=p.muted;
    ctx.textAlign='left';
    ctx.textBaseline='top';
    const lines=wrap(ctx,descText,W-2*px);
    lines.forEach(l=>{ctx.fillText(l,px,cy);cy+=sz*1.45;});
  }

  // ── BRON + DATUM (footer) ──
  const bron=document.getElementById('bron').value;
  const datum=document.getElementById('datum').value;
  if(bron||datum){
    const sz=W*0.02*sf;
    ctx.font=`400 ${sz}px Barlow`;
    ctx.fillStyle=p.muted;
    ctx.textAlign='left';
    ctx.textBaseline='bottom';
    const footY=H-H*0.05;
    ctx.fillText([bron,datum].filter(Boolean).join(' · '),px,footY);
  }

  // ── BRANDING ──
  const branding=document.getElementById('fg-br').value;
  if(branding!=='none'){
    const sz=W*0.022*sf;
    ctx.font=`500 ${sz}px Barlow`;
    ctx.fillStyle=p.muted;
    ctx.textAlign='right';
    ctx.textBaseline='bottom';
    const brMap={metamax:'MetaMax',maxverbeek:'Max Verbeek'};
    ctx.fillText(brMap[branding]||'Max Verbeek',W-px,H-H*0.05);
  }
}});
