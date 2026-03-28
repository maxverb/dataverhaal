registerChart('heatmap',{label:'Heatmap',draw:function(ctx,data,x,y,w,h,O){
  const {showVal,showXL,W,p,cols,colNames}=O;
  const n=data.length, nc=cols.length;
  if(nc<1||n<1)return;

  // Find global min/max across all selected columns
  const allVals=data.flatMap(d=>cols.map(c=>d.values[c]||0));
  const minV=Math.min(...allVals), maxV=Math.max(...allVals);
  const range=maxV-minV||1;

  // Layout
  const lblW=W*0.06, colLblH=W*0.03;
  const cellW=(w-lblW)/nc, cellH=(h-colLblH)/n;

  // Column headers
  const hsz=Math.max(W*0.015,10);
  ctx.font=`600 ${hsz}px Barlow`;ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillStyle=p.muted;
  cols.forEach((ci,j)=>{
    const cx=x+lblW+cellW*j+cellW/2;
    ctx.fillText(trunc(ctx,colNames[ci]||'Kol '+(ci+1),cellW*0.9),cx,y+colLblH-2);
  });

  // Rows
  data.forEach((d,i)=>{
    const ry=y+colLblH+cellH*i;

    // Row label
    if(showXL){
      const sz=Math.max(W*0.015,10);
      ctx.font=`500 ${sz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='right';ctx.textBaseline='middle';
      ctx.fillText(trunc(ctx,shortLabel(d.label),lblW-4),x+lblW-4,ry+cellH/2);
    }

    cols.forEach((ci,j)=>{
      const v=d.values[ci]||0;
      const t=(v-minV)/range; // 0..1

      // Interpolate color from light to accent
      const r0=parseInt(p.bg.slice(1,3),16)||240;
      const g0=parseInt(p.bg.slice(3,5),16)||240;
      const b0=parseInt(p.bg.slice(5,7),16)||240;
      const r1=parseInt(p.acc.slice(1,3),16)||30;
      const g1=parseInt(p.acc.slice(3,5),16)||80;
      const b1=parseInt(p.acc.slice(5,7),16)||200;
      const r=Math.round(r0+(r1-r0)*t);
      const g=Math.round(g0+(g1-g0)*t);
      const b=Math.round(b0+(b1-b0)*t);

      const cx=x+lblW+cellW*j;
      ctx.fillStyle=`rgb(${r},${g},${b})`;
      ctx.fillRect(cx+1,ry+1,cellW-2,cellH-2);

      if(showVal){
        const sz=Math.max(W*0.014,9);
        ctx.font=`600 ${sz}px Barlow`;
        ctx.fillStyle=t>0.5?'#fff':'#000';
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(fmtN(v),cx+cellW/2,ry+cellH/2);
      }
    });
  });
}});
