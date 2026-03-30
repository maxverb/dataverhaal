// Geographic choropleth map — renders real CBS gemeente boundaries

function polyArea(pts,px,py){
  let a=0;
  for(let i=0,n=pts.length;i<n;i++){
    const j=(i+1)%n;
    a+=px(pts[i][0])*py(pts[j][1])-px(pts[j][0])*py(pts[i][1]);
  }
  return Math.abs(a/2);
}

function drawGeoMap(region,ctx,data,x,y,w,h,O){
  const {showVal,showXL,W,p,cols}=O;
  const ci=cols[0]||0;
  const reg=GEO_REGIONS[region];
  if(!reg)return;
  const [minLon,maxLon,minLat,maxLat]=reg.b;
  const gems=reg.g;

  // Data lookup
  const lookup={};
  data.forEach(d=>{
    let key=d.label.trim().toLowerCase();
    if(GEO_ALIASES[key]) key=GEO_ALIASES[key].toLowerCase();
    lookup[key]=d.values[ci]||0;
  });

  const vals=Object.values(lookup);
  const minV=vals.length?Math.min(...vals):0;
  const maxV=vals.length?Math.max(...vals):1;
  const range=maxV-minV||1;

  // Projection
  const mapH=h*0.82;
  const lonR=maxLon-minLon, latR=maxLat-minLat;
  const scale=Math.min(w/lonR,mapH/latR)*0.88;
  const offX=x+(w-lonR*scale)/2;
  const offY=y+(mapH-latR*scale)/2;
  const px2=lon=>offX+(lon-minLon)*scale;
  const py2=lat=>offY+(maxLat-lat)*scale;

  // Color helpers
  const r1=parseInt(p.acc.slice(1,3),16),g1=parseInt(p.acc.slice(3,5),16),b1=parseInt(p.acc.slice(5,7),16);
  const bgHex=p.bg.length>=7?p.bg:'#f8f9fc';
  const r0=parseInt(bgHex.slice(1,3),16),g0=parseInt(bgHex.slice(3,5),16),b0=parseInt(bgHex.slice(5,7),16);

  // Draw shapes + collect info
  const gemInfo=[];
  gems.forEach(gem=>{
    let key=gem.n.toLowerCase();
    if(GEO_ALIASES[key]) key=GEO_ALIASES[key].toLowerCase();
    const val=lookup[key];
    const hasData=val!==undefined;

    ctx.beginPath();
    gem.p.forEach(([lon,lat],i)=>{
      if(i===0) ctx.moveTo(px2(lon),py2(lat));
      else ctx.lineTo(px2(lon),py2(lat));
    });
    ctx.closePath();

    if(hasData){
      const t=Math.max(0.08,(val-minV)/range);
      const r=Math.round(r0+(r1-r0)*t);
      const g=Math.round(g0+(g1-g0)*t);
      const b=Math.round(b0+(b1-b0)*t);
      ctx.fillStyle=`rgb(${r},${g},${b})`;
    } else {
      ctx.fillStyle=p.muted+'15';
    }
    ctx.fill();
    ctx.strokeStyle=p.muted+'40';
    ctx.lineWidth=Math.max(1,W*0.0008);
    ctx.stroke();

    const cx=gem.p.reduce((s,pt)=>s+pt[0],0)/gem.p.length;
    const cy=gem.p.reduce((s,pt)=>s+pt[1],0)/gem.p.length;
    const area=polyArea(gem.p,px2,py2);
    const dark=hasData&&((val-minV)/range)>0.5;
    gemInfo.push({name:gem.n,sx:px2(cx),sy:py2(cy),area,hasData,val,dark});
  });

  // Labels with leader lines
  if(showXL){
    const minSz=Math.max(W*0.011,9); // minimum readable font size
    const bigThreshold=W*W*0.00012; // area threshold for inline labels

    // Separate big (inline) and small (leader line) gemeenten
    const inlineGems=[], leaderGems=[];
    gemInfo.forEach(gi=>{
      if(gi.area>=bigThreshold) inlineGems.push(gi);
      else leaderGems.push(gi);
    });

    // Draw inline labels (big gemeenten)
    inlineGems.forEach(gi=>{
      const sz=Math.max(Math.min(Math.sqrt(gi.area)*0.11,W*0.016),minSz);
      ctx.font=`600 ${sz}px Barlow`;
      ctx.fillStyle=gi.dark?'#fff':p.text;
      ctx.textAlign='center';ctx.textBaseline='middle';

      let lbl=gi.name;
      const maxW=Math.sqrt(gi.area)*0.65;
      if(ctx.measureText(lbl).width>maxW)
        lbl=lbl.replace(/aan den |aan de |aan het /g,'a/d ').replace(/-/g,'\u2011');
      if(ctx.measureText(lbl).width>maxW)
        lbl=gi.name.split(/[\s-]/)[0];

      const ly=gi.hasData&&showVal?gi.sy-sz*0.5:gi.sy;
      ctx.fillText(lbl,gi.sx,ly);

      if(gi.hasData&&showVal){
        ctx.font=`400 ${sz*0.8}px Barlow`;
        ctx.fillStyle=gi.dark?'rgba(255,255,255,0.85)':p.muted;
        ctx.fillText(fmtN(gi.val),gi.sx,gi.sy+sz*0.45);
      }
    });

    // Draw leader line labels (small gemeenten)
    // Place labels outside, with a thin line pointing to centroid
    const placed=[];// track placed label rects to avoid overlap

    leaderGems.forEach(gi=>{
      const sz=minSz;
      ctx.font=`500 ${sz}px Barlow`;
      let lbl=gi.name;
      // Shorten long names
      if(lbl.length>16) lbl=lbl.replace(/aan den |aan de |aan het /g,'a/d ');
      if(lbl.length>16) lbl=gi.name.split(/[\s-]/)[0];

      const valTxt=gi.hasData&&showVal?' '+fmtN(gi.val):'';
      const fullTxt=lbl+valTxt;
      const tw=ctx.measureText(fullTxt).width;

      // Try placing label to the right, then left
      let lx,ly,align;
      const offset=W*0.025;
      const attempts=[
        {lx:gi.sx+offset,ly:gi.sy,align:'left'},
        {lx:gi.sx-offset,ly:gi.sy,align:'right'},
        {lx:gi.sx+offset,ly:gi.sy-sz*1.2,align:'left'},
        {lx:gi.sx-offset,ly:gi.sy+sz*1.2,align:'right'},
      ];

      let best=attempts[0];
      for(const att of attempts){
        const rx=att.align==='left'?att.lx:att.lx-tw;
        const ry=att.ly-sz/2;
        const overlap=placed.some(r=>
          rx<r.x+r.w&&rx+tw>r.x&&ry<r.y+r.h&&ry+sz>r.y
        );
        if(!overlap){best=att;break;}
      }

      lx=best.lx; ly=best.ly; align=best.align;
      const rx=align==='left'?lx:lx-tw;
      placed.push({x:rx,y:ly-sz/2,w:tw,h:sz*1.2});

      // Leader line
      ctx.strokeStyle=p.muted+'60';
      ctx.lineWidth=Math.max(1,W*0.0006);
      ctx.beginPath();
      ctx.moveTo(gi.sx,gi.sy);
      ctx.lineTo(lx-(align==='left'?W*0.005:-W*0.005),ly);
      ctx.stroke();

      // Small dot at centroid
      ctx.beginPath();ctx.arc(gi.sx,gi.sy,W*0.002,0,Math.PI*2);
      ctx.fillStyle=p.muted+'80';ctx.fill();

      // Label text
      ctx.font=`500 ${sz}px Barlow`;
      ctx.fillStyle=p.text;
      ctx.textAlign=align;ctx.textBaseline='middle';
      ctx.fillText(lbl,lx,ly);

      // Value after name
      if(valTxt){
        ctx.font=`400 ${sz*0.85}px Barlow`;
        ctx.fillStyle=p.muted;
        const nameW=ctx.measureText(lbl).width;
        ctx.textAlign=align;
        if(align==='left') ctx.fillText(valTxt,lx+nameW,ly);
        else ctx.fillText(valTxt,lx-nameW,ly);
      }
    });
  }

  // Legend bar
  const legY=y+h*0.9, legW=w*0.5, legH=W*0.012;
  const legX=x+(w-legW)/2;
  const gr=ctx.createLinearGradient(legX,0,legX+legW,0);
  gr.addColorStop(0,p.bg);gr.addColorStop(1,p.acc);
  ctx.fillStyle=gr;
  rrect(ctx,legX,legY,legW,legH,legH/2);ctx.fill();
  const lsz=W*0.012;
  ctx.font=`500 ${lsz}px Barlow`;ctx.fillStyle=p.muted;
  ctx.textAlign='left';ctx.textBaseline='top';
  ctx.fillText(fmtN(minV),legX,legY+legH+3);
  ctx.textAlign='right';
  ctx.fillText(fmtN(maxV),legX+legW,legY+legH+3);
}

registerChart('geo_rijnmond',{label:'Geo Rijnmond',draw:function(ctx,d,x,y,w,h,O){drawGeoMap('rijnmond',ctx,d,x,y,w,h,O);}});
registerChart('geo_west',{label:'Geo West',draw:function(ctx,d,x,y,w,h,O){drawGeoMap('west',ctx,d,x,y,w,h,O);}});
registerChart('geo_zh',{label:'Geo Z-H',draw:function(ctx,d,x,y,w,h,O){drawGeoMap('zuidholland',ctx,d,x,y,w,h,O);}});
registerChart('geo_nl',{label:'Geo NL',draw:function(ctx,d,x,y,w,h,O){drawGeoMap('nederland',ctx,d,x,y,w,h,O);}});
