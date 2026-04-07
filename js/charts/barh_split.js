// ── SPLIT HORIZONTAL BAR — two columns side by side, each sorted independently ──

registerChart('barh_split',{label:'Vergelijk',draw:function(ctx,data,x,y,w,h,O){
  const {showVal,lay,W,p,cols,colNames,sf}=O;
  if(cols.length<2||!data.length) return;

  const ci0=cols[0], ci1=cols[1];
  const gap=W*0.03; // gap between left and right chart
  const halfW=(w-gap)/2;

  // Sort each side independently (descending)
  const leftData=[...data].map(d=>({label:d.label,v:d.values[ci0]||0})).sort((a,b)=>b.v-a.v);
  const rightData=[...data].map(d=>({label:d.label,v:d.values[ci1]||0})).sort((a,b)=>b.v-a.v);

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

  // Draw each side
  drawSplitSide(ctx,leftData,x,chartY,halfW,chartH,p,W,showVal,lay,0);
  drawSplitSide(ctx,rightData,x+halfW+gap,chartY,halfW,chartH,p,W,showVal,lay,1);
}});

function drawSplitSide(ctx,items,x,y,w,h,p,W,showVal,lay,colorIdx){
  const n=items.length;
  if(!n) return;
  const maxV=Math.max(...items.map(d=>d.v))||1;

  // Label width
  const lblSz=Math.max(W*0.016,10);
  ctx.font=`500 ${lblSz}px Barlow`;
  let lblW=0;
  items.forEach(d=>{const tw=ctx.measureText(shortLabel(d.label)).width;if(tw>lblW)lblW=tw;});
  lblW=Math.min(lblW+W*0.01,w*0.45);

  const cX=x+lblW+W*0.005;
  const cW=w-lblW-W*0.005;
  const gap=n>12?0.08:n>8?0.12:0.18;
  const gH=h/n;
  const bH=gH*(1-gap);

  items.forEach((d,i)=>{
    const by=y+gH*i+gH*gap/2;
    const bW=Math.max(1,(d.v/maxV)*cW);
    const col=p.bars[colorIdx%p.bars.length];
    ctx.fillStyle=col;
    if(lay==='strak') ctx.fillRect(cX,by,bW,bH);
    else{const rr=Math.min(bH*0.3,W*0.004);rbarH(ctx,cX,by,bW,bH,rr);}

    // Value
    if(showVal){
      const sz=Math.max(W*0.015,9);
      ctx.font=`600 ${sz}px Barlow`;ctx.fillStyle=p.text;ctx.textAlign='left';ctx.textBaseline='middle';
      ctx.fillText(fmtN(d.v),cX+bW+W*0.008,by+bH/2);
    }

    // Label
    ctx.font=`500 ${lblSz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='right';ctx.textBaseline='middle';
    ctx.fillText(trunc(ctx,shortLabel(d.label),lblW-W*0.008),cX-W*0.008,by+bH/2);
  });
}
