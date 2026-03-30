// Map chart — cartogram choropleth
// Registers one chart per region

function drawMap(region,ctx,data,x,y,w,h,O){
  const {showVal,W,p,cols}=O;
  const ci=cols[0]||0;
  const map=MAP_DATA[region];
  if(!map)return;

  // Build lookup: normalized name → value
  const lookup={};
  data.forEach(d=>{
    let key=d.label.trim().toLowerCase();
    if(MAP_ALIASES[key]) key=MAP_ALIASES[key].toLowerCase();
    lookup[key]=d.values[ci]||0;
  });

  // Find min/max for color scale
  const vals=Object.values(lookup);
  const minV=vals.length?Math.min(...vals):0;
  const maxV=vals.length?Math.max(...vals):1;
  const range=maxV-minV||1;

  // Cell sizing
  const pad=W*0.008;
  const cellW=(w-pad*(map.cols-1))/map.cols;
  const cellH=(h*0.85-pad*(map.rows-1))/map.rows;
  const rr=Math.min(cellW,cellH)*0.15;

  // Legend bar
  const legY=y+h*0.88;
  const legW=w*0.6;
  const legH=W*0.012;
  const legX=x+(w-legW)/2;
  const gr=ctx.createLinearGradient(legX,0,legX+legW,0);
  gr.addColorStop(0,p.bg);gr.addColorStop(1,p.acc);
  ctx.fillStyle=gr;
  rrect(ctx,legX,legY,legW,legH,legH/2);ctx.fill();
  const lsz=W*0.012;
  ctx.font=`500 ${lsz}px Barlow`;ctx.fillStyle=p.muted;
  ctx.textAlign='left';ctx.textBaseline='top';
  ctx.fillText(fmtN(minV),legX,legY+legH+2);
  ctx.textAlign='right';
  ctx.fillText(fmtN(maxV),legX+legW,legY+legH+2);
  ctx.textAlign='center';
  ctx.fillText(map.name,x+w/2,legY+legH+lsz+4);

  // Draw cells
  map.gems.forEach(([name,col,row])=>{
    const cx=x+col*(cellW+pad);
    const cy=y+row*(cellH+pad);
    const key=name.toLowerCase();
    const aliasKey=Object.entries(MAP_ALIASES).find(([a,v])=>v.toLowerCase()===key);
    const hasData=lookup[key]!==undefined||(aliasKey&&lookup[aliasKey[0]]!==undefined);
    const val=lookup[key]!==undefined?lookup[key]:(aliasKey?lookup[aliasKey[0]]:undefined);

    if(hasData){
      const t=(val-minV)/range;
      // Interpolate from bg to accent
      const r0=parseInt(p.bg.length>=7?p.bg.slice(1,3):'f8',16);
      const g0=parseInt(p.bg.length>=7?p.bg.slice(3,5):'f9',16);
      const b0=parseInt(p.bg.length>=7?p.bg.slice(5,7):'fc',16);
      const r1=parseInt(p.acc.slice(1,3),16);
      const g1=parseInt(p.acc.slice(3,5),16);
      const b1=parseInt(p.acc.slice(5,7),16);
      const r=Math.round(r0+(r1-r0)*t);
      const g=Math.round(g0+(g1-g0)*t);
      const b=Math.round(b0+(b1-b0)*t);
      ctx.fillStyle=`rgb(${r},${g},${b})`;
    } else {
      ctx.fillStyle=p.muted+'20';
    }

    rrect(ctx,cx,cy,cellW,cellH,rr);ctx.fill();

    // Label
    const sz=Math.min(cellW*0.22,cellH*0.28,W*0.013);
    ctx.font=`600 ${sz}px Barlow`;
    const dark=hasData&&((val-minV)/range)>0.5;
    ctx.fillStyle=dark?'#fff':(hasData?p.text:p.muted+'60');
    ctx.textAlign='center';ctx.textBaseline='middle';

    // Abbreviate long names
    let lbl=name;
    if(lbl.length>12) lbl=lbl.replace(/aan den |aan de |aan het /g,'a/d ').replace(/-/g,'\u2011');
    const lines=lbl.length>10?[lbl.slice(0,Math.ceil(lbl.length/2)),lbl.slice(Math.ceil(lbl.length/2))]:[lbl];
    const lh=sz*1.2;
    const ly=cy+cellH/2-(lines.length-1)*lh/2;
    lines.forEach((l,li)=>{
      ctx.fillText(trunc(ctx,l,cellW-4),cx+cellW/2,ly+li*lh-(hasData&&showVal?sz*0.4:0));
    });

    // Value
    if(hasData&&showVal){
      const vsz=sz*0.85;
      ctx.font=`400 ${vsz}px Barlow`;
      ctx.fillStyle=dark?'rgba(255,255,255,0.8)':p.muted;
      ctx.fillText(fmtN(val),cx+cellW/2,cy+cellH/2+lh*0.5+(lines.length>1?sz*0.2:0));
    }
  });
}

// Register one chart type per region
registerChart('map_rijnmond',{label:'Kaart Rijnmond',draw:function(ctx,data,x,y,w,h,O){drawMap('rijnmond',ctx,data,x,y,w,h,O);}});
registerChart('map_west',{label:'Kaart West',draw:function(ctx,data,x,y,w,h,O){drawMap('west',ctx,data,x,y,w,h,O);}});
registerChart('map_zh',{label:'Kaart Z-H',draw:function(ctx,data,x,y,w,h,O){drawMap('zuidholland',ctx,data,x,y,w,h,O);}});
registerChart('map_nl',{label:'Kaart NL',draw:function(ctx,data,x,y,w,h,O){drawMap('nederland',ctx,data,x,y,w,h,O);}});
