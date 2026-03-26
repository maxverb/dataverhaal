// ── CONSTANTS ──────────────────────────────────────────────────────────────

const PAL = {
  blauw:   {name:'Blauw',   sw:'linear-gradient(135deg,#1B4F8A 0%,#60A5FA 100%)', bg:'#F8F9FC',text:'#0D1117',muted:'#6B7280',bars:['#1B4F8A','#2563EB','#3B82F6','#60A5FA','#93C5FD','#BFDBFE'],acc:'#1B4F8A'},
  rood:    {name:'Rood',    sw:'linear-gradient(135deg,#B91C1C 0%,#F87171 100%)', bg:'#FAFAFA', text:'#0D1117',muted:'#6B7280',bars:['#B91C1C','#DC2626','#EF4444','#F87171','#FCA5A5','#FEE2E2'],acc:'#B91C1C'},
  groen:   {name:'Groen',   sw:'linear-gradient(135deg,#065F46 0%,#34D399 100%)', bg:'#F0FDF9', text:'#0D1117',muted:'#6B7280',bars:['#065F46','#047857','#059669','#10B981','#34D399','#6EE7B7'],acc:'#065F46'},
  oranje:  {name:'Oranje',  sw:'linear-gradient(135deg,#92400E 0%,#FCD34D 100%)', bg:'#FFFBF0', text:'#0D1117',muted:'#6B7280',bars:['#92400E','#B45309','#D97706','#F59E0B','#FCD34D','#FDE68A'],acc:'#B45309'},
  paars:   {name:'Paars',   sw:'linear-gradient(135deg,#4C1D95 0%,#A78BFA 100%)', bg:'#FAF5FF', text:'#0D1117',muted:'#6B7280',bars:['#4C1D95','#5B21B6','#7C3AED','#8B5CF6','#A78BFA','#C4B5FD'],acc:'#5B21B6'},
  donker:  {name:'Donker',  sw:'linear-gradient(135deg,#0F172A 0%,#334155 100%)', bg:'#0F172A', text:'#F1F5F9',muted:'#94A3B8',bars:['#38BDF8','#34D399','#FBBF24','#F472B6','#A78BFA','#6EE7B7'],acc:'#38BDF8'},
};

const FMT = {
  twitter:  {w:1600,h:900, label:'Twitter/X',   ratio:'16:9'},
  ig_post:  {w:1080,h:1350,label:'IG Post 4:5',  ratio:'4:5'},
  ig_sq:    {w:1080,h:1080,label:'IG Vierkant',  ratio:'1:1'},
  story:    {w:1080,h:1920,label:'Story',         ratio:'9:16'},
  tiktok:   {w:1080,h:1920,label:'TikTok',        ratio:'9:16'},
  slide:    {w:1920,h:1080,label:'Slide 16:9',    ratio:'16:9'},
};

const LAY = {
  klassiek: {name:'Klassiek'},
  kader:    {name:'Kader'},
  lijn:     {name:'Lijn'},
  omgekeerd:{name:'Omgek.'},
  strak:    {name:'Strak'},
};

