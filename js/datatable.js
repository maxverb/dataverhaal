// ── CSV MERGE TAB ──

const dtSources={a:null,b:null}; // {headers:[], rows:[[]]}
let dtResult=null;
let dtMergeMode='append';
let dtSteps=[]; // pipeline steps
let dtStepCounter=0;

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
  if(dtSources.a&&!dtSources.b){dtResult=dtSources.a;dtRender();document.getElementById('dt-pipeline-section').style.display='';document.getElementById('dt-export-section').style.display='';dtRenderSteps();}
  else if(dtSources.b&&!dtSources.a){dtResult=dtSources.b;dtRender();document.getElementById('dt-pipeline-section').style.display='';document.getElementById('dt-export-section').style.display='';dtRenderSteps();}
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
  document.getElementById('dt-pipeline-section').style.display='';
  dtRenderSteps();
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
  dtSources.a=null;dtSources.b=null;dtResult=null;dtSteps=[];dtStepCounter=0;
  document.getElementById('dt-paste-a').value='';
  document.getElementById('dt-paste-b').value='';
  document.getElementById('dt-file-a').value='';
  document.getElementById('dt-file-b').value='';
  document.getElementById('dt-status-a').textContent='';
  document.getElementById('dt-status-b').textContent='';
  document.getElementById('dt-merge-section').style.display='none';
  document.getElementById('dt-pipeline-section').style.display='none';
  document.getElementById('dt-export-section').style.display='none';
  dtRender();
}

// ── PIPELINE ──

function dtGetHeaders(){return dtResult?dtResult.headers:[];}

function dtAddStep(type){
  const id=++dtStepCounter;
  dtSteps.push({id,type,config:{}});
  dtRenderSteps();
  document.getElementById('dt-run-pipeline').disabled=false;
}

function dtRemoveStep(id){
  dtSteps=dtSteps.filter(s=>s.id!==id);
  dtRenderSteps();
  if(!dtSteps.length) document.getElementById('dt-run-pipeline').disabled=true;
}

function dtRenderSteps(){
  const el=document.getElementById('dt-steps-list');
  if(!el) return;
  const headers=dtGetHeaders();
  const colOpts=headers.map(h=>`<option value="${esc(h)}">${esc(h)}</option>`).join('');

  el.innerHTML=dtSteps.map((s,i)=>{
    let controls='';
    if(s.type==='filter'){
      controls=`<div class="dt-step-controls">
        <select onchange="dtSteps[${i}].config.col=this.value">${colOpts}</select>
        <select onchange="dtSteps[${i}].config.op=this.value" style="width:50px">
          <option value="contains">bevat</option>
          <option value="eq">= exact</option>
          <option value="neq">≠</option>
          <option value="gt">></option>
          <option value="lt"><</option>
          <option value="empty">leeg</option>
          <option value="notempty">niet leeg</option>
        </select>
        <input type="text" onchange="dtSteps[${i}].config.val=this.value" placeholder="waarde" style="flex:1">
      </div>`;
    } else if(s.type==='sort'){
      controls=`<div class="dt-step-controls">
        <select onchange="dtSteps[${i}].config.col=this.value">${colOpts}</select>
        <select onchange="dtSteps[${i}].config.dir=this.value" style="width:55px">
          <option value="asc">A→Z</option>
          <option value="desc">Z→A</option>
          <option value="num_asc">0→9</option>
          <option value="num_desc">9→0</option>
        </select>
      </div>`;
    } else if(s.type==='dedup'){
      controls=`<div class="dt-step-controls">
        <select onchange="dtSteps[${i}].config.col=this.value">${colOpts}</select>
      </div>`;
    } else if(s.type==='dropcol'){
      controls=`<div class="dt-step-controls">
        <select onchange="dtSteps[${i}].config.col=this.value">${colOpts}</select>
      </div>`;
    } else if(s.type==='rename'){
      controls=`<div class="dt-step-controls">
        <select onchange="dtSteps[${i}].config.col=this.value">${colOpts}</select>
        <span style="color:var(--pm)">→</span>
        <input type="text" onchange="dtSteps[${i}].config.newName=this.value" placeholder="nieuwe naam" style="flex:1">
      </div>`;
    }

    const typeLabels={filter:'Filter',sort:'Sorteer',dedup:'Dedup',dropcol:'Kolom weg',rename:'Hernoem'};
    return `<div class="dt-step" onclick="dtPreviewStep(${s.id})" title="Klik voor tussenresultaat">
      <div class="dt-step-header">
        <span class="dt-step-type">${typeLabels[s.type]||s.type}</span>
        <span id="dt-step-count-${s.id}" style="font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--pm)"></span>
        <button class="dt-step-remove" onclick="event.stopPropagation();dtRemoveStep(${s.id})">✕</button>
      </div>
      ${controls}
    </div>${i<dtSteps.length-1?'<div class="dt-step-arrow">↓</div>':''}`;
  }).join('');

  // Set defaults
  dtSteps.forEach((s,i)=>{
    if(!s.config.col&&headers.length) s.config.col=headers[0];
    if(s.type==='filter'&&!s.config.op) s.config.op='contains';
    if(s.type==='sort'&&!s.config.dir) s.config.dir='asc';
  });
}

