// Geographic choropleth map — labels outside in two columns

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

  // Layout: labels left + right, map in center
  const labelColW=showXL?W*0.14:0;
  const mapX=x+labelColW;
  const mapW=w-labelColW*2;
  const mapH=h*0.95;
  const lonR=maxLon-minLon, latR=maxLat-minLat;
  const scale=Math.min(mapW/lonR,mapH/latR)*0.92;
  const offX=mapX+(mapW-lonR*scale)/2;
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
    const dark=hasData&&((val-minV)/range)>0.5;
    gemInfo.push({name:gem.n,bb,hasData,val,dark});
  });

  // Labels outside the map in two columns
  if(!showXL) return;

  const sz=Math.max(W*0.01,8);
  const mapCx=offX+lonR*scale/2;

  // Split into left and right based on position relative to map center
  const leftGems=gemInfo.filter(g=>g.bb.cx<mapCx).sort((a,b)=>a.bb.cy-b.bb.cy);
  const rightGems=gemInfo.filter(g=>g.bb.cx>=mapCx).sort((a,b)=>a.bb.cy-b.bb.cy);

  function drawLabelColumn(gems,colX,align){
    const lineH=sz*1.6;
    const maxLabels=Math.floor(mapH/lineH);
    const step=gems.length>maxLabels?gems.length/maxLabels:1;

    let slotY=y+sz;
    gems.forEach((gi,i)=>{
      if(step>1&&i%Math.ceil(step)!==0&&i!==gems.length-1) return;
      if(slotY+lineH>y+h) return;

      // Label text
      let lbl=gi.name;
      if(lbl.length>18) lbl=lbl.replace(/aan den |aan de |aan het /g,'a/d ');
      if(lbl.length>18) lbl=gi.name.split(/[\s-]/)[0];
      const valTxt=gi.hasData&&showVal?' '+fmtN(gi.val):'';

      ctx.font=`500 ${sz}px Barlow`;
      ctx.fillStyle=p.text;
      ctx.textAlign=align;
      ctx.textBaseline='middle';
      ctx.fillText(lbl,colX,slotY);

      if(valTxt){
        const nw=ctx.measureText(lbl).width;
        ctx.font=`600 ${sz*0.9}px Barlow`;
        ctx.fillStyle=gi.hasData?p.acc:p.muted;
        if(align==='right') ctx.fillText(valTxt,colX-nw,slotY);
        else ctx.fillText(valTxt,colX+nw,slotY);
      }

      // Leader line from label to gemeente bbox edge
      const lineStartX=align==='right'?colX+W*0.005:colX-W*0.005;
      const lineEndX=align==='right'?gi.bb.x:gi.bb.x+gi.bb.w;

      ctx.strokeStyle=p.muted+'35';
      ctx.lineWidth=Math.max(0.5,W*0.0004);
      ctx.beginPath();
      ctx.moveTo(lineStartX,slotY);
      ctx.lineTo(lineEndX,gi.bb.cy);
      ctx.stroke();

      // Tiny dot on gemeente
      ctx.beginPath();ctx.arc(gi.bb.cx,gi.bb.cy,W*0.0015,0,Math.PI*2);
      ctx.fillStyle=p.muted+'50';ctx.fill();

      slotY+=lineH;
    });
  }

  drawLabelColumn(leftGems, x+labelColW-W*0.008, 'right');
  drawLabelColumn(rightGems, x+w-labelColW+W*0.008, 'left');
}

registerChart('geo_rijnmond',{label:'Geo Rijnmond',draw:function(ctx,d,x,y,w,h,O){drawGeoMap('rijnmond',ctx,d,x,y,w,h,O);}});
registerChart('geo_west',{label:'Geo West',draw:function(ctx,d,x,y,w,h,O){drawGeoMap('west',ctx,d,x,y,w,h,O);}});
registerChart('geo_zh',{label:'Geo Z-H',draw:function(ctx,d,x,y,w,h,O){drawGeoMap('zuidholland',ctx,d,x,y,w,h,O);}});
registerChart('geo_nl',{label:'Geo NL',draw:function(ctx,d,x,y,w,h,O){drawGeoMap('nederland',ctx,d,x,y,w,h,O);}});
