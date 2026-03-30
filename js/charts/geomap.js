// Geographic choropleth map — renders real CBS gemeente boundaries

function polyArea(pts,px,py){
  let a=0;
  for(let i=0,n=pts.length;i<n;i++){
    const j=(i+1)%n;
    a+=px(pts[i][0])*py(pts[j][1])-px(pts[j][0])*py(pts[i][1]);
  }
  return Math.abs(a/2);
}

function polyBBox(pts,px,py){
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  pts.forEach(([lon,lat])=>{
    const sx=px(lon),sy=py(lat);
    if(sx<x0)x0=sx;if(sx>x1)x1=sx;if(sy<y0)y0=sy;if(sy>y1)y1=sy;
  });
  return {x:x0,y:y0,w:x1-x0,h:y1-y0,cx:(x0+x1)/2,cy:(y0+y1)/2};
}

function normName(s){
  return s.trim().toLowerCase()
    .replace(/[''`]/g,"'")
    .replace(/\s+/g,' ')
    .replace(/\(zh\.\)/gi,'')
    .replace(/^'s-/,"s-")
    .trim();
}

function drawGeoMap(region,ctx,data,x,y,w,h,O){
  const {showVal,showXL,W,p,cols}=O;
  const ci=cols[0]||0;
  const reg=GEO_REGIONS[region];
  if(!reg)return;
  const [minLon,maxLon,minLat,maxLat]=reg.b;
  const gems=reg.g;

  // Data lookup with normalized name matching
  const lookup={};
  data.forEach(d=>{
    const key=normName(d.label);
    lookup[key]=d.values[ci]||0;
    // Also store with common aliases
    if(GEO_ALIASES[d.label.trim().toLowerCase()])
      lookup[normName(GEO_ALIASES[d.label.trim().toLowerCase()])]=d.values[ci]||0;
  });

  // Match function
  function matchVal(name){
    const k=normName(name);
    if(lookup[k]!==undefined) return lookup[k];
    // Try without dashes/hyphens
    const k2=k.replace(/-/g,' ');
    if(lookup[k2]!==undefined) return lookup[k2];
    // Try first word
    const k3=k.split(/[\s-]/)[0];
    for(const [lk,lv] of Object.entries(lookup)){
      if(lk.startsWith(k3)) return lv;
    }
    return undefined;
  }

  const vals=Object.values(lookup);
  const minV=vals.length?Math.min(...vals):0;
  const maxV=vals.length?Math.max(...vals):1;
  const range=maxV-minV||1;

  // Projection
  const mapH=h*0.92;
  const lonR=maxLon-minLon, latR=maxLat-minLat;
  const scale=Math.min(w/lonR,mapH/latR)*0.92;
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
    const val=matchVal(gem.n);
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

    const bb=polyBBox(gem.p,px2,py2);
    const area=bb.w*bb.h;
    const dark=hasData&&((val-minV)/range)>0.5;
    gemInfo.push({name:gem.n,bb,area,hasData,val,dark});
  });

  // Labels
  if(showXL){
    const minSz=Math.max(W*0.011,9);
    const bigThreshold=W*W*0.00008;
    const inlineGems=[], leaderGems=[];
    gemInfo.forEach(gi=>{
      if(gi.area>=bigThreshold) inlineGems.push(gi);
      else leaderGems.push(gi);
    });

    // Inline labels — use bounding box center, constrained to bbox
    inlineGems.forEach(gi=>{
      const bb=gi.bb;
      const sz=Math.max(Math.min(Math.min(bb.w,bb.h)*0.22,W*0.016),minSz);
      ctx.font=`600 ${sz}px Barlow`;
      ctx.fillStyle=gi.dark?'#fff':p.text;
      ctx.textAlign='center';ctx.textBaseline='middle';

      let lbl=gi.name;
      const maxW=bb.w*0.85;
      if(ctx.measureText(lbl).width>maxW)
        lbl=lbl.replace(/aan den |aan de |aan het /g,'a/d ').replace(/-/g,'\u2011');
      if(ctx.measureText(lbl).width>maxW)
        lbl=gi.name.split(/[\s-]/)[0];

      const ly=gi.hasData&&showVal?bb.cy-sz*0.5:bb.cy;
      ctx.fillText(lbl,bb.cx,ly);

      if(gi.hasData&&showVal){
        ctx.font=`400 ${sz*0.8}px Barlow`;
        ctx.fillStyle=gi.dark?'rgba(255,255,255,0.85)':p.muted;
        ctx.fillText(fmtN(gi.val),bb.cx,bb.cy+sz*0.45);
      }
    });

    // Leader line labels
    const placed=[];
    leaderGems.forEach(gi=>{
      const bb=gi.bb;
      const sz=minSz;
      ctx.font=`500 ${sz}px Barlow`;
      let lbl=gi.name;
      if(lbl.length>18) lbl=lbl.replace(/aan den |aan de |aan het /g,'a/d ');
      if(lbl.length>18) lbl=gi.name.split(/[\s-]/)[0];

      const valTxt=gi.hasData&&showVal?' '+fmtN(gi.val):'';
      const fullTxt=lbl+valTxt;
      const tw=ctx.measureText(fullTxt).width;
      const offset=W*0.03;

      // Try 4 directions, pick first non-overlapping
      const attempts=[
        {lx:bb.cx+bb.w/2+offset,ly:bb.cy,align:'left'},
        {lx:bb.cx-bb.w/2-offset,ly:bb.cy,align:'right'},
        {lx:bb.cx+bb.w/2+offset,ly:bb.cy-sz*1.5,align:'left'},
        {lx:bb.cx-bb.w/2-offset,ly:bb.cy+sz*1.5,align:'right'},
      ];

      let best=null;
      for(const att of attempts){
        const rx=att.align==='left'?att.lx:att.lx-tw;
        const ry=att.ly-sz/2;
        if(rx<x||rx+tw>x+w||ry<y||ry+sz>y+h) continue;
        const overlap=placed.some(r=>
          rx<r.x+r.w+4&&rx+tw+4>r.x&&ry<r.y+r.h+2&&ry+sz+2>r.y
        );
        if(!overlap){best=att;break;}
      }
      if(!best) return; // no room, skip

      const {lx,ly,align}=best;
      const rx=align==='left'?lx:lx-tw;
      placed.push({x:rx,y:ly-sz/2,w:tw,h:sz*1.2});

      // Leader line from bbox edge to label
      ctx.strokeStyle=p.muted+'50';
      ctx.lineWidth=Math.max(1,W*0.0006);
      ctx.beginPath();
      ctx.moveTo(bb.cx,bb.cy);
      ctx.lineTo(align==='left'?lx-W*0.005:lx+W*0.005,ly);
      ctx.stroke();

      // Dot at centroid
      ctx.beginPath();ctx.arc(bb.cx,bb.cy,W*0.002,0,Math.PI*2);
      ctx.fillStyle=p.muted+'70';ctx.fill();

      // Label
      ctx.font=`500 ${sz}px Barlow`;
      ctx.fillStyle=p.text;
      ctx.textAlign=align;ctx.textBaseline='middle';
      ctx.fillText(lbl,lx,ly);

      if(valTxt){
        const nw=ctx.measureText(lbl).width;
        ctx.font=`400 ${sz*0.85}px Barlow`;
        ctx.fillStyle=p.muted;
        if(align==='left') ctx.fillText(valTxt,lx+nw,ly);
        else ctx.fillText(valTxt,lx-nw,ly);
      }
    });
  }
}

registerChart('geo_rijnmond',{label:'Geo Rijnmond',draw:function(ctx,d,x,y,w,h,O){drawGeoMap('rijnmond',ctx,d,x,y,w,h,O);}});
registerChart('geo_west',{label:'Geo West',draw:function(ctx,d,x,y,w,h,O){drawGeoMap('west',ctx,d,x,y,w,h,O);}});
registerChart('geo_zh',{label:'Geo Z-H',draw:function(ctx,d,x,y,w,h,O){drawGeoMap('zuidholland',ctx,d,x,y,w,h,O);}});
registerChart('geo_nl',{label:'Geo NL',draw:function(ctx,d,x,y,w,h,O){drawGeoMap('nederland',ctx,d,x,y,w,h,O);}});
