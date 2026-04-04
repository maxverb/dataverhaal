// ── CSV MERGE TAB ──

const dtSources={a:null,b:null}; // {headers:[], rows:[[]]}
let dtResult=null;
let dtMergeMode='append';

// ── PARSING ──

function dtParseSource(id){
  const raw=document.getElementById('dt-paste-'+id).value.trim();
  const status=document.getElementById('dt-status-'+id);
  if(!raw){dtSources[id]=null;status.textContent='';dtCheckMerge();dtRender();return;}
  dtSources[id]=dtParseCSV(raw);
  const d=dtSources[id];
  status.textContent=d?`✓ ${d.rows.length}r × ${d.headers.length}k`:'';
  status.style.color=d?'var(--ok)':'var(--err)';
  dtCheckMerge();
  // Auto-preview single source
  if(dtSources.a&&!dtSources.b){dtResult=dtSources.a;dtRender();}
  else if(dtSources.b&&!dtSources.a){dtResult=dtSources.b;dtRender();}
}

function dtParseFileSource(e,id){
  const f=e.target.files[0];if(!f)return;
  const status=document.getElementById('dt-status-'+id);
  status.textContent='Laden...';status.style.color='var(--ac)';

  if(f.name.match(/\.xlsx?$/i)){
    const sc=document.createElement('script');
    sc.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    sc.onload=()=>{
      const r=new FileReader();
      r.onload=ev=>{
        const wb=XLSX.read(ev.target.result,{type:'binary'});
        const ws=wb.Sheets[wb.SheetNames[0]];
        dtSources[id]=dtParseCSV(XLSX.utils.sheet_to_csv(ws));
        const d=dtSources[id];
        status.textContent=d?`✓ ${d.rows.length}r × ${d.headers.length}k`:'';
        status.style.color='var(--ok)';
        dtCheckMerge();
        if(!dtSources[id==='a'?'b':'a']){dtResult=dtSources[id];dtRender();}
      };
      r.readAsBinaryString(f);
    };
    document.head.appendChild(sc);
  } else {
    const r=new FileReader();
    r.onload=ev=>{
      dtSources[id]=dtParseCSV(ev.target.result);
      const d=dtSources[id];
      status.textContent=d?`✓ ${d.rows.length}r × ${d.headers.length}k`:'';
      status.style.color='var(--ok)';
      dtCheckMerge();
      if(!dtSources[id==='a'?'b':'a']){dtResult=dtSources[id];dtRender();}
    };
    r.readAsText(f);
  }
}

function dtParseCSV(raw){
  const lines=raw.split('\n').map(l=>l.trim()).filter(l=>l);
  if(!lines.length) return null;

  const firstLine=lines[0];
  let delim='\t';
  if(!firstLine.includes('\t')){
    const commas=firstLine.split(',').length;
    const semis=firstLine.split(';').length;
    delim=semis>commas?';':',';
  }

  function parseLine(line){
    const fields=[];
    let field='',inQuote=false;
    for(let i=0;i<line.length;i++){
      const c=line[i];
      if(c==='"'){if(inQuote&&line[i+1]==='"'){field+='"';i++;}else inQuote=!inQuote;}
      else if(c===delim&&!inQuote){fields.push(field.trim());field='';}
      else field+=c;
    }
    fields.push(field.trim());
    return fields;
  }

  const allRows=lines.map(parseLine);
  if(allRows.length<2) return {headers:allRows[0]||[],rows:[]};

  const firstRow=allRows[0];
  const isHeader=firstRow.some(v=>isNaN(parseFloat(v.replace(/[^\d.-]/g,''))));
  if(isHeader) return {headers:firstRow,rows:allRows.slice(1)};
  return {headers:firstRow.map((_,i)=>'Kolom '+(i+1)),rows:allRows};
}

// ── MERGE ──

function dtCheckMerge(){
  const sec=document.getElementById('dt-merge-section');
  if(dtSources.a&&dtSources.b){
    sec.style.display='';
    // Populate join key dropdown with shared columns
    const shared=dtSources.a.headers.filter(h=>dtSources.b.headers.includes(h));
    const sel=document.getElementById('dt-join-key');
    sel.innerHTML=shared.map(h=>`<option value="${esc(h)}">${esc(h)}</option>`).join('');
    if(!shared.length) sel.innerHTML='<option value="">Geen gedeelde kolommen</option>';
  } else {
    sec.style.display='none';
  }
}