function dtRunPipeline(){
  if(!dtResult) return;

  // Save original for re-running
  const baseData=dtSources.a&&dtSources.b?dtResult:{headers:[...dtResult.headers],rows:dtResult.rows.map(r=>[...r])};
  let data={headers:[...baseData.headers],rows:baseData.rows.map(r=>[...r])};

  // Track snapshots per step
  const snapshots=[{rows:data.rows.length,cols:data.headers.length}];

  for(let si=0;si<dtSteps.length;si++){
    const step=dtSteps[si];
    const rowsBefore=data.rows.length;
    const col=step.config.col;
    const colIdx=data.headers.indexOf(col);
    if(colIdx<0&&step.type!=='rename'){
      step._result={rows:data.rows.length,cols:data.headers.length,delta:0};
      snapshots.push(step._result);
      step._snapshot={headers:[...data.headers],rows:data.rows.map(r=>[...r])};
      continue;
    }

    if(step.type==='filter'){
      const op=step.config.op||'contains';
      const val=(step.config.val||'').toLowerCase();
      data.rows=data.rows.filter(r=>{
        const cell=(r[colIdx]||'').toLowerCase();
        if(op==='contains') return cell.includes(val);
        if(op==='eq') return cell===val;
        if(op==='neq') return cell!==val;
        if(op==='gt') return parseFloat(r[colIdx])>parseFloat(step.config.val);
        if(op==='lt') return parseFloat(r[colIdx])<parseFloat(step.config.val);
        if(op==='empty') return !r[colIdx]||!r[colIdx].trim();
        if(op==='notempty') return r[colIdx]&&r[colIdx].trim();
        return true;
      });
    } else if(step.type==='sort'){
      const dir=step.config.dir||'asc';
      data.rows.sort((a,b)=>{
        const va=a[colIdx]||'',vb=b[colIdx]||'';
        if(dir==='num_asc') return parseFloat(va)-parseFloat(vb);
        if(dir==='num_desc') return parseFloat(vb)-parseFloat(va);
        if(dir==='desc') return vb.localeCompare(va,'nl');
        return va.localeCompare(vb,'nl');
      });
    } else if(step.type==='dedup'){
      const seen=new Set();
      data.rows=data.rows.filter(r=>{
        const key=r[colIdx]||'';
        if(seen.has(key)) return false;
        seen.add(key);return true;
      });
    } else if(step.type==='dropcol'){
      const idx=data.headers.indexOf(col);
      if(idx>=0){
        data.headers.splice(idx,1);
        data.rows=data.rows.map(r=>{r.splice(idx,1);return r;});
      }
    } else if(step.type==='rename'){
      const idx=data.headers.indexOf(col);
      if(idx>=0&&step.config.newName) data.headers[idx]=step.config.newName;
    }

    const delta=data.rows.length-rowsBefore;
    step._result={rows:data.rows.length,cols:data.headers.length,delta};
    step._snapshot={headers:[...data.headers],rows:data.rows.map(r=>[...r])};
    snapshots.push(step._result);
  }

  dtResult=data;
  dtRender();
  dtUpdateStepCounts();
}

function dtUpdateStepCounts(){
  dtSteps.forEach((s,i)=>{
    const el=document.getElementById('dt-step-count-'+s.id);
    if(el&&s._result){
      const d=s._result.delta;
      const deltaStr=d===0?'':'('+( d>0?'+'+d:d)+')';
      el.innerHTML=`${s._result.rows}r × ${s._result.cols}k <span style="color:${d<0?'var(--danger)':d>0?'var(--ok)':'var(--pm)'}">${deltaStr}</span>`;
    }
  });
}

function dtPreviewStep(id){
  const step=dtSteps.find(s=>s.id===id);
  if(!step||!step._snapshot) return;
  // Temporarily show this step's snapshot
  const saved=dtResult;
  dtResult=step._snapshot;
  dtRender();
  dtResult=saved;
}

function dtSendToGrafiek(){
  if(!dtResult) return;
  // Convert to tab-separated text for the grafiek data input
  const {headers,rows}=dtResult;
  const tsv=headers.join('\t')+'\n'+rows.map(r=>r.join('\t')).join('\n');
  document.getElementById('di').value=tsv;
  parseData();
  switchTab('grafiek',document.querySelector('[onclick*="grafiek"]'));
}

// esc() defined in scraper.js
