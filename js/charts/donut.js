registerChart('donut',{label:'Donut',draw:function(ctx,data,x,y,w,h,O){
  const {showVal,W,p,cols}=O;
  const ci=cols[0]||0;
  const total=data.reduce((s,d)=>s+(d.values[ci]||0),0)||1;
  const cx=x+w/2, cy=y+h*0.42;
  const R=Math.min(w,h*0.72)*0.4, iR=R*0.55;
  let angle=-Math.PI/2;
  data.forEach((d,i)=>{
    const sl=((d.values[ci]||0)/total)*Math.PI*2;
    ctx.beginPath();
    ctx.moveTo(cx+Math.cos(angle)*iR,cy+Math.sin(angle)*iR);
    ctx.arc(cx,cy,R,angle,angle+sl);
    ctx.arc(cx,cy,iR,angle+sl,angle,true);
    ctx.closePath();
    ctx.fillStyle=p.bars[i%p.bars.length];ctx.fill();
    angle+=sl;
  });
  if(showVal&&data.length>0){
    const pct=Math.round((data[0].values[ci]||0)/total*100)+'%';
    ctx.font=`700 ${R*0.38}px Sora`;
    ctx.fillStyle=p.text;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(pct,cx,cy);
  }
  const legY=y+h*0.82, iW=w/Math.min(data.length,4);
  const sz=Math.max(W*0.018,11);
  data.slice(0,8).forEach((d,i)=>{
    const lx=x+iW*(i%4)+iW*0.08;
    const ly=legY+Math.floor(i/4)*W*0.038;
    ctx.fillStyle=p.bars[i%p.bars.length];
    ctx.fillRect(lx,ly-sz*0.45,sz*0.8,sz*0.8);
    ctx.font=`500 ${sz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillText(trunc(ctx,shortLabel(d.label),iW*0.8),lx+sz*1.1,ly);
  });
}});
