// Geographic map chart — renders actual gemeente shapes on canvas

function drawGeoMap(region,ctx,data,x,y,w,h,O){
  const {showVal,W,p,cols}=O;
  const ci=cols[0]||0;
  const gems=GEO_DATA[region];
  const bounds=GEO_BOUNDS[region];
  if(!gems||!bounds)return;

  // Data lookup
  const lookup={};
  data.forEach(d=>{
    let key=d.label.trim().toLowerCase();
    if(MAP_ALIASES[key]) key=MAP_ALIASES[key].toLowerCase();
    lookup[key]=d.values[ci]||0;
  });

  const vals=Object.values(lookup);
  const minV=vals.length?Math.min(...vals):0;
  const maxV=vals.length?Math.max(...vals):1;
  const range=maxV-minV||1;

  // Projection: lon/lat → canvas coords
  const mapH=h*0.85;
  const lonR=bounds.maxLon-bounds.minLon;
  const latR=bounds.maxLat-bounds.minLat;
  const scale=Math.min(w/lonR,mapH/latR)*0.92;
  const offX=x+(w-lonR*scale)/2;
  const offY=y+(mapH-latR*scale)/2;

  function projX(lon){return offX+(lon-bounds.minLon)*scale;}
  function projY(lat){return offY+(bounds.maxLat-lat)*scale;} // flip Y

  // Parse accent color
  const r1=parseInt(p.acc.slice(1,3),16);
  const g1=parseInt(p.acc.slice(3,5),16);
  const b1=parseInt(p.acc.slice(5,7),16);
  const bgR=parseInt(p.bg.length>=7?p.bg.slice(1,3):'f8',16);
  const bgG=parseInt(p.bg.length>=7?p.bg.slice(3,5):'f9',16);
  const bgB=parseInt(p.bg.length>=7?p.bg.slice(5,7):'fc',16);

  // Draw gemeente shapes
  gems.forEach(gem=>{
    const key=gem.name.toLowerCase();
    const val=lookup[key];
    const hasData=val!==undefined;

    ctx.beginPath();
    gem.path.forEach(([lon,lat],i)=>{
      const px=projX(lon),py=projY(lat);
      if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
    });
    ctx.closePath();

    // Fill
    if(hasData){
      const t=(val-minV)/range;
      const r=Math.round(bgR+(r1-bgR)*t);
      const g=Math.round(bgG+(g1-bgG)*t);
      const b=Math.round(bgB+(b1-bgB)*t);
      ctx.fillStyle=`rgb(${r},${g},${b})`;
    } else {
      ctx.fillStyle=p.muted+'20';
    }
    ctx.fill();

    // Border
    ctx.strokeStyle=p.muted+'50';
    ctx.lineWidth=Math.max(1,W*0.001);
    ctx.stroke();

    // Label
    const cx=gem.path.reduce((s,pt)=>s+pt[0],0)/gem.path.length;
    const cy2=gem.path.reduce((s,pt)=>s+pt[1],0)/gem.path.length;
    const sx=projX(cx),sy=projY(cy2);

    const sz=Math.min(W*0.013,scale*0.02);
    ctx.font=`600 ${sz}px Barlow`;
    const dark=hasData&&((val-minV)/range)>0.5;
    ctx.fillStyle=dark?'#fff':p.text;
    ctx.textAlign='center';ctx.textBaseline='middle';

    let lbl=gem.name;
    if(lbl.length>14) lbl=lbl.replace(/aan den |aan de /g,'a/d ');
    ctx.fillText(trunc(ctx,lbl,scale*0.06),sx,sy-(hasData&&showVal?sz*0.6:0));

    if(hasData&&showVal){
      const vsz=sz*0.8;
      ctx.font=`400 ${vsz}px Barlow`;
      ctx.fillStyle=dark?'rgba(255,255,255,0.8)':p.muted;
      ctx.fillText(fmtN(val),sx,sy+sz*0.6);
    }
  });

  // Legend
  const legY=y+h*0.88;
  const legW=w*0.5;
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
}

registerChart('geo_rijnmond',{label:'Geo Rijnmond',draw:function(ctx,data,x,y,w,h,O){drawGeoMap('rijnmond',ctx,data,x,y,w,h,O);}});
registerChart('geo_west',{label:'Geo West',draw:function(ctx,data,x,y,w,h,O){drawGeoMap('west',ctx,data,x,y,w,h,O);}});
registerChart('geo_zh',{label:'Geo Z-H',draw:function(ctx,data,x,y,w,h,O){drawGeoMap('zuidholland',ctx,data,x,y,w,h,O);}});