function dtSetMerge(mode,btn){
  dtMergeMode=mode;
  document.querySelectorAll('.dt-merge-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  document.getElementById('dt-join-opts').style.display=mode==='join'?'':'none';
}

function dtMerge(){
  const a=dtSources.a, b=dtSources.b;
  if(!a||!b) return;

  if(dtMergeMode==='append'){
    // Append: combine rows, union headers
    const allHeaders=[...a.headers];
    b.headers.forEach(h=>{if(!allHeaders.includes(h))allHeaders.push(h);});

    const rows=[];
    // Rows from A
    a.rows.forEach(r=>{
      const row=allHeaders.map(h=>{const idx=a.headers.indexOf(h);return idx>=0?(r[idx]||''):'';});
      rows.push(row);
    });
    // Rows from B
    b.rows.forEach(r=>{
      const row=allHeaders.map(h=>{const idx=b.headers.indexOf(h);return idx>=0?(r[idx]||''):'';});
      rows.push(row);
    });

    dtResult={headers:allHeaders,rows};
  } else {
    // Left Join on key
    const key=document.getElementById('dt-join-key').value;
    if(!key) return;

    const keyIdxA=a.headers.indexOf(key);
    const keyIdxB=b.headers.indexOf(key);
    if(keyIdxA<0||keyIdxB<0) return;

    // All headers: A headers + B headers (excluding key)
    const bExtra=b.headers.filter(h=>h!==key);
    const allHeaders=[...a.headers,...bExtra];

    // Build lookup from B
    const bMap={};
    b.rows.forEach(r=>{bMap[r[keyIdxB]]=r;});

    const rows=a.rows.map(rA=>{
      const keyVal=rA[keyIdxA];
      const rB=bMap[keyVal];
      const row=[...rA];
      bExtra.forEach(h=>{
        const idx=b.headers.indexOf(h);
        row.push(rB?(rB[idx]||''):'');
      });
      return row;
    });

    dtResult={headers:allHeaders,rows};
  }

  dtRender();
  document.getElementById('dt-export-section').style.display='';
}

// ── RENDER ──

function dtRender(){
  const out=document.getElementById('dt-results');
  const exportSec=document.getElementById('dt-export-section');

  if(!dtResult||!dtResult.rows.length){
    out.innerHTML='<div class="tab-empty"><span class="tab-empty-icon">📊</span><p>Laad twee bronnen en merge ze</p></div>';
    if(!dtSources.a&&!dtSources.b) exportSec.style.display='none';
    return;
  }

  const {headers,rows}=dtResult;
  exportSec.style.display='';

  const maxRows=Math.min(rows.length,100);
  let html=`<div style="padding:6px 8px;font-size:10px;color:var(--pm);border-bottom:1px solid var(--pb)">${rows.length} rijen · ${headers.length} kolommen</div>`;
  html+=`<div style="overflow:auto;padding:0"><table class="dt-table">`;
  html+=`<thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead>`;
  html+=`<tbody>`;
  for(let i=0;i<maxRows;i++){
    html+=`<tr>${headers.map((_,j)=>`<td>${esc(rows[i][j]||'')}</td>`).join('')}</tr>`;
  }
  html+=`</tbody></table>`;
  if(rows.length>100) html+=`<div style="font-size:10px;color:var(--pm);padding:6px 8px">Toont 100 van ${rows.length} rijen</div>`;
  html+=`</div>`;

  out.innerHTML=html;
}

function dtExportCSV(){
  if(!dtResult) return;
  const {headers,rows}=dtResult;
  function csvVal(v){const s=String(v||'').replace(/"/g,'""');return s.includes(',')||s.includes('"')||s.includes('\n')?'"'+s+'"':s;}
  const csv=headers.map(csvVal).join(',')+'\n'+rows.map(r=>r.map(csvVal).join(',')).join('\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='merged_data.csv';a.click();
  URL.revokeObjectURL(url);
}

function dtClear(){
  dtSources.a=null;dtSources.b=null;dtResult=null;
  document.getElementById('dt-paste-a').value='';
  document.getElementById('dt-paste-b').value='';
  document.getElementById('dt-file-a').value='';
  document.getElementById('dt-file-b').value='';
  document.getElementById('dt-status-a').textContent='';
  document.getElementById('dt-status-b').textContent='';
  document.getElementById('dt-merge-section').style.display='none';
  document.getElementById('dt-export-section').style.display='none';
  dtRender();
}

// esc() defined in scraper.js
