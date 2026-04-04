// ── DATA TAB — CSV/TSV parser + preview ──

let dtData=null; // {headers:[], rows:[[]]}

function dtSetInput(mode,btn){
  document.querySelectorAll('.dt-src-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  document.getElementById('dt-paste-zone').style.display=mode==='paste'?'':'none';
  document.getElementById('dt-upload-zone').style.display=mode==='upload'?'':'none';
}

function dtParsePaste(){
  const raw=document.getElementById('dt-paste').value.trim();
  if(!raw){dtData=null;dtRender();return;}
  dtData=dtParseCSV(raw);
  dtRender();
}

function dtParseFile(e){
  const f=e.target.files[0];if(!f)return;
  const status=document.getElementById('dt-status');
  status.textContent='Laden...';status.style.color='var(--ac)';

  if(f.name.match(/\.xlsx?$/i)){
    // XLSX — load library dynamically
    const sc=document.createElement('script');
    sc.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    sc.onload=()=>{
      const r=new FileReader();
      r.onload=ev=>{
        const wb=XLSX.read(ev.target.result,{type:'binary'});
        const ws=wb.Sheets[wb.SheetNames[0]];
        const csv=XLSX.utils.sheet_to_csv(ws);
        dtData=dtParseCSV(csv);
        dtRender();
      };
      r.readAsBinaryString(f);
    };
    document.head.appendChild(sc);
  } else {
    // CSV/TSV
    const r=new FileReader();
    r.onload=ev=>{
      dtData=dtParseCSV(ev.target.result);
      dtRender();
    };
    r.readAsText(f);
  }
}

function dtParseCSV(raw){
  const lines=raw.split('\n').map(l=>l.trim()).filter(l=>l);
  if(!lines.length) return null;

  // Detect delimiter
  const firstLine=lines[0];
  let delim='\t';
  if(!firstLine.includes('\t')){
    const commas=firstLine.split(',').length;
    const semis=firstLine.split(';').length;
    delim=semis>commas?';':',';
  }

  // Parse with simple CSV logic (handles quoted fields)
  function parseLine(line){
    const fields=[];
    let field='', inQuote=false;
    for(let i=0;i<line.length;i++){
      const c=line[i];
      if(c==='"'){
        if(inQuote&&line[i+1]==='"'){field+='"';i++;}
        else inQuote=!inQuote;
      } else if(c===delim&&!inQuote){
        fields.push(field.trim());field='';
      } else {
        field+=c;
      }
    }
    fields.push(field.trim());
    return fields;
  }

  const allRows=lines.map(parseLine);
  if(allRows.length<2) return {headers:allRows[0]||[],rows:[]};

  // First row = headers if it contains non-numeric values
  const firstRow=allRows[0];
  const isHeader=firstRow.some(v=>isNaN(parseFloat(v.replace(/[^\d.-]/g,''))));

  if(isHeader){
    return {headers:firstRow,rows:allRows.slice(1)};
  } else {
    const headers=firstRow.map((_,i)=>'Kolom '+(i+1));
    return {headers,rows:allRows};
  }
}

function dtRender(){
  const out=document.getElementById('dt-results');
  const info=document.getElementById('dt-info');
  const infoSec=document.getElementById('dt-info-section');
  const exportSec=document.getElementById('dt-export-section');
  const status=document.getElementById('dt-status');

  if(!dtData||!dtData.rows.length){
    out.innerHTML='<div class="tab-empty"><span class="tab-empty-icon">📊</span><p>Plak of upload data</p></div>';
    infoSec.style.display='none';
    exportSec.style.display='none';
    status.textContent='';
    return;
  }

  const {headers,rows}=dtData;
  status.textContent=`✓ ${rows.length} rijen, ${headers.length} kolommen`;
  status.style.color='var(--ok)';

  // Info
  infoSec.style.display='';
  info.innerHTML=`<b>${rows.length}</b> rijen · <b>${headers.length}</b> kolommen`;

  // Export
  exportSec.style.display='';

  // Table preview (max 50 rows)
  const maxRows=Math.min(rows.length,50);
  let html=`<div style="overflow:auto;padding:8px"><table class="dt-table">`;
  html+=`<thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead>`;
  html+=`<tbody>`;
  for(let i=0;i<maxRows;i++){
    html+=`<tr>${headers.map((_,j)=>`<td>${esc(rows[i][j]||'')}</td>`).join('')}</tr>`;
  }
  html+=`</tbody></table>`;
  if(rows.length>50) html+=`<div style="font-size:10px;color:var(--pm);padding:6px">Toont 50 van ${rows.length} rijen</div>`;
  html+=`</div>`;

  out.innerHTML=html;
}

function dtExportCSV(){
  if(!dtData) return;
  const {headers,rows}=dtData;
  function csvVal(v){const s=String(v||'').replace(/"/g,'""');return s.includes(',')||s.includes('"')||s.includes('\n')?'"'+s+'"':s;}
  const csv=headers.map(csvVal).join(',')+'\n'+rows.map(r=>r.map(csvVal).join(',')).join('\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='data_export.csv';a.click();
  URL.revokeObjectURL(url);
}

function dtClear(){
  dtData=null;
  document.getElementById('dt-paste').value='';
  document.getElementById('dt-file').value='';
  dtRender();
}

// esc() defined in scraper.js
