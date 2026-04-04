// ── DATA VERKENNER ──

let dvData=null; // {headers:[], rows:[][]}
let dvColTypes=null; // [{type:'number'|'date'|'category'|'text'|'url', ...}]
let dvRawText='';

function dvParseFile(e){
  const file=e.target.files[0];if(!file)return;
  const st=document.getElementById('dv-status');
  st.textContent='Laden...';st.style.color='var(--ac)';
  const ext=file.name.split('.').pop().toLowerCase();
  if(ext==='xlsx'||ext==='xls'){
    if(typeof XLSX==='undefined'){
      const sc=document.createElement('script');
      sc.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      sc.onload=()=>dvReadXLSX(file);
      document.head.appendChild(sc);
    } else dvReadXLSX(file);
  } else {
    const reader=new FileReader();
    reader.onload=function(ev){
      document.getElementById('dv-paste').value=ev.target.result;
      st.textContent='Bestand geladen, klik Preview';st.style.color='var(--ac)';
    };
    reader.readAsText(file);
  }
}

function dvReadXLSX(file){
  const reader=new FileReader();
  reader.onload=function(ev){
    const wb=XLSX.read(ev.target.result,{type:'array'});
    const ws=wb.Sheets[wb.SheetNames[0]];
    document.getElementById('dv-paste').value=XLSX.utils.sheet_to_csv(ws);
    document.getElementById('dv-status').textContent='XLSX geladen, klik Preview';
    document.getElementById('dv-status').style.color='var(--ac)';
  };
  reader.readAsArrayBuffer(file);
}

function dvPreview(){
  const raw=document.getElementById('dv-paste').value.trim();
  const st=document.getElementById('dv-status');
  const out=document.getElementById('dv-results');
  if(!raw){st.textContent='Geen data';st.style.color='var(--err)';return;}

  dvRawText=raw;
  const delimSel=document.getElementById('dv-delim').value;
  const quoteSel=document.getElementById('dv-quote').value;
  const startRow=parseInt(document.getElementById('dv-startrow').value)||1;
  const opts={
    delim:delimSel==='auto'?null:delimSel==='tab'?'\t':delimSel,
    quote:quoteSel,
    startRow:startRow
  };

  // Quick preview: first ~100 rows
  const previewRaw=dtTruncateRaw(raw,120,opts.quote||'"');
  // Reuse dtParseCSV from datatable.js
  const parsed=dtParseCSV(previewRaw,opts);

  if(!parsed||!parsed.rows.length){
    st.textContent='Geen data gevonden';st.style.color='var(--err)';
    out.innerHTML='<div class="tab-empty"><p>Parsing mislukt</p><p style="color:var(--pm);font-size:13px">Probeer een ander scheidingsteken</p></div>';
    return;
  }

  const isPartial=previewRaw.length<raw.length;
  const delimName=parsed._delim==='\t'?'tab':parsed._delim===','?'komma':parsed._delim===';'?'puntkomma':parsed._delim==='|'?'pipe':'?';
  st.textContent=`${isPartial?'~':''}${parsed.rows.length}r × ${parsed.headers.length}k (${delimName})${isPartial?' — preview':''}`;
  st.style.color='var(--ok)';

  // Show preview table
  out.innerHTML=dtBuildPreviewTable(parsed,'Data',isPartial?raw.length:0);

  // Store preview data, do full parse for analysis
  dvData=parsed;
  dvData._needsFullParse=isPartial;
  dvColTypes=dvDetectTypes(parsed.headers,parsed.rows);
  document.getElementById('dv-actions').style.display='';
  dvPopulateGroupBy();
}

function dvFullParse(){
  if(!dvData||!dvData._needsFullParse) return;
  if(!dvRawText) return;
  const delimSel=document.getElementById('dv-delim').value;
  const quoteSel=document.getElementById('dv-quote').value;
  const startRow=parseInt(document.getElementById('dv-startrow').value)||1;
  const opts={
    delim:delimSel==='auto'?null:delimSel==='tab'?'\t':delimSel,
    quote:quoteSel,
    startRow:startRow
  };
  const full=dtParseCSV(dvRawText,opts);
  if(full){
    dvData=full;
    dvColTypes=dvDetectTypes(full.headers,full.rows);
    dvPopulateGroupBy();
    document.getElementById('dv-status').textContent=`✓ ${full.rows.length}r × ${full.headers.length}k`;
    document.getElementById('dv-status').style.color='var(--ok)';
  }
}

