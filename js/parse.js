// ── DATA PARSING ──────────────────────────────────────────────────────────

function parseHTML(raw){
  let html=raw;
  if(!/<\s*table[\s>]/i.test(html)) html='<table>'+html+'</table>';
  const doc=new DOMParser().parseFromString(html,'text/html');
  const trs=doc.querySelectorAll('tr');
  if(!trs.length)return null;
  const out=[],colNames=[];
  trs.forEach((tr,i)=>{
    const cells=[...tr.querySelectorAll('th,td')].map(c=>c.textContent.trim());
    if(cells.length<2)return;
    if(i===0&&isNaN(parseFloat(cells[1].replace(/[^\d.-]/g,'')))){
      cells.slice(1).forEach(c=>colNames.push(c));
      return;
    }
    const lbl=cells[0];
    const vals=cells.slice(1).map(v=>{ const n=parseFloat(v.replace(/[^\d.-]/g,'')); return isNaN(n)?0:n; });
    out.push({label:lbl,values:vals});
  });
  return {data:out,colNames};
}

function setColumns(data,colNames){
  S.data=data;
  S.colNames=colNames;
  const numCols=data.length?data[0].values.length:0;
  S.cols=numCols>0?Array.from({length:numCols},(_,i)=>i):[0];
  renderColSel();
}

function renderColSel(){
  const el=document.getElementById('colsel');
  const numCols=S.data.length?S.data[0].values.length:0;
  if(numCols<=1){el.innerHTML='';return;}
  el.innerHTML=S.colNames.map((name,i)=>
    `<div style="display:flex;align-items:center;gap:4px">
      <input type="checkbox" ${S.cols.includes(i)?'checked':''} onchange="toggleCol(${i})" style="margin:0;accent-color:var(--ac)">
      <span style="flex:1;font-size:12px">${name||'Kolom '+(i+1)}</span>
      <button class="btn btn-sm" onclick="moveCol(${i},-1)" style="padding:1px 4px;font-size:10px" title="Omhoog">↑</button>
      <button class="btn btn-sm" onclick="moveCol(${i},1)" style="padding:1px 4px;font-size:10px" title="Omlaag">↓</button>
    </div>`
  ).join('');
}

function moveCol(i,dir){
  const j=i+dir;
  if(j<0||j>=S.colNames.length)return;
  // Swap column names
  [S.colNames[i],S.colNames[j]]=[S.colNames[j],S.colNames[i]];
  // Swap values in all data rows
  S.data.forEach(d=>{[d.values[i],d.values[j]]=[d.values[j],d.values[i]];});
  // Update selected cols
  S.cols=S.cols.map(c=>c===i?j:c===j?i:c);
  renderColSel();
  sched();
}

function toggleCol(i){
  if(S.cols.includes(i)) S.cols=S.cols.filter(c=>c!==i);
  else S.cols.push(i);
  S.cols.sort((a,b)=>a-b);
  if(!S.cols.length)S.cols=[0];
  sched();
}

function parseData(){
  const raw=document.getElementById('di').value.trim();
  const ds=document.getElementById('ds');
  if(!raw){S.data=[];S.colNames=[];S.cols=[0];document.getElementById('colsel').innerHTML='';sched();ds.textContent='';return;}
  if(/<\s*t(able|r|d|h)[\s>]/i.test(raw)){
    const res=parseHTML(raw);
    if(res&&res.data.length){
      setColumns(res.data,res.colNames);
      ds.textContent=`✓ ${res.data.length} rijen (tabel)`;ds.style.color='#4ade80';
      sched();return;
    }
  }
  const rows=raw.split('\n').map(r=>r.trim()).filter(r=>r);
  const out=[],colNames=[];
  rows.forEach((row,i)=>{
    const parts=row.includes('\t')?row.split('\t'):row.split(',');
    if(parts.length<2)return;
    const lbl=parts[0].trim();
    if(i===0&&isNaN(parseFloat(parts[1].replace(',','.')))){
      parts.slice(1).forEach(c=>colNames.push(c.trim()));
      return;
    }
    const vals=parts.slice(1).map(v=>{ const n=parseFloat(v.replace(/[^\d.-]/g,'')); return isNaN(n)?0:n; });
    out.push({label:lbl,values:vals});
  });
  setColumns(out,colNames);
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
