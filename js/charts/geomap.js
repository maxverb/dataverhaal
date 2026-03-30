// Geographic choropleth map — renders real CBS gemeente boundaries

function polyArea(pts,px,py){
  // Approximate pixel area of polygon for label sizing
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

  // Data lookup (fuzzy)
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
  const mapH=h*0.84;
  const lonR=maxLon-minLon, latR=maxLat-minLat;
  const scale=Math.min(w/lonR,mapH/latR)*0.94;
  const offX=x+(w-lonR*scale)/2;
  const offY=y+(mapH-latR*scale)/2;
  const px2=lon=>offX+(lon-minLon)*scale;
  const py2=lat=>offY+(maxLat-lat)*scale;

  // Color helpers
  const r1=parseInt(p.acc.slice(1,3),16),g1=parseInt(p.acc.slice(3,5),16),b1=parseInt(p.acc.slice(5,7),16);
  const bgHex=p.bg.length>=7?p.bg:'#f8f9fc';
  const r0=parseInt(bgHex.slice(1,3),16),g0=parseInt(bgHex.slice(3,5),16),b0=parseInt(bgHex.slice(5,7),16);

  // Draw all gemeente shapes first
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

    // Compute centroid and area for label sizing
    const cx=gem.p.reduce((s,pt)=>s+pt[0],0)/gem.p.length;
    const cy=gem.p.reduce((s,pt)=>s+pt[1],0)/gem.p.length;
    const area=polyArea(gem.p,px2,py2);
    const dark=hasData&&((val-minV)/range)>0.5;

    gemInfo.push({name:gem.n,sx:px2(cx),sy:py2(cy),area,hasData,val,dark});
  });

  // Smart auto-fit labels
  if(showXL){
    const minArea=W*0.8; // minimum area to show any label

    gemInfo.forEach(gi=>{
      if(gi.area<minArea)return; // too small, skip

      // Scale font size to polygon area
      const sz=Math.max(Math.min(Math.sqrt(gi.area)*0.12, W*0.014),7);
      ctx.font=`600 ${sz}px Barlow`;
      ctx.fillStyle=gi.dark?'#fff':p.text;
      ctx.textAlign='center';ctx.textBaseline='middle';

      // Abbreviate names to fit
      let lbl=gi.name;
      const maxW=Math.sqrt(gi.area)*0.7;
      if(ctx.measureText(lbl).width>maxW){
        lbl=lbl.replace(/aan den |aan de |aan het /g,'a/d ').replace(/-/g,'\u2011');
      }
      if(ctx.measureText(lbl).width>maxW){
        // First word only
        lbl=gi.name.split(/[\s-]/)[0];
      }
      if(ctx.measureText(lbl).width>maxW){
        // 3 letter abbreviation
        lbl=gi.name.slice(0,3);
      }

      const labelY=gi.hasData&&showVal?gi.sy-sz*0.55:gi.sy;
      ctx.fillText(lbl,gi.sx,labelY);

      // Value below label
      if(gi.hasData&&showVal){
        ctx.font=`400 ${sz*0.85}px Barlow`;
        ctx.fillStyle=gi.dark?'rgba(255,255,255,0.85)':p.muted;
        ctx.fillText(fmtN(gi.val),gi.sx,gi.sy+sz*0.45);
      }
    });
  }

  // Legend bar
  const legY=y+h*0.88, legW=w*0.5, legH=W*0.012;
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
