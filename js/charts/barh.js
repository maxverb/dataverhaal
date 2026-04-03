registerChart('barh',{label:'Horiz.',draw:function(ctx,data,x,y,w,h,O){
  const {showGrid,showVal,lay,W,p,oneClr,cols,colNames}=O;
  const n=data.length, nc=cols.length;
  const allVals=data.flatMap(d=>cols.map(c=>d.values[c]||0));
  const maxV=Math.max(...allVals)||1;

  // Dynamic label width: measure longest label
  const lblSz=Math.max(W*0.018,11);
  ctx.font=`500 ${lblSz}px Barlow`;
  let lblW=0;
  data.forEach(d=>{const tw=ctx.measureText(shortLabel(d.label)).width;if(tw>lblW)lblW=tw;});
  lblW=Math.min(lblW+W*0.02, w*0.4); // add padding, max 40%

  const cX=x+lblW+W*0.008, cW=w-lblW-W*0.008;
  const legH=nc>1?W*0.04:0;
  const gap=n>8?0.10:0.18;
  const gH=(h-legH)/n, bH=gH*(1-gap), subH=bH/nc;

  if(nc>1) drawLegend(ctx,cols,colNames,p,W,cX,y+h-legH+legH*0.2);

  if(showGrid&&lay!=='strak'){
    const ticks=niceTicks(0,maxV,8);
    ctx.strokeStyle=p.muted+'70';ctx.lineWidth=Math.max(1.5,W*0.0014);ctx.setLineDash([]);
    ticks.forEach(t=>{const tx=cX+(t/maxV)*cW;ctx.beginPath();ctx.moveTo(tx,y);ctx.lineTo(tx,y+h-legH);ctx.stroke();});
    ctx.setLineDash([]);
  }

  data.forEach((d,i)=>{
    const by0=y+gH*i+gH*gap/2;
    cols.forEach((ci,j)=>{
      const v=d.values[ci]||0, by=by0+subH*j, bW=(v/maxV)*cW;
      const col=nc>1?p.bars[j%p.bars.length]:(oneClr?p.bars[0]:p.bars[i%p.bars.length]);
      ctx.fillStyle=col;
      if(lay==='strak') ctx.fillRect(cX,by,bW,subH-(nc>1?1:0));
      else{const rr=Math.min(subH*0.3,W*0.005);rbar(ctx,cX,by,bW,subH-(nc>1?1:0),0,rr);}
      if(showVal&&nc===1){
        const sz=Math.max(W*0.018,11);
        ctx.font=`600 ${sz}px Barlow`;ctx.fillStyle=p.text;ctx.textAlign='left';ctx.textBaseline='middle';
        ctx.fillText(fmtN(v),cX+bW+W*0.012,by+subH/2);
      }
    });
    const sz=Math.max(W*0.018,11);
    ctx.font=`500 ${sz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='right';ctx.textBaseline='middle';
    ctx.fillText(trunc(ctx,shortLabel(d.label),lblW-W*0.02),cX-W*0.015,by0+bH/2);
  });
}});
