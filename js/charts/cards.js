registerChart('cards',{label:'Kaarten',draw:function(ctx,data,x,y,w,h,O){
  const {showVal,W,p,cols,colNames}=O;
  const n=data.length;
  if(!n)return;

  const ci=cols[0]||0;
  const ci2=cols.length>1?cols[1]:null;
  const ci3=cols.length>2?cols[2]:null;

  // Grid layout: 2 columns
  const gridCols=2;
  const rows=Math.ceil(n/gridCols);
  const gap=W*0.012;
  const cardW=(w-gap*(gridCols-1))/gridCols;
  const cardH=Math.min((h-gap*(rows-1))/rows, h*0.22);
  const rr=W*0.006;

  // Top 3 get accent background
  const sorted=[...data].map((d,i)=>({i,v:d.values[ci]||0})).sort((a,b)=>b.v-a.v);
  const top3=new Set(sorted.slice(0,3).map(s=>s.i));

  data.forEach((d,i)=>{
    const col=Math.floor(i%gridCols);
    const row=Math.floor(i/gridCols);
    const cx=x+col*(cardW+gap);
    const cy=y+row*(cardH+gap);

    const isTop=top3.has(i);
    const rank=sorted.findIndex(s=>s.i===i)+1;

    // Card background
    ctx.fillStyle=isTop?p.acc:p.bg;
    rrect(ctx,cx,cy,cardW,cardH,rr);
    ctx.fill();

    // Left accent border
    ctx.fillStyle=isTop?p.acc:'#ccc';
    ctx.fillRect(cx,cy+rr,W*0.004,cardH-rr*2);

    // Rank badge
    const badgeSz=W*0.022;
    ctx.font=`700 ${badgeSz}px Barlow Condensed`;
    ctx.fillStyle=isTop?'rgba(255,255,255,0.9)':p.acc;
    ctx.textAlign='left';ctx.textBaseline='top';
    ctx.fillText(`#${rank}`,cx+W*0.014,cy+cardH*0.12);

    // Label (title)
    const lblSz=W*0.017;
    ctx.font=`600 ${lblSz}px Barlow`;
    ctx.fillStyle=isTop?'#fff':p.text;
    ctx.textAlign='left';ctx.textBaseline='top';
    const lblX=cx+W*0.045;
    const maxLblW=cardW-W*0.06;
    ctx.fillText(trunc(ctx,d.label,maxLblW),lblX,cy+cardH*0.12);

    // Main value
    const valSz=W*0.022;
    ctx.font=`700 ${valSz}px Barlow`;
    ctx.fillStyle=isTop?'#fff':p.acc;
    ctx.textAlign='left';ctx.textBaseline='top';
    const valPrefix=colNames[ci]?colNames[ci]+': ':'';
    ctx.fillText(valPrefix+fmtN(d.values[ci]||0),lblX,cy+cardH*0.45);

    // Secondary value (right side)
    if(ci2!==null&&d.values[ci2]!==undefined){
      const secSz=W*0.014;
      ctx.font=`500 ${secSz}px Barlow`;
      ctx.fillStyle=isTop?'rgba(255,255,255,0.7)':p.muted;
      ctx.textAlign='right';ctx.textBaseline='bottom';
      const secLabel=colNames[ci2]||'';
      ctx.fillText(fmtN(d.values[ci2]||0)+(secLabel?' '+secLabel:''),cx+cardW-W*0.014,cy+cardH*0.85);
    }

    // Tag/badge from third column
    if(ci3!==null&&d.values[ci3]!==undefined){
      const tagSz=W*0.012;
      const tagTxt=fmtN(d.values[ci3]||0);
      ctx.font=`600 ${tagSz}px Barlow`;
      const tagW=ctx.measureText(tagTxt).width+W*0.016;
      const tagH=tagSz*1.8;
      const tagX=cx+cardW-W*0.014-tagW;
      const tagY=cy+cardH*0.15;
      ctx.fillStyle=isTop?'rgba(255,255,255,0.2)':p.acc;
      rrect(ctx,tagX,tagY,tagW,tagH,tagH/2);
      ctx.fill();
      ctx.fillStyle=isTop?'#fff':'#fff';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(tagTxt,tagX+tagW/2,tagY+tagH/2);
    }

    // Card border/outline for non-top
    if(!isTop){
      ctx.strokeStyle=p.muted+'40';
      ctx.lineWidth=1;
      rrect(ctx,cx,cy,cardW,cardH,rr);
      ctx.stroke();
    }
  });
}});