const LICONS = {
  klassiek:`<svg viewBox="0 0 34 26" fill="none"><rect width="34" height="26" rx="2" fill="#1c1c1c"/><rect x="4" y="4" width="14" height="2.5" rx="1" fill="#444"/><rect x="5" y="14" width="5" height="8" fill="#3B82F6"/><rect x="12" y="11" width="5" height="11" fill="#3B82F6" opacity=".7"/><rect x="19" y="16" width="5" height="6" fill="#3B82F6" opacity=".5"/><rect x="26" y="12" width="5" height="10" fill="#3B82F6" opacity=".6"/><line x1="4" y1="22.5" x2="32" y2="22.5" stroke="#444" stroke-width="1"/></svg>`,
  kader:`<svg viewBox="0 0 34 26" fill="none"><rect width="34" height="26" rx="2" fill="#1c1c1c"/><rect x="3" y="3" width="28" height="20" rx="2" stroke="#3B82F6" stroke-width="1.5" fill="none"/><rect x="7" y="6" width="10" height="2" rx="1" fill="#444"/><rect x="7" y="12" width="5" height="8" fill="#3B82F6"/><rect x="14" y="10" width="5" height="10" fill="#3B82F6" opacity=".7"/><rect x="21" y="14" width="5" height="6" fill="#3B82F6" opacity=".5"/></svg>`,
  lijn:`<svg viewBox="0 0 34 26" fill="none"><rect width="34" height="26" rx="2" fill="#1c1c1c"/><rect x="4" y="4" width="12" height="2.5" rx="1" fill="#444"/><rect x="4" y="8.5" width="26" height="2" rx="1" fill="#3B82F6"/><rect x="5" y="13" width="5" height="9" fill="#3B82F6"/><rect x="12" y="11" width="5" height="11" fill="#3B82F6" opacity=".7"/><rect x="19" y="15" width="5" height="7" fill="#3B82F6" opacity=".5"/><rect x="26" y="12" width="5" height="10" fill="#3B82F6" opacity=".6"/></svg>`,
  omgekeerd:`<svg viewBox="0 0 34 26" fill="none"><rect width="34" height="26" rx="2" fill="#0F172A"/><rect x="4" y="4" width="14" height="2.5" rx="1" fill="#94A3B8"/><rect x="5" y="14" width="5" height="8" fill="#38BDF8"/><rect x="12" y="11" width="5" height="11" fill="#38BDF8" opacity=".7"/><rect x="19" y="16" width="5" height="6" fill="#38BDF8" opacity=".5"/><rect x="26" y="12" width="5" height="10" fill="#38BDF8" opacity=".6"/></svg>`,
  strak:`<svg viewBox="0 0 34 26" fill="none"><rect width="34" height="26" rx="2" fill="#f8f9fc"/><rect x="5" y="4" width="12" height="2.5" rx="1" fill="#d1d5db"/><rect x="6" y="12" width="5" height="10" fill="#1B4F8A"/><rect x="13" y="10" width="5" height="12" fill="#1B4F8A" opacity=".65"/><rect x="20" y="14" width="5" height="8" fill="#1B4F8A" opacity=".45"/><rect x="27" y="11" width="5" height="11" fill="#1B4F8A" opacity=".55"/></svg>`,
};

// ── STATE ──────────────────────────────────────────────────────────────────

const S = {
  data:[],
  ct:'bar',
  pal:'blauw',
  lay:'lijn',
  fmt:'ig_post',
};

let rt=null, fontsOK=false;

// ── FONTS ──────────────────────────────────────────────────────────────────

async function loadFonts(){
  try{
    await Promise.all([
      document.fonts.load('800 72px Sora'),
      document.fonts.load('700 48px Sora'),
      document.fonts.load('600 36px Sora'),
      document.fonts.load('400 28px Sora'),
      document.fonts.load('700 28px Barlow'),
      document.fonts.load('600 22px Barlow'),
      document.fonts.load('500 18px Barlow'),
      document.fonts.load('400 16px Barlow'),
      document.fonts.load('700 18px Barlow Condensed'),
    ]);
  }catch(e){}
  fontsOK=true;
  sched();
}

// ── DATA ───────────────────────────────────────────────────────────────────

function parseHTML(raw){
  // Wrap in <table> if not present so DOMParser keeps tr/td intact
  let html=raw;
  if(!/<\s*table[\s>]/i.test(html)) html='<table>'+html+'</table>';
  const doc=new DOMParser().parseFromString(html,'text/html');
  const trs=doc.querySelectorAll('tr');
  if(!trs.length)return null;
  const out=[];
  trs.forEach((tr,i)=>{
    const cells=[...tr.querySelectorAll('th,td')].map(c=>c.textContent.trim());
    if(cells.length<2)return;
    // Skip header row
    if(i===0&&isNaN(parseFloat(cells[1].replace(/[^\d.-]/g,''))))return;
    const lbl=cells[0];
    const vals=cells.slice(1).map(v=>{ const n=parseFloat(v.replace(/[^\d.-]/g,'')); return isNaN(n)?0:n; });
    out.push({label:lbl,values:vals});
  });
  return out;
}

function parseData(){
  const raw=document.getElementById('di').value.trim();
  const ds=document.getElementById('ds');
  if(!raw){S.data=[];sched();ds.textContent='';return;}
  // Detect HTML table input
  if(/<\s*t(able|r|d|h)[\s>]/i.test(raw)){
    const html=parseHTML(raw);
    if(html&&html.length){
      S.data=html;
      ds.textContent=`✓ ${html.length} rijen (tabel)`;ds.style.color='#4ade80';
      sched();return;
    }
  }
  const rows=raw.split('\n').map(r=>r.trim()).filter(r=>r);
  const out=[];
  rows.forEach((row,i)=>{
    const parts=row.includes('\t')?row.split('\t'):row.split(',');
    if(parts.length<2)return;
    const lbl=parts[0].trim();
    // Skip header row
    if(i===0&&isNaN(parseFloat(parts[1].replace(',','.'))))return;
    const vals=parts.slice(1).map(v=>{ const n=parseFloat(v.replace(/[^\d.-]/g,'')); return isNaN(n)?0:n; });
    out.push({label:lbl,values:vals});
  });
  S.data=out;
  if(out.length){ds.textContent=`✓ ${out.length} rijen`;ds.style.color='#4ade80';}
  else{ds.textContent='Geen data gevonden';ds.style.color='#f87171';}
  sched();
}

