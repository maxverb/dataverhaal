registerChart('area',{label:'Area',draw:function(ctx,data,x,y,w,h,O){
  const {showGrid,showVal,showXL,showTrend,lay,W,p,cols,colNames}=O;
  const n=data.length, nc=cols.length;
  if(n<2){CHARTS.bar.draw(ctx,data,x,y,w,h,O);return;}
  const allVals=data.flatMap(d=>cols.map(c=>d.values[c]||0));
  const maxV=Math.max(...allVals);
  const pad=maxV*0.1||1;
  const vMax=maxV+pad, vMin=0, vR=vMax-vMin;
  const legH=nc>1?W*0.04:0;
  const lblH=showXL?h*0.11:0;
  const cH=h-lblH-legH;
  const glW=showGrid&&lay!=='strak'?W*0.05:0;

  if(showGrid&&lay!=='strak') drawGrid(ctx,x,y,w,cH,vMin,vMax,5,glW,O);

  const xPts=data.map((_,i)=>x+glW+(i/(n-1))*(w-glW));

  // Draw areas back-to-front
  const colsCopy=[...cols].reverse();
  colsCopy.forEach((ci,rj)=>{
    const j=nc-1-rj;
    const col=nc>1?p.bars[j%p.bars.length]:p.acc;
    const pts=data.map((d,i)=>({px:xPts[i],py:y+cH-(((d.values[ci]||0)-vMin)/vR)*cH}));

    // Filled area
    ctx.beginPath();ctx.moveTo(pts[0].px,y+cH);
    pts.forEach(pt=>ctx.lineTo(pt.px,pt.py));
    ctx.lineTo(pts[n-1].px,y+cH);ctx.closePath();
    ctx.fillStyle=col+(nc>1?'60':'40');
    ctx.fill();

    // Line on top
    ctx.beginPath();ctx.moveTo(pts[0].px,pts[0].py);
    for(let i=1;i<n;i++) ctx.lineTo(pts[i].px,pts[i].py);
    ctx.strokeStyle=col;ctx.lineWidth=Math.max(2,W*0.003);ctx.lineJoin='round';ctx.stroke();
  });

  // Values for single column
  if(showVal&&nc===1){
    const ci=cols[0];
    const pts=data.map((d,i)=>({px:xPts[i],py:y+cH-(((d.values[ci]||0)-vMin)/vR)*cH}));
    const sz=Math.max(W*0.018,11);
    ctx.font=`600 ${sz}px Barlow`;ctx.fillStyle=p.text;ctx.textAlign='center';ctx.textBaseline='bottom';
    pts.forEach((pt,i)=>ctx.fillText(fmtN(data[i].values[ci]||0),pt.px,pt.py-W*0.015));
  }

  if(showXL){
    const sz=Math.max(W*0.018,11);
    ctx.font=`500 ${sz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.textBaseline='top';
    data.forEach((d,i)=>ctx.fillText(trunc(ctx,shortLabel(d.label),w/(n-1)*0.9),xPts[i],y+cH+W*0.009));
  }

  if(nc>1) drawLegend(ctx,cols,colNames,p,W,x+glW,y+cH+lblH+legH*0.2);

  if(showTrend&&nc===1){
    drawTrend(ctx,data,cols[0],xPts,v=>y+cH-((v-vMin)/vR)*cH,O);
  }
}});