function dvDetectTypes(headers,rows){
  const types=[];
  const sample=rows.slice(0,Math.min(rows.length,100));
  for(let c=0;c<headers.length;c++){
    const vals=sample.map(r=>(r[c]||'').replace(/^["']|["']$/g,'').trim()).filter(v=>v);
    if(!vals.length){types.push({type:'text',name:headers[c],idx:c});continue;}
    // URL?
    const urlCount=vals.filter(v=>/^https?:\/\//i.test(v)).length;
    if(urlCount/vals.length>0.5){types.push({type:'url',name:headers[c],idx:c});continue;}
    // Number?
    const numCount=vals.filter(v=>/^-?[\d.,]+%?$/.test(v.replace(/\s/g,''))).length;
    if(numCount/vals.length>0.7){types.push({type:'number',name:headers[c],idx:c});continue;}
    // Date?
    const dateCount=vals.filter(v=>{
      if(/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(v)) return true;
      if(/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(v)) return true;
      if(!isNaN(Date.parse(v))&&v.length>6) return true;
      return false;
    }).length;
    if(dateCount/vals.length>0.5){types.push({type:'date',name:headers[c],idx:c});continue;}
    // Category vs text: unique ratio
    const uniq=new Set(vals.map(v=>v.toLowerCase()));
    if(uniq.size<=30||uniq.size/vals.length<0.3){
      types.push({type:'category',name:headers[c],idx:c});continue;
    }
    types.push({type:'text',name:headers[c],idx:c});
  }
  return types;
}

function dvPopulateGroupBy(){
  const sel=document.getElementById('dv-groupby');
  sel.innerHTML='<option value="">Geen groepering</option>';
  if(!dvColTypes) return;
  dvColTypes.filter(c=>c.type==='category').forEach(c=>{
    sel.innerHTML+=`<option value="${c.idx}">${esc(c.name)}</option>`;
  });
}

function dvAnalyze(){
  dvFullParse();
  if(!dvData||!dvData.rows.length) return;
  const groupIdx=document.getElementById('dv-groupby').value;
  if(groupIdx===''){
    dvRenderReport(dvData.headers,dvData.rows,dvColTypes,'Alle data');
  } else {
    dvRenderGroupedReport(parseInt(groupIdx));
  }
}

function dvRenderEmpty(){
  document.getElementById('dv-results').innerHTML='<div class="tab-empty"><span class="tab-empty-icon">&#x1f50d;</span><p>Laad een dataset om te verkennen</p><p style="color:var(--pm);font-size:13px">Plak CSV/TSV of upload een bestand</p></div>';
  document.getElementById('dv-status').textContent='';
  document.getElementById('dv-actions').style.display='none';
}

function dvRenderGroupedReport(groupIdx){
  const col=dvColTypes[groupIdx];
  const groups={};
  dvData.rows.forEach(r=>{
    const key=(r[groupIdx]||'').trim()||'(leeg)';
    if(!groups[key]) groups[key]=[];
    groups[key].push(r);
  });
  const sorted=Object.entries(groups).sort((a,b)=>b[1].length-a[1].length);

  let html=`<div class="sd-section"><div class="sd-section-title">Gegroepeerd op: ${esc(col.name)} (${sorted.length} groepen)</div></div>`;
  html+=`<div class="sd-grid">`;
  // Overview card per group
  sorted.forEach(([key,rows])=>{
    html+=`<div class="sd-card dv-group-card" onclick="dvShowGroup('${esc(key.replace(/'/g,"\\'"))}',${groupIdx})"><div class="sd-card-title">${esc(key)}</div><div class="sd-big">${rows.length}</div><div class="sd-sub">artikelen</div></div>`;
  });
  html+=`</div>`;

  // Full report below
  html+=dvBuildReport(dvData.headers,dvData.rows,dvColTypes,'Totaal overzicht');

  document.getElementById('dv-results').innerHTML=html;
}

function dvShowGroup(key,groupIdx){
  const rows=dvData.rows.filter(r=>((r[groupIdx]||'').trim()||'(leeg)')===key);
  let html=`<button class="btn btn-sm" onclick="dvAnalyze()" style="margin:12px">&larr; Terug naar overzicht</button>`;
  html+=dvBuildReport(dvData.headers,rows,dvColTypes,key+' ('+rows.length+')');
  document.getElementById('dv-results').innerHTML=html;
}

function dvRenderReport(headers,rows,colTypes,title){
  document.getElementById('dv-results').innerHTML=dvBuildReport(headers,rows,colTypes,title);
}

function dvBuildReport(headers,rows,colTypes,title){
  const n=rows.length;
  function avg(arr){return arr.length?Math.round(arr.reduce((s,v)=>s+v,0)/arr.length*10)/10:0;}
  function med(arr){if(!arr.length)return 0;const s=[...arr].sort((a,b)=>a-b);const m=Math.floor(s.length/2);return s.length%2?s[m]:Math.round((s[m-1]+s[m])/2*10)/10;}
  function pct(count){return n?Math.round(count/n*1000)/10:0;}

  let html='';

  // ── OVERZICHT ──
  html+=`<div class="sd-section"><div class="sd-section-title">${esc(title)}</div></div>`;
  html+=`<div class="sd-grid">`;
  html+=`<div class="sd-card"><div class="sd-card-title">Rijen</div><div class="sd-big">${n}</div><div class="sd-sub">in dataset</div></div>`;
  html+=`<div class="sd-card"><div class="sd-card-title">Kolommen</div><div class="sd-big">${headers.length}</div><div class="sd-sub">${colTypes.filter(c=>c.type==='number').length} getal, ${colTypes.filter(c=>c.type==='category').length} categorie, ${colTypes.filter(c=>c.type==='text').length} tekst, ${colTypes.filter(c=>c.type==='date').length} datum, ${colTypes.filter(c=>c.type==='url').length} url</div></div>`;
  // Completeness
  let totalFilled=0,totalCells=n*headers.length;
  for(let c=0;c<headers.length;c++){
    totalFilled+=rows.filter(r=>(r[c]||'').trim()).length;
  }
  const comp=totalCells?Math.round(totalFilled/totalCells*1000)/10:0;
  html+=`<div class="sd-card"><div class="sd-card-title">Compleetheid</div><div class="sd-big">${comp}%</div><div class="sd-bar-wrap"><div class="sd-bar" style="width:${comp}%"></div></div><div class="sd-sub">${totalFilled} van ${totalCells} cellen gevuld</div></div>`;
  html+=`</div>`;

  // ── PER KOLOM ──
  // Numbers
  const numCols=colTypes.filter(c=>c.type==='number');
  if(numCols.length){
    html+=`<div class="sd-section"><div class="sd-section-title">Getallen</div></div>`;
    html+=`<div class="sd-grid">`;
    numCols.forEach(col=>{
      const vals=rows.map(r=>dvParseNum(r[col.idx])).filter(v=>v!==null);
      const empty=n-vals.length;
      const mn=vals.length?Math.min(...vals):0;
      const mx=vals.length?Math.max(...vals):0;
      const sm=vals.reduce((s,v)=>s+v,0);
      html+=`<div class="sd-card">`;
      html+=`<div class="sd-card-title">${esc(col.name)}</div>`;
      html+=`<div class="sd-big">${dvFmt(avg(vals))}</div>`;
      html+=`<div class="sd-sub">gemiddeld</div>`;
      html+=`<div class="dv-stats-row"><span>Mediaan</span><span>${dvFmt(med(vals))}</span></div>`;
      html+=`<div class="dv-stats-row"><span>Min</span><span>${dvFmt(mn)}</span></div>`;
      html+=`<div class="dv-stats-row"><span>Max</span><span>${dvFmt(mx)}</span></div>`;
      html+=`<div class="dv-stats-row"><span>Som</span><span>${dvFmt(sm)}</span></div>`;
      if(empty) html+=`<div class="dv-stats-row"><span>Leeg</span><span>${empty}</span></div>`;
      // Mini histogram
      html+=dvMiniHist(vals,col.name);
      html+=`</div>`;
    });
    html+=`</div>`;
  }

  // Categories
  const catCols=colTypes.filter(c=>c.type==='category');
  if(catCols.length){
    html+=`<div class="sd-section"><div class="sd-section-title">Categorie&euml;n</div></div>`;
    html+=`<div class="sd-grid">`;
    catCols.forEach(col=>{
      const freq={};let empty=0;
      rows.forEach(r=>{const v=(r[col.idx]||'').trim();if(!v){empty++;return;}freq[v]=(freq[v]||0)+1;});
      const sorted=Object.entries(freq).sort((a,b)=>b[1]-a[1]);
      const uniq=sorted.length;
      const maxV=sorted.length?sorted[0][1]:1;
      html+=`<div class="sd-card">`;
      html+=`<div class="sd-card-title">${esc(col.name)}</div>`;
      html+=`<div class="sd-big">${uniq}</div>`;
      html+=`<div class="sd-sub">unieke waarden</div>`;
      if(empty) html+=`<div class="dv-stats-row"><span>Leeg</span><span>${empty}</span></div>`;
      // Top items with bars
      html+=`<div style="margin-top:6px">`;
      sorted.slice(0,10).forEach(([k,v])=>{
        const w=Math.round(v/maxV*100);
        html+=`<div class="dv-freq-row"><div class="dv-freq-label">${esc(k.length>25?k.slice(0,25)+'...':k)}</div><div class="dv-freq-bar-wrap"><div class="dv-freq-bar" style="width:${w}%"></div></div><div class="dv-freq-val">${v}</div></div>`;
      });
      if(sorted.length>10) html+=`<div class="sd-sub" style="margin-top:4px">+${sorted.length-10} meer</div>`;
      html+=`</div></div>`;
    });
    html+=`</div>`;
  }

  // Text columns
  const textCols=colTypes.filter(c=>c.type==='text');
  if(textCols.length){
    html+=`<div class="sd-section"><div class="sd-section-title">Tekstvelden</div></div>`;
    html+=`<div class="sd-grid">`;
    textCols.forEach(col=>{
      const vals=rows.map(r=>(r[col.idx]||'').trim()).filter(v=>v);
      const empty=n-vals.length;
      const lengths=vals.map(v=>v.split(/\s+/).filter(w=>w).length);
      const charLens=vals.map(v=>v.length);
      const uniq=new Set(vals.map(v=>v.toLowerCase()));
      html+=`<div class="sd-card">`;
      html+=`<div class="sd-card-title">${esc(col.name)}</div>`;
      html+=`<div class="sd-big">${vals.length}</div>`;
      html+=`<div class="sd-sub">gevuld van ${n}</div>`;
      html+=`<div class="dv-stats-row"><span>Uniek</span><span>${uniq.size} (${pct(uniq.size)}%)</span></div>`;
      html+=`<div class="dv-stats-row"><span>Gem. woorden</span><span>${avg(lengths)}</span></div>`;
      html+=`<div class="dv-stats-row"><span>Gem. tekens</span><span>${avg(charLens)}</span></div>`;
      if(empty) html+=`<div class="dv-stats-row"><span>Leeg</span><span>${empty}</span></div>`;
      // Top repeated values
      const freq={};vals.forEach(v=>{const k=v.toLowerCase();freq[k]=(freq[k]||0)+1;});
      const dupes=Object.entries(freq).filter(([,v])=>v>1).sort((a,b)=>b[1]-a[1]).slice(0,5);
      if(dupes.length){
        html+=`<div style="margin-top:6px"><div class="sd-sub" style="margin-bottom:3px;font-weight:600">Meest herhaald</div>`;
        dupes.forEach(([k,v])=>{html+=`<div class="dv-stats-row"><span>${esc(k.length>30?k.slice(0,30)+'...':k)}</span><span>${v}x</span></div>`;});
        html+=`</div>`;
      }
      html+=`</div>`;
    });
    html+=`</div>`;
  }

  // Date columns
  const dateCols=colTypes.filter(c=>c.type==='date');
  if(dateCols.length){
    html+=`<div class="sd-section"><div class="sd-section-title">Datums</div></div>`;
    html+=`<div class="sd-grid">`;
    dateCols.forEach(col=>{
      const vals=rows.map(r=>(r[col.idx]||'').trim()).filter(v=>v);
      const parsed=vals.map(v=>new Date(v)).filter(d=>!isNaN(d)).sort((a,b)=>a-b);
      const empty=n-vals.length;
      html+=`<div class="sd-card">`;
      html+=`<div class="sd-card-title">${esc(col.name)}</div>`;
      html+=`<div class="sd-big">${vals.length}</div>`;
      html+=`<div class="sd-sub">gevuld van ${n}</div>`;
      if(parsed.length>=2){
        const first=parsed[0];
        const last=parsed[parsed.length-1];
        const days=Math.round((last-first)/(1000*60*60*24));
        html+=`<div class="dv-stats-row"><span>Eerste</span><span>${dvFmtDate(first)}</span></div>`;
        html+=`<div class="dv-stats-row"><span>Laatste</span><span>${dvFmtDate(last)}</span></div>`;
        html+=`<div class="dv-stats-row"><span>Bereik</span><span>${days} dagen</span></div>`;
        // Per month/week distribution
        const months={};
        parsed.forEach(d=>{const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');months[k]=(months[k]||0)+1;});
        const mSorted=Object.entries(months).sort((a,b)=>a[0].localeCompare(b[0]));
        if(mSorted.length>1&&mSorted.length<=24){
          const maxM=Math.max(...mSorted.map(([,v])=>v));
          html+=`<div style="margin-top:6px"><div class="sd-sub" style="margin-bottom:3px;font-weight:600">Per maand</div>`;
          mSorted.forEach(([k,v])=>{
            html+=`<div class="dv-freq-row"><div class="dv-freq-label">${k}</div><div class="dv-freq-bar-wrap"><div class="dv-freq-bar" style="width:${Math.round(v/maxM*100)}%"></div></div><div class="dv-freq-val">${v}</div></div>`;
          });
          html+=`</div>`;
        }
        // Day-of-week distribution
        const dow=['Zo','Ma','Di','Wo','Do','Vr','Za'];
        const dowFreq=[0,0,0,0,0,0,0];
        parsed.forEach(d=>{dowFreq[d.getDay()]++;});
        const maxDow=Math.max(...dowFreq);
        if(maxDow>0){
          html+=`<div style="margin-top:6px"><div class="sd-sub" style="margin-bottom:3px;font-weight:600">Per dag</div>`;
          // Start with monday
          [1,2,3,4,5,6,0].forEach(i=>{
            html+=`<div class="dv-freq-row"><div class="dv-freq-label">${dow[i]}</div><div class="dv-freq-bar-wrap"><div class="dv-freq-bar" style="width:${Math.round(dowFreq[i]/maxDow*100)}%"></div></div><div class="dv-freq-val">${dowFreq[i]}</div></div>`;
          });
          html+=`</div>`;
        }
      }
      if(empty) html+=`<div class="dv-stats-row"><span>Leeg</span><span>${empty}</span></div>`;
      html+=`</div>`;
    });
    html+=`</div>`;
  }

  // URL columns
  const urlCols=colTypes.filter(c=>c.type==='url');
  if(urlCols.length){
    html+=`<div class="sd-section"><div class="sd-section-title">URLs</div></div>`;
    html+=`<div class="sd-grid">`;
    urlCols.forEach(col=>{
      const vals=rows.map(r=>(r[col.idx]||'').trim()).filter(v=>v);
      const empty=n-vals.length;
      const uniq=new Set(vals);
      // Domain distribution
      const domains={};
      vals.forEach(v=>{try{const d=new URL(v).hostname.replace(/^www\./,'');domains[d]=(domains[d]||0)+1;}catch(e){}});
      const sorted=Object.entries(domains).sort((a,b)=>b[1]-a[1]);
      const maxD=sorted.length?sorted[0][1]:1;
      html+=`<div class="sd-card">`;
      html+=`<div class="sd-card-title">${esc(col.name)}</div>`;
      html+=`<div class="sd-big">${vals.length}</div>`;
      html+=`<div class="sd-sub">${uniq.size} uniek, ${vals.length-uniq.size} dubbel</div>`;
      if(empty) html+=`<div class="dv-stats-row"><span>Leeg</span><span>${empty}</span></div>`;
      if(sorted.length){
        html+=`<div style="margin-top:6px"><div class="sd-sub" style="margin-bottom:3px;font-weight:600">Domeinen</div>`;
        sorted.slice(0,8).forEach(([k,v])=>{
          html+=`<div class="dv-freq-row"><div class="dv-freq-label">${esc(k)}</div><div class="dv-freq-bar-wrap"><div class="dv-freq-bar" style="width:${Math.round(v/maxD*100)}%"></div></div><div class="dv-freq-val">${v}</div></div>`;
        });
        html+=`</div>`;
      }
      html+=`</div>`;
    });
    html+=`</div>`;
  }

  // Column overview table
  html+=`<div class="sd-section"><div class="sd-section-title">Kolom overzicht</div></div>`;
  html+=`<div style="padding:12px;overflow-x:auto"><table class="sr-table" style="font-size:11px;width:100%"><thead><tr><th>#</th><th>Kolom</th><th>Type</th><th>Gevuld</th><th>Uniek</th><th>Voorbeeld</th></tr></thead><tbody>`;
  colTypes.forEach((col,i)=>{
    const vals=rows.map(r=>(r[col.idx]||'').trim());
    const filled=vals.filter(v=>v).length;
    const uniq=new Set(vals.filter(v=>v));
    const example=vals.find(v=>v)||'';
    const typeClr=col.type==='number'?'var(--ac)':col.type==='category'?'var(--warn)':col.type==='date'?'var(--green)':col.type==='url'?'var(--danger)':'var(--pm)';
    html+=`<tr><td>${i+1}</td><td style="font-weight:600">${esc(col.name)}</td><td style="color:${typeClr}">${col.type}</td><td>${filled}/${n} (${pct(filled)}%)</td><td>${uniq.size}</td><td style="color:var(--pm);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(example.length>50?example.slice(0,50)+'...':example)}</td></tr>`;
  });
  html+=`</tbody></table></div>`;

  return html;
}

function dvMiniHist(vals,name){
  if(vals.length<3) return '';
  const mn=Math.min(...vals),mx=Math.max(...vals);
  if(mn===mx) return '';
  const buckets=8;
  const step=(mx-mn)/buckets;
  const bins=new Array(buckets).fill(0);
  vals.forEach(v=>{const b=Math.min(Math.floor((v-mn)/step),buckets-1);bins[b]++;});
  const maxB=Math.max(...bins);
  let html='<div style="margin-top:6px"><div class="sd-sub" style="margin-bottom:3px;font-weight:600">Verdeling</div><div class="sd-dist">';
  bins.forEach((c,i)=>{
    const lo=dvFmt(mn+i*step);
    html+=`<div class="sd-dist-row"><div class="sd-dist-label" style="width:50px;font-size:9px">${lo}</div><div class="sd-dist-bar"><div class="sd-dist-fill" style="width:${c/maxB*100}%"></div></div><div class="sd-dist-val">${c}</div></div>`;
  });
  html+='</div></div>';
  return html;
}

function dvParseNum(v){
  if(!v||!(v=String(v).trim())) return null;
  v=v.replace(/[%€$£]/g,'').replace(/\s/g,'');
  // Handle Dutch notation: 1.234,56 → 1234.56
  if(/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(v)){v=v.replace(/\./g,'').replace(',','.');}
  else if(v.includes(',')){v=v.replace(',','.');}
  const n=parseFloat(v);
  return isNaN(n)?null:n;
}

function dvFmt(v){
  if(v===null||v===undefined) return '-';
  if(Math.abs(v)>=1e6) return (v/1e6).toFixed(1)+'M';
  if(Math.abs(v)>=1e4) return (v/1e3).toFixed(1)+'K';
  return Number.isInteger(v)?String(v):v.toFixed(1);
}

const DV_MONTHS=['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
function dvFmtDate(d){return d.getDate()+' '+DV_MONTHS[d.getMonth()]+' '+d.getFullYear();}

function dvClear(){
  dvData=null;dvColTypes=null;dvRawText='';
  document.getElementById('dv-paste').value='';
  document.getElementById('dv-file').value='';
  document.getElementById('dv-delim').value='auto';
  document.getElementById('dv-quote').value='"';
  document.getElementById('dv-startrow').value='1';
  document.getElementById('dv-actions').style.display='none';
  dvRenderEmpty();
}

// esc() defined in scraper.js
