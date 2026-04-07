// ── STACKED HORIZONTAL BAR (100%) ──
// Each row = 100% width, columns are segments with labels inside

registerChart('stackedh',{label:'Gestapeld H',draw:function(ctx,data,x,y,w,h,O){
  const {showVal,lay,W,p,cols,colNames,sf}=O;
  const n=data.length, nc=cols.length;
  if(!n||nc<2) return;

  // Label width (left side)
  const lblSz=Math.max(W*0.018,11);
  ctx.font=`500 ${lblSz}px Barlow`;
  let lblW=0;
  data.forEach(d=>{const tw=ctx.measureText(shortLabel(d.label)).width;if(tw>lblW)lblW=tw;});
  lblW=Math.min(lblW+W*0.015,w*0.35);

  const cX=x+lblW+W*0.008;
  const cW=w-lblW-W*0.008;

  // Legend at bottom
  const legH=W*0.04;
  const chartH=h-legH;

  // Row sizing
  const rowGap=n>8?0.12:n>5?0.18:0.22;
  const gH=chartH/n;
  const bH=gH*(1-rowGap);

  // Draw legend
  const legY=y+chartH+legH*0.3;
  const legSz=Math.max(W*0.014,9);
  ctx.font=`500 ${legSz}px Barlow`;
  let legX=cX;
  cols.forEach((ci,j)=>{
    const col=p.bars[j%p.bars.length];
    const name=colNames[ci]||('Kolom '+(ci+1));
    ctx.fillStyle=col;
    ctx.beginPath();ctx.arc(legX+legSz*0.5,legY+legSz*0.3,legSz*0.4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=p.muted;
    ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillText(name,legX+legSz*1.2,legY+legSz*0.3);
    legX+=ctx.measureText(name).width+legSz*2.2;
  });

  // Draw rows
  data.forEach((d,i)=>{
    const by=y+gH*i+gH*rowGap/2;

    // Calculate row total for percentage
    let rowTotal=0;
    cols.forEach(ci=>{rowTotal+=(d.values[ci]||0);});
    if(!rowTotal) rowTotal=1;

    // Draw label
    ctx.font=`500 ${lblSz}px Barlow`;
    ctx.fillStyle=p.muted;
    ctx.textAlign='right';
    ctx.textBaseline='middle';
    ctx.fillText(trunc(ctx,shortLabel(d.label),lblW-W*0.01),cX-W*0.012,by+bH/2);

    // Draw segments
    let sx=cX;
    cols.forEach((ci,j)=>{
      const v=d.values[ci]||0;
      const pct=v/rowTotal;
      const segW=pct*cW;
      if(segW<1) return;

      const col=p.bars[j%p.bars.length];
      ctx.fillStyle=col;

      if(lay==='strak'){
        ctx.fillRect(sx,by,segW,bH);
      } else {
        // First segment: round left, last: round right
        const rr=Math.min(bH*0.2,W*0.005);
        const isFirst=j===0||sx===cX;
        const isLast=j===nc-1||(sx+segW>=cX+cW-1);
        ctx.beginPath();
        if(isFirst&&isLast){
          rrect(ctx,sx,by,segW,bH,rr);
        } else if(isFirst){
          ctx.moveTo(sx+rr,by);ctx.lineTo(sx+segW,by);ctx.lineTo(sx+segW,by+bH);ctx.lineTo(sx+rr,by+bH);ctx.arcTo(sx,by+bH,sx,by+bH-rr,rr);ctx.lineTo(sx,by+rr);ctx.arcTo(sx,by,sx+rr,by,rr);
        } else if(isLast){
          ctx.moveTo(sx,by);ctx.lineTo(sx+segW-rr,by);ctx.arcTo(sx+segW,by,sx+segW,by+rr,rr);ctx.lineTo(sx+segW,by+bH-rr);ctx.arcTo(sx+segW,by+bH,sx+segW-rr,by+bH,rr);ctx.lineTo(sx,by+bH);
        } else {
          ctx.rect(sx,by,segW,bH);
        }
        ctx.closePath();
        ctx.fill();
      }

      // Label inside segment if wide enough
      if(showVal){
        const pctText=Math.round(pct*100)+'%';
        const valSz=Math.max(W*0.016,9);
        ctx.font=`600 ${valSz}px Barlow`;
        const tw=ctx.measureText(pctText).width;
        if(segW>tw+W*0.01){
          // White or dark text depending on segment color brightness
          const r=parseInt(col.slice(1,3),16)||0,g=parseInt(col.slice(3,5),16)||0,b2=parseInt(col.slice(5,7),16)||0;
          ctx.fillStyle=(r*0.299+g*0.587+b2*0.114)>160?'#1a1a1a':'#ffffff';
          ctx.textAlign='center';
          ctx.textBaseline='middle';
          ctx.fillText(pctText,sx+segW/2,by+bH/2);
        }
      }

      sx+=segW;
    });
  });
}});