function handleFile(e){
  const f=e.target.files[0]; if(!f)return;
  if(f.name.endsWith('.csv')){
    const r=new FileReader();
    r.onload=ev=>{document.getElementById('di').value=ev.target.result;parseData();};
    r.readAsText(f);
  } else {
    const sc=document.createElement('script');
    sc.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    sc.onload=()=>{
      const r=new FileReader();
      r.onload=ev=>{
        const wb=XLSX.read(ev.target.result,{type:'binary'});
        const ws=wb.Sheets[wb.SheetNames[0]];
        const csv=XLSX.utils.sheet_to_csv(ws);
        document.getElementById('di').value=csv;
        parseData();
      };
      r.readAsBinaryString(f);
    };
    document.head.appendChild(sc);
  }
}

// ── RENDER ─────────────────────────────────────────────────────────────────

function sched(){clearTimeout(rt);rt=setTimeout(draw,25);}

function draw(){
  const cv=document.getElementById('cv');
  const f=FMT[S.fmt];
  cv.width=f.w; cv.height=f.h;
  const ctx=cv.getContext('2d');
  const W=f.w, H=f.h;
  // Scale factor: wide formats (16:9) get smaller text
  const ar=W/H;
  const sf=ar>1.5?0.64:ar>1.2?0.85:1;

  // Palette — Omgekeerd forces dark bg/text
  let p={...PAL[S.pal]};
  if(S.lay==='omgekeerd'&&S.pal!=='donker'){
    p={...p, bg:'#0F172A', text:'#F1F5F9', muted:'#94A3B8'};
  }

  // Padding (30% less on sides)
  const padPct = S.lay==='strak' ? 0.063 : 0.07;
  const px=W*padPct;

  // BG
  ctx.fillStyle=p.bg;
  ctx.fillRect(0,0,W,H);

  // Kader border
  if(S.lay==='kader'){
    const m=W*0.035, rr=W*0.018;
    ctx.strokeStyle=p.acc;
    ctx.lineWidth=Math.max(3,W*0.005);
    rrect(ctx,m,m,W-2*m,H-2*m,rr);
    ctx.stroke();
  }

  // Read UI values
  const eyebrow=document.getElementById('eyebrow').value;
  const title=document.getElementById('ttl').value;
  const subtitle=document.getElementById('sub').value;
  const showGrid=document.getElementById('fg-grid').checked;
  const showVal=document.getElementById('fg-val').checked;
  const showXL=document.getElementById('fg-xl').checked;
  const showEy=!!eyebrow;
  const showSub=!!subtitle;
  const showBr=document.getElementById('fg-br').checked;
  const bron=document.getElementById('bron').value;
  const datum=document.getElementById('datum').value;
  const oneClr=true;

  let cy=H*0.064;

  // Eyebrow
  if(showEy){
    const sz=W*0.024*sf;
    ctx.font=`600 ${sz}px Barlow`;
    ctx.fillStyle=p.acc;
    ctx.textAlign='left';
    ctx.textBaseline='top';
    ctx.fillText(eyebrow.toUpperCase(),px,cy);
    cy+=sz*1.35;
    // Lijn layout: accent bar after eyebrow
    if(S.lay==='lijn'){
      ctx.fillStyle=p.acc;
      ctx.fillRect(px,cy,W-2*px,Math.max(4,W*0.006));
      cy+=W*0.014;
    }
  }

  // Title
  if(title){
    const sz=(S.lay==='strak'?W*0.055:W*0.052)*sf;
    ctx.font=`700 ${sz}px Sora`;
    ctx.fillStyle=p.text;
    ctx.textAlign='left';
    ctx.textBaseline='top';
    const lines=wrap(ctx,title,W-2*px);
    lines.forEach(l=>{ctx.fillText(l,px,cy);cy+=sz*1.2;});
  }

  // Subtitle
  if(showSub){
    const sz=W*0.026*sf;
    cy+=sz*0.3;
    ctx.font=`400 ${sz}px Barlow`;
    ctx.fillStyle=p.muted;
    ctx.textAlign='left';
    ctx.textBaseline='top';
    const subLines=wrap(ctx,subtitle,W-2*px);
    subLines.forEach(l=>{ctx.fillText(l,px,cy);cy+=sz*1.4;});
    cy+=sz*0.3;
  }

  // Chart area
  const chartTop=cy+(title?W*0.025:0);
  const botMargin=showBr?0.09:0.05;
  const chartBot=H-H*botMargin;
  const cH=chartBot-chartTop;
  const cW=W-2*px;

  if(!S.data.length){
    // Placeholder
    ctx.strokeStyle=p.muted+'40';
    ctx.setLineDash([W*0.012,W*0.012]);
    ctx.lineWidth=1;
    ctx.strokeRect(px,chartTop,cW,cH);
    ctx.setLineDash([]);
    ctx.font=`400 ${W*0.027}px Barlow`;
    ctx.fillStyle=p.muted;
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText('Plak data in het linkerpaneel',W/2,chartTop+cH/2);
  } else {
    let data=[...S.data];
    const srt=document.getElementById('srt').value;
    const mr=document.getElementById('mr').value;
    if(srt==='desc')data.sort((a,b)=>b.values[0]-a.values[0]);
    if(srt==='asc') data.sort((a,b)=>a.values[0]-b.values[0]);
    if(mr!=='all')data=data.slice(0,parseInt(mr));
    const O={showGrid,showVal,showXL,lay:S.lay,W,p,oneClr};
    if(S.ct==='bar')    drawBar(ctx,data,px,chartTop,cW,cH,O);
    else if(S.ct==='barh') drawBarH(ctx,data,px,chartTop,cW,cH,O);
    else if(S.ct==='line') drawLine(ctx,data,px,chartTop,cW,cH,O);
    else if(S.ct==='donut')drawDonut(ctx,data,px,chartTop,cW,cH,O);
  }

  // Bron + Datum onderaan links
  const bronDatum=[bron,datum].filter(Boolean).join(' · ');
  if(bronDatum){
    const sz=W*0.021*sf;
    ctx.font=`400 ${sz}px Barlow`;
    ctx.fillStyle=p.muted;
    ctx.textAlign='left';
    ctx.textBaseline='bottom';
    ctx.fillText(bronDatum,px*0.5,H-H*0.025);
  }

  // Branding
  if(showBr){
    const sz=W*0.022*sf;
    ctx.font=`500 ${sz}px Barlow`;
    ctx.fillStyle=p.muted;
    ctx.textAlign='right';
    ctx.textBaseline='bottom';
    ctx.fillText('dataverhaal.nl',W-px*0.5,H-H*0.025);
  }
}

