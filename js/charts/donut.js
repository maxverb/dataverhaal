registerChart('donut',{label:'Donut',draw:function(ctx,data,x,y,w,h,O){
  const {showVal,W,p,cols}=O;
  const ci=cols[0]||0;
  const total=data.reduce((s,d)=>s+(d.values[ci]||0),0)||1;
  const cx=x+w/2, cy=y+h*0.42;
  const R=Math.min(w,h*0.72)*0.4, iR=R*0.55;
  let angle=-Math.PI/2;

  // Segments + percentage labels
  const segs=[];
  data.forEach((d,i)=>{
    const v=d.values[ci]||0;
    const sl=(v/total)*Math.PI*2;
    ctx.beginPath();
    ctx.moveTo(cx+Math.cos(angle)*iR,cy+Math.sin(angle)*iR);
    ctx.arc(cx,cy,R,angle,angle+sl);
    ctx.arc(cx,cy,iR,angle+sl,angle,true);
    ctx.closePath();
    ctx.fillStyle=p.bars[i%p.bars.length];ctx.fill();
    segs.push({mid:angle+sl/2,pct:Math.round(v/total*100)});
    angle+=sl;
  });

  // Percentage labels on segments
  if(showVal){
    const sz=Math.max(W*0.016,10);
    ctx.font=`700 ${sz}px Barlow`;ctx.textAlign='center';ctx.textBaseline='middle';
    segs.forEach((s,i)=>{
      if(s.pct<3)return; // skip tiny segments
      const lr=(R+iR)/2;
      const lx=cx+Math.cos(s.mid)*lr;
      const ly=cy+Math.sin(s.mid)*lr;
      ctx.fillStyle='#fff';
      ctx.fillText(s.pct+'%',lx,ly);
    });
  }

  // Center label — use eyebrow field as custom label, fallback to total
  const customLabel=document.getElementById('ttl').value;
  const centerTop=fmtN(total);
  const centerBot=customLabel?'':'totaal';
  const sz1=R*0.32;
  ctx.font=`700 ${sz1}px Sora`;
  ctx.fillStyle=p.text;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(centerTop,cx,cy-sz1*0.15);
  if(centerBot){
    const sz2=R*0.18;
    ctx.font=`400 ${sz2}px Barlow`;ctx.fillStyle=p.muted;
    ctx.fillText(centerBot,cx,cy+sz1*0.5);
  }

  // Legend
  const legY=y+h*0.82, iW=w/Math.min(data.length,4);
  const lsz=Math.max(W*0.018,11);
  data.slice(0,8).forEach((d,i)=>{
    const lx=x+iW*(i%4)+iW*0.08;
    const ly=legY+Math.floor(i/4)*W*0.038;
    ctx.fillStyle=p.bars[i%p.bars.length];
    ctx.fillRect(lx,ly-lsz*0.45,lsz*0.8,lsz*0.8);
    ctx.font=`500 ${lsz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillText(trunc(ctx,shortLabel(d.label),iW*0.8),lx+lsz*1.1,ly);
  });
}});
