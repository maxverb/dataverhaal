registerChart('bar',{label:'Bar',draw:function(ctx,data,x,y,w,h,O){
  const {showGrid,showVal,showXL,showTrend,lay,W,p,oneClr,cols,colNames}=O;
  const n=data.length, nc=cols.length;
  const allVals=data.flatMap(d=>cols.map(c=>d.values[c]||0));
  const maxV=Math.max(...allVals), minV=Math.min(0,...allVals);
  const range=maxV-minV||1;
  const legH=nc>1?W*0.04:0;
  const lblH=showXL?h*0.13:0;
  const cH=h-lblH-legH;
  const z0=y+cH-((-minV)/range)*cH;
  const glW=showGrid&&lay!=='strak'?W*0.05:0;

  if(nc>1) drawLegend(ctx,cols,colNames,p,W,x,y+cH+lblH+legH*0.2);
  if(showGrid&&lay!=='strak') drawGrid(ctx,x,y,w,cH,minV,maxV,8,glW,O);

  const gap=n>10?0.10:n>6?0.14:0.18;
  const gW=(w-glW)/n, bW=gW*(1-gap), subW=bW/nc;
  const zones=[];

  data.forEach((d,i)=>{
    const bx=x+glW+gW*i+gW*gap/2;
    const isHi=S.highlight===i;
    cols.forEach((ci,j)=>{
      const v=d.values[ci]||0;
      const bH=Math.abs((v/range)*cH), by=v>=0?z0-bH:z0;
      const col=nc>1?p.bars[j%p.bars.length]:(oneClr?p.bars[0]:p.bars[i%p.bars.length]);
      ctx.fillStyle=isHi?p.acc:col;
      if(isHi) ctx.globalAlpha=1; else if(S.highlight!==null) ctx.globalAlpha=0.4;
      const sx=bx+subW*j;
      if(lay==='strak') ctx.fillRect(sx,by,subW-(nc>1?1:0),bH);
      else{const rr=Math.min(subW*0.14,bH*0.15,W*0.006);rbar(ctx,sx,by,subW-(nc>1?1:0),bH,v>=0?rr:0,v>=0?0:rr);}
      ctx.globalAlpha=1;
      if(j===0) zones.push({x:bx,y:Math.min(by,z0),w:bW,h:Math.max(bH,gW),idx:i});
    });
    if(showVal&&nc===1){
      const v=data[i].values[cols[0]]||0;
      const bH=Math.abs((v/range)*cH), by=v>=0?z0-bH:z0;
      const sz=Math.max(W*0.019,12);
      ctx.font=`600 ${sz}px Barlow`;ctx.fillStyle=p.text;ctx.textAlign='center';ctx.textBaseline='bottom';
      ctx.fillText(fmtN(v),bx+bW/2,v>=0?by-W*0.007:by+bH+sz+W*0.005);
    }
    // Highlight callout
    if(isHi){
      const v=d.values[cols[0]]||0;
      const bH=Math.abs((v/range)*cH), by=v>=0?z0-bH:z0;
      const sz=Math.max(W*0.02,13);
      ctx.font=`700 ${sz}px Barlow`;
      const txt=`${shortLabel(d.label)}: ${fmtN(v)}`;
      const tw=ctx.measureText(txt).width;
      const px=bx+bW/2-tw/2-W*0.008, py=by-W*0.04;
      ctx.fillStyle=p.text;
      rrect(ctx,px,py,tw+W*0.016,sz*1.6,W*0.004);ctx.fill();
      ctx.fillStyle=p.bg;ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(txt,bx+bW/2,py+sz*0.8);
    }
    if(showXL){
      const sz=Math.max(W*0.018,11);
      ctx.font=`500 ${sz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.textBaseline='top';
      ctx.fillText(trunc(ctx,shortLabel(d.label),gW*0.9),bx+bW/2,y+cH+W*0.01);
    }
  });
  if(minV<0){ctx.strokeStyle=p.muted;ctx.lineWidth=Math.max(1.5,W*0.002);ctx.beginPath();ctx.moveTo(x+glW,z0);ctx.lineTo(x+w,z0);ctx.stroke();}

  // Trendline & MA
  if((showTrend||O.showMA)&&nc===1){
    const xPts=data.map((_,i)=>x+glW+gW*i+gW/2);
    const yFn=v=>y+cH-((v-minV)/range)*cH;
    if(showTrend) drawTrend(ctx,data,cols[0],xPts,yFn,O);
    if(O.showMA) drawMA(ctx,data,cols[0],xPts,yFn,O,7);
  }

  registerHitZones(zones);
}});
