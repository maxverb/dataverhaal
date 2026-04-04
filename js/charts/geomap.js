// Geographic choropleth map — zoom-based smart labeling

function polyBBox(pts,px,py){
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  pts.forEach(([lon,lat])=>{
    const sx=px(lon),sy=py(lat);
    if(sx<x0)x0=sx;if(sx>x1)x1=sx;if(sy<y0)y0=sy;if(sy>y1)y1=sy;
  });
  return {x:x0,y:y0,w:x1-x0,h:y1-y0,cx:(x0+x1)/2,cy:(y0+y1)/2};
}

function normName(s){
  return s.trim().toLowerCase().replace(/[''`]/g,"'").replace(/\s+/g,' ')
    .replace(/\(zh\.\)/gi,'').replace(/^'s-/,"s-").trim();
}

function drawGeoMap(region,ctx,data,x,y,w,h,O){
  const {showVal,showXL,W,p,cols}=O;
  const ci=cols[0]||0;
  const reg=GEO_REGIONS[region];
  if(!reg)return;
  const [minLon,maxLon,minLat,maxLat]=reg.b;
  const gems=reg.g;
  const gemCount=gems.length;

  // Data lookup
  const lookup={};
  data.forEach(d=>{
    const key=normName(d.label);
    lookup[key]=d.values[ci]||0;
    if(GEO_ALIASES[d.label.trim().toLowerCase()])
      lookup[normName(GEO_ALIASES[d.label.trim().toLowerCase()])]=d.values[ci]||0;
  });

  function matchVal(name){
    const k=normName(name);
    if(lookup[k]!==undefined) return lookup[k];
    const k2=k.replace(/-/g,' ');
    if(lookup[k2]!==undefined) return lookup[k2];
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
  const mapH=h*0.95;
  const lonR=maxLon-minLon, latR=maxLat-minLat;
  const scale=Math.min(w/lonR,mapH/latR)*0.92;
  const offX=x+(w-lonR*scale)/2;
  const offY=y+(mapH-latR*scale)/2;
  const px2=lon=>offX+(lon-minLon)*scale;
  const py2=lat=>offY+(maxLat-lat)*scale;

  // Color
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
    const dark=hasData&&((val-minV)/range)>0.5;
    gemInfo.push({name:gem.n,bb,hasData,val,dark});
  });

  if(!showXL) return;

  // ── DECISION TREE per zoom level ──
  // Rijnmond (≤16): all labels inside, they fit
  // West (≤30): big inside, small get leader line
  // ZH (≤50): only data-gemeenten labeled, big inside, small leader
  // NL (>50): only data-gemeenten labeled, top values only

  const minSz=Math.max(W*0.01,8);
  const placed=[]; // track placed labels to avoid overlap

  function fitsInside(gi,lbl,sz){
    ctx.font=`600 ${sz}px Barlow`;
    return ctx.measureText(lbl).width<gi.bb.w*0.85 && sz<gi.bb.h*0.4;
  }

  function shortenName(name){
    let lbl=name;
    if(lbl.length>16) lbl=lbl.replace(/aan den |aan de |aan het /g,'a/d ');
    if(lbl.length>16) lbl=name.split(/[\s-]/)[0];
    return lbl;
  }

  function drawInlineLabel(gi,sz){
    ctx.font=`600 ${sz}px Barlow`;
    ctx.fillStyle=gi.dark?'#fff':p.text;
    ctx.textAlign='center';ctx.textBaseline='middle';
    let lbl=shortenName(gi.name);
    if(ctx.measureText(lbl).width>gi.bb.w*0.85) lbl=gi.name.split(/[\s-]/)[0];
    const ly=gi.hasData&&showVal?gi.bb.cy-sz*0.45:gi.bb.cy;
    ctx.fillText(lbl,gi.bb.cx,ly);
    if(gi.hasData&&showVal){
      ctx.font=`400 ${sz*0.8}px Barlow`;
      ctx.fillStyle=gi.dark?'rgba(255,255,255,0.85)':p.muted;
      ctx.fillText(fmtN(gi.val),gi.bb.cx,gi.bb.cy+sz*0.5);
    }
  }

  function drawLeaderLabel(gi,sz){
    let lbl=shortenName(gi.name);
    const valTxt=gi.hasData&&showVal?' '+fmtN(gi.val):'';
    ctx.font=`500 ${sz}px Barlow`;
    const tw=ctx.measureText(lbl+valTxt).width;
    const offset=W*0.025;

    // Try right, left, right-up, left-down
    const attempts=[
      {lx:gi.bb.x+gi.bb.w+offset,ly:gi.bb.cy,align:'left'},
      {lx:gi.bb.x-offset,ly:gi.bb.cy,align:'right'},
      {lx:gi.bb.x+gi.bb.w+offset,ly:gi.bb.cy-sz*1.2,align:'left'},
      {lx:gi.bb.x-offset,ly:gi.bb.cy+sz*1.2,align:'right'},
    ];

    let best=null;
    for(const att of attempts){
      const rx=att.align==='left'?att.lx:att.lx-tw;
      const ry=att.ly-sz/2;
      if(rx<x||rx+tw>x+w||ry<y||ry+sz>y+h) continue;
      const overlap=placed.some(r=>rx<r.x+r.w+2&&rx+tw+2>r.x&&ry<r.y+r.h+1&&ry+sz+1>r.y);
      if(!overlap){best=att;break;}
    }
    if(!best) return false;

    const {lx,ly,align}=best;
    placed.push({x:align==='left'?lx:lx-tw,y:ly-sz/2,w:tw,h:sz*1.3});

    // Leader line
    ctx.strokeStyle=p.muted+'40';ctx.lineWidth=Math.max(0.7,W*0.0005);
    ctx.beginPath();ctx.moveTo(gi.bb.cx,gi.bb.cy);
    ctx.lineTo(align==='left'?lx-W*0.004:lx+W*0.004,ly);ctx.stroke();
    ctx.beginPath();ctx.arc(gi.bb.cx,gi.bb.cy,W*0.0015,0,Math.PI*2);
    ctx.fillStyle=p.muted+'50';ctx.fill();

    // Text
    ctx.font=`500 ${sz}px Barlow`;ctx.fillStyle=p.text;
    ctx.textAlign=align;ctx.textBaseline='middle';
    ctx.fillText(lbl,lx,ly);
    if(valTxt){
      const nw=ctx.measureText(lbl).width;
      ctx.font=`600 ${sz*0.9}px Barlow`;ctx.fillStyle=p.acc;
      if(align==='left') ctx.fillText(valTxt,lx+nw,ly);
      else ctx.fillText(valTxt,lx-nw,ly);
    }
    return true;
  }

  // ── Apply decision tree ──

  if(gemCount<=16){
    // RIJNMOND level: everything labeled inside
    gemInfo.forEach(gi=>{
      const sz=Math.max(Math.min(Math.min(gi.bb.w,gi.bb.h)*0.25,W*0.016),minSz);
      if(fitsInside(gi,shortenName(gi.name),sz)) drawInlineLabel(gi,sz);
      else drawLeaderLabel(gi,minSz);
    });

  } else if(gemCount<=30){
    // WEST level: big inside, small get leader
    gemInfo.forEach(gi=>{
      const sz=Math.max(Math.min(Math.min(gi.bb.w,gi.bb.h)*0.22,W*0.014),minSz);
      if(fitsInside(gi,shortenName(gi.name),sz)) drawInlineLabel(gi,sz);
      else drawLeaderLabel(gi,minSz);
    });

  } else if(gemCount<=60){
    // ZH level: only data-gemeenten, big inside, small leader
    gemInfo.forEach(gi=>{
      if(!gi.hasData) return;
      const sz=Math.max(Math.min(Math.min(gi.bb.w,gi.bb.h)*0.22,W*0.013),minSz);
      if(fitsInside(gi,shortenName(gi.name),sz)) drawInlineLabel(gi,sz);
      else drawLeaderLabel(gi,minSz);
    });

  } else {
    // NL level: only data-gemeenten, only if big enough or top values
    const dataGems=gemInfo.filter(g=>g.hasData);
    const topVals=dataGems.sort((a,b)=>(b.val||0)-(a.val||0)).slice(0,20);
    const topSet=new Set(topVals.map(g=>g.name));
    gemInfo.forEach(gi=>{
      if(!gi.hasData) return;
      if(!topSet.has(gi.name)&&gi.bb.w*gi.bb.h<W*0.5) return;
      const sz=Math.max(Math.min(Math.min(gi.bb.w,gi.bb.h)*0.2,W*0.012),minSz);
      if(fitsInside(gi,shortenName(gi.name),sz)) drawInlineLabel(gi,sz);
      else drawLeaderLabel(gi,minSz);
    });
  }
}

registerChart('geo_rijnmond',{label:'Geo Rijnmond',draw:function(ctx,d,x,y,w,h,O){drawGeoMap('rijnmond',ctx,d,x,y,w,h,O);}});
registerChart('geo_west',{label:'Geo West',draw:function(ctx,d,x,y,w,h,O){drawGeoMap('west',ctx,d,x,y,w,h,O);}});
registerChart('geo_zh',{label:'Geo Z-H',draw:function(ctx,d,x,y,w,h,O){drawGeoMap('zuidholland',ctx,d,x,y,w,h,O);}});
