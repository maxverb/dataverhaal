registerChart('line',{label:'Lijn',draw:function(ctx,data,x,y,w,h,O){
  const {showGrid,showVal,showXL,lay,W,p,cols,colNames}=O;
  const n=data.length, nc=cols.length;
  if(n<2){CHARTS.bar.draw(ctx,data,x,y,w,h,O);return;}
  const allVals=data.flatMap(d=>cols.map(c=>d.values[c]||0));
  const maxV=Math.max(...allVals), minV=Math.min(...allVals);
  const pad=(maxV-minV)*0.15||maxV*0.1||1;
  const vMax=maxV+pad, vMin=minV-pad, vR=vMax-vMin;
  const legH=nc>1?W*0.04:0;
  const lblH=showXL?h*0.11:0;
  const cH=h-lblH-legH;
  const glW=showGrid&&lay!=='strak'?W*0.05:0;

  if(showGrid&&lay!=='strak') drawGrid(ctx,x,y,w,cH,vMin,vMax,5,glW,O);

  const xPts=data.map((_,i)=>x+glW+(i/(n-1))*(w-glW));

  cols.forEach((ci,j)=>{
    const col=nc>1?p.bars[j%p.bars.length]:p.acc;
    const pts=data.map((d,i)=>({px:xPts[i],py:y+cH-(((d.values[ci]||0)-vMin)/vR)*cH}));

    if(nc===1){
      ctx.beginPath();ctx.moveTo(pts[0].px,y+cH);
      pts.forEach(pt=>ctx.lineTo(pt.px,pt.py));
      ctx.lineTo(pts[n-1].px,y+cH);ctx.closePath();
      const gr=ctx.createLinearGradient(0,y,0,y+cH);
      gr.addColorStop(0,col+'50');gr.addColorStop(1,col+'06');
      ctx.fillStyle=gr;ctx.fill();
    }

    ctx.beginPath();ctx.moveTo(pts[0].px,pts[0].py);
    for(let i=1;i<n;i++) ctx.lineTo(pts[i].px,pts[i].py);
    ctx.strokeStyle=col;ctx.lineWidth=Math.max(3,W*0.005);ctx.lineJoin='round';ctx.stroke();

    pts.forEach(pt=>{
      ctx.beginPath();ctx.arc(pt.px,pt.py,W*0.007,0,Math.PI*2);
      ctx.fillStyle=col;ctx.fill();ctx.strokeStyle=p.bg;ctx.lineWidth=W*0.003;ctx.stroke();
    });

    if(showVal&&nc===1){
      const sz=Math.max(W*0.018,11);
      ctx.font=`600 ${sz}px Barlow`;ctx.fillStyle=p.text;ctx.textAlign='center';ctx.textBaseline='bottom';
      pts.forEach((pt,i)=>ctx.fillText(fmtN(data[i].values[ci]||0),pt.px,pt.py-W*0.028));
    }
  });

  if(showXL){
    const sz=Math.max(W*0.018,11);
    ctx.font=`500 ${sz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.textBaseline='top';
    data.forEach((d,i)=>ctx.fillText(trunc(ctx,shortLabel(d.label),w/(n-1)*0.9),xPts[i],y+cH+W*0.009));
  }

  if(nc>1) drawLegend(ctx,cols,colNames,p,W,x+glW,y+cH+lblH+legH*0.2);
}});
