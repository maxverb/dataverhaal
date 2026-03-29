registerChart('line',{label:'Lijn',draw:function(ctx,data,x,y,w,h,O){
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
  const zones=[];

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

    pts.forEach((pt,i)=>{
      const isHi=S.highlight===i;
      const dotR=isHi?W*0.011:W*0.007;
      if(S.highlight!==null&&!isHi) ctx.globalAlpha=0.4;
      ctx.beginPath();ctx.arc(pt.px,pt.py,dotR,0,Math.PI*2);
      ctx.fillStyle=col;ctx.fill();ctx.strokeStyle=p.bg;ctx.lineWidth=W*0.003;ctx.stroke();
      ctx.globalAlpha=1;
      if(j===0) zones.push({x:pt.px-W*0.015,y:pt.py-W*0.015,w:W*0.03,h:W*0.03,idx:i});

      // Highlight callout
      if(isHi){
        const sz=Math.max(W*0.018,12);
        ctx.font=`700 ${sz}px Barlow`;
        const txt=`${shortLabel(data[i].label)}: ${fmtN(data[i].values[ci]||0)}`;
        const tw=ctx.measureText(txt).width;
        const px2=pt.px-tw/2-W*0.008, py2=pt.py-W*0.045;
        ctx.fillStyle=p.text;
        rrect(ctx,px2,py2,tw+W*0.016,sz*1.6,W*0.004);ctx.fill();
        ctx.fillStyle=p.bg;ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(txt,pt.px,py2+sz*0.8);
      }
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

  // Trendline & MA
  if((showTrend||O.showMA)&&nc===1){
    const yFn=v=>y+cH-((v-vMin)/vR)*cH;
    if(showTrend) drawTrend(ctx,data,cols[0],xPts,yFn,O);
    if(O.showMA) drawMA(ctx,data,cols[0],xPts,yFn,O,7);
  }

  registerHitZones(zones);
}});
