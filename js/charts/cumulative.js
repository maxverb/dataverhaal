registerChart('cumul',{label:'Cumulatief',draw:function(ctx,data,x,y,w,h,O){
  const {showGrid,showVal,showXL,showTrend,W,p,cols,colNames}=O;
  const n=data.length, nc=cols.length;
  if(n<2){CHARTS.bar.draw(ctx,data,x,y,w,h,O);return;}

  // Build cumulative data
  const cumData=[];
  const running=cols.map(()=>0);
  data.forEach(d=>{
    const cd={label:d.label,values:[...d.values]};
    cols.forEach((ci,j)=>{running[j]+=d.values[ci]||0;cd.values[ci]=running[j];});
    cumData.push(cd);
  });

  const allVals=cumData.flatMap(d=>cols.map(c=>d.values[c]||0));
  const maxV=Math.max(...allVals);
  const pad=maxV*0.1||1;
  const vMax=maxV+pad, vMin=0, vR=vMax;
  const legH=nc>1?W*0.04:0;
  const lblH=showXL?h*0.11:0;
  const cH=h-lblH-legH;
  const glW=showGrid?W*0.05:0;

  if(showGrid) drawGrid(ctx,x,y,w,cH,0,vMax,5,glW,O);

  const xPts=cumData.map((_,i)=>x+glW+(i/(n-1))*(w-glW));

  cols.forEach((ci,j)=>{
    const col=nc>1?p.bars[j%p.bars.length]:p.acc;
    const pts=cumData.map((d,i)=>({px:xPts[i],py:y+cH-((d.values[ci]||0)/vR)*cH}));

    // Fill
    if(nc===1){
      ctx.beginPath();ctx.moveTo(pts[0].px,y+cH);
      pts.forEach(pt=>ctx.lineTo(pt.px,pt.py));
      ctx.lineTo(pts[n-1].px,y+cH);ctx.closePath();
      const gr=ctx.createLinearGradient(0,y,0,y+cH);
      gr.addColorStop(0,col+'50');gr.addColorStop(1,col+'06');
      ctx.fillStyle=gr;ctx.fill();
    }

    // Line
    ctx.beginPath();ctx.moveTo(pts[0].px,pts[0].py);
    for(let i=1;i<n;i++) ctx.lineTo(pts[i].px,pts[i].py);
    ctx.strokeStyle=col;ctx.lineWidth=Math.max(3,W*0.005);ctx.lineJoin='round';ctx.stroke();

    // Dots
    pts.forEach(pt=>{
      ctx.beginPath();ctx.arc(pt.px,pt.py,W*0.007,0,Math.PI*2);
      ctx.fillStyle=col;ctx.fill();ctx.strokeStyle=p.bg;ctx.lineWidth=W*0.003;ctx.stroke();
    });

    // End value
    if(showVal){
      const last=pts[n-1];
      const sz=Math.max(W*0.018,11);
      ctx.font=`700 ${sz}px Barlow`;ctx.fillStyle=col;ctx.textAlign='left';ctx.textBaseline='middle';
      ctx.fillText(fmtN(cumData[n-1].values[ci]||0),last.px+W*0.012,last.py);
    }
  });

  if(showXL){
    const sz=Math.max(W*0.018,11);
    ctx.font=`500 ${sz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.textBaseline='top';
    data.forEach((d,i)=>ctx.fillText(trunc(ctx,shortLabel(d.label),w/(n-1)*0.9),xPts[i],y+cH+W*0.009));
  }

  if(nc>1) drawLegend(ctx,cols,colNames,p,W,x+glW,y+cH+lblH+legH*0.2);
}});
