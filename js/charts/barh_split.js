// ── SPLIT HORIZONTAL BAR — two columns side by side, same row order ──

registerChart('barh_split',{label:'Vergelijk',draw:function(ctx,data,x,y,w,h,O){
  const {showVal,lay,W,p,cols,colNames,sf}=O;
  if(cols.length<2||!data.length) return;

  const ci0=cols[0], ci1=cols[1];
  const gap=W*0.03;
  const halfW=(w-gap)/2;

  // Titles (column names)
  const titleSz=W*0.032*sf;
  ctx.font=`700 ${titleSz}px Sora`;
  ctx.fillStyle=p.text;
  ctx.textAlign='left';
  ctx.textBaseline='top';
  ctx.fillText(colNames[ci0]||'Kolom 1',x,y);
  ctx.fillText(colNames[ci1]||'Kolom 2',x+halfW+gap,y);
  const chartY=y+titleSz*1.6;
  const chartH=h-titleSz*1.6;

  // Both sides use the same data in same order (sorting handled by render.js)
  const maxV0=Math.max(...data.map(d=>d.values[ci0]||0))||1;
  const maxV1=Math.max(...data.map(d=>d.values[ci1]||0))||1;

  // Label width (shared, based on all labels)
  const lblSz=Math.max(W*0.016,10);
  ctx.font=`500 ${lblSz}px Barlow`;
  let lblW=0;
  data.forEach(d=>{const tw=ctx.measureText(shortLabel(d.label)).width;if(tw>lblW)lblW=tw;});
  lblW=Math.min(lblW+W*0.01,halfW*0.45);

  const n=data.length;
  const rowGap=n>12?0.08:n>8?0.12:0.18;
  const gH=chartH/n;
  const bH=gH*(1-rowGap);

  data.forEach((d,i)=>{
    const by=chartY+gH*i+gH*rowGap/2;

    // Left side
    const cX0=x+lblW+W*0.005;
    const cW0=halfW-lblW-W*0.005;
    const v0=d.values[ci0]||0;
    const bW0=Math.max(1,(v0/maxV0)*cW0);
    ctx.fillStyle=p.bars[0%p.bars.length];
    if(lay==='strak') ctx.fillRect(cX0,by,bW0,bH);
    else{const rr=Math.min(bH*0.3,W*0.004);rbarH(ctx,cX0,by,bW0,bH,rr);}
    if(showVal){
      const sz=Math.max(W*0.015,9);
      ctx.font=`600 ${sz}px Barlow`;ctx.fillStyle=p.text;ctx.textAlign='left';ctx.textBaseline='middle';
      ctx.fillText(fmtN(v0),cX0+bW0+W*0.008,by+bH/2);
    }
    // Left label
    ctx.font=`500 ${lblSz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='right';ctx.textBaseline='middle';
    ctx.fillText(trunc(ctx,shortLabel(d.label),lblW-W*0.008),cX0-W*0.008,by+bH/2);

    // Right side
    const rX=x+halfW+gap;
    const cX1=rX+lblW+W*0.005;
    const cW1=halfW-lblW-W*0.005;
    const v1=d.values[ci1]||0;
    const bW1=Math.max(1,(v1/maxV1)*cW1);
    ctx.fillStyle=p.bars[1%p.bars.length];
    if(lay==='strak') ctx.fillRect(cX1,by,bW1,bH);
    else{const rr=Math.min(bH*0.3,W*0.004);rbarH(ctx,cX1,by,bW1,bH,rr);}
    if(showVal){
      const sz=Math.max(W*0.015,9);
      ctx.font=`600 ${sz}px Barlow`;ctx.fillStyle=p.text;ctx.textAlign='left';ctx.textBaseline='middle';
      ctx.fillText(fmtN(v1),cX1+bW1+W*0.008,by+bH/2);
    }
    // Right label
    ctx.font=`500 ${lblSz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='right';ctx.textBaseline='middle';
    ctx.fillText(trunc(ctx,shortLabel(d.label),lblW-W*0.008),cX1-W*0.008,by+bH/2);
  });
}});
