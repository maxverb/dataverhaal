registerChart('dualaxis',{label:'Dual-as',draw:function(ctx,data,x,y,w,h,O){
  const {showGrid,showVal,showXL,W,p,cols,colNames}=O;
  const n=data.length, nc=cols.length;
  if(nc<2||n<2){CHARTS.bar.draw(ctx,data,x,y,w,h,O);return;}

  const c1=cols[0], c2=cols[1];
  const lblH=showXL?h*0.12:0;
  const legH=W*0.04;
  const cH=h-lblH-legH;
  const glW=showGrid?W*0.05:0;
  const grW=showGrid?W*0.05:0;

  // Scale for left axis (bars - col 1)
  const vals1=data.map(d=>d.values[c1]||0);
  const max1=Math.max(...vals1)||1;

  // Scale for right axis (line - col 2)
  const vals2=data.map(d=>d.values[c2]||0);
  const max2=Math.max(...vals2)||1;
  const pad2=max2*0.1||1;
  const vMax2=max2+pad2;

  // Left axis grid
  if(showGrid){
    const ticks=niceTicks(0,max1,5);
    const sz=W*0.014;
    ctx.font=`400 ${sz}px Barlow`;
    ctx.strokeStyle=p.muted+'50';ctx.lineWidth=1;ctx.setLineDash([]);
    ticks.forEach(t=>{
      const ty=y+cH-((t/max1)*cH);
      ctx.beginPath();ctx.moveTo(x+glW,ty);ctx.lineTo(x+w-grW,ty);ctx.stroke();
      ctx.fillStyle=p.bars[0];ctx.textAlign='right';ctx.textBaseline='middle';
      ctx.fillText(fmtN(t),x+glW-W*0.006,ty);
    });
    // Right axis labels
    const ticks2=niceTicks(0,vMax2,5);
    ticks2.forEach(t=>{
      const ty=y+cH-((t/vMax2)*cH);
      ctx.fillStyle=p.bars[1%p.bars.length];ctx.textAlign='left';ctx.textBaseline='middle';
      ctx.fillText(fmtN(t),x+w-grW+W*0.006,ty);
    });
    ctx.setLineDash([]);
  }

  // Bars (col 1)
  const gap=n>10?0.12:0.2;
  const gW=(w-glW-grW)/n;
  const bW=gW*(1-gap);
  const col1=p.bars[0];

  data.forEach((d,i)=>{
    const v=d.values[c1]||0;
    const bx=x+glW+gW*i+gW*gap/2;
    const bH=(v/max1)*cH;
    const by=y+cH-bH;
    ctx.fillStyle=col1+'90';
    const rr=Math.min(bW*0.14,bH*0.15,W*0.006);
    rbar(ctx,bx,by,bW,bH,rr,0);

    if(showXL){
      const sz=Math.max(W*0.016,10);
      ctx.font=`500 ${sz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.textBaseline='top';
      ctx.fillText(trunc(ctx,shortLabel(d.label),gW*0.9),bx+bW/2,y+cH+W*0.008);
    }
  });

  // Line (col 2)
  const col2=p.bars[1%p.bars.length];
  const xPts=data.map((_,i)=>x+glW+gW*i+gW/2);
  const pts=data.map((d,i)=>({px:xPts[i],py:y+cH-(((d.values[c2]||0)/vMax2)*cH)}));

  ctx.beginPath();ctx.moveTo(pts[0].px,pts[0].py);
  for(let i=1;i<n;i++) ctx.lineTo(pts[i].px,pts[i].py);
  ctx.strokeStyle=col2;ctx.lineWidth=Math.max(3,W*0.005);ctx.lineJoin='round';ctx.stroke();

  pts.forEach(pt=>{
    ctx.beginPath();ctx.arc(pt.px,pt.py,W*0.007,0,Math.PI*2);
    ctx.fillStyle=col2;ctx.fill();ctx.strokeStyle=p.bg;ctx.lineWidth=W*0.003;ctx.stroke();
  });

  if(showVal){
    const sz=Math.max(W*0.015,10);
    ctx.font=`600 ${sz}px Barlow`;ctx.fillStyle=col2;ctx.textAlign='center';ctx.textBaseline='bottom';
    pts.forEach((pt,i)=>ctx.fillText(fmtN(data[i].values[c2]||0),pt.px,pt.py-W*0.015));
  }

  // Legend
  drawLegend(ctx,[c1,c2],colNames,p,W,x+glW,y+cH+lblH+legH*0.2);
}});
