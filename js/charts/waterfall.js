registerChart('waterfall',{label:'Waterval',draw:function(ctx,data,x,y,w,h,O){
  const {showGrid,showVal,showXL,lay,W,p,cols}=O;
  const ci=cols[0]||0;
  const n=data.length;
  const vals=data.map(d=>d.values[ci]||0);

  // Compute running total and find min/max
  let running=0;
  const segments=vals.map(v=>{
    const start=running;
    running+=v;
    return {start,end:running,val:v};
  });
  const allY=[0,...segments.map(s=>s.start),...segments.map(s=>s.end)];
  const maxV=Math.max(...allY), minV=Math.min(...allY);
  const range=maxV-minV||1;
  const lblH=showXL?h*0.13:0;
  const cH=h-lblH;
  const glW=showGrid&&lay!=='strak'?W*0.05:0;

  if(showGrid&&lay!=='strak') drawGrid(ctx,x,y,w,cH,minV,maxV,8,glW,O);

  const gap=n>10?0.10:n>6?0.14:0.18;
  const gW=(w-glW)/n, bW=gW*(1-gap);

  segments.forEach((seg,i)=>{
    const bx=x+glW+gW*i+gW*gap/2;
    const topY=y+cH-((Math.max(seg.start,seg.end)-minV)/range)*cH;
    const botY=y+cH-((Math.min(seg.start,seg.end)-minV)/range)*cH;
    const bH=botY-topY||1;
    const col=seg.val>=0?p.bars[0]:p.bars[2]||p.bars[0];
    ctx.fillStyle=col;
    if(lay==='strak') ctx.fillRect(bx,topY,bW,bH);
    else{const rr=Math.min(bW*0.14,bH*0.15,W*0.006);rbar(ctx,bx,topY,bW,bH,seg.val>=0?rr:0,seg.val>=0?0:rr);}

    // Connector line to next bar
    if(i<n-1){
      const ny=y+cH-((seg.end-minV)/range)*cH;
      ctx.strokeStyle=p.muted+'60';ctx.lineWidth=1;ctx.setLineDash([W*0.004,W*0.004]);
      ctx.beginPath();ctx.moveTo(bx+bW,ny);ctx.lineTo(bx+gW+gW*gap/2,ny);ctx.stroke();
      ctx.setLineDash([]);
    }

    if(showVal){
      const sz=Math.max(W*0.019,12);
      ctx.font=`600 ${sz}px Barlow`;ctx.fillStyle=p.text;ctx.textAlign='center';ctx.textBaseline='bottom';
      const prefix=seg.val>0?'+':'';
      ctx.fillText(prefix+fmtN(seg.val),bx+bW/2,topY-W*0.007);
    }
    if(showXL){
      const sz=Math.max(W*0.018,11);
      ctx.font=`500 ${sz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.textBaseline='top';
      ctx.fillText(trunc(ctx,shortLabel(data[i].label),gW*0.9),bx+bW/2,y+cH+W*0.01);
    }
  });
}});
