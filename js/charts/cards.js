// ── CARDS 1: Ranking ──────────────────────────────────────────────────────
// Clean ranking cards — accent top border on top 3, minimal design
registerChart('cards1',{label:'Kaarten 1',draw:function(ctx,data,x,y,w,h,O){
  const {W,p,cols,colNames,showVal}=O;
  const n=data.length;if(!n)return;
  const ci=cols[0]||0;
  const ci2=cols.length>1?cols[1]:null;

  const gridCols=2,rows=Math.ceil(n/gridCols);
  const gx=W*0.01,gy=W*0.01;
  const cW=(w-gx*(gridCols-1))/gridCols;
  const cH=Math.min((h-gy*(rows-1))/rows,W*0.07);

  const sorted=[...data].map((d,i)=>({i,v:d.values[ci]||0})).sort((a,b)=>b.v-a.v);
  const rankMap={};sorted.forEach((s,r)=>{rankMap[s.i]=r+1;});

  data.forEach((d,i)=>{
    const c=i%gridCols,r=Math.floor(i/gridCols);
    const cx=x+c*(cW+gx),cy=y+r*(cH+gy);
    const rank=rankMap[i];
    const isTop=rank<=3;

    // Card bg
    ctx.fillStyle=isTop?p.bg:p.bg;
    rrect(ctx,cx,cy,cW,cH,W*0.004);ctx.fill();

    // Top accent line for top 3
    const lineH=W*0.003;
    ctx.fillStyle=isTop?p.acc:p.muted+'30';
    ctx.fillRect(cx,cy,cW,lineH);

    // Rank
    const rSz=isTop?W*0.02:W*0.016;
    ctx.font=`700 ${rSz}px Sora`;
    ctx.fillStyle=isTop?p.acc:p.muted;
    ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillText(`${rank}`,cx+W*0.012,cy+cH*0.5);

    // Label
    const lSz=W*0.015;
    ctx.font=`600 ${lSz}px Barlow`;
    ctx.fillStyle=p.text;
    ctx.textAlign='left';ctx.textBaseline='top';
    const lx=cx+W*0.035;
    ctx.fillText(trunc(ctx,d.label,cW-W*0.1),lx,cy+cH*0.18);

    // Value
    const vSz=W*0.018;
    ctx.font=`700 ${vSz}px Barlow`;
    ctx.fillStyle=isTop?p.acc:p.text;
    ctx.textBaseline='bottom';
    ctx.fillText(fmtN(d.values[ci]||0),lx,cy+cH*0.88);

    // Secondary value right
    if(ci2!==null){
      const sSz=W*0.012;
      ctx.font=`400 ${sSz}px Barlow`;
      ctx.fillStyle=p.muted;
      ctx.textAlign='right';ctx.textBaseline='bottom';
      ctx.fillText(fmtN(d.values[ci2]||0)+(colNames[ci2]?' '+colNames[ci2]:''),cx+cW-W*0.012,cy+cH*0.85);
    }

    // Bottom border
    ctx.strokeStyle=p.muted+'25';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(cx,cy+cH);ctx.lineTo(cx+cW,cy+cH);ctx.stroke();
  });
}});

// ── CARDS 2: Insight ─────────────────────────────────────────────────────
// Big number cards — large accent number, bold title, suited for key findings
registerChart('cards2',{label:'Kaarten 2',draw:function(ctx,data,x,y,w,h,O){
  const {W,p,cols,colNames}=O;
  const n=data.length;if(!n)return;
  const ci=cols[0]||0;

  const gridCols=2,rows=Math.ceil(n/gridCols);
  const gx=W*0.012,gy=W*0.012;
  const cW=(w-gx*(gridCols-1))/gridCols;
  const cH=Math.min((h-gy*(rows-1))/rows,W*0.1);

  data.forEach((d,i)=>{
    const c=i%gridCols,r=Math.floor(i/gridCols);
    const cx=x+c*(cW+gx),cy=y+r*(cH+gy);

    // Card bg
    ctx.fillStyle=p.bg;
    rrect(ctx,cx,cy,cW,cH,W*0.005);ctx.fill();

    // Left accent bar
    ctx.fillStyle=p.acc;
    ctx.fillRect(cx,cy+W*0.005,W*0.0035,cH-W*0.01);

    // Big value top-left
    const nSz=W*0.028;
    ctx.font=`700 ${nSz}px Sora`;
    ctx.fillStyle=p.acc;
    ctx.textAlign='left';ctx.textBaseline='top';
    ctx.fillText(fmtN(d.values[ci]||0),cx+W*0.018,cy+cH*0.12);

    // Label as title
    const tSz=W*0.016;
    ctx.font=`600 ${tSz}px Barlow`;
    ctx.fillStyle=p.text;
    ctx.textBaseline='top';
    ctx.fillText(trunc(ctx,d.label,cW-W*0.03),cx+W*0.018,cy+cH*0.52);

    // Column name as subtle label
    if(colNames[ci]){
      const cSz=W*0.011;
      ctx.font=`500 ${cSz}px Barlow`;
      ctx.fillStyle=p.muted;
      ctx.textBaseline='bottom';
      ctx.fillText(colNames[ci],cx+W*0.018,cy+cH*0.92);
    }

    // Card outline
    ctx.strokeStyle=p.muted+'20';ctx.lineWidth=1;
    rrect(ctx,cx,cy,cW,cH,W*0.005);ctx.stroke();
  });
}});

