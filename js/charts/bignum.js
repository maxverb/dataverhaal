// ── BIG NUMBER / UITGELICHT GETAL ──
// Economist-style: eyebrow top, huge number center, divider line, subtitle below
// Works WITHOUT data — uses only the text fields

registerChart('bignum',{label:'Getal',draw:function(ctx,data,x,y,w,h,O){
  const {W,H,p,sf,wide}=O;
  const title=O.title||'';
  const eyebrow=O.eyebrow||'';
  const subtitle=O.subtitle||'';

  // This chart takes over the full canvas
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

  const px=W*0.07;
  const maxW=W-2*px;

  // Calculate total content height first to center vertically
  const eyeSz=W*0.028*sf;
  const numSz=W*0.16*sf;
  const descSz=W*0.030*sf;
  const linePad=H*0.025;

  // Measure heights
  let totalH=0;
  if(eyebrow){
    ctx.font=`600 ${eyeSz}px Barlow`;
    totalH+=wrap(ctx,eyebrow.toUpperCase(),maxW).length*eyeSz*1.3+eyeSz*0.3;
  }
  // Accent line after eyebrow
  if(eyebrow) totalH+=Math.max(3,W*0.004)+linePad*0.6;
  if(title){
    ctx.font=`900 ${numSz}px Sora`;
    let actSz=numSz;
    while(ctx.measureText(title).width>maxW&&actSz>W*0.06){actSz*=0.9;ctx.font=`900 ${actSz}px Sora`;}
    totalH+=actSz*1.15+linePad*0.4;
  }
  // Divider
  totalH+=Math.max(3,W*0.004)+linePad;
  if(subtitle){
    ctx.font=`400 ${descSz}px Barlow`;
    totalH+=wrap(ctx,subtitle,maxW).length*descSz*1.45;
  }

  // Start Y — vertically center the content block
  let cy=Math.max(H*0.08,(H-totalH)/2);

  // ── EYEBROW ──
  if(eyebrow){
    ctx.font=`600 ${eyeSz}px Barlow`;
    ctx.fillStyle=p.acc;
    ctx.textAlign='left';
    ctx.textBaseline='top';
    wrap(ctx,eyebrow.toUpperCase(),maxW).forEach(l=>{ctx.fillText(l,px,cy);cy+=eyeSz*1.3;});
    cy+=eyeSz*0.3;
    // Accent line under eyebrow
    ctx.fillStyle=p.acc;
    ctx.fillRect(px,cy,maxW,Math.max(3,W*0.004));
    cy+=Math.max(3,W*0.004)+linePad*0.6;
  }

  // ── BIG NUMBER (title field) ──
  if(title){
    let actSz=numSz;
    ctx.font=`900 ${actSz}px Sora`;
    while(ctx.measureText(title).width>maxW&&actSz>W*0.06){actSz*=0.9;ctx.font=`900 ${actSz}px Sora`;}
    ctx.fillStyle=p.text;
    ctx.textAlign='left';
    ctx.textBaseline='top';
    ctx.fillText(title,px,cy);
    cy+=actSz*1.15+linePad*0.4;
  }

  // ── DIVIDER LINE ──
  if(!eyebrow){
    // Only draw divider if no eyebrow line was drawn
    ctx.fillStyle=p.acc;
    ctx.fillRect(px,cy,maxW,Math.max(3,W*0.004));
    cy+=Math.max(3,W*0.004)+linePad;
  } else {
    cy+=linePad*0.4;
  }

  // ── DESCRIPTION (subtitle field) ──
  if(subtitle){
    ctx.font=`400 ${descSz}px Barlow`;
    ctx.fillStyle=p.muted;
    ctx.textAlign='left';
    ctx.textBaseline='top';
    wrap(ctx,subtitle,maxW).forEach(l=>{ctx.fillText(l,px,cy);cy+=descSz*1.45;});
  }

  // ── FOOTER: bron + datum ──
  const bron=document.getElementById('bron').value;
  const datum=document.getElementById('datum').value;
  const footY=H-H*0.045;
  if(bron||datum){
    const sz=W*0.021*sf;
    ctx.font=`400 ${sz}px Barlow`;
    ctx.fillStyle=p.muted;
    ctx.textAlign='left';
    ctx.textBaseline='bottom';
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
    ctx.fillText(brMap[branding]||'Max Verbeek',W-px,footY);
  }

  // ── PLACEHOLDER if nothing filled ──
  if(!title&&!eyebrow&&!subtitle){
    ctx.font=`400 ${W*0.027}px Barlow`;
    ctx.fillStyle=p.muted;
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText('Vul Eyebrow, Titel en Subtitel in',W/2,H/2);
  }
}});