// ── CHART FUNCTIONS ────────────────────────────────────────────────────────

function drawBar(ctx,data,x,y,w,h,O){
  const {showGrid,showVal,showXL,lay,W,p,oneClr}=O;
  const n=data.length;
  const maxV=Math.max(...data.map(d=>Math.max(...d.values)));
  const minV=Math.min(0,...data.map(d=>Math.min(...d.values)));
  const range=maxV-minV||1;
  const lblH=showXL?h*0.13:0;
  const cH=h-lblH;
  const z0=y+cH-((-minV)/range)*cH;

  // Grid label width
  const glW=showGrid&&lay!=='strak'?W*0.05:0;

  // Grid
  if(showGrid&&lay!=='strak'){
    const ticks=niceTicks(minV,maxV,8);
    const sz=W*0.016;
    ctx.font=`400 ${sz}px Barlow`;
    ctx.strokeStyle=p.muted+'70';
    ctx.lineWidth=Math.max(1.5,W*0.0014);
    ctx.setLineDash([]);
    ticks.forEach(t=>{
      const ty=y+cH-((t-minV)/range)*cH;
      ctx.beginPath();ctx.moveTo(x+glW,ty);ctx.lineTo(x+w,ty);ctx.stroke();
      ctx.fillStyle=p.muted;
      ctx.textAlign='right';
      ctx.textBaseline='middle';
      ctx.fillText(fmtN(t),x+glW-W*0.006,ty);
    });
    ctx.setLineDash([]);
  }

  const gap=n>10?0.10:n>6?0.14:0.18;
  const gW=(w-glW)/n;
  const bW=gW*(1-gap);

  data.forEach((d,i)=>{
    const v=d.values[0];
    const bx=x+glW+gW*i+gW*gap/2;
    const bH=Math.abs((v/range)*cH);
    const by=v>=0?z0-bH:z0;
    const col=oneClr?p.bars[0]:p.bars[i%p.bars.length];
    ctx.fillStyle=col;
    if(lay==='strak'){
      ctx.fillRect(bx,by,bW,bH);
    } else {
      const rr=Math.min(bW*0.14,bH*0.15,W*0.006);
      rbar(ctx,bx,by,bW,bH,v>=0?rr:0,v>=0?0:rr);
    }
    if(showVal&&bH>0){
      const sz=Math.max(W*0.019,12);
      ctx.font=`600 ${sz}px Barlow`;
      ctx.fillStyle=p.text;
      ctx.textAlign='center';
      ctx.textBaseline='bottom';
      const vy=v>=0?by-W*0.007:by+bH+sz+W*0.005;
      ctx.fillText(fmtN(v),bx+bW/2,vy);
    }
    if(showXL){
      const sz=Math.max(W*0.018,11);
      ctx.font=`500 ${sz}px Barlow`;
      ctx.fillStyle=p.muted;
      ctx.textAlign='center';
      ctx.textBaseline='top';
      ctx.fillText(trunc(ctx,d.label,gW*0.9),bx+bW/2,y+cH+W*0.01);
    }
  });
  if(minV<0){
    ctx.strokeStyle=p.muted;
    ctx.lineWidth=Math.max(1.5,W*0.002);
    ctx.beginPath();ctx.moveTo(x+glW,z0);ctx.lineTo(x+w,z0);ctx.stroke();
  }
}

