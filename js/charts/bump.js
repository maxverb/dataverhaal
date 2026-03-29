registerChart('bump',{label:'Bump',draw:function(ctx,data,x,y,w,h,O){
  const {showXL,W,p,cols}=O;
  const ci=cols[0]||0;
  const n=data.length;
  if(n<2)return;

  // Need multiple columns as "time periods" — each column is a period
  // Rows are the items being ranked
  // If only 1 column, can't make a bump chart
  const nc=cols.length;
  if(nc<2){
    // Fallback: treat as regular line
    CHARTS.line.draw(ctx,data,x,y,w,h,O);return;
  }

  // Compute ranks per column
  const nItems=data.length;
  const ranks=[];// ranks[colIdx][itemIdx] = rank
  cols.forEach(ci=>{
    const vals=data.map((d,i)=>({i,v:d.values[ci]||0}));
    vals.sort((a,b)=>b.v-a.v);
    const r=new Array(nItems);
    vals.forEach((v,rank)=>{r[v.i]=rank+1;});
    ranks.push(r);
  });

  const lblH=showXL?h*0.11:0;
  const cH=h-lblH;
  const glW=W*0.05;
  const xPts=cols.map((_,j)=>x+glW+(j/(nc-1))*(w-glW));
  const yFn=rank=>y+((rank-0.5)/nItems)*cH;

  // Draw lines per item
  data.forEach((d,i)=>{
    const col=p.bars[i%p.bars.length];
    ctx.strokeStyle=col;
    ctx.lineWidth=Math.max(3,W*0.004);
    ctx.lineJoin='round';
    ctx.beginPath();
    cols.forEach((_,j)=>{
      const py=yFn(ranks[j][i]);
      if(j===0) ctx.moveTo(xPts[j],py);
      else ctx.lineTo(xPts[j],py);
    });
    ctx.stroke();

    // Dots + rank labels
    cols.forEach((_,j)=>{
      const py=yFn(ranks[j][i]);
      ctx.beginPath();ctx.arc(xPts[j],py,W*0.008,0,Math.PI*2);
      ctx.fillStyle=col;ctx.fill();
      ctx.strokeStyle=p.bg;ctx.lineWidth=W*0.003;ctx.stroke();
    });

    // Label at end
    const lastY=yFn(ranks[nc-1][i]);
    const sz=Math.max(W*0.014,10);
    ctx.font=`600 ${sz}px Barlow`;
    ctx.fillStyle=col;ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillText(trunc(ctx,d.label,W*0.12),xPts[nc-1]+W*0.015,lastY);
  });

  // Column headers
  if(showXL){
    const sz=Math.max(W*0.016,11);
    ctx.font=`500 ${sz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.textBaseline='top';
    cols.forEach((ci,j)=>{
      ctx.fillText(O.colNames[ci]||'Periode '+(j+1),xPts[j],y+cH+W*0.009);
    });
  }
}});
