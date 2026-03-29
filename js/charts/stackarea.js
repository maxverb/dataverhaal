registerChart('stackarea',{label:'Area+',draw:function(ctx,data,x,y,w,h,O){
  const {showGrid,showXL,W,p,cols,colNames}=O;
  const n=data.length, nc=cols.length;
  if(nc<2||n<2){CHARTS.area.draw(ctx,data,x,y,w,h,O);return;}

  // Compute stacked totals per point
  const stacked=data.map(d=>cols.map(c=>d.values[c]||0));
  const cumul=stacked.map(row=>{const c=[];row.reduce((s,v,i)=>{c[i]=s+v;return s+v;},0);return c;});
  const maxV=Math.max(...cumul.map(c=>c[nc-1]));
  const pad=maxV*0.1||1;
  const vMax=maxV+pad, vMin=0, vR=vMax;
  const legH=W*0.04;
  const lblH=showXL?h*0.11:0;
  const cH=h-lblH-legH;
  const glW=showGrid?W*0.05:0;

  if(showGrid) drawGrid(ctx,x,y,w,cH,0,vMax,5,glW,O);
  const xPts=data.map((_,i)=>x+glW+(i/(n-1))*(w-glW));
  const yFn=v=>y+cH-(v/vR)*cH;

  // Draw areas top-to-bottom (last col on top)
  for(let j=nc-1;j>=0;j--){
    const col=p.bars[j%p.bars.length];
    ctx.beginPath();
    ctx.moveTo(xPts[0],y+cH);
    for(let i=0;i<n;i++) ctx.lineTo(xPts[i],yFn(cumul[i][j]));
    ctx.lineTo(xPts[n-1],y+cH);
    ctx.closePath();
    ctx.fillStyle=col+'90';ctx.fill();

    // Top line
    ctx.beginPath();
    for(let i=0;i<n;i++){
      if(i===0)ctx.moveTo(xPts[i],yFn(cumul[i][j]));
      else ctx.lineTo(xPts[i],yFn(cumul[i][j]));
    }
    ctx.strokeStyle=col;ctx.lineWidth=Math.max(2,W*0.003);ctx.stroke();
  }

  if(showXL){
    const sz=Math.max(W*0.018,11);
    ctx.font=`500 ${sz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.textBaseline='top';
    data.forEach((d,i)=>ctx.fillText(trunc(ctx,shortLabel(d.label),w/(n-1)*0.9),xPts[i],y+cH+W*0.009));
  }

  drawLegend(ctx,cols,colNames,p,W,x+glW,y+cH+lblH+legH*0.2);
}});
