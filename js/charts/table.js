registerChart('table',{label:'Tabel',draw:function(ctx,data,x,y,w,h,O){
  const {W,p,cols,colNames}=O;
  const n=data.length;if(!n)return;
  const nc=cols.length;

  // Layout
  const lblW=w*0.35;
  const colW=(w-lblW)/nc;
  const headerH=W*0.032;
  const rowH=Math.min((h-headerH)/n,W*0.035);
  const sz=W*0.015;

  // Header row
  ctx.fillStyle=p.acc;
  ctx.fillRect(x,y,w,headerH);
  ctx.font=`700 ${sz}px Barlow`;
  ctx.fillStyle='#fff';
  ctx.textBaseline='middle';
  ctx.textAlign='left';
  ctx.fillText('Label',x+W*0.01,y+headerH/2);
  cols.forEach((ci,j)=>{
    ctx.textAlign='right';
    ctx.fillText(trunc(ctx,colNames[ci]||'Kol '+(ci+1),colW-W*0.01),x+lblW+colW*(j+1)-W*0.01,y+headerH/2);
  });

  // Rows
  data.forEach((d,i)=>{
    const ry=y+headerH+rowH*i;
    const isEven=i%2===0;

    // Zebra striping
    ctx.fillStyle=isEven?p.bg:(p.bg==='#0F172A'?'#1a2332':'#f3f4f6');
    ctx.fillRect(x,ry,w,rowH);

    // Highlight row
    if(S.highlight===i){
      ctx.fillStyle=p.acc+'20';
      ctx.fillRect(x,ry,w,rowH);
    }

    // Label
    ctx.font=`500 ${sz}px Barlow`;
    ctx.fillStyle=p.text;
    ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillText(trunc(ctx,shortLabel(d.label),lblW-W*0.02),x+W*0.01,ry+rowH/2);

    // Values
    cols.forEach((ci,j)=>{
      ctx.font=`600 ${sz}px Barlow`;
      ctx.fillStyle=S.highlight===i?p.acc:p.text;
      ctx.textAlign='right';
      ctx.fillText(fmtN(d.values[ci]||0),x+lblW+colW*(j+1)-W*0.01,ry+rowH/2);
    });

    // Row separator
    ctx.strokeStyle=p.muted+'20';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(x,ry+rowH);ctx.lineTo(x+w,ry+rowH);ctx.stroke();
  });
}});
