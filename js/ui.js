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
    dispmode:document.getElementById('dispmode').value,
    data:document.getElementById('di').value,
    bron:document.getElementById('bron').value,
    datum:document.getElementById('datum').value,
    fg:{grid:document.getElementById('fg-grid').checked,val:document.getElementById('fg-val').checked,
        xl:document.getElementById('fg-xl').checked,br:document.getElementById('fg-br').value},
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
  document.getElementById('dispmode').value=c.dispmode||'abs';
  document.getElementById('di').value=c.data||'';
  if(c.bron!==undefined)document.getElementById('bron').value=c.bron||'';
  if(c.datum!==undefined)document.getElementById('datum').value=c.datum||'';
  if(c.fg){
    ['grid','val','xl','ey','sub'].forEach(k=>{
      const el=document.getElementById('fg-'+k);
      if(el)el.checked=c.fg[k]!==false;
    });
    const brEl=document.getElementById('fg-br');
    if(brEl) brEl.value=typeof c.fg.br==='string'?c.fg.br:(c.fg.br!==false?'dataverhaal':'none');
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

// ── INIT ───────────────────────────────────────────────────────────────────

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

  // Chart type buttons — built from registry
  document.getElementById('ctg').innerHTML=Object.entries(CHARTS).map(([id,c])=>
    `<button class="tb${id===S.ct?' active':''}" data-ct="${id}" onclick="setCT('${id}',this)">${c.label}</button>`
  ).join('');

  // Formats
  document.getElementById('fg').innerHTML=Object.entries(FMT).map(([id,f])=>
    `<button class="tb fmtb${id===S.fmt?' active':''}" data-fmt="${id}" onclick="setFmt('${id}')">${f.label}</button>`
  ).join('');

  // Init format label
  const f=FMT[S.fmt];
  document.getElementById('pfl').textContent=f.label;
  document.getElementById('pdim').textContent=`${f.w} × ${f.h}`;

  // Auto-update timestamp
  const MND=['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
  const lm=new Date(document.lastModified);
  document.getElementById('tb-updated').textContent=
    `Bijgewerkt: ${lm.getDate()} ${MND[lm.getMonth()]} ${lm.getFullYear()}, ${String(lm.getHours()).padStart(2,'0')}:${String(lm.getMinutes()).padStart(2,'0')}`;

  renderCfgList();
  initClickHandler();
  loadFonts();
  sched();
}

init();