function drawBarH(ctx,data,x,y,w,h,O){
  const {showGrid,showVal,lay,W,p,oneClr}=O;
  const n=data.length;
  const maxV=Math.max(...data.map(d=>d.values[0]))||1;
  const lblW=w*0.3;
  const cX=x+lblW+W*0.012;
  const cW=w-lblW-W*0.012;
  const gap=n>8?0.10:0.18;
  const gH=h/n;
  const bH=gH*(1-gap);

  if(showGrid&&lay!=='strak'){
    const ticks=niceTicks(0,maxV,8);
    ctx.strokeStyle=p.muted+'70';
    ctx.lineWidth=Math.max(1.5,W*0.0014);
    ctx.setLineDash([]);
    ticks.forEach(t=>{
      const tx=cX+(t/maxV)*cW;
      ctx.beginPath();ctx.moveTo(tx,y);ctx.lineTo(tx,y+h);ctx.stroke();
    });
    ctx.setLineDash([]);
  }

  data.forEach((d,i)=>{
    const v=d.values[0];
    const by=y+gH*i+gH*gap/2;
    const bW=(v/maxV)*cW;
    ctx.fillStyle=oneClr?p.bars[0]:p.bars[i%p.bars.length];
    if(lay==='strak'){ctx.fillRect(cX,by,bW,bH);}
    else{const rr=Math.min(bH*0.3,W*0.005);rbar(ctx,cX,by,bW,bH,0,rr);}
    const sz=Math.max(W*0.018,11);
    ctx.font=`500 ${sz}px Barlow`;
    ctx.fillStyle=p.muted;
    ctx.textAlign='right';
    ctx.textBaseline='middle';
    ctx.fillText(trunc(ctx,d.label,lblW-W*0.02),cX-W*0.015,by+bH/2);
    if(showVal){
      ctx.font=`600 ${sz}px Barlow`;
      ctx.fillStyle=p.text;
      ctx.textAlign='left';
      ctx.fillText(fmtN(v),cX+bW+W*0.012,by+bH/2);
    }
  });
}

