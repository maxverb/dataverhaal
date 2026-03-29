registerChart('stacked',{label:'Gestapeld',draw:function(ctx,data,x,y,w,h,O){
  const {showGrid,showVal,showXL,lay,W,p,cols,colNames}=O;
  const n=data.length, nc=cols.length;
  if(nc<2){CHARTS.bar.draw(ctx,data,x,y,w,h,O);return;}

  // Compute stacked totals
  const totals=data.map(d=>cols.reduce((s,c)=>s+(d.values[c]||0),0));
  const maxV=Math.max(...totals);
  const range=maxV||1;
  const legH=W*0.04;
  const lblH=showXL?h*0.13:0;
  const cH=h-lblH-legH;
  const glW=showGrid&&lay!=='strak'?W*0.05:0;

  drawLegend(ctx,cols,colNames,p,W,x,y+cH+lblH+legH*0.2);
  if(showGrid&&lay!=='strak') drawGrid(ctx,x,y,w,cH,0,maxV,8,glW,O);

  const gap=n>10?0.10:n>6?0.14:0.18;
  const gW=(w-glW)/n, bW=gW*(1-gap);

  data.forEach((d,i)=>{
    const bx=x+glW+gW*i+gW*gap/2;
    let stackY=y+cH; // bottom of chart
    cols.forEach((ci,j)=>{
      const v=d.values[ci]||0;
      const bH=(v/range)*cH;
      stackY-=bH;
      const col=p.bars[j%p.bars.length];
      ctx.fillStyle=col;
      if(lay==='strak') ctx.fillRect(bx,stackY,bW,bH);
      else{
        const isTop=j===nc-1;
        const rr=Math.min(bW*0.14,bH*0.15,W*0.006);
        rbar(ctx,bx,stackY,bW,bH,isTop?rr:0,0);
      }
    });
    if(showVal){
      const sz=Math.max(W*0.019,12);
      ctx.font=`600 ${sz}px Barlow`;ctx.fillStyle=p.text;ctx.textAlign='center';ctx.textBaseline='bottom';
      ctx.fillText(fmtN(totals[i]),bx+bW/2,y+cH-(totals[i]/range)*cH-W*0.007);
    }
    if(showXL){
      const sz=Math.max(W*0.018,11);
      ctx.font=`500 ${sz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.textBaseline='top';
      ctx.fillText(trunc(ctx,shortLabel(d.label),gW*0.9),bx+bW/2,y+cH+W*0.01);
    }
  });
}});