// ── CARDS 3: Profile ─────────────────────────────────────────────────────
// Profile cards — dark accent header with label, values listed below
registerChart('cards3',{label:'Kaarten 3',draw:function(ctx,data,x,y,w,h,O){
  const {W,p,cols,colNames}=O;
  const n=data.length;if(!n)return;

  const gridCols=2,rows=Math.ceil(n/gridCols);
  const gx=W*0.01,gy=W*0.01;
  const cW=(w-gx*(gridCols-1))/gridCols;
  const cH=Math.min((h-gy*(rows-1))/rows,W*0.09);
  const headerH=cH*0.35;
  const rr=W*0.005;

  data.forEach((d,i)=>{
    const c=i%gridCols,r=Math.floor(i/gridCols);
    const cx=x+c*(cW+gx),cy=y+r*(cH+gy);

    // Header bar with accent
    ctx.fillStyle=p.acc;
    // Top rounded corners only
    ctx.beginPath();
    ctx.moveTo(cx+rr,cy);ctx.lineTo(cx+cW-rr,cy);
    ctx.quadraticCurveTo(cx+cW,cy,cx+cW,cy+rr);
    ctx.lineTo(cx+cW,cy+headerH);ctx.lineTo(cx,cy+headerH);
    ctx.lineTo(cx,cy+rr);ctx.quadraticCurveTo(cx,cy,cx+rr,cy);
    ctx.closePath();ctx.fill();

    // Label in header
    const hSz=W*0.017;
    ctx.font=`700 ${hSz}px Barlow`;
    ctx.fillStyle='#fff';
    ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillText(trunc(ctx,d.label,cW-W*0.025),cx+W*0.012,cy+headerH*0.5);

    // Body bg
    ctx.fillStyle=p.bg;
    ctx.beginPath();
    ctx.moveTo(cx,cy+headerH);ctx.lineTo(cx+cW,cy+headerH);
    ctx.lineTo(cx+cW,cy+cH-rr);ctx.quadraticCurveTo(cx+cW,cy+cH,cx+cW-rr,cy+cH);
    ctx.lineTo(cx+rr,cy+cH);ctx.quadraticCurveTo(cx,cy+cH,cx,cy+cH-rr);
    ctx.lineTo(cx,cy+headerH);ctx.closePath();ctx.fill();

    // Values listed
    const bodyH=cH-headerH;
    const maxRows=Math.min(cols.length,4);
    const rowH=bodyH/maxRows;
    cols.forEach((ci,j)=>{
      if(j>=maxRows)return;
      const ry=cy+headerH+rowH*j+rowH*0.5;
      const vSz=W*0.014;

      // Column name
      ctx.font=`400 ${vSz}px Barlow`;
      ctx.fillStyle=p.muted;
      ctx.textAlign='left';ctx.textBaseline='middle';
      ctx.fillText(colNames[ci]||'Kolom '+(ci+1),cx+W*0.012,ry);

      // Value
      ctx.font=`700 ${vSz}px Barlow`;
      ctx.fillStyle=p.text;
      ctx.textAlign='right';
      ctx.fillText(fmtN(d.values[ci]||0),cx+cW-W*0.012,ry);
    });

    // Card outline
    ctx.strokeStyle=p.muted+'20';ctx.lineWidth=1;
    rrect(ctx,cx,cy,cW,cH,rr);ctx.stroke();
  });
}});