function drawLine(ctx,data,x,y,w,h,O){
  const {showGrid,showVal,showXL,lay,W,p}=O;
  const n=data.length;
  if(n<2){drawBar(ctx,data,x,y,w,h,O);return;}
  const vals=data.map(d=>d.values[0]);
  const maxV=Math.max(...vals), minV=Math.min(...vals);
  const pad=(maxV-minV)*0.15||maxV*0.1||1;
  const vMax=maxV+pad, vMin=minV-pad;
  const vR=vMax-vMin;
  const lblH=showXL?h*0.11:0;
  const cH=h-lblH;

  const glW=showGrid&&lay!=='strak'?W*0.05:0;

  if(showGrid&&lay!=='strak'){
    const ticks=niceTicks(vMin,vMax,5);
    const sz=W*0.016;
    ctx.font=`400 ${sz}px Barlow`;
    ctx.strokeStyle=p.muted+'70';
    ctx.lineWidth=Math.max(1.5,W*0.0014);
    ctx.setLineDash([]);
    ticks.forEach(t=>{
      const ty=y+cH-((t-vMin)/vR)*cH;
      ctx.beginPath();ctx.moveTo(x+glW,ty);ctx.lineTo(x+w,ty);ctx.stroke();
      ctx.fillStyle=p.muted;
      ctx.textAlign='right';
      ctx.textBaseline='middle';
      ctx.fillText(fmtN(t),x+glW-W*0.006,ty);
    });
    ctx.setLineDash([]);
  }

  const pts=data.map((d,i)=>({
    px:x+glW+(i/(n-1))*(w-glW),
    py:y+cH-((d.values[0]-vMin)/vR)*cH,
  }));

  // Fill
  ctx.beginPath();
  ctx.moveTo(pts[0].px,y+cH);
  pts.forEach(pt=>ctx.lineTo(pt.px,pt.py));
  ctx.lineTo(pts[n-1].px,y+cH);
  ctx.closePath();
  const gr=ctx.createLinearGradient(0,y,0,y+cH);
  gr.addColorStop(0,p.acc+'50');
  gr.addColorStop(1,p.acc+'06');
  ctx.fillStyle=gr;ctx.fill();

  // Line (catmull-rom smooth)
  ctx.beginPath();ctx.moveTo(pts[0].px,pts[0].py);
  for(let i=0;i<n-1;i++){
    const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(n-1,i+2)];
    ctx.bezierCurveTo(
      p1.px+(p2.px-p0.px)/6,p1.py+(p2.py-p0.py)/6,
      p2.px-(p3.px-p1.px)/6,p2.py-(p3.py-p1.py)/6,
      p2.px,p2.py
    );
  }
  ctx.strokeStyle=p.acc;ctx.lineWidth=Math.max(3,W*0.005);ctx.lineJoin='round';ctx.stroke();

  // Dots
  pts.forEach(pt=>{
    ctx.beginPath();ctx.arc(pt.px,pt.py,W*0.009,0,Math.PI*2);
    ctx.fillStyle=p.acc;ctx.fill();
    ctx.strokeStyle=p.bg;ctx.lineWidth=W*0.003;ctx.stroke();
  });

  if(showXL){
    const sz=Math.max(W*0.018,11);
    ctx.font=`500 ${sz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='center';ctx.textBaseline='top';
    data.forEach((d,i)=>ctx.fillText(trunc(ctx,d.label,w/(n-1)*0.9),pts[i].px,y+cH+W*0.009));
  }
  if(showVal){
    const sz=Math.max(W*0.018,11);
    ctx.font=`600 ${sz}px Barlow`;ctx.fillStyle=p.text;ctx.textAlign='center';ctx.textBaseline='bottom';
    pts.forEach((pt,i)=>ctx.fillText(fmtN(data[i].values[0]),pt.px,pt.py-W*0.028));
  }
}

function drawDonut(ctx,data,x,y,w,h,O){
  const {showVal,W,p}=O;
  const total=data.reduce((s,d)=>s+d.values[0],0)||1;
  const cx=x+w/2, cy=y+h*0.42;
  const R=Math.min(w,h*0.72)*0.4, iR=R*0.55;
  let angle=-Math.PI/2;
  data.forEach((d,i)=>{
    const sl=(d.values[0]/total)*Math.PI*2;
    ctx.beginPath();
    ctx.moveTo(cx+Math.cos(angle)*iR,cy+Math.sin(angle)*iR);
    ctx.arc(cx,cy,R,angle,angle+sl);
    ctx.arc(cx,cy,iR,angle+sl,angle,true);
    ctx.closePath();
    ctx.fillStyle=p.bars[i%p.bars.length];ctx.fill();
    angle+=sl;
  });
  // Center label
  if(showVal&&data.length>0){
    const pct=Math.round(data[0].values[0]/total*100)+'%';
    ctx.font=`700 ${R*0.38}px Sora`;
    ctx.fillStyle=p.text;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(pct,cx,cy);
  }
  // Legend
  const legY=y+h*0.82, iW=w/Math.min(data.length,4);
  const sz=Math.max(W*0.018,11);
  data.slice(0,8).forEach((d,i)=>{
    const lx=x+iW*(i%4)+iW*0.08;
    const ly=legY+Math.floor(i/4)*W*0.038;
    ctx.fillStyle=p.bars[i%p.bars.length];
    ctx.fillRect(lx,ly-sz*0.45,sz*0.8,sz*0.8);
    ctx.font=`500 ${sz}px Barlow`;ctx.fillStyle=p.muted;ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillText(trunc(ctx,d.label,iW*0.8),lx+sz*1.1,ly);
  });
}

// ── CANVAS HELPERS ─────────────────────────────────────────────────────────

function rrect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

function rbar(ctx,x,y,w,h,tR,bR){
  if(h<=0||w<=0)return;
  ctx.beginPath();
  ctx.moveTo(x+tR,y);ctx.lineTo(x+w-tR,y);ctx.quadraticCurveTo(x+w,y,x+w,y+tR);
  ctx.lineTo(x+w,y+h-bR);ctx.quadraticCurveTo(x+w,y+h,x+w-bR,y+h);
  ctx.lineTo(x+bR,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-bR);
  ctx.lineTo(x,y+tR);ctx.quadraticCurveTo(x,y,x+tR,y);
  ctx.closePath();ctx.fill();
}

function wrap(ctx,text,maxW){
  const words=text.split(' '),lines=[];let ln='';
  words.forEach(w=>{
    const t=ln?ln+' '+w:w;
    if(ctx.measureText(t).width>maxW&&ln){lines.push(ln);ln=w;}
    else ln=t;
  });
  if(ln)lines.push(ln);
  // Safety: if a single line still exceeds maxW, force-break it
  const out=[];
  lines.forEach(l=>{
    while(ctx.measureText(l).width>maxW&&l.length>1){
      let i=l.length;
      while(i>1&&ctx.measureText(l.slice(0,i)).width>maxW)i--;
      out.push(l.slice(0,i));l=l.slice(i);
    }
    if(l)out.push(l);
  });
  return out;
}

function trunc(ctx,text,maxW){
  if(ctx.measureText(text).width<=maxW)return text;
  let t=text;while(t.length>1&&ctx.measureText(t+'…').width>maxW)t=t.slice(0,-1);return t+'…';
}

function niceTicks(min,max,count){
  const range=max-min||1;
  const step=niceN(range/count);
  const start=Math.ceil(min/step)*step;
  const out=[];
  for(let v=start;v<=max+step*0.001;v+=step)out.push(parseFloat(v.toFixed(10)));
  return out;
}

function niceN(n){
  const e=Math.floor(Math.log10(Math.abs(n)||1));
  const f=n/Math.pow(10,e);
  if(f<=1)return Math.pow(10,e);
  if(f<=2)return 2*Math.pow(10,e);
  if(f<=5)return 5*Math.pow(10,e);
  return 10*Math.pow(10,e);
}

function fmtN(n){
  const u=document.getElementById('unit').value;
  if(u==='auto'){
    if(Math.abs(n)>=1e6)return(n/1e6).toFixed(1).replace('.0','')+'M';
    if(Math.abs(n)>=1e3)return(n/1e3).toFixed(1).replace('.0','')+'k';
    if(Number.isInteger(n))return n.toString();
    return n.toFixed(1);
  }
  let v;
  if(u==='k') v=(n/1e3).toFixed(1).replace('.0','')+'k';
  else if(u==='M') v=(n/1e6).toFixed(1).replace('.0','')+'M';
  else{v=Number.isInteger(n)?n.toString():n.toFixed(1);}
  if(u==='pct') return v+'%';
  if(u==='eur') return '€'+v;
  if(u==='usd') return '$'+v;
  return v;
}

// ── EXPORT ─────────────────────────────────────────────────────────────────

function exportPNG(){
  draw();
  const cv=document.getElementById('cv');
  const ttl=(document.getElementById('ttl').value||'grafiek').replace(/[^a-zA-Z0-9\s\-_]/g,'').replace(/\s+/g,'-').toLowerCase();
  const fmtL=FMT[S.fmt].label.replace(/[\s/]/g,'-');
  const a=document.createElement('a');
  a.href=cv.toDataURL('image/png');
  a.download=`${ttl}-${fmtL}-dataverhaal.png`;
  a.click();
}

// ── CONFIG SAVE/LOAD ───────────────────────────────────────────────────────

function getCfgs(){return JSON.parse(localStorage.getItem('dv_cfgs')||'{}');}

function saveCfg(){
  const name=document.getElementById('cn').value.trim();if(!name)return;
  const cfg={
    ct:S.ct,pal:S.pal,lay:S.lay,fmt:S.fmt,
    title:document.getElementById('ttl').value,
    eyebrow:document.getElementById('eyebrow').value,
    subtitle:document.getElementById('sub').value,
    srt:document.getElementById('srt').value,
    mr:document.getElementById('mr').value,
    unit:document.getElementById('unit').value,
    data:document.getElementById('di').value,
    bron:document.getElementById('bron').value,
    datum:document.getElementById('datum').value,
    fg:{grid:document.getElementById('fg-grid').checked,val:document.getElementById('fg-val').checked,
        xl:document.getElementById('fg-xl').checked,br:document.getElementById('fg-br').checked},
  };
  const cfgs=getCfgs();cfgs[name]=cfg;
  localStorage.setItem('dv_cfgs',JSON.stringify(cfgs));
  document.getElementById('cn').value='';
  renderCfgList();
}

function loadCfg(name){
  const c=getCfgs()[name];if(!c)return;
  document.getElementById('ttl').value=c.title||'';
  document.getElementById('eyebrow').value=c.eyebrow||'';
  document.getElementById('sub').value=c.subtitle||'';
  document.getElementById('srt').value=c.srt||'none';
  document.getElementById('mr').value=c.mr||'all';
  document.getElementById('unit').value=c.unit||'auto';
  document.getElementById('di').value=c.data||'';
  if(c.bron!==undefined)document.getElementById('bron').value=c.bron||'';
  if(c.datum!==undefined)document.getElementById('datum').value=c.datum||'';
  if(c.fg){
    ['grid','val','xl','ey','sub','br'].forEach(k=>{
      const el=document.getElementById('fg-'+k);
      if(el)el.checked=c.fg[k]!==false;
    });
  }
  setCT(c.ct||'bar');setPal(c.pal||'blauw');setLay(c.lay||'strak');setFmt(c.fmt||'ig_post');
  parseData();
}

function delCfg(name){
  const c=getCfgs();delete c[name];
  localStorage.setItem('dv_cfgs',JSON.stringify(c));renderCfgList();
}

function renderCfgList(){
  const el=document.getElementById('cl');
  const cfgs=getCfgs();
  const keys=Object.keys(cfgs);
  if(!keys.length){el.innerHTML='<div style="font-size:11px;color:#666;padding:3px 0">Geen configuraties opgeslagen</div>';return;}
  el.innerHTML=keys.map(k=>`<div class="cfi">
    <span class="cfn" title="${k}">${k}</span>
    <button class="btn btn-sm" onclick="loadCfg('${k.replace(/'/g,"\\'")}')">Laden</button>
    <button class="btn btn-sm" style="color:#f87171" onclick="delCfg('${k.replace(/'/g,"\\'")}')">✕</button>
  </div>`).join('');
}

// ── UI SETTERS ─────────────────────────────────────────────────────────────

function setCT(id,btn){
  S.ct=id;
  document.querySelectorAll('[data-ct]').forEach(b=>b.classList.remove('active'));
  (btn||document.querySelector(`[data-ct="${id}"]`))?.classList.add('active');
  sched();
}

function setPal(id){
  S.pal=id;
  document.querySelectorAll('.psw').forEach(s=>s.classList.remove('active'));
  document.querySelector(`[data-pal="${id}"]`)?.classList.add('active');
  sched();
}

function setLay(id){
  S.lay=id;
  document.querySelectorAll('.lbtn').forEach(b=>b.classList.remove('active'));
  document.querySelector(`[data-lay="${id}"]`)?.classList.add('active');
  sched();
}

function setFmt(id){
  S.fmt=id;
  document.querySelectorAll('.fmtb').forEach(b=>b.classList.remove('active'));
  document.querySelector(`[data-fmt="${id}"]`)?.classList.add('active');
  const f=FMT[id];
  document.getElementById('pfl').textContent=f.label;
  document.getElementById('pdim').textContent=`${f.w} × ${f.h}`;
  sched();
}

function tog(hdr){
  const sc=hdr.nextElementSibling;
  const st=hdr.querySelector('.st');
  const isOpen=!sc.classList.contains('hidden');
  sc.classList.toggle('hidden',isOpen);
  st.classList.toggle('open',!isOpen);
}

// ── INIT ───────────────────────────────────────────────────────────────────

function init(){
  // Palettes
  document.getElementById('pg').innerHTML=Object.entries(PAL).map(([id,p])=>
    `<div class="psw${id===S.pal?' active':''}" data-pal="${id}" style="background:${p.sw}" title="${p.name}" onclick="setPal('${id}')"></div>`
  ).join('');

  // Layouts
  document.getElementById('lg').innerHTML=Object.entries(LAY).map(([id,l])=>
    `<div class="lbtn${id===S.lay?' active':''}" data-lay="${id}" onclick="setLay('${id}')" title="${l.name}">
      <div class="lic">${LICONS[id]}</div>
      <span class="ln">${l.name}</span>
    </div>`
  ).join('');

  // Formats
  document.getElementById('fg').innerHTML=Object.entries(FMT).map(([id,f])=>
    `<button class="tb fmtb${id===S.fmt?' active':''}" data-fmt="${id}" onclick="setFmt('${id}')">${f.label}</button>`
  ).join('');

  // Init format label
  const f=FMT[S.fmt];
  document.getElementById('pfl').textContent=f.label;
  document.getElementById('pdim').textContent=`${f.w} × ${f.h}`;

  renderCfgList();
  loadFonts();
  sched();
}

init();
